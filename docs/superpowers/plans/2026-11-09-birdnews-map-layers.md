# 鸟讯地图普通/卫星底图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 birdnews 生成源里让鸟讯地图用高德官方控件切换普通/卫星，并让 Leaflet 回退只使用已复验的高德瓦片，选择记在 `birdnews-basemap`。

**Architecture:** 纯策略放在 `web/basemap.js`（Node 可测）。`web/news.js` 只负责接到现有高德 JS 与 Leaflet 适配层。`build_news.py` 把 `basemap.js` 拷进页面并排在 `news.js` 之前。不把整条流水线放进图鉴仓库；图鉴 PR 只同步已生成的地图资源。

**Tech Stack:** 现有高德 JS API 2.0、Leaflet 1.9.4、Node 22 内置 `node:test`、Python 3 读文件断言。不新增依赖，不新增密钥。

## Global Constraints

- 官方路径只用 `AMap.MapType`；卫星由该控件的 `defaultType: 1` 与 `showRoad: true` 使用官方 Satellite 与 RoadNet。不手工再 `setLayers` 叠一套。
- `showTraffic: false`，地图保持 `viewMode:'2D'`。
- 不接天地图、OSM、Esri、百度、Google、Mapbox、Carto。不加地图 SDK，不加密钥。
- 存储键 `birdnews-basemap`，只认 `normal` 与 `satellite`。默认 `normal`。读写失败不抛到页面。
- Leaflet 普通瓦片保持 `webrd0{s}…style=8`。卫星影像是 `webst0{s}…style=6`。注记是 `webst0{s}…style=8`。禁止把 `webrd … style=8` 叠到影像上。
- 2026-11-09 复验：南汇东滩（30.951599, 121.966192）z=13 与 z=16 的 `webst style=8` 转为 RGBA 后全透明，合成图仍是滩涂影像；崇明东滩（31.500212, 121.946738）z=16 约 93.5% 全透明，农田影像仍可见。因此保留注记层。
- 卫星失败只有两类：创建/切换卫星图层抛错；回退影像请求全部结束且成功数为 0。单块失败、注记失败、瓦片尚未返回都不切换。失败后画面和控件为普通；存储可写则写成 `normal`。
- 高德地图已显示时，卫星失败留在高德并回到普通。`MapType` 本身创建失败才进入 Leaflet。
- 鸟点、筛选、◆ 点位、导航、`glat`/`glng`、GCJ-02 不改。不隐藏高德 logo / copyright，不改现有 `.amap-logo{opacity:.7}`。
- 主路径不造第二套按钮。回退开关只出现在 Leaflet 地图内，右上，类名 `basemap-switch`。
- 源文件目标是父机 `/workspace/birdnews/`。本计划不假设能运行完整 `build_news.py`：附件里没有 `birdnews.py`、`vendor/leaflet.*`、`out/digest_*.json`。

---

### Task 1: 可测的底图策略

**Files:**
- Create: `/workspace/birdnews/web/basemap.js`
- Test: `/workspace/birdnews/tests/test_basemap.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `BirdBasemap.KEY === 'birdnews-basemap'`
  - `read(storage) -> 'normal' | 'satellite'`
  - `write(storage, mode) -> boolean`
  - `leafletSpec(mode) -> [{role, url, options}]`
  - `amapOptions(mode) -> {defaultType, showRoad, showTraffic, position}`
  - `modeFromLayers(layers) -> 'normal' | 'satellite'`
  - `attachLeaflet(L, map, storage, onChange) -> {getMode(), layers(), select(mode) -> {mode, wrote}}`
  - `installAmap(A, map, storage) -> {control, mode}`，普通控件也失败时抛出原异常
  - `browserStorage() -> Storage | null`

- [x] **Step 1: Write the failing test**

把下面文件写成 `/workspace/birdnews/tests/test_basemap.js`。

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require(path.join(__dirname, '..', 'web', 'basemap.js'));
const B = globalThis.BirdBasemap;

function mem(init) {
  const data = Object.assign({}, init);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); }
  };
}
function denyRead() { return { getItem() { throw new Error('denied'); }, setItem() {} }; }
function denyWrite(init) {
  const data = Object.assign({}, init);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem() { throw new Error('denied'); }
  };
}
function fakeMap() {
  return {
    _layers: [],
    addControl() {},
    removeLayer(layer) { this._layers = this._layers.filter((item) => item !== layer); }
  };
}
function fakeL() {
  return {
    tileLayer(url, options) {
      const handlers = {};
      const layer = {
        url, options, handlers,
        on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); return layer; },
        addTo(map) { map._layers.push(layer); return layer; },
        remove() {},
        emit(name) { (handlers[name] || []).forEach((fn) => fn()); }
      };
      return layer;
    }
  };
}

test('default and invalid storage read as normal', () => {
  assert.equal(B.KEY, 'birdnews-basemap');
  assert.equal(B.read(mem()), 'normal');
  assert.equal(B.read(mem({ 'birdnews-basemap': '' })), 'normal');
  assert.equal(B.read(mem({ 'birdnews-basemap': 'terrain' })), 'normal');
  assert.equal(B.read(denyRead()), 'normal');
  assert.equal(B.read(null), 'normal');
});

test('write accepts only the two modes and swallows storage errors', () => {
  const store = mem();
  assert.equal(B.write(store, 'satellite'), true);
  assert.equal(store.getItem(B.KEY), 'satellite');
  assert.equal(B.write(store, 'road'), false);
  assert.equal(store.getItem(B.KEY), 'satellite');
  assert.equal(B.write(denyWrite(), 'normal'), false);
  assert.equal(B.write(null, 'normal'), false);
});

test('leaflet satellite uses gaode imagery plus label and never the solid road tiles', () => {
  const sat = B.leafletSpec('satellite');
  const urls = sat.map((item) => item.url).join('\n');
  assert.equal(sat[0].role, 'imagery');
  assert.match(sat[0].url, /^https:\/\/webst0\{s\}\.is\.autonavi\.com\/appmaptile\?style=6&x=\{x\}&y=\{y\}&z=\{z\}$/);
  assert.equal(sat[1].role, 'label');
  assert.match(sat[1].url, /^https:\/\/webst0\{s\}\.is\.autonavi\.com\/appmaptile\?style=8&x=\{x\}&y=\{y\}&z=\{z\}$/);
  assert.equal(sat[0].options.attribution, '© 高德地图');
  assert.equal(sat[1].options.attribution, '');
  assert.equal(sat[0].options.subdomains, '1234');
  assert.equal(sat[0].options.maxZoom, 18);
  assert.doesNotMatch(urls, /webrd|openstreetmap|tianditu|esri|mapbox|googleapis|carto/i);
  const normal = B.leafletSpec('normal');
  assert.equal(normal.length, 1);
  assert.match(normal[0].url, /^https:\/\/webrd0\{s\}\.is\.autonavi\.com\/appmaptile\?lang=zh_cn&size=1&scale=1&style=8&x=\{x\}&y=\{y\}&z=\{z\}$/);
});

test('amap options use the native control and keep roads on', () => {
  assert.deepEqual(B.amapOptions('normal'), {
    defaultType: 0, showRoad: true, showTraffic: false, position: { top: '8px', right: '48px' }
  });
  assert.equal(B.amapOptions('satellite').defaultType, 1);
  assert.equal(B.amapOptions('satellite').showRoad, true);
});

test('leaflet select persists satellite and a total imagery failure returns to normal', () => {
  const store = mem();
  const map = fakeMap();
  let shown = '';
  const ctl = B.attachLeaflet(fakeL(), map, store, (mode) => { shown = mode; });
  assert.equal(ctl.getMode(), 'normal');
  assert.match(ctl.layers()[0].url, /webrd0/);
  const selected = ctl.select('satellite');
  assert.equal(selected.mode, 'satellite');
  assert.equal(selected.wrote, true);
  assert.equal(store.getItem(B.KEY), 'satellite');
  assert.equal(shown, 'satellite');
  const imagery = ctl.layers().find((layer) => layer.__role === 'imagery');
  imagery.emit('tileloadstart');
  imagery.emit('tileload');
  imagery.emit('tileloadstart');
  imagery.emit('tileerror');
  assert.equal(ctl.getMode(), 'satellite');
  const again = B.attachLeaflet(fakeL(), fakeMap(), store, (mode) => { shown = mode; });
  const broken = again.layers().find((layer) => layer.__role === 'imagery');
  broken.emit('tileloadstart');
  broken.emit('tileerror');
  broken.emit('tileloadstart');
  broken.emit('tileerror');
  assert.equal(again.getMode(), 'normal');
  assert.equal(store.getItem(B.KEY), 'normal');
  assert.equal(shown, 'normal');
  assert.match(again.layers()[0].url, /webrd0/);
  assert.equal(again.layers().some((layer) => /webst/.test(layer.url)), false);
});

test('in-flight imagery and label errors do not leave satellite', () => {
  const store = mem({ 'birdnews-basemap': 'satellite' });
  const ctl = B.attachLeaflet(fakeL(), fakeMap(), store, () => {});
  const imagery = ctl.layers().find((layer) => layer.__role === 'imagery');
  imagery.emit('tileloadstart');
  assert.equal(ctl.getMode(), 'satellite');
  const label = ctl.layers().find((layer) => layer.__role === 'label');
  label.emit('tileerror');
  assert.equal(ctl.getMode(), 'satellite');
  assert.equal(store.getItem(B.KEY), 'satellite');
});

test('storage write failure keeps the satellite layers', () => {
  const store = denyWrite();
  const ctl = B.attachLeaflet(fakeL(), fakeMap(), store, () => {});
  const result = ctl.select('satellite');
  assert.equal(result.mode, 'satellite');
  assert.equal(result.wrote, false);
  assert.match(ctl.layers().map((layer) => layer.url).join('\n'), /style=6/);
});

test('amap satellite constructor failure stays on amap normal', () => {
  function MapType(options) {
    if (options.defaultType === 1) throw new Error('satellite failed');
    this.options = options;
  }
  const store = mem({ 'birdnews-basemap': 'satellite' });
  const controls = [];
  const map = { addControl(control) { controls.push(control); }, setLayers() { throw new Error('duplicate layers'); } };
  const installed = B.installAmap({ MapType }, map, store);
  assert.equal(installed.mode, 'normal');
  assert.equal(installed.control.options.defaultType, 0);
  assert.equal(store.getItem(B.KEY), 'normal');
  assert.equal(controls.length, 1);
});

test('amap control failure when normal also throws', () => {
  const store = mem();
  assert.throws(() => B.installAmap({
    MapType() { throw new Error('no control'); }
  }, { addControl() {} }, store));
});

test('modeFromLayers reads the official satellite class only', () => {
  assert.equal(B.modeFromLayers([{ CLASS_NAME: 'AMap.TileLayer' }]), 'normal');
  assert.equal(B.modeFromLayers([{ CLASS_NAME: 'AMap.TileLayer.Satellite' }]), 'satellite');
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test /workspace/birdnews/tests/test_basemap.js`

Expected: FAIL because `web/basemap.js` does not exist.

- [x] **Step 3: Write minimal implementation**

创建 `/workspace/birdnews/web/basemap.js`，内容就是本任务接口的实现：`read`/`write` 捕获异常；`leafletSpec('satellite')` 只含上面的两条 `webst` URL；`attachLeaflet` 只给 `role==='imagery'` 计数，`pending===0 && ok+bad>0 && ok===0` 时才 `show('normal')` 并 `write(storage,'normal')`；`tileloadstart` 尚未配对时不失败；`installAmap` 只 `new A.MapType` 后 `map.addControl`，卫星构造失败时写 `normal` 再装普通控件，普通构造失败则把异常抛出。文件末尾把 API 挂到 `globalThis.BirdBasemap`。

- [x] **Step 4: Run test to verify it passes**

Run: `node --test /workspace/birdnews/tests/test_basemap.js`

Expected: PASS，9 tests.

- [x] **Step 5: Commit**

birdnews 不是图鉴 git 仓库。不要把 `build_news.py` 或 `web/` 提交进 `bird-atlas`。此任务的交付留在父机源目录，最后打成只含变更文件的 tar。

### Task 2: 接到现有双引擎

**Files:**
- Modify: `/workspace/birdnews/web/news.js`
- Modify: `/workspace/birdnews/web/news.css`
- Modify: `/workspace/birdnews/build_news.py`
- Test: `/workspace/birdnews/tests/test_basemap_template.py`

**Interfaces:**
- Consumes: Task 1 的 `BirdBasemap.attachLeaflet`、`installAmap`、`modeFromLayers`、`browserStorage`、`write`
- Produces: 页面脚本顺序 `basemap.js` 然后 `news.js`；Leaflet 根节点内的 `.basemap-switch`；高德路径没有这个开关

- [x] **Step 1: Write the failing test**

写成 `/workspace/birdnews/tests/test_basemap_template.py`，用标准库读取源文件，不 `import build_news`。

```python
import pathlib, sys
root = pathlib.Path(__file__).resolve().parents[1]
js = (root / 'web' / 'news.js').read_text()
css = (root / 'web' / 'news.css').read_text()
build = (root / 'build_news.py').read_text()
fails = []
def check(ok, msg):
    if not ok: fails.append(msg)
check("plugins:['AMap.Scale','AMap.ToolBar','AMap.Geocoder','AMap.MapType']" in js, 'plugins missing MapType')
check('BirdBasemap.installAmap' in js, 'amap path does not install native control')
check('BirdBasemap.attachLeaflet' in js, 'leaflet path does not use basemap')
check('basemap-switch' in js and 'basemap-switch' in css, 'fallback switch missing')
check('setLayers' not in js, 'manual setLayers would duplicate official layers')
check("coordinate=gaode" in js and 'glat' in js, 'navigation or coordinates changed')
check('.amap-logo{opacity:.7}' in css, 'logo rule changed')
check('amap-logo' not in css.replace('.amap-logo{opacity:.7}', ''), 'extra logo hiding rule')
check('#map .basemap-switch{position:absolute;z-index:800;top:8px;right:8px;' in css, 'switch position')
check('<script src="assets/basemap.js"></script><script src="assets/news.js"></script>' in build, 'script order')
check("'news/assets/basemap.js'" in build, 'asset copy missing')
check("'news/assets/basemap.js'" in build[build.find('for k in'):], 'cache hash missing')
for banned in ('openstreetmap', 'tianditu', 'esri', 'mapbox', 'googleapis', 'carto'):
    check(banned not in js.lower() and banned not in build.lower(), banned)
if fails:
    print('\n'.join(fails)); sys.exit(1)
print('template ok')
```

- [x] **Step 2: Run test to verify it fails**

Run: `python3 /workspace/birdnews/tests/test_basemap_template.py`

Expected: FAIL，列出缺少的 `AMap.MapType`、脚本顺序和开关。

- [x] **Step 3: Write minimal implementation**

`build_news.py` 的结束脚本改为：

```python
H.append('<script src="assets/basemap.js"></script><script src="assets/news.js"></script><script src="../assets/fold.js" data-page="news"></script></body></html>')
```

资源字典增加 `'news/assets/basemap.js': open(os.path.join(BASE, 'web', 'basemap.js')).read(),`。版本循环改为包含 `'news/assets/basemap.js'`。

`news.js` 的 `AMapLoader.load` plugins 加上 `'AMap.MapType'`。`amapAdapter` 在 Scale 与 ToolBar 之后调用：

```javascript
var installed=BirdBasemap.installAmap(A,map,BirdBasemap.browserStorage());
el.dataset.basemap=installed.mode;
el.addEventListener('click',function(ev){
  var hit=ev.target&&ev.target.closest&&ev.target.closest('.amap-maptype');
  if(!hit)return;
  setTimeout(function(){
    try{
      var mode=BirdBasemap.modeFromLayers(map.getLayers?map.getLayers():[]);
      el.dataset.basemap=mode;
      BirdBasemap.write(BirdBasemap.browserStorage(),mode);
    }catch(e){}
  },0);
});
```

不调用 `setLayers`，不 `new A.TileLayer.Satellite`。`leafletAdapter` 删掉原来的单条 `L.tileLayer`，改为 `BirdBasemap.attachLeaflet`，并把 `.basemap-switch` 插进地图根节点。按钮文字为「普通」「卫星」，点击调用 `select`。高德适配层不创建这个开关。

`news.css` 末尾只加：

```css
#map .basemap-switch{position:absolute;z-index:800;top:8px;right:8px;display:flex}
#map .basemap-switch button{font:13px/1.2 Georgia,"Noto Serif SC",serif;padding:5px 8px;min-height:28px;border:1px solid #cbb994;background:#fbf8f0;color:#3b2f22}
#map .basemap-switch button+button{border-left:0}
#map .basemap-switch button.on{background:#5b4630;color:#fff}
```

保留原 `.amap-logo{opacity:.7}`。

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
node --test /workspace/birdnews/tests/test_basemap.js
python3 /workspace/birdnews/tests/test_basemap_template.py
```

Expected: 节点测试 PASS；`template ok`。

- [x] **Step 5: Commit**

同 Task 1：源文件不进入图鉴 git。图鉴仓库另行同步生成后的 `news/assets/basemap.js`、`news/assets/news.js`、`news/assets/news.css`，以及 `news/index.html` 里对应的脚本和 `?v=` 哈希。`news.js` 的页面副本要保留现有 `data/news.json?v=4f8c306635`。不要重写 `news.json` 或卡片 HTML。

## 规格对照

- 官方 `MapType`、`showRoad`、锚点在工具条左侧、不重复叠层：Task 1 `amapOptions`/`installAmap`，Task 2 `news.js`。
- Leaflet 高德瓦片、注记复验通过后的 `webst style=8`、禁止 `webrd` 覆盖影像：Task 1 `leafletSpec`。
- 默认普通、非法值、存储拒绝、成功切换才写、失败写回普通且控件跟着变：Task 1 的 read/write/attach/install 测试。
- 单块瓦片、注记失败、请求未返回不切换：Task 1 imagery 计数测试。
- 手机开关不挡现有控件：Leaflet 开关在右上。高德官方列表面板向左展开，锚点用 `right: 48px; top: 8px`，避开右上工具条并留在地图内。浏览器再看 390px。
- 署名与 logo：attribution 只在底图一层；CSS 不新增 logo 隐藏。
- 鸟点、导航、GCJ-02：Task 2 断言 `coordinate=gaode` 与 `glat` 仍在，且本计划不改 `build_news.py` 的 `gcj()`。
- 下次生成不丢：`build_news.py` 复制 `web/basemap.js` 和 `web/news.js`。完整 `main()` 需要未附带的 `birdnews.py`、`vendor/leaflet.css`、`vendor/leaflet.js`、`out/digest_*.json`，这里不猜这些文件。

## 自审

无 TBD/TODO。Task 2 使用的函数名与 Task 1 的 `BirdBasemap` 导出一致。`select` 固定返回 `{mode, wrote}`。`installAmap` 成功时返回 `{control, mode}`，只有普通控件仍失败才抛异常。
