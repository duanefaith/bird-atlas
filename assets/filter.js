(function(){
 var bar=document.getElementById('iucnf');if(!bar)return;
 var keys=[].slice.call(bar.querySelectorAll('button[data-k]')),allB=bar.querySelector('[data-all]'),shown=document.getElementById('shown');
 var sp=[].slice.call(document.querySelectorAll('.species')),famTd={};
 document.querySelectorAll('td.fam[data-fam]').forEach(function(td){famTd[td.dataset.fam]=td});
 function parse(){var m=location.hash.match(/^#iucn=([A-Z,]*)/);if(!m)return null;var s={};m[1].split(',').forEach(function(k){if(k&&bar.querySelector('button[data-k="'+k+'"]:not([disabled])'))s[k]=1});return s}
 function apply(sel,write){var any=Object.keys(sel).length,n=0;
  sp.forEach(function(el){var v=!any||sel[el.dataset.iucn];el.hidden=!v;if(v)n++});
  for(var f in famTd){var td=famTd[f],rows=sp.filter(function(r){return r.dataset.fam===f&&!r.hidden});
   if(td.parentNode)td.parentNode.removeChild(td);if(rows.length){td.rowSpan=rows.length;rows[0].insertBefore(td,rows[0].firstChild)}}
  document.querySelectorAll('.family').forEach(function(fm){fm.hidden=!fm.querySelector('.species:not([hidden])')});
  document.querySelectorAll('section.order').forEach(function(o){var v=o.querySelectorAll('.species:not([hidden])').length;o.hidden=!v;
   var fams={};o.querySelectorAll('.species:not([hidden])').forEach(function(r){fams[r.dataset.fam||r.closest('.family').dataset.fam]=1});
   var cs=o.querySelector('.cs'),cf=o.querySelector('.cf');if(cs)cs.textContent=v;if(cf)cf.textContent=Object.keys(fams).length;
   var a=document.querySelector('.toc a[data-o="'+o.id+'"]');if(a)a.hidden=!v});
  keys.forEach(function(b){b.classList.toggle('on',!!sel[b.dataset.k])});allB.classList.toggle('on',!any);shown.textContent=n;
  if(write){var h=any?'#iucn='+keys.map(function(b){return b.dataset.k}).filter(function(k){return sel[k]}).join(','):'';
   history.replaceState(null,'',location.pathname+location.search+h)}}
 var cur=parse()||{};
 keys.forEach(function(b){b.onclick=function(){if(cur[b.dataset.k])delete cur[b.dataset.k];else cur[b.dataset.k]=1;apply(cur,true)}});
 allB.onclick=function(){cur={};apply(cur,true)};
 window.addEventListener('hashchange',function(){var p=parse();if(p){cur=p;apply(cur,false)}});
 document.querySelectorAll('.toc a').forEach(function(a){a.onclick=function(ev){var t=document.getElementById(a.getAttribute('href').slice(1));if(t){ev.preventDefault();t.scrollIntoView({behavior:'smooth'})}}});
 window.__iucnApply=function(k){cur={};(k||[]).forEach(function(x){cur[x]=1});apply(cur,true)};
 apply(cur,false);
})();
