(function(){
  var cards=[].slice.call(document.querySelectorAll('.nc')), byId={}, markers={}, map=null;
  cards.forEach(function(c){byId[c.id]=c;});
  var F={prov:'',type:'',prec:'',onlyNew:false};
  function ok(el){
    return (!F.type||el.dataset.type===F.type)&&(!F.prec||el.dataset.prec===F.prec)&&(!F.onlyNew||el.dataset.new==='1');
  }
  function apply(){
    var n=0;
    cards.forEach(function(c){
      var any=false;
      c.querySelectorAll('.row,.nac').forEach(function(x){var v=ok(x);x.hidden=!v;if(v)any=true;});
      if(!any)c.querySelectorAll('.allc').forEach(function(x){if(ok(x))any=true;});   // 全部鸟种列表只计数，不隐藏
      var na=c.querySelector('details.na');
      if(na){var vis=na.querySelector('.nac:not([hidden])');na.hidden=!vis;if(F.type==='na'&&vis)na.open=true;}
      var v=(!F.prov||c.dataset.prov===F.prov)&&any;
      c.hidden=!v;if(v)n++;
      showMarkers(c.id,v);
    });
    document.querySelectorAll('section.prov').forEach(function(s){
      var any=s.querySelector('.nc:not([hidden])');s.hidden=!!F.prov&&s.dataset.prov!==F.prov;
      var em=s.querySelector('.empty');if(em)em.hidden=!!any;
      var rh=s.querySelector('.rech'), rc=s.querySelector('.recards');
      if(rh&&rc){rh.hidden=!rc.querySelector('.nc:not([hidden])');}});
    var sh=document.getElementById('shown');if(sh)sh.textContent=n;
    if(refit)fit();
  }
  var refit=false;
  document.querySelectorAll('.filter [data-f]').forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.dataset.f;F[f]=b.dataset.v;
      document.querySelectorAll('.filter [data-f="'+f+'"]').forEach(function(x){x.classList.toggle('on',x===b);});
      refit=true;apply();refit=false;});
  });
  var nw=document.getElementById('onlyNew');if(nw)nw.addEventListener('change',function(){F.onlyNew=nw.checked;refit=true;apply();refit=false;});
  function hl(id,scroll){
    cards.forEach(function(c){c.classList.remove('hl');});
    var c=byId[id];if(!c)return;c.classList.add('hl');if(window.Fold)window.Fold.reveal(c);
    var ps=c.closest('details.pendsec');if(ps)ps.open=true;var d=c.querySelector(':scope > details');if(d)d.open=true;
    if(scroll)c.scrollIntoView({behavior:'smooth',block:'center'});
  }
  var pend={}, MAP=null;   // MAP：地图适配层（高德 JS API v2 优先，失败回退 Leaflet + 高德瓦片）
  function visiblePts(){var rec=[],all=[];
    Object.keys(markers).forEach(function(id){var c=byId[id];if(c&&c.hidden)return;
      markers[id].forEach(function(m){all.push(m);if(!pend[id])rec.push(m);});});
    return rec.length?rec:all;}
  function fit(){   // 默认/筛选后：缩放到可见的「推荐」地点（实心点 + 其◆帖子点位）；没有推荐点时退回到全部可见点
    if(!MAP)return;MAP.fit(visiblePts(),window.innerWidth<700?28:40,13);
  }
  var COLORS={rare:'#b8692a',g1:'#a8382f',g2:'#ec7a1c',hawk:'#4f6f8a',social:'#c2185b',other:'#4f7a3a',hot:'#8a6d47'};
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function nav(lat,lng,name){return 'https://uri.amap.com/marker?position='+lng+','+lat+'&name='+encodeURIComponent(name)+'&src=bird-atlas&coordinate=gaode&callnative=1';}
  function popHtml(p,s){
    var lat=s?s.glat:p.glat,lng=s?s.glng:p.glng,nm=s?p.name+' · '+s.name:p.name;
    return '<div class="mpop"><b>'+esc(nm)+'</b>'+(p.top&&p.top.length?'<br><span>'+esc(p.top.join('、'))+'</span>':'')+
      '<br><a href="'+nav(lat,lng,nm)+'" target="_blank" rel="noopener">📍 导航到这里</a> · <a href="#'+p.id+'" data-card="'+p.id+'">看卡片 ↓</a></div>';}
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-card]');if(!a)return;e.preventDefault();hl(a.dataset.card,true);});
  function setStatus(mode,err){var el=document.getElementById('map');if(el){el.dataset.engine=mode;if(err)el.dataset.err=err;}
    window.__mapStatus={engine:mode,error:err||null};}
  // ---- 高德 JS API v2 ----
  function amapAdapter(A,el){
    var map=new A.Map(el,{zoom:7,center:[120.8,31.2],resizeEnable:true,viewMode:'2D'});
    map.addControl(new A.Scale());map.addControl(new A.ToolBar({position:{right:'10px',top:'10px'}}));
    var iw=new A.InfoWindow({offset:new A.Pixel(0,-10),closeWhenClickMap:true});
    return {map:map,ready:function(cb){map.on('complete',cb);},
      circle:function(p,hollow){var m=new A.CircleMarker({center:[p.glng,p.glat],radius:hollow?5:(p.is_new?9:7),
          strokeColor:hollow?(COLORS[p.type]||'#7a4b1d'):'#fff',strokeWeight:2,fillColor:hollow?'#fff':(COLORS[p.type]||'#7a4b1d'),
          fillOpacity:hollow?.85:.92,zIndex:hollow?11:12,cursor:'pointer',bubble:false});
        m._ll=[p.glng,p.glat];m.setMap(map);return m;},
      spot:function(s){var m=new A.Marker({position:[s.glng,s.glat],content:'<div class="spotmk amk">◆</div>',offset:new A.Pixel(-7,-7),anchor:'top-left',zIndex:13});
        m._ll=[s.glng,s.glat];m.setMap(map);return m;},
      bind:function(m,html,title,onclick){m.on('click',function(){iw.setContent(html);iw.open(map,m._ll);onclick();});
        if(m.setTitle)m.setTitle(title);m.on('mouseover',function(){if(!iw.getIsOpen()){iw.setContent(html);iw.open(map,m._ll);}});},
      show:function(m,v){if(v)m.show();else m.hide();},
      fit:function(ms,pad,maxZ){if(!ms.length){map.setZoomAndCenter(7,[120.8,31.2]);return;}
        map.setFitView(ms,true,[pad,pad,pad,pad],maxZ);},
      focus:function(m){map.setZoomAndCenter(Math.max(map.getZoom(),13),m._ll);m.emit('click',{target:m});},
      resize:function(){if(map.resize)map.resize();}};
  }
  // ---- 回退：Leaflet + 高德瓦片 ----
  function leafletAdapter(el){
    var map=L.map(el,{zoomControl:true,attributionControl:true,zoomSnap:0.25,zoomDelta:0.5});map.attributionControl.setPrefix(false);
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      {subdomains:'1234',maxZoom:18,attribution:'© 高德地图'}).addTo(map);
    return {map:map,
      circle:function(p,hollow){return (hollow?L.circleMarker([p.glat,p.glng],{radius:5,color:COLORS[p.type]||'#7a4b1d',weight:2,fillColor:'#fff',fillOpacity:.85})
          :L.circleMarker([p.glat,p.glng],{radius:p.is_new?9:7,color:'#fff',weight:2,fillColor:COLORS[p.type]||'#7a4b1d',fillOpacity:.92})).addTo(map);},
      spot:function(s){return L.marker([s.glat,s.glng],{icon:L.divIcon({className:'spotmk',html:'◆',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map);},
      bind:function(m,html,title,onclick){m.bindTooltip(title,{direction:'top'});m.bindPopup(html);m.on('click',onclick);},
      show:function(m,v){if(v)m.addTo(map);else m.remove();},
      fit:function(ms,pad,maxZ){if(!ms.length){map.setView([31.2,120.8],7);return;}
        map.fitBounds(L.latLngBounds(ms.map(function(m){return m.getLatLng();})),{padding:[pad,pad],maxZoom:maxZ});},
      focus:function(m){map.setView(m.getLatLng(),Math.max(map.getZoom(),13));m.openPopup();},
      resize:function(){map.invalidateSize();}};
  }
  function build(data,ad){
    MAP=ad;map=ad.map;
    data.places.forEach(function(p){
      if(p.glat==null)return;
      var ms=[],m=ad.circle(p,!!p.pending);
      ad.bind(m,popHtml(p),p.name+' · '+(p.top||[]).join('、'),function(){hl(p.id,false);});ms.push(m);
      var seen={};
      (p.spots||[]).forEach(function(s){
        var k=s.glat+','+s.glng;if(seen[k]||s.glat==null)return;seen[k]=1;
        if(Math.abs(s.glat-p.glat)<1e-5&&Math.abs(s.glng-p.glng)<1e-5)return;
        var d=ad.spot(s);ad.bind(d,popHtml(p,s),p.name+' · '+s.name,function(){hl(p.id,false);});ms.push(d);
      });
      markers[p.id]=ms;pend[p.id]=!!p.pending;
    });
    fit();
    cards.forEach(function(c){c.addEventListener('click',function(e){
      if(e.target.closest('a,summary,details:not(:scope > details)'))return;var m=markers[c.id];
      if(m){hl(c.id,false);ad.focus(m[0]);document.getElementById('map').scrollIntoView({behavior:'smooth',block:'center'});}});});
    var el=document.getElementById('map'),t=null;
    var rs=function(){clearTimeout(t);t=setTimeout(function(){ad.resize();},150);};
    if(window.ResizeObserver)new ResizeObserver(rs).observe(el);else window.addEventListener('resize',rs);
    window.addEventListener('orientationchange',rs);
    apply();
  }
  function showMarkers(id,v){var m=markers[id];if(m&&MAP)m.forEach(function(x){MAP.show(x,v);});}
  function fallback(data,err){
    var el=document.getElementById('map');if(MAP)return;
    if(el&&el.__amap){try{el.__amap.destroy();}catch(e){}el.__amap=null;}
    if(el)el.innerHTML='';
    setStatus('leaflet',err);
    var go=function(){if(window.L&&el)build(data,leafletAdapter(el));};
    if(window.L)return go();
    var sc=document.createElement('script');sc.src=el.dataset.leaflet||'assets/leaflet.js';sc.onload=go;document.head.appendChild(sc);
  }
  // ---- 地图尺寸：按推荐点的外包框（墨卡托）定宽高比，宽屏时地图在右侧 sticky，卡片在左侧 ----
  var WIDE=1200;
  function mercY(lat){var r=Math.max(-85,Math.min(85,lat))*Math.PI/180;return Math.log(Math.tan(Math.PI/4+r/2))*180/Math.PI;}
  function aspectOf(data){
    var pts=[],all=[];
    data.places.forEach(function(p){if(p.glat==null)return;var a=[[p.glng,p.glat]];(p.spots||[]).forEach(function(s){if(s.glat!=null)a.push([s.glng,s.glat]);});
      all.push.apply(all,a);if(!p.pending)pts.push.apply(pts,a);});
    if(!pts.length)pts=all;if(pts.length<2)return 1.2;
    var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(function(q){var y=mercY(q[1]);x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,y);y1=Math.max(y1,y);});
    var dx=Math.max(x1-x0,.05),dy=Math.max(y1-y0,.05);return Math.max(.8,Math.min(1.6,dx/dy));}
  var ASPECT=1.2,lastW=0;
  function sizeMap(){
    var el=document.getElementById('map');if(!el)return false;
    var vw=window.innerWidth,vh=window.innerHeight,fl=document.querySelector('.filter'),fh=fl&&getComputedStyle(fl).position==='sticky'?fl.offsetHeight:0;
    document.documentElement.style.setProperty('--fh',fh+'px');
    var w,h;
    if(vw<700){el.style.width='';el.style.height='';el.parentElement.style.width='';document.body.classList.remove('news-wide');return true;}   // 手机保持原样
    if(vw>=WIDE){
      document.body.classList.add('news-wide');
      var lay=document.querySelector('.nlay'),lw=lay?lay.clientWidth:vw;
      var maxH=Math.min(vh*.75,vh-fh-56),maxW=Math.min(1100,lw*.58);
      h=maxH;w=h*ASPECT;if(w>maxW){w=maxW;h=w/ASPECT;}
      if(w<420){w=Math.min(420,maxW);h=Math.min(maxH,w/ASPECT);}
    }else{
      document.body.classList.remove('news-wide');
      var col=el.parentElement.clientWidth;w=col;h=Math.max(320,Math.min(vh*.7,w/ASPECT));
      el.style.width='';el.parentElement.style.width='';el.style.height=Math.round(h)+'px';return true;
    }
    el.style.width=Math.round(w)+'px';el.style.height=Math.round(h)+'px';el.parentElement.style.width=Math.round(w)+'px';return true;
  }
  var rsT=null;
  window.addEventListener('resize',function(){if(window.innerWidth===lastW&&window.innerWidth<700)return;lastW=window.innerWidth;
    clearTimeout(rsT);rsT=setTimeout(function(){sizeMap();if(MAP){MAP.resize();setTimeout(fit,120);}},200);});
  function initMap(data){
    var el=document.getElementById('map');if(!el)return;
    ASPECT=aspectOf(data);lastW=window.innerWidth;sizeMap();
    var key=window.AMAP_JS_KEY,code=null,done=false;
    if(!key||!window.AMapLoader)return fallback(data,!key?'NO_KEY':'LOADER_UNAVAILABLE');
    var RX=/(INVALID_[A-Z_]+|USERKEY_[A-Z_]+|USER_DAILY_QUERY_OVER_LIMIT|DAILY_QUERY_OVER_LIMIT|SERVICE_NOT_AVAILABLE|INSUFFICIENT_PRIVILEGES|[A-Z_]*SECURITY[A-Z_]*ERROR|NO_KEY)/;
    var orig={};['error','warn','log'].forEach(function(k){orig[k]=console[k];console[k]=function(){
      try{var m=RX.exec([].map.call(arguments,String).join(' '));if(m&&!code)code=m[1];}catch(e){}return orig[k].apply(console,arguments);};});
    var restore=function(){Object.keys(orig).forEach(function(k){console[k]=orig[k];});};
    var fail=function(e){if(done)return;done=true;restore();fallback(data,code||(e&&(e.message||e.info||String(e)))||'AMAP_LOAD_FAILED');};
    var to=setTimeout(function(){fail('AMAP_TIMEOUT');},10000);
    window.AMapLoader.load({key:key,version:'2.0',plugins:['AMap.Scale','AMap.ToolBar','AMap.Geocoder']}).then(function(A){
      if(done)return;var ad;try{ad=amapAdapter(A,el);}catch(e){clearTimeout(to);return fail(e);}
      el.__amap=ad.map;
      // 无效 key / 域名不在白名单时底图照样能出，但服务报错 → 用一次官方逆地理编码校验 key（INVALID_USER_KEY、INVALID_USER_DOMAIN、USERKEY_PLAT_NOMATCH 等）
      var verified=false,mapok=false;
      var go=function(){if(done||!verified||!mapok)return;clearTimeout(to);done=true;restore();setStatus('amap');build(data,ad);};
      ad.ready(function(){mapok=true;go();});
      try{new A.Geocoder().getAddress([121.47,31.23],function(st,res){
        if(done)return;
        if(st==='error'){var m=RX.exec(String(res&&(res.info||res))||'');return fail(code||(m&&m[1])||String(res&&res.info||res||'GEOCODER_ERROR'));}
        if(code)return fail(code);verified=true;go();});}
      catch(e){verified=true;go();}
    }).catch(function(e){clearTimeout(to);fail(e);});
  }
  fetch('data/news.json?v=dba07ad8cc',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(d){
    window.NEWS=d;var s=document.getElementById('dataok');if(s)s.textContent='已载入 '+d.places.length+' 个地点';initMap(d);
  }).catch(function(e){var s=document.getElementById('dataok');if(s)s.textContent='地图数据加载失败';});
  apply();
})();
