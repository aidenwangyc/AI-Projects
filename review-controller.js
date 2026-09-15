(function (global) {
  'use strict';
  function createSession(data, machine, hooks = {}) {
    const s=machine.state, pages=data.groups.flatMap(g=>g.pages), ids=pages.map(p=>p.n), pageMap=Object.fromEntries(pages.map(p=>[p.n,p]));
    const initial=structuredClone(s), visited=new Set(), history=[];
    let cursor=-1, mode='flow', playing=false, manualPause=false;
    function snapshot(){const state=structuredClone(s);state.password='';state.showPassword=false;return {state,view:structuredClone(hooks.capture?.()||{})};}
    function assign(state){for(const key of Object.keys(s))delete s[key];Object.assign(s,structuredClone(state));}
    function mark(){visited.add(s.page);}
    function resetState(){assign(initial);}
    function remember(){history.splice(cursor+1);history.push(snapshot());cursor=history.length-1;mark();}
    function perform(fn){
      if(cursor>=0)history[cursor]=snapshot();
      const from=s.page;history.splice(cursor+1);fn();mark();
      if(from!==s.page||cursor<0)remember();else history[cursor]=snapshot();
    }
    function pendingWork(){
      const work=[];
      if(s.auto)work.push(['auto',s.auto]);
      for(const job of s.jobs||[])if(job.at>=s.clock)work.push(['job',job]);
      if(s.task)work.push(['task',s.task]);
      if(s.recording)work.push(['recording',s.currentRecording?.id]);
      if(s.playbackOn)work.push(['playback',s.selectedRecordId]);
      if(s.aiActive)work.push(['ai',s.aiSessionId,s.aiRequestId,s.page]);
      if(s.careActive)work.push(['care',s.careSessionId]);
      for(const pet of Object.values(s.pets||{}))if(pet.restAt!=null)work.push(['rest',pet.avatarId,pet.restActionId,pet.restAt]);
      for(const request of Object.values(s.requests||{}))if(['waiting','generating'].includes(request.status))work.push(['request',request.id,request.revision,request.deadline]);
      for(const request of Object.values(s.photoRequests||{}))if(request.status==='generating')work.push(['photo',request.id,request.attemptId,request.deadline]);
      for(const mutation of s.noteMutations||[])if(mutation.status==='sending')work.push(['note-sync',mutation.operationId,mutation.attemptId]);
      if(s.soulSessionId)work.push(['memories',s.soulSessionId,s.soulDeadline]);
      if(s.foodInventory?.status==='syncing')work.push(['food-sync',s.foodInventory.requestId,s.foodInventory.deadline]);
      if(s.dockSync?.status==='syncing')work.push(['dock-sync',s.dockSync.attemptId,s.dockSync.deadline]);
      for(const key of ['bindDeadline','wifiScanDeadline','connectionDeadline','draftExpiresAt'])if(s[key]!=null)work.push([key,s[key]]);
      return work.map(item=>JSON.stringify(item));
    }
    function devicePerform(fn){
      const before=new Set(pendingWork());
      perform(fn);
      // A device command resumes only newly started work, not a paused review snapshot.
      if(mode==='flow'&&!manualPause&&pendingWork().some(item=>!before.has(item)))playing=true;
    }
    function restore(index){if(index<0||index>=history.length)return false;if(cursor>=0)history[cursor]=snapshot();playing=false;manualPause=false;cursor=index;assign(history[index].state);hooks.restore?.(structuredClone(history[index].view));mark();return true;}
    function start(name='setup'){
      playing=false;manualPause=false;mode='flow';resetState();machine.dispatch('SCENARIO',{name});
      if(name==='ai')machine.dispatch('AI_START');
      if(name==='social'){machine.dispatch('ENV',{key:'socialAllowed',value:true});machine.dispatch('NAVIGATE',{target:'54'});}
      if(name==='memories')machine.dispatch('NAVIGATE',{target:'29'});
      if(name==='update')machine.dispatch('NAVIGATE',{target:'163'});
      if(name==='pet')machine.dispatch('NAVIGATE',{target:'93'});
      if(name==='settings')machine.dispatch('NAVIGATE',{target:'180'});
      if(name==='care')machine.dispatch('NAVIGATE',{target:'82'});
      history.length=0;cursor=-1;visited.clear();hooks.restore?.({});remember();
    }
    function requestPayload(){const r=s.requests[s.requestId];return {requestId:r?.id,revision:r?.revision};}
    const demoPeer={peerId:'review-peer-pico',peerName:'Pico',pet:{id:'review-peer-momo',name:'Momo',appearance:'momo'}};
    function preparePeer(n){
      machine.dispatch('PEER_DISCOVERY_OPEN');
      if(n==='54')return;
      machine.dispatch('PEER_TAP',structuredClone(demoPeer));
      if(n==='55')return;
      machine.dispatch('FRIEND_REQUEST');
      if(n==='176')return;
      machine.dispatch('FRIEND_REMOTE_ACCEPT',requestPayload());
      if(['188','189','190'].includes(n)){
        machine.dispatch('PEER_IMPORT_OPEN',{peerId:s.selectedFriendId});
        if(n!=='188')machine.dispatch('PEER_IMPORT_CONFIRM');
        if(n==='190')machine.dispatch('PEER_IMPORT_FAILED',{attemptId:s.peerImport?.attemptId});
      }
    }
    // Catalog fixtures are review-only. The product state machine and policy defaults stay unchanged.
    function prepare(n){
      resetState();machine.dispatch('SCENARIO',{name:n==='01'?'setup':'daily'});
      const numeric=Number(n);
      if(n==='18')machine.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:2});
      if(['02','03','04','05','07','110','111','112','126','131','132','186'].includes(n)){
        s.bound=!['02','03','04'].includes(n);s.setupDone=false;s.networkConfigured=false;s.networkConnected=false;s.characterReady=false;s.wifiOrigin='130';s.wifiListPage='05';s.provisionOrigin='setup';
      }
      if(['07','131','132'].includes(n)){s.bound=true;s.networkConfigured=true;s.networkConnected=true;if(n==='07')s.characterReady=true;}
      if(['14','15','16','161','41','43','44','76'].includes(n)){
        machine.dispatch('AI_START');
        if(['15','16','43','44'].includes(n))machine.dispatch('AI_INPUT_END');
        if(n==='16')machine.tick(1.2);
        if(n==='41')machine.dispatch('AI_NO_SPEECH',{sessionId:s.aiSessionId});
        if(n==='43'||n==='44')machine.dispatch(n==='43'?'AI_TIMEOUT':'AI_SAFE_RESPONSE',{sessionId:s.aiSessionId,requestId:s.aiRequestId});
        if(n==='76')machine.dispatch('AI_END');
      }
      if(['07','09'].includes(n)){
        s.bound=true;s.setupDone=false;s.networkConfigured=true;s.networkConnected=true;
        machine.dispatch('CHARACTER_PICKER');machine.dispatch('COMPANION_COMMIT');
        if(n==='09')machine.tick(1.5);
      }
      if(n==='22')machine.dispatch('NETWORK_RETRY');
      if(n==='153')machine.dispatch('REBOOT');
      if(n==='162'){machine.dispatch('NAVIGATE',{target:'17'});machine.dispatch('SINGLE_PLAY');}
      if(n==='170'){machine.dispatch('AI_POLICY',{status:'deny',version:1});machine.dispatch('AI_START');}
      if(['71','81','121','122','123','124','125','177','42','73','72','171','164'].includes(n)){
        if(['72','124'].includes(n))machine.dispatch('UPLOAD_PERMISSION',{status:'granted',version:1});
        if(n==='124')s.networkConnected=false;
        if(n==='73')s.saveFail=true;
        machine.dispatch('REC_START');machine.tick(8);
        if(['81','164'].includes(n))machine.dispatch('NOTE_DUE');
        if(['125','177','42'].includes(n)){machine.dispatch('REC_BACK');if(n!=='125')machine.dispatch('REC_DISCARD_REQUEST');if(n==='42')machine.dispatch('REC_DISCARD');}
        else if(!['71','81','121'].includes(n)){
          machine.dispatch('REC_STOP');if(n!=='122')machine.tick(1);
          if(['72','124','171'].includes(n))machine.tick(1.2);
          if(n==='164')machine.dispatch('REC_RESULT_DONE');
        }
      }
      if(numeric>=54&&numeric<=57||numeric>=87&&numeric<=92||numeric>=136&&numeric<=145||['102','165','176','188','189','190','191'].includes(n)){
        s.socialAllowed=true;
        if(['54','55','56','176','188','189','190'].includes(n))preparePeer(n);
        else if(['89','90'].includes(n)){machine.dispatch('PARTNER_REQUEST');if(n==='90')machine.dispatch('PARTNER_ACCEPTED',requestPayload());}
        else if(n==='142')machine.dispatch('AVATAR_INVITATION_RECEIVED',{requestId:'review-invite',revision:1,peerId:s.selectedFriendId});
        else if(['91','92','102','143','144','145'].includes(n)){
          machine.dispatch('AVATAR_INVITE');
          if(['91','92','102'].includes(n))machine.dispatch('AVATAR_REMOTE_ACCEPT',requestPayload());
          if(n==='92')machine.dispatch('AVATAR_CREATED',requestPayload());
          if(n==='102')machine.dispatch('AVATAR_FAILED',requestPayload());
          if(n==='144')machine.dispatch('AVATAR_CANCEL');
        }
        if(n==='137'||n==='138'||n==='139'){machine.dispatch('SOCIAL_SEND');if(n!=='137'){if(n==='139')s.networkConnected=false;machine.tick(1);}}
      }
      if(['58','59','60','61','62','63','64','65','66'].includes(n)){
        machine.dispatch('NAVIGATE',{target:'82'});machine.dispatch('CARE_START');
        if(n!=='58')machine.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});
        const event={'60':'CARE_ACCEPT','61':'CARE_HIGH_VOLUME','62':'CARE_EXPLICIT_ANGER','63':'CARE_EXPLICIT_DISAPPOINTMENT','64':'CARE_EXPLICIT_CONFLICT','65':'CARE_EXPLICIT_BEDTIME','66':'CARE_NEED_HELP'}[n];
        if(event)machine.dispatch(event,{feedbackId:s.careFeedbackId});
      }
      if(n==='69'||n==='133'){machine.dispatch('NOTE_DUE');machine.dispatch(n==='69'?'NOTE_DONE':'NOTE_LATER');}
      if(n==='68'||n==='167')machine.dispatch('NOTE_DUE');
      if(['93','94','95','96','97','98','99','157','175'].includes(n)){
        // Focused catalog fixtures avoid unrelated demo reminders during the 15-minute rest preview.
        s.noteDueAt=s.clock+86400;for(const note of Object.values(s.notes)){note.noteDueAt=s.clock+86400;note.noticeStatus='scheduled';}
        machine.dispatch('NAVIGATE',{target:'93'});
        if(n==='157'){machine.currentPet().feed=60;machine.dispatch('PET_FEED_OPEN');}
        if(n==='94'){
          // The review fixture models an App-confirmed purchase; no local grant or payment is fabricated.
          machine.dispatch('FOOD_SYNC_REQUEST');
          machine.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,requestId:s.foodInventory.requestId,revision:1,purchasedTotal:1});
          machine.dispatch('PET_FEED_OPEN');
        }
        if(['95','96','175'].includes(n))machine.dispatch({'95':'PET_CLEAN_OPEN','96':'PET_REST_OPEN','175':'PET_REST_OPEN'}[n]);
        if(n==='175')machine.dispatch('PET_REST');
        if(['97','98','99'].includes(n)){machine.dispatch('EXPLORE_OPEN');if(n!=='97')machine.dispatch(n==='98'?'EXPLORE_OUT':'EXPLORE_IN');}
      }
      if(['08','39','40','146','147','148','149'].includes(n)){
        machine.dispatch('NAVIGATE',{target:'29'});machine.dispatch('SOUL_CONFIRM');const receipt={sessionId:s.soulSessionId};
        if(n!=='146')machine.dispatch('SOUL_READY',receipt);if(['08','148','40'].includes(n))machine.dispatch('SOUL_TRANSFERRED',receipt);if(n==='08')machine.dispatch('SOUL_VERIFIED',receipt);
        if(n==='39')machine.dispatch('SOUL_INTERRUPTED',receipt);if(n==='40')machine.dispatch('SOUL_VERIFY_FAILED',receipt);if(n==='149')machine.dispatch('SOUL_CANCEL');
      }
      if(['51','52','53'].includes(n)){
        machine.dispatch('REVIVE_REQUESTED',{deviceId:s.localDeviceId,requestId:'photo-review'});const receipt={requestId:s.photoRequestId,attemptId:s.photoRequests[s.photoRequestId].attemptId};
        if(n!=='51')machine.dispatch('REVIVE_START',receipt);if(n==='53')machine.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'photo-review-pet',characterName:'Nova'});
      }
      if(['35','49','50','100'].includes(n)){machine.dispatch('OTA_INSTALL');if(n==='49')machine.dispatch('OTA_SUCCESS');if(n==='50'||n==='100')machine.dispatch('OTA_FAIL');if(n==='100')machine.dispatch('ROLLBACK_SUCCESS');}
      if(['101','150','151','152'].includes(n)){machine.dispatch('SCENARIO',{name:'recovery'});if(n!=='101')machine.dispatch('RECOVERY_HELP');if(n==='151'||n==='152')machine.dispatch('RECOVERY_START');if(n==='152')machine.dispatch('RECOVERY_FAIL');}
      if(n==='155'||n==='156'){machine.dispatch('AVATAR_ACTIVATE');if(n==='156')machine.dispatch('AVATAR_ACTIVATE_FAILED');}
      if(n==='34')machine.dispatch('BATTERY_CRITICAL');if(n==='48')machine.dispatch('THERMAL_LIMIT');
      if(['109','110','111','112','113','127','128','129','174'].includes(n)){
        machine.dispatch('WIFI_SCAN');
        if(n==='127')machine.dispatch('WIFI_SCAN_EMPTY',{scanId:s.wifiScanId});
        else {
          machine.tick(1);
          if(['110','128','174'].includes(n))machine.dispatch('WIFI_SELECT',{value:n==='174'?'Family-Living-Room-WiFi-2026-5G':'Home'});
          if(n==='174')machine.dispatch('SSID_DETAIL');
          if(['111','112','113'].includes(n))machine.dispatch('WIFI_SELECT_OPEN',{value:'Guest'});
          if(n==='112')machine.tick(2);
          if(n==='113')machine.dispatch('WIFI_TIMEOUT',{connectionId:s.connectionId});
          if(n==='128'){for(const key of 'demo-pass')machine.dispatch('KEY',{key});machine.dispatch('WIFI_JOIN');machine.dispatch('WIFI_AUTH_ERROR',{connectionId:s.connectionId});}
          if(n==='129')machine.dispatch('WIFI_LOST');
        }
      }
      if(['182','183'].includes(n)){machine.dispatch('REC_START');machine.tick(8);machine.dispatch('REC_STOP');machine.tick(1);machine.dispatch('RECORD_OPEN',{recordId:s.records.at(-1).id});if(n==='183')machine.dispatch('RECORD_DELETE_OPEN');}
      if(n==='184'){machine.dispatch('REC_START');machine.tick(8);machine.dispatch('REC_PAUSE');}
      if(n==='178'){s.languageOrigin='setup';s.bound=false;s.networkConfigured=false;s.characterReady=false;s.setupDone=false;}
      if(n==='186'){s.pendingCompanion='lumi';s.companionOrigin='setup';s.bound=true;s.networkConfigured=true;s.networkConnected=true;}
      if(['03','04','05','37','38'].includes(n)){
        s.bound=false;s.setupDone=false;s.networkConfigured=false;s.networkConnected=false;s.provisionOrigin='setup';
        machine.dispatch('QR_OPEN');machine.dispatch('BIND_REQUEST');
        if(['04','05','38'].includes(n))machine.dispatch('BIND_ACCEPT');
        if(n==='05')machine.tick(1.5);
        if(n==='37')machine.tick(60);
        if(n==='38')machine.dispatch('BIND_FAILED',{bindSessionId:s.bindSessionId});
      }
      if(n==='126'){machine.dispatch('WIFI_SCAN');}
      if(['23','24','25','26','45','46','47'].includes(n)){
        machine.dispatch('DOCK_CONNECTED');
        if(n!=='23')machine.tick(1.5);
        if(n==='26')machine.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:1,battery:100,status:'full'});
        if(n==='45')machine.dispatch('DOCK_CONTACT_ERROR',{sessionId:s.dock.sessionId});
        if(['25','46','47'].includes(n)){
          machine.dispatch('DOCK_SYNC_START');
          if(n==='46')machine.dispatch('DOCK_REMOVED',{sessionId:s.dock.sessionId});
          if(n==='47')machine.dispatch('DOCK_SYNC_FAILED',{sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId});
        }
      }
      if(s.page!==n){
        // A transient gate such as P161 must also be inspectable in the full catalog.
        if(!s.task&&!s.recording)machine.dispatch('PREVIEW',{target:n});
        s.page=n;s.enteredAt=s.clock;s.idleSeconds=0;
      }
      if(n==='121')s.displayOn=true;
      if(n==='119')s.powerOn=false;
    }
    function preview(n,context){
      n=data.pageAliases?.[n]||n;if(!pageMap[n])return false;playing=false;manualPause=false;
      perform(()=>{
        if(context!=='photo'||!['102','186'].includes(n)){prepare(n);return;}
        prepare('51');const receipt={requestId:s.photoRequestId,attemptId:s.photoRequests[s.photoRequestId].attemptId};machine.dispatch('REVIVE_START',receipt);
        if(n==='102')machine.dispatch('REVIVE_FAILED',receipt);
        else {machine.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'photo-preview-pet',characterName:'Nova'});machine.dispatch('PHOTO_LATER');machine.dispatch('NAVIGATE',{target:'93'});machine.dispatch('PET_SWITCH_OPEN');}
      });return true;
    }
    function payload(route){
      const rec=s.records.find(r=>r.status==='uploading')||s.records.at(-1);
      const item=[...pageMap[s.page].ui.actions,...pageMap[s.page].ui.items].find(i=>i.event===route.event&&i.target===route.target)||{};
      const pet=s.pets?.[s.characterId];
      const petPayload=['PET_FEED','PET_CLEAN','PET_REST','PET_EXPLORE_COMPLETE'].includes(route.event)?s.petIntent||{}:['PET_REST_CANCEL','PET_REST_COMPLETED'].includes(route.event)?{avatarId:pet?.avatarId,actionId:pet?.restActionId,baseRevision:pet?.restRevision}:{};
      const requestPeer=s.requests[s.requestId]?.peer?.peerId;
      const peerId=['FRIEND_REMOTE_ACCEPT','FRIEND_CONFIRMED','FRIEND_REMOTE_DECLINE','PARTNER_CONFIRMED','PARTNER_ACCEPTED','AVATAR_REMOTE_ACCEPT','AVATAR_CREATED','AVATAR_FAILED'].includes(route.event)?requestPeer:['SOCIAL_SENT','SOCIAL_QUEUED'].includes(route.event)?s.messagePeerId:route.event?.startsWith('PEER_IMPORT_')?s.peerImport?.peerId:item.peerId||route.peerId||s.selectedFriendId;
      const foodPayload=route.event==='FOOD_INVENTORY_SYNC'?{deviceId:s.localDeviceId,requestId:s.foodInventory?.requestId,revision:s.foodInventory.revision+1,purchasedTotal:Math.max(s.foodInventory.purchasedTotal,s.foodInventory.consumedTotal+1)}:route.event==='FOOD_SYNC_FAILED'?{requestId:s.foodInventory?.requestId,error:route.error||'service'}:{};
      const dockPayload=route.event?.startsWith('DOCK_')||route.event==='CHARGE_UPDATED'?{sessionId:s.dock.sessionId,revision:s.dock.revision+1,attemptId:s.dockSync.attemptId}:{};
      return {...item,...route,...requestPayload(),...petPayload,...(petPayload.avatarId?{revision:petPayload.baseRevision}:{}),peerId,recordingId:s.currentRecording?.id,attemptId:route.event?.startsWith('PEER_IMPORT_')?s.peerImport?.attemptId:s.currentRecording?.attemptId,
        recordId:rec?.id,uploadId:rec?.uploadId,permissionVersion:s.uploadPermissionVersion,sessionId:route.event?.startsWith('SOUL_')?s.soulSessionId:s.aiSessionId,careSessionId:s.careSessionId,feedbackId:s.careFeedbackId,
        ...(route.event?.startsWith('REVIVE_')?{requestId:s.photoRequestId,attemptId:s.photoRequests[s.photoRequestId]?.attemptId,resultId:'photo-result-'+s.photoRequestId,characterName:'Nova'}:{}),
        ...(route.event?.startsWith('AI_')?{requestId:s.aiRequestId}:{}),serial:route.event?.startsWith('SOCIAL_')?s.messageSerial:s.activationSerial,
        connectionId:s.connectionId,scanId:s.wifiScanId,bindSessionId:s.bindSessionId,noteId:s.noteId,value:item.value??(/^WIFI_SELECT/.test(route.event)?item.label:route.value),...(route.event==='PEER_TAP'?structuredClone(demoPeer):{}),...foodPayload,...dockPayload};
    }
    function options(){
      const rs=(data.transitions[s.page]||[]).map(r=>{
        if(r.event==='PEER_TAP')r={...r,label:'模拟硬件碰一碰：Pico 的设备'};
        if(mode==='catalog')return r;
        let target=r.target;
        if(['WIFI_BACK','WIFI_TIMEOUT','WIFI_SCAN_RESULT','WIFI_SCAN_FOUND','BIND_SUCCESS'].includes(r.event))target=s.setupDone?'109':'05';
        if(r.event==='WIFI_CANCEL')target=s.setupDone?s.wifiOrigin:'05';
        if(r.event==='OPEN_WIFI')target=!s.bound?'02':s.wifiEnabled?'126':'115';
        if(s.page==='115'&&r.event==='BACK')target=s.wifiOrigin;
        if(r.event==='WIFI_RETRY'&&!s.wifiOpen&&s.password.length<8)target='110';
        if(r.event==='SETUP_RESUME')target=!s.bound?'02':!s.networkConfigured&&!s.networkSkipped?'126':!s.characterReady?'186':s.setupDone?'10':'09';
        if(r.event==='SETUP_DEFAULT'&&!s.bound)target='02';
        if(r.event==='CLOUD_USE_LOCAL'&&!s.setupDone)target='186';
        if(r.event==='PROVISION_CANCEL')target=s.provisionOrigin==='settings'?s.wifiOrigin:s.page==='02'?'178':'02';
        if(r.event==='LANGUAGE_DONE'&&s.languageOrigin==='settings')target='180';
        if(r.event==='COMPANION_COMMIT'&&s.companionOrigin==='settings')target='10';
        if(r.event==='COMPANION_COMMIT'&&['pet','friends'].includes(s.companionOrigin))target='93';
        if(['COMPANION_CANCEL','BACK'].includes(r.event)&&s.page==='186')target=s.companionOrigin==='pet'?'93':s.companionOrigin==='friends'?'56':s.companionOrigin==='settings'?'180':'112';
        if(r.event==='NOTE_DISMISS')target=s.noteReturn;
        if(r.event==='AI_RETURN')target=s.aiOrigin;
        if(r.event==='REC_RESULT_DONE')target=s.pendingReminder?'164':s.recOrigin;
        if(r.event==='SINGLE_END')target=s.playOrigin||'10';
        if(r.event==='SOCIAL_SENT')target=s.networkConnected&&s.cloudAvailable?'138':'139';
        if(r.event==='AVATAR_ACCEPT'&&s.requests[s.requestId]?.remoteConsent)target='91';
        if(r.event==='FOOD_INVENTORY_SYNC')target=s.page==='157'&&s.petUnavailableReason==='FOOD_EMPTY'?'94':s.page;
        if(r.event==='NETWORK_RESULT')target=!s.wifiEnabled||!s.networkConnected?'21':!s.cloudAvailable?'78':s.setupDone?'10':!s.bound?'02':!s.networkConfigured&&!s.networkSkipped?'126':!s.characterReady?'186':'10';
        if(r.event==='BOOT'&&s.page==='153')target=s.safety?s.safety==='thermal'?'48':'34':s.recoveryMode?'101':s.draft?'73':!s.bound?s.languageChosen?'02':'178':s.setupDone?'10':!s.networkConfigured&&!s.networkSkipped?'126':!s.characterReady?'186':'10';
        if(r.event==='CARE_FEEDBACK_DONE'||r.event==='BACK'&&['59','60','61','62','63','64','65','66'].includes(s.page))target=s.careEnabled?s.careFeedbackOrigin:'82';
        if(r.event==='AI_MIC_BLOCKED'||r.event==='MUTE_TOGGLE'&&['14','15','16','41','43','44'].includes(s.page))target=s.aiOrigin;
        if(['10','24','26'].includes(target)&&!['DOCK_REMOVED','CHARGE_UPDATED'].includes(r.event))target=machine.homePage();
        return {...r,target};
      });
      const result=rs.map((r,index)=>({key:'route-'+index,label:r.label+' → P'+r.target,route:r,target:r.target})).filter(o=>mode==='catalog'||s.page!=='112'||o.route.event===(s.setupDone?'WIFI_SETTINGS_DONE':'WIFI_CONTINUE')).filter(o=>mode==='catalog'||!['FOOD_INVENTORY_SYNC','FOOD_SYNC_FAILED'].includes(o.route.event)||s.foodInventory?.status==='syncing').filter((o,index,all)=>mode==='catalog'||all.findIndex(other=>other.route.event===o.route.event&&other.target===o.target)===index);
      const request=s.requests[s.requestId];
      if(mode==='flow'&&s.photoView&&s.page==='102'){
        result.splice(0,result.length,{key:'photo-retry',label:'查询原照片任务 → P52',route:{event:'REVIVE_RETRY',target:'52'},target:'52'},{key:'photo-later',label:'稍后查看 → P'+s.photoOrigin,route:{event:'PHOTO_LATER',target:s.photoOrigin},target:s.photoOrigin});
      }
      const note=s.noteMutations.find(m=>m.status==='sending');
      if(note&&['77','69','133','134'].includes(s.page))for(const success of [true,false])result.push({key:success?'note-sync-success':'note-sync-failure',label:success?'模拟 App 确认提醒同步':'模拟提醒同步失败',receipt:{event:'NOTE_SYNC_RESULT',operationId:note.operationId,attemptId:note.attemptId,success,revision:note.baseRevision+1}});
      const pet=s.pets?.[s.characterId];
      if(s.page==='175'&&pet?.restAt!=null)result.unshift({key:'pet-rest-wait',label:'等待休息完成 → P93',wait:Math.max(.001,pet.restAt-s.clock),target:'93'});
      if(request?.status==='waiting'&&['176','89'].includes(s.page)){
        const event=request.kind==='friend'?'FRIEND_REMOTE_ACCEPT':'PARTNER_ACCEPTED',target=request.kind==='friend'?'56':'90';
        if(!rs.some(r=>r.event===event))result.unshift({key:'mock-response',label:'模拟对方同意 → P'+target,route:{event,target},target});
        if(request.kind==='friend'&&!rs.some(r=>r.event==='FRIEND_REMOTE_DECLINE'))result.push({key:'mock-decline',label:'模拟对方拒绝 → P144',route:{event:'FRIEND_REMOTE_DECLINE',target:'144'},target:'144'});
      }
      const automatic=[s.auto,...(s.jobs||[])].filter(job=>job&&job.at>=s.clock).sort((a,b)=>a.at-b.at)[0];
      if(automatic){const r=rs.find(r=>r.event===automatic.event);result.unshift({key:'wait',label:(r?.label||'等待当前结果')+(r?' → P'+r.target:''),wait:Math.max(.001,automatic.at-s.clock),target:r?.target});}
      if(mode==='flow')for(const option of result)if(option.route?.event==='DOCK_FEEDBACK_DONE'&&s.dock.feedbackUntil!==null)option.wait=Math.max(.001,s.dock.feedbackUntil-s.clock);
      if(s.page==='157'&&s.petUnavailableReason!=='FOOD_EMPTY')result.push({key:'food-empty-sample',label:'预览食物用完 → P157',sample:'food-empty',target:'157'});
      if(s.page==='157'&&pet?.feed<100)result.push({key:'food-full-sample',label:'预览已吃饱 → P157',sample:'food-full',target:'157'});
      if(s.page==='157'&&(pet?.feed>=100||pet?.feedAt<=s.clock))result.push({key:'food-cooldown-sample',label:'预览喂食冷却 → P157',sample:'food-cooldown',target:'157'});
      if(s.page==='157'&&s.petUnavailableReason==='FOOD_EMPTY'&&s.foodInventory?.status!=='syncing'&&!rs.some(r=>r.event==='FOOD_SYNC_REQUEST')){
        result.unshift({key:'food-sync-request',label:'从 App 同步已购买的食物',route:{event:'FOOD_SYNC_REQUEST',target:'157'},target:'157'});
      }
      if(['93','94','157'].includes(s.page)&&s.foodInventory?.status==='syncing'){
        const target=s.page==='157'&&s.petUnavailableReason==='FOOD_EMPTY'?'94':s.page;
        if(!rs.some(r=>r.event==='FOOD_INVENTORY_SYNC'))result.unshift({key:'food-sync-app-response',label:'模拟 App 已购库存同步 → P'+target,route:{event:'FOOD_INVENTORY_SYNC',target},target});
        if(!rs.some(r=>r.event==='FOOD_SYNC_FAILED'))result.push({key:'food-sync-app-failed',label:'模拟 App 库存同步失败 → P'+s.page,route:{event:'FOOD_SYNC_FAILED',target:s.page},target:s.page});
      }
      return result;
    }
    function preferred(){
      const opts=options();if(!opts.length)return null;
      const special={'01':'BOOT_UNBOUND','03':'BIND_ACCEPT','05':'WIFI_SELECT','109':'WIFI_SELECT','110':'WIFI_JOIN','10':'OPEN_MENU','14':'AI_INPUT_DONE','54':'PEER_TAP','55':'FRIEND_REQUEST','58':'CARE_SOUND','91':'AVATAR_CREATED','143':'AVATAR_REMOTE_ACCEPT','176':'FRIEND_REMOTE_ACCEPT','89':'PARTNER_ACCEPTED','146':'SOUL_READY','147':'SOUL_TRANSFERRED','148':'SOUL_VERIFIED','131':'CHARACTER_READY','35':'OTA_SUCCESS','50':'ROLLBACK_SUCCESS','151':'RECOVERY_SUCCESS','177':'REC_DISCARD_CANCEL'};
      if(special[s.page]){const found=opts.find(o=>o.route?.event===special[s.page]);if(found)return found;}
      if(opts[0].wait)return opts[0];
      const ui=pageMap[s.page].ui, reviewActions=[...ui.actions].sort((a,b)=>(a.reviewOrder??0)-(b.reviewOrder??0));
      const candidates=[...ui.items,...reviewActions].filter(i=>!i.disabled&&i.target!==s.page&&i.tone!=='danger');
      for(const i of candidates){const found=opts.find(o=>o.route?.event===i.event&&o.route?.target===i.target);if(found)return found;}
      return opts.find(o=>o.target!==s.page)||opts[0];
    }
    function applyOption(key,device=false){
      const option=options().find(o=>o.key===key);if(!option)return false;if(mode==='catalog'&&option.target&&!option.sample)return preview(option.target);
      (device?devicePerform:perform)(()=>{
        if(option.receipt){const {event,...receipt}=option.receipt;machine.dispatch(event,receipt);return;}
        if(option.wait){machine.tick(option.wait);return;}
        if(option.sample?.startsWith('food-')){
          const pet=machine.currentPet();pet.feed=option.sample==='food-full'?100:60;pet.feedAt=option.sample==='food-cooldown'?s.clock+300:0;pet.restAt=null;
          if(option.sample==='food-empty')s.foodInventory={revision:0,purchasedTotal:0,consumedTotal:0,status:'unsynced',error:null,requestId:null,deadline:null};
          machine.dispatch('PET_FEED_OPEN');return;
        }
        if(s.page==='01'){
          if(option.route.event==='BOOT_READY')s.bound=s.setupDone=s.networkConfigured=s.characterReady=true;
          if(option.route.event==='BOOT_INCOMPLETE'){s.bound=true;s.setupDone=false;}
          if(option.route.event==='BOOT_FAILED')s.recoveryMode=true;
        }
        machine.dispatch(option.route.event,payload(option.route));
      });return true;
    }
    function next(key){
      playing=false;manualPause=false;
      if(key&&mode==='flow')return applyOption(key);
      if(cursor<history.length-1)return restore(cursor+1);
      if(mode==='catalog'){const nextId=ids[ids.indexOf(s.page)+1];return nextId?preview(nextId):false;}
      const option=preferred();return option?applyOption(option.key):false;
    }
    function dispatch(event,args={}){if(event==='SCENARIO')return start(args.name);if(event==='PREVIEW')return preview(args.target);perform(()=>machine.dispatch(event,args));}
    function deviceDispatch(event,args={}){devicePerform(()=>machine.dispatch(event,args));}
    function tick(seconds){if(playing)perform(()=>machine.tick(seconds));}
    function info(){return {mode,playing,page:s.page,cursor,historyLength:history.length,visited:visited.size,total:ids.length,
      canBack:cursor>0,canNext:cursor<history.length-1||mode==='catalog'&&ids.indexOf(s.page)<ids.length-1||mode==='flow'&&!!preferred(),
      next:cursor<history.length-1?'P'+history[cursor+1].state.page:mode==='catalog'?(ids[ids.indexOf(s.page)+1]?'P'+ids[ids.indexOf(s.page)+1]:'已到最后一页'):preferred()?.label||'无后续流转'};}
    start();
    return {dispatch,deviceDispatch,perform,devicePerform,preview,start,next,back:()=>restore(cursor-1),options,preferred,applyOption,tick,info,
      setMode:value=>{const nextMode=value==='catalog'?'catalog':'flow';if(nextMode!==mode)history.splice(cursor+1);mode=nextMode;playing=false;manualPause=false;},toggleTime:()=>{playing=!playing;manualPause=!playing;return playing;},
      history:()=>history.map(entry=>structuredClone(entry))};
  }
  const api={createSession};if(typeof module!=='undefined'&&module.exports)module.exports=api;global.LG01Review=api;
})(typeof window!=='undefined'?window:globalThis);
