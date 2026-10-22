/* 标题折叠/展开（图鉴、标注页、鸟讯页通用）。<script src="fold.js" data-page="atlas|label|news">
   - 每个标题前加 ▾/▸，点标题折叠其内容；状态存 localStorage（fold:<page>）
   - 「全部展开 / 全部折叠」按钮；原生 <details> 也一起记住、一起展开/折叠
   - 锚点（#sp123 等）自动展开所在的各级折叠再滚动过去
   折叠用 .fold-hide 类，不碰 hidden 属性（筛选脚本用 hidden），两者互不干扰。 */
(function(){
  var me=document.currentScript, page=(me&&me.dataset.page)||location.pathname, LS='fold:'+page, st={};
  try{st=JSON.parse(localStorage.getItem(LS)||'{}')||{}}catch(e){st={}}
  function save(){try{localStorage.setItem(LS,JSON.stringify(st))}catch(e){}}
  var groups=[], seen=new WeakSet();
  function sibs(h){var o=[],n=h.nextElementSibling;while(n){o.push(n);n=n.nextElementSibling}return o}
  function add(id,head,body,opt){
    if(!head||seen.has(head))return;seen.add(head);opt=opt||{};
    var b=document.createElement('button');b.type='button';b.className='fold-tg';b.title='折叠 / 展开';
    head.insertBefore(b,head.firstChild);head.classList.add('fold-h');
    var g={id:id,head:head,body:body,opt:opt,folded:false,btn:b};
    g.set=function(f,persist){g.folded=f;var els=body()||[];for(var i=0;i<els.length;i++)els[i].classList.toggle('fold-hide',f);
      head.classList.toggle('folded',f);b.textContent=f?'▸':'▾';b.setAttribute('aria-expanded',String(!f));
      if(opt.onset)opt.onset(f);if(persist){if(f)st[id]=1;else delete st[id];save()}};
    head.addEventListener('click',function(ev){
      if(ev.target.closest('a,input,label,select,textarea')||(ev.target.closest('button')&&ev.target.closest('button')!==b))return;
      ev.stopPropagation();ev.preventDefault();g.set(!g.folded,true)});
    groups.push(g);g.set(id in st?!!st[id]:!!opt.folded,false);
  }
  function did(d){   // <details> 的稳定 id：最近的带 id 祖先 + 类名 + 序号
    var a=d.parentElement&&d.parentElement.closest('[id]'),scope=a||document,cls=d.className||'d';
    var same=[].filter.call(scope.querySelectorAll('details'),function(x){return (x.className||'d')===cls});
    return 'd:'+(a?a.id:'')+':'+cls+':'+same.indexOf(d)}
  function wireDetails(root){
    (root||document).querySelectorAll('details').forEach(function(d){
      if(seen.has(d))return;seen.add(d);var id=did(d);
      if(id in st)d.open=st[id]==='o';
      d.addEventListener('toggle',function(){st[did(d)]=d.open?'o':'c';save()});
    })}
  function all(f){groups.forEach(function(g){g.set(f,true)});
    document.querySelectorAll('details').forEach(function(d){d.open=!f;st[did(d)]=f?'c':'o'});save();
    if(window.__foldChanged)window.__foldChanged()}
  function reveal(el){
    if(!el)return;var ch=false;
    groups.forEach(function(g){if(!g.folded)return;if(el.contains(g.head)){g.set(false,true);ch=true;return}var bs=g.body()||[];
      for(var i=0;i<bs.length;i++)if(bs[i]===el||bs[i].contains(el)){g.set(false,true);ch=true;break}});
    for(var d=el.closest('details');d;d=d.parentElement&&d.parentElement.closest('details')){if(!d.open){d.open=true;ch=true}}
    if(el.tagName==='DETAILS'&&!el.open){el.open=true;ch=true}
    return ch}
  function goHash(smooth){
    var h=decodeURIComponent(location.hash.slice(1));if(!h||h.indexOf('=')>=0)return;
    var el=document.getElementById(h);if(!el)return;reveal(el);
    setTimeout(function(){el.scrollIntoView({behavior:smooth?'smooth':'auto',block:'start'});el.classList.add('fold-target');
      setTimeout(function(){el.classList.remove('fold-target')},2500)},60)}
  document.addEventListener('click',function(ev){   // 站内锚点：先展开再跳
    var a=ev.target.closest('a[href*="#"]');if(!a)return;
    var u;try{u=new URL(a.href,location.href)}catch(e){return}
    if(u.pathname!==location.pathname||!u.hash||u.hash.indexOf('=')>=0)return;
    var el=document.getElementById(decodeURIComponent(u.hash.slice(1)));if(el)reveal(el)},true);
  window.addEventListener('hashchange',function(){goHash(true)});
  function controls(where){
    var host=where&&document.querySelector(where);if(!host||host.querySelector('.fold-all'))return;
    var w=document.createElement('span');w.className='fold-all';
    w.innerHTML='<button type="button" data-a="0">全部展开</button><button type="button" data-a="1">全部折叠</button>';
    w.addEventListener('click',function(ev){var b=ev.target.closest('button');if(b){ev.stopPropagation();all(b.dataset.a==='1')}});
    host.appendChild(w)}
  var P={};
  P.atlas=function(){
    controls('#iucnf');
    document.querySelectorAll('#overview .col > h2, #unrec > h2').forEach(function(h){add('h:'+h.textContent.trim(),h,function(){return sibs(h)})});
    document.querySelectorAll('section.order > h2').forEach(function(h){var s=h.parentElement;add('o:'+(s.dataset.order||s.id),h,function(){return sibs(h)})});
    // 科：表格里 td.fam（rowspan）。折叠时只留科名一行（横跨整行），同科其余行隐藏
    document.querySelectorAll('td.fam[data-fam]').forEach(function(td){
      var f=td.dataset.fam,name=(td.textContent||'').trim(),tbody=td.closest('tbody');
      var rows=function(){return [].slice.call(tbody.querySelectorAll('tr.species[data-fam="'+f+'"]'))};
      td._fold={};
      add('f:'+name,td,function(){return rows().filter(function(r){return r!==td.parentNode})},{onset:function(fd){td._fold.f=fd;famLayout(td,rows)}});
      td._rows=rows});
    document.querySelectorAll('.family > h3').forEach(function(h){add('f:'+h.textContent.trim(),h,function(){return sibs(h)})});
    // 种：折叠该种的照片
    document.querySelectorAll('tr.species td.nm').forEach(function(td){var tr=td.parentNode;
      add('s:'+tr.dataset.id,td,function(){return [].slice.call(tr.querySelectorAll('td.ph'))})});
    document.querySelectorAll('article.species .info .tt h4').forEach(function(h){var c=h.closest('article');
      add('s:'+c.dataset.id,h,function(){return [].slice.call(c.querySelectorAll('.figs'))})});
  };
  function famLayout(td,rows){var f=td._fold&&td._fold.f,rs=rows(),head=td.parentNode;
    rs.forEach(function(r){r.classList.toggle('fold-hide',!!f&&r!==head);r.classList.toggle('famfold',!!f&&r===head)});
    var vis=rs.filter(function(r){return !r.hidden}).length||1,cols=(td.closest('table').querySelector('thead tr')||{children:[1]}).children.length;
    td.rowSpan=f?1:vis;td.colSpan=f?cols:1}
  window.__foldRefresh=function(){document.querySelectorAll('td.fam[data-fam]').forEach(function(td){if(td._rows)famLayout(td,td._rows)})};
  P.label=function(){
    controls('section.bar');
    document.querySelectorAll('main section > h2').forEach(function(h){add('h:'+h.textContent.replace(/\d+/g,'').trim(),h,function(){return sibs(h)})});
  };
  P.news=function(){
    controls('.filter');
    document.querySelectorAll('section.prov > h2').forEach(function(h){add('prov:'+h.parentElement.dataset.prov,h,function(){return sibs(h)})});
    document.querySelectorAll('.unloc > h3').forEach(function(h){add('unloc:'+(h.closest('section.prov')||{dataset:{}}).dataset.prov,h,function(){return sibs(h)})});
    document.querySelectorAll('article.nc > h4').forEach(function(h){var c=h.parentElement;add('card:'+c.id,h,function(){return sibs(h)})});
  };
  function scan(){(P[page]||function(){})();wireDetails()}
  scan();
  if(window.MutationObserver){var t=null;new MutationObserver(function(){clearTimeout(t);t=setTimeout(scan,150)}).observe(document.body,{childList:true,subtree:true})}
  window.Fold={reveal:reveal,all:all,scan:scan};
  if(document.readyState==='complete')goHash(false);else window.addEventListener('load',function(){goHash(false)});
})();
