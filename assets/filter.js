(function(){
 var bar=document.getElementById('iucnf');if(!bar)return;
 var keys=[].slice.call(bar.querySelectorAll('button[data-k]')),cks=[].slice.call(bar.querySelectorAll('button[data-c]')),allB=bar.querySelector('[data-all]'),shown=document.getElementById('shown');
 var sp=[].slice.call(document.querySelectorAll('.species')),famTd={};
 document.querySelectorAll('td.fam[data-fam]').forEach(function(td){famTd[td.dataset.fam]=td});
 function grab(re,attr){var m=location.hash.match(re);if(!m)return null;var s={};m[1].split(',').forEach(function(k){if(k&&bar.querySelector('button['+attr+'="'+k+'"]:not([disabled])'))s[k]=1});return s}
 function parse(){var a=grab(/[#&]iucn=([A-Z,]*)/,'data-k'),c=grab(/[#&]cn=([A-Z,]*)/,'data-c');if(!a&&!c)return null;return {k:a||{},c:c||{}}}
 function apply(sel,write){var ak=Object.keys(sel.k).length,ac=Object.keys(sel.c).length,n=0;
  sp.forEach(function(el){var v=(!ak||sel.k[el.dataset.iucn])&&(!ac||sel.c[el.dataset.cn]);el.hidden=!v;if(v)n++});
  for(var f in famTd){var td=famTd[f],rows=sp.filter(function(r){return r.dataset.fam===f&&!r.hidden});
   if(td.parentNode)td.parentNode.removeChild(td);if(rows.length){td.rowSpan=rows.length;rows[0].insertBefore(td,rows[0].firstChild)}}
  document.querySelectorAll('.family').forEach(function(fm){fm.hidden=!fm.querySelector('.species:not([hidden])')});
  document.querySelectorAll('section.order').forEach(function(o){var v=o.querySelectorAll('.species:not([hidden])').length;o.hidden=!v;
   var fams={};o.querySelectorAll('.species:not([hidden])').forEach(function(r){fams[r.dataset.fam||r.closest('.family').dataset.fam]=1});
   var cs=o.querySelector('.cs'),cf=o.querySelector('.cf');if(cs)cs.textContent=v;if(cf)cf.textContent=Object.keys(fams).length;
   var a=document.querySelector('.toc a[data-o="'+o.id+'"]');if(a)a.hidden=!v});
  keys.forEach(function(b){b.classList.toggle('on',!!sel.k[b.dataset.k])});cks.forEach(function(b){b.classList.toggle('on',!!sel.c[b.dataset.c])});
  allB.classList.toggle('on',!ak&&!ac);shown.textContent=n;
  if(write){var h=[];if(ak)h.push('iucn='+keys.map(function(b){return b.dataset.k}).filter(function(k){return sel.k[k]}).join(','));
   if(ac)h.push('cn='+cks.map(function(b){return b.dataset.c}).filter(function(k){return sel.c[k]}).join(','));
   history.replaceState(null,'',location.pathname+location.search+(h.length?'#'+h.join('&'):''))}}
 var cur=parse()||{k:{},c:{}};
 keys.forEach(function(b){b.onclick=function(){if(cur.k[b.dataset.k])delete cur.k[b.dataset.k];else cur.k[b.dataset.k]=1;apply(cur,true)}});
 cks.forEach(function(b){b.onclick=function(){if(cur.c[b.dataset.c])delete cur.c[b.dataset.c];else cur.c[b.dataset.c]=1;apply(cur,true)}});
 allB.onclick=function(){cur={k:{},c:{}};apply(cur,true)};
 window.addEventListener('hashchange',function(){var p=parse();if(p){cur=p;apply(cur,false)}});
 document.querySelectorAll('.toc a').forEach(function(a){a.onclick=function(ev){var t=document.getElementById(a.getAttribute('href').slice(1));if(t){ev.preventDefault();t.scrollIntoView({behavior:'smooth'})}}});
 window.__iucnApply=function(k,c){cur={k:{},c:{}};(k||[]).forEach(function(x){cur.k[x]=1});(c||[]).forEach(function(x){cur.c[x]=1});apply(cur,true)};
 apply(cur,false);
})();
