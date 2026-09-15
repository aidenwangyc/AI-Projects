(function (global) {
  'use strict';
  function createMachine(data) {
    // Keep runtime-only states (such as display-off) available to the device model
    // even when they are intentionally omitted from the visual review catalog.
    const pageMap = Object.fromEntries([...data.groups.flatMap(g => g.pages), ...Object.values(data.runtimePages || {})].map(p => [p.n, p]));
    const retiredTutorials = new Set(['80','84','85','86']);
    const s = {
      page: '10', clock: 0, enteredAt: 0, origin: '10', aiOrigin: '10', recOrigin: '10', recordingMenuOrigin:'74', soulOrigin:'10', wifiOrigin: '180',
      language:'en', deviceLanguage:null, languageChosen:false, languageOrigin:'setup', provisionOrigin:'setup',
      bindSessionId:null, bindDeadline:null, wifiListPage:'109', wifiScanId:null, wifiScanDeadline:null, connectionDeadline:null, wifiPrevious:null, wifiOpen:false,wifiError:'',
      pendingCompanion:'lumi', companionOrigin:'setup', selectedRecordId:null, deletingRecordId:null, playbackOn:false, playbackSeconds:0,
      availableCompanions:[{id:'lumi',name:'Lumi'},{id:'pico',name:'Pico'},{id:'momo',name:'Momo'}],
      localDeviceId:'lg01-local',friendsOrigin:'74',friendDetailOrigin:'185',socialErrorOrigin:'185',selectedFriendId:'milo',
      friends:{milo:{peerId:'milo',peerName:'Milo',pet:{id:'milo-pet',name:'Milo',appearance:'pico'},established:true,source:'sample',establishedAt:0}},
      peerEncounter:null,peerImport:null,peerDiscoveryOrigin:'185',friendMessageReadRevisions:{},
      returnStack: [], powerOn: true, displayOn: true, bound: true, setupDone: true, characterReady: true,
      networkConfigured: true, networkSkipped:false, wifiEnabled: true, networkConnected: true, cloudAvailable: true,
      micLocked: false, quiet: false, aiConsent: false, aiActive: false, careEnabled: false, careActive: false,
      careSessionId:null,careFeedbackId:null,careFeedbackOrigin:'58',carePauseReason:'',
      recording: false, seconds: 0, draft: false, records: [], saveFail: false, storageAvailable: true,
      // Food is purchased in the companion app and synced as a cumulative,
      // device-scoped balance. The device never creates food locally.
      foodInventory: {revision:0,purchasedTotal:0,consumedTotal:0,status:'unsynced',error:null,requestId:null,deadline:null},
      pendingReminder: false, noticeStatus: 'scheduled', noticeVersion: 1, snoozeAt: null, noteDueAt: 600,
      noteTitle: 'Bring your umbrella', noteReturn: '10', noteDeleted: false,
      password: '', showPassword: false, keyboardMode: 'lower', keyboardPage: 0, ssid: 'Home',
      volume: 40, brightness: 55, stepCount: 4820, characterName: 'Lumi', characterId: 'lumi',
      characterLevel:1, growthOrigin:'10', pendingGrowth:null,
      hasRecorderLight: false, recoveryMode: false, avatarConsentBoth: false, avatarPending: false,
      socialAllowed: false, relationValid: true, messageStatus: 'idle', targetCharacter: 'Lumi', targetCharacterId:null,
      newCharacter: 'Nova', statusMessage: '', logs: [], auto: null, jobs:[], idleSeconds: 0,
      avatarLocalConsent: false, avatarRemoteConsent: false, friendPending: false, partnerPending: false,
      soulAuthorized: false, soulStage: 'idle', soulSessionId:null, soulDeadline:null, pets: {}, petIntent: null, petFeedback: null, petOrigin: '10', shutdownAfterSave: false, draftExpiresAt: null,
      photoRequests:{}, photoRequestId:null, photoView:false, photoOrigin:'10', deferredReminder:false,
      activationPending:false, activationSerial:0, messageSerial:0, avatarDeadline:null, partnerDeadline:null,
      careLastSound:-Infinity, noteQueue:[], noteId:'note-1', notes:{'note-2':{noteId:'note-2',noteTitle:'Take a break',noticeStatus:'due',noticeVersion:1,noteDeleted:false,snoozeAt:null,noteDueAt:1200}},
      task:null, safety:null, serial:0, currentRecording:null, discardConfirmationId:null,lastRecordingOutcome:null,saveHang:false,saveDeadlineSeconds:10,
      uploadPermission:'unknown', uploadPermissionVersion:0, aiPolicy:'unknown', aiPolicyVersion:0, aiPolicyExpiresAt:null,
      consentVersion:0, requiredConsentVersion:1, aiSessionId:null, aiRequestId:null, aiReturnId:null,
      requests:{}, requestId:null, notifications:[], noteMutations:[], noteViewVersion:null,
      displayMode:'black', standbyTimeout:30, quietOverride:null, localHour:12, battery:78, connectionId:null,
      dock:{connected:false,sessionId:null,status:'off',revision:0,feedbackUntil:null,errorPending:false},
      dockSync:{status:'idle',attemptId:null,sessionId:null,deadline:null},
    };
    const noteFields=['noteId','noteTitle','noticeStatus','noticeVersion','noteDeleted','snoozeAt','noteDueAt'];
    function storeNote(){s.notes[s.noteId]={...s.notes[s.noteId],...Object.fromEntries(noteFields.map(k=>[k,s[k]]))};}
    function loadNote(payload){storeNote();const id=payload.noteId || Object.keys(s.notes).find(id=>s.notes[id].noteTitle===payload.label) || (s.notes[payload.value]?payload.value:null);if(id && s.notes[id])Object.assign(s,s.notes[id]);}
    function nextId(prefix){return prefix+'-'+(++s.serial);}
    function syncNoteQueue(){s.noteQueue=Object.values(s.notes).filter(n=>n.noticeStatus==='due'&&!n.noteDeleted).sort((a,b)=>a.noteDueAt-b.noteDueAt||a.noteId.localeCompare(b.noteId)).map(n=>n.noteId);s.pendingReminder=s.noteQueue.length>0;}
    function presentReminder(){
      if(!s.deferredReminder||!s.pendingReminder||!s.setupDone||s.quiet||!canPresent()||!['10','24','26','74','77','58','82'].includes(s.page))return;
      storeNote();syncNoteQueue();const note=s.notes[s.noteQueue[0]];if(!note)return;
      s.deferredReminder=false;s.noteReturn=s.page;Object.assign(s,note);s.noteViewVersion=s.noticeVersion;go('68');
    }
    function sendNoteMutation(mutation){
      if(mutation.status==='sending')return;
      const earlier=s.noteMutations.some(item=>item!==mutation&&item.noteId===mutation.noteId&&s.noteMutations.indexOf(item)<s.noteMutations.indexOf(mutation));
      if(earlier||!s.networkConnected||!s.wifiEnabled||!s.cloudAvailable){mutation.status='pending';mutation.attemptId=null;mutation.deadline=null;return;}
      mutation.status='sending';mutation.attemptId=nextId('note-sync');mutation.deadline=s.clock+15;
    }
    function mutateNote(action){
      const mutation={operationId:nextId('note-op'),noteId:s.noteId,baseRevision:s.noticeVersion,action,at:s.clock,...(action==='later'?{until:s.clock+600}:{})};
      s.noteMutations.push(mutation);sendNoteMutation(mutation);
    }
    const photoPages=new Set(['51','52','53','102','154','155','156']);
    function photoPage(request){return {waiting:'51',generating:'52',completed:'53',failed:'102'}[request.status];}
    function openPhoto(request){s.photoView=true;s.photoRequestId=request.id;go(photoPage(request));}
    function photoReply(payload){const r=s.photoRequests[payload.requestId];return r&&r.attemptId===payload.attemptId&&r.attemptId&&r.status==='generating'&&s.clock<r.deadline?r:null;}
    function soulReply(payload){return s.soulAuthorized&&!!s.soulSessionId&&payload.sessionId===s.soulSessionId&&s.clock<s.soulDeadline;}
    function endSoul(stage){finishTask('soul');s.soulStage=stage;s.soulSessionId=null;s.soulDeadline=null;}
    const careAmbientPages=new Set(['10','24','26','74','82','58']);
    const careFeedbackPages=new Set(['59','60','61','62','63','64','65','66']);
    function stopCare(){s.careEnabled=false;s.careActive=false;s.careSessionId=null;s.careFeedbackId=null;s.carePauseReason='';}
    function syncCare(){
      const reason=!s.powerOn||s.safety||s.recoveryMode||s.task?'system':s.micLocked?'microphone':!s.displayOn||['79','120'].includes(s.page)?'screen-off':s.recording||s.draft?'recording':s.aiActive?'conversation':careFeedbackPages.has(s.page)?'feedback':!careAmbientPages.has(s.page)?'other-task':'';
      const active=s.careEnabled&&!reason;
      if(active&&!s.careActive)s.careSessionId=nextId('care');
      if(!active)s.careSessionId=null;
      s.careActive=active;s.carePauseReason=s.careEnabled?reason:'';
    }
    function careSignalValid(payload){return s.careEnabled&&s.careActive&&!!s.careSessionId&&payload.careSessionId===s.careSessionId;}
    function careFeedback(target){
      if(!careFeedbackPages.has(s.page))s.careFeedbackOrigin=s.page;
      s.careLastSound=s.clock;s.careFeedbackId=nextId('comfort');go(target);
      later('CARE_FEEDBACK_DONE',target==='59'?6:12,{feedbackId:s.careFeedbackId});
    }
    function finishCareFeedback(){
      if(!careFeedbackPages.has(s.page))return;
      const target=s.careEnabled&&careAmbientPages.has(s.careFeedbackOrigin)?s.careFeedbackOrigin:s.careEnabled?'58':'82';
      s.careFeedbackId=null;go(target);
    }
    function beginWifiFlow(){
      if(!s.wifiPrevious)s.wifiPrevious={ssid:s.ssid,networkConnected:s.networkConnected,networkConfigured:s.networkConfigured,wifiEnabled:s.wifiEnabled};
      s.wifiListPage=s.setupDone?'109':'05';s.wifiEnabled=true;
    }
    function clearWifiAttempt(restore=false){
      s.wifiError='';
      s.connectionId=null;s.connectionDeadline=null;s.wifiScanId=null;s.wifiScanDeadline=null;s.password='';s.showPassword=false;
      if(restore&&s.wifiPrevious)Object.assign(s,s.wifiPrevious);
    }
    function joinWifi(){
      s.wifiEnabled=true;s.networkConnected=false;s.connectionId=nextId('wifi');s.connectionDeadline=s.clock+30;
      go('111');later('WIFI_CONNECTED',2,{connectionId:s.connectionId});
    }
    function wifiReplyMatches(payload){return s.page==='111'&&!!s.connectionId&&payload.connectionId===s.connectionId;}
    function scanReplyMatches(payload){return s.page==='126'&&!!s.wifiScanId&&payload.scanId===s.wifiScanId;}
    const petPages=new Set(['93','94','95','96','97','98','99','157','175']);
    const recordingPages=new Set(['70','71','72','73','81','121','122','123','124','125','158','164','168','171','177','182','183','184','42']);
    const memoryPages=new Set(['29','146','147','148','08','39','40','149']);
    const friendChildren=new Set(['54','55','56','87','88','89','90','91','92','102','136','137','138','139','140','141','142','143','144','145','169','176','188','189','190','191']);
    const greetingPages=new Set(['136','137','138','139']);
    const petRules={initialValue:60,feedGain:20,cleanValue:100,restGain:30,restSeconds:900,cooldownSeconds:300,exploreCost:20,exploreFloor:20,feedbackSeconds:2.4,...data.petRules};
    function currentPet(){
      const id=s.characterId;
      if(!s.pets[id])s.pets[id]={avatarId:id,name:s.characterName,feed:petRules.initialValue,clean:petRules.initialValue,energy:petRules.initialValue,feedAt:0,cleanAt:0,restAt:null,exploreAt:0,restActionId:null,restRevision:null,revision:0,appliedActions:[]};
      return s.pets[id];
    }
    function syncPet(){const pet=currentPet();s.petFeed=pet.feed;s.petClean=pet.clean;s.petEnergy=pet.energy;s.characterLevel=pet.level||1;}
    function presentGrowth(){
      if(s.pendingGrowth===s.characterId&&canPresent()&&['10','24','26','93'].includes(s.page)){
        s.growthOrigin=s.page;s.pendingGrowth=null;syncPet();go('18');
      }
    }
    function petHome(){while(petPages.has(s.returnStack.at(-1)))s.returnStack.pop();s.petIntent=null;go('93');}
    function petAvailable(action,pet=currentPet()){
      if(action==='feed')return validFeedCompanion()&&pet.feed<100&&s.clock>=pet.feedAt&&pet.restAt===null&&foodAvailable();
      if(action==='clean')return pet.clean<100&&s.clock>=pet.cleanAt;
      if(action==='rest')return pet.energy<100&&pet.restAt===null;
      if(action==='explore')return pet.restAt===null&&s.clock>=pet.exploreAt;
      return false;
    }
    function foodAvailable(){const f=s.foodInventory;return !!f&&Number.isSafeInteger(f.purchasedTotal)&&Number.isSafeInteger(f.consumedTotal)&&f.purchasedTotal>=f.consumedTotal&&f.purchasedTotal-f.consumedTotal>0;}
    function validInventoryTotal(value){return Number.isSafeInteger(value)&&value>=0;}
    function validFeedCompanion(){return s.characterReady&&s.availableCompanions.some(item=>item.id===s.characterId);}
    function ensurePetIntent(action){const pet=currentPet();s.petIntent={avatarId:pet.avatarId,actionId:nextId('pet'),baseRevision:pet.revision,action};return s.petIntent;}
    function petPayloadMatches(payload,reference){return ['avatarId','actionId','baseRevision'].every(k=>payload[k]===undefined||payload[k]===reference[k])&&(payload.revision===undefined||payload.revision===reference.baseRevision);}
    function validPetIntent(action,payload){
      const intent=s.petIntent,pet=currentPet(),allowed={feed:['94'],clean:['95'],rest:['96'],explore:['97','98','99']};
      return !!intent&&intent.action===action&&intent.avatarId===s.characterId&&intent.baseRevision===pet.revision&&allowed[action].includes(s.page)&&petPayloadMatches(payload,intent)&&!pet.appliedActions.includes(intent.actionId);
    }
    function petUnavailable(action){
      s.petIntent=null;
      const pet=currentPet();
      const feedBlockedByState=action==='feed'&&(!validFeedCompanion()||pet.feed>=100||s.clock<pet.feedAt||pet.restAt!==null);
      s.petUnavailableReason=action==='feed'&&!validFeedCompanion()?'PET_INVALID':action==='feed'&&!feedBlockedByState&&!foodAvailable()?'FOOD_EMPTY':'PET_'+action.toUpperCase();
      go('157');
    }
    function petFeedback(pet,text){s.petFeedback={avatarId:pet.avatarId,text,until:s.clock+petRules.feedbackSeconds};}
    function completePetRest(avatarId,actionId,revision){
      const pet=s.pets[avatarId];
      if(!pet||pet.restAt===null||s.clock<pet.restAt||pet.restActionId!==actionId||pet.restRevision!==revision)return false;
      pet.energy=Math.min(100,pet.energy+petRules.restGain);pet.restAt=null;pet.restActionId=null;pet.restRevision=null;pet.revision++;
      petFeedback(pet,'Feeling rested');if(avatarId===s.characterId){syncPet();if(s.page==='175'&&canPresent())petHome();}return true;
    }
    const taskPages={ota:['35'],rollback:['50'],save:['122'],soul:['147','148'],activation:['155'],peerImport:['189'],recovery:['151'],reboot:['153']};
    function beginTask(kind,seconds=120,id=nextId(kind)){s.task={kind,id,deadline:s.clock+seconds};}
    function finishTask(kind){if(s.task?.kind===kind)s.task=null;}
    function notify(type,id){
      if(!s.notifications.some(n=>n.type===type&&n.id===id))s.notifications.push({type,id,at:s.clock});
      if(type==='request'&&s.page==='165'&&s.requests[id])s.friendMessageReadRevisions[id]=s.requests[id].revision;
    }
    function canPresent(){return s.powerOn&&!s.task&&!s.safety&&!s.recording&&!s.draft&&!s.aiActive&&!careFeedbackPages.has(s.page)&&!s.recoveryMode&&!['34','48','118','119','120','79'].includes(s.page);}
    const homePages=new Set(['10','24','26']);
    const dockEvents=new Set(['DOCK_CONNECTED','DOCK_REMOVED','DOCK_CONTACT_ERROR','DOCK_FEEDBACK_DONE','CHARGE_UPDATED','DOCK_SYNC_START','DOCK_SYNC_DONE','DOCK_SYNC_FAILED']);
    function homePage(){return s.dock.connected?(s.dock.status==='full'?'26':'24'):'10';}
    function dockCanPresent(){return s.setupDone&&s.displayOn&&canPresent()&&!s.careActive&&homePages.has(s.page);}
    function refreshDockHome(){
      // Battery receipts update the idle face without resetting idle time or capture.
      if(homePages.has(s.page)&&s.powerOn&&s.displayOn&&!s.task&&!s.safety)s.page=homePage();
    }
    function presentDockError(){if(s.dock.errorPending&&dockCanPresent()){s.dock.errorPending=false;go('45');}}
    function pauseDockSync(){if(s.dockSync.status==='syncing'){s.dockSync.status='paused';s.dockSync.attemptId=null;s.dockSync.deadline=null;}}
    function dockEvent(event,payload){
      const d=s.dock,from=s.page;
      if(event==='DOCK_CONNECTED'){
        if(d.connected)return;
        Object.assign(d,{connected:true,sessionId:nextId('dock'),status:s.safety==='thermal'?'paused':'charging',revision:0,feedbackUntil:null,errorPending:false});
        if(dockCanPresent()||from==='45'&&s.setupDone&&s.displayOn&&canPresent()){
          go('23',{dockFeedback:true});d.feedbackUntil=s.clock+1.5;later('DOCK_FEEDBACK_DONE',1.5,{sessionId:d.sessionId});
        }else refreshDockHome();
      }else if(event==='DOCK_SYNC_START'){
        if(!d.connected||!s.setupDone||!s.displayOn||!canPresent()||s.careActive||!['24','26','46','47'].includes(from))return;
        if(s.dockSync.status!=='syncing')s.dockSync={status:'syncing',attemptId:nextId('dock-sync'),sessionId:d.sessionId,deadline:s.clock+120};
        go('25');
      }else{
        if(!d.sessionId||payload.sessionId!==d.sessionId)return;
        if(event==='CHARGE_UPDATED'){
          if(!d.connected||!Number.isSafeInteger(payload.revision)||payload.revision<=d.revision||!Number.isInteger(payload.battery)||payload.battery<0||payload.battery>100||!['charging','full','paused'].includes(payload.status)||payload.status==='full'&&payload.battery!==100)return;
          d.revision=payload.revision;s.battery=payload.battery;d.status=s.safety==='thermal'?'paused':payload.status;refreshDockHome();
        }else if(event==='DOCK_FEEDBACK_DONE'){
          if(!d.connected||from!=='23'||d.feedbackUntil===null||s.clock<d.feedbackUntil||!canPresent())return;
          go('10');
        }else if(event==='DOCK_REMOVED'||event==='DOCK_CONTACT_ERROR'){
          if(event==='DOCK_CONTACT_ERROR'&&!d.connected)return;
          const syncing=s.dockSync.status==='syncing';pauseDockSync();
          d.connected=false;d.status=event==='DOCK_CONTACT_ERROR'?'contact-error':'off';d.feedbackUntil=null;d.errorPending=event==='DOCK_CONTACT_ERROR';
          if(s.auto?.event==='DOCK_FEEDBACK_DONE')s.auto=null;
          if(event==='DOCK_REMOVED')d.sessionId=null;
          if(syncing&&from==='25'&&canPresent())go('46');
          else if(['23','45'].includes(from)&&canPresent())go('10');
          else refreshDockHome();
          presentDockError();
          if(d.errorPending)notify('system','dock-contact');
        }else if(event==='DOCK_SYNC_DONE'||event==='DOCK_SYNC_FAILED'){
          if(!d.connected||s.dockSync.status!=='syncing'||!s.dockSync.attemptId||payload.attemptId!==s.dockSync.attemptId||s.dockSync.sessionId!==d.sessionId)return;
          if(event==='DOCK_SYNC_DONE'&&s.clock>=s.dockSync.deadline)return;
          s.dockSync.status=event==='DOCK_SYNC_DONE'?'complete':'failed';s.dockSync.attemptId=null;s.dockSync.deadline=null;
          if(from==='25'&&canPresent())go(event==='DOCK_SYNC_DONE'?'10':'47');
        }
      }
      syncCare();log(event,from);
    }
    function recordingMatch(payload){const rec=s.currentRecording;return rec&&payload.recordingId===rec.id&&payload.attemptId===rec.attemptId&&rec.status==='saving';}
    function queueSync(rec){
      if(s.safety||!s.powerOn){if(rec.status!=='synced')rec.status=s.uploadPermission==='granted'?'pending':'local-only';return;}
      if(s.uploadPermission!=='granted'){rec.status='local-only';return;}
      if(rec.status==='synced'||rec.status==='uploading')return;
      rec.permissionVersion=s.uploadPermissionVersion;rec.uploadId=nextId('upload');rec.status='uploading';
      background(s.cloudAvailable&&s.networkConnected&&s.wifiEnabled?'REC_SYNCED':'REC_SYNC_FAIL',1.2,{recordId:rec.id,uploadId:rec.uploadId,permissionVersion:rec.permissionVersion});
    }
    function validPeerId(value){return typeof value==='string'&&/^[A-Za-z0-9._:-]{1,64}$/.test(value)&&!Object.hasOwn(Object.prototype,value);}
    function validPeerPet(pet){return !!pet&&validPeerId(pet.id)&&typeof pet.name==='string'&&pet.name.trim().length>0&&pet.name.length<=40&&['lumi','pico','momo'].includes(pet.appearance);}
    function peerSnapshot(peer){return {peerId:peer.peerId,peerName:peer.peerName,pet:{id:peer.pet.id,name:peer.pet.name,appearance:peer.pet.appearance}};}
    function peerCompanionId(peerId,petId){return 'peer:'+encodeURIComponent(peerId)+':'+encodeURIComponent(petId);}
    function selectedFriend(){return s.friends[s.selectedFriendId];}
    function peerImportError(){
      const friend=selectedFriend();
      if(!s.socialAllowed)return 'permission';
      if(!s.relationValid||!friend?.established||!s.peerImport||friend.peerId!==s.peerImport.peerId||friend.pet?.id!==s.peerImport.pet.id)return 'friend-unavailable';
      if(!s.wifiEnabled||!s.networkConnected)return 'offline';
      if(!s.storageAvailable)return 'storage';
      return null;
    }
    function failPeerImport(reason){
      if(!s.peerImport)return;
      finishTask('peerImport');s.peerImport.status='failed';s.peerImport.error=reason||'transfer';go('190');
    }
    function interruptPeerImport(){
      if(s.peerImport?.status!=='importing')return;
      s.peerImport.status='failed';s.peerImport.error='transfer';s.peerImport.attemptId=null;finishTask('peerImport');
    }
    function startPeerImport(){
      const job=s.peerImport;if(!job||!job.confirmed||!['awaiting','failed'].includes(job.status))return;
      const reason=peerImportError();if(reason){failPeerImport(reason);return;}
      job.attemptId=nextId('peer-import');job.status='importing';job.error=null;
      beginTask('peerImport',20,job.attemptId);go('189');later('PEER_IMPORT_SUCCESS',1.5,{attemptId:job.attemptId});
    }
    function newRequest(kind,peer=null){
      const existing=Object.values(s.requests).find(r=>r.kind===kind&&['waiting','generating'].includes(r.status)&&s.clock<r.deadline&&r.peer?.peerId===peer?.peerId);
      const r=existing||{id:nextId('request'),kind,status:'waiting',revision:1,createdAt:s.clock,deadline:s.clock+(kind==='avatar'?300:60),localConsent:true,remoteConsent:false,...(peer?{peer:peerSnapshot(peer),encounterId:peer.encounterId}:{})};
      s.requests[r.id]=r;s.requestId=r.id;return r;
    }
    function requestPage(r){return r.status==='completed'?(r.kind==='avatar'?'92':r.kind==='partner'?'90':'56'):r.status==='generating'?'91':r.status==='failed'?'102':['expired','cancelled','declined'].includes(r.status)?'144':r.kind==='avatar'?(r.localConsent?'143':'142'):r.kind==='partner'?'89':'176';}
    function requestCallback(event,payload){
      const r=s.requests[payload.requestId];if(!r||payload.revision!==r.revision)return;
      if(r.peer&&payload.peerId!==undefined&&payload.peerId!==r.peer.peerId)return;
      const visible=s.requestId===r.id&&['89','91','142','143','176'].includes(s.page)&&canPresent();
      if(['AVATAR_REMOTE_ACCEPT','FRIEND_REMOTE_ACCEPT','FRIEND_CONFIRMED','PARTNER_CONFIRMED','PARTNER_ACCEPTED'].includes(event)){
        if(!(r.kind==='friend'?['FRIEND_REMOTE_ACCEPT','FRIEND_CONFIRMED']:r.kind==='partner'?['PARTNER_CONFIRMED','PARTNER_ACCEPTED']:['AVATAR_REMOTE_ACCEPT']).includes(event))return;
        if(r.status!=='waiting'||s.clock>=r.deadline||!s.socialAllowed||(r.kind!=='friend'&&!s.relationValid)||!r.localConsent)return;
        if(r.kind==='friend'&&(!r.peer||!validPeerPet(r.peer.pet)||(payload.peerId!==undefined&&payload.peerId!==r.peer.peerId)))return;
        r.remoteConsent=true;r.status=r.kind==='avatar'?'generating':'completed';
        if(r.kind==='avatar'){s.avatarRemoteConsent=s.avatarConsentBoth=true;r.deadline=s.clock+120;}
        else {
          s.friendPending=s.partnerPending=false;s.partnerDeadline=null;
          if(r.kind==='friend'){
            const old=s.friends[r.peer.peerId];
            if(!old||old.source==='sample')s.friends[r.peer.peerId]={...peerSnapshot(r.peer),established:true,source:'tap',establishedAt:s.clock};
            if(visible)s.selectedFriendId=r.peer.peerId;
          }
        }
      }else if(event==='FRIEND_REMOTE_DECLINE'){
        if(r.kind!=='friend'||r.status!=='waiting'||s.clock>=r.deadline)return;
        r.status='declined';s.friendPending=false;
      }else if(event==='AVATAR_CREATED'){
        if(r.kind!=='avatar'||r.status!=='generating'||!r.localConsent||!r.remoteConsent||!s.socialAllowed||!s.relationValid)return;
        r.status='completed';r.resultId=payload.resultId||nextId('avatar');r.characterName=payload.characterName||'Nova';s.avatarPending=false;
        if(visible){s.newCharacter=r.characterName;s.newCharacterId=r.resultId;}
      }else if(event==='AVATAR_FAILED'){if(r.status!=='generating')return;r.status='failed';s.avatarPending=false;}
      else {if(!['waiting','generating'].includes(r.status))return;r.status=r.status==='generating'?'failed':'expired';s.avatarPending=s.friendPending=s.partnerPending=false;}
      r.revision++;notify('request',r.id);if(visible)go(requestPage(r));
    }
    function log(event, from) {
      s.logs.unshift({ event, from, to: s.page, time: s.clock });
      s.logs = s.logs.slice(0, 40);
    }
    function go(id, options = {}) {
      const poweringOff=String(id)==='119';
      id = data.pageAliases?.[String(id)] || String(id);
      if(id==='23'&&!options.dockFeedback)id=homePage();
      if(homePages.has(id))id=homePage();
      if(retiredTutorials.has(id))return;
      if (!pageMap[id]) throw new Error('Unknown page: ' + id);
      if(s.task&&!taskPages[s.task.kind].includes(id))return;
      if(s.safety&&!poweringOff&&!['34','48','119','153','101'].includes(id))return;
      if(s.recording&&!['71','81','121'].includes(id))return;
      if (s.recoveryMode && !poweringOff&&!['101', '150', '151', '152', '153', '01', '119', '48', '34'].includes(id)) return;
      if(s.page==='146'&&s.soulSessionId&&!['146','147','148'].includes(id))endSoul('paused');
      if(id==='70'&&!recordingPages.has(s.page)){s.recordingMenuOrigin=s.page==='74'?'74':'10';s.recOrigin=s.recordingMenuOrigin;}
      if(id==='29'&&!memoryPages.has(s.page))s.soulOrigin=['10','75','180'].includes(s.page)?s.page:'10';
      if(id==='185'&&!friendChildren.has(s.page)&&s.page!=='165')s.friendsOrigin=s.page==='74'?'74':'10';
      if(['169','140'].includes(id)&&!['169','140'].includes(s.page))s.socialErrorOrigin=greetingPages.has(s.page)?'56':['54','55'].includes(s.page)?s.peerDiscoveryOrigin:['87','185'].includes(s.page)?'185':friendChildren.has(s.page)?s.page:'185';
      if(id==='93'&&!petPages.has(s.page)&&!(s.page==='18'&&s.growthOrigin==='93')&&!(s.page==='186'&&['pet','friends'].includes(s.companionOrigin))&&!(s.photoView&&photoPages.has(s.page)))s.petOrigin=s.page==='74'?'74':'10';
      if(s.petIntent&&!petPages.has(id))s.petIntent=null;
      if(id==='154'&&s.page!=='154'){
        // Confirm and retry the selected result, not the latest background result.
        const result=s.photoView?s.photoRequests[s.photoRequestId]:s.page==='92'?s.requests[s.requestId]:null;
        s.targetCharacter=result?.characterName||s.newCharacter;
        s.targetCharacterId=result?.resultId||s.newCharacterId||'nova';
      }
      if(!photoPages.has(id))s.photoView=false;
      if (options.push && id !== s.page) s.returnStack.push(s.page);
      if (!['14','15','16','41','43','44'].includes(id)) {s.aiActive=false;s.aiSessionId=null;s.aiRequestId=null;}
      if(id!=='76')s.aiReturnId=null;
      if(['82','58'].includes(id))id=s.careEnabled?'58':'82';
      if(!careFeedbackPages.has(id))s.careFeedbackId=null;
      if(s.page==='177'&&id!=='177')s.discardConfirmationId=null;
      if(id!=='23')s.dock.feedbackUntil=null;
      s.page = id; s.enteredAt = s.clock; s.idleSeconds = 0; s.auto = null;
      if(id!=='182')s.playbackOn=false;
      s.displayOn = !['119', '120'].includes(id);
      if (poweringOff) s.powerOn = false;
      if(!s.task){const kind=Object.keys(taskPages).find(k=>taskPages[k].includes(id));if(kind)beginTask(kind,kind==='ota'||kind==='rollback'||kind==='recovery'?300:120,kind==='soul'?s.soulSessionId:undefined);}
      if (id === '93') syncPet();
      if(id==='165')for(const request of Object.values(s.requests))s.friendMessageReadRevisions[request.id]=request.revision;
      if (id === '161') gateAI();
      syncCare();
    }
    function later(event, seconds, payload = {}) { s.auto = { event, at: s.clock + seconds, payload }; }
    function background(event, seconds, payload={}){s.jobs.push({event,at:s.clock+seconds,payload});}
    function stopCapture(preserveCare=false) { s.aiActive=false;if(!preserveCare)stopCare();else{s.careActive=false;s.careSessionId=null;} }
    function micTask() { return s.micLocked ? 'none' : s.recording ? 'recording' : s.aiActive && s.page==='14' ? 'ai' : s.careActive ? 'care' : 'none'; }
    function back(fallback) {
      let target = s.returnStack.pop() || fallback || s.origin || '10';
      if (target === s.page || ['14', '15', '16', '161'].includes(target)) target = '10';
      go(target);
    }
    // Drop only completed subflow entries, leaving the owning menu's history intact.
    function returnTo(target,transientPages=new Set()){
      while(transientPages.has(s.returnStack.at(-1)))s.returnStack.pop();
      if(s.returnStack.at(-1)===target)s.returnStack.pop();
      go(target);
    }
    function gateAI() {
      if (!s.powerOn) return go('119');
      if (s.recording || s.draft || s.page==='122') { s.statusMessage = '请先保存或丢弃当前录音'; return go(s.recording ? '71' : s.page==='122' ? '122' : '125'); }
      if (s.micLocked) { go(s.aiOrigin==='74'?'74':'10');s.statusMessage='硬件麦克风已静音';return; }
      // Direct device entry needs no phone setup or synthesized consent record.
      if(['deny','revoked'].includes(s.aiPolicy)){go('170');s.statusMessage='对话权限暂不可用，请稍后重试';return;}
      if (!s.wifiEnabled || !s.networkConnected) return go('21');
      if (!s.cloudAvailable) return go('78');
      if(s.aiActive&&s.aiSessionId&&['14','15','16'].includes(s.page))return;
      s.careActive=false;s.careSessionId=null;s.aiActive=true;s.aiSessionId=nextId('ai');s.aiRequestId=null;go('14');
    }
    function saveRecording() {
      const rec=s.currentRecording;if(!rec||rec.status==='saving'||rec.status==='saved')return;
      s.recording = false; s.draft = true; s.aiActive = false;
      rec.seconds=s.seconds;rec.status='saving';rec.attemptId=nextId('save');rec.shutdown=!!s.shutdownAfterSave;
      beginTask('save',s.saveDeadlineSeconds,rec.attemptId);go('122');
      if(!s.saveHang)background(s.saveFail?'REC_SAVE_FAILED':'REC_SAVED',1,{recordingId:rec.id,attemptId:rec.attemptId});
    }
    function showPostSave() {
      if (s.pendingReminder) { s.pendingReminder = false; go('164'); }
      else returnTo(s.recOrigin || '10',recordingPages);
    }
    function resumeSetup() {
      if (!s.bound) return go(s.languageChosen ? '02' : '178');
      if (!s.networkConfigured && !s.networkSkipped) {
        s.wifiListPage = '05';
        dispatch('WIFI_SCAN');
        return;
      }
      if (!s.characterReady) { dispatch('CHARACTER_PICKER'); return; }
      completeSetup(false);
    }
    function openNote() {
      if (s.noteDeleted) return go('159');
      s.noteViewVersion=s.noticeVersion;go('134');
    }
    function boot() {
      s.powerOn = true; s.displayOn = true; s.password = ''; s.showPassword = false;
      if(s.safety)return go(s.safety==='thermal'?'48':'34');
      if (s.recoveryMode) return go('101');
      if (s.draft) return go('73');
      if (!s.bound) return go(s.languageChosen?'02':'178');
      if((s.networkConfigured||s.networkSkipped)&&s.characterReady)s.setupDone=true;
      if (!s.setupDone) return resumeSetup();
      go('10');
    }
    function completeSetup(greeting) {
      if(!s.bound||!(s.networkConfigured||s.networkSkipped)||!s.characterReady){dispatch('SETUP_RESUME');return;}
      s.setupDone=true;go(greeting?'09':'10');
      if(greeting)later('GREETING_DONE',1.5);
    }
    function dispatch(event, payload = {}) {
      const from = s.page;
      if(['CHARGING_STARTED','POWER_CONNECTED'].includes(event))event='DOCK_CONNECTED';
      // Hardware power receipts must not wake the screen, clear input, or restart idle timers.
      if(dockEvents.has(event)){dockEvent(event,payload);return s;}
      // Level values come from the product's progression source, not local XP guesses.
      if(event==='LEVEL_UPDATED'){
        if(payload.avatarId!==s.characterId||!Number.isSafeInteger(payload.level)||payload.level<1)return s;
        const pet=currentPet();if(payload.level<=(pet.level||1))return s;
        pet.level=payload.level;s.pendingGrowth=s.characterId;syncPet();presentGrowth();return s;
      }
      // Retired prototype events and links cannot complete setup or reopen teaching pages.
      if(event.startsWith('TUTORIAL_')||retiredTutorials.has(String(payload.target)))return s;
      if(event==='CARE_SOUND'||event.startsWith('CARE_EXPLICIT_')){
        const choice=event!=='CARE_SOUND'&&from==='59'&&s.careEnabled&&!!s.careFeedbackId&&payload.feedbackId===s.careFeedbackId;
        if(!choice&&!careSignalValid(payload))return s;
      }
      if(['CARE_ACCEPT','CARE_QUIET','CARE_HIGH_VOLUME','CARE_CONTINUE','CARE_NEED_HELP','CARE_SLEEP_COMPLETE','CARE_FEEDBACK_DONE'].includes(event)&&(!s.careEnabled||!s.careFeedbackId||payload.feedbackId!==s.careFeedbackId))return s;
      s.statusMessage = ''; s.idleSeconds = 0;
      const callbacks=['REC_SYNCED','REC_SYNC_FAIL','AVATAR_REMOTE_ACCEPT','AVATAR_CREATED','AVATAR_FAILED','AVATAR_EXPIRED','FRIEND_REMOTE_ACCEPT','FRIEND_CONFIRMED','FRIEND_REMOTE_DECLINE','PARTNER_CONFIRMED','PARTNER_ACCEPTED','PARTNER_ENDED','SOCIAL_SENT','SOCIAL_QUEUED','NOTE_DUE','NOTE_SNOOZE_DUE','NOTE_REMOTE_CREATE','NOTE_REMOTE_UPDATE','NOTE_REMOTE_DELETE','NOTE_SYNC_RESULT','REVIVE_REQUESTED','REVIVE_START','REVIVE_SUCCESS','REVIVE_FAILED','AI_POLICY','UPLOAD_PERMISSION','PET_REST_COMPLETED','FOOD_INVENTORY_SYNC','FOOD_SYNC_FAILED'];
      const taskEvents={save:['REC_SAVED','REC_SAVE_FAILED'],ota:['OTA_SUCCESS','OTA_FAIL'],rollback:['ROLLBACK_SUCCESS','ROLLBACK_FAILED'],soul:['SOUL_TRANSFERRED','SOUL_VERIFIED','SOUL_INTERRUPTED','SOUL_VERIFY_FAILED','SOUL_TIMEOUT','SOUL_CANCEL'],activation:['AVATAR_ACTIVATED','AVATAR_ACTIVATE_FAILED'],peerImport:['PEER_IMPORT_SUCCESS','PEER_IMPORT_FAILED','PEER_IMPORT_CANCEL','BACK'],recovery:['RECOVERY_SUCCESS','RECOVERY_FAIL'],reboot:['BOOT']};
      const interrupts=['MUTE_TOGGLE','CARE_END','ENV','REBOOT','BATTERY_CRITICAL','THERMAL_LIMIT','PREVIEW','SCENARIO','TICK'];
      if(s.safety&&!callbacks.includes(event)&&!interrupts.includes(event)&&!['BOOT','POWER_OFF','THERMAL_CLEAR','TEMPERATURE_NORMAL','SAFETY_CLEAR'].includes(event))return s;
      if(s.task&&!callbacks.includes(event)&&!interrupts.includes(event)&&!taskEvents[s.task.kind].includes(event)){s.statusMessage='当前任务处理中';return s;}
      if(s.recording&&!callbacks.includes(event)&&!interrupts.includes(event)&&!['REC_PAUSE','REC_START','REC_STOP','REC_LIMIT','REC_BACK','REC_CONTINUE','REC_NOTICE_DISMISS','SCREEN_OFF','WAKE','POWER_CONFIRM','POWER_OFF','NOTE_DUE','NOTE_SNOOZE_DUE','BACK'].includes(event)){s.statusMessage='请先停止录音';return s;}
      if (!s.powerOn && !callbacks.includes(event)&&!['POWER_ON', 'REBOOT', 'PREVIEW', 'SCENARIO', 'ENV', 'TICK'].includes(event)) return s;
      if (s.recoveryMode && ['SCREEN_OFF', 'REC_START', 'AI_START', 'CARE_START'].includes(event)) {
        s.statusMessage = '系统恢复中'; return s;
      }
      switch (event) {
        case 'SCENARIO': {
          s.languageChosen=payload.name!=='setup';s.languageOrigin='setup';s.provisionOrigin=payload.name==='setup'?'setup':'settings';s.wifiOrigin='180';s.playbackOn=false;s.playbackSeconds=0;s.selectedRecordId=null;s.deletingRecordId=null;
          s.deviceLanguage=null;s.bindSessionId=null;s.bindDeadline=null;s.wifiPrevious=null;s.wifiOpen=false;s.wifiListPage=payload.name==='setup'?'05':'109';clearWifiAttempt();
          s.discardConfirmationId=null;s.lastRecordingOutcome=null;
          s.petIntent=null;s.petFeedback=null;s.petOrigin='10';s.pendingGrowth=null;s.careLastSound=-Infinity;
          s.recordingMenuOrigin='10';s.soulOrigin='10';s.friendsOrigin='74';s.friendDetailOrigin='185';s.socialErrorOrigin='185';s.peerEncounter=null;s.peerImport=null;s.peerDiscoveryOrigin='185';s.friendMessageReadRevisions={};
          s.task=null;s.safety=null;s.currentRecording=null;s.draftExpiresAt=null;s.requests={};s.requestId=null;s.notifications=[];s.noteMutations=[];s.aiPolicy='unknown';s.aiPolicyVersion=0;s.uploadPermission='unknown';s.uploadPermissionVersion=0;s.consentVersion=0;s.noteViewVersion=null;s.saveHang=false;
          s.photoRequests={};s.photoRequestId=null;s.photoView=false;s.photoOrigin='10';s.deferredReminder=false;s.soulSessionId=null;s.soulDeadline=null;
          s.returnStack = []; s.powerOn = true; s.recoveryMode = false; s.auto = null;s.jobs=[];
          s.recording = false; s.draft = false; s.seconds = 0; s.pendingReminder = false; stopCapture();
          s.micLocked = false; s.aiOrigin = '10'; s.recOrigin = '10'; s.origin = '10'; s.aiConsent = false;
          s.password = ''; s.showPassword = false; s.keyboardMode='lower';s.keyboardPage=0;s.noticeStatus = 'scheduled'; s.noteDeleted = false;
          s.noteDueAt=s.clock+600;s.noteId='note-1';s.notes={'note-2':{noteId:'note-2',noteTitle:'Take a break',noticeStatus:'due',noticeVersion:1,noteDeleted:false,snoozeAt:null,noteDueAt:s.clock+1200}};s.noteQueue=[];
          s.snoozeAt = null; s.bound = true; s.setupDone = true; s.characterReady = true;
          s.networkConfigured = true;s.networkSkipped=false;s.wifiEnabled = true; s.networkConnected = true; s.cloudAvailable = true;
          s.saveFail = false; s.storageAvailable = true; s.avatarConsentBoth = false;
          s.foodInventory={revision:0,purchasedTotal:0,consumedTotal:0,status:'unsynced',error:null,requestId:null,deadline:null};
          s.socialAllowed=false;
          s.avatarLocalConsent = s.avatarRemoteConsent = s.avatarPending = false;
          s.shutdownAfterSave = false; s.soulAuthorized = false; s.noteReturn = '10';s.avatarDeadline=null;s.partnerDeadline=null;s.activationPending=false;s.targetCharacterId=null;
          if (payload.name === 'setup') { s.bound = false; s.setupDone = false; s.characterReady = false; s.networkConfigured = false; s.networkConnected=false;go('01'); later('BOOT', 1); }
          else if (payload.name === 'wifi') { beginWifiFlow();go('110'); }
          else if (payload.name === 'recording') go('70');
          else if (payload.name === 'note') { s.noticeStatus = 'due'; go('68'); }
          else if (payload.name === 'recovery') { s.recoveryMode = true; go('101'); }
          else go('10');
          break;
        }
        case 'PREVIEW': {
          interruptPeerImport();
          s.discardConfirmationId=null;
          s.petIntent=null;
          s.task=null;s.safety=null;s.currentRecording=null;s.draft=false;
          s.auto = null; stopCapture(); s.recording = false; s.returnStack = []; s.powerOn = true;
          s.recoveryMode = ['101', '150', '151', '152'].includes(payload.target);
          if (['71', '81', '121'].includes(payload.target)) { s.recording = true; s.draft = true; s.seconds = 8; s.micLocked = false; }
          if(s.recording||['73','122','125','177'].includes(payload.target)){s.draft=true;s.currentRecording={id:nextId('rec'),status:'draft',seconds:s.seconds,expiresAt:null};}
          if(payload.target==='177')s.discardConfirmationId=s.currentRecording.id;
          if(payload.target==='58')s.careEnabled=true;
          if(careFeedbackPages.has(payload.target)){s.careEnabled=true;s.careFeedbackId=nextId('comfort');s.careFeedbackOrigin='58';}
          if (['14', '15', '16'].includes(payload.target)) { s.aiConsent = true; s.aiActive = true; }
          if (payload.target === '68') s.noticeStatus = 'due';
          if (payload.target === '110') { s.password = ''; s.showPassword = false; }
          go(payload.target); break;
        }
        case 'ENV': {
          if (payload.key === 'micLocked') { if (s.micLocked !== payload.value) dispatch('MUTE_TOGGLE'); }
          else if (Object.hasOwn(s, payload.key)) s[payload.key] = payload.value;
          if(payload.key==='quiet'){s.quietOverride={value:!!payload.value,until:s.clock+3600};}
          if(['socialAllowed','relationValid'].includes(payload.key)&&!payload.value){
            for(const r of Object.values(s.requests))if(['waiting','generating'].includes(r.status)){r.status='cancelled';r.revision++;notify('request',r.id);}
            s.avatarPending=s.partnerPending=s.friendPending=false;if(canPresent()&&['89','91','142','143','176'].includes(from))go(payload.key==='socialAllowed'?'169':'140');
            if(['sending','pending'].includes(s.messageStatus)){s.messageStatus='cancelled';s.messageSerial++;if(greetingPages.has(from))go(payload.key==='socialAllowed'?'169':'140');}
          }
          if(s.peerImport?.status==='importing'&&from==='189'){
            const reason=peerImportError();if(reason)failPeerImport(reason);
          }
          if(s.foodInventory.status==='syncing'&&(!s.wifiEnabled||!s.networkConnected||!s.cloudAvailable))dispatch('FOOD_SYNC_FAILED',{requestId:s.foodInventory.requestId,error:!s.wifiEnabled||!s.networkConnected?'offline':'service'});
          if(['wifiEnabled','networkConnected','cloudAvailable'].includes(payload.key))for(const mutation of s.noteMutations){
            if(!s.wifiEnabled||!s.networkConnected||!s.cloudAvailable){mutation.status='pending';mutation.attemptId=null;mutation.deadline=null;}
            else sendNoteMutation(mutation);
          }
          if (!s.cloudAvailable && s.aiActive) { s.aiActive = false; go('78'); }
          if ((!s.wifiEnabled || !s.networkConnected) && s.aiActive) { s.aiActive = false; go('21'); }
          break;
        }
        case 'FOOD_SYNC_REQUEST': {
          if(!['93','94','157'].includes(from))break;
          const f=s.foodInventory;
          if(f.status==='syncing')break;
          f.requestId=null;f.deadline=null;
          if(!s.wifiEnabled||!s.networkConnected){f.status='error';f.error='offline';break;}
          if(!s.cloudAvailable){f.status='error';f.error='service';break;}
          f.status='syncing';f.error=null;f.requestId=nextId('food-sync');f.deadline=s.clock+15;
          s.statusMessage='正在从应用同步食物';
          break;
        }
        case 'FOOD_INVENTORY_SYNC': {
          const f=s.foodInventory;
          if(!f||payload.deviceId!==s.localDeviceId||!Number.isSafeInteger(payload.revision)||payload.revision<f.revision||!validInventoryTotal(payload.purchasedTotal)||payload.purchasedTotal<f.purchasedTotal||payload.purchasedTotal<f.consumedTotal)break;
          if(f.status==='syncing'?(payload.requestId!==f.requestId||s.clock>=f.deadline):payload.requestId!==undefined)break;
          // An unchanged balance may acknowledge this request, but cannot grant stock.
          if(payload.revision===f.revision&&(f.status!=='syncing'||payload.purchasedTotal!==f.purchasedTotal))break;
          f.revision=payload.revision;f.purchasedTotal=payload.purchasedTotal;f.status='synced';f.error=null;f.requestId=null;f.deadline=null;s.statusMessage='';
          if(from==='157'&&s.petUnavailableReason==='FOOD_EMPTY'&&canPresent()){
            if(petAvailable('feed')){s.petUnavailableReason='';ensurePetIntent('feed');go('94');}
            else petUnavailable('feed');
          }
          break;
        }
        case 'FOOD_SYNC_FAILED': {
          const f=s.foodInventory;
          if(!f||f.status!=='syncing'||!payload.requestId||payload.requestId!==f.requestId)break;
          f.status='error';f.error=['offline','permission','service','timeout'].includes(payload.error)?payload.error:'service';f.requestId=null;f.deadline=null;s.statusMessage='';
          break;
        }
        case 'AI_POLICY': {
          if(!Number.isInteger(payload.version)||payload.version<=s.aiPolicyVersion||!['allow','deny','unknown','revoked'].includes(payload.status))break;
          const expiry=payload.expiresAt??s.clock+3600;
          if(!Number.isFinite(expiry))break;
          const incoming=payload.status==='allow'&&expiry<=s.clock?'unknown':payload.status;
          // Unknown or an expired allow cannot erase an explicit service restriction.
          if(!(['deny','revoked'].includes(s.aiPolicy)&&incoming==='unknown')){s.aiPolicy=incoming;s.aiPolicyExpiresAt=expiry;}
          s.aiPolicyVersion=payload.version;
          if(s.aiActive&&['deny','revoked'].includes(s.aiPolicy)){stopCapture();s.aiSessionId=null;s.aiRequestId=null;go('170');}break;
        }
        case 'UPLOAD_PERMISSION':
          if(!Number.isInteger(payload.version)||payload.version<=s.uploadPermissionVersion||!['granted','denied','unknown','revoked'].includes(payload.status))break;
          s.uploadPermission=payload.status;s.uploadPermissionVersion=payload.version;
          for(const rec of s.records){if(rec.status==='synced')continue;if(s.uploadPermission==='granted')queueSync(rec);else {rec.status='local-only';rec.uploadId=null;}}
          break;
        case 'REC_DRAFT_OPEN': if(s.draft&&!s.recording)go('73');break;
        case 'NOTE_ACTIONS': if(s.noticeStatus==='due'&&!s.noteDeleted)go('68');break;
        case 'KEY': if (from === '110' && /^[\x20-\x7E]$/.test(payload.key)) {if (s.password.length < 63) s.password += payload.key; else s.statusMessage = '密码最多 63 个字符';} break;
        case 'KEY_DELETE': s.password = s.password.slice(0, -1); break;
        case 'KEY_MODE': s.keyboardMode = ['lower','upper','symbols'].includes(payload.mode) ? payload.mode : { lower: 'upper', upper: 'symbols', symbols: 'lower' }[s.keyboardMode]; s.keyboardPage = 0; break;
        case 'KEY_NEXT': s.keyboardPage += 1; break;
        case 'KEY_PREV': s.keyboardPage = Math.max(0, s.keyboardPage - 1); break;
        case 'PASSWORD_VISIBILITY': s.showPassword = !s.showPassword; break;
        case 'SETTING': if(['brightness','volume'].includes(payload.key)&&Number.isFinite(Number(payload.value)))s[payload.key] = Math.max(payload.key === 'brightness' ? 10 : 0, Math.min(100, Number(payload.value))); break;
        case 'LANGUAGE_OPEN': s.languageOrigin='settings';go('178');break;
        case 'LANGUAGE_SET': if(from==='178'&&(data.deviceLanguages||[]).some(item=>item.value===payload.value)){s.deviceLanguage=payload.value;if(['en','zh-CN'].includes(payload.value))s.language=payload.value;}break;
        case 'LANGUAGE_DONE': if(from==='178'){s.deviceLanguage=s.deviceLanguage||s.language;s.languageChosen=true;go(s.languageOrigin==='settings'?'180':'02');}break;
        case 'QR_OPEN': if(s.draft){go('125');break;}s.bindSessionId=null;s.bindDeadline=null;s.provisionOrigin=s.setupDone?'settings':'setup';go('02');break;
        case 'BIND_REQUEST': if(from==='02'){s.bindSessionId=nextId('bind');s.bindDeadline=s.clock+60;go('03');later('BIND_TIMEOUT',60,{bindSessionId:s.bindSessionId});}break;
        case 'BIND_CONFIRMED': case 'BIND_ACCEPT': if(from==='03'&&s.bindSessionId){if(s.clock>=s.bindDeadline){s.bindSessionId=null;go('37');break;}go('04');later('BIND_SUCCESS',1.5,{bindSessionId:s.bindSessionId});}break;
        case 'BIND_DECLINE': if(from==='03'){s.bindSessionId=null;s.bindDeadline=null;go('02');}break;
        case 'BIND_TIMEOUT': if(from==='03'&&s.bindSessionId&&payload.bindSessionId===s.bindSessionId){s.bindSessionId=null;go('37');}break;
        case 'BIND_FAILED': if(from==='04'&&s.bindSessionId&&payload.bindSessionId===s.bindSessionId)go('37');break;
        case 'BIND_RETRY': if(['37','38'].includes(from)){s.bindSessionId=nextId('bind');s.bindDeadline=s.clock+60;go('04');later('BIND_SUCCESS',1.5,{bindSessionId:s.bindSessionId});}break;
        case 'APP_CREDENTIALS': case 'WIFI_PROVISIONED': case 'PROVISION_TIMEOUT': s.statusMessage='请在小圆屏选择网络并输入密码';break;
        case 'PROVISION_CANCEL': if(['02','03','04','37','38'].includes(from)){s.bindSessionId=null;s.bindDeadline=null;go(s.provisionOrigin==='settings'?s.wifiOrigin:from==='02'?'178':'02');}break;
        case 'PROVISION_LATER': go(s.setupDone?s.wifiOrigin:'130');break;
        case 'CHARACTER_PICKER': s.pendingCompanion=s.characterId;s.companionOrigin=s.setupDone?'settings':'setup';go('186');break;
        case 'PET_SWITCH_OPEN': if(from==='93'){s.pendingCompanion=s.characterId;s.companionOrigin='pet';s.petIntent=null;go('186');}break;
        case 'PET_COMPANION_PREV': case 'PET_COMPANION_NEXT': {
          if(from!=='93'||!s.displayOn||!s.characterReady||!canPresent()||payload.avatarId!==undefined&&payload.avatarId!==s.characterId)break;
          const index=s.availableCompanions.findIndex(item=>item.id===s.characterId);
          if(index<0)break;
          const selected=s.availableCompanions[index+(event==='PET_COMPANION_NEXT'?1:-1)];
          if(!selected)break;
          s.characterId=selected.id;s.characterName=selected.name;s.pendingCompanion=selected.id;s.petIntent=null;syncPet();
          break;
        }
        case 'COMPANION_SELECT': if(from==='186'&&s.availableCompanions.some(item=>item.id===payload.value))s.pendingCompanion=payload.value;break;
        case 'COMPANION_CANCEL': if(from==='186'){s.pendingCompanion=s.characterId;go(s.companionOrigin==='pet'?'93':s.companionOrigin==='friends'?'56':s.companionOrigin==='settings'?'180':'112');}break;
        case 'COMPANION_COMMIT': {
          if(from!=='186')break;
          const selected=s.availableCompanions.find(item=>item.id===s.pendingCompanion);
          if(!selected)break;
          if(!s.setupDone&&(!s.bound||!(s.networkConfigured||s.networkSkipped))){dispatch('SETUP_RESUME');break;}
          s.characterId=selected.id;s.characterName=selected.name;s.characterReady=true;s.petIntent=null;syncPet();
          if(s.companionOrigin==='friends')s.petOrigin=s.friendsOrigin==='74'?'74':'10';
          if(s.companionOrigin==='pet'||s.companionOrigin==='friends')go('93');
          else if(s.companionOrigin==='settings')go('10');
          else{go('07');later('WELCOME_DONE',1.5);}
          break;
        }
        case 'PEER_DISCOVERY_OPEN':
          if(!canPresent())break;
          s.peerDiscoveryOrigin=from==='191'?'191':'185';
          if(!s.socialAllowed){go('169');break;}
          s.peerEncounter=null;s.friendDetailOrigin=s.peerDiscoveryOrigin;go('54');break;
        case 'PEER_TAP': {
          if(!['10','24','26','74','54'].includes(from)||!canPresent()||s.careActive||!s.displayOn)break;
          if(!s.socialAllowed){go('169');break;}
          if(!validPeerId(payload.peerId)||payload.peerId===s.localDeviceId||typeof payload.peerName!=='string'||!payload.peerName.trim()||payload.peerName.length>40||!validPeerPet(payload.pet)){
            s.statusMessage='暂时无法识别这台设备，请再碰一次';break;
          }
          s.peerEncounter={encounterId:nextId('encounter'),...peerSnapshot(payload),discoveredAt:s.clock};
          if(from!=='54')s.peerDiscoveryOrigin='185';
          s.friendDetailOrigin=s.peerDiscoveryOrigin;s.friendsOrigin=homePages.has(from)?from:from==='74'?'74':s.friendsOrigin;
          if(s.friends[payload.peerId]?.established&&s.friends[payload.peerId].source!=='sample'){s.selectedFriendId=payload.peerId;go('56');}
          else go('55');
          break;
        }
        case 'PEER_DISCOVERY_CANCEL': if(['54','55'].includes(from)){s.peerEncounter=null;returnTo(s.peerDiscoveryOrigin,friendChildren);}break;
        case 'FRIEND_OPEN': {
          const id=payload.peerId||payload.value||s.selectedFriendId,friend=s.friends[id];
          s.friendDetailOrigin=from==='165'?'165':from==='191'?'191':'185';
          if(!s.socialAllowed){go('169');break;}
          if(!s.relationValid||!friend?.established){go('140');break;}
          s.selectedFriendId=id;go('56');break;
        }
        case 'PEER_IMPORT_OPEN': {
          if(from!=='56'||!canPresent())break;
          const friend=selectedFriend();
          if(!s.socialAllowed){go('169');break;}
          if(!s.relationValid||!friend?.established||!validPeerPet(friend.pet)){go('140');break;}
          const companionId=peerCompanionId(friend.peerId,friend.pet.id);
          if(s.availableCompanions.some(item=>item.id===companionId)){s.statusMessage='这个伙伴已经在设备里啦';break;}
          s.peerImport={attemptId:null,peerId:friend.peerId,pet:{...friend.pet},companionId,status:'awaiting',error:null,confirmed:false};
          go('188');break;
        }
        case 'PEER_IMPORT_CONFIRM': if(from==='188'&&s.peerImport?.status==='awaiting'){s.peerImport.confirmed=true;startPeerImport();}break;
        case 'PEER_IMPORT_RETRY': if(from==='190'&&s.peerImport?.status==='failed'){s.peerImport.confirmed=true;startPeerImport();}break;
        case 'PEER_IMPORT_SUCCESS': {
          const job=s.peerImport;
          if(from!=='189'||!job||job.status!=='importing'||!job.confirmed||payload.attemptId!==job.attemptId||s.task?.kind!=='peerImport'||s.task.id!==job.attemptId)break;
          const reason=peerImportError();if(reason){failPeerImport(reason);break;}
          if(!s.availableCompanions.some(item=>item.id===job.companionId))s.availableCompanions.push({id:job.companionId,name:job.pet.name,appearance:job.pet.appearance,sourcePeerId:job.peerId});
          finishTask('peerImport');job.status='completed';job.error=null;returnTo('56',new Set(['188','189','190']));s.statusMessage='伙伴已添加，去看看吧';break;
        }
        case 'PEER_IMPORT_FAILED': if(from==='189'&&s.peerImport?.status==='importing'&&payload.attemptId===s.peerImport.attemptId&&s.task?.id===s.peerImport.attemptId)failPeerImport(['offline','storage','permission','friend-unavailable'].includes(payload.reason)?payload.reason:'transfer');break;
        case 'PEER_IMPORT_CANCEL':
          if(!['188','189','190'].includes(from)||!s.peerImport)break;
          finishTask('peerImport');s.peerImport.status='cancelled';s.peerImport.attemptId=null;returnTo('56',new Set(['188','189','190']));break;
        case 'PEER_COMPANIONS_OPEN': {
          if(from!=='56'||!canPresent())break;
          const friend=selectedFriend();
          if(!s.socialAllowed){go('169');break;}
          if(!s.relationValid||!friend?.established||!validPeerId(friend.peerId)||!validPeerPet(friend.pet)){go('140');break;}
          const companionId=peerCompanionId(friend.peerId,friend.pet.id);
          if(!s.availableCompanions.some(item=>item.id===companionId&&item.sourcePeerId===friend.peerId)){s.statusMessage='还没有添加这个伙伴';break;}
          s.companionOrigin='friends';s.pendingCompanion=companionId;go('186');break;
        }
        case 'REC_PAUSE': if(s.recording){s.recording=false;s.currentRecording.status='paused';go('184');}break;
        case 'REC_RESUME': if(from==='184'&&s.draft){if(s.micLocked)go('125');else{s.recording=true;s.currentRecording.status='capturing';go('71');}}break;
        case 'REC_SAVE_PAUSED': if(from==='184')saveRecording();break;
        case 'RECORD_OPEN': if(s.records.some(r=>r.id===payload.recordId)){s.selectedRecordId=payload.recordId;s.playbackSeconds=0;go('182');}break;
        case 'RECORD_PLAY': {const r=s.records.find(r=>r.id===s.selectedRecordId);if(from==='182'&&r){if(s.playbackSeconds>=r.seconds)s.playbackSeconds=0;s.playbackOn=!s.playbackOn;}break;}
        case 'RECORD_SEEK': {const r=s.records.find(r=>r.id===s.selectedRecordId);if(from==='182'&&r&&Number.isFinite(Number(payload.value)))s.playbackSeconds=Math.max(0,Math.min(r.seconds,Number(payload.value)));break;}
        case 'RECORD_DELETE_OPEN': if(from==='182'&&s.records.some(r=>r.id===s.selectedRecordId)){s.deletingRecordId=s.selectedRecordId;go('183');}break;
        case 'RECORD_KEEP': s.deletingRecordId=null;go('182');break;
        case 'RECORD_DELETE': if(from==='183'&&s.deletingRecordId&&s.deletingRecordId===s.selectedRecordId){s.records=s.records.filter(r=>r.id!==s.deletingRecordId);s.deletingRecordId=null;s.selectedRecordId=null;go('124');}break;
        case 'RECORD_LIST': returnTo('124',recordingPages);break;
        case 'RECORD_LIST_BACK': returnTo('70',recordingPages);break;
        case 'REC_NEW': if(['124','168'].includes(from)){s.recOrigin=s.recordingMenuOrigin;returnTo('70',recordingPages);}break;
        case 'AI_INTERRUPT': if(from==='16'&&s.aiActive){s.aiRequestId=null;go('14');}break;
        case 'AI_START':
          if(s.aiActive&&['14','15','16'].includes(from))break;
          if(s.micLocked){s.statusMessage='硬件麦克风已静音';break;}
          if(['10','23','24','26','74'].includes(from))s.aiOrigin=from;
          else if(!['41','43','44','76','170'].includes(from))s.aiOrigin='10';
          s.origin=s.aiOrigin;go('161');break;
        case 'AI_READY': gateAI(); break;
        case 'AI_MIC_BLOCKED': if(s.micLocked)gateAI();break;
        case 'AI_CONSENT': gateAI();break;
        case 'AI_DENY': s.aiActive = false; go(s.aiOrigin); break;
        case 'AI_CONTINUE': gateAI(); break;
        case 'AI_INPUT_END': case 'AI_INPUT_DONE': case 'AI_THINK': if (s.aiActive && !s.micLocked&&from==='14') {s.aiRequestId=nextId('turn');go('15');later('AI_RESPONSE',1.2,{sessionId:s.aiSessionId,requestId:s.aiRequestId});}break;
        case 'AI_RESPONSE': if (s.aiActive&&!s.micLocked&&from==='15'&&payload.sessionId===s.aiSessionId&&payload.requestId===s.aiRequestId) {go('16');later('AI_SPEECH_END',2.5,{sessionId:s.aiSessionId,requestId:s.aiRequestId});}break;
        case 'AI_SPEECH_END': if(s.aiActive&&!s.micLocked&&from==='16'&&payload.sessionId===s.aiSessionId&&payload.requestId===s.aiRequestId)go('14');break;
        case 'AI_NO_SPEECH': case 'AI_SILENCE_TIMEOUT':
          if(!s.aiActive||from!=='14'||payload.sessionId!==s.aiSessionId)break;
          if(event==='AI_SILENCE_TIMEOUT')dispatch('AI_END');else go('41');break;
        case 'AI_TIMEOUT': case 'AI_SAFE_RESPONSE':
          if(!s.aiActive||from!=='15'||payload.sessionId!==s.aiSessionId||payload.requestId!==s.aiRequestId)break;
          go(event==='AI_TIMEOUT'?'43':'44');break;
        case 'AI_END':
          if(!['14','15','16','41','43','44'].includes(from))break;
          s.aiActive=false;s.aiSessionId=null;s.aiRequestId=null;go('76');s.aiReturnId=nextId('ai-end');later('AI_RETURN',1,{returnId:s.aiReturnId});break;
        case 'AI_RETURN': if(from==='76'&&(!payload.returnId||payload.returnId===s.aiReturnId))go(s.aiOrigin);break;
        case 'SINGLE_PLAY': if(s.noteDeleted&&['67','68','69','133','134'].includes(from)){go('159');break;}stopCapture(true);s.playOrigin=from;s.playNoteId=s.noteId;s.playVersion=s.noticeVersion;go('162');later('SINGLE_END',2);break;
        case 'SINGLE_END': stopCapture(true);go(['67','68','69','133','134'].includes(s.playOrigin)&&(s.noteDeleted||s.playVersion!==s.noticeVersion)?'159':s.playOrigin||'10');break;
        case 'REC_START': {
          if (s.draft && !s.recording) { s.statusMessage='请先保存或丢弃当前录音';go('125');break; }
          if (s.micLocked) { s.statusMessage='硬件麦克风已静音';break; }
          if (!s.storageAvailable) { s.origin = from; go('158'); break; }
          if (['35', '50', '122', '147', '148', '155', '151', '153'].includes(from)) { s.statusMessage = '当前写入完成后可录音'; break; }
          if (s.recording) return dispatch('REC_STOP');
          stopCapture(true);s.recOrigin=recordingPages.has(from)?s.recordingMenuOrigin:from==='74'?'74':'10';
          s.recordingMenuOrigin=s.recOrigin;
          s.recording = true; s.draft = true; s.seconds = 0;s.shutdownAfterSave=false;s.draftExpiresAt=null;s.currentRecording={id:nextId('rec'),status:'capturing',seconds:0,expiresAt:null,shutdown:false};go('71'); break;
        }
        case 'REC_STOP': case 'REC_LIMIT': if (s.recording) saveRecording(); break;
        case 'REC_BLOCKED': if(s.micLocked)s.statusMessage='硬件麦克风已静音';break;
        case 'REC_BACK': if (s.recording || s.draft) {s.recording=false;s.draft=true;if(s.currentRecording)s.currentRecording.status='draft';go('125');}break;
        case 'REC_CONTINUE': if (s.recording) go('71'); break;
        case 'REC_SAVE': case 'REC_RETRY': if (s.draft || ['125', '73'].includes(from)) saveRecording(); break;
        case 'REC_DISCARD_REQUEST': if(from==='125'&&s.draft&&s.currentRecording&&!s.recording&&['draft','failed'].includes(s.currentRecording.status)){s.discardConfirmationId=s.currentRecording.id;go('177');}break;
        case 'REC_DISCARD_CANCEL': if(from==='177'){s.discardConfirmationId=null;go(s.draft?'125':'70');}break;
        case 'REC_DISCARD':
          if(from!=='177'||!s.draft||!s.currentRecording||s.discardConfirmationId!==s.currentRecording.id||!['draft','failed'].includes(s.currentRecording.status))break;
          s.recording=false;s.draft=false;s.seconds=0;s.shutdownAfterSave=false;s.draftExpiresAt=null;s.currentRecording=null;s.discardConfirmationId=null;s.lastRecordingOutcome='deleted';go('42');later('REC_RESULT_DONE',1);break;
        case 'REC_SAVE_FAILED':
          if(!recordingMatch(payload))break;
          finishTask('save');s.recording=false;s.draft=true;s.currentRecording.status='failed';s.currentRecording.expiresAt??=s.clock+86400;s.draftExpiresAt=s.currentRecording.expiresAt;
          s.currentRecording.shutdown=false;s.shutdownAfterSave=false;go('73');break;
        case 'REC_SAVED': {
          if(!recordingMatch(payload))break;
          const rec=s.currentRecording,shutdown=rec.shutdown;finishTask('save');s.recording=false;s.draft=false;s.draftExpiresAt=null;s.shutdownAfterSave=false;
          rec.status='saved';rec.expiresAt=null;const saved={id:rec.id,seconds:rec.seconds,status:'local'};
          s.records.push(saved);s.currentRecording=null;s.lastRecordingOutcome='saved';
          if(shutdown){saved.status=s.uploadPermission==='granted'?'pending':'local-only';go('119');}
          else {go('123');queueSync(saved);if(saved.status==='local-only')later('REC_LOCAL_ONLY',1.2);}
          break;
        }
        case 'REC_SYNCED': case 'REC_SYNC_FAIL': {
          const rec=s.records.find(r=>r.id===payload.recordId);
          if(!rec||rec.status!=='uploading'||rec.uploadId!==payload.uploadId||payload.permissionVersion!==s.uploadPermissionVersion||s.uploadPermission!=='granted')break;
          rec.status=event==='REC_SYNCED'&&s.networkConnected&&s.cloudAvailable&&s.wifiEnabled?'synced':'pending';notify('record',rec.id);
          if(canPresent()&&from==='123'){go(rec.status==='synced'?'72':'124');if(s.page==='72')later('REC_RESULT_DONE',1);}break;
        }
        case 'REC_SYNC_RETRY': if(s.uploadPermission!=='granted')go('171');else {for(const rec of s.records)queueSync(rec);s.statusMessage='同步任务已检查';}break;
        case 'REC_LOCAL_ONLY': if(from==='123'){go('171');later('REC_RESULT_DONE',2);}break;
        case 'REC_RESULT_DONE': showPostSave();break;
        case 'MUTE_TOGGLE': {
          s.micLocked = !s.micLocked;
          if(s.micLocked){
            stopCapture();s.aiSessionId=null;
            if(s.recording)saveRecording();
            else if(s.draft&&!s.task)go('125');
            else if(['58','82',...careFeedbackPages].includes(from))go('82');
            else if(['14','15','16','41','43','44','161','76'].includes(from))go(s.aiOrigin);
            s.statusMessage=s.task?'硬件麦克风已静音，当前写入继续':'硬件麦克风已静音';
          }else s.statusMessage='麦克风限制已解除，任务不会自动恢复';
          break;
        }
        case 'OPEN_MIC': go('75',{push:true});break;
        case 'OPEN_ADJUST': case 'OPEN_VOLUME': case 'OPEN_BRIGHTNESS':
          if (s.recording || ['35','50','122','148','151','155','153'].includes(from)) {s.statusMessage='请先完成当前任务';break;}
          s.origin=from;go(event==='OPEN_VOLUME'?'31':event==='OPEN_BRIGHTNESS'?'32':'75',{push:true});break;
        case 'OPEN_QUIET': s.origin = from; go('30', {push:true}); break;
        case 'QUIET_TOGGLE': {const hour=(s.localHour+s.clock/3600)%24;s.quiet=!s.quiet;s.quietOverride={value:s.quiet,until:s.clock+((hour>=22?31:hour<7?7:22)-hour)*3600};go('30');break;}
        case 'DISPLAY_MODE': s.displayMode=payload.value==='aod'?'aod':'black';go('172');break;
        case 'SHOW_AOD': if(homePages.has(from)&&s.displayMode==='aod')go('79');break;
        case 'SSID_DETAIL': s.ssidReturn=from;s.showPassword=false;go('174');break;
        case 'SSID_BACK': go(s.ssidReturn||'110');break;
        case 'NOOP': break;
        case 'CARE_START':
          if(!['82','58'].includes(from)||s.careEnabled)break;
          if (s.micLocked) { s.statusMessage='硬件麦克风已静音';break; }
          if(s.recording||s.draft||s.aiActive){s.statusMessage='请先完成当前声音任务';break;}
          s.careEnabled=true;s.careLastSound=-Infinity;go('58');break;
        case 'CARE_END': stopCare();if(['82','58',...careFeedbackPages].includes(from))go('82');break;
        case 'CARE_BLOCKED': if(s.micLocked)s.statusMessage='硬件麦克风已静音';break;
        case 'CARE_EXPIRE': break;
        case 'CARE_RETURN': case 'CARE_REOPEN': go(s.careEnabled?'58':'82');break;
        case 'CARE_SOUND': if(careSignalValid(payload)&&s.clock-s.careLastSound>=30)careFeedback('59');break;
        case 'CARE_ACCEPT': if(from==='59'&&s.careEnabled&&!s.micLocked)careFeedback('60');break;
        case 'CARE_QUIET': if(from==='59')finishCareFeedback();break;
        case 'CARE_HIGH_VOLUME': if(from==='59'&&s.careEnabled)careFeedback('61');break;
        case 'CARE_EXPLICIT_ANGER': case 'CARE_EXPLICIT_DISAPPOINTMENT': case 'CARE_EXPLICIT_REJECTION': case 'CARE_EXPLICIT_CONFLICT': case 'CARE_EXPLICIT_BEDTIME':
          if(s.careEnabled&&(from==='59'&&payload.feedbackId===s.careFeedbackId||careSignalValid(payload)&&s.clock-s.careLastSound>=30))careFeedback({CARE_EXPLICIT_ANGER:'62',CARE_EXPLICIT_DISAPPOINTMENT:'63',CARE_EXPLICIT_REJECTION:'63',CARE_EXPLICIT_CONFLICT:'64',CARE_EXPLICIT_BEDTIME:'65'}[event]);break;
        case 'CARE_NEED_HELP': if(s.careEnabled&&careFeedbackPages.has(from))careFeedback('66');break;
        case 'CARE_FEEDBACK_DONE': if(payload.feedbackId===s.careFeedbackId&&s.careFeedbackId)finishCareFeedback();break;
        case 'CARE_CONTINUE': if(s.careEnabled)finishCareFeedback();break;
        case 'CARE_SLEEP_COMPLETE': if(from==='65'){s.quiet=true;s.quietOverride={value:true,until:s.clock+3600};finishCareFeedback();}break;
        case 'NOTE_DUE': case 'NOTE_SNOOZE_DUE': {
          storeNote();const note=s.notes[payload.noteId||s.noteId];if(!note||note.noteDeleted||note.noticeStatus==='completed')break;
          note.noticeStatus='due';note.snoozeAt=null;if(note.noteId===s.noteId)Object.assign(s,note);
          syncNoteQueue();notify('note',note.noteId);
          if(s.recording){if(s.page!=='121'){go('81');later('REC_NOTICE_DISMISS',2);}}
          else if(!['123','124','168','67','68','69','133','134','162'].includes(from)){s.deferredReminder=true;presentReminder();}
          break;
        }
        case 'REC_NOTICE_DISMISS': if (s.recording) go('71'); break;
        case 'NOTE_OPEN': loadNote(payload);if(!['67','68','69','133','134'].includes(from))s.noteReturn=['77','167'].includes(from)?from:'10';openNote();break;
        case 'NOTE_MISSED': s.noticeStatus='due';storeNote();go('167');break;
        case 'NOTE_DONE':
          if(s.noteDeleted||(payload.version??s.noteViewVersion??s.noticeVersion)!==s.noticeVersion){go('159');break;}
          if(s.noticeStatus==='completed')break;
          mutateNote('done');
          s.noticeStatus='completed';s.snoozeAt=null;storeNote();syncNoteQueue();go('69');later('NOTE_DISMISS',1);break;
        case 'NOTE_LATER':
          if(s.noteDeleted||s.noticeStatus!=='due'||(payload.version??s.noteViewVersion??s.noticeVersion)!==s.noticeVersion){go('159');break;}
          mutateNote('later');
          s.noticeStatus='snoozed';s.snoozeAt=s.clock+600;storeNote();syncNoteQueue();go('133');later('NOTE_DISMISS',1.2);break;
        case 'NOTE_DISMISS': go(s.noteReturn || '10'); break;
        case 'NOTE_REMOTE_CREATE': case 'NOTE_REMOTE_UPDATE': case 'NOTE_REMOTE_DELETE': {
          storeNote();const id=payload.noteId,revision=payload.revision,previous=s.notes[id];
          if(!validPeerId(id)||!Number.isSafeInteger(revision)||revision<1||revision<=(previous?.noticeVersion||0))break;
          const deleted=event==='NOTE_REMOTE_DELETE',incoming=payload.note||{};
          const note={...previous,noteId:id,noticeVersion:revision,noteDeleted:deleted,snoozeAt:null};
          if(!deleted){
            note.noteTitle=incoming.noteTitle??previous?.noteTitle;note.noteDueAt=incoming.noteDueAt??previous?.noteDueAt;
            note.noticeStatus=incoming.noticeStatus??'scheduled';note.snoozeAt=incoming.snoozeAt??null;
            if(typeof note.noteTitle!=='string'||!note.noteTitle.trim()||note.noteTitle.length>200||!Number.isFinite(note.noteDueAt)||note.noteDueAt<0||!['scheduled','due','snoozed','completed'].includes(note.noticeStatus)||note.noticeStatus==='snoozed'&&!Number.isFinite(note.snoozeAt))break;
          }
          s.notes[id]=note;
          s.noteMutations=s.noteMutations.filter(m=>m.noteId!==id);s.noteQueue=s.noteQueue.filter(n=>n!==id);
          if(id===s.noteId){Object.assign(s,note);if(['67','68','69','133','134','162'].includes(from)){s.auto=null;go('159');}}
          syncNoteQueue();
          if(!deleted&&(note.noticeStatus==='due'||note.noticeStatus==='scheduled'&&note.noteDueAt<=s.clock))dispatch('NOTE_DUE',{noteId:id});
          break;
        }
        case 'NOTE_SYNC_RETRY': for(const mutation of s.noteMutations)sendNoteMutation(mutation);break;
        case 'NOTE_SYNC_RESULT': {
          const mutation=s.noteMutations.find(m=>m.operationId===payload.operationId);
          if(!mutation||mutation.status!=='sending'||payload.attemptId!==mutation.attemptId||s.clock>=mutation.deadline)break;
          const validRevision=Number.isSafeInteger(payload.revision)&&payload.revision>mutation.baseRevision;
          if(payload.conflict&&validRevision){
            dispatch(payload.deleted?'NOTE_REMOTE_DELETE':'NOTE_REMOTE_UPDATE',{noteId:mutation.noteId,revision:payload.revision,note:payload.note});
            if(!s.noteMutations.includes(mutation))break;
          }else if(payload.success===true&&validRevision){
            storeNote();const note=s.notes[mutation.noteId];note.noticeVersion=payload.revision;
            if(note.noteId===s.noteId){s.noticeVersion=payload.revision;s.noteViewVersion=payload.revision;}
            s.noteMutations=s.noteMutations.filter(m=>m!==mutation);
            for(const next of s.noteMutations)if(next.noteId===mutation.noteId){next.baseRevision=payload.revision;sendNoteMutation(next);}
            break;
          }
          mutation.status='failed';mutation.attemptId=null;mutation.deadline=null;break;
        }
        case 'NOTE_STALE': s.noticeVersion++;s.snoozeAt=null;s.pendingReminder=false;go('159');break;
        case 'OPEN_WIFI':
          s.wifiOrigin=['180','75'].includes(from)?from:'180';
          if(!s.bound){dispatch('QR_OPEN');break;}
          if(!s.wifiEnabled){go('115');break;}
          dispatch('WIFI_SCAN');break;
        case 'WIFI_SCAN': if(!s.bound){dispatch('QR_OPEN');break;}beginWifiFlow();clearWifiAttempt();s.wifiScanId=nextId('scan');s.wifiScanDeadline=s.clock+15;go('126');later('WIFI_SCAN_RESULT',1,{scanId:s.wifiScanId});break;
        case 'WIFI_SCAN_FOUND': case 'WIFI_SCAN_RESULT': case 'WIFI_SCAN_EMPTY': if(scanReplyMatches(payload)){s.wifiScanId=null;s.wifiScanDeadline=null;go(payload.empty||event==='WIFI_SCAN_EMPTY'?'127':s.wifiListPage);}break;
        case 'WIFI_SELECT': if(!['05','109'].includes(from))break;beginWifiFlow();clearWifiAttempt();s.wifiOpen=false;s.ssid=payload.value||payload.ssid||payload.label||'Home';s.keyboardPage=0;go('110');break;
        case 'WIFI_JOIN': if(from!=='110')break;if(!/^[\x20-\x7E]{8,63}$/.test(s.password)){s.statusMessage='请输入 8–63 位网络密码';break;}s.wifiOpen=false;joinWifi();break;
        case 'WIFI_OPEN_JOIN': case 'WIFI_SELECT_OPEN': if(!['05','109'].includes(from))break;beginWifiFlow();clearWifiAttempt();s.ssid=payload.value||payload.ssid||payload.label||'Guest';s.wifiOpen=true;joinWifi();break;
        case 'WIFI_CONNECTED': if(!wifiReplyMatches(payload))break;s.networkConnected=true;s.networkConfigured=true;s.networkSkipped=false;clearWifiAttempt();s.wifiPrevious=null;go(s.cloudAvailable?'112':'78');if(!s.setupDone&&s.cloudAvailable&&s.wifiListPage==='05')later('WIFI_CONTINUE',1.2);break;
        case 'WIFI_SUCCESS_DONE': case 'WIFI_CONTINUE': case 'WIFI_SETTINGS_DONE': if(from!=='112'||!s.networkConfigured)break;if(!s.setupDone)dispatch('CHARACTER_PICKER');else go('109');break;
        case 'WIFI_EDIT': if(from==='128'){s.password='';s.showPassword=false;go('110');}break;
        case 'WIFI_RETRY': if(from!=='113')break;if(s.wifiOpen||/^[\x20-\x7E]{8,63}$/.test(s.password))joinWifi();else {s.statusMessage='请重新输入网络密码';go('110');}break;
        case 'WIFI_BACK': clearWifiAttempt(true);go(s.wifiListPage);break;
        case 'WIFI_CANCEL': clearWifiAttempt(true);s.wifiPrevious=null;go(s.setupDone?s.wifiOrigin:'05');break;
        case 'WIFI_AUTH_ERROR': if(!wifiReplyMatches(payload))break;s.networkConnected=false;clearWifiAttempt();go('128');break;
        case 'WIFI_TIMEOUT': if(!wifiReplyMatches(payload))break;s.networkConnected=false;clearWifiAttempt();s.wifiError='Connection timed out. Choose a network.';go(s.wifiListPage);break;
        case 'WIFI_CLOUD_FAIL': if(!wifiReplyMatches(payload))break;s.networkConnected=true;s.cloudAvailable=false;s.networkConfigured=true;s.networkSkipped=false;clearWifiAttempt();s.wifiPrevious=null;go('78');break;
        case 'WIFI_LOST': if(from==='111'?!wifiReplyMatches(payload):!['05','109','110'].includes(from))break;if(payload.ssid&&payload.ssid!==s.ssid)break;clearWifiAttempt();go('129');break;
        case 'WIFI_SKIP': if(!s.setupDone&&s.bound)dispatch('SETUP_DEFAULT');break;
        case 'NETWORK_RETRY': go('22'); later('NETWORK_RESULT',1.2); break;
        case 'NETWORK_RESULT': if(!s.wifiEnabled||!s.networkConnected)go('21');else if(!s.cloudAvailable)go('78');else if(!s.setupDone)dispatch('SETUP_RESUME');else go('10');break;
        case 'CLOUD_USE_LOCAL': break;
        case 'WIFI_OFF_CONFIRM': if(s.wifiEnabled)go('114');break;
        case 'WIFI_OFF': clearWifiAttempt();s.wifiPrevious=null;s.wifiEnabled = false; s.networkConnected = false; s.aiActive = false; go('115'); break;
        case 'WIFI_ON': s.wifiEnabled=true;dispatch('WIFI_SCAN');break;
        case 'SETUP_RESUME': if(!s.bound)dispatch('QR_OPEN');else if(!s.networkConfigured&&!s.networkSkipped)dispatch('WIFI_SCAN');else if(!s.characterReady)dispatch('CHARACTER_PICKER');else completeSetup(!s.setupDone);break;
        case 'SETUP_DEFAULT': if(!s.bound){dispatch('QR_OPEN');break;}clearWifiAttempt();s.wifiPrevious=null;s.networkSkipped=!s.networkConfigured;s.characterReady=true;s.characterName='Lumi';s.characterId='lumi';go('07');later('WELCOME_DONE',1.5);break;
        // Character resource download/validation is deferred in this revision.
        // Keep legacy callbacks harmless and send selection back to the local
        // preset picker rather than entering a removed resource screen.
        case 'CHARACTER_SELECTED':
          s.characterReady=false;
          s.pendingCompanion=s.characterId||'lumi';
          s.companionOrigin=s.setupDone?'settings':'setup';
          go('186');
          break;
        case 'CHARACTER_READY':
          // A late callback from a previous build must not mark unavailable
          // resources as ready. The current picker commits local presets.
          break;
        case 'CHARACTER_FAILED':
          if(['131','132','186'].includes(from))go('186');
          break;
        case 'WELCOME_DONE': if(from==='07')completeSetup(!s.setupDone);break;
        case 'GREETING_DONE': if(from==='09')completeSetup(false);break;
        case 'BIND_SUCCESS': if(from==='04'&&s.bindSessionId&&payload.bindSessionId===s.bindSessionId){s.bound=true;s.bindSessionId=null;s.bindDeadline=null;if(s.provisionOrigin!=='settings')s.setupDone=false;beginWifiFlow();go(s.wifiListPage);}break;
        case 'SETUP_COMPLETE': if(['07','09'].includes(from))completeSetup(false);break;
        case 'POWER_ON': s.powerOn = true; go('01'); later('BOOT', 1); break;
        case 'BOOT': finishTask('reboot');boot();for(const rec of s.records)queueSync(rec);break;
        case 'POWER_CONFIRM':
          if (from === '118') { dispatch('POWER_OFF'); break; }
          if (['35', '50', '122', '151', '148', '155', '153'].includes(from)) { s.statusMessage = '正在写入，请稍候'; break; }
          s.origin = from; if(s.recording){s.recording=false;s.draft=true;} go('118'); break;
        case 'POWER_OFF':
          pauseDockSync();
          endSoul('cancelled');s.soulAuthorized=false;
          stopCapture(); s.password = ''; s.showPassword = false;
          if (['34','48'].includes(from)) {s.task=null;s.recording=false;if(s.currentRecording){s.currentRecording.status='interrupted';s.draft=true;}go('119');}
          else if (s.recording || s.draft) { s.shutdownAfterSave = true; saveRecording(); } else go('119'); break;
        case 'SCREEN_OFF':
          s.password='';s.showPassword=false;
          if (['35', '50', '122', '151', '148', '155', '153'].includes(from)) { s.statusMessage = '写入期间保持显示'; break; }
          if (s.recording) { go('121'); }
          else {stopCapture(true);s.origin=from;go(s.displayMode==='aod'?'79':'120');}
          break;
        case 'WAKE': if (s.powerOn) { if (s.recording) go('71'); else if (s.recoveryMode) go('101'); else if (s.setupDone) go('10'); else resumeSetup(); } break;
        case 'REBOOT':
          pauseDockSync();
          endSoul('cancelled');s.soulAuthorized=false;
          interruptPeerImport();
          if(['ota','rollback','recovery'].includes(s.task?.kind))s.recoveryMode=true;
          s.task=null;if(s.currentRecording){s.currentRecording.status='interrupted';s.currentRecording.shutdown=false;s.draft=true;}s.recording=false;s.shutdownAfterSave=false;
          stopCapture();s.aiSessionId=null;s.password='';s.showPassword=false;s.powerOn=true;go('153');later('BOOT',1.5);break;
        case 'EMERGENCY_RESERVED': s.statusMessage = 'Emergency 预留事件 · 未启用警报'; break;
        case 'BATTERY_CRITICAL': case 'THERMAL_LIMIT':
          pauseDockSync();if(event==='THERMAL_LIMIT'&&s.dock.connected)s.dock.status='paused';
          endSoul('paused');s.soulAuthorized=false;
          interruptPeerImport();
          if(['ota','rollback','recovery'].includes(s.task?.kind))s.recoveryMode=true;
          s.task=null;stopCapture();s.aiSessionId=null;s.recording=false;s.shutdownAfterSave=false;
          s.safety=event==='THERMAL_LIMIT'?'thermal':'battery';
          if(s.currentRecording){s.currentRecording.status='interrupted';s.currentRecording.shutdown=false;s.draft=true;}
          for(const rec of s.records)if(rec.status==='uploading'){rec.status='pending';rec.uploadId=null;}
          go(event==='THERMAL_LIMIT'?'48':'34');break;
        case 'THERMAL_CLEAR': case 'TEMPERATURE_NORMAL': case 'SAFETY_CLEAR': if(s.safety){s.safety=null;if(s.recoveryMode)go('101');else if(s.draft)go('73');else if(s.powerOn)go('10');}break;
        case 'BATTERY_LOW': if(Number.isFinite(payload.battery))s.battery=Math.max(0,Math.min(100,payload.battery));if(canPresent())go('33');else notify('system','battery-low');break;
        case 'OTA_SUCCESS': if(s.task?.kind==='ota'){finishTask('ota');go('49');}break;
        case 'OTA_FAIL': if(s.task?.kind==='ota'){finishTask('ota');go('50');}break;
        case 'ROLLBACK_SUCCESS': if(s.task?.kind==='rollback'){finishTask('rollback');go('100');}break;
        case 'ROLLBACK_FAILED': if(s.task?.kind==='rollback'){finishTask('rollback');s.recoveryMode=true;go('101');}break;
        case 'OTA_LATER': go('10'); break;
        case 'RECOVERY_GUIDE': case 'RECOVERY_HELP': case 'RECOVERY_RETRY': s.recoveryMode = true; go('150'); break;
        case 'RECOVERY_BACK': s.recoveryMode = true; go('101'); break;
        case 'RECOVERY_START': s.recoveryMode = true; go('151'); break;
        case 'RECOVERY_SUCCESS': if(s.task?.kind==='recovery'){finishTask('recovery');s.recoveryMode=false;go('01');later('BOOT',1);}break;
        case 'RECOVERY_FAIL': if(s.task?.kind==='recovery'){finishTask('recovery');s.recoveryMode=true;go('152');}break;
        case 'RELATION_INVALID': case 'SOCIAL_BLOCKED':
          dispatch('ENV',{key:event==='RELATION_INVALID'?'relationValid':'socialAllowed',value:false});
          if(from===s.page)go(event==='RELATION_INVALID'?'140':'169');break;
        case 'SOCIAL_COMPOSE': case 'GREETING_OPEN': if (!s.socialAllowed) go('169'); else if (!s.relationValid||!selectedFriend()?.established) go('140'); else go('136'); break;
        case 'SOCIAL_SEND':
          if(!['136','139'].includes(from))break;
          if (!s.socialAllowed) { go('169'); break; } if (!s.relationValid||!selectedFriend()?.established) { go('140'); break; }
          s.messageStatus = 'sending';s.messageSerial++;s.messagePeerId=s.selectedFriendId;go('137');background(s.cloudAvailable&&s.networkConnected&&s.wifiEnabled?'SOCIAL_SENT':'SOCIAL_QUEUED',1,{serial:s.messageSerial,peerId:s.messagePeerId});break;
        case 'SOCIAL_SENT': case 'SOCIAL_QUEUED':
          if(s.messageStatus!=='sending'||payload.serial!==s.messageSerial||(payload.peerId!==undefined&&payload.peerId!==s.messagePeerId)||!s.friends[s.messagePeerId]?.established||!s.relationValid||!s.socialAllowed)break;
          s.messageStatus=event==='SOCIAL_SENT'&&s.networkConnected&&s.cloudAvailable&&s.wifiEnabled?'sent':'pending';if(from==='137'&&s.selectedFriendId===s.messagePeerId)go(s.messageStatus==='sent'?'138':'139');break;
        case 'REVIVE_REQUESTED': {
          if(payload.deviceId!==s.localDeviceId||!validPeerId(payload.requestId)||s.photoRequests[payload.requestId])break;
          const request={id:payload.requestId,attemptId:nextId('photo'),status:'waiting',createdAt:s.clock,deadline:null};
          s.photoRequests[request.id]=request;notify('photo',request.id);
          if(s.setupDone&&canPresent()&&['10','24','26','93','186'].includes(from)){s.photoOrigin=from;openPhoto(request);}
          break;
        }
        case 'REVIVE_START': {
          const request=s.photoRequests[payload.requestId];
          if(!request||request.status!=='waiting'||payload.attemptId!==request.attemptId)break;
          request.status='generating';request.deadline=s.clock+120;
          if(s.photoView&&s.photoRequestId===request.id&&from==='51')openPhoto(request);
          break;
        }
        case 'REVIVE_SUCCESS': case 'REVIVE_FAILED': {
          const request=photoReply(payload);if(!request)break;
          if(event==='REVIVE_SUCCESS'){
            if(!validPeerId(payload.resultId)||typeof payload.characterName!=='string'||!payload.characterName.trim()||payload.characterName.length>40||s.availableCompanions.some(c=>c.id===payload.resultId)||Object.values(s.photoRequests).some(r=>r!==request&&r.resultId===payload.resultId)||Object.values(s.requests).some(r=>r.resultId===payload.resultId))break;
            request.resultId=payload.resultId;request.characterName=payload.characterName.trim();request.status='completed';
          }else request.status='failed';
          request.deadline=null;request.attemptId=null;notify('photo',request.id);
          if(s.photoView&&s.photoRequestId===request.id&&from==='52'&&canPresent())openPhoto(request);
          break;
        }
        case 'PHOTO_OPEN': {
          const request=s.photoRequests[payload.requestId];if(!request||!['77','93','186'].includes(from))break;
          s.photoOrigin=from;openPhoto(request);break;
        }
        case 'PHOTO_LATER': if(s.photoView)returnTo(s.photoOrigin,photoPages);break;
        case 'REVIVE_RETRY': {
          const request=s.photoRequests[s.photoRequestId];if(!s.photoView||from!=='102'||request?.status!=='failed')break;
          if(!s.networkConnected||!s.wifiEnabled||!s.cloudAvailable){s.statusMessage='Connect to Wi-Fi and try again';break;}
          request.status='generating';request.attemptId=nextId('photo');request.deadline=s.clock+120;openPhoto(request);break;
        }
        case 'AVATAR_INVITE': case 'AVATAR_ACCEPT': {
          if(!s.socialAllowed){go('169');break;}if(!s.relationValid){go('140');break;}
          let r;
          if(event==='AVATAR_ACCEPT'){
            r=s.requests[s.requestId];
            if(from!=='142')break;
            if(r?.kind!=='avatar'){go('165');break;}
            if(r.status==='waiting'&&s.clock>=r.deadline){r.status='expired';r.revision++;s.avatarPending=false;notify('request',r.id);}
            if(r.status!=='waiting'){go(requestPage(r));break;}
            if(!r.peer||!s.friends[r.peer.peerId]?.established){go('140');break;}
          }else{
            const friend=selectedFriend();if(!friend?.established){go('140');break;}
            r=newRequest('avatar',friend);
          }
          r.localConsent=true;s.avatarLocalConsent=true;s.avatarPending=true;
          if(r.remoteConsent){r.status='generating';r.deadline=s.clock+120;r.revision++;s.avatarRemoteConsent=s.avatarConsentBoth=true;}
          s.avatarDeadline=r.deadline;go(requestPage(r));break;
        }
        case 'AVATAR_INVITATION_RECEIVED': {
          const friend=s.friends[payload.peerId];
          if(!validPeerId(payload.requestId)||s.requests[payload.requestId]||!s.socialAllowed||!s.relationValid||!validPeerId(payload.peerId)||!friend?.established||!validPeerPet(friend.pet)||(payload.revision!==undefined&&(!Number.isSafeInteger(payload.revision)||payload.revision<1)))break;
          const r={id:payload.requestId,kind:'avatar',status:'waiting',revision:payload.revision||1,createdAt:s.clock,deadline:s.clock+300,localConsent:false,remoteConsent:true,peer:peerSnapshot(friend)};
          s.requests[r.id]=r;notify('request',r.id);if(canPresent()){s.requestId=r.id;s.selectedFriendId=friend.peerId;go('142');}break;
        }
        case 'AVATAR_REMOTE_ACCEPT': case 'AVATAR_CREATED': case 'AVATAR_FAILED': case 'AVATAR_EXPIRED':
        case 'FRIEND_CONFIRMED': case 'FRIEND_REMOTE_ACCEPT': case 'FRIEND_REMOTE_DECLINE': case 'PARTNER_CONFIRMED': case 'PARTNER_ACCEPTED': case 'PARTNER_ENDED': requestCallback(event,payload);break;
        case 'OPEN_REQUEST': case 'OPEN_PARTNER_REQUEST': case 'OPEN_AVATAR_RESULT': {
          const r=s.requests[payload.requestId||payload.value||s.requestId];if(!r){go('165');break;}
          s.friendMessageReadRevisions[r.id]=r.revision;
          s.requestId=r.id;if(r.resultId){s.newCharacter=r.characterName;s.newCharacterId=r.resultId;s.targetCharacter=r.characterName;}
          if(r.peer&&s.friends[r.peer.peerId]?.established)s.selectedFriendId=r.peer.peerId;
          if(r.kind==='friend'&&r.status==='completed')s.friendDetailOrigin='165';
          go(requestPage(r));break;
        }
        case 'REQUESTS_BACK': go('165');break;
        case 'AVATAR_RETRY': {const r=s.requests[s.requestId];if(r?.kind==='avatar'&&r.status==='failed'&&r.localConsent&&r.remoteConsent&&s.socialAllowed&&s.relationValid){r.status='generating';r.deadline=s.clock+120;go('91');}else go('165');break;}
        case 'AVATAR_DECLINE': case 'AVATAR_CANCEL': case 'PARTNER_CANCEL': {
          const r=s.requests[s.requestId];if(!r||r.status!=='waiting'){go('165');break;}
          r.status=event==='AVATAR_DECLINE'?'declined':'cancelled';r.revision++;s.avatarPending=s.partnerPending=s.friendPending=false;s.avatarConsentBoth=false;go('144');break;
        }
        case 'AVATAR_ACTIVATE': {
          if(!['154','156'].includes(from)||!s.targetCharacterId){
            const result=from==='92'?s.requests[s.requestId]:null;
            s.targetCharacter=result?.characterName||payload.characterName||s.newCharacter;
            s.targetCharacterId=result?.resultId||payload.avatarId||payload.characterId||s.newCharacterId||'nova';
          }
          s.activationPending=true;s.activationSerial++;go('155');later('AVATAR_ACTIVATED',1.5,{serial:s.activationSerial});break;
        }
        case 'AVATAR_ACTIVATED': if(s.activationPending&&s.task?.kind==='activation'&&payload.serial===s.activationSerial){const origin=s.photoView&&['93','186'].includes(s.photoOrigin)?s.petOrigin:null;finishTask('activation');s.activationPending=false;s.characterName=s.targetCharacter;s.characterId=s.targetCharacterId;if(!s.availableCompanions.some(item=>item.id===s.characterId))s.availableCompanions.push({id:s.characterId,name:s.characterName});s.characterReady=true;s.petIntent=null;go('93');if(origin)s.petOrigin=origin;}break;
        case 'AVATAR_ACTIVATE_FAILED': if(s.task?.kind==='activation'){finishTask('activation');s.activationPending=false;go('156');}break;
        case 'FRIEND_REQUEST': case 'FRIEND_CONFIRM': {
          if(!s.socialAllowed){go('169');break;}
          if(from!=='55'||!s.peerEncounter||!validPeerPet(s.peerEncounter.pet)){s.statusMessage='请先让两台设备碰一碰';break;}
          const existing=s.friends[s.peerEncounter.peerId];
          if(existing?.established&&existing.source!=='sample'){s.selectedFriendId=existing.peerId;go('56');break;}
          newRequest('friend',s.peerEncounter);s.friendPending=true;go('176');break;
        }
        case 'PARTNER_REQUEST': if(!s.socialAllowed)go('169');else if(!s.relationValid||!selectedFriend()?.established)go('140');else{newRequest('partner',selectedFriend());s.partnerPending=true;s.partnerDeadline=s.clock+60;go('89');}break;
        case 'GREETING_CANCEL': s.messageStatus='cancelled';s.messageSerial++;returnTo('56',greetingPages);break;
        case 'PET_UNAVAILABLE_DONE': if(from==='157')petHome();break;
        case 'PET_FEED_OPEN': case 'PET_CLEAN_OPEN': case 'PET_REST_OPEN': case 'EXPLORE_OPEN': {
          if(!['93','157'].includes(from))break;
          const action=event==='EXPLORE_OPEN'?'explore':event.split('_')[1].toLowerCase(),pet=currentPet();
          if(action==='rest'&&pet.restAt!==null){s.petIntent=null;go('175');break;}
          if(!petAvailable(action,pet)){petUnavailable(action);break;}
          ensurePetIntent(action);go({feed:'94',clean:'95',rest:'96',explore:'97'}[action]);break;
        }
        case 'PET_FEED': case 'PET_CLEAN': case 'PET_REST': case 'PET_EXPLORE_COMPLETE': {
          const action=event==='PET_EXPLORE_COMPLETE'?'explore':event.split('_')[1].toLowerCase();
          if(!validPetIntent(action,payload)){
            const intent=s.petIntent,pet=currentPet();
            if(intent&&intent.action===action&&intent.avatarId===s.characterId&&petPayloadMatches(payload,intent)&&intent.baseRevision!==pet.revision){petFeedback(pet,'Please try again');petHome();}
            else s.statusMessage='Action changed. Open it again.';
            break;
          }
          const pet=currentPet(),intent=s.petIntent;
          if(!petAvailable(action,pet)){petUnavailable(action);break;}
          pet.appliedActions.push(intent.actionId);pet.revision++;
          if(action==='feed'){
            if(!foodAvailable()){petUnavailable(action);break;}
            s.foodInventory.consumedTotal++;
            pet.feed=Math.min(100,pet.feed+petRules.feedGain);pet.feedAt=s.clock+petRules.cooldownSeconds;petFeedback(pet,'Yum! Thank you');
          }
          if(action==='clean'){pet.clean=petRules.cleanValue;pet.cleanAt=s.clock+petRules.cooldownSeconds;petFeedback(pet,'All clean!');}
          if(action==='explore'){for(const key of ['feed','clean','energy'])pet[key]=Math.max(petRules.exploreFloor,pet[key]-petRules.exploreCost);pet.exploreAt=s.clock+petRules.cooldownSeconds;petFeedback(pet,'That was fun!');}
          if(action==='rest'){pet.restAt=s.clock+petRules.restSeconds;pet.restActionId=intent.actionId;pet.restRevision=pet.revision;s.petIntent=null;syncPet();go('175');}
          else petHome();break;
        }
        case 'PET_REST_CANCEL': {
          const pet=currentPet(),reference={avatarId:pet.avatarId,actionId:pet.restActionId,baseRevision:pet.restRevision};
          if(from!=='175'||pet.restAt===null||!petPayloadMatches(payload,reference))break;
          pet.restAt=null;pet.restActionId=null;pet.restRevision=null;pet.revision++;petHome();break;
        }
        case 'PET_REST_COMPLETED': {
          if(typeof payload.avatarId!=='string'||typeof payload.actionId!=='string')break;
          completePetRest(payload.avatarId,payload.actionId,payload.baseRevision??payload.revision);break;
        }
        case 'REC_CACHE_EXPIRED': if(s.currentRecording&&payload.recordingId===s.currentRecording.id&&!s.recording&&s.currentRecording.status!=='saving'&&s.currentRecording.expiresAt!==null&&s.clock>=s.currentRecording.expiresAt){s.currentRecording=null;s.draft=false;s.draftExpiresAt=null;go('168');}break;
        case 'SOUL_CONFIRM': if(from==='29'){s.soulAuthorized=true;s.soulSessionId=nextId('soul');s.soulDeadline=s.clock+120;s.soulStage='waiting';go('146');}break;
        case 'SOUL_CANCEL': if(s.soulStage==='verify'){s.statusMessage='校验提交期间不可取消';break;}endSoul('cancelled');s.soulAuthorized=false;go('149');break;
        case 'SOUL_RESUME': if(from!=='39')break;if(s.soulAuthorized){s.soulSessionId=nextId('soul');s.soulDeadline=s.clock+120;s.soulStage='transfer';go('147');}else go('29');break;
        case 'SOUL_READY': if(from==='146'&&soulReply(payload)&&s.soulStage==='waiting'){s.soulStage='transfer';s.soulDeadline=s.clock+120;go('147');}break;
        case 'SOUL_TRANSFERRED': if(from==='147'&&soulReply(payload)&&s.soulStage==='transfer'){s.soulStage='verify';go('148');}break;
        case 'SOUL_VERIFIED': if(from==='148'&&soulReply(payload)&&s.soulStage==='verify'){endSoul('complete');s.soulAuthorized=false;go('08');}break;
        case 'SOUL_INTERRUPTED': if(soulReply(payload)&&['146','147','148'].includes(from)){endSoul('paused');go('39');}break;
        case 'SOUL_VERIFY_FAILED': if(from==='148'&&soulReply(payload)){endSoul('failed');s.soulAuthorized=false;go('40');}break;
        case 'SOUL_TIMEOUT': if(payload.sessionId===s.soulSessionId&&s.soulSessionId&&s.clock>=s.soulDeadline){endSoul('paused');go('39');}break;
        case 'OTA_INSTALL': if (s.draft || s.recording || !s.networkConnected) {s.statusMessage='请先完成当前任务并连接网络';break;} stopCapture(); go('35');break;
        case 'STEPS_FAILED': if(from==='103')go('107');break;
        case 'STEPS_RETRY': if(from==='107')go('103');break;
        case 'BACK': {
          if(['23','24','25','26','45','46','47'].includes(from)){go('10');break;}
          if(s.photoView&&photoPages.has(from)){dispatch('PHOTO_LATER');break;}
          if(from==='146'){dispatch('SOUL_CANCEL');break;}
          if(from==='74'){s.returnStack=[];go('10');break;}
          if(from==='28'){returnTo('75',new Set(['28']));break;}
          if(memoryPages.has(from)&&!['146','147','148'].includes(from)){returnTo(s.soulOrigin,memoryPages);break;}
          if(from==='185'){returnTo(s.friendsOrigin,new Set([...friendChildren,'165','185']));break;}
          if(from==='191'){returnTo('185',friendChildren);break;}
          if(from==='165'){returnTo('185',friendChildren);break;}
          if(['54','55'].includes(from)){dispatch('PEER_DISCOVERY_CANCEL');break;}
          if(from==='56'){returnTo(s.friendDetailOrigin,friendChildren);break;}
          if(greetingPages.has(from)){if(s.messageStatus==='sending'){s.messageStatus='cancelled';s.messageSerial++;}returnTo('56',greetingPages);break;}
          if(['169','140'].includes(from)){returnTo(s.socialErrorOrigin,new Set([...greetingPages,'169','140']));break;}
          if(['188','189','190'].includes(from)){dispatch('PEER_IMPORT_CANCEL');break;}
          if(from==='145'){go(s.requests[s.requestId]?.status==='waiting'?'143':'165');break;}
          if(from==='70'){returnTo(s.recordingMenuOrigin,recordingPages);break;}
          if(from==='158'){returnTo('70',recordingPages);break;}
          if(from==='161'){s.aiActive=false;s.aiSessionId=null;s.aiRequestId=null;returnTo(s.aiOrigin,new Set(['161']));break;}
          if(['82','58'].includes(from)){back('74');break;}
          if(careFeedbackPages.has(from)){finishCareFeedback();break;}
          if(from==='187'){back('74');break;}
          if(['103','107'].includes(from)){
            while(['103','107'].includes(s.returnStack.at(-1)))s.returnStack.pop();
            back('187');break;
          }
          if(from==='124'){dispatch('RECORD_LIST_BACK');break;}
          if(['02','03','04','37','38'].includes(from)){dispatch('PROVISION_CANCEL');break;}
          if(['05','109','126','127'].includes(from)){dispatch('WIFI_CANCEL');break;}
          if(['110','111','113','128','129'].includes(from)){dispatch('WIFI_BACK');break;}
          if(from==='114'){go('109');break;}
          if(from==='115'){go(s.wifiOrigin);break;}
          if(from==='18'){go(s.growthOrigin);break;}
          if(from==='178'){if(s.languageOrigin==='settings')go('180');else{go('01');later('BOOT',1);}break;}
          if(from==='186'){dispatch('COMPANION_CANCEL');break;}
          if(from==='182'){go('124');break;}
          if(from==='183'){dispatch('RECORD_KEEP');break;}
          if(from==='184'){dispatch('REC_BACK');break;}
          if (s.recording) { dispatch('REC_BACK'); break; }
          if (s.aiActive) { dispatch('AI_END'); break; }
          if (s.recoveryMode) { go('101'); break; }
          if(from==='174'){go(s.ssidReturn||'110');break;}
          if(['89','91','92','102','142','143','144','176'].includes(from)){returnTo('165',friendChildren);break;}
          if(from==='162'){dispatch('SINGLE_END');break;}
          if(petPages.has(from)){
            if(from==='93'){while(petPages.has(s.returnStack.at(-1)))s.returnStack.pop();const target=s.petOrigin==='74'?'74':'10';if(s.returnStack.at(-1)===target)s.returnStack.pop();s.petIntent=null;go(target);}
            else petHome();break;
          }
          if(from==='177'){dispatch('REC_DISCARD_CANCEL');break;}
          if(from==='170'){go(s.aiOrigin);break;}
          if (['67', '68', '69', '133', '134'].includes(from)) { go(s.noteReturn); break; }
          if (from === '76') { go(s.aiOrigin); break; }
          if (['72','123','42','164','171'].includes(from)) { showPostSave(); break; }
          if (from === '118') {go(s.draft ? '125' : s.origin);break;}
          if (['31','32'].includes(from)) { back('75'); break; }
          if (from === '125' || from === '73') { s.statusMessage = '请选择保存或丢弃'; break; }
          back(payload.target); break;
        }
        default: {
          let target = payload.target;
          if (!target) target = (data.transitions[from] || []).find(r => r.event === event)?.target;
          if (!target) { s.statusMessage = '此事件在当前状态不可用'; break; }
          target=data.pageAliases?.[target]||target;
          if(target==='56'&&!['136','137','138','139','188','189','190'].includes(from)){dispatch('FRIEND_OPEN');break;}
          if(['87','88','141'].includes(target)){if(!s.socialAllowed){go('169');break;}if(!s.relationValid||!selectedFriend()?.established){go('140');break;}}
          if(target==='124'&&recordingPages.has(from)){dispatch('RECORD_LIST');break;}
          if(from==='74'&&target==='10'){s.returnStack=[];go('10');break;}
          if(['91','92','143','89'].includes(target)){const r=s.requests[s.requestId];if(!r){go('165');break;}go(requestPage(r));break;}
          if (target === '14') { s.aiOrigin = from==='74' ? from : s.aiOrigin; go('161'); break; }
          if (target === '147' && !s.soulAuthorized) {go('29');break;}
          if (target === '148' && !s.soulAuthorized) break;
          if (target === '08' && (from !== '148' || !s.soulAuthorized)) break;
          if (target === '71') { dispatch('REC_START'); break; }
          if (target === '122') { saveRecording(); break; }
          if (target === '10' && ['07', '09'].includes(from)) {completeSetup(false);break;}
          if (target === '09') { go('09'); later('GREETING_DONE',1.5); break; }
          if(target==='111'){if(from==='110')dispatch('WIFI_JOIN');else if(from==='113')dispatch('WIFI_RETRY');break;}
          if (target === '04') { dispatch(['37','38'].includes(from)?'BIND_RETRY':'BIND_ACCEPT');break; }
          if (target === '112') { dispatch('WIFI_CONNECTED'); break; }
          if (target === '186' && from === '112') { dispatch('WIFI_SUCCESS_DONE'); break; }
          if (target === '69') { dispatch('NOTE_DONE'); break; }
          if (target === '133') { dispatch('NOTE_LATER'); break; }
          if (target === '119') { dispatch('POWER_OFF'); break; }
          if (target === '120') { dispatch('SCREEN_OFF'); break; }
          if (target === '153') { dispatch('REBOOT'); break; }
          if (target === '101') s.recoveryMode = true;
          if (['74', '75', '77', '31', '32', '93', '165'].includes(target)) s.origin = from;
          if (target === '137') { dispatch('SOCIAL_SEND'); break; }
          if (target === '136') { dispatch('SOCIAL_COMPOSE'); break; }
          if (target === '160') { dispatch('CARE_END'); break; }
          if(['94','95','96','97'].includes(target)&&from==='93'){dispatch({'94':'PET_FEED_OPEN','95':'PET_CLEAN_OPEN','96':'PET_REST_OPEN','97':'EXPLORE_OPEN'}[target]);break;}
          go(target, { push: !['10', '24', '26', '14', '15', '16', '91', '92'].includes(target) });
        }
      }
      if(s.page!=='110'&&!['111','113','174'].includes(s.page)){s.showPassword=false;if(event==='BACK')s.password='';}
      syncCare();presentDockError();presentGrowth();storeNote();presentReminder();log(event, from);return s;
    }
    function tick(seconds = 1) {
      if(!Number.isFinite(seconds)||seconds<0)return s;
      s.clock += seconds; s.idleSeconds += seconds;
      if(s.dockSync.status==='syncing'&&s.clock>=s.dockSync.deadline)dispatch('DOCK_SYNC_FAILED',{sessionId:s.dockSync.sessionId,attemptId:s.dockSync.attemptId});
      for(const request of Object.values(s.photoRequests))if(request.status==='generating'&&s.clock>=request.deadline){request.status='failed';request.deadline=null;request.attemptId=null;notify('photo',request.id);if(s.photoView&&s.photoRequestId===request.id&&s.page==='52'&&canPresent())openPhoto(request);}
      for(const mutation of s.noteMutations)if(mutation.status==='sending'&&s.clock>=mutation.deadline){mutation.status='failed';mutation.attemptId=null;mutation.deadline=null;}
      if(s.soulSessionId&&s.clock>=s.soulDeadline)dispatch('SOUL_TIMEOUT',{sessionId:s.soulSessionId});
      if(s.foodInventory.status==='syncing'&&s.foodInventory.deadline!==null&&s.clock>=s.foodInventory.deadline)dispatch('FOOD_SYNC_FAILED',{requestId:s.foodInventory.requestId,error:'timeout'});
      if(s.page==='126'&&s.wifiScanDeadline!==null&&s.clock>=s.wifiScanDeadline)dispatch('WIFI_SCAN_EMPTY',{scanId:s.wifiScanId});
      if(s.page==='111'&&s.connectionDeadline!==null&&s.clock>=s.connectionDeadline)dispatch('WIFI_TIMEOUT',{connectionId:s.connectionId});
      if(s.page==='182'&&s.playbackOn){const r=s.records.find(r=>r.id===s.selectedRecordId);if(r){s.playbackSeconds=Math.min(r.seconds,s.playbackSeconds+seconds);if(s.playbackSeconds>=r.seconds)s.playbackOn=false;}}
      const failed=s.currentRecording;
      if(failed&&s.draft&&!s.recording&&failed.status!=='saving'&&failed.expiresAt!==null&&s.clock>=failed.expiresAt){s.draft=false;s.draftExpiresAt=null;s.currentRecording=null;s.shutdownAfterSave=false;notify('draft',failed.id);if(canPresent())go('168');}
      for(const [avatarId,pet]of Object.entries(s.pets))if(pet.restAt!==null&&s.clock>=pet.restAt)completePetRest(avatarId,pet.restActionId,pet.restRevision);
      if(s.petFeedback&&s.clock>=s.petFeedback.until)s.petFeedback=null;
      if (s.recording) { s.seconds = Math.min(60, s.seconds + seconds); if (s.seconds >= 60) dispatch('REC_LIMIT'); }
      storeNote();for(const note of Object.values(s.notes).sort((a,b)=>a.noteDueAt-b.noteDueAt||a.noteId.localeCompare(b.noteId)))if(!note.noteDeleted&&(note.noticeStatus==='snoozed'&&note.snoozeAt!==null&&s.clock>=note.snoozeAt||note.noticeStatus==='scheduled'&&s.clock>=note.noteDueAt))dispatch('NOTE_DUE',{noteId:note.noteId});
      for(const r of Object.values(s.requests))if(['waiting','generating'].includes(r.status)&&s.clock>=r.deadline)dispatch(r.kind==='avatar'?'AVATAR_EXPIRED':'PARTNER_ENDED',{requestId:r.id,revision:r.revision});
      if (s.auto && s.clock >= s.auto.at) { const a = s.auto; s.auto = null; dispatch(a.event, a.payload); }
      const ready=s.jobs.filter(j=>s.clock>=j.at);s.jobs=s.jobs.filter(j=>s.clock<j.at);for(const job of ready)dispatch(job.event,job.payload);
      if(s.task&&s.clock>=s.task.deadline){const kind=s.task.kind;
        if(kind==='save')dispatch('REC_SAVE_FAILED',{recordingId:s.currentRecording.id,attemptId:s.currentRecording.attemptId});
        else if(kind==='peerImport')dispatch('PEER_IMPORT_FAILED',{attemptId:s.peerImport?.attemptId,reason:'transfer'});
        else dispatch({ota:'OTA_FAIL',rollback:'ROLLBACK_FAILED',soul:'SOUL_INTERRUPTED',activation:'AVATAR_ACTIVATE_FAILED',recovery:'RECOVERY_FAIL',reboot:'BOOT'}[kind]);
      }
      if(s.aiActive&&s.page==='15'&&s.clock-s.enteredAt>=8){stopCapture(true);s.aiRequestId=null;go('78');}
      if(s.aiPolicy==='allow'&&s.aiPolicyExpiresAt!==null&&s.clock>=s.aiPolicyExpiresAt){s.aiPolicy='unknown';s.aiPolicyExpiresAt=null;}
      if(s.quietOverride&&s.clock>=s.quietOverride.until)s.quietOverride=null;
      const hour=(s.localHour+s.clock/3600)%24;s.quiet=s.quietOverride?s.quietOverride.value:hour>=22||hour<7;
      if (s.aiActive && s.page === '14' && s.idleSeconds >= 60) dispatch('AI_END');
      if (['74', '75', '77', '93'].includes(s.page) && s.idleSeconds >= 10) go('10');
      if(homePages.has(s.page)&&s.idleSeconds>=s.standbyTimeout)go(s.displayMode==='aod'?'79':'120');
      syncCare();presentDockError();presentGrowth();storeNote();presentReminder();
      return s;
    }
    function gesture(direction,region) {
      if (['120', '121', '79'].includes(s.page)) return dispatch('WAKE');
      if(s.page==='93'&&region==='companions'&&['left','right'].includes(direction))return dispatch(direction==='left'?'PET_COMPANION_NEXT':'PET_COMPANION_PREV');
      if (homePages.has(s.page)||s.page==='23') {
        const target = { down: '77', up: '74', right: '74', left: '75' }[direction];
        return dispatch('NAVIGATE', { target });
      }
      if (direction === 'right') return dispatch('BACK');
      if (['97', '98', '99'].includes(s.page)&&['up','down'].includes(direction)) {
        const target={97:{up:'98',down:'99'},98:{up:'98',down:'97'},99:{up:'97',down:'99'}}[s.page][direction];
        if(target!==s.page)return dispatch('NAVIGATE',{target});
      }
      return s;
    }
    return { state: s, dispatch, tick, gesture, micTask, currentPet, ensurePetIntent, homePage, pages: pageMap };
  }
  const api = { createMachine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.LG01Machine = api;
})(typeof window !== 'undefined' ? window : globalThis);
