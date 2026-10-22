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
      var m=markers[c.id];if(m&&map){m.forEach(function(x){if(v)x.addTo(map);else x.remove();});}
    });
    document.querySelectorAll('section.prov').forEach(function(s){
      var any=s.querySelector('.nc:not([hidden])');s.hidden=!!F.prov&&s.dataset.prov!==F.prov;
      var em=s.querySelector('.empty');if(em)em.hidden=!!any;});
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
  var pend={};
  function fit(){   // 默认/筛选后：缩放到可见的「推荐」地点（实心点 + 其◆帖子点位）；没有推荐点时退回到全部可见点
    if(!map)return;
    var rec=[],all=[];
    Object.keys(markers).forEach(function(id){
      var c=byId[id];if(c&&c.hidden)return;
      markers[id].forEach(function(m){var ll=m.getLatLng();all.push(ll);if(!pend[id])rec.push(ll);});
    });
    var pts=rec.length?rec:all;
    if(!pts.length){map.setView([31.2,120.8],7);return;}
    var mob=window.innerWidth<700;
    map.fitBounds(L.latLngBounds(pts),{padding:mob?[28,28]:[40,40],maxZoom:13});
  }
  var COLORS={rare:'#b8692a',g1:'#a8382f',hawk:'#4f6f8a',social:'#c2185b',other:'#4f7a3a',hot:'#8a6d47'};
  function initMap(data){
    if(!window.L||!document.getElementById('map'))return;
    map=L.map('map',{zoomControl:true,attributionControl:true,zoomSnap:0.25,zoomDelta:0.5});map.attributionControl.setPrefix(false);
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      {subdomains:'1234',maxZoom:18,attribution:'© 高德地图'}).addTo(map);
    data.places.forEach(function(p){
      if(p.glat==null)return;
      var ms=[];
      var m=p.pending?L.circleMarker([p.glat,p.glng],{radius:5,color:COLORS[p.type]||'#7a4b1d',weight:2,fillColor:'#fff',fillOpacity:.85})
                     :L.circleMarker([p.glat,p.glng],{radius:p.is_new?9:7,color:'#fff',weight:2,fillColor:COLORS[p.type]||'#7a4b1d',fillOpacity:.92});
      m.bindTooltip(p.name+' · '+p.top.join('、'),{direction:'top'});
      m.on('click',function(){hl(p.id,true);});
      ms.push(m);
      var seen={};
      (p.spots||[]).forEach(function(s){
        var k=s.glat+','+s.glng;if(seen[k]||s.glat==null)return;seen[k]=1;
        if(Math.abs(s.glat-p.glat)<1e-5&&Math.abs(s.glng-p.glng)<1e-5)return;
        var d=L.marker([s.glat,s.glng],{icon:L.divIcon({className:'spotmk',html:'◆',iconSize:[14,14],iconAnchor:[7,7]})});
        d.bindTooltip(p.name+' · '+s.name,{direction:'top'});d.on('click',function(){hl(p.id,true);});ms.push(d);
      });
      ms.forEach(function(x){x.addTo(map);});markers[p.id]=ms;pend[p.id]=!!p.pending;
    });
    fit();
    cards.forEach(function(c){c.addEventListener('click',function(e){
      if(e.target.closest('a,summary,details:not(:scope > details)'))return;var m=markers[c.id];
      if(m){hl(c.id,false);map.setView(m[0].getLatLng(),Math.max(map.getZoom(),13));m[0].openTooltip();
        document.getElementById('map').scrollIntoView({behavior:'smooth',block:'center'});}});});
    apply();
  }
  fetch('data/news.json?v=ac2fad8c70',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(d){
    window.NEWS=d;var s=document.getElementById('dataok');if(s)s.textContent='已载入 '+d.places.length+' 个地点';initMap(d);
  }).catch(function(e){var s=document.getElementById('dataok');if(s)s.textContent='地图数据加载失败';});
  apply();
})();
