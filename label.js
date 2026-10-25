(function(){
var KEY='bird-atlas-label-v1',D,ST=load(),SP={},byLabel={},TAB='todo';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{items:{},picks:{}}}catch(e){return{items:{},picks:{}}}}
function save(){localStorage.setItem(KEY,JSON.stringify(ST));stat()}
function h(t,a,c){var e=document.createElement(t);if(a)for(var k in a){if(k==='text')e.textContent=a[k];else if(k==='html')e.innerHTML=a[k];else e.setAttribute(k,a[k])}(c||[]).forEach(function(x){e.appendChild(typeof x==='string'?document.createTextNode(x):x)});return e}
function T(n){return 'img/t/'+encodeURIComponent(n)}function T2(n){return 'img/t2/'+encodeURIComponent(n)}function L(n){return 'img/l/'+encodeURIComponent(n)}
function qs(){var o={};location.search.slice(1).split('&').forEach(function(p){if(!p)return;var i=p.indexOf('='),k=decodeURIComponent(i<0?p:p.slice(0,i)),v=decodeURIComponent(i<0?'':p.slice(i+1));o[k]=v});return o}
fetch('data/label.json?v=a4ab469652').then(function(r){return r.json()}).then(function(d){D=d;init()});
function lab(s){return s[1]+(s[2]?'（'+s[2]+'）':'')+' #'+s[0]}
function counts(){var c={todo:0,ok:0,rej:0,all:D.boxes.length};D.boxes.forEach(function(b){c[b.status]=(c[b.status]||0)+1});return c}
function init(){
 var q=qs();
 if(q.tab&&{todo:1,ok:1,rej:1,all:1}[q.tab])TAB=q.tab;
 else if(q.key||q.photo||q.q)TAB='all';
 var dl=document.getElementById('splist');D.species.forEach(function(s){SP[s[0]]=s;var l=lab(s);byLabel[l]=s[0];if(!(s[1] in byLabel))byLabel[s[1]]=s[0];dl.appendChild(h('option',{value:l}))});
 var keys={};D.boxes.forEach(function(b){keys[b.key]=1});for(var k in ST.items)if(!keys[k])delete ST.items[k];
 renderTabs();renderBoxes();renderPicks();stat();
 var flt=document.getElementById('flt');
 if(q.key){var hit=D.boxes.find(function(b){return b.key===q.key});if(hit)flt.value=hit.name}
 else if(q.photo)flt.value=q.photo;
 else if(q.q)flt.value=q.q;
 flt.oninput=filter;document.getElementById('onlyTodo').onchange=filter;
 document.getElementById('clear').onclick=function(){if(confirm('清空本浏览器里所有未提交的选择？')){ST={items:{},picks:{}};save();location.reload()}};
 document.getElementById('submit').onclick=submit;
 filter();
 if(q.key){var card=Array.prototype.find.call(document.querySelectorAll('.card'),function(c){return c.dataset.key===q.key});if(card){card.classList.add('focus');setTimeout(function(){card.scrollIntoView({behavior:'smooth',block:'center'})},80)}}
}
function renderTabs(){var root=document.getElementById('tabs');if(!root)return;root.innerHTML='';
 var c=counts(),labs=[['todo','待确认'],['ok','已采纳'],['rej','已忽略'],['all','全部']];
 labs.forEach(function(x){var b=h('button',{'type':'button','class':'tab'+(TAB===x[0]?' on':''),'data-tab':x[0],text:x[1]+' '+(c[x[0]]||0)});
  b.onclick=function(){TAB=x[0];renderTabs();filter();var u=new URL(location.href);u.searchParams.set('tab',TAB);history.replaceState(null,'',u)};
  root.appendChild(b)})}
function stat(){var n=Object.keys(ST.items).length,p=Object.keys(ST.picks).length,c=counts();
 document.getElementById('stat').textContent='已选择 '+n+' 项'+(p?'，改推荐图 '+p+' 种':'');
 document.getElementById('nbox').textContent='共 '+c.all+' 个框（待确认 '+c.todo+' · 已采纳 '+c.ok+' · 已忽略 '+c.rej+'）'}
function desc(it){if(!it)return'';if(it.action==='accept')return'✔ 采纳：'+it.zh;if(it.action==='reject')return'✘ 不是鸟 / 忽略';if(it.action==='species')return'✎ 改为：'+SP[it.id][1]+' #'+it.id;if(it.action==='name')return'✎ 改为（手写，需人工确认）：'+it.name;return''}
function statusTag(b){if(b.status==='todo')return h('span',{'class':'tag todo',text:'待确认'});if(b.status==='rej')return h('span',{'class':'tag rej',text:'已忽略'});return h('span',{'class':'tag ok',text:'已采纳'})}
function metaHtml(b){
 var top='第一候选：<b>'+b.zh+'</b> '+(b.en||'')+' · '+b.conf.toFixed(1)+'%';
 if(b.status==='ok'&&(b.cur_id!==b.id||b.cur_zh!==b.zh))return top+'<br>当前结果：<b>'+b.cur_zh+'</b> '+(b.cur_en||'')+' <small>（人工修正）</small>';
 if(b.status==='ok')return '当前结果：<b>'+b.cur_zh+'</b> '+(b.cur_en||'')+' · 置信度 <b>'+b.conf.toFixed(1)+'%</b>';
 if(b.status==='rej')return top+'<br><em>当前：已忽略</em>';
 return top}
function renderBoxes(){var box=document.getElementById('boxes');box.innerHTML='';
 D.boxes.forEach(function(b){
  var bx=h('span',{'class':'bx',style:'left:'+b.bp[0]+'%;top:'+b.bp[1]+'%;width:'+b.bp[2]+'%;height:'+b.bp[3]+'%'});
  var img=h('img',{src:T(b.name),srcset:T(b.name)+' 1x, '+T2(b.name)+' 2x',loading:'lazy',alt:''});img.onclick=function(){openLB(L(b.name),b.name+' 框'+b.bi+' · '+(b.cur_zh||b.zh)+' · 识别置信 '+b.conf.toFixed(1)+'%',b.bp.join(','))};
  var res=h('div',{'class':'res'});
  var bA=h('button',{text:'采纳「'+b.zh+'」'}),bR=h('button',{'class':'rej',text:'不是鸟 / 忽略'}),bC=h('button',{'class':'chg',text:'改为…'});
  var inp=h('input',{list:'splist',placeholder:'输入中文名搜索，或手写名称'}),ok=h('button',{text:'确定'}),row=h('div',{'class':'chgrow',hidden:''},[inp,ok]);
  var meta=h('div',{'class':'meta'});meta.innerHTML='<b>'+b.name+'</b> · 框'+b.bi+' ';meta.appendChild(statusTag(b));meta.appendChild(document.createElement('br'));
  var m2=document.createElement('span');m2.innerHTML=metaHtml(b);meta.appendChild(m2);
  var acts=[bC,bR];if(b.status!=='ok'||b.cur_id!==b.id)acts.unshift(bA);
  var card=h('div',{'class':'card st-'+b.status,'data-key':b.key,'data-q':(b.name+' '+b.zh+' '+(b.en||'')+' '+b.cur_zh+' '+(b.cur_en||'')).toLowerCase(),'data-status':b.status},[h('span',{'class':'thumb'},[img,bx]),
   meta,h('div',{'class':'acts'},acts),row,res]);
  function upd(){var it=ST.items[b.key];res.textContent=desc(it);card.classList.toggle('done',!!it);
   bA.classList.toggle('on',!!it&&it.action==='accept');bR.classList.toggle('on',!!it&&it.action==='reject');bC.classList.toggle('on',!!it&&(it.action==='species'||it.action==='name'))}
  function set(it){var c=ST.items[b.key];if(c&&JSON.stringify(c)===JSON.stringify(it))delete ST.items[b.key];else ST.items[b.key]=it;save();upd()}
  bA.onclick=function(){set({action:'accept',zh:b.zh})};bR.onclick=function(){set({action:'reject'})};
  bC.onclick=function(){row.hidden=!row.hidden;if(!row.hidden)inp.focus()};
  function apply(){var v=inp.value.trim();if(!v)return;var id=byLabel[v];var m=v.match(/#(\d+)\s*$/);if(!id&&m&&SP[+m[1]])id=+m[1];
   if(id){ST.items[b.key]={action:'species',id:id}}else{if(!confirm('「'+v+'」不在物种列表里，将作为手写名提交，由人工处理。继续？'))return;ST.items[b.key]={action:'name',name:v}}save();upd();row.hidden=true}
  ok.onclick=apply;inp.onkeydown=function(e){if(e.key==='Enter')apply()};
  upd();box.appendChild(card)})}
function filter(){var q=document.getElementById('flt').value.trim().toLowerCase(),only=document.getElementById('onlyTodo').checked,vis=0;
 document.querySelectorAll('.card').forEach(function(c){var st=c.dataset.status,show=(TAB==='all'||st===TAB)&&(!q||c.dataset.q.indexOf(q)>=0)&&(!only||!ST.items[c.dataset.key]);c.hidden=!show;if(show)vis++});
 var n=document.getElementById('nbox');if(n)n.textContent='当前显示 '+vis+' / '+D.boxes.length+' 个框（待确认 '+counts().todo+' · 已采纳 '+counts().ok+' · 已忽略 '+counts().rej+'）'}
function renderPicks(){var root=document.getElementById('picks');
 D.atlas.forEach(function(s){if(s.all.length<2)return;var d=h('details',{'class':'sp'}),sm=h('summary');d.appendChild(sm);
  function cur(){return ST.picks[s.id]||s.picks}
  function sum(){sm.textContent=s.zh+'（'+s.order+' · '+s.family+'，共 '+s.all.length+' 张）推荐：'+cur().join('、')+(ST.picks[s.id]?'  ← 已修改，未提交':'')}
  sum();var built=false;
  d.addEventListener('toggle',function(){if(!d.open||built)return;built=true;var g=h('div',{'class':'pg'});var sel=(ST.picks[s.id]||[]).slice();
   var rs=h('button',{text:'恢复当前推荐'});rs.onclick=function(){delete ST.picks[s.id];save();sel=[];draw();sum()};
   function draw(){g.innerHTML='';var show=sel.length?sel:s.picks;s.all.forEach(function(n){var i=show.indexOf(n);
     var it=h('div',{'class':'pi'+(i>=0?' sel':'')},[h('img',{src:T(n),srcset:T(n)+' 1x, '+T2(n)+' 2x',loading:'lazy',title:n}),h('div',{'class':'fn',text:n})]);if(i>=0)it.appendChild(h('span',{'class':'no',text:String(i+1)}));
     it.onclick=function(){var j=sel.indexOf(n);if(j>=0)sel.splice(j,1);else{if(sel.length>=3){alert('最多 3 张，先点掉一张');return}sel.push(n)}
      if(sel.length&&sel.join()!==s.picks.join())ST.picks[s.id]=sel.slice();else delete ST.picks[s.id];save();draw();sum()};
     g.appendChild(it)})}
   draw();d.appendChild(h('p',{text:'点选顺序即展示顺序。'},[' ',rs]));d.appendChild(g)});
  root.appendChild(d)})}
function payload(items,picks,bn,bt){return{schema:'bird-atlas-annotation/1',generated:new Date().toISOString(),batch:bn+'/'+bt,items:items,picks:picks}}
function body(p){return '由 label.html 生成。流水线只处理 duanefaith 提交的、带 annotation 标签的 issue；请勿手改下面的 JSON。\n\n```json\n'+JSON.stringify(p)+'\n```\n'}
function url(p,bn,bt){return 'https://github.com/'+D.repo+'/issues/new?labels=annotation&title='+encodeURIComponent('标注提交 '+new Date().toLocaleString('zh-CN')+(bt>1?' ('+bn+'/'+bt+')':''))+'&body='+encodeURIComponent(body(p))}
function submit(){var items=Object.keys(ST.items).map(function(k){var it=ST.items[k],o={key:k,action:it.action};if(it.id)o.id=it.id;if(it.name)o.name=it.name;return o});
 var picks=Object.keys(ST.picks).map(function(k){return{species_id:+k,photos:ST.picks[k]}});
 if(!items.length&&!picks.length){alert('还没有任何选择');return}
 var LIM=6000,batches=[],cur={i:[],p:[]};
 function len(c){return url(payload(c.i,c.p,9,9),9,9).length}
 items.forEach(function(x){cur.i.push(x);if(len(cur)>LIM&&cur.i.length>1){cur.i.pop();batches.push(cur);cur={i:[x],p:[]}}});
 picks.forEach(function(x){cur.p.push(x);if(len(cur)>LIM&&(cur.i.length+cur.p.length)>1){cur.p.pop();batches.push(cur);cur={i:[],p:[x]}}});
 batches.push(cur);var n=batches.length,pane=document.getElementById('submitPane');pane.innerHTML='';pane.hidden=false;
 pane.appendChild(h('p',{html:'共 <b>'+items.length+'</b> 个框、<b>'+picks.length+'</b> 种推荐图，分 <b>'+n+'</b> 批。点下面的按钮会打开 GitHub 预填好的新 issue，确认后点 Submit new issue。提交成功后可以点「清空选择」。'}));
 batches.forEach(function(b,i){var u=url(payload(b.i,b.p,i+1,n),i+1,n);var a=h('button',{'class':'primary',text:'打开第 '+(i+1)+'/'+n+' 批（'+(b.i.length+b.p.length)+' 项）'});a.onclick=function(){window.open(u,'_blank')};pane.appendChild(a);pane.appendChild(document.createTextNode(' '))});
 if(n===1)window.open(url(payload(batches[0].i,batches[0].p,1,1),1,1),'_blank');
 var all=body(payload(items,picks,1,1));var ta=h('textarea',{readonly:''});ta.value=all;var cp=h('button',{text:'复制 JSON'});
 cp.onclick=function(){ta.select();(navigator.clipboard?navigator.clipboard.writeText(all):Promise.reject()).then(function(){cp.textContent='已复制'},function(){document.execCommand('copy');cp.textContent='已复制'})};
 pane.appendChild(h('p',{html:'备选：链接打不开或太长时，复制下面的全部内容，在 <a target="_blank" href="https://github.com/'+D.repo+'/issues/new?labels=annotation">新建 issue</a> 时粘贴到正文（记得加 annotation 标签）。'},[cp]));pane.appendChild(ta);pane.scrollIntoView()}
})();
