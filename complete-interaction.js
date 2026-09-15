(function(){
  'use strict';
  const $=selector=>document.querySelector(selector),d=window.LG01_DATA,pages=d.groups.flatMap(g=>g.pages),pageMap=Object.assign({},window.FoxPages,d.runtimePages||{});
  const {escape:esc,icon}=window.FoxScreen;
  const flow=window.FoxFlow;
  const machine=window.LG01Machine.createMachine(d),s=machine.state;
  const defaultLocale=document.body.dataset.defaultLocale==='zh-CN'?'zh-CN':'en';
  const view={scrollPositions:{},language:defaultLocale};
  const scrollKey=el=>el.closest('.device-screen').dataset.screenId+':'+el.dataset.scrollList;
  const session=window.LG01Review.createSession(d,machine,{capture:()=>{rememberScroll();return{...view,scrollPositions:{...view.scrollPositions}};},restore:v=>{view.scrollPositions={...v.scrollPositions};view.language=v.language||defaultLocale;}});
  const query=new URLSearchParams(location.search);
  view.language=['en','zh-CN'].includes(query.get('lang'))?query.get('lang'):defaultLocale;
  const rawPage=(query.get('page')||'').replace(/^p/i,''),normalized=rawPage.length===1?'0'+rawPage:rawPage,requested=d.runtimePages?.[normalized]?'79':d.pageAliases?.[normalized]||normalized;
  const legacyStepsEntry=requested==='74'&&query.get('entry')==='steps';
  const scenarios=[['setup','开机配网','Power'],['daily','日常操作','House'],['ai','直接对话','AudioLines'],['recording','语音记录','Mic'],['note','提醒处理','Bell'],['pet','宠物照顾','Heart'],['care','陪伴与放松','HeartHandshake'],['social','好友互动','Users'],['memories','回忆同步','Link'],['update','系统升级','Download'],['settings','设备设置','Settings'],['recovery','系统恢复','ShieldCheck']];
  const env={networkConnected:'模拟网络连接',cloudAvailable:'模拟云端可用',storageAvailable:'模拟存储可用',saveFail:'模拟保存失败',saveHang:'模拟保存无回执',socialAllowed:'模拟家长已允许社交',relationValid:'模拟好友关系有效'};
  let currentRendered=null,currentMarkup='',feedbackTimer=null,listDrag=null,suppressListClick=null,settingDrag=null,companionDrag=null;
  function rememberScroll(){document.querySelectorAll('#live-screen [data-scroll-list]').forEach(el=>{view.scrollPositions[scrollKey(el)]=Number(el.scrollTop)||0;});}
  function restoreScroll(){document.querySelectorAll('#live-screen [data-scroll-list]').forEach(el=>{const position=view.scrollPositions[scrollKey(el)]||0;if(el.scrollTop!==position)el.scrollTop=position;});}
  function moveList(el,value){el.scrollTop=Math.max(0,Math.min(value,Math.max(0,el.scrollHeight-el.clientHeight)));s.idleSeconds=0;rememberScroll();}
  function icons(){window.lucide.createIcons({attrs:{'aria-hidden':'true'}});}
  const copy=value=>view.language==='zh-CN'?window.FoxLocale.translate(String(value??'')):String(value??'');
  const matches=(p,q)=>!q||`p${p.n} ${p.title} ${p.ui.text} ${copy(p.title)} ${copy(p.ui.text)} ${flow.locations[p.n].groupTitle} ${flow.locations[p.n].sectionTitle}`.toLowerCase().includes(q);
  function syncLanguageLinks(){
    document.querySelectorAll('[data-locale]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.locale===view.language)));
    document.querySelectorAll('.workbench-header a[href]').forEach(el=>{const url=new URL(el.getAttribute('href'),location.href);if(!/\/(index|gallery)\.html$/.test(url.pathname))return;url.searchParams.set('lang',view.language);el.setAttribute('href',url.href);});
  }
  function showFeedback(text){if(!$('#review-feedback'))return;clearTimeout(feedbackTimer);$('#review-feedback').textContent=text;}
  function resizeDevices(){
    document.querySelectorAll('.device-holder').forEach(el=>{el.style.setProperty('--device-scale',Math.min(1,el.clientWidth/508));});
    const previews=[...document.querySelectorAll('.gallery-artboard')].map(el=>[el,el.clientWidth/480]);
    previews.forEach(([el,scale])=>el.style.setProperty('--preview-scale',scale));
  }
  function switchLanguage(locale){view.language=locale;s.language=locale;}
  function renderPageIndex(){
    const q=($('#page-search')?.value||'').trim().toLowerCase();
    $('#page-index').innerHTML=d.groups.map(g=>{
      const sections=g.sections.map(section=>{const found=section.pages.filter(p=>matches(p,q));return found.length?`<div><h4>${esc(section.title)}</h4>${found.map(p=>`<a href="index.html?page=${p.n}&mode=catalog&lang=${view.language}" data-preview="${p.n}"><span>P${p.n}</span>${esc(copy(p.title))}</a>`).join('')}</div>`:'';}).join('');
      return sections?`<section><h3>${esc(copy(g.title))}</h3>${sections}</section>`:'';
    }).join('')||'<p class="small-note">没有匹配页面</p>';
  }
  function render(){
    const p=pageMap[s.page],info=session.info();
    const focused=document.activeElement,focusedData=focused?.closest('#live-screen')&&focused.matches('button')?{...focused.dataset}:null;
    const focusedSetting=focused?.closest('#live-screen')&&focused.matches('input[data-setting]')?focused.dataset.setting:null;
    const focusedList=focused?.matches('[data-scroll-list]')?focused.dataset.scrollList:null;
    const focusedCarousel=focused?.matches('[data-companion-carousel]');
    const oldVideo=currentRendered===s.page?$('#live-screen video'):null;
    const markup=window.FoxScreen.render(p,{...s,language:view.language,micTask:machine.micTask()});
    // Keep unchanged lists mounted so native scrolling survives simulation ticks.
    if(settingDrag&&settingDrag.page!==s.page)settingDrag=null;
    if(companionDrag&&(companionDrag.page!==s.page||companionDrag.avatarId!==s.characterId))cancelCompanionDrag();
    const changed=(markup!==currentMarkup||currentRendered!==s.page)&&!settingDrag&&!companionDrag;
    if(changed){$('#live-screen').innerHTML=markup;currentMarkup=markup;if(oldVideo&&$('#live-screen video'))$('#live-screen video').replaceWith(oldVideo);}
    restoreScroll();
    currentRendered=s.page;
    $('#page-code').textContent='P'+p.n;$('#page-name').textContent=copy(p.title);document.title=`P${p.n} ${copy(p.title)} · LG01 交互原型`;
    const position=flow.locations[p.n]||{groupTitle:'系统状态',sectionTitle:'显示关闭',kind:'states',index:0,total:1},kind=flow.kinds[position.kind];
    $('#review-context').innerHTML=`<a href="gallery.html?lang=${view.language}#p${p.n}">${esc(position.groupTitle)}</a>${icon('ChevronRight')}<span>${esc(position.sectionTitle)}</span><span class="review-stage-kind">${esc(kind.label)} · ${position.index+1} / ${position.total}</span>`;
    $('#page-summary').textContent=copy(p.summary);$('#page-trigger').textContent=copy(p.trigger);$('#page-feedback').textContent=copy(p.feedback);$('#page-edge').textContent=copy(p.edge);
    $('#capture-state').textContent=({none:s.careEnabled?'陪伴已开启，当前暂停监听':'未采集',ai:'模拟对话收音',recording:'模拟录音',care:'模拟陪伴监听'})[machine.micTask()];
    $('#visited-count').textContent=`已查看 ${info.visited} / ${info.total}`;
    $('#previous').disabled=!info.canBack;$('#next').disabled=!info.canNext;
    $('#next').title=(info.mode==='catalog'?'下一页 · ':'下一步 · ')+copy(info.next);
    $('#next span').textContent=info.mode==='catalog'?'下一画面':'下一步';
    $('#clock').innerHTML=icon(info.playing?'Pause':'Play');$('#clock').setAttribute('aria-pressed',String(info.playing));
    $('#clock').title=info.playing?'暂停模拟计时':'运行模拟计时';$('#clock').setAttribute('aria-label',$('#clock').title);
    $('[data-mode="flow"]').setAttribute('aria-pressed',String(info.mode==='flow'));$('[data-mode="catalog"]').setAttribute('aria-pressed',String(info.mode==='catalog'));
    $('#branches').innerHTML=session.options().map(o=>`<button type="button" class="branch-row" data-branch="${esc(o.key)}"><span>${esc(copy(o.label.replace(/ → P.+$/,'')))}</span><span>${o.target?'P'+o.target:'等待回执'} ${icon('ArrowRight')}</span>${o.route?.guard?`<small>${esc(copy(o.route.guard))}</small>`:''}</button>`).join('')||'<p class="small-note">此页没有自动流转，请使用屏幕按钮或设备输入。</p>';
    document.querySelectorAll('[data-env]').forEach(el=>el.checked=!!s[el.dataset.env]);
    document.querySelectorAll('[data-dock]').forEach(el=>el.disabled=el.dataset.dock==='connect'?s.dock.connected:el.dataset.dock==='remove'?!s.dock.sessionId:!s.dock.connected);
    syncLanguageLinks();
    document.querySelectorAll('#live-screen video').forEach(video=>{video.muted=true;video.onerror=()=>{const img=document.createElement('img');img.src=video.poster;img.alt='Lumi';img.className=video.className;video.replaceWith(img);};if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){video.pause();video.removeAttribute('autoplay');}});
    icons();resizeDevices();
    if(changed&&focusedData){const next=[...document.querySelectorAll('#live-screen button')].find(el=>focusedData.focusKey?el.dataset.focusKey===focusedData.focusKey:Object.entries(focusedData).every(([key,value])=>el.dataset[key]===value));next?.focus({preventScroll:true});}
    if(changed&&focusedSetting)$('#live-screen input[data-setting="'+focusedSetting+'"]')?.focus({preventScroll:true});
    if(changed&&focusedList)$('#live-screen [data-scroll-list="'+focusedList+'"]')?.focus({preventScroll:true});
    if(changed&&focusedCarousel)$('#live-screen [data-companion-carousel]')?.focus({preventScroll:true});
    if(s.page==='183'||s.page==='177')$('#live-screen [data-event="RECORD_KEEP"], #live-screen [data-event="REC_DISCARD_CANCEL"]')?.focus({preventScroll:true});
    if(s.statusMessage)showFeedback(copy(s.statusMessage));else showFeedback('');
    const url=new URL(location.href);url.searchParams.set('page',s.page);url.searchParams.set('mode',info.mode);url.searchParams.set('lang',view.language);history.replaceState(null,'',url);
  }
  function dispatch(event,payload={},device=false){
    if(event==='LANGUAGE_SET')s.language=view.language;
    if(device&&!document.hidden)session.deviceDispatch(event,payload);else session.dispatch(event,payload);
    if(event==='LANGUAGE_SET')view.language=s.language;
    render();
  }
  function payload(el){const p={};const keys={target:'target',key:'key',value:'value',mode:'mode',noteId:'noteId',requestId:'requestId',recordId:'recordId',avatarId:'avatarId',actionId:'actionId',baseRevision:'baseRevision',feedbackId:'feedbackId',peerId:'peerId',attemptId:'attemptId',encounterId:'encounterId'};for(const [attr,key]of Object.entries(keys))if(el.dataset[attr]!==undefined)p[key]=attr==='baseRevision'?Number(el.dataset[attr]):el.dataset[attr];return p;}
  function gesture(direction,region){
    const list=$('#live-screen [data-scroll-list]');
    if(list&&['up','down'].includes(direction)){moveList(list,list.scrollTop+(direction==='up'?220:-220));return;}
    if(document.hidden)session.perform(()=>machine.gesture(direction,region));else session.devicePerform(()=>machine.gesture(direction,region));render();
  }
  function blockDraggedClick(event){
    if(event.detail===0||!suppressListClick||Date.now()>=suppressListClick.until||event.pointerId!=null&&event.pointerId!==suppressListClick.id)return false;
    event.preventDefault();event.stopImmediatePropagation();suppressListClick=null;return true;
  }
  function liveClick(event){
    if(blockDraggedClick(event))return;
    const el=event.target.closest('[data-event]');if(!el||el.disabled)return;
    const name=el.dataset.event;
    dispatch(name,payload(el),true);
  }
  function setupGallery(){
    let group=d.groups.some(g=>g.id===query.get('group'))?query.get('group'):'all',search=(query.get('q')||'').trim().toLowerCase();
    const initialAnchor=new URL(location.href).hash.match(/^#p(\d+)$/);
    const fixture=window.LG01Review.createSession(d,machine);
    const previews=new Map();
    function card(p,section,variant=''){
      const photo=section.id==='pet-photo'&&['102','186'].includes(p.n),key=view.language+':'+p.n+(photo?':photo':'');
      if(!previews.has(key)){fixture.preview(p.n,photo?'photo':undefined);previews.set(key,window.FoxScreen.render(p,{...s,language:view.language,still:true}));}
      const link=`index.html?page=${p.n}&mode=flow&lang=${view.language}${photo?'&entry=photo':''}`,title=esc(photo&&p.n==='102'?'照片角色生成失败':photo&&p.n==='186'?'稍后查看照片角色':variant==='steps-daily'?'日常 · 今日步数入口':variant==='daily-menu'?'环形菜单 · 日常入口':variant==='growth-menu'?'环形菜单 · 我的伙伴与等级':copy(p.title));
      const position=flow.locations[p.n],stepNumber=['reminders-entry','reminders-steps'].includes(section.id)?(variant?1:2):position.index+1;
      const step=section.kind==='path'&&!variant.startsWith('shared-')?`<span class="flow-step">${String(stepNumber).padStart(2,'0')}</span>`:'';
      const shared=variant.startsWith('shared-')?`<span class="gallery-shared-label">${view.language==='en'?'Shared':'共用'}</span>`:'';
      const preview=previews.get(key);
      return `<article class="gallery-item${variant?' gallery-entry-variant':''}" id="p${p.n}${variant?'-'+variant:''}" tabindex="-1" data-flow="${section.id}"${variant?` data-menu-entry="${variant}"`:''}><div class="gallery-card-meta">${step}${shared}<span>P${p.n}</span></div><div class="gallery-artboard"><div class="gallery-screen" inert aria-hidden="true">${preview}</div><a href="${link}" aria-label="打开 P${p.n} ${title} 交互页面"></a></div><a class="gallery-caption" href="${link}"><h4>${title}</h4></a></article>`;
    }
    function sectionMarkup(section){
      const kind=flow.kinds[section.kind],links=section.links.map(link=>`<a class="flow-link" href="gallery.html?lang=${view.language}#p${link.n}" data-gallery-page="${link.n}"><span>${esc(link.label)}</span>${icon('ArrowRight')}<strong>P${link.n}</strong></a>`).join('');
      const pagesMarkup=section.pages.map(p=>card(p,section)).join('');
      const entryMarkup=section.id==='reminders-entry'?card(pageMap['74'],section,'daily-menu'):section.id==='reminders-steps'?card(pageMap['187'],section,'steps-daily'):section.id==='pet-growth'?card(pageMap['74'],section,'growth-menu')+card(pageMap['93'],section,'growth-profile'):'';
      const relatedMarkup=(section.related||[]).map(p=>card(p,section,'shared-'+section.id)).join('');
      return `<section class="gallery-flow kind-${section.kind}" id="flow-${section.id}" aria-labelledby="heading-${section.id}"><header class="gallery-flow-heading"><h3 id="heading-${section.id}">${esc(section.title)}</h3><span class="flow-kind">${icon(kind.icon)}${esc(kind.label)}</span></header><div class="flow-screens">${entryMarkup}${pagesMarkup}${relatedMarkup}</div>${links?`<nav class="flow-connections" aria-label="${esc(section.title)}接续页面">${links}</nav>`:''}</section>`;
    }
    function gallery(){
      const selected=d.groups.filter(g=>group==='all'||g.id===group).map(g=>({...g,sections:g.sections.map(section=>({...section,pages:section.pages.filter(p=>matches(p,search))})).filter(section=>section.pages.length),pages:g.pages.filter(p=>matches(p,search))})).filter(g=>g.pages.length);
      $('#group-tabs').innerHTML=[['all','全部'],...d.groups.map((g,i)=>[g.id,String(i+1).padStart(2,'0')+' '+g.title])].map(([id,title])=>`<button type="button" data-group="${id}" aria-pressed="${id===group}">${esc(copy(title))}</button>`).join('');
      $('#gallery-count').textContent=`共 ${pages.length} 页 · ${d.groups.length} 个模块 · 当前显示 ${selected.reduce((sum,g)=>sum+g.pages.length,0)} 页`;
      $('#gallery-grid').innerHTML=selected.map(g=>`<section class="gallery-module" aria-labelledby="group-${g.id}"><h2 class="gallery-group-heading" id="group-${g.id}"><span class="module-number">${String(d.groups.findIndex(item=>item.id===g.id)+1).padStart(2,'0')}</span>${esc(copy(g.title))}<span>${g.pages.length} 页</span></h2>${g.sections.map(sectionMarkup).join('')}</section>`).join('')||'<p role="status">没有匹配页面</p>';
      syncLanguageLinks();icons();resizeDevices();
      const url=new URL(location.href);url.searchParams.set('lang',view.language);if(group==='all')url.searchParams.delete('group');else url.searchParams.set('group',group);if(search)url.searchParams.set('q',search);else url.searchParams.delete('q');if(url.hash&&!document.getElementById(url.hash.slice(1)))url.hash='';history.replaceState(null,'',url);
    }
    function revealPage(n){
      n=d.runtimePages?.[n]?'79':d.pageAliases?.[n]||n;
      if(!pageMap[n])return;
      if(!$('#p'+n)){group='all';search='';$('#gallery-search').value='';gallery();}
      const target=$('#p'+n);target?.focus({preventScroll:true});target?.scrollIntoView?.({block:'start',behavior:'auto'});
      const url=new URL(location.href);url.searchParams.set('lang',view.language);if(group==='all')url.searchParams.delete('group');else url.searchParams.set('group',group);if(search)url.searchParams.set('q',search);else url.searchParams.delete('q');url.hash='p'+n;history.replaceState(null,'',url);
    }
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-gallery-page]');
      if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
        event.preventDefault();
        const local=link.closest('.gallery-module')?.querySelector(`[id^="p${link.dataset.galleryPage}-shared-"]`);
        if(local){local.focus({preventScroll:true});local.scrollIntoView?.({block:'start',behavior:'auto'});return;}
        revealPage(link.dataset.galleryPage);return;
      }
      const el=event.target.closest('[data-group],[data-locale]');if(!el||el.disabled)return;const active=el.dataset.group;if(active)group=active;if(el.dataset.locale)view.language=el.dataset.locale;gallery();if(active)document.querySelector(`[data-group="${active}"]`)?.focus({preventScroll:true});
    });
    $('#gallery-search').value=search;
    $('#gallery-search').addEventListener('input',event=>{search=event.target.value.trim().toLowerCase();gallery();});
    gallery();
    if(initialAnchor)revealPage(initialAnchor[1]);
  }
  window.addEventListener('resize',resizeDevices);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeDevices).observe(document.body);
  if(document.body.dataset.view==='gallery'){setupGallery();return;}
  $('#scenarios').innerHTML=scenarios.map(([id,label,symbol])=>`<button type="button" data-scenario="${id}">${icon(symbol)}<span>${label}</span></button>`).join('');
  $('#environment').innerHTML=Object.entries(env).map(([key,label])=>`<label><input type="checkbox" data-env="${key}"><span>${label}</span></label>`).join('');
  $('#previous').addEventListener('click',()=>{session.back();currentRendered=null;render();});
  $('#next').addEventListener('click',()=>{const before=s.page;session.next();render();if(s.page===before)showFeedback(s.statusMessage||'状态保持不变；请操作圆屏或选择其他分支。');});
  $('#clock').addEventListener('click',()=>{session.toggleTime();render();});
  $('#live-screen').addEventListener('click',liveClick);
  $('#live-screen').addEventListener('scroll',event=>{if(event.target.matches('[data-scroll-list]')){s.idleSeconds=0;rememberScroll();}},true);
  $('#live-screen').addEventListener('pointerdown',event=>{
    if(event.isPrimary===false)return;
    if(event.target.matches('input[data-setting]')&&event.button<=0){settingDrag={id:event.pointerId,page:s.page};return;}
    suppressListClick=null;
    const carousel=event.target.closest('[data-companion-carousel]');
    if(carousel&&!event.target.closest('button,input')&&event.button<=0){
      companionDrag={el:carousel,page:s.page,avatarId:s.characterId,id:event.pointerId,startX:event.clientX,startY:event.clientY,scale:carousel.closest('.device-screen').getBoundingClientRect().width/480||1,axis:null,moved:false};
      s.idleSeconds=0;carousel.setPointerCapture?.(event.pointerId);return;
    }
    const el=event.target.closest('[data-scroll-list]');if(!el||event.isPrimary===false||event.button>0)return;
    const scale=el.closest('.device-screen').getBoundingClientRect().width/480||1;
    listDrag={el,id:event.pointerId,type:event.pointerType,startX:event.clientX,startY:event.clientY,startTop:el.scrollTop||0,scale,moved:false};
  });
  document.addEventListener('pointermove',event=>{
    if(companionDrag&&event.pointerId===companionDrag.id){
      const drag=companionDrag,dx=(event.clientX-drag.startX)/drag.scale,dy=(event.clientY-drag.startY)/drag.scale;
      if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){drag.axis=Math.abs(dx)>Math.abs(dy)*1.25?'horizontal':'vertical';drag.moved=true;}
      if(drag.axis==='horizontal'){
        event.preventDefault();drag.el.classList.add('is-swiping');
        if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)drag.el.querySelector('.pet-carousel-card').style.transform=`translateX(${Math.max(-24,Math.min(24,dx*.35))}px)`;
      }
      return;
    }
    if(!listDrag||event.pointerId!==listDrag.id)return;
    const dx=event.clientX-listDrag.startX,dy=event.clientY-listDrag.startY;
    if(Math.max(Math.abs(dx),Math.abs(dy))>=8)listDrag.moved=true;
    // Touch keeps native momentum. Mouse/pen dragging is an equivalent review input.
    if(listDrag.moved&&listDrag.type!=='touch'){
      event.preventDefault();listDrag.el.classList.add('is-dragging');moveList(listDrag.el,listDrag.startTop-dy/listDrag.scale);
    }
  });
  function finishListDrag(event){
    if(!listDrag||event.pointerId!==listDrag.id)return;
    if(listDrag.moved||event.type==='pointercancel')suppressListClick={id:listDrag.id,until:Date.now()+500};
    listDrag.el.classList.remove('is-dragging');rememberScroll();listDrag=null;
  }
  document.addEventListener('pointerup',finishListDrag);
  document.addEventListener('pointercancel',finishListDrag);
  function cancelCompanionDrag(){
    if(!companionDrag)return;
    const {el,id}=companionDrag;companionDrag=null;
    el.classList.remove('is-swiping');el.querySelector('.pet-carousel-card').style.transform='';
    if(el.hasPointerCapture?.(id))el.releasePointerCapture(id);
  }
  function finishCompanionDrag(event){
    const drag=companionDrag;if(!drag||event.pointerId!==drag.id)return;
    const dx=(event.clientX-drag.startX)/drag.scale,dy=(event.clientY-drag.startY)/drag.scale;
    cancelCompanionDrag();
    if(drag.moved||event.type==='pointercancel')suppressListClick={id:drag.id,until:Date.now()+500};
    if(event.type!=='pointercancel'&&drag.axis==='horizontal'&&Math.abs(dx)>=40&&Math.abs(dx)>Math.abs(dy)*1.25&&s.page===drag.page){
      dispatch(dx<0?'PET_COMPANION_NEXT':'PET_COMPANION_PREV',{avatarId:drag.avatarId},true);
    }else render();
  }
  document.addEventListener('pointerup',finishCompanionDrag);
  document.addEventListener('pointercancel',finishCompanionDrag);
  $('#live-screen').addEventListener('click',blockDraggedClick,true);
  $('#live-screen').addEventListener('keydown',event=>{
    if(event.target.closest('[data-companion-carousel]')&&['ArrowLeft','ArrowRight'].includes(event.key)){
      event.preventDefault();event.stopPropagation();dispatch(event.key==='ArrowRight'?'PET_COMPANION_NEXT':'PET_COMPANION_PREV',{avatarId:s.characterId},true);return;
    }
    const el=event.target;if(!el.matches('[data-scroll-list]'))return;
    const steps={ArrowDown:64,ArrowUp:-64,PageDown:Math.max(64,el.clientHeight-24),PageUp:-Math.max(64,el.clientHeight-24)};
    if(event.key in steps){event.preventDefault();moveList(el,(el.scrollTop||0)+steps[event.key]);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();moveList(el,event.key==='Home'?0:el.scrollHeight);}
  });
  $('#live-screen').addEventListener('input',event=>{
    const key=event.target.dataset.setting;if(!key)return;
    if(key==='playhead')session.dispatch('RECORD_SEEK',{value:event.target.value});
    else session.dispatch('SETTING',{key,value:event.target.value});
    if(['volume','brightness'].includes(key)){
      const value=s[key],min=Number(event.target.min),max=Number(event.target.max);
      event.target.value=String(value);event.target.setAttribute('aria-valuetext',value+'%');
      const out=event.target.closest('label')?.querySelector('output');if(out)out.textContent=value+'%';
      event.target.parentElement?.style.setProperty('--level',((value-min)/(max-min)*100)+'%');
    }
  });
  function finishSettingDrag(event){if(settingDrag&&event.pointerId===settingDrag.id){settingDrag=null;render();}}
  document.addEventListener('pointerup',finishSettingDrag);
  document.addEventListener('pointercancel',finishSettingDrag);
  $('#live-screen').addEventListener('change',event=>{if(event.target.dataset.setting)render();});
  $('#page-search').addEventListener('input',renderPageIndex);
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-branch],[data-scenario],[data-mode],[data-locale],[data-preview],[data-inject],[data-gesture],[data-dock]');if(!el||el.disabled)return;
    if(el.dataset.branch){session.applyOption(el.dataset.branch,!document.hidden);render();}
    if(el.dataset.scenario){const locale=view.language;session.start(el.dataset.scenario);switchLanguage(locale);render();}
    if(el.dataset.mode){session.setMode(el.dataset.mode);render();}
    if(el.dataset.locale){switchLanguage(el.dataset.locale);render();renderPageIndex();}
    if(el.dataset.preview){event.preventDefault();session.setMode('catalog');session.preview(el.dataset.preview);render();}
    if(el.dataset.inject)dispatch(el.dataset.inject,{},true);
    if(el.dataset.dock)dispatch({connect:'DOCK_CONNECTED',remove:'DOCK_REMOVED',full:'CHARGE_UPDATED',error:'DOCK_CONTACT_ERROR'}[el.dataset.dock],{sessionId:s.dock.sessionId,revision:s.dock.revision+1,battery:100,status:'full'},true);
    if(el.dataset.gesture)gesture(el.dataset.gesture,s.page==='93'?'companions':undefined);
  });
  $('#environment').addEventListener('change',event=>{if(event.target.dataset.env)dispatch('ENV',{key:event.target.dataset.env,value:event.target.checked});});
  let swiping=null,ignoreClick=false;
  $('#live-screen').addEventListener('pointerdown',event=>{swiping=null;if(!event.target.closest('button,input,[data-scroll-list],[data-companion-carousel]'))swiping={x:event.clientX,y:event.clientY,id:event.pointerId};});
  $('#live-screen').addEventListener('pointerup',event=>{if(!swiping||swiping.id!==event.pointerId)return;const dx=event.clientX-swiping.x,dy=event.clientY-swiping.y;swiping=null;if(Math.max(Math.abs(dx),Math.abs(dy))<40)return;ignoreClick=true;gesture(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');setTimeout(()=>ignoreClick=false,0);});
  $('#live-screen').addEventListener('pointercancel',()=>swiping=null);
  $('#live-screen').addEventListener('click',event=>{if(ignoreClick){event.preventDefault();event.stopImmediatePropagation();}},true);
  const recognizer=window.LG01Input.createRecognizer(event=>{
    if(event==='DISPLAY_TOGGLE')event=['119','120','121','79'].includes(s.page)?s.powerOn?'WAKE':'POWER_ON':'SCREEN_OFF';
    if(event==='POWER_HOLD')event=s.powerOn?'POWER_CONFIRM':'POWER_ON';
    if(event==='REC_TOGGLE')event=s.recording?'REC_STOP':'REC_START';
    dispatch(event,{},true);
  });
  document.querySelectorAll('[data-key]').forEach(el=>{
    el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);recognizer.down(el.dataset.key);});
    el.addEventListener('pointerup',()=>recognizer.up(el.dataset.key));el.addEventListener('pointercancel',()=>recognizer.cancel());
    el.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();recognizer.down(el.dataset.key);}});
    el.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();recognizer.up(el.dataset.key);}});
  });
  window.addEventListener('blur',()=>{recognizer.cancel();if(listDrag)finishListDrag({pointerId:listDrag.id,type:'pointercancel'});if(settingDrag)finishSettingDrag({pointerId:settingDrag.id});if(companionDrag)finishCompanionDrag({pointerId:companionDrag.id,type:'pointercancel'});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){recognizer.cancel();if(listDrag)finishListDrag({pointerId:listDrag.id,type:'pointercancel'});if(settingDrag)finishSettingDrag({pointerId:settingDrag.id});if(companionDrag)finishCompanionDrag({pointerId:companionDrag.id,type:'pointercancel'});if(session.info().playing)session.toggleTime();}});
  let elapsed=0;
  setInterval(()=>{recognizer.tick();if(!session.info().playing||document.hidden)return;if(s.page==='23'){elapsed=0;session.tick(.1);render();return;}elapsed+=.1;if(elapsed>=1){elapsed=0;const focus=document.activeElement;if(focus?.tagName==='INPUT'||listDrag||companionDrag)return;session.tick(1);render();}},100);
  document.addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,button,a,summary'))return;
    if(event.key==='ArrowLeft'){event.preventDefault();session.back();render();}
    if(event.key==='ArrowRight'){event.preventDefault();session.next();render();}
    if(event.key==='Escape')dispatch('BACK');
  });
  if(legacyStepsEntry)session.preview('187');
  else if(pageMap[requested])session.preview(requested,query.get('entry'));
  if(query.get('mode')==='catalog')session.setMode('catalog');
  else if(requested==='23'&&!document.hidden)session.toggleTime();
  switchLanguage(view.language);renderPageIndex();render();
  window.FoxPrototype={machine,session,view,render};
})();
