(function (root) {
  var KEY = 'birdnews-basemap';
  var ROAD = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
  var SATELLITE = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';
  var LABEL = 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}';
  function opts(attribution, zIndex) {
    return { subdomains: '1234', maxZoom: 18, attribution: attribution, zIndex: zIndex };
  }
  function read(storage) {
    if (!storage) return 'normal';
    try {
      var value = storage.getItem(KEY);
      return value === 'satellite' || value === 'normal' ? value : 'normal';
    } catch (e) { return 'normal'; }
  }
  function write(storage, mode) {
    if (mode !== 'satellite' && mode !== 'normal') return false;
    if (!storage) return false;
    try { storage.setItem(KEY, mode); return true; }
    catch (e) { return false; }
  }
  function leafletSpec(mode) {
    if (mode === 'satellite') {
      return [
        { role: 'imagery', url: SATELLITE, options: opts('© 高德地图', 1) },
        { role: 'label', url: LABEL, options: opts('', 2) }
      ];
    }
    return [{ role: 'base', url: ROAD, options: opts('© 高德地图', 1) }];
  }
  function amapOptions(mode) {
    return {
      defaultType: mode === 'satellite' ? 1 : 0,
      showRoad: true,
      showTraffic: false,
      position: { top: '8px', right: '48px' }
    };
  }
  function modeFromControl(rootEl) {
  if (!rootEl || !rootEl.querySelector) return null;
  try {
    var satellite = rootEl.querySelector('input[data-id="AMap.TileLayer.Satellite"]');
    if (satellite && satellite.checked) return 'satellite';
    var base = rootEl.querySelector('input[data-id="AMap.TileLayer"]');
    if (base && base.checked) return 'normal';
  } catch (e) { return null; }
  return null;
}
function modeFromLayers(layers) {
    var satellite = false;
    (layers || []).forEach(function (layer) {
      var name = '';
      try { name = layer && (layer.CLASS_NAME || '') || ''; }
      catch (e) { name = ''; }
      if (String(name).indexOf('Satellite') >= 0) satellite = true;
    });
    return satellite ? 'satellite' : 'normal';
  }
  function attachLeaflet(L, map, storage, onChange) {
    var mode = read(storage);
    var current = [];
    function clear() {
      current.forEach(function (layer) {
        if (map.removeLayer) map.removeLayer(layer);
        if (layer.remove) layer.remove();
      });
      current = [];
    }
    function watch(layer) {
      var pending = 0, ok = 0, bad = 0, decided = false;
      function consider() {
        if (decided || pending !== 0 || ok + bad === 0 || ok !== 0) return;
        decided = true;
        show('normal');
        write(storage, 'normal');
        if (onChange) onChange('normal');
      }
      layer.on('tileloadstart', function () { pending++; });
      layer.on('tileload', function () { pending = Math.max(0, pending - 1); ok++; consider(); });
      layer.on('tileerror', function () { pending = Math.max(0, pending - 1); bad++; consider(); });
    }
    function show(next) {
      clear();
      leafletSpec(next).forEach(function (spec) {
        var layer = L.tileLayer(spec.url, spec.options);
        layer.__role = spec.role;
        layer.addTo(map);
        if (spec.role === 'imagery') watch(layer);
        current.push(layer);
      });
      mode = next;
    }
    show(mode);
    return {
      getMode: function () { return mode; },
      layers: function () { return current.slice(); },
      select: function (next) {
        if (next !== 'normal' && next !== 'satellite') return { mode: mode, wrote: false };
        show(next);
        var wrote = write(storage, mode);
        if (onChange) onChange(mode);
        return { mode: mode, wrote: wrote };
      }
    };
  }
  function installAmap(A, map, storage) {
    var mode = read(storage);
    function mount(next) {
      var control = new A.MapType(amapOptions(next));
      map.addControl(control);
      return control;
    }
    try {
      return { control: mount(mode), mode: mode };
    } catch (e) {
      if (mode !== 'satellite') throw e;
      write(storage, 'normal');
      return { control: mount('normal'), mode: 'normal' };
    }
  }
  function browserStorage() {
    try {
      var storage = root.localStorage;
      if (!storage || typeof storage.getItem !== 'function') return null;
      return storage;
    } catch (e) { return null; }
  }
  root.BirdBasemap = {
    KEY: KEY, read: read, write: write, leafletSpec: leafletSpec, amapOptions: amapOptions,
    modeFromLayers: modeFromLayers, modeFromControl: modeFromControl, attachLeaflet: attachLeaflet, installAmap: installAmap,
    browserStorage: browserStorage
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
