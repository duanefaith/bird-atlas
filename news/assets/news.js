(function(){
  var cards=[].slice.call(document.querySelectorAll('.nc')), byId={}, markers={}, map=null;
  cards.forEach(function(c){byId[c.id]=c;});
  var F={prov:'',type:'',prec:'',onlyNew:false};
  function visible(c){
    return (!F.prov||c.dataset.prov===F.prov)&&(!F.type||c.dataset.type===F.type)&&(!F.prec||c.dataset.prec===F.prec)&&(!F.onlyNew||c.dataset.new==='1');
  }
  function apply(){
    var n=0;
    cards.forEach(function(c){var v=visible(c);c.hidden=!v;if(v)n++;var m=markers[c.id];if(m&&map){if(v)m.addTo(map);else m.remove();}});
    document.querySelectorAll('section.prov').forEach(function(s){
      var any=s.querySelector('.nc:not([hidden])');s.hidden=!!F.prov&&s.dataset.prov!==F.prov;
      var em=s.querySelector('.empty');if(em)em.hidden=!!any;});
    var sh=document.getElementById('shown');if(sh)sh.textContent=n;
  }
  document.querySelectorAll('.filter [data-f]').forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.dataset.f;F[f]=b.dataset.v;
      document.querySelectorAll('.filter [data-f="'+f+'"]').forEach(function(x){x.classList.toggle('on',x===b);});
      apply();});
  });
  var nw=document.getElementById('onlyNew');if(nw)nw.addEventListener('change',function(){F.onlyNew=nw.checked;apply();});
  function hl(id,scroll){
    cards.forEach(function(c){c.classList.remove('hl');});
    var c=byId[id];if(!c)return;c.classList.add('hl');
    if(scroll)c.scrollIntoView({behavior:'smooth',block:'center'});
  }
  var COLORS={rare:'#b8692a',g1:'#a8382f',hawk:'#4f6f8a',social:'#c2185b',other:'#4f7a3a'};
  function initMap(data){
    if(!window.L||!document.getElementById('map'))return;
    map=L.map('map',{zoomControl:true,attributionControl:true});
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      {subdomains:'1234',maxZoom:18,attribution:'© 高德地图'}).addTo(map);
    var pts=[];
    data.items.forEach(function(it){
      if(it.glat==null)return;
      var m=L.circleMarker([it.glat,it.glng],{radius:it.is_new?9:7,color:'#fff',weight:2,fillColor:COLORS[it.type]||'#7a4b1d',fillOpacity:.92});
      m.bindTooltip(it.title+' · '+it.place,{direction:'top'});
      m.on('click',function(){hl(it.id,true);});
      markers[it.id]=m;m.addTo(map);pts.push([it.glat,it.glng]);
    });
    if(pts.length)map.fitBounds(pts,{padding:[24,24],maxZoom:12});else map.setView([31.2,120.8],7);
    cards.forEach(function(c){c.addEventListener('click',function(e){
      if(e.target.closest('a'))return;var m=markers[c.id];
      if(m){hl(c.id,false);map.setView(m.getLatLng(),Math.max(map.getZoom(),12));m.openTooltip();
        document.getElementById('map').scrollIntoView({behavior:'smooth',block:'center'});}});});
    apply();
  }
  fetch('data/news.json?v=676a7d559d',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(d){
    window.NEWS=d;var s=document.getElementById('dataok');if(s)s.textContent='已载入 '+d.items.length+' 条';initMap(d);
  }).catch(function(e){var s=document.getElementById('dataok');if(s)s.textContent='地图数据加载失败';});
  apply();
})();
