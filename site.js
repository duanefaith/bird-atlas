(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img'),bx=lb.querySelector('.bx'),cap=lb.querySelector('.lbcap');
var bar=document.createElement('div');bar.className='lbbar';bar.hidden=true;var st=document.createElement('span');st.className='lbst';var dl=document.createElement('a');dl.className='lbdl';dl.target='_blank';dl.rel='noopener';
var ed=document.createElement('a');ed.className='lbedit';ed.target='_blank';ed.rel='noopener';ed.textContent='改结果';ed.hidden=true;
bar.appendChild(st);bar.appendChild(dl);bar.appendChild(ed);lb.querySelector('.lbin').appendChild(bar);bar.addEventListener('click',function(e){e.stopPropagation()});
dl.addEventListener('click',function(e){if(!window.fetch||!window.URL||dl.dataset.busy)return;e.preventDefault();var u=dl.href,fn=dl.getAttribute('download'),t=dl.textContent;dl.dataset.busy=1;dl.textContent='下载中…';
 fetch(u,{mode:'cors'}).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){var x=URL.createObjectURL(b),a=document.createElement('a');a.href=x;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(x)},60000)})
 .catch(function(){window.open(u,'_blank')}).then(function(){delete dl.dataset.busy;dl.textContent=t})});
var seq=0;
function mb(n){n=+n;return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB'}
window.openLB=function(src,c,box,orig,osize,name){var my=++seq;im.removeAttribute('crossorigin');im.src=src;im.dataset.stage='web';cap.textContent=c||'';
 if(box){var b=box.split(',');bx.style.left=b[0]+'%';bx.style.top=b[1]+'%';bx.style.width=b[2]+'%';bx.style.height=b[3]+'%';bx.hidden=false}else bx.hidden=true;
 lb.hidden=false;
 if(name){ed.hidden=false;ed.href='label.html?q='+encodeURIComponent(name)+'&tab=all'}else ed.hidden=true;
 if(!orig){bar.hidden=!name;if(name){dl.hidden=true;st.hidden=true}return}
 bar.hidden=false;dl.hidden=false;st.hidden=false;dl.href=orig;dl.setAttribute('download',decodeURIComponent(orig.split('/').pop()));dl.textContent='下载原图（'+mb(osize)+'）';
 st.className='lbst loading';st.textContent='原图加载中…';
 var o=new Image(),done=false;o.crossOrigin='anonymous';var to=setTimeout(function(){if(done||my!==seq)return;done=true;o.src='';st.className='lbst fail';st.textContent='原图暂不可用'},90000);
 o.onload=function(){if(done||my!==seq)return;done=true;clearTimeout(to);
  var swap=function(){if(my!==seq)return;im.crossOrigin='anonymous';im.src=orig;im.dataset.stage='orig';st.className='lbst ok';st.textContent='已显示原图'};
  if(o.decode)o.decode().then(swap,swap);else swap()};
 o.onerror=function(){if(done||my!==seq)return;done=true;clearTimeout(to);st.className='lbst fail';st.textContent='原图暂不可用'};
 o.src=orig};
document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a.zoom');if(a){ev.preventDefault();openLB(a.getAttribute('href'),a.dataset.cap,a.dataset.box,a.dataset.orig,a.dataset.osize,a.dataset.name)}});
function close(){seq++;lb.hidden=true;im.src='';im.dataset.stage=''}
lb.addEventListener('click',close);document.addEventListener('keydown',function(e){if(e.key==='Escape')close()})})();
