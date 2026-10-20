(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img'),bx=lb.querySelector('.bx'),cap=lb.querySelector('.lbcap');
var bar=document.createElement('div');bar.className='lbbar';bar.hidden=true;var st=document.createElement('span');st.className='lbst';var dl=document.createElement('a');dl.className='lbdl';dl.target='_blank';dl.rel='noopener';
bar.appendChild(st);bar.appendChild(dl);lb.querySelector('.lbin').appendChild(bar);bar.addEventListener('click',function(e){e.stopPropagation()});
var seq=0;
function mb(n){n=+n;return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB'}
window.openLB=function(src,c,box,orig,osize){var my=++seq;im.src=src;im.dataset.stage='web';cap.textContent=c||'';
 if(box){var b=box.split(',');bx.style.left=b[0]+'%';bx.style.top=b[1]+'%';bx.style.width=b[2]+'%';bx.style.height=b[3]+'%';bx.hidden=false}else bx.hidden=true;
 lb.hidden=false;
 if(!orig){bar.hidden=true;return}
 bar.hidden=false;dl.href=orig;dl.setAttribute('download',decodeURIComponent(orig.split('/').pop()));dl.textContent='下载原图（'+mb(osize)+'）';
 st.className='lbst loading';st.textContent='原图加载中…';
 var o=new Image(),done=false;var to=setTimeout(function(){if(done||my!==seq)return;done=true;o.src='';st.className='lbst fail';st.textContent='原图暂不可用'},90000);
 o.onload=function(){if(done||my!==seq)return;done=true;clearTimeout(to);
  var swap=function(){if(my!==seq)return;im.src=orig;im.dataset.stage='orig';st.className='lbst ok';st.textContent='已显示原图'};
  if(o.decode)o.decode().then(swap,swap);else swap()};
 o.onerror=function(){if(done||my!==seq)return;done=true;clearTimeout(to);st.className='lbst fail';st.textContent='原图暂不可用'};
 o.src=orig};
document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a.zoom');if(a){ev.preventDefault();openLB(a.getAttribute('href'),a.dataset.cap,a.dataset.box,a.dataset.orig,a.dataset.osize)}});
function close(){seq++;lb.hidden=true;im.src='';im.dataset.stage=''}
lb.addEventListener('click',close);document.addEventListener('keydown',function(e){if(e.key==='Escape')close()})})();
