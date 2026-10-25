(function(){var lb=document.getElementById('lb');if(!lb)return;
var im=lb.querySelector('img'),bx=lb.querySelector('.bx'),cap=lb.querySelector('.lbcap'),lbin=lb.querySelector('.lbin'),lbimg=lb.querySelector('.lbimg');
/* 视口：包住图片，负责裁切与拖动 */
var stage=document.createElement('div');stage.className='lbstage';
lbimg.parentNode.insertBefore(stage,lbimg);stage.appendChild(lbimg);

var bar=document.createElement('div');bar.className='lbbar';bar.hidden=true;
var st=document.createElement('span');st.className='lbst';
var dl=document.createElement('a');dl.className='lbdl';dl.target='_blank';dl.rel='noopener';
var ed=document.createElement('a');ed.className='lbedit';ed.target='_blank';ed.rel='noopener';ed.textContent='改结果';ed.hidden=true;
bar.appendChild(st);bar.appendChild(dl);bar.appendChild(ed);lbin.appendChild(bar);
bar.addEventListener('click',function(e){e.stopPropagation()});

/* 缩放控件 */
var zbar=document.createElement('div');zbar.className='lbzoom';
function mkBtn(cls,label,title){var b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;if(title)b.title=title;return b}
var btnOut=mkBtn('lbz','−','缩小'),btnIn=mkBtn('lbz','+','放大'),btnFit=mkBtn('lbz','适合','适合窗口'),btn100=mkBtn('lbz','100%','1:1 像素');
var zlab=document.createElement('span');zlab.className='lbzlab';zlab.textContent='100%';
zbar.appendChild(btnOut);zbar.appendChild(btnIn);zbar.appendChild(btnFit);zbar.appendChild(btn100);zbar.appendChild(zlab);
lbin.appendChild(zbar);
zbar.addEventListener('click',function(e){e.stopPropagation()});

dl.addEventListener('click',function(e){if(!window.fetch||!window.URL||dl.dataset.busy)return;e.preventDefault();var u=dl.href,fn=dl.getAttribute('download'),t=dl.textContent;dl.dataset.busy=1;dl.textContent='下载中…';
 fetch(u,{mode:'cors'}).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){var x=URL.createObjectURL(b),a=document.createElement('a');a.href=x;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(x)},60000)})
 .catch(function(){window.open(u,'_blank')}).then(function(){delete dl.dataset.busy;dl.textContent=t})});

var seq=0;
var S={fit:1,user:1,tx:0,ty:0,nw:0,nh:0}; /* fit=适合窗口的绝对缩放；user=相对 fit 的倍率；tx/ty 平移 */
var dragging=false,moved=false,lx=0,ly=0,pid=-1;
var pinching=false,pinchDist=0,pinchUser=1;

function mb(n){n=+n;return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB'}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function absScale(){return S.fit*S.user}
function stageSize(){return{w:stage.clientWidth,h:stage.clientHeight}}
function recomputeFit(){
  var ss=stageSize();if(!S.nw||!S.nh||!ss.w||!ss.h){S.fit=1;return}
  S.fit=Math.min(ss.w/S.nw,ss.h/S.nh);
  if(!(S.fit>0))S.fit=1;
}
function clampPan(){
  var ss=stageSize(),sc=absScale();
  var ew=S.nw*sc,eh=S.nh*sc;
  var mx=Math.max(0,(ew-ss.w)/2),my=Math.max(0,(eh-ss.h)/2);
  S.tx=clamp(S.tx,-mx,mx);S.ty=clamp(S.ty,-my,my);
}
function applyTransform(){
  clampPan();
  var sc=absScale();
  lbimg.style.transform='translate(-50%,-50%) translate('+S.tx+'px,'+S.ty+'px) scale('+sc+')';
  var pct=Math.round(sc*100);
  zlab.textContent=pct+'%';
  var zoomed=S.user>1.02||sc>S.fit*1.02;
  stage.classList.toggle('zoomed',zoomed);
  stage.style.cursor=zoomed?(dragging?'grabbing':'grab'):'zoom-in';
  /* 识别框跟着图片走，无需单独变换 */
}
function setUser(u,cx,cy){
  /* cx/cy：相对 stage 中心的焦点（可选），缩放时保持该点不动 */
  var ss=stageSize();
  var ox=(cx!=null?cx:0)-S.tx, oy=(cy!=null?cy:0)-S.ty;
  var prev=S.user;
  S.user=clamp(u,0.2,8);
  if(prev>0&&(cx!=null)){
    var r=S.user/prev;
    S.tx=cx-ox*r;S.ty=cy-oy*r;
  }
  applyTransform();
}
function zoomBy(factor,cx,cy){setUser(S.user*factor,cx,cy)}
function toFit(){S.user=1;S.tx=0;S.ty=0;applyTransform()}
function to100(){
  if(!S.fit)return;
  /* 1:1 像素：绝对缩放=1；相对 fit 的倍率 = 1/fit */
  var ss=stageSize();
  setUser(1/S.fit,0,0);
  S.tx=0;S.ty=0;applyTransform();
}
function onImgReady(){
  S.nw=im.naturalWidth||im.width;S.nh=im.naturalHeight||im.height;
  /* 图片以自然尺寸布局，由 transform 缩放到视口 */
  im.style.width=S.nw+'px';im.style.height=S.nh+'px';im.style.maxWidth='none';im.style.maxHeight='none';
  lbimg.style.width=S.nw+'px';lbimg.style.height=S.nh+'px';
  recomputeFit();toFit();
}

btnOut.addEventListener('click',function(){zoomBy(1/1.25,0,0)});
btnIn.addEventListener('click',function(){zoomBy(1.25,0,0)});
btnFit.addEventListener('click',toFit);
btn100.addEventListener('click',to100);

stage.addEventListener('wheel',function(e){
  if(lb.hidden)return;e.preventDefault();e.stopPropagation();
  var r=stage.getBoundingClientRect();
  var cx=e.clientX-(r.left+r.width/2), cy=e.clientY-(r.top+r.height/2);
  var f=e.deltaY<0?1.12:1/1.12;
  zoomBy(f,cx,cy);
},{passive:false});

stage.addEventListener('dblclick',function(e){
  e.preventDefault();e.stopPropagation();
  if(Math.abs(S.user-1)<0.05){
    var r=stage.getBoundingClientRect();
    to100();
  }else toFit();
});

stage.addEventListener('pointerdown',function(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target.closest&&e.target.closest('a,button'))return;
  /* 双指捏合不走拖动 */
  if(e.pointerType==='touch'&&stage._touches&&stage._touches>1)return;
  stage.setPointerCapture(e.pointerId);
  dragging=true;moved=false;lx=e.clientX;ly=e.clientY;pid=e.pointerId;
  stage.classList.add('dragging');applyTransform();
});
stage.addEventListener('pointermove',function(e){
  if(!dragging||e.pointerId!==pid||pinching)return;
  var dx=e.clientX-lx,dy=e.clientY-ly;
  if(!moved&&dx*dx+dy*dy<9)return;
  moved=true;lx=e.clientX;ly=e.clientY;
  if(S.user<=1.02&&absScale()<=S.fit*1.02){
    /* 未放大时拖不动，留给点击关闭 */
    return;
  }
  S.tx+=dx;S.ty+=dy;applyTransform();
});
function endDrag(e){
  if(e&&e.pointerId!==pid)return;
  dragging=false;pid=-1;stage.classList.remove('dragging');applyTransform();
}
stage.addEventListener('pointerup',endDrag);
stage.addEventListener('pointercancel',endDrag);

/* 触控捏合 */
var tmap={};
stage.addEventListener('touchstart',function(e){
  for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];tmap[t.identifier]={x:t.clientX,y:t.clientY}}
  var ids=Object.keys(tmap);
  stage._touches=ids.length;
  if(ids.length===2){
    pinching=true;dragging=false;
    var a=tmap[ids[0]],b=tmap[ids[1]];
    pinchDist=Math.hypot(a.x-b.x,a.y-b.y)||1;pinchUser=S.user;
  }
},{passive:true});
stage.addEventListener('touchmove',function(e){
  if(!pinching)return;
  e.preventDefault();
  for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(tmap[t.identifier])tmap[t.identifier]={x:t.clientX,y:t.clientY}}
  var ids=Object.keys(tmap);if(ids.length<2)return;
  var a=tmap[ids[0]],b=tmap[ids[1]];
  var d=Math.hypot(a.x-b.x,a.y-b.y)||1;
  var r=stage.getBoundingClientRect();
  var cx=(a.x+b.x)/2-(r.left+r.width/2), cy=(a.y+b.y)/2-(r.top+r.height/2);
  setUser(pinchUser*(d/pinchDist),cx,cy);
},{passive:false});
stage.addEventListener('touchend',function(e){
  for(var i=0;i<e.changedTouches.length;i++)delete tmap[e.changedTouches[i].identifier];
  var ids=Object.keys(tmap);stage._touches=ids.length;
  if(ids.length<2)pinching=false;
},{passive:true});
stage.addEventListener('touchcancel',function(){tmap={};pinching=false;stage._touches=0},{passive:true});

/* 点击关闭：背景 / 未拖动且未放大时点图 */
stage.addEventListener('click',function(e){
  e.stopPropagation();
  if(moved){moved=false;return}
  if(S.user>1.02)return; /* 放大时点图不关，需点背景或 Esc */
  close();
});
lb.addEventListener('click',function(e){
  if(e.target===lb||e.target===lbin||e.target===cap)close();
});

window.addEventListener('resize',function(){
  if(lb.hidden)return;
  var abs=absScale();
  recomputeFit();
  /* 尽量保持绝对缩放不变 */
  if(S.fit>0)S.user=clamp(abs/S.fit,0.2,8);
  applyTransform();
});

window.openLB=function(src,c,box,orig,osize,name){var my=++seq;
 im.removeAttribute('crossorigin');im.removeAttribute('style');lbimg.removeAttribute('style');
 im.src=src;im.dataset.stage='web';cap.textContent=c||'';
 if(box){var b=box.split(',');bx.style.left=b[0]+'%';bx.style.top=b[1]+'%';bx.style.width=b[2]+'%';bx.style.height=b[3]+'%';bx.hidden=false}else bx.hidden=true;
 S.user=1;S.tx=0;S.ty=0;S.nw=0;S.nh=0;
 lb.hidden=false;
 if(im.complete&&im.naturalWidth)onImgReady();
 else im.onload=function(){if(my===seq)onImgReady()};
 if(name){ed.hidden=false;ed.href='label.html?q='+encodeURIComponent(name)+'&tab=all'}else ed.hidden=true;
 if(!orig){bar.hidden=!name;if(name){dl.hidden=true;st.hidden=true}return}
 bar.hidden=false;dl.hidden=false;st.hidden=false;dl.href=orig;dl.setAttribute('download',decodeURIComponent(orig.split('/').pop()));dl.textContent='下载原图（'+mb(osize)+'）';
 st.className='lbst loading';st.textContent='原图加载中…';
 var o=new Image(),done=false;o.crossOrigin='anonymous';var to=setTimeout(function(){if(done||my!==seq)return;done=true;o.src='';st.className='lbst fail';st.textContent='原图暂不可用'},90000);
 o.onload=function(){if(done||my!==seq)return;done=true;clearTimeout(to);
  var swap=function(){if(my!==seq)return;im.crossOrigin='anonymous';im.src=orig;im.dataset.stage='orig';st.className='lbst ok';st.textContent='已显示原图';
   /* 原图替换后按新尺寸重算（onload 会再触发） */};
  if(o.decode)o.decode().then(swap,swap);else swap()};
 o.onerror=function(){if(done||my!==seq)return;done=true;clearTimeout(to);st.className='lbst fail';st.textContent='原图暂不可用'};
 o.src=orig};
document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a.zoom');if(a){ev.preventDefault();openLB(a.getAttribute('href'),a.dataset.cap,a.dataset.box,a.dataset.orig,a.dataset.osize,a.dataset.name)}});
function close(){seq++;lb.hidden=true;im.src='';im.dataset.stage='';im.removeAttribute('style');lbimg.removeAttribute('style');S.user=1;S.tx=0;S.ty=0;dragging=false;moved=false}
document.addEventListener('keydown',function(e){
  if(lb.hidden)return;
  if(e.key==='Escape')close();
  else if(e.key==='+'||e.key==='=')zoomBy(1.25,0,0);
  else if(e.key==='-'||e.key==='_')zoomBy(1/1.25,0,0);
  else if(e.key==='0')toFit();
  else if(e.key==='1')to100();
})})();
