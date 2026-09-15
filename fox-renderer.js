(function(global){
  'use strict';
  const base=global.LG01Screen.render;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assets={lumi:'lumi-ip-fox-choice.png',pico:'lumi-ip-bird.png',momo:'lumi-ip-bunny.png'};
  const names={lumi:'Lumi',pico:'Pico',momo:'Momo'};
  const NO_AUTO_BACK=new Set(['01','02','03','04','05','07','09','34','35','48','78','101','111','112','119','120','147','148','50','151','153','155','122']);
  const companionAsset=companion=>assets[companion?.appearance]||assets[companion?.id]||assets.lumi;
  const image=s=>companionAsset(s.availableCompanions?.find(c=>c.id===s.characterId)||{id:s.characterId});
  const time=n=>`${String(Math.floor(Math.max(0,n||0)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,n||0)%60)).padStart(2,'0')}`;
  function icon(name){const def=global.lucide?.icons[name];if(!def)return '';const svg=global.lucide.createElement(def);svg.setAttribute('aria-hidden','true');svg.setAttribute('class','ui-icon');return svg.outerHTML;}
  function button(label,event,target='',name='',cls=''){
    return `<button type="button" class="fox-button ${cls}" data-event="${event}" data-target="${target}" aria-label="${esc(label)}" title="${esc(label)}">${name?icon(name):''}${cls.includes('icon-only')?'':`<span>${esc(label)}</span>`}</button>`;
  }
  const back=(target='10',event='BACK')=>button('Back',event,target,'ArrowLeft','fox-back icon-only');
  const header=(label,target='10',event='BACK')=>`<header class="fox-header">${back(target,event)}<h2>${esc(label)}</h2></header>`;
  const headerNoBack=label=>`<header class="fox-header fox-header-no-back"><h2>${esc(label)}</h2></header>`;
  const figure=(s,cls='')=>`<img class="fox-figure ${cls}" src="${image(s)}" alt="${esc(s.characterName||'Lumi')}" draggable="false">`;
  const wrap=(id,content,cls='')=>`<div class="device-screen fox-screen ${cls}" data-screen-id="${id}">${content}</div>`;
  function batteryStatus(s,compact=false){
    const connected=!!s.dock?.connected,full=connected&&s.dock.status==='full',paused=connected&&s.dock.status==='paused';
    const label=full?'Fully charged':paused?'Charging paused':'Charging';
    return `${icon(connected?(full?'BatteryFull':paused?'Battery':'BatteryCharging'):'Battery')}<span>${s.battery??78}%</span>${connected&&!compact?`<small class="dock-charge-label">${label}</small>`:''}`;
  }
  function chargeScreen(id,s){
    const dim=id==='79';
    const full=id==='26'||s.dock?.status==='full',paused=s.dock?.status==='paused';
    const title=full?'Fully charged':paused?'Charging paused':id==='23'?'Charging started':'Charging';
    const subtitle=full?'Battery is full':paused?'Charging will resume when the dock is ready':'Keep LG01 on the dock';
    const iconName=full?'BatteryFull':paused?'BatteryWarning':'BatteryCharging';
    return wrap(id,`<main class="charge-state ${full?'is-full':paused?'is-paused':'is-charging'}" aria-live="polite"><div class="charge-ring"><div class="charge-icon">${icon(iconName)}</div><strong>${s.battery??78}%</strong></div><h2>${esc(title)}</h2>${dim?'':`<p>${esc(subtitle)}</p>`}</main>${dim?'':button('Menu','OPEN_MENU','74','ChevronUp','charge-menu icon-only')}`,'charge-page'+(dim?' is-charge-dim':''));
  }
  function native(which,id,s){
    const template=document.createElement('template');template.innerHTML=global.FoxTemplates[which];
    const el=template.content;
    const mapping={home:['NAVIGATE','10'],apps:['NAVIGATE','74'],notifications:['NAVIGATE','77'],controls:['NAVIGATE','180'],care:['NAVIGATE','82'],friends:['NAVIGATE','185'],voice:['NAVIGATE','70'],chat:['AI_START','161'],'end-chat':['AI_END','76'],'cycle-chat':[id==='16'?'AI_INTERRUPT':'AI_INPUT_END','']};
    el.querySelectorAll('[data-action]').forEach(node=>{
      const pair=mapping[node.dataset.action];if(pair){node.dataset.event=pair[0];node.dataset.target=pair[1];}node.removeAttribute('data-action');
    });
    el.querySelectorAll('img[data-companion-image],.character-button img').forEach(node=>{node.src=image(s);node.alt=s.characterName||'Lumi';});
    if(which==='home'){
      el.querySelector('.battery-status').innerHTML=batteryStatus(s);
      if(s.dock?.connected)el.firstElementChild.classList.add('is-charging');
      const status=el.querySelector('.status-item');
      status.innerHTML=icon(s.micLocked?'MicOff':s.networkConnected&&s.wifiEnabled?'Wifi':'WifiOff')+(s.careActive?icon('AudioLines'):'');
      if(s.careActive){status.setAttribute('role','img');status.setAttribute('aria-label','Companion listening');status.setAttribute('title','Companion listening');}
      const date=el.querySelector('.clock-date-copy');date.textContent=s.language==='zh-CN'?'9 月 12 日 · 周六':'Sat · Sep 12';
      el.querySelector('.character-button').setAttribute('aria-label','AI Chat');
    }
    if(which==='apps'){
      const homeTile=el.querySelector('.tile-home > span:last-child');
      homeTile.textContent='My companion';
      const homeButton=el.querySelector('.tile-home');
      homeButton.dataset.target='93';homeButton.classList.add('tile-pet');
      homeButton.setAttribute('aria-label','My companion');homeButton.setAttribute('title','My companion');
      homeButton.querySelector('.app-icon').innerHTML=icon('Smile');
      const dailyButton=el.querySelector('.tile-lavender');
      dailyButton.dataset.target='187';dailyButton.setAttribute('aria-label','Daily');dailyButton.setAttribute('title','Daily');
      dailyButton.querySelector('span:last-child').textContent='Daily';dailyButton.querySelector('.app-icon').innerHTML=icon('CalendarDays');
      el.querySelector('.tile-peach:not(.app-tile-chat) > span:last-child').textContent='Companion';
      const careButton=el.querySelector('.tile-peach:not(.app-tile-chat)');
      careButton.dataset.target=s.careEnabled?'58':'82';careButton.setAttribute('aria-label',s.careEnabled?'Companion on':'Companion off');
      careButton.setAttribute('title',s.careEnabled?'Companion on':'Companion off');
      if(s.careEnabled){careButton.classList.add('care-is-on');careButton.querySelector('.app-icon').insertAdjacentHTML('beforeend','<i class="care-menu-dot" aria-hidden="true"></i>');}
      el.querySelectorAll('.scene-header,.page-position').forEach(node=>node.remove());
      return wrap(id,`<div class="fox-menu-wheel"><div class="fox-native">${el.firstElementChild.outerHTML}</div></div>`,'is-native native-apps');
    }
    if(which==='chat'){
      el.querySelector('.chat-back').dataset.event='AI_END';el.querySelector('.chat-back').dataset.target='76';
      const mode={'14':'Listening','15':'Thinking','16':'Speaking'}[id];
      const state=el.querySelector('[data-original-id="session-state"]');
      state.textContent=mode;
      const stateWrap=document.createElement('div');
      stateWrap.className='chat-state-below';
      const stateIcon={'Listening':'AudioLines','Thinking':'Sparkles','Speaking':'Volume2'}[mode]||'AudioLines';
      stateWrap.innerHTML=`<span class="chat-state-icon" aria-hidden="true">${icon(stateIcon)}</span>`;
      state.parentNode.insertBefore(stateWrap,state);
      stateWrap.appendChild(state);
      const capturing=id==='14'&&s.aiActive&&!s.micLocked;
      el.querySelector('.privacy-pill').innerHTML=icon(capturing?'Mic':'MicOff')+`<span data-original-id="privacy-state">${capturing?'Mic on':s.aiActive?'Capture paused':'Not capturing'}</span>`;
      el.querySelector('[data-original-id="session-time"]').textContent=time(s.clock-s.enteredAt);
      el.querySelector('[data-original-id="session-hint"]').innerHTML=icon('X')+'<span>End</span>';
      el.querySelector('[data-original-id="session-hint"]').setAttribute('aria-label','End');
      el.querySelector('.chat-character').setAttribute('aria-label',id==='16'?'Interrupt':'Send voice');
      el.querySelector('.chat-character').disabled=id==='15';
      const video=el.querySelector('video');
      video.setAttribute('poster',image(s));video.setAttribute('src','animal-greeting.mp4');
      video.setAttribute('aria-label',s.characterName+' '+mode);video.setAttribute('preload','metadata');
      if(s.still||s.characterId&&s.characterId!=='lumi'){const img=document.createElement('img');img.src=image(s);img.alt=s.characterName;img.className='chat-character-video';video.replaceWith(img);}
      const waveform=el.querySelector('.voice-visual');waveform.className='voice-visual is-'+mode.toLowerCase();
    }
    return wrap(id,`<div class="fox-native">${el.firstElementChild.outerHTML}</div>`,'is-native native-'+which);
  }
  function companionControl(id,s){
    const enabled=!!s.careEnabled,listening=enabled&&s.careActive&&!s.micLocked;
    const state=listening?'Listening':enabled?'Listening paused':'Off';
    return wrap(id,header('Companion','74')+`<div class="care-switch-content">${figure(s)}<h3>${enabled?'I am here with you':'Here when you need me'}</h3>${enabled?`<p class="care-capture-state" role="status">${icon(listening?'AudioLines':'MicOff')}<span>${state}</span></p>`:'<p class="care-consent-note">Listens to your voice when on</p>'}</div><div class="care-switch-row"><span>Companion</span><button type="button" class="care-toggle" role="switch" aria-label="Companion" aria-checked="${enabled}" data-focus-key="care-switch" data-event="${enabled?'CARE_END':'CARE_START'}" data-target="${enabled?'82':'58'}"><span aria-hidden="true"></span></button></div>`,'care-switch-page');
  }
  function language(s){
    const selected=s.deviceLanguage||s.language;
    return wrap('178',headerNoBack('Language')+`<div class="fox-language" data-scroll-list="languages" tabindex="0" role="region" aria-label="Language">${global.LG01_DATA.deviceLanguages.map(({value,label})=>`<button type="button" data-event="LANGUAGE_SET" data-value="${value}" aria-pressed="${selected===value}"><span lang="${value}" translate="no">${esc(label)}</span>${selected===value?icon('Check'):''}</button>`).join('')}</div><div class="fox-footer">${button('Continue','LANGUAGE_DONE','','Check','primary')}</div>`);
  }
  function qr(s){return wrap('02',headerNoBack('Device setup')+`<div class="fox-qr"><img src="assets/setup-demo-1.png" alt="Pairing QR code"><p>Scan with the LUMIQ app</p></div>`);}
  function companions(s){
    const switching=s.companionOrigin==='pet',fromFriend=s.companionOrigin==='friends';
    const choices=Array.isArray(s.availableCompanions)&&s.availableCompanions.length?s.availableCompanions:Object.keys(assets).map(id=>({id,name:names[id]}));
    const title=switching?'Manage companions':fromFriend?'My companions':'My character';
    const selected=s.pendingCompanion||s.characterId||'lumi';
    const photos=Object.values(s.photoRequests||{}).filter(r=>!choices.some(c=>c.id===r.resultId));
    const photoItems=photos.map(r=>`<button type="button" class="photo-task" data-event="PHOTO_OPEN" data-request-id="${esc(r.id)}" title="${esc(r.characterName||'Photo character')}">${icon(r.status==='failed'?'CircleAlert':r.status==='completed'?'Sparkles':'Image')}<strong${r.characterName?' translate="no"':''}>${esc(r.characterName||'Photo character')}</strong><small>${({waiting:'Waiting for a photo',generating:'Making a character',completed:'Ready',failed:'Not ready yet'})[r.status]}</small></button>`).join('');
    return wrap('186',(switching||fromFriend?header(title,fromFriend?'56':'93','COMPANION_CANCEL'):headerNoBack(title))+`<div class="fox-companions${choices.length+photos.length>3?' has-extra-companions':''}" data-scroll-list="companions" tabindex="0" role="region" aria-label="${title}">${choices.map(companion=>{const {id,name}=companion;return `<button type="button" data-event="COMPANION_SELECT" data-value="${esc(id)}" aria-label="${esc(name)}" aria-pressed="${selected===id}"><img src="${companionAsset(companion)}" alt=""><strong translate="no">${esc(name)}</strong>${selected===id?icon('Check'):''}</button>`;}).join('')}${photoItems}</div><div class="fox-footer">${button('Use character','COMPANION_COMMIT','','Check','primary')}</div>`);
  }
  function friendsMenu(s){
    const unread=(s.notifications||[]).some(n=>n.type==='request'&&s.requests?.[n.id]&&s.friendMessageReadRevisions?.[n.id]!==s.requests[n.id].revision);
    const entries=[['Tap to make friends','PEER_DISCOVERY_OPEN','54','ContactRound'],['My friends','NAVIGATE','191','Users'],['Friend messages','NAVIGATE','165','Mail']];
    return wrap('185',header('Friends','74')+`<div class="peer-menu">${entries.map(([label,event,target,name])=>`<button type="button" class="fox-list-row" data-event="${event}" data-target="${target}"${target==='165'&&unread?' aria-label="Friend messages, unread" title="Unread friend messages"':''}><i class="peer-menu-icon">${icon(name)}${target==='165'&&unread?'<i class="friend-unread-dot" aria-hidden="true"></i>':''}</i><span><strong>${label}</strong></span>${icon('ChevronRight')}</button>`).join('')}</div>`,'peer-page');
  }
  function friendsList(s){
    const friends=Object.values(s.friends||{}).filter(friend=>friend.established);
    const peerRows=friends.map(friend=>`<button type="button" class="fox-list-row" data-event="FRIEND_OPEN" data-target="56" data-peer-id="${esc(friend.peerId)}" title="${esc(friend.peerName)} / ${esc(friend.pet?.name||'')}"><img class="friend-pet-thumbnail" src="${companionAsset(friend.pet)}" width="48" height="48" alt="" draggable="false"><span><strong translate="no">${esc(friend.peerName)}</strong><small>Companion: <b translate="no">${esc(friend.pet?.name||'')}</b></small></span>${icon('ChevronRight')}</button>`).join('');
    return wrap('191',header('My friends','185')+(friends.length?`<div class="fox-list peer-friends-list" data-scroll-list="friends" tabindex="0" role="region" aria-label="My friends">${peerRows}</div>`:`<div class="fox-empty peer-friends-empty">${icon('Users')}<p>No friends yet</p>${button('Tap to make friends','PEER_DISCOVERY_OPEN','54','ContactRound','primary')}</div>`),'peer-page');
  }
  function peerPage(id,s){
    const request=s.requests?.[s.requestId];
    const friend=s.friends?.[s.selectedFriendId];
    const peer=id==='55'?s.peerEncounter:id==='176'?request?.peer:friend;
    const pet=['188','189','190'].includes(id)?s.peerImport?.pet:peer?.pet;
    const added=!!friend&&s.availableCompanions?.some(c=>c.sourcePeerId===friend.peerId&&c.id==='peer:'+encodeURIComponent(friend.peerId)+':'+encodeURIComponent(friend.pet.id));
    const portrait=pet?`<img class="peer-pet" src="${companionAsset(pet)}" alt="${esc(pet.name)}" draggable="false"><p class="peer-pet-name" translate="no">${esc(pet.name)}</p>`:`<div class="peer-discovery-icon" aria-hidden="true">${icon('ContactRound')}</div>`;
    const peerName=peer?.peerName?`<p class="peer-device-name" translate="no">${esc(peer.peerName)}</p>`:'';
    if(id==='54')return wrap(id,header('Friends',s.peerDiscoveryOrigin||'185')+`<div class="peer-content">${portrait}<h3>Tap to make friends</h3><p>Bring the two devices together</p></div>`,'peer-page');
    if(id==='56'){
      const commands=button('Say hello','GREETING_OPEN','136','Hand')+button(added?'My companions':'Add companion',added?'PEER_COMPANIONS_OPEN':'PEER_IMPORT_OPEN',added?'186':'188',added?'Check':'UserRoundPlus','primary')+button('More interactions','NAVIGATE','87','Users','peer-more');
      return wrap(id,header('Friends',s.friendDetailOrigin||'191')+`<div class="peer-content peer-detail-content">${portrait}${peerName}</div><div class="peer-command-grid">${commands}</div>`,'peer-page peer-detail');
    }
    const headings={'55':'Be friends?','176':'Waiting for a reply','188':'Add this companion?','189':'Adding companion','190':'Could not add companion'};
    if(id==='190')headings[id]=({'permission':'Social access needs permission','friend-unavailable':'Friend is unavailable','offline':'Connect to Wi-Fi','storage':'Not enough space','timeout':'Adding companion timed out'})[s.peerImport?.error]||headings[id];
    const footers={
      '55':button('Not now','BACK','185','','')+button('Be friends','FRIEND_REQUEST','176','UserRoundPlus','primary'),
      '176':button('Cancel invite','PARTNER_CANCEL','144','X'),
      '188':button('Cancel','PEER_IMPORT_CANCEL','56','X')+button('Add','PEER_IMPORT_CONFIRM','189','Plus','primary'),
      '189':button('Cancel','PEER_IMPORT_CANCEL','56','X'),
      '190':button('Cancel','PEER_IMPORT_CANCEL','56','X')+button('Try again','PEER_IMPORT_RETRY','189','RotateCcw','primary')
    };
    return wrap(id,header(['188','189','190'].includes(id)?'Add companion':'Friends',id==='55'?'185':id==='176'?'144':'56',id==='176'?'PARTNER_CANCEL':id==='55'?'BACK':'PEER_IMPORT_CANCEL')+`<div class="peer-content">${portrait}<h3>${['176','189'].includes(id)?icon('LoaderCircle'):id==='190'?icon('CircleAlert'):''}<span>${headings[id]}</span></h3>${['55','176'].includes(id)?peerName:''}</div><div class="fox-footer peer-footer">${footers[id]}</div>`,'peer-page'+(['176','189'].includes(id)?' peer-is-waiting':''));
  }
  function recording(id,s){
    const recording=s.recording&&id!=='184',paused=id==='184';
    const control=button(recording?'Stop':paused?'Resume':'Record',recording?'REC_STOP':paused?'REC_RESUME':'REC_START','',recording?'Square':paused?'Play':'Mic','record-disc icon-only '+(recording?'recording':'primary'));
    const footer=id==='70'?button('Saved notes','NAVIGATE','124','ListMusic'):paused?button('Save','REC_SAVE_PAUSED','122','Check','primary'):button('Pause','REC_PAUSE','','Pause','icon-only');
    const micStatus=recording&&!['71','81','121'].includes(id)?`<p class="fox-record-mic">${icon('Mic')}Mic on</p>`:'';
    return wrap(id,header('Voice note',id==='70'?'74':'125',id==='70'?'BACK':'REC_BACK')+`<p class="fox-record-state">${id==='81'?'A reminder is waiting':paused?'Paused':recording?'Recording':'What would you like to remember?'}</p><div class="fox-record-main">${control}<strong>${time(s.seconds)}</strong></div>${micStatus}<div class="fox-footer record-footer">${footer}</div>`,'record-page'+(id==='121'?' is-dim':''));
  }
  function recordList(s){
    const records=s.records||[];
    const items=records.map((r,i)=>`<button type="button" class="fox-list-row" data-event="RECORD_OPEN" data-record-id="${esc(r.id)}">${icon('FileAudio')}<span><strong>Voice note ${i+1}</strong><small>${time(r.seconds)} · ${({'synced':'In the app','uploading':'Sending','pending':'Not sent yet','local-only':'Saved on device'})[r.status]||'Saved on device'}</small></span>${icon('ChevronRight')}</button>`).join('');
    return wrap('124',header('Saved notes','70','RECORD_LIST_BACK')+(records.length?`<div class="fox-list" data-scroll-list="records" tabindex="0" role="region" aria-label="Saved notes">${items}</div>`:`<div class="fox-empty">${icon('Mic')}<p>Nothing saved yet</p>${button('Record','REC_NEW','70','Mic','primary')}</div>`));
  }
  function playback(s){
    const r=s.records?.find(r=>r.id===s.selectedRecordId);
    if(!r)return wrap('182',header('Voice note','124','RECORD_LIST')+`<div class="fox-empty">${icon('FileAudio')}<p>No audio yet</p>${button('Saved notes','RECORD_LIST','124','ListMusic')}</div>`);
    return wrap('182',header('Voice note','124','RECORD_LIST')+`<div class="fox-playback"><div class="fox-audio-bars" aria-hidden="true">${Array.from({length:21},(_,i)=>`<i style="--bar-height:${16+(i*31%39)}px"></i>`).join('')}</div><label class="fox-playhead"><input type="range" min="0" max="${Math.max(1,r.seconds)}" step="1" value="${Math.floor(s.playbackSeconds||0)}" data-setting="playhead" aria-label="Playback position"><span>${time(s.playbackSeconds)} / ${time(r.seconds)}</span></label></div><div class="fox-playback-controls">${button('Delete recording','RECORD_DELETE_OPEN','183','Trash2','play-disc icon-only record-delete')}${button(s.playbackOn?'Pause playback':'Play recording','RECORD_PLAY','',s.playbackOn?'Pause':'Play','play-disc icon-only primary')}</div>`);
  }
  function enhance(html,p,s){
    const t=document.createElement('template');t.innerHTML=html;
    const root=t.content.querySelector('.device-screen');root.classList.add('fox-screen');
    if(p.n==='79')root.querySelector('.standby-battery').innerHTML=batteryStatus(s,true);
    if(['46','47'].includes(p.n))root.querySelectorAll('[data-event="DOCK_SYNC_START"]').forEach(el=>{el.disabled=!s.dock?.connected;});
    if(['11','12','13'].includes(p.n))root.classList.add('response-screen');
    if(p.n==='59')root.querySelectorAll('.care-timer,.care-mic-status').forEach(el=>el.remove());
    if(['60','61','62','63','64','65','66'].includes(p.n))root.classList.add('care-response-screen');
    if(p.n==='93'){
      const label=root.querySelector('.screen-label');
      label.classList.add('pet-switch-header');
      const name=label.querySelector('span');name.classList.add('pet-switch-name');name.setAttribute('translate','no');name.setAttribute('title',s.characterName||'Lumi');
      const companions=s.availableCompanions||[],index=companions.findIndex(item=>item.id===s.characterId);
      const carousel=root.querySelector('.pet-header'),card=document.createElement('div');
      card.className='pet-carousel-card';while(carousel.firstChild)card.appendChild(carousel.firstChild);
      carousel.classList.add('pet-carousel');carousel.setAttribute('data-companion-carousel','');carousel.setAttribute('tabindex','0');carousel.setAttribute('role','group');carousel.setAttribute('aria-label','Switch companion');
      carousel.appendChild(card);
      for(const [direction,label,enabled,symbol]of [['PREV','Previous companion',index>0,'ChevronLeft'],['NEXT','Next companion',index>=0&&index<companions.length-1,'ChevronRight']]){
        carousel.insertAdjacentHTML('beforeend',button(label,'PET_COMPANION_'+direction,'93',symbol,'pet-carousel-arrow icon-only'));
        const arrow=carousel.lastElementChild;arrow.dataset.avatarId=s.characterId||'';arrow.dataset.focusKey='companion-'+direction;arrow.disabled=!enabled;
      }
      carousel.insertAdjacentHTML('afterend',`<div class="pet-carousel-position" role="status" aria-live="polite" aria-atomic="true"><span class="sr-only" translate="no">${esc(s.characterName||'Lumi')} </span><span>${Math.max(0,index+1)} / ${companions.length}</span></div>`);
    }
    if(['59','60','61','62','63','64','65','66'].includes(p.n))root.querySelectorAll('[data-event^="CARE_"]').forEach(el=>{el.dataset.feedbackId=s.careFeedbackId||'';});
    root.querySelectorAll('.lumi-figure').forEach(el=>{el.src=image(s);el.alt=s.characterName||'Lumi';});
    const readOnly=root.querySelectorAll('button[data-event="NOOP"]');readOnly.forEach(el=>{const row=document.createElement('div');row.className=el.className+' fox-readonly';row.innerHTML=el.innerHTML;el.replaceWith(row);});
    if(!root.querySelector('.screen-header-back')&&!NO_AUTO_BACK.has(p.n)){
      root.insertAdjacentHTML('afterbegin',back(['180','181','187'].includes(p.n)?'74':p.n==='103'?'187':p.n==='75'?'180':'10'));
      root.classList.add('fox-has-back');
    }
    if(p.n==='02'){return qr(s);}
    if(p.n==='29')root.querySelectorAll('[data-event="NOOP"]').forEach(el=>el.removeAttribute('data-event'));
    const list=root.querySelector('.screen-list');
    if(list){
      list.setAttribute('data-scroll-list','options');list.setAttribute('tabindex','0');list.setAttribute('role','region');
      if(!list.getAttribute('aria-label'))list.setAttribute('aria-label',p.ui.label||'Options');
    }
    root.querySelectorAll('.list-scroll-mark').forEach(el=>el.remove());
    if(['05','109'].includes(p.n))root.querySelectorAll('.list-item-label').forEach(el=>el.setAttribute('translate','no'));
    if(['05','109'].includes(p.n)&&s.wifiError){root.classList.add('wifi-has-error');root.insertAdjacentHTML('beforeend',`<p class="wifi-inline-error" role="status">${esc(s.wifiError)}</p>`);}
    if(p.n==='174'){
      const content=root.querySelector('.screen-content');content.classList.add('fox-network-name');
      content.setAttribute('data-scroll-list','network-name');content.setAttribute('tabindex','0');content.setAttribute('role','region');content.setAttribute('aria-label','Full network name');
    }
    if(s.photoView&&['53','154','155','156'].includes(p.n)){
      const name=p.n==='53'?s.photoRequests?.[s.photoRequestId]?.characterName:s.targetCharacter;
      const subtitle=root.querySelector('.screen-subtitle');
      if(name&&subtitle){subtitle.textContent=name;subtitle.setAttribute('translate','no');}
    }
    if(p.n==='77'&&s.noteMutations?.length){const row=root.querySelector('[data-event="NOTE_SYNC_RETRY"]');if(row){row.setAttribute('aria-live','polite');row.setAttribute('aria-atomic','true');}}
    // Info-only rows must not look like unimplemented controls.
    root.querySelectorAll('.fox-readonly .list-chevron').forEach(el=>el.remove());
    return root.outerHTML;
  }
  function render(p,s={}){
    const id=p.n;
    let html;
    if(id==='01')html=wrap(id,'<img class="fox-boot-art" src="boot-splash-art.png" alt="LUMIQ"><div class="fox-boot-progress" role="progressbar" aria-label="Starting"><i></i></div>','is-boot');
    else if(['23','24','26'].includes(id)||id==='79'&&s.dock?.connected)html=chargeScreen(id,s);
    else if(id==='10')html=native('home',id,s);
    else if(id==='74')html=native('apps',id,s);
    else if(['82','58'].includes(id))html=companionControl(id,s);
    else if(['14','15','16'].includes(id))html=native('chat',id,s);
    else if(id==='178')html=language(s);
    else if(id==='186')html=companions(s);
    else if(id==='185')html=friendsMenu(s);
    else if(id==='191')html=friendsList(s);
    else if(['54','55','56','176','188','189','190'].includes(id))html=peerPage(id,s);
    else if(['70','71','81','121','184'].includes(id))html=recording(id,s);
    else if(id==='124')html=recordList(s);
    else if(id==='182')html=playback(s);
    else if(id==='29')html=wrap(id,header('Memories')+`<div class="fox-scope"><h3>Share these memories?</h3><p class="fox-scope-note">${esc(p.ui.sub||'Chosen in the app')}</p><ul>${p.ui.items.map(item=>`<li>${icon('Check')}<span>${esc(item.label)}</span></li>`).join('')}</ul></div><div class="fox-footer">${button('Cancel','BACK','10','','')}${button('Confirm','SOUL_CONFIRM','146','','primary')}</div>`,'scope-page');
    else {
      const basePage=id==='93'?{...p,ui:{...p.ui,actions:p.ui.actions.filter(item=>item.event!=='PET_SWITCH_OPEN')}}:p;
      html=enhance(base(basePage,s),p,s);
    }
    if(s.language==='zh-CN')html=global.FoxLocale.translateMarkup(html);
    const template=document.createElement('template');template.innerHTML=html;
    const root=template.content.firstElementChild;root.setAttribute('lang',s.language==='zh-CN'?'zh-CN':'en');
    if(['57','87','88','89','90','136','137','138','139','141','142','143','145'].includes(id)){
      const peer=(['89','142','143','145'].includes(id)?s.requests?.[s.requestId]?.peer:null)||s.friends?.[s.selectedFriendId];
      if(peer?.peerName&&peer.peerName!=='Milo'){
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        while(walker.nextNode())walker.currentNode.nodeValue=walker.currentNode.nodeValue.replace(/\bMilo\b/g,()=>peer.peerName);
        root.querySelectorAll('[aria-label],[title]').forEach(el=>{for(const attr of ['aria-label','title'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).replace(/\bMilo\b/g,()=>peer.peerName));});
      }
    }
    if(s.still)root.querySelectorAll('img').forEach(img=>{img.setAttribute('loading',id==='01'?'eager':'lazy');img.setAttribute('decoding','async');});
    return root.outerHTML;
  }
  global.FoxScreen={render,icon,escape:esc,time};
})(window);
