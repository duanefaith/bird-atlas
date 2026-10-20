(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img'),bx=lb.querySelector('.bx'),cap=lb.querySelector('.lbcap');
window.openLB=function(src,c,box){im.src=src;cap.textContent=c||'';if(box){var b=box.split(',');bx.style.left=b[0]+'%';bx.style.top=b[1]+'%';bx.style.width=b[2]+'%';bx.style.height=b[3]+'%';bx.hidden=false}else bx.hidden=true;lb.hidden=false};
document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a.zoom');if(a){ev.preventDefault();openLB(a.getAttribute('href'),a.dataset.cap,a.dataset.box)}});
lb.addEventListener('click',function(){lb.hidden=true;im.src=''});document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true})})();
