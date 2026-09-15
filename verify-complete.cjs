const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {parseHTML,NodeFilter}=require('./.verification/node_modules/linkedom');
const jsQR=require('./.verification/node_modules/jsqr');
const PNG=require('./.verification/node_modules/pngjs').PNG;
const CSSOM=require('./.verification/node_modules/cssom');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'project-data.json'),'utf8'));
const sandbox={LG01_DATA:data};for(const script of ['fox-data.js','fox-flow.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,script),'utf8'),sandbox);
const {createMachine}=require('./state-machine'),{createSession}=require('./review-controller');
const {document}=parseHTML('<!doctype html><html><body></body></html>');
const ctx={document,console,NodeFilter,Node:{TEXT_NODE:3},LG01_DATA:data,FoxPages:sandbox.FoxPages, setTimeout,clearTimeout,URL,URLSearchParams};ctx.window=ctx;
vm.createContext(ctx);
for(const script of ['lucide.min.js','screen-renderer.js','locale-cn.js','fox-templates.js','fox-renderer.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,script),'utf8'),ctx,{filename:script});
const results=[];
function test(name,fn){try{results.push({name,pass:true,detail:fn()});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.stack});console.log('FAIL '+name+'\n'+e.stack);}}
function fresh(){const m=createMachine(data),r=createSession(data,m);return{m,r,s:m.state};}
function enterSetupWifi(m){
  m.dispatch('SCENARIO',{name:'setup'});m.tick(1);assert.equal(m.state.page,'178');
  m.dispatch('LANGUAGE_SET',{value:'zh-CN'});m.dispatch('LANGUAGE_DONE');m.dispatch('BIND_REQUEST');m.dispatch('BIND_ACCEPT');m.tick(1.5);assert.equal(m.state.page,'05');
}
function typePassword(m,value='demo-pass'){for(const key of value)m.dispatch('KEY',{key});}
function screenDoc(id,s){const page=pages.find(p=>p.n===id)||data.runtimePages?.[id];assert(page,'Missing render fixture '+id);return parseHTML(ctx.FoxScreen.render(page,{...s,language:'zh-CN',still:true})).document;}
function openEntry(file,search=''){
  const {document:doc,window:domWindow}=parseHTML(fs.readFileSync(path.join(__dirname,file),'utf8'));
  domWindow.HTMLElement.prototype.pause=function(){this.paused=true;};
  const entryUrl=new URL('https://prototype.invalid/'+file+search),intervals=[];
  const app={document:doc,console,NodeFilter,Node:{TEXT_NODE:3},structuredClone,URL,URLSearchParams,
    setTimeout:()=>1,clearTimeout:()=>{},setInterval:fn=>intervals.push(fn),clearInterval:()=>{},
    addEventListener:()=>{},matchMedia:()=>({matches:true}),location:{href:entryUrl.href,search:entryUrl.search,hash:entryUrl.hash},history:{replaceState:(_state,_title,value)=>{const next=new URL(value,app.location.href);Object.assign(app.location,{href:next.href,search:next.search,hash:next.hash});}}};
  app.window=app;vm.createContext(app);
  for(const script of [...doc.querySelectorAll('script[src]')].map(n=>n.getAttribute('src')))vm.runInContext(fs.readFileSync(path.join(__dirname,script),'utf8'),app,{filename:script});
  const click=selector=>{const el=doc.querySelector(selector);assert(el,selector);el.dispatchEvent(new domWindow.Event('click',{bubbles:true}));};
  const emit=(el,type,props={})=>{const event=Object.assign(new domWindow.Event(type,{bubbles:true,cancelable:true}),props);el.dispatchEvent(event);return event;};
  return{doc,app,click,domWindow,emit,intervals};
}
function scrollFixture(doc,height=358,visible=245,scale=1){
  const el=doc.querySelector('#live-screen [data-scroll-list]');assert(el);
  Object.defineProperties(el,{scrollHeight:{value:height,configurable:true},clientHeight:{value:visible,configurable:true}});
  el.closest('.device-screen').getBoundingClientRect=()=>({width:480*scale});
  return el;
}
const pages=data.groups.flatMap(g=>g.pages);
const baselineDirectory=path.resolve(__dirname,'../companion-ui-fox_主设备配网_交互修订_2026-09-12');
const warmDirectory=path.resolve(__dirname,'../companion-ui-fox_情感文案优化_2026-09-12');
const flowDirectory=path.resolve(__dirname,'../companion-ui-fox_流程排版优化_2026-09-12');
const menuDirectory=path.resolve(__dirname,'../companion-ui-fox_菜单配网精简_2026-09-12');
test('Previous menu-network revision remains byte-for-byte unchanged',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'menu-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(menuDirectory,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length,excluded:'node_modules'};
});
test('Previous flow-layout revision remains byte-for-byte unchanged',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'flow-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(flowDirectory,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length,excluded:'node_modules'};
});
test('Previous warm-copy revision remains byte-for-byte unchanged',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'warm-copy-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(warmDirectory,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length,excluded:'node_modules'};
});
test('Main-device revision remains byte-for-byte unchanged',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'device-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(baselineDirectory,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length,excluded:'node_modules'};
});
test('Original directory remains byte-for-byte unchanged',()=>{
  const original=path.resolve(__dirname,'../companion-ui-fox'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'original-sha256.json')));
  for(const [name,expected]of Object.entries(manifest)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(original,name))).digest('hex'),expected,name);}
  return{files:Object.keys(manifest).length};
});
test('Previous complete prototype remains byte-for-byte unchanged',()=>{
  const source=path.resolve(__dirname,'../companion-ui-fox_完整交互_2026-09-12'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length};
});
test('Previous Chinese prototype remains byte-for-byte unchanged',()=>{
  const source=path.resolve(__dirname,'../companion-ui-fox_完整交互_简体中文_2026-09-12'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'chinese-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length};
});
test('Previous scrolling prototype remains byte-for-byte unchanged',()=>{
  const source=path.resolve(__dirname,'../companion-ui-fox_完整交互_简体中文_滑动版_2026-09-12'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sliding-source-sha256.json')));
  for(const [name,expected]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,name))).digest('hex'),expected,name);
  return{files:Object.keys(manifest).length,excluded:'node_modules'};
});
test('All pages are unique, ordered, and all transition targets exist',()=>{
  const ids=new Set(pages.map(p=>p.n)),runtimeIds=new Set(Object.keys(data.runtimePages||{})),known=new Set([...ids,...runtimeIds]);assert.equal(pages.length,165);assert.equal(ids.size,pages.length);
  let routes=0;for(const [from,list]of Object.entries(data.transitions)){assert(known.has(from),from);for(const route of list){assert(known.has(route.target),from+' -> '+route.target);routes++;}}
  for(const page of pages)for(const item of [...page.ui.actions,...page.ui.items])if(item.target)assert(known.has(item.target),page.n+' UI -> '+item.target);
  assert(runtimeIds.has('120'));assert(!ids.has('120'));assert(!pages.some(p=>['06','80','83','84','85','86','108','116','120','130','131','132','179'].includes(p.n)));assert.equal(data.pageAliases['130'],'05');assert.equal(data.pageAliases['131'],'186');assert.equal(data.pageAliases['132'],'186');assert(!data.groups.some(g=>g.id==='legacy-wifi'));return{pages:ids.size,runtimeOnly:[...runtimeIds],groups:data.groups.length,routes};
});
test('Startup confirms the main device and uses the circular password keyboard before character selection',()=>{
  const {m,s,r}=fresh(),expected=['01','178','02','03','04','05','110','111','112','186','07','09','10'];
  for(const id of expected){assert.equal(s.page,id);if(id==='110'){assert.equal(s.ssid,'Home');r.next();assert.equal(s.page,'110');assert(s.statusMessage.includes('密码'));typePassword(m);}if(id!=='10')r.next();}
  assert(s.bound&&s.setupDone&&s.networkConfigured&&s.characterReady);return expected;
});
test('Sequential catalog reaches every page, with backward and forward snapshots',()=>{
  const {s,r}=fresh();r.setMode('catalog');const seen=[];do{seen.push(s.page);}while(r.next());
  assert.equal(JSON.stringify(seen),JSON.stringify(pages.map(p=>p.n)));assert(r.back());assert(r.next());assert.equal(s.page,seen.at(-1));return seen.length;
});
test('Every review branch opens its declared page',()=>{
  const {r,s}=fresh();r.setMode('catalog');let count=0;
  for(const [from,list]of Object.entries(data.transitions)){if(data.runtimePages?.[from])continue;for(let i=0;i<list.length;i++){if(data.runtimePages?.[list[i].target])continue;r.preview(from);assert(r.applyOption('route-'+i));assert.equal(s.page,list[i].target,from+' '+list[i].event);count++;}}
  return count;
});
test('QR stays valid indefinitely; device confirmation still expires and rejects cancelled callbacks',()=>{
  const {m,r,s}=fresh();r.next();r.next();s.noteDueAt=Infinity;for(const n of Object.values(s.notes)){n.noteDueAt=Infinity;n.noticeStatus='scheduled';}m.tick(86400);assert.equal(s.page,'02');assert(!('qrDeadline' in s));assert(!('qrVersion' in s));
  const markup=screenDoc('02',s);assert.equal(markup.querySelector('.fox-qr img').getAttribute('src'),'assets/setup-demo-1.png');assert(!markup.querySelector('[data-event="QR_REFRESH"]'));
  m.dispatch('BIND_REQUEST');assert.equal(s.page,'03');m.dispatch('BIND_DECLINE');assert.equal(s.page,'02');m.dispatch('BIND_SUCCESS');assert.equal(s.page,'02');assert.equal(s.bound,false);
  m.dispatch('BIND_REQUEST');m.tick(60);assert.equal(s.page,'37');m.dispatch('BIND_ACCEPT');assert.equal(s.page,'37');
});
test('Changing network returns to Settings and preserves the character',()=>{
  const {m,r,s}=fresh();r.start('settings');s.characterName='Pico';s.characterId='pico';m.dispatch('OPEN_WIFI');m.tick(1);assert.equal(s.page,'109');m.dispatch('WIFI_SELECT',{value:'Office'});typePassword(m);m.dispatch('WIFI_JOIN');m.tick(2);m.dispatch('WIFI_CONTINUE');assert.equal(s.page,'109');assert.equal(s.characterId,'pico');assert.equal(s.ssid,'Office');assert(!s.logs.some(log=>log.event==='BIND_REQUEST'));
  assert.equal(screenDoc('109',s).querySelector('.fox-readonly .list-item-label').textContent,'Office');m.dispatch('BACK');assert.equal(s.page,'180');
});
test('Device Wi-Fi supports open networks, password boundaries and auth recovery',()=>{
  const {m,s}=fresh();enterSetupWifi(m);m.dispatch('WIFI_SELECT',{value:'Home'});
  typePassword(m,'1234567');m.dispatch('WIFI_JOIN');assert.equal(s.page,'110');m.dispatch('KEY',{key:'8'});m.dispatch('WIFI_JOIN');assert.equal(s.page,'111');
  m.dispatch('WIFI_AUTH_ERROR',{connectionId:s.connectionId});assert.equal(s.page,'128');assert.equal(s.password,'');m.dispatch('WIFI_EDIT');assert.equal(s.page,'110');
  typePassword(m,'x'.repeat(64));assert.equal(s.password.length,63);m.dispatch('WIFI_JOIN');assert.equal(s.page,'111');m.tick(2);assert.equal(s.page,'112');assert.equal(s.password,'');
  enterSetupWifi(m);m.dispatch('WIFI_SELECT_OPEN',{value:'Park'});assert.equal(s.page,'111');assert.equal(s.password,'');m.tick(2);m.dispatch('WIFI_CONTINUE');assert.equal(s.page,'186');m.dispatch('BACK');assert.equal(s.page,'112');
});
test('Wi-Fi scan empty, timeout, cancel and rescan keep the correct list origin',()=>{
  const {m,s}=fresh();enterSetupWifi(m);m.dispatch('WIFI_SCAN');const first=s.wifiScanId;m.dispatch('WIFI_SCAN_EMPTY',{scanId:first});assert.equal(s.page,'127');
  m.dispatch('WIFI_SCAN');const second=s.wifiScanId;m.dispatch('WIFI_SCAN_RESULT',{scanId:first});assert.equal(s.page,'126');m.dispatch('WIFI_SCAN_RESULT',{scanId:second});assert.equal(s.page,'05');
  m.dispatch('WIFI_SCAN');const cancelled=s.wifiScanId;m.dispatch('WIFI_CANCEL');assert.equal(s.page,'05');m.dispatch('WIFI_SCAN_RESULT',{scanId:cancelled});assert.equal(s.page,'05');assert(!s.networkConfigured);
  m.dispatch('SETUP_RESUME');assert.equal(s.page,'126');s.auto=null;m.tick(15);assert.equal(s.page,'127');m.dispatch('WIFI_SCAN');m.tick(1);assert.equal(s.page,'05');
});
test('Wi-Fi cancel, timeout, lost network and stale callbacks do not advance a new attempt',()=>{
  const {m,s}=fresh();enterSetupWifi(m);m.dispatch('WIFI_SELECT_OPEN',{value:'Guest'});const stale=s.connectionId;m.dispatch('WIFI_BACK');assert.equal(s.page,'05');
  m.dispatch('WIFI_SELECT_OPEN',{value:'Park'});const current=s.connectionId;
  for(const event of ['WIFI_CONNECTED','WIFI_AUTH_ERROR','WIFI_TIMEOUT','WIFI_CLOUD_FAIL','WIFI_LOST']){m.dispatch(event,{connectionId:stale});assert.equal(s.page,'111',event);assert.equal(s.connectionId,current);}
  m.dispatch('WIFI_TIMEOUT',{connectionId:current});assert.equal(s.page,'05');assert(s.wifiError);m.dispatch('WIFI_SELECT_OPEN',{value:'Guest'});assert.equal(s.page,'111');m.dispatch('WIFI_LOST',{connectionId:s.connectionId});assert.equal(s.page,'129');m.dispatch('WIFI_BACK');assert.equal(s.page,'05');
  m.dispatch('WIFI_SELECT',{value:'Home'});typePassword(m);m.dispatch('WIFI_JOIN');s.auto=null;m.tick(30);assert.equal(s.page,'05');assert(s.wifiError);assert.equal(s.password,'');m.dispatch('WIFI_SELECT',{value:'Home'});typePassword(m);m.dispatch('WIFI_JOIN');assert.equal(s.page,'111');m.tick(2);assert.equal(s.page,'112');
});
test('Cancelling a Settings network change preserves the prior connection and clears input',()=>{
  const {m,r,s}=fresh();r.start('settings');s.ssid='Known network';s.characterId='pico';m.dispatch('WIFI_SCAN');m.tick(1);m.dispatch('WIFI_SELECT',{value:'New network'});typePassword(m);m.dispatch('WIFI_JOIN');const cancelled=s.connectionId;m.dispatch('BACK');assert.equal(s.page,'109');assert.equal(s.password,'');assert.equal(s.ssid,'Known network');assert(s.networkConnected);
  m.dispatch('BACK');assert.equal(s.page,'180');m.dispatch('WIFI_CONNECTED',{connectionId:cancelled});assert.equal(s.page,'180');assert.equal(s.characterId,'pico');
});
test('Cloud unavailable only retries services without repeating password setup or bypassing failure',()=>{
  const {m,s}=fresh();enterSetupWifi(m);m.dispatch('WIFI_SELECT_OPEN',{value:'Guest'});m.dispatch('WIFI_CLOUD_FAIL',{connectionId:s.connectionId});assert.equal(s.page,'78');assert(s.networkConfigured&&s.networkConnected);m.dispatch('CLOUD_USE_LOCAL');assert.equal(s.page,'78');m.dispatch('NETWORK_RETRY');m.tick(1.2);assert.equal(s.page,'78');s.cloudAvailable=true;m.dispatch('NETWORK_RETRY');m.tick(1.2);assert.equal(s.page,'186');m.dispatch('COMPANION_COMMIT');m.tick(1.5);m.tick(1.5);assert.equal(s.page,'10');s.cloudAvailable=false;m.dispatch('AI_START');assert.equal(s.page,'78');
});
test('Explicit local setup remains offline and does not manufacture a network connection',()=>{
  const {m,s}=fresh();enterSetupWifi(m);assert.equal(s.page,'05');m.dispatch('SETUP_DEFAULT');assert.equal(s.page,'07');assert(s.networkSkipped);assert(!s.networkConfigured);assert(!s.networkConnected);m.tick(1.5);m.tick(1.5);assert.equal(s.page,'10');m.dispatch('AI_START');assert.equal(s.page,'21');
});
test('Main-device pairing retries and cancellations use attempt identities',()=>{
  const {m,r,s}=fresh();r.next();r.next();m.dispatch('BIND_REQUEST');m.dispatch('BIND_ACCEPT');const stale=s.bindSessionId;m.dispatch('BACK');assert.equal(s.page,'02');m.dispatch('BIND_REQUEST');m.dispatch('BIND_ACCEPT');const current=s.bindSessionId;assert.notEqual(current,stale);
  m.dispatch('BIND_SUCCESS',{bindSessionId:stale});assert.equal(s.page,'04');assert(!s.bound);m.dispatch('BIND_FAILED',{bindSessionId:current});assert.equal(s.page,'37');m.dispatch('BIND_RETRY');const retry=s.bindSessionId;m.dispatch('BIND_SUCCESS',{bindSessionId:retry});assert.equal(s.page,'05');assert(s.bound);
  for(const event of ['APP_CREDENTIALS','WIFI_PROVISIONED','PROVISION_TIMEOUT']){m.dispatch(event);assert.equal(s.page,'05');}
});
test('Direct AI chat, thinking, reply, interrupt and end require no phone setup',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('AI_START');assert.equal(s.page,'14');assert.equal(s.aiConsent,false);assert.equal(m.micTask(),'ai');m.dispatch('AI_INPUT_END');assert.equal(s.page,'15');m.tick(1.2);assert.equal(s.page,'16');m.dispatch('AI_INTERRUPT');assert.equal(s.page,'14');m.dispatch('AI_END');assert.equal(s.page,'76');assert.equal(m.micTask(),'none');m.tick(1);assert.equal(s.page,'10');
});
test('AI offline and microphone guards stay effective',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'networkConnected',value:false});m.dispatch('AI_START');assert.equal(s.page,'21');r.start('daily');m.dispatch('MUTE_TOGGLE');m.dispatch('AI_START');assert.equal(s.page,'10');assert.equal(m.micTask(),'none');assert(s.statusMessage);assert(!s.aiActive);
});
test('Recording pause/resume/save/playback/delete forms one object lifecycle',()=>{
  const {m,r,s}=fresh();r.start('recording');m.dispatch('REC_START');m.tick(8);m.dispatch('REC_PAUSE');assert.equal(s.page,'184');m.tick(3);assert.equal(s.seconds,8);m.dispatch('REC_RESUME');m.tick(2);assert.equal(s.seconds,10);m.dispatch('REC_STOP');assert.equal(s.page,'122');m.tick(1);assert.equal(s.records.length,1);const id=s.records[0].id;
  m.dispatch('RECORD_OPEN',{recordId:id});assert.equal(s.page,'182');m.dispatch('RECORD_PLAY');m.tick(3);assert.equal(s.playbackSeconds,3);m.dispatch('RECORD_PLAY');m.tick(1);assert.equal(s.playbackSeconds,3);m.dispatch('RECORD_DELETE_OPEN');assert.equal(s.page,'183');m.dispatch('RECORD_KEEP');assert.equal(s.records.length,1);m.dispatch('RECORD_DELETE_OPEN');m.dispatch('RECORD_DELETE');assert.equal(s.records.length,0);m.dispatch('RECORD_DELETE');assert.equal(s.records.length,0);
});
test('Recording failure preserves draft, and mute does not resume paused capture',()=>{
  const {m,r,s}=fresh();r.start('recording');s.saveFail=true;m.dispatch('REC_START');m.tick(4);m.dispatch('REC_PAUSE');m.dispatch('MUTE_TOGGLE');assert.equal(m.micTask(),'none');assert(s.draft);m.dispatch('REC_SAVE');m.tick(1);assert.equal(s.page,'73');assert(s.draft);assert.equal(s.records.length,0);
});
test('Previous/Next review snapshots do not duplicate saved objects',()=>{
  const {r,s}=fresh();r.start('recording');r.dispatch('REC_START');r.perform(()=>{s.seconds=8;});r.dispatch('REC_STOP');r.next();assert.equal(s.records.length,1);const id=s.records[0].id;r.back();assert.equal(s.page,'122');r.next();assert.equal(s.records.length,1);assert.equal(s.records[0].id,id);
});
test('Pet feed/clean/rest/explore changes state once and respects cooldown',()=>{
  const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:2});m.dispatch('PET_FEED_OPEN');const payload={...s.petIntent};m.dispatch('PET_FEED',payload);assert.equal(m.currentPet().feed,80);assert.equal(s.foodInventory.consumedTotal,1);m.dispatch('PET_FEED',payload);assert.equal(m.currentPet().feed,80);assert.equal(s.foodInventory.consumedTotal,1);m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'157');m.dispatch('BACK');m.dispatch('PET_CLEAN_OPEN');m.dispatch('PET_CLEAN',{...s.petIntent});assert.equal(m.currentPet().clean,100);m.dispatch('PET_REST_OPEN');m.dispatch('PET_REST',{...s.petIntent});assert.equal(s.page,'175');const pet=m.currentPet();assert(pet.restAt>0);m.dispatch('BACK');m.tick(900);assert.equal(pet.energy,90);m.dispatch('NAVIGATE',{target:'93'});m.dispatch('EXPLORE_OPEN');m.dispatch('PET_EXPLORE_COMPLETE',{...s.petIntent});assert.equal(pet.energy,70);
});
test('Reminder snooze and completion are reflected in detail and lists',()=>{
  const {m,r,s}=fresh();r.start('note');m.dispatch('NOTE_LATER');assert.equal(s.page,'133');assert.equal(s.noticeStatus,'snoozed');assert.equal(s.snoozeAt,s.clock+600);m.tick(600);assert.equal(s.noticeStatus,'due');m.dispatch('NOTE_DONE');assert.equal(s.noticeStatus,'completed');
});
test('Social consent is not manufactured by the device',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('FRIEND_OPEN');assert.equal(s.page,'169');assert.equal(s.socialAllowed,false);m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('FRIEND_OPEN');assert.equal(s.page,'56');
});
test('All pages render in English and Chinese with available local media',()=>{
  const {r,s}=fresh();const sources=new Set();let controls=0;let missingIcons=0;
  for(const lang of ['en','zh-CN'])for(const p of pages){
    r.preview(p.n);const html=ctx.FoxScreen.render(p,{...s,language:lang,still:true});const {document:doc}=parseHTML('<html><body>'+html+'</body></html>');const root=doc.querySelector('.device-screen');assert(root,'Root '+p.n);assert.equal(root.dataset.screenId,p.n);assert.equal(root.getAttribute('lang'),lang);
    assert(!/undefined|NaN/.test(html),'Invalid content '+p.n);
    for(const el of root.querySelectorAll('img[src],video[src]')){const src=el.getAttribute('src');assert(!/^https?:/.test(src));assert(fs.existsSync(path.join(__dirname,src)),p.n+' '+src);sources.add(src);}
    for(const el of root.querySelectorAll('button')){
      assert(el.hasAttribute('data-event')||el.hasAttribute('data-ui'),'Unwired button P'+p.n+' '+el.outerHTML);
      assert(el.textContent.trim()||el.getAttribute('aria-label'),'Missing accessible name P'+p.n);controls++;
    }
    const actions=root.querySelector('.screen-actions');if(actions?.children.length===2){const second=actions.children[1];assert(!['Cancel','Not now','Keep'].includes(second.textContent.trim()),'Cancel on right '+p.n);}
    if(lang==='zh-CN'&&['02','03','04','05','71','184','186'].includes(p.n))assert(!/Scan with|Connect this|Recording|Choose a companion|Finish on/.test(root.textContent),'Untranslated '+p.n);
  }
  return{renderings:pages.length*2,controls,media:[...sources]};
});
test('Generated QR images decode to demo-only identities',()=>{
  for(let i=1;i<=3;i++){const image=PNG.sync.read(fs.readFileSync(path.join(__dirname,`assets/setup-demo-${i}.png`)));const qr=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);assert(qr);assert.equal(qr.data,`LUMIQ-DEMO:LG01:SETUP:${i}`);}
});
test('Both HTML entry points reference existing, syntactically valid scripts and styles',()=>{
  for(const file of ['index.html','gallery.html']){const {document:doc}=parseHTML(fs.readFileSync(path.join(__dirname,file),'utf8'));for(const el of doc.querySelectorAll('script[src],link[rel=stylesheet]')){const src=el.getAttribute('src')||el.getAttribute('href');assert(fs.existsSync(path.join(__dirname,src)),src);if(src.endsWith('.js'))new vm.Script(fs.readFileSync(path.join(__dirname,src),'utf8'),{filename:src});}}
});
test('Workbench DOM can navigate and open the last Settings item without pagination',()=>{
  const {doc,app,click}=openEntry('index.html');
  const state=()=>doc.querySelector('#live-screen .device-screen').dataset.screenId;
  assert.equal(app.FoxPrototype.view.language,'zh-CN');assert.equal(doc.querySelector('#live-screen .device-screen').getAttribute('lang'),'zh-CN');
  assert.equal(state(),'01');click('#next');assert.equal(state(),'178');click('#live-screen [data-event="LANGUAGE_SET"][data-value="zh-CN"]');assert(doc.querySelector('#live-screen').textContent.includes('继续'));
  click('#live-screen [data-event="LANGUAGE_DONE"]');assert.equal(state(),'02');click('#previous');assert.equal(state(),'178');
  click('[data-scenario="daily"]');assert.equal(state(),'10');click('#live-screen .character-button');assert.equal(state(),'14');click('#live-screen [data-event="AI_END"]');assert.equal(state(),'76');
  click('[data-scenario="settings"]');assert.equal(state(),'180');assert(doc.querySelector('#live-screen [data-event="OPEN_WIFI"][data-target="126"]'));assert(!doc.querySelector('#live-screen .fox-list-pager'));assert.equal(doc.querySelectorAll('#live-screen [data-scroll-list] .screen-list-item').length,6);click('#live-screen [data-target="181"]');assert.equal(state(),'181');
});
test('All circular list pages keep full item sets without page controls',()=>{
  const {r,s}=fresh();let lists=0;
  for(const p of pages){r.preview(p.n);const {document:doc}=parseHTML(ctx.FoxScreen.render(p,{...s,language:'zh-CN',still:true}));
    assert(!doc.querySelector('.fox-list-pager,[data-ui="list-next"],[data-ui="list-prev"]'),p.n);
    for(const list of doc.querySelectorAll('.screen-list,.fox-list')){assert(list.hasAttribute('data-scroll-list'),p.n);assert.equal(list.getAttribute('tabindex'),'0');assert.equal(list.getAttribute('role'),'region');assert(list.getAttribute('aria-label'));lists++;}
    if(['180','181','185'].includes(p.n))assert.equal(doc.querySelectorAll('.screen-list-item,.fox-readonly,.fox-list-row').length,p.ui.items.length,p.n);
  }
  return{listPages:lists};
});
test('Record lists keep all records and preserve scroll when returning from playback',()=>{
  const {doc,app,click,emit}=openEntry('index.html','?page=124&lang=zh-CN');
  const s=app.FoxPrototype.machine.state;s.records=Array.from({length:8},(_,i)=>({id:'scroll-record-'+i,seconds:20+i,status:'local-only'}));app.FoxPrototype.render();
  assert.equal(doc.querySelectorAll('.fox-list-row').length,8);const list=scrollFixture(doc,820,259);list.scrollTop=520;emit(list,'scroll');
  click('#live-screen [data-record-id="scroll-record-7"]');assert.equal(s.page,'182');click('#live-screen [data-event="RECORD_LIST"]');assert.equal(s.page,'124');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,520);
});
test('Mouse dragging scrolls at the device scale and suppresses the release click',()=>{
  const {doc,app,emit}=openEntry('index.html','?page=180&lang=zh-CN');
  const list=scrollFixture(doc,858,480,.5),first=list.querySelector('[data-target="181"]');
  const pointer={pointerId:1,pointerType:'mouse',button:0,isPrimary:true,clientX:100,clientY:200};
  emit(first,'pointerdown',pointer);emit(doc,'pointermove',{...pointer,clientY:160});assert.equal(list.scrollTop,80);
  emit(doc,'pointerup',{...pointer,clientY:160});const released=emit(first,'click',{detail:1,pointerId:1});assert(released.defaultPrevented);assert.equal(app.FoxPrototype.machine.state.page,'180');
  emit(first,'pointerdown',pointer);emit(first,'pointerup',pointer);emit(first,'click',{detail:1,pointerId:1});assert.equal(app.FoxPrototype.machine.state.page,'181');
});
test('Touch list gestures keep native scrolling and do not navigate the device',()=>{
  const {doc,app,emit}=openEntry('index.html','?page=180&lang=zh-CN');const list=scrollFixture(doc);
  const pointer={pointerId:2,pointerType:'touch',button:0,isPrimary:true,clientX:100,clientY:200};
  emit(list,'pointerdown',pointer);const moved=emit(list,'pointermove',{...pointer,clientY:100});assert(!moved.defaultPrevented);assert.equal(list.scrollTop,0);
  emit(list,'pointerup',{...pointer,clientY:100});assert.equal(app.FoxPrototype.machine.state.page,'180');
  emit(list,'pointerdown',pointer);emit(list,'pointercancel',pointer);emit(list,'click',{detail:1,pointerId:2});assert.equal(app.FoxPrototype.machine.state.page,'180');
  return{scope:'Event delegation checks; native momentum is not simulated by this DOM test'};
});
test('Scroll offsets survive rerenders, language changes and review history',()=>{
  const {doc,app,click,emit}=openEntry('index.html','?page=180&mode=catalog&lang=zh-CN');
  const list=scrollFixture(doc);list.scrollTop=96;emit(list,'scroll');app.FoxPrototype.render();assert.equal(doc.querySelector('#live-screen [data-scroll-list]'),list);assert.equal(list.scrollTop,96);
  click('[data-locale="en"]');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,96);
  click('#next');click('#previous');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,96);
  const restored=doc.querySelector('#live-screen [data-scroll-list]');restored.scrollTop=48;emit(restored,'scroll');click('#next');click('#previous');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,48);
});
test('Keyboard can scroll lists from top to bottom without changing pages',()=>{
  const {doc,app,emit}=openEntry('index.html','?page=180&lang=zh-CN');const list=scrollFixture(doc,542,275);
  emit(list,'keydown',{key:'ArrowDown'});assert.equal(list.scrollTop,64);emit(list,'keydown',{key:'End'});assert.equal(list.scrollTop,267);emit(list,'keydown',{key:'Home'});assert.equal(list.scrollTop,0);assert.equal(app.FoxPrototype.machine.state.page,'180');
});
test('List CSS enables native vertical scrolling within fixed safe-area bounds',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>[...rules].find(r=>r.selectorText===selector).style;
  const scroll=style('.fox-screen [data-scroll-list]');assert.equal(scroll['overflow-y'],'auto');assert.equal(scroll['scrollbar-width'],'none');assert(scroll['touch-action'].includes('pan-y'));assert.equal(scroll['overscroll-behavior-y'],'contain');
  const list=style('.fox-screen .screen-list');assert.equal(list.bottom,'85px');assert.equal(style('.fox-screen .screen-list.list-with-actions').bottom,'145px');assert.equal(style('.fox-screen.kind-pet.has-items .screen-list').top,'222px');
  const width=parseFloat(list.width),left=parseFloat(list.left),top=parseFloat(list.top),bottom=480-parseFloat(list.bottom);
  for(const x of [left,left+width])for(const y of [top,bottom])assert(Math.hypot(x-240,y-240)<240);
  return{scope:'CSS rule and logical geometry assertions; no browser layout measurement'};
});
test('Gallery shows all current Chinese pages in order without pagination and supports filters',()=>{
  const {doc,domWindow,click}=openEntry('gallery.html');
  assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,pages.length);assert.equal(doc.querySelectorAll('.gallery-group-heading').length,12);
  assert.deepEqual([...doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)')].map(p=>p.id),Array.from(pages,p=>'p'+p.n));
  assert(!doc.querySelector('#gallery-pagination,[data-gallery-step]'));
  assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant) .gallery-screen .device-screen[lang="zh-CN"]').length,pages.length);
  assert(doc.querySelector('#p14 .session-hint').textContent.includes('结束'));
  assert(doc.querySelector('.workbench-header nav a').getAttribute('href').includes('lang=zh-CN'));
  for(const image of doc.querySelectorAll('.gallery-screen img'))assert.equal(image.getAttribute('loading'),image.closest('#p01')?'eager':'lazy');
  for(const group of data.groups){click(`[data-group="${group.id}"]`);assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,group.pages.length);assert.equal(doc.querySelector('.gallery-item:not(.gallery-entry-variant)').id,'p'+group.pages[0].n);}
  click('[data-group="all"]');const search=doc.querySelector('#gallery-search');search.value='p128';search.dispatchEvent(new domWindow.Event('input',{bubbles:true}));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,1);assert.equal(doc.querySelector('.gallery-item:not(.gallery-entry-variant)').id,'p128');
  click('[data-locale="zh-CN"]');assert(doc.querySelector('.gallery-screen').textContent.includes('重新输入'));assert(doc.querySelector('.gallery-caption').getAttribute('href').includes('lang=zh-CN'));
  search.value='二维码已过期';search.dispatchEvent(new domWindow.Event('input',{bubbles:true}));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,0);
  search.value='no-such-page-xyz';search.dispatchEvent(new domWindow.Event('input',{bubbles:true}));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,0);assert(doc.querySelector('#gallery-grid').textContent.includes('没有匹配页面'));
  search.value='';search.dispatchEvent(new domWindow.Event('input',{bubbles:true}));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,pages.length);
  click('[data-locale="en"]');assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant) .gallery-screen .device-screen[lang="en"]').length,pages.length);assert(doc.querySelector('#p14 .session-hint').textContent.includes('End'));
  click('[data-locale="zh-CN"]');assert(doc.querySelector('#p14 .session-hint').textContent.includes('结束'));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,pages.length);
});
test('Deferred character-resource page is not exposed in the current review copy',()=>{
  const {doc,app}=openEntry('gallery.html');
  assert(!doc.getElementById('p131'));
  assert(!doc.querySelector('[data-gallery-page="131"],[data-preview="131"]'));
  assert(!doc.body.textContent.includes('角色资源下载与校验'));
  const direct=openEntry('index.html','?page=131&mode=catalog&lang=zh-CN');
  assert.notEqual(direct.app.FoxPrototype.machine.state.page,'131');
  assert.notEqual(new URL(direct.app.location.href).searchParams.get('page'),'131');
  return{page:'P131',status:'deferred from current review'};
});
test('Today-steps gallery documents the Daily submenu entry',()=>{
  const {doc}=openEntry('gallery.html');
  const entry=doc.querySelector('#p187-steps-daily');
  assert(entry,'Missing Daily submenu preview');
  const link=entry.querySelector('a[href*="index.html?page=187"]');
  assert(link,'Steps entry must open Daily');
  const url=new URL(link.href,'https://prototype.invalid/');
  assert.equal(url.searchParams.get('mode'),'flow');
  assert(entry.querySelector('[data-target="103"]'));
  assert(!entry.querySelector('.fox-list-pager'));
  const live=openEntry('index.html','?page=187&mode=flow&lang=zh-CN');
  assert.equal(live.app.FoxPrototype.machine.state.page,'187');
  assert(live.doc.querySelector('#live-screen [data-target="103"]'));
  assert.deepEqual([...live.doc.querySelectorAll('.list-item-label')].map(el=>el.textContent),['提醒','今日步数']);
  return{entry:'P74 Daily > P187',target:'P103'};
});
test('Chinese deep links retain language in preview, history, and top navigation',()=>{
  const {doc,app,click}=openEntry('index.html','?page=14&mode=catalog&lang=zh-CN');
  assert.equal(doc.querySelector('#live-screen .device-screen').dataset.screenId,'14');assert(doc.querySelector('.session-hint').textContent.includes('结束'));
  click('#next');click('#previous');assert.equal(app.FoxPrototype.view.language,'zh-CN');
  click('[data-locale="en"]');assert.equal(app.FoxPrototype.view.language,'en');assert(doc.querySelector('.session-hint').textContent.includes('End'));assert(doc.querySelector('.workbench-header nav a[href*="gallery.html"]').getAttribute('href').includes('lang=en'));
  const english=openEntry('gallery.html','?lang=en&group=chat');assert.equal(english.doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,data.groups.find(g=>g.id==='chat').pages.length);assert(english.doc.querySelector('#p14').textContent.includes('Listening'));
  const fallback=openEntry('index.html','?page=14&lang=invalid');assert(fallback.doc.querySelector('.session-hint').textContent.includes('结束'));
});
test('Chat End control uses a stable center anchor inside the circular safe area',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const selector='.fox-native .scene[data-scene=chat] .session-hint';
  const style=[...rules].find(r=>r.selectorText===selector).style;
  assert.equal(style.left,'50%');assert.equal(style.transform,'translateX(-50%)');assert.equal(style.width,style['min-width']);
  const active=[...rules].find(r=>r.selectorText===selector+':is(:hover,:focus-visible,:active)').style;assert.equal(active.transform,style.transform);
  const width=parseFloat(style.width),height=parseFloat(style.height),bottom=parseFloat(style.bottom),radius=180;
  assert(height>=44);assert(Math.hypot(width/2,radius-bottom)<radius);
  const {r,s}=fresh();for(const id of ['14','15','16']){r.preview(id);const {document:doc}=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n===id),{...s,language:'zh-CN',still:true}));assert.equal(doc.querySelectorAll('.session-hint[data-event="AI_END"]').length,1);assert.equal(doc.querySelector('.session-hint span').textContent,'结束');}
  return{basis:'CSS rule and logical geometry checks only; not a browser layout measurement',logicalButton:{width,height,bottom,centerX:180},artboardCenterX:240};
});
test('Chat character, state row, and End control occupy separate vertical bands',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>{const rule=[...rules].reverse().find(r=>r.selectorText===selector||r.selectorText?.split(',').map(v=>v.trim()).includes(selector));assert(rule,selector);return rule.style;};
  const character=style('.fox-native .scene[data-scene=chat] .chat-character');
  assert.equal(character.top,'72px');assert.equal(character.left,'98px');assert.equal(character.width,'164px');assert.equal(character.height,'144px');
  const mediaRule=[...rules].reverse().find(r=>r.selectorText?.includes('.fox-native .scene[data-scene=chat] .chat-character img'));assert(mediaRule,'chat media');
  const media=mediaRule.style;
  assert.equal(media.width,'144px');assert.equal(media.height,'144px');
  const state=style('.fox-native .scene[data-scene=chat] .chat-state-below');
  assert.equal(state.top,'232px');assert.equal(state.height,'30px');assert.equal(state['flex-direction'],'row');assert.equal(state.gap,'8px');
  const end=style('.fox-native .scene[data-scene=chat] .session-hint');
  assert.equal(end.bottom,'40px');assert.equal(end.width,'142px');assert.equal(end.height,'50px');
  return{character:'164 x 144',state:'horizontal row at 232px',end:'142 x 50 at bottom 40px'};
});
test('Annotated setup screens show the main device, local networks, and no unwanted helper text',()=>{
  const {r,s}=fresh();r.preview('02');let doc=screenDoc('02',s);assert(doc.querySelector('.fox-qr img'));assert(!doc.querySelector('time,[data-event="QR_REFRESH"]'));assert(!doc.querySelector('.device-screen').textContent.includes('05:00'));
  r.preview('03');doc=screenDoc('03',s);assert(doc.querySelector('.device-screen').textContent.includes('连接主设备？'));assert(!doc.querySelector('.device-screen').textContent.includes('手机'));assert(doc.querySelector('[data-icon="Box"]'));assert(!doc.querySelector('[data-icon="Smartphone"]'));assert.deepEqual([...doc.querySelectorAll('.screen-actions button')].map(b=>b.textContent),['暂不','连接']);
  r.preview('04');doc=screenDoc('04',s);assert(doc.querySelector('.device-screen').textContent.includes('正在连接设备'));assert(doc.querySelector('.device-screen').textContent.includes('请将设备放在附近'));assert(!doc.querySelector('[data-icon="Smartphone"]'));
  r.preview('05');doc=screenDoc('05',s);assert.equal(doc.querySelectorAll('[data-scroll-list] .screen-list-item').length,3);assert(doc.querySelector('[data-event="WIFI_SELECT"]'));assert(!/手机|应用|等待/.test(doc.querySelector('.device-screen').textContent));
  for(const id of ['111','112']){r.preview(id);doc=screenDoc(id,s);assert(!doc.querySelector('.screen-subtitle'),id);assert(!/访客网络|线上服务已就绪/.test(doc.querySelector('.device-screen').textContent),id);}
  assert(!pages.some(p=>p.n==='06'));
});
test('Six language endonyms remain intact, scrollable, and selected without pretending to translate new locales',()=>{
  const {doc,app,click,emit}=openEntry('index.html','?page=178&lang=zh-CN');const expected=['English','简体中文','繁體中文','Deutsch','Français','Español'];
  assert.deepEqual([...doc.querySelectorAll('.fox-language button span')].map(b=>b.textContent),expected);
  let list=scrollFixture(doc,504,228);list.scrollTop=220;emit(list,'scroll');
  for(const value of ['zh-TW','de','fr','es']){click(`#live-screen [data-value="${value}"]`);assert.equal(app.FoxPrototype.machine.state.deviceLanguage,value);assert.equal(app.FoxPrototype.view.language,'zh-CN');assert.equal(doc.querySelectorAll('.fox-language [aria-pressed="true"]').length,1);assert.equal(doc.querySelector('.fox-language [aria-pressed="true"]').dataset.value,value);assert.equal(doc.querySelector('.fox-language').scrollTop,220);}
  assert(doc.querySelector('#page-edge').textContent.includes('整套画面暂不翻译'));assert(!doc.querySelector('.fox-list-pager'));
  click('#live-screen [data-event="LANGUAGE_DONE"]');assert.equal(app.FoxPrototype.machine.state.page,'02');click('#previous');assert.equal(doc.querySelector('.fox-language [aria-pressed="true"]').dataset.value,'es');assert.equal(doc.querySelector('.fox-language').scrollTop,220);
  click('#live-screen [data-value="en"]');assert.equal(app.FoxPrototype.view.language,'en');assert(doc.querySelector('.fox-footer').textContent.includes('Continue'));click('#live-screen [data-value="zh-CN"]');assert.equal(app.FoxPrototype.view.language,'zh-CN');
});
test('On-screen keyboard enters the chosen network, protects raw passwords and does not store them in review history',()=>{
  const {doc,app,click}=openEntry('index.html','?page=05&lang=zh-CN');const s=app.FoxPrototype.machine.state;
  click('#live-screen [data-event="WIFI_SELECT"][data-value="Home"]');assert.equal(s.page,'110');assert.equal(s.ssid,'Home');
  for(const key of 'abcdefgh')click(`#live-screen [data-event="KEY"][data-key="${key}"]`);
  assert.equal(s.password,'abcdefgh');assert(!doc.querySelector('[data-event="WIFI_JOIN"]').disabled);assert(doc.querySelector('.password-display').textContent.includes('•'));
  click('#live-screen [data-event="PASSWORD_VISIBILITY"]');assert.equal(doc.querySelector('.password-display').textContent,'abcdefgh');
  s.password='Password';app.FoxPrototype.render();assert.equal(doc.querySelector('.password-display').textContent,'Password');
  click('#live-screen [data-event="SSID_DETAIL"]');assert.equal(s.page,'174');assert(!s.showPassword);click('#live-screen [data-event="SSID_BACK"]');assert.equal(s.page,'110');assert.equal(s.password,'Password');
  for(const entry of app.FoxPrototype.session.history()){assert.equal(entry.state.password,'');assert.equal(entry.state.showPassword,false);}
  assert(!JSON.stringify(s.logs).includes('abcdefgh'));click('#live-screen [data-event="WIFI_JOIN"]');assert.equal(s.page,'111');click('#live-screen [data-event="WIFI_BACK"]');assert.equal(s.page,'05');assert.equal(s.password,'');
});
test('Recording uses labeled icon-only controls and playback places Delete before Play',()=>{
  const {r,s}=fresh();
  for(const [id,event,label]of [['70','REC_START','录音'],['71','REC_STOP','停止'],['184','REC_RESUME','继续']]){r.preview(id);const doc=screenDoc(id,s),button=doc.querySelector(`.record-disc[data-event="${event}"]`);assert(button.querySelector('svg'));assert.equal(button.textContent,'');assert.equal(button.getAttribute('aria-label'),label);assert.equal(button.getAttribute('title'),label);}
  r.preview('182');const doc=screenDoc('182',s),buttons=[...doc.querySelectorAll('.fox-playback-controls button')];assert.deepEqual(buttons.map(b=>b.dataset.event),['RECORD_DELETE_OPEN','RECORD_PLAY']);assert(buttons.every(b=>b.querySelector('svg')&&b.getAttribute('aria-label')));
  r.preview('183');assert.deepEqual([...screenDoc('183',s).querySelectorAll('.screen-actions button')].map(b=>b.dataset.event),['RECORD_KEEP','RECORD_DELETE']);
});
test('Pet unavailable feedback is kind and returns safely without retrying a blocked action',()=>{
  const {m,r,s}=fresh();r.start('pet');const pet=m.currentPet();
  const cases=[['PET_FEED',{feed:100},'我吃饱啦'],['PET_FEED',{feed:60,feedAt:s.clock+300},'等会儿再吃吧'],['PET_CLEAN',{clean:100},'我已经干净啦'],['PET_CLEAN',{clean:60,cleanAt:s.clock+300},'让我歇一会儿'],['PET_REST',{energy:100,restAt:null},'我精神满满'],['PET_REST',{energy:60,restAt:s.clock+900},'我在休息哦'],['PET_EXPLORE',{restAt:null,exploreAt:s.clock+300},'让我歇一会儿']];
  for(const [reason,state,copy]of cases){Object.assign(pet,state);s.petUnavailableReason=reason;s.page='157';const doc=screenDoc('157',s),button=doc.querySelector('.screen-actions button');assert(doc.querySelector('.device-screen').textContent.includes(copy));assert.equal(button.textContent,'好的');assert(!button.disabled);assert(!doc.querySelector('.device-screen').textContent.includes('再试一次'));const before=JSON.stringify(pet);m.dispatch(button.dataset.event);assert.equal(s.page,'93');assert.equal(JSON.stringify(pet),before);}
  pet.feed=60;pet.feedAt=s.clock;m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:1});s.petUnavailableReason='PET_FEED';s.page='157';const ready=screenDoc('157',s);assert.equal(ready.querySelector('.screen-actions button').dataset.event,'PET_FEED_OPEN');assert.equal(ready.querySelector('.screen-actions button').textContent,'喂食');
});
test('Feeding defaults to no food and App-confirmed stock is consumed exactly once',()=>{
  const {m,r,s}=fresh();r.start('pet');const pet=m.currentPet();
  assert.deepEqual(s.foodInventory,{revision:0,purchasedTotal:0,consumedTotal:0,status:'unsynced',error:null,requestId:null,deadline:null});
  m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'157');assert.equal(s.petUnavailableReason,'FOOD_EMPTY');assert.equal(s.petIntent,null);m.dispatch('PET_FEED');assert.equal(pet.feed,60);assert.equal(s.foodInventory.consumedTotal,0);
  m.dispatch('FOOD_SYNC_REQUEST');const requestId=s.foodInventory.requestId;assert.equal(s.foodInventory.status,'syncing');m.dispatch('FOOD_SYNC_FAILED',{requestId:'old',error:'offline'});assert.equal(s.foodInventory.status,'syncing');
  m.dispatch('FOOD_SYNC_FAILED',{requestId,error:'offline'});assert.equal(s.foodInventory.status,'error');assert.equal(s.foodInventory.error,'offline');assert.equal(s.foodInventory.purchasedTotal,0);
  m.dispatch('FOOD_SYNC_REQUEST');const current=s.foodInventory.requestId;m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,requestId:current,revision:1,purchasedTotal:2});assert.equal(s.page,'94');assert.equal(s.foodInventory.status,'synced');
  const cancelled={...s.petIntent};m.dispatch('BACK');assert.equal(s.page,'93');m.dispatch('PET_FEED',cancelled);assert.equal(s.foodInventory.consumedTotal,0);
  m.dispatch('PET_FEED_OPEN');const valid={...s.petIntent};m.dispatch('PET_FEED',{...valid,actionId:'wrong'});assert.equal(s.foodInventory.consumedTotal,0);m.dispatch('PET_FEED',valid);assert.equal(s.page,'93');assert.equal(s.foodInventory.consumedTotal,1);assert.equal(pet.feed,80);
  m.dispatch('PET_FEED',valid);assert.equal(s.foodInventory.consumedTotal,1);assert.equal(pet.feed,80);m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:2});assert.equal(s.foodInventory.consumedTotal,1);
});
test('Food sync rejects malformed, wrong-device, stale and decreasing cumulative balances',()=>{
  const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:3});
  const valid={deviceId:s.localDeviceId,revision:2,purchasedTotal:4};
  const malformed=[{...valid,deviceId:undefined},{...valid,deviceId:''},{...valid,deviceId:'another-device'},{...valid,deviceId:'__proto__'},{...valid,revision:1},{...valid,revision:0},{...valid,revision:1.5},{...valid,revision:NaN},{...valid,revision:Number.MAX_SAFE_INTEGER+1},{...valid,purchasedTotal:2},{...valid,purchasedTotal:-1},{...valid,purchasedTotal:1.5},{...valid,purchasedTotal:'4'},{...valid,purchasedTotal:Infinity},{...valid,purchasedTotal:Number.MAX_SAFE_INTEGER+1}];
  for(const bad of malformed){const before=JSON.stringify(s.foodInventory);m.dispatch('FOOD_INVENTORY_SYNC',bad);assert.equal(JSON.stringify(s.foodInventory),before,JSON.stringify(bad));}
  m.dispatch('PET_FEED_OPEN');m.dispatch('PET_FEED',{...s.petIntent});assert.equal(s.foodInventory.consumedTotal,1);m.dispatch('FOOD_INVENTORY_SYNC',valid);assert.equal(s.foodInventory.purchasedTotal,4);assert.equal(s.foodInventory.consumedTotal,1);
  m.dispatch('FOOD_SYNC_REQUEST');const first=s.foodInventory.requestId;m.dispatch('FOOD_SYNC_REQUEST');const second=s.foodInventory.requestId;assert.equal(first,second);const before=JSON.stringify(s.foodInventory);m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,requestId:'stale-request',revision:3,purchasedTotal:5});assert.equal(JSON.stringify(s.foodInventory),before);
  m.dispatch('FOOD_SYNC_FAILED',{requestId:second,error:'permission'});assert.equal(s.foodInventory.status,'error');const denied=JSON.stringify(s.foodInventory);m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,requestId:second,revision:3,purchasedTotal:5});assert.equal(JSON.stringify(s.foodInventory),denied);assert.equal(s.foodInventory.purchasedTotal-s.foodInventory.consumedTotal,3);
});
test('An unchanged food balance acknowledges only the matching active sync without restoring consumed food',()=>{
  const {m,r,s}=fresh();r.start('pet');
  m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:2,purchasedTotal:3});m.dispatch('PET_FEED_OPEN');m.dispatch('PET_FEED');
  assert.equal(s.foodInventory.consumedTotal,1);m.dispatch('FOOD_SYNC_REQUEST');const requestId=s.foodInventory.requestId;
  const receipt={deviceId:s.localDeviceId,requestId,revision:2,purchasedTotal:3};
  for(const bad of [{...receipt,requestId:'old'},{...receipt,requestId:undefined},{...receipt,deviceId:'other-device'},{...receipt,revision:1},{...receipt,purchasedTotal:4},{...receipt,purchasedTotal:2}]){
    const before=JSON.stringify(s.foodInventory);m.dispatch('FOOD_INVENTORY_SYNC',bad);assert.equal(JSON.stringify(s.foodInventory),before);
  }
  m.tick(14.9);m.dispatch('FOOD_INVENTORY_SYNC',receipt);
  assert.deepEqual(s.foodInventory,{revision:2,purchasedTotal:3,consumedTotal:1,status:'synced',error:null,requestId:null,deadline:null});
  const balance=JSON.stringify(s.foodInventory);m.dispatch('FOOD_INVENTORY_SYNC',receipt);m.dispatch('FOOD_INVENTORY_SYNC',{...receipt,requestId:undefined});m.tick(1);
  assert.equal(JSON.stringify(s.foodInventory),balance);
});

test('Zero-version empty inventory can finish sync and expired unchanged responses cannot finish a retry',()=>{
  const {m,r,s}=fresh();r.start('pet');m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'157');
  m.dispatch('FOOD_SYNC_REQUEST');const expired=s.foodInventory.requestId;m.tick(15);assert.equal(s.foodInventory.error,'timeout');
  const receipt={deviceId:s.localDeviceId,revision:0,purchasedTotal:0,requestId:expired};
  m.dispatch('FOOD_INVENTORY_SYNC',receipt);assert.equal(s.foodInventory.status,'error');
  m.dispatch('FOOD_SYNC_REQUEST');const retry=s.foodInventory.requestId;assert.notEqual(retry,expired);
  m.dispatch('FOOD_INVENTORY_SYNC',receipt);assert.equal(s.foodInventory.status,'syncing');
  m.dispatch('FOOD_INVENTORY_SYNC',{...receipt,requestId:retry});assert.equal(s.foodInventory.status,'synced');assert.equal(s.foodInventory.error,null);assert.equal(s.page,'157');assert.equal(s.petIntent,null);
  m.tick(15);assert.equal(s.foodInventory.status,'synced');assert.equal(s.foodInventory.purchasedTotal-s.foodInventory.consumedTotal,0);
  const doc=screenDoc('157',s);assert(!doc.querySelector('.device-screen').textContent.includes('失败'));assert(!doc.querySelector('[data-event="FOOD_SYNC_REQUEST"]').disabled);
});

test('Fullness, cooldown, resting, safety and invalidated actions preserve food',()=>{
  for(const patch of [{feed:100},{feedAt:300},{restAt:900}]){
    const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:1});Object.assign(m.currentPet(),patch);m.dispatch('PET_FEED_OPEN');assert.notEqual(s.page,'94');assert.equal(s.foodInventory.consumedTotal,0);assert.equal(s.petUnavailableReason,'PET_FEED');
  }
  for(const interrupt of ['BACK','BATTERY_CRITICAL','THERMAL_LIMIT','REBOOT']){
    const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:1});m.dispatch('PET_FEED_OPEN');const intent={...s.petIntent};m.dispatch(interrupt);const before=m.currentPet().feed;m.dispatch('PET_FEED',intent);assert.equal(s.foodInventory.consumedTotal,0,interrupt);assert.equal(m.currentPet().feed,before,interrupt);
  }
  for(const patch of [{feed:100},{feedAt:300},{restAt:900},{revision:1}]){
    const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:1});m.dispatch('PET_FEED_OPEN');const intent={...s.petIntent};Object.assign(m.currentPet(),patch);m.dispatch('PET_FEED',intent);assert.equal(s.foodInventory.consumedTotal,0,JSON.stringify(patch));
  }
});
test('Food is shared across installed partners without sharing care values or restoring spent stock',()=>{
  const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:2});m.dispatch('PET_FEED_OPEN');const lumiIntent={...s.petIntent};m.dispatch('PET_FEED',lumiIntent);const lumi=m.currentPet();assert.equal(lumi.feed,80);
  m.dispatch('PET_SWITCH_OPEN');m.dispatch('COMPANION_SELECT',{value:'pico'});m.dispatch('COMPANION_COMMIT');assert.equal(s.characterId,'pico');m.dispatch('PET_FEED',lumiIntent);assert.equal(s.foodInventory.consumedTotal,1);m.dispatch('PET_FEED_OPEN');m.dispatch('PET_FEED',{...s.petIntent});assert.equal(s.foodInventory.consumedTotal,2);assert.equal(m.currentPet().feed,80);assert.equal(lumi.feed,80);
  m.dispatch('PET_SWITCH_OPEN');m.dispatch('COMPANION_SELECT',{value:'momo'});m.dispatch('COMPANION_COMMIT');m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'157');assert.equal(s.petUnavailableReason,'FOOD_EMPTY');assert.equal(s.foodInventory.consumedTotal,2);
  m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:2,purchasedTotal:2});assert.equal(s.foodInventory.consumedTotal,2);assert.equal(s.foodInventory.purchasedTotal-s.foodInventory.consumedTotal,0);
});
test('Food sync expires and confirmed stock remains usable offline without reset on reboot',()=>{
  const {m,r,s}=fresh();r.start('pet');m.dispatch('FOOD_SYNC_REQUEST');const stale=s.foodInventory.requestId;assert.equal(s.foodInventory.deadline,s.clock+15);m.tick(14.9);assert.equal(s.foodInventory.status,'syncing');m.tick(.1);assert.equal(s.foodInventory.status,'error');assert.equal(s.foodInventory.error,'timeout');
  m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,requestId:stale,revision:1,purchasedTotal:5});assert.equal(s.foodInventory.purchasedTotal,0);m.dispatch('NAVIGATE',{target:'93'});
  m.dispatch('FOOD_INVENTORY_SYNC',{deviceId:s.localDeviceId,revision:1,purchasedTotal:2});m.dispatch('ENV',{key:'networkConnected',value:false});m.dispatch('FOOD_SYNC_REQUEST');assert.equal(s.foodInventory.status,'error');assert.equal(s.foodInventory.error,'offline');assert.equal(s.foodInventory.purchasedTotal,2);
  m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'94');m.dispatch('PET_FEED',{...s.petIntent});assert.equal(s.foodInventory.consumedTotal,1);const inventory=JSON.stringify(s.foodInventory);m.dispatch('REBOOT');m.tick(2);assert.equal(JSON.stringify(s.foodInventory),inventory);m.dispatch('NAVIGATE',{target:'93'});assert.equal(s.foodInventory.purchasedTotal-s.foodInventory.consumedTotal,1);
});
test('Changed controls use fixed circular-safe geometry and dark-mode contrast',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>[...rules].find(r=>r.selectorText===selector).style;
  const safe=(x,y,width,height)=>{for(const xx of [x,x+width])for(const yy of [y,y+height])assert(Math.hypot(xx-240,yy-240)<240,`${x},${y},${width},${height}`);};
  const language=style('.fox-language'),button=style('.fox-language button');assert.equal(button.height,'74px');assert.equal(button['min-height'],'74px');assert.equal(language.bottom,'132px');safe(100,120,280,228);assert(6*74+5*12>228);
  const playback=style('.fox-playback-controls');assert.equal(playback['flex-direction'],'row');assert.equal(playback.width,'196px');safe(142,324,76,76);safe(262,324,76,76);
  const keyboard=style('.fox-screen.kind-keyboard .keyboard-actions .screen-action');assert.equal(keyboard['min-height'],'60px');safe(245.5,397,70,60);
  const pet=style('.fox-screen[data-screen-id="157"] .pet-content');assert.equal(pet.top,'120px');assert.equal(pet.height,'216px');assert(116+29*1.2+22*1.32+20<216);
  const light=hex=>{const rgb=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  for(const [fg,bg,min]of [['fff8ef','292227',4.5],['ffe3c7','3d2b2b',4.5],['ffafa8','30272d',3]])assert((light(fg)+.05)/(light(bg)+.05)>=min);
  return{scope:'Source geometry and color math only; browser layout and physical touch size remain unverified'};
});
test('Restored radial menu replaces Home with My companion and removes steps',()=>{
  const {r,s}=fresh();r.preview('74');const doc=screenDoc('74',s);
  assert.equal(doc.querySelector('.tile-home').dataset.target,'93');assert.equal(doc.querySelector('.tile-peach:not(.app-tile-chat)').dataset.target,'82');
  assert(doc.querySelector('.tile-home > span:last-child').textContent.includes('我的伙伴'));
  assert.equal(doc.querySelectorAll('.app-tile').length,7);assert.equal(doc.querySelectorAll('[data-scroll-list="apps"]').length,0);
  assert.deepEqual([...doc.querySelectorAll('.tile-pet,.tile-steps')].map(n=>n.dataset.target),['93']);assert(!doc.querySelector('[data-target="103"],[data-target="10"]'));
  s.setupDone=false;assert(!screenDoc('74',s).querySelector('[data-event="SETUP_RESUME"]'));
  assert(!doc.querySelector('.device-screen').textContent.includes('更多'));
});
test('Network selection stays concise and step count explains its source',()=>{
  const {r,s}=fresh();r.preview('05');let doc=screenDoc('05',s);
  assert(!doc.querySelector('.list-item-sub'));assert(!doc.querySelector('.device-screen').textContent.includes('需要密码'));
  r.preview('103');doc=screenDoc('103',s);assert(doc.querySelector('.screen-subtitle').textContent.includes('来自本机计步'));assert(doc.querySelector('.device-screen').textContent.includes('4,820'));
});
test('Due-reminder list shows only tasks without redundant status and has a truthful empty state',()=>{
  const {r,s}=fresh();r.preview('167');const note=Object.values(s.notes)[0];
  s.notes={later:{...note,noteId:'later',noteTitle:'休息一下',noteDueAt:20,noticeStatus:'due'},first:{...note,noteId:'first',noteTitle:'带上雨伞',noteDueAt:10,noticeStatus:'due'},future:{...note,noteId:'future',noticeStatus:'scheduled'},done:{...note,noteId:'done',noticeStatus:'completed'},gone:{...note,noteId:'gone',noticeStatus:'due',noteDeleted:true}};
  let doc=screenDoc('167',s);assert.equal(doc.querySelector('.screen-label').textContent,'待办提醒');assert(!doc.querySelector('.list-heading,.list-item-sub'));
  assert.deepEqual([...doc.querySelectorAll('[data-note-id]')].map(n=>n.dataset.noteId),['first','later']);
  s.notes={};doc=screenDoc('167',s);assert.equal(doc.querySelector('.list-empty span').textContent,'暂无待办提醒');assert(!doc.querySelector('[data-note-id]'));
});
test('Reminder completion and postponement still mutate the selected item only',()=>{
  const {m,r,s}=fresh();r.preview('167');const selected=Object.values(s.notes)[0];
  s.notes.other={...selected,noteId:'other',noteTitle:'休息一下',noticeStatus:'due'};
  m.dispatch('NOTE_OPEN',{noteId:'other'});assert.equal(s.noteId,'other');assert.equal(s.page,'134');m.dispatch('NOTE_ACTIONS');assert.equal(s.page,'68');
  let doc=screenDoc('68',s);assert(!doc.querySelector('.list-item-sub'));assert.equal(doc.querySelector('[data-event="NOTE_DONE"]').textContent,'完成了');
  m.dispatch('NOTE_LATER');assert.equal(s.noticeStatus,'snoozed');doc=screenDoc('133',s);assert(doc.querySelector('.device-screen').textContent.includes('10 分钟后'));
  m.dispatch('NOTE_DISMISS');assert.equal(s.page,'167');assert.equal(s.notes.other.noticeStatus,'snoozed');
  m.dispatch('NOTE_OPEN',{noteId:selected.noteId});m.dispatch('NOTE_DONE');m.dispatch('NOTE_DISMISS');assert.equal(s.page,'167');assert.equal(s.notes[selected.noteId].noticeStatus,'completed');assert.equal(s.notes.other.noticeStatus,'snoozed');
});
test('Mixed messages and reminder details retain distinct statuses',()=>{
  const {r,s}=fresh();r.preview('77');const note=Object.values(s.notes)[0];
  s.notes=Object.fromEntries(['due','scheduled','snoozed','completed'].map((status,i)=>[status,{...note,noteId:status,noticeStatus:status,noteDueAt:i}]));
  const doc=screenDoc('77',s),statuses=[...doc.querySelectorAll('.list-item-sub')].map(n=>n.textContent);
  for(const text of ['待处理','未到时间','稍后','已完成'])assert(statuses.includes(text),text);
  for(const [status,text]of [['due','待处理'],['scheduled','未到时间'],['snoozed','7 分钟后'],['completed','已完成']]){
    const detail=screenDoc('134',{...s,noticeStatus:status,snoozeAt:s.clock+420});assert.equal(detail.querySelector('.screen-subtitle').textContent,text);
  }
});
test('Microphone has no standalone software switch while hardware mute remains effective',()=>{
  const {m,r,s}=fresh();
  for(const locked of [false,true]){
    r.preview('75');s.micLocked=locked;const doc=screenDoc('75',s);
    assert(!doc.querySelector('[data-event="OPEN_MIC"]'));assert(!doc.querySelector('[data-event="MUTE_TOGGLE"]'));
    assert.deepEqual([...doc.querySelectorAll('.list-item-label')].map(n=>n.textContent),['安静模式','音量','亮度','显示','云备份','智能隐私']);
  }
  assert(!data.transitions['75'].some(route=>route.event==='OPEN_MIC'));
  for(const p of pages)assert(![...p.ui.actions,...p.ui.items].some(item=>['OPEN_MIC','MUTE_TOGGLE'].includes(item.event)),p.n);
  r.start('care');m.dispatch('CARE_START');m.dispatch('MUTE_TOGGLE');assert.notEqual(s.page,'27');assert.equal(m.micTask(),'none');assert(!s.careEnabled);
  const muted=screenDoc(s.page,s);assert(!muted.querySelector('[data-event="MUTE_TOGGLE"]'));assert(muted.querySelector('[data-event="BACK"]'));
  m.dispatch('MUTE_TOGGLE');assert(!s.micLocked);assert.equal(m.micTask(),'none');assert(!s.careEnabled);
  const {doc,click}=openEntry('index.html','?page=75&mode=flow&lang=zh-CN');
  assert(!doc.querySelector('#live-screen [data-event="OPEN_MIC"]'));const branches=doc.querySelector('#branches');assert(branches);assert(!/麦克风|Microphone/.test(branches.textContent));
  click('#live-screen [data-event="OPEN_QUIET"]');assert(doc.querySelector('#live-screen [data-screen-id="30"]'));
  click('#live-screen [data-event="BACK"]');assert(doc.querySelector('#live-screen [data-screen-id="75"]'));
});
test('Microphone status page is retired everywhere without removing hardware mute protection',()=>{
  assert.equal(data.pageAliases['27'],'75');assert(!pages.some(p=>p.n==='27'));assert(!data.runtimePages?.['27']);
  assert(!Object.values(data.transitions).flat().some(route=>route.target==='27'));
  const gallery=openEntry('gallery.html','?lang=zh-CN').doc;assert(!gallery.querySelector('[id="p27"],[id^="p27-"],[data-gallery-page="27"],a[href*="page=27&"]'));
  for(const mode of ['flow','catalog']){const legacy=openEntry('index.html','?page=27&mode='+mode+'&lang=zh-CN');assert.equal(legacy.app.FoxPrototype.machine.state.page,'75');assert(!legacy.doc.querySelector('#page-index [data-preview="27"]'));assert.equal(legacy.app.FoxPrototype.machine.micTask(),'none');}
  for(const [source,event] of [['10','AI_START'],['70','REC_START'],['82','CARE_START']]){
    const {m,r,s}=fresh();r.start('daily');m.dispatch('NAVIGATE',{target:source});m.dispatch('MUTE_TOGGLE');assert.equal(s.page,source);
    m.dispatch(event);assert.equal(s.page,source);assert(s.statusMessage);assert.equal(m.micTask(),'none');assert(!s.recording&&!s.aiActive&&!s.careEnabled);
    m.dispatch('MUTE_TOGGLE');assert.equal(s.page,source);assert(!s.recording&&!s.aiActive&&!s.careEnabled);m.tick(2);assert.equal(m.micTask(),'none');
  }
});

test('Hardware mute ends an active conversation and preserves captured recording audio',()=>{
  const ai=fresh();ai.r.start('daily');ai.m.dispatch('AI_START');ai.m.dispatch('AI_INPUT_END');
  const pending={sessionId:ai.s.aiSessionId,requestId:ai.s.aiRequestId};ai.m.dispatch('MUTE_TOGGLE');assert.equal(ai.s.page,'10');assert(!ai.s.aiActive);assert.equal(ai.m.micTask(),'none');
  ai.m.dispatch('MUTE_TOGGLE');ai.m.dispatch('AI_RESPONSE',pending);assert.equal(ai.s.page,'10');assert(!ai.s.aiActive);assert.equal(ai.m.micTask(),'none');
  const rec=fresh();rec.r.start('recording');rec.m.dispatch('REC_START');rec.m.tick(8);rec.m.dispatch('MUTE_TOGGLE');assert(!rec.s.recording);assert.equal(rec.m.micTask(),'none');assert.equal(rec.s.page,'122');
  rec.m.tick(1);assert.equal(rec.s.records.length,1);assert.equal(rec.s.records[0].seconds,8);assert(!rec.s.draft);rec.m.dispatch('MUTE_TOGGLE');assert(!rec.s.recording);assert.equal(rec.m.micTask(),'none');
});

test('General settings has consistent names, separate adjustment entries and no duplicate Wi-Fi',()=>{
  const {r,s}=fresh();s.volume=75;s.brightness=65;
  for(const language of ['zh-CN','en']){
    const expected=language==='zh-CN'?'通用设置':'General settings';
    r.preview('180');const outer=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n==='180'),{...s,language,still:true})).document;
    assert.equal(outer.querySelector('[data-target="75"] .list-item-label').textContent,expected);
    assert(outer.querySelector('[data-event="OPEN_WIFI"]'));
    r.preview('75');const inner=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n==='75'),{...s,language,volume:75,brightness:65,still:true})).document;
    assert.equal(inner.querySelector('.fox-header h2,.screen-label').textContent,expected);
    assert(!inner.querySelector('[data-event="OPEN_WIFI"],[data-event="OPEN_ADJUST"],[data-target="117"]'));
    for(const [id,value] of [['31','75%'],['32','65%']]){
      const row=inner.querySelector(`[data-target="${id}"]`);assert(row,id);assert.equal(row.querySelector('.list-item-sub').textContent,value);assert(row.querySelector('svg'));
    }
    assert(!/快捷控制|Quick controls|声音和亮度/.test(inner.querySelector('.device-screen').textContent));
  }
  assert(!data.transitions['75'].some(route=>route.event==='OPEN_WIFI'||route.target==='117'));
  const gallery=openEntry('gallery.html','?lang=zh-CN').doc;
  assert.equal(gallery.querySelector('#p180 [data-target="75"] .list-item-label').textContent,'通用设置');
  assert(!gallery.querySelector('#p75 [data-event="OPEN_WIFI"]'));
});

test('Volume and brightness use distinct native sliders and save immediately without Done',()=>{
  const {doc,app,click,emit}=openEntry('index.html','?page=180&mode=flow&lang=zh-CN');const s=app.FoxPrototype.machine.state;
  click('#live-screen [data-target="75"]');assert.equal(s.page,'75');
  for(const [id,key,title,min,value,iconName] of [['31','volume','音量',0,75,'Volume2'],['32','brightness','亮度',10,65,'Sun']]){
    const other=key==='volume'?'brightness':'volume',otherValue=s[other];
    click(`#live-screen [data-target="${id}"]`);assert.equal(s.page,id);
    const screen=doc.querySelector('#live-screen .device-screen'),input=screen.querySelector('input[type="range"]');
    assert.equal(screen.querySelectorAll('input[type="range"]').length,1);assert.equal(input.dataset.setting,key);
    assert.equal(input.getAttribute('min'),String(min));assert.equal(input.getAttribute('max'),'100');assert.equal(input.getAttribute('aria-label'),title);
    assert.equal(screen.querySelector('.fox-header h2,.screen-label').textContent,title);
    const expectedIcon=ctx.lucide.createElement(ctx.lucide.icons[iconName]);assert([...screen.querySelectorAll('svg')].some(svg=>svg.innerHTML===expectedIcon.innerHTML),iconName);
    assert(![...screen.querySelectorAll('button')].some(button=>/^(完成|Done)$/.test(button.textContent.trim())));
    input.value=String(value);emit(input,'input');assert.equal(s[key],value);assert.equal(s[other],otherValue);assert.equal(s.page,id);
    assert.equal(screen.querySelector('output').textContent,value+'%');
    click('#live-screen [data-event="BACK"]');assert.equal(s.page,'75');
    assert.equal(doc.querySelector(`#live-screen [data-target="${id}"] .list-item-sub`).textContent,value+'%');
    click(`#live-screen [data-target="${id}"]`);assert.equal(doc.querySelector('#live-screen input[type="range"]').value,String(value));
    click('[data-gesture="right"]');assert.equal(s.page,'75');assert.equal(s[key],value);assert.equal(s[other],otherValue);
  }
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'180');click('#live-screen [data-target="75"]');assert.equal(s.volume,75);assert.equal(s.brightness,65);
  for(const id of ['31','32']){const direct=openEntry('index.html','?page='+id+'&mode=flow&lang=zh-CN');direct.click('#live-screen [data-event="BACK"]');assert.equal(direct.app.FoxPrototype.machine.state.page,'75');}
});

test('Native setting sliders retain keyboard focus and are not replaced during a pointer drag',()=>{
  for(const id of ['31','32']){
    const {doc,app,domWindow,emit,intervals}=openEntry('index.html','?page='+id+'&mode=flow&lang=zh-CN'),s=app.FoxPrototype.machine.state;
    let focused=null;Object.defineProperty(doc,'activeElement',{get:()=>focused,configurable:true});
    const prototype=domWindow.HTMLElement.prototype,originalFocus=prototype.focus;
    prototype.focus=function(){focused=this;};
    try{
      let input=doc.querySelector('#live-screen input[type="range"]');input.focus();
      for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']){const event=emit(input,'keydown',{key});assert(!event.defaultPrevented);assert.equal(s.page,id);}
      input.value='70';emit(input,'input');emit(input,'change');
      input=doc.querySelector('#live-screen input[type="range"]');assert.equal(focused,input);assert.equal(input.value,'70');
      focused=null;app.FoxPrototype.session.toggleTime();assert(app.FoxPrototype.session.info().playing);
      const pointer={pointerId:42,pointerType:'touch',isPrimary:true,button:0,clientX:240,clientY:240};
      emit(input,'pointerdown',pointer);input.value='75';emit(input,'input');
      for(let tick=0;tick<12;tick++)for(const callback of intervals)callback();
      assert.equal(doc.querySelector('#live-screen input[type="range"]'),input);assert.equal(s[input.dataset.setting],75);
      emit(doc,'pointercancel',pointer);assert.equal(s.page,id);
    }finally{prototype.focus=originalFocus;}
  }
  return{scope:'Simulated native focus and timer callbacks; not browser pointer geometry'};
});

test('Independent adjustment bounds remain volume 0-100 and brightness 10-100',()=>{
  const {m,r,s}=fresh();r.start('settings');
  for(const [key,min,id] of [['volume',0,'31'],['brightness',10,'32']]){
    const other=key==='volume'?'brightness':'volume',otherValue=s[other];
    for(const [value,expected] of [[-1,min],[min,min],[50,50],[100,100],[101,100]]){m.dispatch('SETTING',{key,value});assert.equal(s[key],expected);assert.equal(s[other],otherValue);}
    for(const value of [NaN,Infinity,'invalid']){m.dispatch('SETTING',{key,value});assert.equal(s[key],100);}
    for(const [value,fill] of [[min,'0%'],[100,'100%']]){const doc=screenDoc(id,{...s,[key]:value});assert.equal(doc.querySelector('.slider-well').style.getPropertyValue('--level'),fill);}
  }
});

test('Single setting icons, sliders and values occupy separate fixed circular-safe rows',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>{const result={};for(const rule of rules)if(rule.selectorText===selector)for(const name of Array.from(rule.style))result[name]=rule.style[name];return result;};
  const panel=style('.single-setting'),rows=panel['grid-template-rows'].split(' ').map(Number.parseFloat),gap=Number.parseFloat(panel.gap);
  assert.equal(panel.display,'grid');assert.equal(panel.width,'176px');assert.equal(panel.height,'282px');assert.deepEqual(rows,[36,184,38]);assert.equal(gap,12);
  assert.equal(rows.reduce((sum,n)=>sum+n,0)+gap*2,Number.parseFloat(panel.height));assert(Number.parseFloat(panel.top)>110);
  const left=Number.parseFloat(panel.left),top=Number.parseFloat(panel.top),width=Number.parseFloat(panel.width),height=Number.parseFloat(panel.height);
  for(const x of [left,left+width])for(const y of [top,top+height])assert(Math.hypot(x-240,y-240)<240);
  const slider=style('.single-setting .slider-well,.single-setting .slider-well input');assert.equal(slider.width,'104px');assert.equal(slider.height,'184px');
  const output=style('.single-setting output');assert.equal(output['line-height'],'38px');assert.equal(output['min-width'],'120px');assert.equal(output['font-variant-numeric'],'tabular-nums');
  assert(style('.single-setting .slider-well:focus-within').outline);
  return{sourceArtboard:'480 x 480',panel:{left,top,width,height},rows,gap,scope:'Source CSS geometry, not browser pixel measurement'};
});

test('Merged adjustment page is retired from routes and gallery while old links open General settings',()=>{
  assert.equal(data.pageAliases['117'],'75');assert(!pages.some(p=>p.n==='117'));assert(!data.runtimePages?.['117']);
  assert(!Object.values(data.transitions).flat().some(route=>route.target==='117'));
  const gallery=openEntry('gallery.html','?lang=zh-CN').doc;assert(!gallery.querySelector('[id="p117"],[id^="p117-"],[data-gallery-page="117"],a[href*="page=117&"]'));
  const legacy=openEntry('index.html','?page=117&mode=flow&lang=zh-CN');assert.equal(legacy.app.FoxPrototype.machine.state.page,'75');assert(!legacy.doc.querySelector('#page-index [data-preview="117"]'));
  const adjustmentGroup=sandbox.FoxFlow.locations['31'];assert.equal(adjustmentGroup.groupId,'settings');assert.equal(sandbox.FoxFlow.locations['32'].groupId,'settings');
});

test('Companion is an explicit persistent switch with no confirmation or time limit',()=>{
  const {doc,app,click}=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;
  click('#live-screen .tile-peach:not(.app-tile-chat)');assert.equal(s.page,'82');assert.equal(doc.querySelector('[role="switch"]').getAttribute('aria-checked'),'false');assert(!s.careEnabled);assert.equal(m.micTask(),'none');
  click('#live-screen [role="switch"]');assert.equal(s.page,'58');assert(s.careEnabled&&s.careActive);assert.equal(doc.querySelector('[role="switch"]').getAttribute('aria-checked'),'true');assert(!doc.querySelector('.care-timer'));
  s.noteDueAt=10000;for(const n of Object.values(s.notes))n.noticeStatus='completed';m.tick(1801);assert(s.careEnabled&&s.careActive);m.dispatch('CARE_EXPIRE');assert(s.careEnabled);
  click('[data-gesture="right"]');assert.equal(s.page,'74');assert(s.careActive);assert(doc.querySelector('.care-menu-dot'));click('#live-screen .tile-peach:not(.app-tile-chat)');assert.equal(s.page,'58');
  click('#live-screen [role="switch"]');assert.equal(s.page,'82');assert(!s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'none');
  m.dispatch('NAVIGATE',{target:'58'});assert.equal(s.page,'82');assert(!s.careEnabled);assert.equal(m.micTask(),'none');
});
test('Companion pauses for other tasks and sleep without losing the user switch state',()=>{
  const {m,r,s}=fresh();r.start('care');m.dispatch('CARE_START');const original=s.careSessionId;
  m.dispatch('NAVIGATE',{target:'187'});assert(s.careEnabled&&!s.careActive);m.dispatch('NAVIGATE',{target:'74'});assert(s.careActive);assert.notEqual(s.careSessionId,original);
  m.dispatch('NAVIGATE',{target:'187'});m.dispatch('NAVIGATE',{target:'58'});assert.equal(s.page,'58');assert(s.careEnabled&&s.careActive);m.dispatch('BACK');assert.equal(s.page,'187');m.dispatch('NAVIGATE',{target:'74'});
  m.dispatch('REC_START');assert(s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'recording');m.dispatch('REC_STOP');m.tick(1);m.dispatch('REC_RESULT_DONE');assert(s.careEnabled&&s.careActive);
  m.dispatch('AI_START');assert(s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'ai');m.dispatch('AI_END');m.tick(1);assert(s.careActive);
  m.dispatch('SCREEN_OFF');assert(s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'none');m.dispatch('WAKE');assert(s.careEnabled&&s.careActive);
  m.dispatch('REC_START');m.dispatch('CARE_END');assert(!s.careEnabled);assert.equal(m.micTask(),'recording');
});
test('Companion rejects stale callbacks and feedback never listens to its own playback',()=>{
  const {m,r,s}=fresh();r.start('care');m.dispatch('CARE_START');const session=s.careSessionId;
  m.dispatch('CARE_SOUND',{careSessionId:'stale'});assert.equal(s.page,'58');m.dispatch('CARE_EXPLICIT_ANGER',{});assert.equal(s.page,'58');
  m.dispatch('CARE_SOUND',{careSessionId:session});assert.equal(s.page,'59');assert(s.careEnabled&&!s.careActive);const feedback=s.careFeedbackId;
  m.dispatch('CARE_ACCEPT',{feedbackId:feedback});assert.equal(s.page,'60');assert.equal(m.micTask(),'none');const guide=s.careFeedbackId;
  m.dispatch('CARE_FEEDBACK_DONE',{feedbackId:feedback});assert.equal(s.page,'60');m.dispatch('CARE_FEEDBACK_DONE',{feedbackId:guide});assert.equal(s.page,'58');assert(s.careActive);
  m.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});assert.equal(s.page,'58');m.tick(31);m.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});assert.equal(s.page,'59');
  const pending=s.careFeedbackId;m.dispatch('CARE_END');m.dispatch('CARE_FEEDBACK_DONE',{feedbackId:pending});m.dispatch('CARE_EXPLICIT_ANGER',{feedbackId:pending});assert.equal(s.page,'82');assert(!s.careEnabled);
  m.dispatch('CARE_START');m.dispatch('CARE_SOUND',{careSessionId:session});assert.equal(s.page,'58');
});
test('Companion feedback returns to its real source and UI commands retain feedback identity',()=>{
  for(const source of ['10','74','58']){
    const {m,r,s}=fresh();r.start('care');m.dispatch('CARE_START');m.dispatch('NAVIGATE',{target:source});m.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});assert.equal(s.page,'59');m.tick(6);assert.equal(s.page,source);assert(s.careActive);
  }
  const {doc,app,click}=openEntry('index.html','?page=59&mode=flow&lang=zh-CN'),s=app.FoxPrototype.machine.state;
  assert(doc.querySelector('[data-event="CARE_ACCEPT"]').dataset.feedbackId);click('#live-screen [data-event="CARE_ACCEPT"]');assert.equal(s.page,'60');assert(!doc.querySelector('#live-screen [data-event="CARE_CONTINUE"]'));app.FoxPrototype.machine.tick(12);assert.equal(s.page,'58');assert(s.careEnabled);
});
test('Companion off status, microphone indicator and guide Done buttons stay removed',()=>{
  const {r,s}=fresh();
  for(const language of ['zh-CN','en']){
    r.preview('82');let doc=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n==='82'),{...s,language,still:true})).document;
    assert(!doc.querySelector('.care-capture-state'));assert.equal(doc.querySelector('[role="switch"]').getAttribute('aria-checked'),'false');assert(doc.querySelector('.care-consent-note'));
    r.preview('59');doc=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n==='59'),{...s,language,still:true})).document;
    assert(!doc.querySelector('.care-mic-status'));assert(doc.querySelector('[data-event="CARE_ACCEPT"]'));assert(doc.querySelector('[data-event="CARE_QUIET"]'));
    for(const iconName of ['Mic','MicOff']){const icon=ctx.lucide.createElement(ctx.lucide.icons[iconName]);assert(![...doc.querySelectorAll('svg')].some(svg=>svg.innerHTML===icon.innerHTML),iconName);}
    for(const id of ['60','61','62','63','64','65','66']){
      r.preview(id);doc=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n===id),{...s,language,still:true})).document;
      assert(!doc.querySelector('[data-event="CARE_CONTINUE"]'));assert(![...doc.querySelectorAll('button')].some(button=>/^(完成|Done)$/.test(button.textContent.trim())),id);
      assert(doc.querySelector('[data-event="BACK"]'),id);assert(data.transitions[id].some(route=>route.event==='CARE_FEEDBACK_DONE'),id);
    }
  }
});

test('Every soothing guide completes automatically or returns early without ending companionship',()=>{
  const events={'60':'CARE_ACCEPT','61':'CARE_HIGH_VOLUME','62':'CARE_EXPLICIT_ANGER','63':'CARE_EXPLICIT_DISAPPOINTMENT','64':'CARE_EXPLICIT_CONFLICT','65':'CARE_EXPLICIT_BEDTIME','66':'CARE_NEED_HELP'};
  for(const [id,event] of Object.entries(events))for(const exit of ['automatic','back']){
    const {m,r,s}=fresh();r.start('care');s.standbyTimeout=300;m.dispatch('CARE_START');const origin=Number(id)%2?'74':'10';m.dispatch('NAVIGATE',{target:origin});
    m.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});m.dispatch(event,{feedbackId:s.careFeedbackId});assert.equal(s.page,id);assert(s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'none');
    const feedbackId=s.careFeedbackId;m.dispatch('CARE_FEEDBACK_DONE',{feedbackId:'stale'});assert.equal(s.page,id);
    if(exit==='automatic'){m.tick(11.9);assert.equal(s.page,id);m.tick(.1);}else m.dispatch('BACK');
    assert.equal(s.page,origin);assert(s.careEnabled&&s.careActive);assert.equal(m.micTask(),'care');
    m.dispatch('CARE_FEEDBACK_DONE',{feedbackId});assert.equal(s.page,origin);
    m.tick(31);m.dispatch('CARE_SOUND',{careSessionId:s.careSessionId});assert.equal(s.page,'59');m.dispatch('CARE_FEEDBACK_DONE',{feedbackId});assert.equal(s.page,'59');
    const cancelled=s.careFeedbackId;m.dispatch('CARE_END');m.dispatch('CARE_FEEDBACK_DONE',{feedbackId:cancelled});assert.equal(s.page,'82');assert(!s.careEnabled);
  }
});

test('Hardware mute and safety turn companionship off without silently re-enabling it',()=>{
  for(const event of ['MUTE_TOGGLE','POWER_OFF','REBOOT','THERMAL_LIMIT','BATTERY_CRITICAL']){
    const {m,r,s}=fresh();r.start('care');m.dispatch('CARE_START');const sid=s.careSessionId;m.dispatch(event);assert(!s.careEnabled&&!s.careActive);assert.equal(m.micTask(),'none');m.dispatch('CARE_SOUND',{careSessionId:sid});assert(!s.careEnabled);
    if(event==='MUTE_TOGGLE'){m.dispatch('MUTE_TOGGLE');assert(!s.careEnabled);m.dispatch('WAKE');assert(!s.careEnabled);}
  }
  const {m,r,s}=fresh();r.start('care');m.dispatch('MUTE_TOGGLE');m.dispatch('CARE_START');assert(!s.careEnabled);assert.equal(m.micTask(),'none');
});
test('Continuous companionship does not suppress reminders or level updates',()=>{
  const {m,r,s}=fresh();r.start('care');m.dispatch('CARE_START');m.dispatch('NAVIGATE',{target:'10'});m.dispatch('NOTE_DUE');assert(['68','167'].includes(s.page));assert(s.careEnabled);
  m.dispatch('NAVIGATE',{target:'10'});m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:2});assert.equal(s.page,'18');assert(s.careEnabled&&!s.careActive);m.dispatch('BACK');assert.equal(s.page,'10');assert(s.careActive);
});
test('Companion switch and listening status use fixed circular-safe geometry',()=>{
  const {r,s}=fresh();r.preview('58');
  for(const state of [{...s,careActive:false},{...s,micLocked:true}]){const status=screenDoc('58',state).querySelector('.care-capture-state');assert.equal(status.textContent,'暂停聆听');}
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>[...rules].find(rule=>rule.selectorText===selector).style;
  const box=style('.care-switch-content');assert.equal(box.height,'236px');assert(112+236<366);assert(128+25*1.2+18*1.3+15*1.3+8*3<=236);
  const toggle=style('.care-toggle');assert.equal(toggle.width,'76px');assert.equal(toggle.height,'48px');
  for(const rect of [[90,112,300,236],[108,366,264,54]])for(const dx of [0,rect[2]])for(const dy of [0,rect[3]])assert(Math.hypot(rect[0]+dx-240,rect[1]+dy-240)<240);
  for(const id of ['58','59','82']){r.preview(id);const doc=screenDoc(id,s);assert(!doc.querySelector('.care-timer'));assert(!/30 分钟|麦克风开启|已停止收音/.test(doc.querySelector('.device-screen').textContent));}
  const english=style('.fox-screen[lang=en] .fox-record-state');assert(parseFloat(english.top)+parseFloat(english['font-size'])*parseFloat(english['line-height'])*2<170);
  return{scope:'Source geometry only; actual font wrapping and physical hit areas need browser/device validation'};
});
test('AI status is warm but does not imply continued capture or thinking after a timeout',()=>{
  const {r,s}=fresh();
  for(const [id,text,privacy]of [['14','我在听','麦克风开启'],['15','让我想想','收音已暂停'],['16','说给你听','收音已暂停']]){
    r.preview(id);const doc=screenDoc(id,s);assert.equal(doc.querySelector('.session-state').textContent,text);assert.equal(doc.querySelector('.privacy-pill').textContent,privacy);
  }
  r.preview('43');const timeout=screenDoc('43',s);assert(timeout.querySelector('.screen-title').textContent.includes('这次没能回答'));assert(!timeout.querySelector('.device-screen').textContent.includes('还在思考'));
  for(const name of ['Lumi','Pico','Momo'])assert.equal(screenDoc('07',{...s,characterName:name}).querySelector('.screen-title').textContent,'你好，我是 '+name);
});
test('Warm wording retains deletion, expiry, upload and real-world support information',()=>{
  const {r,s}=fresh();for(const id of ['177','183']){r.preview(id);assert.equal(screenDoc(id,s).querySelector('.screen-subtitle').textContent,'删除后无法恢复');}
  r.preview('73');for(const [seconds,label]of [[86400,'24 小时'],[10800,'3 小时'],[3600,'1 小时'],[180,'3 分钟'],[60,'1 分钟']]){
    const doc=screenDoc('73',{...s,currentRecording:{...s.currentRecording,expiresAt:s.clock+seconds}});assert.equal(doc.querySelector('.screen-subtitle').textContent,'还剩 '+label+'可保存');
  }
  r.preview('168');assert(screenDoc('168',s).querySelector('.screen-subtitle').textContent.includes('24 小时，已自动删除'));
  r.preview('28');assert(screenDoc('28',s).querySelector('.screen-subtitle').textContent.includes('你的声音会发送到在线服务'));
  r.preview('66');assert.equal(screenDoc('66',s).querySelector('.screen-title').textContent,'找信任的大人聊聊');
  r.preview('123');s.records.at(-1).status='synced';assert.equal(screenDoc('123',s).querySelector('.screen-subtitle').textContent,'设备和应用均已保存');
});
test('New Chinese prompts stay concise and risk controls keep explicit accessible names',()=>{
  const {r,s}=fresh();
  for(const id of ['17','18','41','43','44','58','59','60','61','62','63','64','65','66','76','82','123','133']){
    r.preview(id);const title=screenDoc(id,s).querySelector('.screen-title');if(title)assert([...title.textContent].length<=11,id+' '+title.textContent);
  }
  for(const id of ['58','59','60','82']){r.preview(id);for(const button of screenDoc(id,s).querySelectorAll('.screen-actions button'))assert([...button.textContent].length<=4,id+' '+button.textContent);}
  r.preview('183');const buttons=[...screenDoc('183',s).querySelectorAll('.screen-actions button')];assert.deepEqual(buttons.map(b=>b.getAttribute('aria-label')),['保留','删除']);
});
test('Warm copy remains covered by a complete rendered comparison with the device-pairing version',()=>{
  const oldData=JSON.parse(fs.readFileSync(path.join(baselineDirectory,'project-data.json'),'utf8'));
  const {document:oldDocument}=parseHTML('<!doctype html><html><body></body></html>');
  const oldContext={document:oldDocument,console,NodeFilter,Node:{TEXT_NODE:3},LG01_DATA:oldData};oldContext.window=oldContext;vm.createContext(oldContext);
  for(const script of ['fox-data.js','lucide.min.js','screen-renderer.js','locale-cn.js','fox-templates.js','fox-renderer.js'])vm.runInContext(fs.readFileSync(path.join(baselineDirectory,script),'utf8'),oldContext);
  const oldMachine=require(path.join(baselineDirectory,'state-machine.js')).createMachine(oldData),oldReview=require(path.join(baselineDirectory,'review-controller.js')).createSession(oldData,oldMachine);
  const oldPages=Object.fromEntries(oldData.groups.flatMap(g=>g.pages).map(p=>[p.n,p]));
  const {r,s}=fresh(),changes=[],rows=[['模块','页码','页面','变更','原画面文字','优化后画面文字','原按钮名称','优化后按钮名称']];
  function content(markup){const {document:doc}=parseHTML(markup),root=doc.querySelector('.device-screen'),walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement?.closest('[aria-hidden="true"]')&&n.textContent.trim())texts.push(n.textContent.trim());}return{text:texts.join(' / '),controls:[...root.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent).join(' / ')};}
  for(const group of data.groups)for(const p of group.pages){
    r.preview(p.n);const existed=!!oldPages[p.n];if(existed)oldReview.preview(p.n);
    const before=existed?content(oldContext.FoxScreen.render(oldPages[p.n],{...oldMachine.state,language:'zh-CN',still:true})):{text:'',controls:''},after=content(ctx.FoxScreen.render(p,{...s,language:'zh-CN',still:true}));
    const changed=JSON.stringify(before)!==JSON.stringify(after);if(changed)changes.push(p.n);
    rows.push([group.title,'P'+p.n,p.title,!existed?'新增':changed?'已优化':'保持',before.text,after.text,before.controls,after.controls]);
  }
  fs.writeFileSync(path.join(__dirname,'copy-before-after.csv'),'\uFEFF'+rows.map(row=>row.map(value=>'"'+value.replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n');
  const summary={total:pages.length,changed:changes.length,pages:changes,scope:'Rendered catalog fixtures, not exhaustive dynamic user content or a browser screenshot'};
  fs.writeFileSync(path.join(__dirname,'copy-review.json'),JSON.stringify(summary,null,2));assert(changes.length>=40);assert(changes.includes('82')&&changes.includes('74')&&changes.includes('167'));return summary;
});
test('Task order has one owner per page and separates task stages from recovery states',()=>{
  assert.deepEqual(Array.from(data.groups,g=>g.id),['setup','daily','chat','pet','care','voice','reminders','friends','settings','wifi','memories','system']);
  const ids=data.groups.flatMap(g=>g.sections.flatMap(section=>section.pages.map(p=>p.n)));assert.equal(ids.length,pages.length);assert.equal(new Set(ids).size,pages.length);assert.equal(JSON.stringify(ids),JSON.stringify(pages.map(p=>p.n)));
  const location=sandbox.FoxFlow.locations;assert.equal(location['103'].groupId,'reminders');assert.equal(location['187'].groupId,'reminders');assert(!location['166']);assert(!location['113']);assert(!location['120']);assert(data.runtimePages?.['120']);
  for(const id of ['21','22','78'])assert.equal(location[id].groupId,'wifi');
  assert.deepEqual(Array.from(data.groups.find(g=>g.id==='voice').sections[0].pages,p=>p.n),['70','71','122','123']);
  for(const id of ['73','158','168'])assert.equal(location[id].kind,'recovery');
  for(const group of data.groups)for(const section of group.sections)for(const link of section.links)assert(pages.some(p=>p.n===link.n),section.id+' -> '+link.n);
  return{pages:ids.length,groups:data.groups.length,stages:sandbox.FoxFlow.sectionCount};
});
test('Numbered primary paths have actual consecutive transitions',()=>{
  const runtimeEdges=new Set(['124:182','176:56']);let edges=0;
  for(const group of data.groups)for(const section of group.sections.filter(section=>section.kind==='path')){
    for(let i=1;i<section.pages.length;i++){
      const from=section.pages[i-1].n,to=section.pages[i].n;
      assert(data.transitions[from].some(route=>route.target===to)||runtimeEdges.has(from+':'+to),section.id+' '+from+' -> '+to);edges++;
    }
  }
  const {m,r,s}=fresh();r.preview('124');const recording=screenDoc('124',s).querySelector('[data-event="RECORD_OPEN"]');assert(recording);m.dispatch('RECORD_OPEN',{recordId:recording.dataset.recordId});assert.equal(s.page,'182');
  r.preview('176');const request=s.requests[s.requestId];m.dispatch('FRIEND_REMOTE_ACCEPT',{requestId:request.id,revision:request.revision});assert.equal(s.page,'56');
  return{primaryPathEdges:edges,runtimeEdges:[...runtimeEdges]};
});
test('Gallery hierarchy shows each stage and does not number alternative or recovery states as required steps',()=>{
  const {doc}=openEntry('gallery.html');assert.equal(doc.querySelectorAll('.gallery-module').length,12);assert.equal(doc.querySelectorAll('.gallery-flow').length,sandbox.FoxFlow.sectionCount);
  assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant) .gallery-caption h4').length,pages.length);assert.equal(doc.querySelectorAll('.gallery-flow-heading h3').length,sandbox.FoxFlow.sectionCount);
  assert(!doc.querySelector('.gallery-item>p'));assert(!doc.querySelector('.kind-recovery .flow-step,.kind-branch .flow-step,.kind-states .flow-step'));
  for(const group of data.groups)for(const section of group.sections){const root=doc.getElementById('flow-'+section.id);assert.equal(root.querySelector('.flow-kind').textContent,sandbox.FoxFlow.kinds[section.kind].label);assert.equal(root.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,section.pages.length);}
  for(const link of doc.querySelectorAll('.flow-link')){assert(doc.getElementById('p'+link.dataset.galleryPage));assert.equal(new URL(link.href,'https://prototype.invalid/').hash,'#p'+link.dataset.galleryPage);}
  for(const link of doc.querySelectorAll('.gallery-artboard>a,.gallery-caption'))assert.equal(new URL(link.href,'https://prototype.invalid/').searchParams.get('mode'),'flow');
});
test('Shared-page links reveal destinations outside current filters and preserve language',()=>{
  const {doc,app,click}=openEntry('gallery.html','?group=wifi&lang=en');assert(!doc.getElementById('p110'));assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,11);
  click('[data-gallery-page="110"]');assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,11);assert(doc.getElementById('p110-shared-wifi-change'));assert.equal(new URL(app.location.href).searchParams.get('group'),'wifi');assert.equal(new URL(app.location.href).searchParams.get('lang'),'en');
  click('[data-gallery-page="180"]');assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,pages.length);assert.equal(app.location.hash,'#p180');assert(!new URL(app.location.href).searchParams.has('group'));
  click('[data-group="care"]');assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,10);assert.equal(app.location.hash,'');
  click('[data-gallery-page="58"]');assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,10);assert.equal(new URL(app.location.href).searchParams.get('group'),'care');assert.equal(app.location.hash,'#p58');
});
test('Deep anchors override conflicting search filters without losing the requested page',()=>{
  const {doc,app}=openEntry('gallery.html','?group=wifi&q=p127&lang=zh-CN#p110');
  assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,pages.length);assert.equal(doc.querySelector('#gallery-search').value,'');assert.equal(app.location.hash,'#p110');assert(!new URL(app.location.href).searchParams.has('q'));
  const invalid=openEntry('gallery.html','?group=wifi#p999');assert.equal(invalid.doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,11);assert.equal(invalid.app.location.hash,'');
});
test('Gallery opens real interactions while the page index and catalog follow the same task order',()=>{
  const gallery=openEntry('gallery.html','?group=voice'),link=gallery.doc.querySelector('#p70 .gallery-caption').getAttribute('href');
  const flowEntry=openEntry('index.html',new URL(link,'https://prototype.invalid/').search);assert.equal(flowEntry.app.FoxPrototype.session.info().mode,'flow');assert.equal(flowEntry.app.FoxPrototype.machine.state.page,'70');flowEntry.click('#next');assert.equal(flowEntry.app.FoxPrototype.machine.state.page,'71');
  const {doc,app,click}=openEntry('index.html','?page=112&mode=catalog');
  assert.equal(doc.querySelector('#next span').textContent,'下一画面');assert(doc.querySelector('#review-context').textContent.includes('在圆屏连接加密网络'));
  assert.deepEqual([...doc.querySelectorAll('#page-index [data-preview]')].map(a=>a.dataset.preview),Array.from(pages,p=>p.n));
  click('#next');assert.equal(app.FoxPrototype.machine.state.page,'186');assert(doc.querySelector('#review-context').textContent.includes('选择伙伴与首次问候'));click('#previous');assert.equal(app.FoxPrototype.machine.state.page,'112');
  click('[data-mode="flow"]');click('[data-preview="73"]');assert.equal(app.FoxPrototype.session.info().mode,'catalog');assert(doc.querySelector('#review-context').textContent.includes('异常恢复'));
});
test('Unrelated product routes, copy, original templates and hardware input recognition stay unchanged',()=>{
  const oldData=JSON.parse(fs.readFileSync(path.join(flowDirectory,'project-data.json'),'utf8')),old={LG01_DATA:oldData};vm.runInNewContext(fs.readFileSync(path.join(flowDirectory,'fox-data.js'),'utf8'),old);
  const related=new Set(['02','04','05','10','11','12','13','14','17','18','22','27','31','32','37','42','54','55','56','58','59','60','61','62','63','64','65','66','70','72','74','75','76','77','81','82','87','93','94','103','107','109','112','114','115','117','123','124','127','128','137','142','144','157','160','161','165','174','176','180','185','186','187','188','189','190']);let unchanged=0;
  const handoffScope=['51','52','53','102','146','147','148'];handoffScope.forEach(id=>related.add(id));related.add('191');
  const dockScope=['23','24','25','26','33','34','45','46','47'];dockScope.forEach(id=>related.add(id));
  for(const p of pages){if(related.has(p.n))continue;const prior=old.FoxPages[p.n];assert(prior,'Unexpected new page '+p.n);const referencesRetired=[...prior.ui.actions,...prior.ui.items,...oldData.transitions[p.n]].some(i=>data.pageAliases[i.target]||i.event==='OPEN_WIFI'||i.event==='WIFI_CANCEL');if(referencesRetired)continue;
    assert.equal(JSON.stringify(p),JSON.stringify(prior),p.n);assert.equal(JSON.stringify(data.transitions[p.n]),JSON.stringify(oldData.transitions[p.n]),p.n+' routes');unchanged++;
  }
  for(const file of ['fox-templates.js','input-recognizer.js','styles-fox.css','menu-icons.css','friends-menu.css'])assert.deepEqual(fs.readFileSync(path.join(__dirname,file)),fs.readFileSync(path.join(flowDirectory,file)),file);
  assert(unchanged>=92-handoffScope.length-dockScope.length);return{unchangedPages:unchanged,handoffScope,dockScope};
});
test('Responsive task bands keep one column on small screens and never place sections in decorative cards',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=(selector,width)=>{const value={};for(const rule of rules){if(rule.selectorText===selector)for(const name of Array.from(rule.style))value[name]=rule.style[name];if(rule.cssRules&&/max-width:(\d+)px/.test(rule.conditionText||rule.media?.mediaText||'')){const max=Number((rule.conditionText||rule.media.mediaText).match(/max-width:(\d+)px/)[1]);if(width<=max)for(const nested of rule.cssRules)if(nested.selectorText===selector)for(const name of Array.from(nested.style))value[name]=nested.style[name];}}return value;};
  const measurements=[];
  for(const width of [320,375,600,768,900,1024,1200,1440]){
    const grid=style('.flow-screens',width),columns=width<=600?1:width<=900?2:width<=1200?3:4;
    assert.equal(grid['grid-template-columns'],columns===1?'minmax(0,1fr)':`repeat(${columns},minmax(0,1fr))`);
    const available=Math.min(1440,width)-(width<=760?32:64),gap=width<=760?18:26,card=Math.min(320,(available-gap*(columns-1))/columns);assert(card>=260&&card<=available);
    measurements.push({width,columns,card});
  }
  for(const selector of ['.gallery-module','.gallery-flow']){const rule=style(selector,1440);assert(!rule.background&&!rule['box-shadow']&&!rule['border-radius']);}
  assert.equal(style('.gallery-grid',375).display,'block');assert.equal(style('.flow-link',375)['min-height'],'44px');assert.equal(style('.gallery-artboard',375)['aspect-ratio'],'1');
  return{scope:'CSS and geometry only, not browser or physical-device verification',measurements};
});
test('Retired page links open their replacements without exposing duplicate gallery pages',()=>{
  const {doc}=openEntry('gallery.html');
  for(const [oldId,newId]of Object.entries(data.pageAliases)){
    assert(!doc.getElementById('p'+oldId));
    const entry=openEntry('index.html','?page='+oldId+'&lang=zh-CN');const target=oldId==='119'?'79':newId;assert.equal(entry.app.FoxPrototype.machine.state.page,target);assert.equal(new URL(entry.app.location.href).searchParams.get('page'),target);
    const anchorTarget=oldId==='119'?'79':newId;const anchored=openEntry('gallery.html','?group=care#p'+oldId);assert.equal(anchored.app.location.hash,'#p'+anchorTarget);assert(anchored.doc.getElementById('p'+anchorTarget));
  }
});
test('Original menu destinations are restored and each primary button opens the expected flow',()=>{
  const destinations=[['.tile-home','93'],['.tile-settings','180'],['.tile-mint','70'],['.tile-peach:not(.app-tile-chat)','82'],['.tile-lavender','187'],['.app-tile-chat','14'],['.tile-friends','185']];
  for(const [selector,target]of destinations){const {doc,app,click}=openEntry('index.html','?page=74&mode=flow');click('#live-screen '+selector);assert.equal(app.FoxPrototype.machine.state.page,target,selector);assert(!doc.querySelector('#live-screen [data-target="108"],#live-screen [data-target="116"]'));}
  const {doc,app,click}=openEntry('index.html','?page=74&mode=flow');const s=app.FoxPrototype.machine.state;
  assert(!doc.querySelector('[data-scroll-list="apps"]'));click('#live-screen [data-target="93"]');assert.equal(s.page,'93');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');
  assert(!doc.querySelector('#live-screen [data-target="103"]'));click('[data-gesture="right"]');assert.equal(s.page,'10');assert(!doc.querySelector('#live-screen .home-steps'));
  click('#live-screen .dock-menu');assert.equal(s.page,'74');click('#live-screen .tile-home');assert.equal(s.page,'93');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');
});
test('Specified flow pages hide visible Back controls while preserving business exits',()=>{
  const ids=['74','178','02','111','112','05','186'];
  const {r,s}=fresh();
  for(const id of ids){
    r.preview(id);const doc=screenDoc(id,s);
    assert(!doc.querySelector('.fox-back,.screen-header-back'),id+' has a visible Back control');
    assert(![...doc.querySelectorAll('button')].some(button=>button.getAttribute('aria-label')==='Back'),id+' exposes Back label');
  }
  r.preview('74');assert(screenDoc('74',s).querySelector('[data-target="93"]'));assert(!screenDoc('74',s).querySelector('[data-target="10"]'));
  r.preview('178');assert(screenDoc('178',s).querySelector('[data-event="LANGUAGE_DONE"]'));
  r.preview('02');assert(screenDoc('02',s).querySelector('.fox-qr img'));
  r.preview('111');assert(screenDoc('111',s).querySelector('[data-event="WIFI_BACK"]'));
  r.preview('112');assert(screenDoc('112',s).querySelector('[data-event="WIFI_CONTINUE"]'));
  r.preview('05');assert(!screenDoc('05',s).querySelector('[data-event="SETUP_DEFAULT"]'));
  r.preview('186');assert(screenDoc('186',s).querySelector('[data-event="COMPANION_COMMIT"]'));
  return{pages:ids,systemBack:'state-machine BACK and right-swipe paths remain enabled'};
});
test('Merged Wi-Fi screen keeps power confirmation, off state and the Settings overview return path',()=>{
  for(const origin of ['180']){
    const {doc,app,click}=openEntry('index.html','?page='+origin+'&mode=flow');const s=app.FoxPrototype.machine.state,m=app.FoxPrototype.machine;
    click('#live-screen [data-event="OPEN_WIFI"]');assert.equal(s.page,'126');assert.equal(s.wifiOrigin,origin);m.tick(1);app.FoxPrototype.render();assert.equal(s.page,'109');
    assert.equal(doc.querySelector('.fox-readonly .list-item-sub').textContent,'已连接');assert(doc.querySelector('[data-event="WIFI_SCAN"]'));
    click('#live-screen [data-event="WIFI_OFF_CONFIRM"]');assert.equal(s.page,'114');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'109');assert(s.wifiEnabled&&s.networkConnected);
    click('#live-screen [data-event="WIFI_OFF_CONFIRM"]');click('#live-screen [data-event="WIFI_OFF"]');assert.equal(s.page,'115');assert(!s.wifiEnabled&&!s.networkConnected);
    click('#live-screen [data-event="BACK"]');assert.equal(s.page,origin);click('#live-screen [data-event="OPEN_WIFI"]');assert.equal(s.page,'115');assert(!s.wifiScanId);
    click('#live-screen [data-event="WIFI_ON"]');assert.equal(s.page,'126');assert(s.wifiEnabled);m.tick(1);app.FoxPrototype.render();assert.equal(s.page,'109');click('#live-screen [data-event="BACK"]');assert.equal(s.page,origin);assert(s.wifiEnabled&&!s.networkConnected);
  }
});
test('First network list has no search control and password failure offers Re-enter',()=>{
  const {doc,app,click}=openEntry('index.html','?page=05&mode=flow');assert(!doc.querySelector('#live-screen [data-event="WIFI_SCAN"]'));assert(!doc.querySelector('#live-screen [data-event="SETUP_DEFAULT"]'));
  click('#live-screen [data-event="WIFI_SELECT"][data-value="Home"]');const s=app.FoxPrototype.machine.state,m=app.FoxPrototype.machine;typePassword(m);m.dispatch('WIFI_JOIN');m.dispatch('WIFI_AUTH_ERROR',{connectionId:s.connectionId});app.FoxPrototype.render();assert.equal(s.page,'128');
  const button=doc.querySelector('#live-screen [data-event="WIFI_EDIT"]');assert.equal(button.textContent,'重新输入');assert.equal(button.getAttribute('aria-label'),'重新输入');click('#live-screen [data-event="WIFI_EDIT"]');assert.equal(s.page,'110');assert.equal(s.password,'');assert.equal(s.ssid,'Home');
});
test('Network-name detail explains its purpose, wraps raw names and preserves masked input on return',()=>{
  const {doc,app,click}=openEntry('index.html','?page=110&mode=flow');const s=app.FoxPrototype.machine.state,m=app.FoxPrototype.machine;
  for(const ssid of ['A'.repeat(32),'Family-Living-Room-WiFi-2026-5G','家里的无线网络']){
    s.ssid=ssid;s.password='';typePassword(m,'Secret123');s.showPassword=true;app.FoxPrototype.render();click('#live-screen [data-event="SSID_DETAIL"]');assert.equal(s.page,'174');
    assert.equal(doc.querySelector('.screen-label').textContent,'网络名称');assert.equal(doc.querySelector('.screen-title').textContent,ssid);assert.equal(doc.querySelector('.screen-title').getAttribute('translate'),'no');assert.equal(doc.querySelector('.screen-subtitle').textContent,'当前所选网络');assert(doc.querySelector('[data-scroll-list="network-name"]'));assert(!s.showPassword);
    click('#live-screen [data-event="SSID_BACK"]');assert.equal(s.page,'110');assert.equal(s.password,'Secret123');assert(!s.showPassword);
  }
  const {r,s:sample}=fresh();r.preview('174');assert(sample.ssid.length>20);
});
test('Response images share exact geometry and gallery artboards use a single aspect ratio',()=>{
  const {r,s}=fresh(),sources=[];
  for(const id of ['11','12','13']){r.preview(id);const doc=screenDoc(id,s);assert(doc.querySelector('.device-screen.response-screen.kind-character'));sources.push(doc.querySelector('.character-stage .lumi-figure').getAttribute('src'));}
  assert.equal(new Set(sources).size,1);
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>Array.from(rules).find(r=>r.selectorText===selector).style;
  const stage=style('.device-screen.fox-screen.response-screen.kind-character .character-stage'),figure=style('.device-screen.fox-screen.response-screen.kind-character .character-stage .lumi-figure');
  assert.equal(stage.width,'216px');assert.equal(stage.height,'200px');assert.equal(figure.width,'200px');assert.equal(figure.height,'200px');assert.equal(figure['object-fit'],'contain');
  const caption=style('.device-screen.fox-screen.response-screen.kind-character .character-caption');assert(Number.parseFloat(stage.top)+200<Number.parseFloat(caption.top));
  for(const x of [132,348])for(const y of [112,312])assert(Math.hypot(x-240,y-240)<240);
  const name=style('.fox-screen .fox-network-name .screen-title');assert.equal(name['overflow-wrap'],'anywhere');assert.equal(name['word-break'],'break-all');
  const gallery=openEntry('gallery.html').doc;assert.equal(gallery.querySelectorAll('.gallery-item:not(.gallery-entry-variant) .gallery-artboard').length,pages.length);assert.equal(style('.gallery-artboard')['aspect-ratio'],'1');
  return{imageSize:'200 x 200 logical artboard units',scope:'Source geometry only, no browser pixel or physical-device measurement'};
});
test('Daily menu has no More, setup, saved-recording or friend-update entry in any setup state',()=>{
  const {r,s}=fresh();r.preview('74');
  for(const language of ['zh-CN','en'])for(const setupDone of [true,false]){
    const {document:doc}=parseHTML(ctx.FoxScreen.render(pages.find(p=>p.n==='74'),{...s,language,setupDone,still:true}));
    assert(!doc.querySelector('[data-target="124"],[data-target="165"],[data-event="SETUP_RESUME"],.list-heading'));
    assert(!/更多|继续设置|已存录音|好友动态|More|Continue setup|Saved notes|Friend updates/.test(doc.querySelector('.device-screen').textContent));
    assert.deepEqual([...doc.querySelectorAll('.tile-pet,.tile-steps')].map(n=>n.dataset.target),['93']);
  }
  for(const n of ['10','74'])assert(!data.transitions[n].some(r=>r.event==='SETUP_RESUME'));
});
test('Daily micro-event names its source and display-off stays runtime-only',()=>{
  const {m,r,s}=fresh();r.preview('17');const daily=screenDoc('17',s);
  assert.equal(daily.querySelector('.screen-subtitle').textContent,'来自每日内容');
  assert(data.groups.flatMap(g=>g.pages).find(p=>p.n==='17').summary.includes('每日内容服务'));
  r.start('daily');m.dispatch('SCREEN_OFF');assert.equal(s.page,'120');const off=screenDoc('120',s);assert.equal(off.querySelector('.device-screen').textContent,'');m.dispatch('WAKE');assert.equal(s.page,'10');
  const gallery=openEntry('gallery.html').doc;assert(!gallery.getElementById('p120'));assert(gallery.getElementById('p79'));
  const index=openEntry('index.html').doc;assert(!index.querySelector('#page-index [data-preview="120"]'));
  const direct=openEntry('index.html','?page=120&mode=catalog');assert.equal(direct.app.FoxPrototype.machine.state.page,'79');
  const anchored=openEntry('gallery.html','#p120');assert.equal(anchored.app.location.hash,'#p79');assert(anchored.doc.getElementById('p79'));
});
test('Saved recordings belong to Voice note and both visible Back and swipe Back preserve the parent menu',()=>{
  for(const saved of [false,true])for(const method of ['button','gesture']){
    const {doc,app,click}=openEntry('index.html','?page=74&mode=flow');const s=app.FoxPrototype.machine.state;
    if(saved)s.records=[{id:'owned-record',seconds:8,status:'local-only'}];
    click('#live-screen .tile-mint');assert.equal(s.page,'70');assert.equal(doc.querySelector('#live-screen [data-target="124"]').textContent,'已存录音');
    click('#live-screen [data-target="124"]');assert.equal(s.page,'124');assert.equal(doc.querySelector('#page-name').textContent,'已存录音');assert.equal(doc.querySelector('#live-screen .fox-header h2').textContent,'已存录音');
    if(saved){click('#live-screen [data-record-id="owned-record"]');assert.equal(s.page,'182');click('#live-screen [data-event="RECORD_LIST"]');assert.equal(s.page,'124');}
    else assert(doc.querySelector('#live-screen .fox-empty'));
    if(method==='button')click('#live-screen [data-event="RECORD_LIST_BACK"]');else click('[data-gesture="right"]');assert.equal(s.page,'70');
    click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');assert.equal(s.records.length,saved?1:0);
  }
});
test('Friend messages are named consistently inside Friends and return there without granting social consent',()=>{
  const {doc,app,click}=openEntry('index.html','?page=74&mode=flow');const s=app.FoxPrototype.machine.state;
  click('#live-screen .tile-friends');assert.equal(s.page,'185');const entry=doc.querySelector('#live-screen [data-target="165"]');assert.equal(entry.querySelector('.list-item-label,strong').textContent,'好友消息');
  click('#live-screen [data-target="165"]');assert.equal(s.page,'165');assert.equal(doc.querySelector('#page-name').textContent,'好友消息');assert.equal(doc.querySelector('#live-screen .screen-label').textContent,'好友消息');assert(!s.socialAllowed);
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'185');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');assert(!s.socialAllowed);
});
test('Removing daily setup entry preserves first-use deferral, resume and explicit local completion',()=>{
  const {m,s}=fresh();enterSetupWifi(m);m.dispatch('WIFI_CANCEL');assert.equal(s.page,'05');m.dispatch('SETUP_RESUME');assert.equal(s.page,'126');m.tick(1);assert.equal(s.page,'05');
  m.dispatch('SETUP_DEFAULT');m.tick(1.5);m.tick(1.5);assert.equal(s.page,'10');assert(s.setupDone&&s.networkSkipped);assert(!s.networkConnected);
  m.dispatch('NAVIGATE',{target:'74'});assert(!screenDoc('74',s).querySelector('[data-event="SETUP_RESUME"]'));
});
test('Simplified Chinese visible copy has no untranslated sentence fragments',()=>{
  const {r,s}=fresh(),leftovers=[];
  for(const p of pages){r.preview(p.n);const {document:doc}=parseHTML(ctx.FoxScreen.render(p,{...s,language:'zh-CN',still:true}));if(p.n==='110')continue;const walker=doc.createTreeWalker(doc.querySelector('.device-screen'),NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode()){if(!walker.currentNode.parentElement?.closest('[translate="no"]'))texts.push(walker.currentNode.textContent);}const visible=texts.join(' ').replace(/\b(?:LG01|LUMIQ|Lumi|Milo|Pico|Momo|Nova|WPA2|English|Studio)\b/g,'');const words=visible.match(/[A-Za-z][A-Za-z][A-Za-z ]*/g);if(words)leftovers.push({id:p.n,words});}
  fs.writeFileSync(path.join(__dirname,'copy-audit.json'),JSON.stringify(leftovers,null,2));assert.equal(leftovers.length,0,JSON.stringify(leftovers));
});
test('Compact UI titles and recording status copy match the requested hierarchy',()=>{
  const {r,s}=fresh();
  r.preview('02');
  let doc=screenDoc('02',s);
  assert.equal(doc.querySelector('.fox-header h2').textContent,'设备连接');
  for(const id of ['14','15','16']){
    r.preview(id);doc=screenDoc(id,s);
    const state=doc.querySelector('.chat-state-below .session-state');
    assert(state,`Missing chat state title for ${id}`);
    assert.equal(state.parentElement.className,'chat-state-below');
    assert(doc.querySelector('.chat-state-below .chat-state-icon svg'),`Missing chat state icon for ${id}`);
  }
  for(const id of ['81','121']){
    const page=pages.find(p=>p.n===id);const html=ctx.FoxScreen.render(page,{...s,language:'zh-CN',recording:true,still:true});
    doc=parseHTML(html).document;
    assert(!doc.querySelector('.fox-record-mic'),`Unexpected microphone copy for ${id}`);
    assert(!doc.querySelector('.device-screen').textContent.includes('麦克风开启'));
  }
  return{p02:'设备连接',aiStates:'角色下方带状态图标',recording:['P81','P121']};
});
test('Latest copy and flow revisions remove the local skip, explain sources, and auto-advance setup',()=>{
  const {m,r,s}=fresh();
  r.preview('05');let doc=screenDoc('05',s);
  assert(!doc.querySelector('[data-event="SETUP_DEFAULT"]'));
  assert(!data.transitions['05'].some(route=>route.event==='SETUP_DEFAULT'));
  r.preview('29');doc=screenDoc('29',s);assert.equal(doc.querySelector('.fox-scope-note').textContent,'已在应用中选择');
  s.recording=true;r.preview('71');doc=screenDoc('71',s);assert(!doc.querySelector('.fox-record-mic'));
  r.preview('77');doc=screenDoc('77',s);assert(!doc.querySelector('.list-heading')?.textContent.includes('来自设备'));assert(!doc.querySelector('.device-screen').textContent.includes('来自设备和应用'));
  r.preview('103');assert.equal(data.groups.flatMap(g=>g.pages).find(p=>p.n==='103').trigger,'P74 菜单 → P187 日常 → 今日步数。');
  r.preview('11');assert.equal(data.groups.flatMap(g=>g.pages).find(p=>p.n==='11').title,'夜间回应');
  const setup=fresh();enterSetupWifi(setup.m);setup.m.dispatch('WIFI_SELECT_OPEN',{value:'Guest'});setup.m.tick(2);assert.equal(setup.s.page,'112');setup.m.tick(1.2);assert.equal(setup.s.page,'186');
  return{p05:'网络项直接进入密码页',p29:'补充 App 选择说明',p77:'隐藏提醒来源标题',p112:'首次配网自动进入 P186'};
});
test('Interaction graph is closed: every action has a valid destination and every external state declares its trigger',()=>{
  const all=[...pages,...Object.values(data.runtimePages||{})],ids=new Set(all.map(p=>p.n)),incoming=new Set(),missingTargets=[],missingRoutes=[],exitless=[];
  for(const [from,routes] of Object.entries(data.transitions)){
    if(!ids.has(from))missingRoutes.push(from+' (source)');
    for(const route of routes){if(!ids.has(route.target))missingTargets.push(from+' -> '+route.target);else incoming.add(route.target);}
  }
  for(const page of pages){
    const controls=[...(page.ui.actions||[]),...(page.ui.items||[])];
    for(const control of controls)if(control.target&&!ids.has(control.target))missingTargets.push(page.n+' UI -> '+control.target);
    if(!(data.transitions[page.n]||[]).length&&!controls.some(control=>control.target))exitless.push(page.n);
  }
  assert.deepEqual(missingRoutes,[]);assert.deepEqual(missingTargets,[]);assert.deepEqual(exitless,[]);
  const externallyTriggered=all.filter(page=>!incoming.has(page.n));
  assert(externallyTriggered.length>0);
  for(const page of externallyTriggered){assert(page.trigger&&page.trigger!=='从所属模块进入或在页面目录中查看',page.n+' lacks an external trigger');}
  const runtimeOnly=Object.keys(data.runtimePages||{});
  return{pages:pages.length,runtimeOnly,externalStates:externallyTriggered.map(page=>page.n),routes:Object.values(data.transitions).reduce((sum,routes)=>sum+routes.length,0)};
});
test('Modules keep shared failures nearby without duplicating canonical IDs',()=>{
  const {doc,click}=openEntry('gallery.html','?lang=zh-CN');
  const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);
  for(const group of data.groups)for(const section of group.sections)for(const p of section.related){
    const card=doc.getElementById('p'+p.n+'-shared-'+section.id);assert(card,section.id+' P'+p.n);
    assert.equal(card.closest('.gallery-module').getAttribute('aria-labelledby'),'group-'+group.id);
    assert(card.querySelector(`a[href*="page=${p.n}&"]`));assert(!card.querySelector('.flow-step'));
  }
  const voice=data.groups.find(g=>g.id==='voice').pages.map(p=>p.n);
  for(const id of ['184','81','121','125','177','42','73','158','168'])assert(voice.indexOf(id)<voice.indexOf('124'),id);
  assert.deepEqual([...doc.querySelectorAll('#flow-reminders-entry .gallery-item')].map(el=>el.id),['p74-daily-menu','p187']);
  assert.deepEqual([...doc.querySelectorAll('#flow-reminders-steps .gallery-item')].map(el=>el.id),['p187-steps-daily','p103']);
  assert(doc.querySelector('#p187-steps-daily [data-target="103"]'));assert(!doc.querySelector('.home-steps,.menu-entry-hidden'));
  click('[data-group="chat"]');assert(!doc.getElementById('p27-shared-chat-recovery'));assert(doc.getElementById('p78-shared-chat-recovery'));
  return{modules:data.groups.length,sharedPreviews:data.groups.flatMap(g=>g.sections).reduce((n,s)=>n+s.related.length,0)};
});
test('Character management and recording backup belong to their owning modules with adjacent recovery sections',()=>{
  const locations=sandbox.FoxFlow.locations;
  for(const id of ['93','94','157','18','51','52','53','154','155','156'])assert.equal(locations[id].groupId,'pet',id);
  for(const id of ['173','171','72'])assert.equal(locations[id].sectionId,'voice-backup',id);
  for(const id of ['54','55','176','56','188','189','190','102'])assert.equal(locations[id].groupId,'friends',id);
  for(const [groupId,order] of [
    ['setup',['setup-start','setup-recovery','setup-network','setup-companion']],
    ['pet',['pet-feeding','pet-feeding-recovery']],
    ['pet',['pet-photo','pet-activate','pet-activation-recovery']],
    ['friends',['friends-import','friends-import-recovery']],
    ['reminders',['reminders-steps','reminders-steps-recovery']]
  ]){
    const sections=data.groups.find(group=>group.id===groupId).sections.map(section=>section.id),start=sections.indexOf(order[0]);
    assert(start>=0);assert.deepEqual(Array.from(sections.slice(start,start+order.length)),order);
  }
  return{characterPages:'pet',backupPermission:'voice-backup',canonicalPages:pages.length};
});

test('Shared screens continue the same responsive grid without adding fake numbered steps or blank rows',()=>{
  const {doc}=openEntry('gallery.html','?lang=zh-CN');let shared=0;
  for(const group of data.groups)for(const section of group.sections){
    const root=doc.getElementById('flow-'+section.id),grids=[...root.querySelectorAll('.flow-screens')];assert.equal(grids.length,1,section.id);
    const grid=grids[0],cards=[...grid.children];assert(cards.every(card=>card.classList.contains('gallery-item')));
    const localIds=section.related.map(page=>'p'+page.n+'-shared-'+section.id);assert.equal(new Set(localIds).size,localIds.length);
    if(localIds.length)assert.deepEqual(cards.slice(-localIds.length).map(card=>card.id),Array.from(localIds));
    for(const page of section.related){
      assert(!section.pages.some(item=>item.n===page.n),section.id+' redundantly repeats P'+page.n);
      const card=doc.getElementById('p'+page.n+'-shared-'+section.id);assert.equal(card.parentElement,grid);
      assert.equal(card.querySelector('.gallery-shared-label').textContent,'共用');assert(!card.querySelector('.flow-step'));shared++;
    }
  }
  assert(!doc.querySelector('.related-states'));
  const english=openEntry('gallery.html','?lang=en&group=settings');assert.equal(english.doc.querySelector('.gallery-shared-label').textContent,'Shared');
  return{sharedPreviews:shared,layout:'One responsive grid per section; shared previews remain unnumbered'};
});

test('Regrouped module filters retain local settings, partner, invitation and reminder previews',()=>{
  const {doc,app,click}=openEntry('gallery.html','?lang=zh-CN');
  for(const [groupId,expected] of [
    ['pet',{'pet-actions':['186'],'pet-photo':['102']}],
    ['settings',{'settings-entry':['178','186'],'settings-privacy':['173']}],
    ['friends',{'friends-connect':['144'],'friends-import':['186','93'],'friends-team':['144'],'friends-create':['154','155','156']}],
    ['reminders',{'reminders-inbox':['162']}]
  ]){
    click('[data-group="'+groupId+'"]');
    assert.equal(doc.querySelectorAll('.gallery-module').length,1);
    assert.equal(doc.querySelectorAll('.gallery-item:not(.gallery-entry-variant)').length,data.groups.find(group=>group.id===groupId).pages.length);
    for(const [sectionId,ids] of Object.entries(expected))for(const id of ids){
      const card=doc.getElementById('p'+id+'-shared-'+sectionId);assert(card,sectionId+' P'+id);
      assert.equal(card.closest('.gallery-module').getAttribute('aria-labelledby'),'group-'+groupId);
    }
    const target=groupId==='pet'?'186':groupId==='settings'?'173':groupId==='friends'?'154':'162';
    click('[data-gallery-page="'+target+'"]');assert.equal(new URL(app.location.href).searchParams.get('group'),groupId);
  }
  click('[data-group="voice"]');assert(doc.getElementById('p173'));assert.equal(doc.getElementById('p173').closest('.gallery-flow').id,'flow-voice-backup');
});

test('Daily submenu returns correctly through reminders, steps and step failures',()=>{
  const {doc,app,click}=openEntry('index.html','?page=10&mode=flow&lang=zh-CN');
  const {machine:m,render}=app.FoxPrototype,s=m.state;assert.equal(s.page,'10');
  assert(!doc.querySelector('#live-screen [data-target="103"]'));click('#live-screen .dock-menu');
  assert.equal(s.page,'74');click('#live-screen .tile-lavender');assert.equal(s.page,'187');
  click('#live-screen [data-target="103"]');assert.equal(s.page,'103');
  for(let i=0;i<2;i++){m.dispatch('STEPS_FAILED');assert.equal(s.page,'107');m.dispatch('STEPS_RETRY');assert.equal(s.page,'103');}
  render();click('#live-screen [data-event="BACK"]');assert.equal(s.page,'187');
  click('#live-screen [data-target="103"]');m.dispatch('STEPS_FAILED');render();click('#live-screen [data-event="BACK"]');assert.equal(s.page,'187');
  click('#live-screen [data-target="77"]');assert.equal(s.page,'77');click('#live-screen [data-event="NOTE_OPEN"]');assert(['134','68'].includes(s.page));
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'77');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'187');
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');click('[data-gesture="right"]');assert.equal(s.page,'10');
  click('#live-screen [data-target="77"]');assert.equal(s.page,'77');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'10');
  for(const id of ['103','107','187']){
    const direct=openEntry('index.html','?page='+id+'&mode=flow');direct.click('[data-gesture="right"]');assert.equal(direct.app.FoxPrototype.machine.state.page,id==='187'?'74':'187');
  }
});
test('Growth is driven by increasing character levels, not care actions or repeated callbacks',()=>{
  const {m,s,r}=fresh();r.start('daily');
  for(const level of [0,-1,1,1.5,'2',NaN]){m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level});assert.equal(s.page,'10');}
  m.dispatch('LEVEL_UPDATED',{avatarId:'another-character',level:2});assert.equal(s.page,'10');
  m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:2});assert.equal(s.page,'18');assert.equal(s.characterLevel,2);
  assert.equal(screenDoc('18',s).querySelector('.screen-subtitle').textContent,'等级 2');
  m.dispatch('BACK');assert.equal(s.page,'10');
  for(const level of [1,2]){m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level});assert.equal(s.page,'10');}
  m.dispatch('NAVIGATE',{target:'93'});m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:3});assert.equal(s.page,'18');m.dispatch('BACK');assert.equal(s.page,'93');
  m.dispatch('REC_START');assert(s.recording);m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:4});assert.equal(s.page,'71');assert(s.recording);
  m.dispatch('REC_STOP');m.tick(1);assert.notEqual(s.page,'18');
  m.dispatch('NAVIGATE',{target:'10'});assert.equal(s.page,'18');assert.equal(s.characterLevel,4);m.dispatch('BACK');assert.equal(s.page,'10');
  r.preview('18');assert.equal(s.characterLevel,2);assert.equal(s.page,'18');assert.equal(sandbox.FoxFlow.locations['18'].groupId,'pet');
});
test('Removed Wi-Fi and weather pages are absent from all gallery variants, indexes and routes',()=>{
  const {doc}=openEntry('gallery.html','?lang=zh-CN');
  for(const id of ['113','166']){
    assert(!pages.some(p=>p.n===id));assert(!data.runtimePages?.[id]);assert(!doc.querySelector(`[id="p${id}"],[id^="p${id}-"]`));
    assert(!Object.values(data.transitions).flat().some(r=>r.target===id));
    const live=openEntry('index.html','?page='+id+'&mode=flow');assert.notEqual(live.app.FoxPrototype.machine.state.page,id);
  }
});
test('Cloud failure has exactly one visible retry action and no Continue branch',()=>{
  const {r,s}=fresh();r.preview('78');const doc=screenDoc('78',s);
  assert.deepEqual([...doc.querySelectorAll('button')].map(el=>el.dataset.event),['NETWORK_RETRY']);
  assert.equal(doc.querySelector('button').textContent,'再试一次');assert(!data.transitions['78'].some(r=>r.event==='CLOUD_USE_LOCAL'));
});
test('Seven radial menu entries include Daily without adding Home or a steps shortcut',()=>{
  const {r,s}=fresh();r.preview('74');const doc=screenDoc('74',s);
  assert.equal(doc.querySelectorAll('.fox-menu-wheel .app-tile').length,7);assert(!doc.querySelector('[data-scroll-list],.fox-menu-direct,.tile-steps'));
  assert.equal(doc.querySelector('.tile-pet').dataset.target,'93');assert(!doc.querySelector('.menu-level'));assert.equal(doc.querySelector('.tile-pet').getAttribute('aria-label'),'我的伙伴');
  const daily=doc.querySelector('.tile-lavender');assert.equal(daily.dataset.target,'187');assert.equal(daily.querySelector('span:last-child').textContent,'日常');assert(daily.querySelector('svg'));
  r.preview('10');assert(!screenDoc('10',s).querySelector('.home-steps,[data-target="103"]'));
  r.preview('93');assert(!screenDoc('93',s).querySelector('[data-target="103"]'));
  const legacy=openEntry('index.html','?page=74&mode=flow&entry=steps');assert.equal(legacy.app.FoxPrototype.machine.state.page,'187');
  return{entries:7,stepsParent:'187',standbyShortcut:false};
});
test('My companion switches presets and preserves each partner level and care values',()=>{
  const {doc,app,click}=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;click('#live-screen .tile-pet');assert.equal(s.page,'93');
  const entry=doc.querySelector('#live-screen [data-event="PET_SWITCH_OPEN"]');assert(entry);assert.equal(doc.querySelectorAll('#live-screen [data-event="PET_SWITCH_OPEN"]').length,1);assert(!doc.querySelector('#live-screen .screen-list.list-with-actions'));assert.equal(entry.dataset.target,'186');assert(entry.textContent.trim()||entry.getAttribute('aria-label'));assert(entry.querySelector('svg'));
  Object.assign(m.currentPet(),{level:4,feed:80,clean:100,energy:90});app.FoxPrototype.render();const original=JSON.stringify(m.currentPet());
  click('#live-screen [data-event="PET_SWITCH_OPEN"]');assert.equal(s.page,'186');assert.equal(s.companionOrigin,'pet');assert.equal(s.pendingCompanion,'lumi');
  for(const id of ['lumi','pico','momo'])assert(doc.querySelector(`#live-screen [data-event="COMPANION_SELECT"][data-value="${id}"]`));
  click('#live-screen [data-event="COMPANION_SELECT"][data-value="pico"]');assert.equal(s.characterId,'lumi');assert.equal(s.pendingCompanion,'pico');click('#live-screen [data-event="COMPANION_COMMIT"]');assert.equal(s.page,'93');assert.equal(s.characterId,'pico');assert.equal(s.characterName,'Pico');
  assert.equal(s.characterLevel,1);assert.deepEqual([s.petFeed,s.petClean,s.petEnergy],[60,60,60]);assert.equal(JSON.stringify(s.pets.lumi),original);
  Object.assign(m.currentPet(),{level:2,feed:70,clean:80,energy:50});const pico=JSON.stringify(m.currentPet());
  click('#live-screen [data-event="PET_SWITCH_OPEN"]');click('#live-screen [data-event="COMPANION_SELECT"][data-value="lumi"]');click('#live-screen [data-event="COMPANION_COMMIT"]');assert.equal(s.page,'93');assert.equal(s.characterId,'lumi');assert.equal(s.characterLevel,4);assert.deepEqual([s.petFeed,s.petClean,s.petEnergy],[80,100,90]);assert.equal(JSON.stringify(s.pets.pico),pico);
  click('#live-screen [data-event="PET_SWITCH_OPEN"]');click('#live-screen [data-event="COMPANION_SELECT"][data-value="momo"]');click('#live-screen [data-event="COMPANION_CANCEL"]');assert.equal(s.page,'93');assert.equal(s.characterId,'lumi');assert.equal(JSON.stringify(m.currentPet()),original);
  click('#live-screen [data-event="PET_SWITCH_OPEN"]');click('#live-screen [data-event="COMPANION_SELECT"][data-value="pico"]');click('[data-gesture="right"]');assert.equal(s.page,'93');assert.equal(s.characterId,'lumi');assert.equal(s.pendingCompanion,'lumi');
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');assert(!doc.querySelector('#live-screen').textContent.includes('等级'));
});

test('Only locally activated partners join the reusable companion selector',()=>{
  const {m,r,s}=fresh();r.start('social');assert.deepEqual(s.availableCompanions.map(item=>item.id),['lumi','pico','momo']);
  m.dispatch('AVATAR_INVITE');const requestId=s.requestId;assert(requestId);
  const payload=()=>({requestId,revision:s.requests[requestId].revision});
  m.dispatch('AVATAR_REMOTE_ACCEPT',payload());m.dispatch('AVATAR_CREATED',{...payload(),resultId:'nova-owned',characterName:'Nova'});assert.equal(s.page,'92');assert(!s.availableCompanions.some(item=>item.id==='nova-owned'));
  m.dispatch('AVATAR_ACTIVATE');const failedSerial=s.activationSerial;assert.equal(s.page,'155');assert(!s.availableCompanions.some(item=>item.id==='nova-owned'));
  m.dispatch('AVATAR_ACTIVATE_FAILED');assert.equal(s.page,'156');m.dispatch('AVATAR_ACTIVATED',{serial:failedSerial});assert.equal(s.page,'156');assert(!s.availableCompanions.some(item=>item.id==='nova-owned'));
  m.dispatch('AVATAR_ACTIVATE');m.tick(1.5);assert.equal(s.page,'93');assert.equal(s.characterId,'nova-owned');assert.equal(s.availableCompanions.filter(item=>item.id==='nova-owned').length,1);
  Object.assign(m.currentPet(),{level:3,feed:85,clean:95,energy:75});const owned=JSON.stringify(m.currentPet());
  m.dispatch('PET_SWITCH_OPEN');let selector=screenDoc('186',s);const created=selector.querySelector('[data-event="COMPANION_SELECT"][data-value="nova-owned"]');assert(created);assert(created.textContent.includes('Nova'));assert(created.querySelector('img'));
  const list=selector.querySelector('.fox-companions.has-extra-companions');assert(list);assert.equal(list.dataset.scrollList,'companions');assert.equal(list.getAttribute('role'),'region');assert.equal(list.getAttribute('tabindex'),'0');assert(list.getAttribute('aria-label'));assert.equal(list.querySelectorAll('[data-event="COMPANION_SELECT"]').length,4);
  const previous=s.pendingCompanion;m.dispatch('COMPANION_SELECT',{value:'unknown-peer'});assert.equal(s.pendingCompanion,previous);
  m.dispatch('COMPANION_SELECT',{value:'lumi'});m.dispatch('COMPANION_COMMIT');assert.equal(s.page,'93');assert.equal(s.characterId,'lumi');
  m.dispatch('PET_SWITCH_OPEN');m.dispatch('COMPANION_SELECT',{value:'nova-owned'});m.dispatch('COMPANION_COMMIT');assert.equal(s.page,'93');assert.equal(s.characterId,'nova-owned');assert.equal(s.characterLevel,3);assert.deepEqual([s.petFeed,s.petClean,s.petEnergy],[85,95,75]);assert.equal(JSON.stringify(m.currentPet()),owned);
  m.dispatch('AVATAR_ACTIVATED',{serial:s.activationSerial});assert.equal(s.availableCompanions.filter(item=>item.id==='nova-owned').length,1);
});

test('Partner switch header and expanded selector use fixed circular-safe geometry',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>{const value={};for(const rule of rules)if(rule.selectorText===selector)for(const name of Array.from(rule.style))value[name]=rule.style[name];return value;};
  const header=style('.device-screen.fox-screen[data-screen-id="93"] .pet-switch-header'),button=style('.pet-carousel .pet-carousel-arrow');
  assert.equal(header.width,'184px');assert.equal(header.height,'50px');assert.equal(button.width,'56px');assert.equal(button.height,'56px');assert.equal(button.position,'absolute');
  const picker=style('.fox-companions'),expanded=style('.fox-companions.has-extra-companions');assert.equal(picker.width,'338px');assert.equal(expanded.height,'216px');assert.equal(expanded['grid-auto-rows'],'148px');assert(148*2+10>216);
  for(const rect of [[188,48,184,50],[48,110,384,96],[80,234,320,174],[71,151,338,148],[71,124,338,216]])for(const x of [rect[0],rect[0]+rect[2]])for(const y of [rect[1],rect[1]+rect[3]])assert(Math.hypot(x-240,y-240)<240);
  const scrolling=style('.fox-screen [data-scroll-list]');assert.equal(scrolling['overflow-y'],'auto');assert.equal(scrolling['touch-action'],'pan-y pinch-zoom');
  return{switchSize:'56 x 56',expandedSelector:'338 x 216',scope:'Source geometry only; no browser layout measurement'};
});

test('Peer friendship requires a valid encounter and matching bilateral acceptance',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('PEER_DISCOVERY_OPEN');assert.equal(s.page,'54');
  m.dispatch('PEER_TAP',{peerId:s.localDeviceId,peerName:'My device',pet:{id:'same',name:'Lumi',appearance:'lumi'}});assert.equal(s.page,'54');assert(!s.peerEncounter);
  const requestsBefore=JSON.stringify(s.requests);
  for(const peerId of ['__proto__','constructor','toString','hasOwnProperty']){m.dispatch('PEER_TAP',{peerId,peerName:'Peer',pet:{id:'valid-pet',name:'Pico',appearance:'pico'}});assert.equal(s.page,'54');assert.equal(s.peerEncounter,null);assert.equal(JSON.stringify(s.requests),requestsBefore);}
  const peer={peerId:'peer-pico',peerName:'Pico owner',pet:{id:'pico-personal',name:'Pico',appearance:'pico'}};
  m.dispatch('PEER_TAP',peer);assert.equal(s.page,'55');assert.equal(s.peerEncounter.peerId,peer.peerId);
  m.dispatch('PEER_IMPORT_OPEN');assert.notEqual(s.page,'188');assert(!s.friends[peer.peerId]);
  m.dispatch('FRIEND_REQUEST');assert.equal(s.page,'176');const request=s.requests[s.requestId],payload={requestId:request.id,revision:request.revision};
  m.dispatch('FRIEND_REMOTE_ACCEPT',{...payload,revision:payload.revision+1});assert.equal(s.page,'176');assert(!s.friends[peer.peerId]);
  m.dispatch('PEER_IMPORT_OPEN');assert.equal(s.page,'176');m.dispatch('FRIEND_REMOTE_ACCEPT',payload);assert.equal(s.page,'56');assert(s.friends[peer.peerId].established);assert.equal(s.selectedFriendId,peer.peerId);
  const friends=JSON.stringify(s.friends);m.dispatch('FRIEND_REMOTE_ACCEPT',payload);assert.equal(JSON.stringify(s.friends),friends);
  assert(!s.availableCompanions.some(item=>item.sourcePeerId===peer.peerId));
});
test('Background friendship acceptance preserves the active detail, greeting and companion import',()=>{
  for(const operation of ['detail','greeting','import']){
    const {m,r,s}=fresh();r.start('social');
    m.dispatch('PEER_TAP',{peerId:'background-friend',peerName:'Pico owner',pet:{id:'pet',name:'Pico',appearance:'pico'}});m.dispatch('FRIEND_REQUEST');
    const request=s.requests[s.requestId],receipt={requestId:request.id,revision:request.revision,peerId:'background-friend'};
    m.dispatch('BACK');m.dispatch('BACK');m.dispatch('FRIEND_OPEN',{peerId:'milo'});
    if(operation==='greeting'){m.dispatch('GREETING_OPEN');m.dispatch('SOCIAL_SEND');}
    if(operation==='import'){m.dispatch('PEER_IMPORT_OPEN');m.dispatch('PEER_IMPORT_CONFIRM');}
    const page=s.page;m.dispatch('FRIEND_REMOTE_ACCEPT',receipt);assert.equal(s.page,page);assert.equal(s.selectedFriendId,'milo');assert(s.friends['background-friend'].established);assert(s.notifications.some(n=>n.type==='request'&&n.id===request.id));
    const friends=JSON.stringify(s.friends);m.dispatch('FRIEND_REMOTE_ACCEPT',receipt);assert.equal(JSON.stringify(s.friends),friends);
    m.tick(2);
    if(operation==='greeting'){assert.equal(s.page,'138');assert.equal(s.messageStatus,'sent');assert.equal(s.messagePeerId,'milo');}
    if(operation==='import'){assert.equal(s.page,'56');assert(s.availableCompanions.some(item=>item.sourcePeerId==='milo'));assert(!s.availableCompanions.some(item=>item.sourcePeerId==='background-friend'));}
    m.dispatch('OPEN_REQUEST',{requestId:request.id});assert.equal(s.page,'56');assert.equal(s.selectedFriendId,'background-friend');
  }
});

test('Greeting receipts follow the captured recipient when an incoming invitation changes the visible friend',()=>{
  const {m,r,s}=fresh();r.start('social');m.dispatch('PEER_TAP',{peerId:'another-friend',peerName:'Pico owner',pet:{id:'pet',name:'Pico',appearance:'pico'}});m.dispatch('FRIEND_REQUEST');
  const request=s.requests[s.requestId];m.dispatch('FRIEND_REMOTE_ACCEPT',{requestId:request.id,revision:request.revision});
  m.dispatch('FRIEND_OPEN',{peerId:'milo'});m.dispatch('GREETING_OPEN');m.dispatch('SOCIAL_SEND');const serial=s.messageSerial;
  m.dispatch('AVATAR_INVITATION_RECEIVED',{requestId:'new-invite',peerId:'another-friend'});assert.equal(s.page,'142');assert.equal(s.selectedFriendId,'another-friend');
  m.dispatch('SOCIAL_SENT',{serial,peerId:'another-friend'});assert.equal(s.messageStatus,'sending');
  m.tick(2);assert.equal(s.messageStatus,'sent');assert.equal(s.messagePeerId,'milo');assert.equal(s.page,'142');assert.equal(s.selectedFriendId,'another-friend');
});

test('Friend declines close only the matching request and incoming avatar invitations require an established peer',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'74'});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('PEER_DISCOVERY_OPEN');m.dispatch('PEER_TAP',{peerId:'declined-peer',peerName:'Peer',pet:{id:'pet-one',name:'Pico',appearance:'pico'}});m.dispatch('FRIEND_REQUEST');const request=s.requests[s.requestId],receipt={requestId:request.id,revision:request.revision,peerId:'declined-peer'};
  m.dispatch('FRIEND_REMOTE_DECLINE',{...receipt,peerId:'different-device'});assert.equal(request.status,'waiting');m.dispatch('FRIEND_REMOTE_DECLINE',receipt);assert.equal(request.status,'declined');assert.equal(s.page,'144');assert(!s.friends['declined-peer']);m.dispatch('FRIEND_REMOTE_ACCEPT',receipt);assert(!s.friends['declined-peer']);m.dispatch('BACK');assert.equal(s.page,'165');m.dispatch('BACK');assert.equal(s.page,'185');m.dispatch('BACK');assert.equal(s.page,'74');
  for(const peerId of [undefined,'unknown-peer','__proto__']){const before=JSON.stringify(s.requests);m.dispatch('AVATAR_INVITATION_RECEIVED',{requestId:'bad-'+String(peerId),peerId});assert.equal(JSON.stringify(s.requests),before);}
  m.dispatch('AVATAR_INVITATION_RECEIVED',{requestId:'incoming-milo',peerId:'milo',revision:1});assert.equal(s.page,'142');assert.equal(s.requests['incoming-milo'].peer.peerId,'milo');m.dispatch('AVATAR_DECLINE');assert.equal(s.requests['incoming-milo'].status,'declined');
});
test('Accepting an incoming friend creation request needs no second remote acceptance',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('AVATAR_INVITATION_RECEIVED',{requestId:'incoming-accepted',peerId:'milo',revision:1});assert.equal(s.page,'142');const request=s.requests['incoming-accepted'];assert.equal(request.remoteConsent,true);assert.equal(request.localConsent,false);
  m.dispatch('AVATAR_ACCEPT');assert.equal(s.page,'91');assert.equal(request.status,'generating');assert.equal(request.localConsent,true);const before=JSON.stringify(s.requests);m.dispatch('AVATAR_ACCEPT');assert.equal(JSON.stringify(s.requests),before);
  m.dispatch('AVATAR_CREATED',{requestId:request.id,revision:request.revision,peerId:'different-device',resultId:'wrong'});assert.equal(request.status,'generating');m.dispatch('AVATAR_CREATED',{requestId:request.id,revision:request.revision,peerId:'milo',resultId:'agreed-result',characterName:'Nova'});assert.equal(s.page,'92');assert.equal(request.status,'completed');assert(!s.availableCompanions.some(item=>item.id==='agreed-result'));
});

test('Peer import is cancellable and idempotent, with stale callback rejection and no automatic activation',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('PEER_DISCOVERY_OPEN');
  const peer={peerId:'peer-import',peerName:'Pico owner',pet:{id:'pico-one',name:'Pico',appearance:'pico'}};m.dispatch('PEER_TAP',peer);m.dispatch('FRIEND_REQUEST');const request=s.requests[s.requestId];m.dispatch('FRIEND_REMOTE_ACCEPT',{requestId:request.id,revision:request.revision});assert.equal(s.page,'56');
  const active=s.characterId,pet=JSON.stringify(m.currentPet());m.dispatch('PEER_IMPORT_OPEN');assert.equal(s.page,'188');m.dispatch('PEER_IMPORT_CANCEL');assert.equal(s.page,'56');assert.equal(s.characterId,active);
  m.dispatch('PEER_IMPORT_OPEN');m.dispatch('PEER_IMPORT_CONFIRM');assert.equal(s.page,'189');const first=s.peerImport.attemptId,companionId=s.peerImport.companionId;
  m.dispatch('PEER_IMPORT_FAILED',{attemptId:first,error:'network'});assert.equal(s.page,'190');assert(!s.availableCompanions.some(item=>item.id===companionId));m.dispatch('PEER_IMPORT_RETRY');assert.equal(s.page,'189');const second=s.peerImport.attemptId;assert.notEqual(second,first);
  m.dispatch('PEER_IMPORT_SUCCESS',{attemptId:first});assert.equal(s.page,'189');m.dispatch('PEER_IMPORT_CANCEL');assert.equal(s.page,'56');m.dispatch('PEER_IMPORT_SUCCESS',{attemptId:second});assert(!s.availableCompanions.some(item=>item.id===companionId));
  m.dispatch('PEER_IMPORT_OPEN');m.dispatch('PEER_IMPORT_CONFIRM');const valid=s.peerImport.attemptId;m.tick(1.5);assert.equal(s.page,'56');assert.equal(s.availableCompanions.filter(item=>item.id===companionId).length,1);assert.equal(s.characterId,active);assert.equal(JSON.stringify(m.currentPet()),pet);
  m.dispatch('PEER_IMPORT_SUCCESS',{attemptId:valid});assert.equal(s.availableCompanions.filter(item=>item.id===companionId).length,1);
  const imported=s.availableCompanions.find(item=>item.id===companionId);assert.equal(imported.sourcePeerId,peer.peerId);assert.equal(imported.appearance,'pico');
});

test('Peer request expiry and import permission, storage and offline guards preserve existing partners',()=>{
  const expired=fresh();expired.r.start('daily');expired.m.dispatch('ENV',{key:'socialAllowed',value:true});expired.m.dispatch('NAVIGATE',{target:'185'});expired.m.dispatch('PEER_DISCOVERY_OPEN');expired.m.dispatch('PEER_TAP',{peerId:'expired-peer',peerName:'Peer',pet:{id:'pet',name:'Pico',appearance:'pico'}});expired.m.dispatch('FRIEND_REQUEST');const pending=expired.s.requests[expired.s.requestId],late={requestId:pending.id,revision:pending.revision};expired.m.tick(60);expired.m.dispatch('FRIEND_REMOTE_ACCEPT',late);assert(!expired.s.friends['expired-peer']);
  for(const key of ['socialAllowed','storageAvailable','networkConnected']){
    const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('FRIEND_OPEN',{peerId:'milo'});assert.equal(s.page,'56');m.dispatch('PEER_IMPORT_OPEN');assert.equal(s.page,'188');const before=JSON.stringify(s.availableCompanions),active=s.characterId;
    m.dispatch('ENV',{key,value:false});m.dispatch('PEER_IMPORT_CONFIRM');assert.notEqual(s.page,'189');assert(s.statusMessage||['169','140','190'].includes(s.page));assert.equal(JSON.stringify(s.availableCompanions),before);assert.equal(s.characterId,active);
  }
});

test('Peer-bound partner and avatar receipts reject a different device without consuming the request',()=>{
  for(const [event,receipt,expected] of [['PARTNER_REQUEST','PARTNER_CONFIRMED','completed'],['AVATAR_INVITE','AVATAR_REMOTE_ACCEPT','generating']]){
    const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});m.dispatch('FRIEND_OPEN',{peerId:'milo'});m.dispatch(event);
    const request=s.requests[s.requestId],payload={requestId:request.id,revision:request.revision};assert.equal(request.status,'waiting');
    m.dispatch(receipt,{...payload,peerId:'different-device'});assert.equal(request.status,'waiting');assert.equal(request.revision,payload.revision);assert.equal(request.remoteConsent,false);
    m.dispatch(receipt,{...payload,peerId:'milo'});assert.equal(request.status,expected);assert.equal(request.remoteConsent,true);
  }
});

test('Viewing imported partners follows the selected friend, not the most recent import',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('NAVIGATE',{target:'185'});
  const imported={};
  for(const peerId of ['device-a','device-b','device-c']){
    m.dispatch('PEER_DISCOVERY_OPEN');m.dispatch('PEER_TAP',{peerId,peerName:peerId,pet:{id:'pet-'+peerId,name:'Pico',appearance:'pico'}});m.dispatch('FRIEND_REQUEST');const request=s.requests[s.requestId];m.dispatch('FRIEND_REMOTE_ACCEPT',{requestId:request.id,revision:request.revision,peerId});assert.equal(s.page,'56');
    if(peerId!=='device-c'){m.dispatch('PEER_IMPORT_OPEN');m.dispatch('PEER_IMPORT_CONFIRM');imported[peerId]=s.peerImport.companionId;m.tick(1.5);assert.equal(s.page,'56');}
    m.dispatch('BACK');assert.equal(s.page,'185');
  }
  const active=s.characterId,before=JSON.stringify(s.availableCompanions);
  m.dispatch('FRIEND_OPEN',{peerId:'device-a'});m.dispatch('PEER_COMPANIONS_OPEN');assert.equal(s.page,'186');assert.equal(s.pendingCompanion,imported['device-a']);assert.notEqual(s.pendingCompanion,imported['device-b']);assert.equal(s.characterId,active);m.dispatch('COMPANION_CANCEL');assert.equal(s.page,'56');m.dispatch('BACK');
  m.dispatch('FRIEND_OPEN',{peerId:'device-c'});m.dispatch('PEER_COMPANIONS_OPEN');assert.equal(s.page,'56');assert(s.statusMessage);assert.equal(JSON.stringify(s.availableCompanions),before);
  m.dispatch('ENV',{key:'socialAllowed',value:false});m.dispatch('PEER_COMPANIONS_OPEN');assert.equal(s.page,'169');m.dispatch('BACK');assert.equal(s.page,'56');
  m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('ENV',{key:'relationValid',value:false});m.dispatch('PEER_COMPANIONS_OPEN');assert.equal(s.page,'140');assert.equal(s.characterId,active);
});

test('Menu hides levels while companion profile and upgrade feedback retain the current level',()=>{
  const {doc,app,click}=openEntry('index.html','?page=74&mode=flow&lang=zh-CN');const {machine:m,render}=app.FoxPrototype,s=m.state;
  assert(!doc.querySelector('#live-screen').textContent.includes('等级'));assert(!doc.querySelector('.menu-level'));click('#live-screen .tile-pet');assert.equal(s.page,'93');assert.equal(doc.querySelector('.pet-header .screen-title').textContent,'等级 1');
  m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:2});render();assert.equal(s.page,'18');assert(doc.querySelector('#live-screen').textContent.includes('等级 2'));
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'93');assert.equal(doc.querySelector('.pet-header .screen-title').textContent,'等级 2');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');assert(!doc.querySelector('#live-screen').textContent.includes('等级'));
  click('#live-screen .tile-pet');assert.equal(doc.querySelector('.pet-header .screen-title').textContent,'等级 2');
  const menuPage=pages.find(p=>p.n==='74');for(const language of ['en','zh-CN']){const menu=parseHTML(ctx.FoxScreen.render(menuPage,{...s,language})).document;assert(!menu.querySelector('.menu-level'));assert(!/Level|等级/.test(menu.querySelector('.tile-pet').outerHTML));}
  const gallery=openEntry('gallery.html','?lang=zh-CN');assert(!gallery.doc.querySelector('#p74 .device-screen').textContent.includes('等级'));
});
test('Photo results survive Later and are explicitly activated from the companion picker',()=>{
  const live=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=live.app.FoxPrototype.machine,s=m.state;
  const click=event=>live.click('#live-screen [data-event="'+event+'"]');live.click('#live-screen .tile-pet');
  m.dispatch('REVIVE_REQUESTED',{deviceId:s.localDeviceId,requestId:'photo-a'});const receipt={requestId:'photo-a',attemptId:s.photoRequests['photo-a'].attemptId};
  m.dispatch('REVIVE_START',receipt);m.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'toy-a',characterName:'My Toy'});live.app.FoxPrototype.render();assert.equal(s.page,'53');assert.equal(s.characterId,'lumi');
  click('PHOTO_LATER');assert.equal(s.page,'93');click('PET_SWITCH_OPEN');assert(live.doc.querySelector('[data-event="PHOTO_OPEN"][data-request-id="photo-a"]'));
  assert(!live.doc.querySelector('[data-event="COMPANION_SELECT"][data-value="toy-a"]'));click('PHOTO_OPEN');click('OPEN_ACTIVATE');assert.equal(s.page,'154');assert.equal(s.targetCharacterId,'toy-a');assert(live.doc.querySelector('#live-screen').textContent.includes('My Toy'));
  m.dispatch('REVIVE_REQUESTED',{deviceId:s.localDeviceId,requestId:'photo-b'});const other={requestId:'photo-b',attemptId:s.photoRequests['photo-b'].attemptId};m.dispatch('REVIVE_START',other);m.dispatch('REVIVE_SUCCESS',{...other,resultId:'toy-b',characterName:'Other Toy'});
  assert.equal(s.targetCharacterId,'toy-a');assert.equal(s.page,'154');click('AVATAR_ACTIVATE');m.tick(1.5);assert.equal(s.characterId,'toy-a');assert.equal(s.page,'93');
  assert(s.availableCompanions.some(c=>c.id==='toy-a'));assert(!s.availableCompanions.some(c=>c.id==='toy-b'));
});

test('Photo failure and timeout keep one task, reject stale retries and never activate a fallback',()=>{
  const {m,r,s}=fresh();r.start('pet');
  m.dispatch('REVIVE_REQUESTED',{deviceId:'wrong',requestId:'wrong'});assert.equal(Object.keys(s.photoRequests).length,0);
  m.dispatch('REVIVE_REQUESTED',{deviceId:s.localDeviceId,requestId:'photo'});const receipt={requestId:'photo',attemptId:s.photoRequests.photo.attemptId};m.dispatch('REVIVE_START',receipt);
  m.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'lumi',characterName:'Wrong'});assert.equal(s.page,'52');m.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'toy'});assert.equal(s.page,'52');
  m.tick(120);assert.equal(s.page,'102');assert.equal(s.photoRequests.photo.status,'failed');assert(screenDoc('102',s).querySelector('[data-event="REVIVE_RETRY"]'));assert(!screenDoc('102',s).querySelector('[data-event="AVATAR_RETRY"]'));
  m.dispatch('REVIVE_RETRY');const retry={requestId:'photo',attemptId:s.photoRequests.photo.attemptId};assert.notEqual(retry.attemptId,receipt.attemptId);
  m.dispatch('REVIVE_SUCCESS',{...receipt,resultId:'stale',characterName:'Old'});assert.equal(s.page,'52');m.dispatch('PHOTO_LATER');assert.equal(s.page,'93');
  m.dispatch('REVIVE_SUCCESS',{...retry,resultId:'actual',characterName:'Actual'});assert.equal(s.page,'93');m.dispatch('PET_SWITCH_OPEN');m.dispatch('PHOTO_OPEN',{requestId:'photo'});assert.equal(s.page,'53');
  m.dispatch('OPEN_ACTIVATE');assert.equal(s.targetCharacterId,'actual');m.dispatch('BACK');assert.equal(s.page,'186');assert.equal(Object.keys(s.photoRequests).length,1);assert.equal(s.characterId,'lumi');
});

test('Photo tasks arrive in the background and messages return to their own source',()=>{
  const {m,r,s}=fresh();r.start('settings');m.dispatch('NAVIGATE',{target:'75'});m.dispatch('OPEN_VOLUME');
  m.dispatch('REVIVE_REQUESTED',{deviceId:s.localDeviceId,requestId:'background-photo'});assert.equal(s.page,'31');
  const receipt={requestId:'background-photo',attemptId:s.photoRequests['background-photo'].attemptId};m.dispatch('REVIVE_START',receipt);m.dispatch('REVIVE_FAILED',receipt);assert.equal(s.page,'31');
  m.dispatch('NAVIGATE',{target:'77'});const doc=screenDoc('77',s);assert(doc.querySelector('[data-event="PHOTO_OPEN"]'));m.dispatch('PHOTO_OPEN',{requestId:'background-photo'});assert.equal(s.page,'102');m.dispatch('PHOTO_LATER');assert.equal(s.page,'77');
});

test('Memory retries and cancellations isolate old callbacks by session identity',()=>{
  const {m,r,s}=fresh();r.start('settings');m.dispatch('NAVIGATE',{target:'29'});m.dispatch('SOUL_CONFIRM');const old={sessionId:s.soulSessionId};m.dispatch('SOUL_READY',old);m.dispatch('SOUL_CANCEL');
  m.dispatch('BACK');assert.equal(s.page,'180');m.dispatch('NAVIGATE',{target:'29'});m.dispatch('SOUL_CONFIRM');const current={sessionId:s.soulSessionId};assert.notEqual(old.sessionId,current.sessionId);
  m.dispatch('SOUL_READY',old);assert.equal(s.page,'146');m.dispatch('SOUL_READY',current);assert.equal(s.page,'147');
  for(const event of ['SOUL_TRANSFERRED','SOUL_VERIFIED','SOUL_INTERRUPTED','SOUL_VERIFY_FAILED']){m.dispatch(event,old);assert.equal(s.page,'147',event);}
  m.dispatch('SOUL_TRANSFERRED',current);assert.equal(s.page,'148');m.dispatch('SOUL_VERIFIED');assert.equal(s.page,'148');m.dispatch('SOUL_VERIFIED',current);assert.equal(s.page,'08');assert.equal(s.soulSessionId,null);
  m.dispatch('BACK');assert.equal(s.page,'180');m.dispatch('SOUL_VERIFY_FAILED',current);assert.equal(s.page,'180');m.dispatch('BACK');assert.equal(s.page,'10');
});

test('Memory waiting and transfer timeouts expose recovery without accepting expired results',()=>{
  for(const transfer of [false,true]){
    const {m,r,s}=fresh();r.start('memories');m.dispatch('SOUL_CONFIRM');const old={sessionId:s.soulSessionId};if(transfer)m.dispatch('SOUL_READY',old);
    m.tick(120);assert.equal(s.page,'39');assert.equal(s.task,null);m.dispatch('SOUL_RESUME');assert.equal(s.page,'147');assert.notEqual(s.soulSessionId,old.sessionId);
    m.dispatch('SOUL_TRANSFERRED',old);assert.equal(s.page,'147');m.dispatch('REBOOT');assert.equal(s.soulSessionId,null);m.tick(2);assert.equal(s.page,'10');
  }
  const {m,r,s}=fresh();r.start('memories');m.dispatch('SOUL_CONFIRM');m.dispatch('BACK');assert.equal(s.page,'149');assert.equal(s.soulSessionId,null);m.dispatch('BACK');m.tick(120);assert.notEqual(s.page,'39');
  r.start('memories');m.dispatch('SOUL_CONFIRM');const sleeping={sessionId:s.soulSessionId};m.dispatch('SCREEN_OFF');assert.equal(s.page,'120');assert.equal(s.soulSessionId,null);m.dispatch('SOUL_READY',sleeping);m.tick(120);assert.equal(s.page,'120');
});

test('App reminders support validated creation, versioned updates and deletion tombstones',()=>{
  const {m,r,s}=fresh();r.start('daily');const incoming={noteId:'app-note',revision:1,note:{noteTitle:'Bring water',noteDueAt:500,noticeStatus:'scheduled'}};
  m.dispatch('NOTE_REMOTE_CREATE',incoming);assert.equal(s.notes['app-note'].noteTitle,'Bring water');assert(screenDoc('77',s).querySelector('[data-note-id="app-note"]'));
  m.dispatch('NOTE_REMOTE_UPDATE',{...incoming,note:{...incoming.note,noteTitle:'Stale'}});assert.equal(s.notes['app-note'].noteTitle,'Bring water');
  m.dispatch('NOTE_OPEN',{noteId:'app-note'});m.dispatch('NOTE_REMOTE_UPDATE',{...incoming,revision:2,note:{...incoming.note,noteTitle:'Bring lunch',noteId:'wrong',noticeVersion:99}});assert.equal(s.page,'159');assert.equal(s.notes['app-note'].noteId,'app-note');assert.equal(s.notes['app-note'].noticeVersion,2);
  m.dispatch('NOTE_REMOTE_DELETE',{noteId:'app-note',revision:3});m.dispatch('NOTE_REMOTE_CREATE',{...incoming,revision:2});assert(s.notes['app-note'].noteDeleted);assert(!screenDoc('77',s).querySelector('[data-note-id="app-note"]'));
  m.dispatch('NOTE_REMOTE_DELETE',{noteId:'arrives-late',revision:4});m.dispatch('NOTE_REMOTE_CREATE',{...incoming,noteId:'arrives-late',revision:3});assert(s.notes['arrives-late'].noteDeleted);
  for(const note of [{noteTitle:'',noteDueAt:1},{noteTitle:'Bad',noteDueAt:NaN},{noteTitle:'Bad',noteDueAt:1,noticeStatus:'bogus'}])m.dispatch('NOTE_REMOTE_CREATE',{noteId:'bad',revision:1,note});assert(!s.notes.bad);
});

test('Reminder synchronization preserves failed edits and rejects stale or incomplete acknowledgments',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('NOTE_DUE',{noteId:'note-1'});m.dispatch('NOTE_DONE');const operation=s.noteMutations[0],old={operationId:operation.operationId,attemptId:operation.attemptId};
  m.dispatch('NOTE_SYNC_RESULT',{...old,success:false,error:'offline'});assert.equal(operation.status,'failed');assert.equal(s.noticeStatus,'completed');assert.equal(s.noteMutations.length,1);
  assert(screenDoc('77',s).querySelector('[data-event="NOTE_SYNC_RETRY"]'));m.dispatch('NOTE_SYNC_RETRY');const current={operationId:operation.operationId,attemptId:operation.attemptId};assert.notEqual(current.attemptId,old.attemptId);
  m.dispatch('NOTE_SYNC_RESULT',{...old,success:true,revision:2});assert.equal(s.noteMutations.length,1);m.dispatch('NOTE_SYNC_RESULT',{...current,success:true});assert.equal(operation.status,'failed');
  m.dispatch('NOTE_SYNC_RETRY');m.dispatch('NOTE_SYNC_RESULT',{operationId:operation.operationId,attemptId:operation.attemptId,success:true,revision:2});assert.equal(s.noteMutations.length,0);assert.equal(s.notes['note-1'].noticeVersion,2);
  m.dispatch('NOTE_SYNC_RESULT',{...current,success:false});assert.equal(s.noteMutations.length,0);
});

test('Reminder sync retries after offline and timeout, and serializes edits to the same reminder',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('ENV',{key:'networkConnected',value:false});m.dispatch('NOTE_DUE',{noteId:'note-1'});m.dispatch('NOTE_LATER');const first=s.noteMutations[0];assert.equal(first.status,'pending');
  m.dispatch('NOTE_DISMISS');m.dispatch('NOTE_OPEN',{noteId:'note-1'});m.dispatch('NOTE_DONE');const second=s.noteMutations[1];assert.equal(second.status,'pending');
  m.dispatch('ENV',{key:'networkConnected',value:true});assert.equal(first.status,'sending');assert.equal(second.status,'pending');const expired=first.attemptId;m.tick(15);assert.equal(first.status,'failed');
  m.dispatch('NOTE_SYNC_RETRY');assert.notEqual(first.attemptId,expired);m.dispatch('NOTE_SYNC_RESULT',{operationId:first.operationId,attemptId:first.attemptId,success:true,revision:2});assert.equal(second.baseRevision,2);assert.equal(second.status,'sending');
  m.dispatch('NOTE_SYNC_RESULT',{operationId:second.operationId,attemptId:second.attemptId,success:true,revision:3});assert.equal(s.noteMutations.length,0);assert.equal(s.noticeStatus,'completed');
});

test('Reminders queue during settings and network input, then return through the real menu',()=>{
  const live=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=live.app.FoxPrototype.machine,s=m.state;
  live.click('#live-screen .tile-settings');live.click('#live-screen [data-target="75"]');live.click('#live-screen [data-event="OPEN_VOLUME"]');m.dispatch('SETTING',{key:'volume',value:67});m.dispatch('NOTE_DUE',{noteId:'note-1'});assert.equal(s.page,'31');
  const back=()=>live.click('#live-screen [data-event="BACK"]');back();assert.equal(s.page,'75');back();assert.equal(s.page,'180');back();assert.equal(s.page,'68');assert.equal(s.noteReturn,'74');assert.equal(s.volume,67);
  live.click('#live-screen [data-event="NOTE_LATER"]');m.tick(1.2);assert.equal(s.page,'74');m.gesture('right');assert.equal(s.page,'10');
  const network=fresh();network.r.start('settings');network.m.dispatch('OPEN_WIFI');network.m.tick(1);network.m.dispatch('WIFI_SELECT',{value:'Office'});typePassword(network.m);network.m.dispatch('NOTE_DUE',{noteId:'note-1'});assert.equal(network.s.page,'110');assert.equal(network.s.password,'demo-pass');network.m.dispatch('WIFI_JOIN');network.m.tick(2);assert.equal(network.s.page,'112');
});

test('Photo failure and deferred-result gallery links restore the correct module context',()=>{
  const gallery=openEntry('gallery.html','?lang=zh-CN&group=pet');
  const failed=gallery.doc.querySelector('#p102-shared-pet-photo');assert(failed);assert(failed.querySelector('[data-event="REVIVE_RETRY"]'));assert(!failed.querySelector('[data-event="AVATAR_RETRY"]'));
  const picker=gallery.doc.querySelector('#p186-shared-pet-photo');assert(picker.querySelector('[data-event="PHOTO_OPEN"]'));
  for(const item of [failed,picker]){const url=new URL(item.querySelector('.gallery-artboard a').getAttribute('href'),'https://prototype.invalid');assert.equal(url.searchParams.get('entry'),'photo');const live=openEntry('index.html',url.search);assert.equal(live.app.FoxPrototype.machine.state.page,url.searchParams.get('page'));assert(live.doc.querySelector(url.searchParams.get('page')==='102'?'#live-screen [data-event="REVIVE_RETRY"]':'#live-screen [data-event="PHOTO_OPEN"]'));}
  const css=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8'));assert(css.cssRules.some(r=>r.selectorText==='.fox-companions .photo-task>.ui-icon'&&r.style.position==='static'));
});

test('Canonical reminder conflicts replace optimistic state without reviving a deleted reminder',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('NOTE_DUE',{noteId:'note-1'});m.dispatch('NOTE_DONE');const operation=s.noteMutations[0];
  m.dispatch('NOTE_SYNC_RESULT',{operationId:operation.operationId,attemptId:operation.attemptId,conflict:true,revision:2,note:{noteTitle:'Updated by app',noteDueAt:900,noticeStatus:'scheduled'}});
  assert.equal(s.page,'159');assert.equal(s.noteMutations.length,0);assert.equal(s.notes['note-1'].noticeStatus,'scheduled');assert.equal(s.noteTitle,'Updated by app');
  m.dispatch('NOTE_REFRESH');m.dispatch('NOTE_OPEN',{noteId:'note-1'});m.dispatch('NOTE_DONE');const second=s.noteMutations[0];m.dispatch('NOTE_SYNC_RESULT',{operationId:second.operationId,attemptId:second.attemptId,conflict:true,revision:3,deleted:true});
  assert.equal(s.page,'159');assert(s.notes['note-1'].noteDeleted);assert.equal(s.noteMutations.length,0);assert(!screenDoc('77',s).querySelector('[data-note-id="note-1"]'));
});

test('Friends menu keeps three fixed destinations independently of friend count',()=>{
  const {s,r}=fresh();r.start('daily');
  for(const count of [0,1,12]){
    s.friends=Object.fromEntries(Array.from({length:count},(_,i)=>['peer-'+i,{peerId:'peer-'+i,peerName:'Friend '+i,pet:{id:'pet-'+i,name:'Milo',appearance:'pico'},established:true}]));
    const doc=screenDoc('185',s),rows=[...doc.querySelectorAll('.peer-menu .fox-list-row')];
    assert.deepEqual(rows.map(row=>row.querySelector('strong').textContent),['碰一碰交友','我的好友','好友消息']);
    assert.deepEqual(rows.map(row=>row.dataset.target),['54','191','165']);
    assert(!doc.querySelector('[data-event="FRIEND_OPEN"],[data-scroll-list]'));assert(!s.socialAllowed);
  }
});

test('Multiple friends preserve selection and list scroll through detail, gestures, language and errors',()=>{
  const {doc,app,click,emit}=openEntry('index.html','?page=10&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;
  s.friends=Object.fromEntries(Array.from({length:8},(_,i)=>['peer-'+i,{peerId:'peer-'+i,peerName:i===7?'A very long friend name with forty chars!':'Friend '+i,pet:{id:'pet-'+i,name:'Milo '+i,appearance:'pico'},established:true}]));
  s.friends.pending={peerId:'pending',peerName:'Not confirmed',established:false};
  click('#live-screen .dock-menu');click('#live-screen .tile-friends');click('#live-screen [data-target="191"]');assert.equal(s.page,'191');assert(!s.socialAllowed);
  m.dispatch('ENV',{key:'socialAllowed',value:true});app.FoxPrototype.render();assert.equal(doc.querySelectorAll('#live-screen [data-event="FRIEND_OPEN"]').length,8);
  const list=scrollFixture(doc,916,280);list.scrollTop=524;emit(list,'scroll');
  click('#live-screen [data-peer-id="peer-7"]');assert.equal(s.page,'56');assert.equal(s.selectedFriendId,'peer-7');
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,524);
  click('[data-gesture="right"]');assert.equal(s.page,'185');click('#live-screen [data-target="191"]');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,524);
  click('[data-locale="en"]');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,524);
  click('#live-screen [data-peer-id="peer-7"]');click('[data-gesture="right"]');assert.equal(s.page,'191');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,524);
  m.dispatch('ENV',{key:'socialAllowed',value:false});app.FoxPrototype.render();click('#live-screen [data-peer-id="peer-7"]');assert.equal(s.page,'169');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');
  m.dispatch('ENV',{key:'socialAllowed',value:true});m.dispatch('ENV',{key:'relationValid',value:false});app.FoxPrototype.render();click('#live-screen [data-peer-id="peer-7"]');assert.equal(s.page,'140');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');assert.equal(doc.querySelector('#live-screen [data-scroll-list]').scrollTop,524);
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'185');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');
});

test('Empty friend list offers discovery and returns there after cancel, denial and successful pairing',()=>{
  const {doc,app,click}=openEntry('index.html','?page=10&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;
  s.friends={};click('#live-screen .dock-menu');click('#live-screen .tile-friends');click('#live-screen [data-target="191"]');
  assert(doc.querySelector('.peer-friends-empty'));assert(doc.querySelector('#live-screen').textContent.includes('还没有好友'));assert(!doc.querySelector('#live-screen [data-event="FRIEND_OPEN"]'));
  click('#live-screen [data-event="PEER_DISCOVERY_OPEN"]');assert.equal(s.page,'169');assert(!s.socialAllowed);click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');
  m.dispatch('ENV',{key:'socialAllowed',value:true});app.FoxPrototype.render();click('#live-screen [data-event="PEER_DISCOVERY_OPEN"]');assert.equal(s.page,'54');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');
  const peer={peerId:'new-friend',peerName:'Pico owner',pet:{id:'new-pet',name:'Pico',appearance:'pico'}};
  click('#live-screen [data-event="PEER_DISCOVERY_OPEN"]');m.dispatch('PEER_TAP',peer);app.FoxPrototype.render();assert.equal(s.page,'55');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');assert.equal(Object.keys(s.friends).length,0);
  click('#live-screen [data-event="PEER_DISCOVERY_OPEN"]');m.dispatch('PEER_TAP',peer);app.FoxPrototype.render();click('#live-screen [data-event="FRIEND_REQUEST"]');assert.equal(s.page,'176');assert.equal(Object.keys(s.friends).length,0);
  const request=s.requests[s.requestId];m.dispatch('FRIEND_REMOTE_ACCEPT',{requestId:request.id,revision:request.revision,peerId:peer.peerId});app.FoxPrototype.render();assert.equal(s.page,'56');
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'191');assert(!doc.querySelector('.peer-friends-empty'));assert(doc.querySelector('#live-screen [data-peer-id="new-friend"]'));assert.equal(Object.keys(s.friends).length,1);
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'185');click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');
});

test('Friend-message unread state follows new request revisions and clears when viewed',()=>{
  const {m,r,s}=fresh();r.start('social');m.dispatch('FRIEND_OPEN',{peerId:'milo'});m.dispatch('PARTNER_REQUEST');const team=s.requests[s.requestId];
  m.dispatch('BACK');assert.equal(s.page,'165');m.dispatch('BACK');assert.equal(s.page,'185');assert(!screenDoc('185',s).querySelector('.friend-unread-dot'));
  const receipt={requestId:team.id,revision:team.revision,peerId:'milo'};m.dispatch('PARTNER_ACCEPTED',receipt);assert.equal(s.page,'185');
  const unread=screenDoc('185',s);assert(unread.querySelector('.friend-unread-dot'));assert.equal(unread.querySelector('[data-target="165"]').getAttribute('aria-label'),'好友消息，有未读消息');
  m.dispatch('NAVIGATE',{target:'165'});m.dispatch('BACK');assert(!screenDoc('185',s).querySelector('.friend-unread-dot'));m.dispatch('PARTNER_ACCEPTED',receipt);assert(!screenDoc('185',s).querySelector('.friend-unread-dot'));
  m.dispatch('FRIEND_OPEN',{peerId:'milo'});m.dispatch('AVATAR_INVITE');const avatar=s.requests[s.requestId];m.dispatch('BACK');m.dispatch('BACK');
  m.dispatch('AVATAR_REMOTE_ACCEPT',{requestId:avatar.id,revision:avatar.revision,peerId:'milo'});assert(screenDoc('185',s).querySelector('.friend-unread-dot'));
  m.dispatch('NAVIGATE',{target:'165'});m.dispatch('AVATAR_CREATED',{requestId:avatar.id,revision:avatar.revision,peerId:'milo',resultId:'unread-result',characterName:'Nova'});assert.equal(s.page,'165');assert.equal(s.friendMessageReadRevisions[avatar.id],avatar.revision);
  m.dispatch('BACK');assert(!screenDoc('185',s).querySelector('.friend-unread-dot'));m.dispatch('REBOOT');m.tick(1.5);assert.equal(s.friendMessageReadRevisions[avatar.id],avatar.revision);
});

test('Friend list and fixed menu use stable circular geometry with bounded names and local portraits',()=>{
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>[...rules].find(rule=>rule.selectorText===selector).style;
  const menu=style('.peer-menu');assert.equal(menu['grid-template-rows'],'repeat(3,80px)');assert.equal(menu.gap,'12px');
  for(const scale of [.75,1])for(const x of [80,400])for(const y of [128,408])assert(Math.hypot((x-240)*scale,(y-240)*scale)<240*scale);
  assert.equal(style('.peer-friends-list').bottom,'72px');assert.equal(style('.peer-friends-list .fox-list-row').height,'104px');assert(104*.75>=44);
  assert.equal(style('.peer-friends-list .fox-list-row strong')['-webkit-line-clamp'],'2');assert.equal(style('.peer-friends-list .fox-list-row small')['text-overflow'],'ellipsis');
  assert.equal(style('.friend-unread-dot').width,'12px');assert.equal(style('.friend-unread-dot').height,'12px');
  const {r,s}=fresh();r.preview('191');const doc=screenDoc('191',s),row=doc.querySelector('[data-peer-id="milo"]');assert(row);assert(row.querySelector('small').textContent.includes('伙伴：'));assert(row.getAttribute('title').includes('Milo'));
  const img=row.querySelector('img');assert.equal(img.width,48);assert.equal(img.height,48);assert(fs.existsSync(path.join(__dirname,img.getAttribute('src'))));
  return{scope:'DOM, CSS and logical safe-area checks; not browser-pixel verification'};
});

test('My friends has a canonical gallery page next to its menu and a working deep link',()=>{
  const section=data.groups.find(group=>group.id==='friends').sections.find(section=>section.id==='friends-list');assert.deepEqual(Array.from(section.pages,page=>page.n),['185','191']);
  const {doc}=openEntry('gallery.html','?lang=zh-CN&group=friends');assert.equal(doc.querySelectorAll('article#p191').length,1);
  assert.equal(doc.querySelector('#p185').nextElementSibling.id,'p191');assert(doc.querySelector('#p185 [data-target="191"]'));assert(!doc.querySelector('#p185 [data-event="FRIEND_OPEN"]'));assert(doc.querySelector('#p165').textContent.includes('好友消息'));
  const link=doc.querySelector('#p191 .gallery-artboard a').getAttribute('href'),url=new URL(link,'https://prototype.invalid');const live=openEntry('index.html',url.search);assert.equal(live.app.FoxPrototype.machine.state.page,'191');assert(live.doc.querySelector('#live-screen [data-event="FRIEND_OPEN"]'));
});

test('Companion swipe changes only the installed partner and preserves levels, care, inventory and return origin',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('NAVIGATE',{target:'74'});m.dispatch('NAVIGATE',{target:'93'});
  Object.assign(m.currentPet(),{level:4,feed:80,clean:95,energy:70,feedAt:600,cleanAt:300});const original=JSON.stringify(m.currentPet()),stack=JSON.stringify(s.returnStack),food=JSON.stringify(s.foodInventory);
  m.dispatch('PET_COMPANION_NEXT',{avatarId:'lumi'});assert.equal(s.page,'93');assert.equal(s.characterId,'pico');assert.equal(s.pendingCompanion,'pico');assert.equal(s.characterLevel,1);
  m.dispatch('PET_COMPANION_NEXT',{avatarId:'lumi'});assert.equal(s.characterId,'pico');
  Object.assign(m.currentPet(),{level:2,feed:60,clean:70,energy:40,feedAt:900});const pico=JSON.stringify(m.currentPet());
  m.dispatch('PET_COMPANION_PREV');assert.equal(s.characterId,'lumi');assert.equal(s.characterLevel,4);assert.equal(JSON.stringify(m.currentPet()),original);assert.equal(JSON.stringify(s.pets.pico),pico);
  m.dispatch('PET_COMPANION_PREV');assert.equal(s.characterId,'lumi');
  m.gesture('left','companions');m.gesture('left','companions');assert.equal(s.characterId,'momo');m.gesture('left','companions');assert.equal(s.characterId,'momo');
  assert.equal(JSON.stringify(s.returnStack),stack);assert.equal(JSON.stringify(s.foodInventory),food);assert.equal(s.petOrigin,'74');
  m.dispatch('PET_FEED_OPEN');assert.equal(s.page,'157');m.dispatch('PET_COMPANION_PREV');assert.equal(s.characterId,'momo');m.dispatch('BACK');assert.equal(s.page,'93');
  s.availableCompanions=s.availableCompanions.filter(c=>c.id==='momo');m.dispatch('PET_COMPANION_PREV');m.dispatch('PET_COMPANION_NEXT');assert.equal(s.characterId,'momo');
  const single=screenDoc('93',s);assert.equal(single.querySelectorAll('.pet-carousel-arrow:disabled').length,2);
  m.dispatch('BACK');assert.equal(s.page,'74');m.dispatch('PET_COMPANION_NEXT');assert.equal(s.page,'74');assert.equal(s.characterId,'momo');
});

test('Companion mouse, pen and touch swipes use scaled thresholds and never trigger care on release',()=>{
  for(const pointerType of ['mouse','pen','touch'])for(const scale of [.75,1]){
    const {doc,app,click,emit}=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;click('#live-screen .tile-pet');
    const carousel=doc.querySelector('[data-companion-carousel]');carousel.closest('.device-screen').getBoundingClientRect=()=>({width:480*scale});
    app.matchMedia=()=>({matches:false});
    emit(carousel.querySelector('.lumi-figure'),'pointerdown',{pointerId:11,pointerType,button:0,isPrimary:true,clientX:300*scale,clientY:150*scale});
    emit(doc,'pointermove',{pointerId:11,pointerType,clientX:220*scale,clientY:154*scale});assert(carousel.classList.contains('is-swiping'));assert(carousel.querySelector('.pet-carousel-card').style.transform.includes('translateX'));
    emit(doc,'pointerup',{pointerId:11,pointerType,clientX:220*scale,clientY:154*scale});assert.equal(s.page,'93');assert.equal(s.characterId,'pico');
    const release=emit(doc.querySelector('#live-screen [data-event="PET_FEED_OPEN"]'),'click',{detail:1,pointerId:11});assert(release.defaultPrevented);assert.equal(s.page,'93');assert.equal(s.foodInventory.consumedTotal,0);
    const updated=doc.querySelector('[data-companion-carousel]');const key=emit(updated,'keydown',{key:'ArrowLeft'});assert(key.defaultPrevented);assert.equal(s.characterId,'lumi');assert.equal(s.page,'93');
    emit(doc.querySelector('[data-event="PET_COMPANION_NEXT"]'),'click',{detail:0});assert.equal(s.characterId,'pico');assert(doc.querySelector('.pet-carousel-position').textContent.includes('2 / 3'));
    emit(doc.querySelector('#live-screen [data-event="BACK"]'),'click',{detail:0});assert.equal(s.page,'74');
  }
});

test('Companion gesture cancellation, vertical scrolling and background navigation do not switch or activate a partner',()=>{
  const {doc,app,click,emit,intervals}=openEntry('index.html','?page=74&mode=flow&lang=zh-CN'),m=app.FoxPrototype.machine,s=m.state;click('#live-screen .tile-pet');
  let serial=20;
  for(const [dx,dy,end]of [[-25,0,'pointerup'],[-80,100,'pointerup'],[-80,0,'pointercancel']]){
    const carousel=doc.querySelector('[data-companion-carousel]');const pointerId=++serial;
    emit(carousel,'pointerdown',{pointerId,pointerType:'touch',button:0,isPrimary:true,clientX:300,clientY:150});
    emit(doc,'pointermove',{pointerId,clientX:300+dx,clientY:150+dy});emit(doc,end,{pointerId,clientX:300+dx,clientY:150+dy});assert.equal(s.characterId,'lumi');assert.equal(s.page,'93');
  }
  const list=scrollFixture(doc,470,174);list.scrollTop=40;
  emit(list.querySelector('button'),'pointerdown',{pointerId:30,pointerType:'mouse',button:0,clientX:250,clientY:340});emit(doc,'pointermove',{pointerId:30,clientX:247,clientY:280});emit(doc,'pointerup',{pointerId:30,clientX:247,clientY:280});assert.equal(list.scrollTop,100);assert.equal(s.characterId,'lumi');
  const carousel=doc.querySelector('[data-companion-carousel]');
  emit(carousel,'pointerdown',{pointerId:31,pointerType:'mouse',button:0,clientX:300,clientY:150});emit(doc,'pointermove',{pointerId:31,clientX:220,clientY:150});
  if(!app.FoxPrototype.session.info().playing)app.FoxPrototype.session.toggleTime();const time=s.clock;for(let i=0;i<30;i++)intervals[0]();assert.equal(s.clock,time);
  assert.equal(carousel.querySelector('.pet-carousel-card').style.transform||'','');
  m.dispatch('NAVIGATE',{target:'75'});app.FoxPrototype.render();emit(doc,'pointerup',{pointerId:31,clientX:220,clientY:150});assert.equal(s.page,'75');assert.equal(s.characterId,'lumi');
  m.dispatch('NAVIGATE',{target:'93'});app.FoxPrototype.render();const screen=doc.querySelector('#live-screen .device-screen');
  emit(screen,'pointerdown',{pointerId:32,pointerType:'mouse',button:0,clientX:150,clientY:230});emit(screen,'pointerup',{pointerId:32,clientX:235,clientY:232});assert.notEqual(s.page,'93');assert.equal(s.characterId,'lumi');
});

test('Friend pet import wording is distinct from friendship and companion navigation stays discoverable',()=>{
  const {m,r,s}=fresh();r.start('social');m.dispatch('FRIEND_OPEN',{peerId:'milo'});const friends=JSON.stringify(s.friends),available=JSON.stringify(s.availableCompanions);
  const detail=screenDoc('56',s);assert.equal(detail.querySelector('[data-event="PEER_IMPORT_OPEN"]').textContent.trim(),'添加宠物');assert(!detail.querySelector('.device-screen').textContent.includes('添加伙伴'));
  m.dispatch('PEER_IMPORT_OPEN');assert.equal(s.page,'188');assert(screenDoc('188',s).querySelector('.device-screen').textContent.includes('将对方宠物添加到本机？'));m.dispatch('PEER_IMPORT_CANCEL');assert.equal(s.page,'56');assert.equal(JSON.stringify(s.friends),friends);assert.equal(JSON.stringify(s.availableCompanions),available);
  m.dispatch('NAVIGATE',{target:'93'});const profile=screenDoc('93',s);assert(!profile.querySelector('.pet-switch-header button'));assert.equal(profile.querySelector('[data-event="PET_SWITCH_OPEN"] .list-item-label').textContent,'管理伙伴');assert(profile.querySelector('[data-scroll-list] [data-event="PET_SWITCH_OPEN"]'));
  assert.equal(profile.querySelector('[data-event="PET_COMPANION_PREV"]').getAttribute('aria-label'),'上一个伙伴');assert.equal(profile.querySelector('[data-event="PET_COMPANION_NEXT"]').getAttribute('aria-label'),'下一个伙伴');
  assert(profile.querySelector('.pet-carousel-position[role="status"]'));assert(profile.querySelector('.pet-switch-name').getAttribute('title'));assert(profile.querySelector('.pet-carousel-card img').getAttribute('src'));
});

test('Dock acknowledgment lasts 1.5 seconds and repeated or stale signals cannot restart it',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('DOCK_CONNECTED');assert.equal(s.page,'23');
  const sessionId=s.dock.sessionId,at=s.auto.at;m.dispatch('DOCK_FEEDBACK_DONE',{sessionId});assert.equal(s.page,'23');
  m.tick(1);m.dispatch('DOCK_CONNECTED');assert.equal(s.dock.sessionId,sessionId);assert.equal(s.auto.at,at);
  m.tick(.49);assert.equal(s.page,'23');m.tick(.01);assert.equal(s.page,'24');assert.equal(s.dock.feedbackUntil,null);assert.equal(s.battery,78);
  m.dispatch('DOCK_FEEDBACK_DONE',{sessionId});assert.equal(s.page,'24');m.gesture('up');assert.equal(s.page,'74');m.dispatch('BACK');assert.equal(s.page,'24');
  m.dispatch('DOCK_REMOVED',{sessionId});assert.equal(s.page,'10');m.dispatch('DOCK_CONNECTED');const next=s.dock.sessionId;assert.notEqual(next,sessionId);
  m.dispatch('DOCK_FEEDBACK_DONE',{sessionId});m.dispatch('DOCK_REMOVED',{sessionId});assert.equal(s.page,'23');assert.equal(s.dock.sessionId,next);
  m.dispatch('DOCK_REMOVED',{sessionId:next});m.tick(2);assert.equal(s.page,'10');assert(!s.dock.connected);
});

test('Dock battery reports validate session, revision and full charge without resetting idle state',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('DOCK_CONNECTED');m.tick(1.5);
  const sessionId=s.dock.sessionId;s.idleSeconds=12;s.statusMessage='Existing task message';
  const before=JSON.stringify([s.page,s.battery,s.idleSeconds,s.enteredAt,s.auto,s.statusMessage,s.dock]);
  for(const patch of [{sessionId:'old'},{revision:0},{revision:1.5},{battery:-1},{battery:101},{battery:50.5},{battery:'100'},{status:'full',battery:99},{status:'invalid'}]){
    m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:90,status:'charging',...patch});assert.equal(JSON.stringify([s.page,s.battery,s.idleSeconds,s.enteredAt,s.auto,s.statusMessage,s.dock]),before);
  }
  m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:100,status:'full'});assert.equal(s.page,'26');assert.equal(s.battery,100);assert.equal(s.idleSeconds,12);assert.equal(s.statusMessage,'Existing task message');
  m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:80,status:'charging'});assert.equal(s.page,'26');
  m.dispatch('CHARGE_UPDATED',{sessionId,revision:2,battery:99,status:'charging'});assert.equal(s.page,'24');
  m.dispatch('DOCK_REMOVED',{sessionId});m.dispatch('CHARGE_UPDATED',{sessionId,revision:3,battery:100,status:'full'});assert.equal(s.battery,99);assert.equal(s.page,'10');
});

test('Dock acknowledgment interrupted by controls, notifications or power confirmation returns to standby',()=>{
  for(const event of ['controls','notifications','power']){
    const {m,r,s}=fresh();r.start('daily');m.dispatch('DOCK_CONNECTED');assert.equal(s.page,'23');
    if(event==='power')m.dispatch('POWER_CONFIRM');else m.gesture(event==='controls'?'left':'down');
    assert.equal(s.page,{controls:'75',notifications:'77',power:'118'}[event]);assert.equal(s.auto,null);
    m.tick(2);m.dispatch('BACK');assert.equal(s.page,'24');assert.equal(s.dock.feedbackUntil,null);
  }
});

test('Dock attach, full and detach preserve recording, conversation, settings, password and system tasks',()=>{
  const checked=[];
  for(const page of ['71','14','110','180','35','148','93']){
    const {m,r,s}=fresh();r.preview(page);if(page==='110')typePassword(m,'Secret123');
    const fields=['page','task','password','showPassword','seconds','currentRecording','recording','aiSessionId','aiRequestId','aiActive','auto','returnStack','petIntent','characterId','soulSessionId','idleSeconds'];
    const snapshot=()=>JSON.stringify(fields.map(key=>s[key]));const before=snapshot();
    m.dispatch('DOCK_CONNECTED');assert.equal(snapshot(),before,page+' attach');const sessionId=s.dock.sessionId;
    m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:100,status:'full'});assert.equal(snapshot(),before,page+' full');
    m.dispatch('DOCK_REMOVED',{sessionId});assert.equal(snapshot(),before,page+' detach');checked.push(page);
  }
  return checked;
});

test('Dock charging follows AOD, screen-off and wake preferences without battery traffic keeping it awake',()=>{
  for(const mode of ['black','aod']){
    const {m,r,s}=fresh();r.start('daily');s.displayMode=mode;
    m.dispatch('DOCK_CONNECTED');m.tick(1.5);s.idleSeconds=29;
    const sessionId=s.dock.sessionId;m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:90,status:'charging'});assert.equal(s.idleSeconds,29);
    m.tick(1);assert.equal(s.page,mode==='aod'?'79':'120');const sleeping=s.page;
    m.dispatch('CHARGE_UPDATED',{sessionId,revision:2,battery:100,status:'full'});assert.equal(s.page,sleeping);
    if(mode==='aod'){
      const doc=screenDoc('79',s);assert(doc.querySelector('.charge-page.is-charge-dim .charge-ring'));assert.equal(doc.querySelector('.charge-state h2').textContent,'已充满');assert(!doc.querySelector('.clock,.standby-clock,.standby-battery,.character-button,.charge-menu'));
    }
    m.dispatch('WAKE');assert.equal(s.page,'26');m.dispatch('SCREEN_OFF');m.dispatch('DOCK_REMOVED',{sessionId});assert.equal(s.page,sleeping);
    if(mode==='aod'){const doc=screenDoc('79',s);assert(!doc.querySelector('.charge-state'));assert(doc.querySelector('.standby-battery'));}
    m.dispatch('DOCK_CONNECTED');assert.equal(s.page,sleeping);assert.equal(s.auto,null);m.dispatch('WAKE');assert.equal(s.page,'24');
  }
  const {m,r,s}=fresh();r.start('daily');m.dispatch('POWER_OFF');assert(!s.powerOn);m.dispatch('DOCK_CONNECTED');assert(!s.powerOn);assert.equal(s.page,'120');
});

test('Dock contact errors defer during tasks and charge receipts cannot dismiss thermal or low-battery protection',()=>{
  const {m,r,s}=fresh();r.start('settings');m.dispatch('DOCK_CONNECTED');const sessionId=s.dock.sessionId;
  m.dispatch('DOCK_CONTACT_ERROR',{sessionId});assert.equal(s.page,'180');assert(s.dock.errorPending);assert(!s.dock.connected);
  m.dispatch('CHARGE_UPDATED',{sessionId,revision:1,battery:100,status:'full'});assert.equal(s.battery,78);
  m.dispatch('NAVIGATE',{target:'10'});assert.equal(s.page,'45');assert(!s.dock.errorPending);
  m.dispatch('DOCK_CONNECTED');assert.equal(s.page,'23');m.tick(1.5);m.dispatch('THERMAL_LIMIT');assert.equal(s.page,'48');assert.equal(s.dock.status,'paused');
  m.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:1,battery:100,status:'full'});assert.equal(s.page,'48');assert.equal(s.safety,'thermal');assert.equal(s.dock.status,'paused');
  m.dispatch('THERMAL_CLEAR');assert.equal(s.page,'24');assert.equal(s.dock.status,'paused');
  m.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:2,battery:100,status:'full'});assert.equal(s.page,'26');
  m.dispatch('BATTERY_CRITICAL');assert.equal(s.page,'34');m.dispatch('DOCK_REMOVED',{sessionId:s.dock.sessionId});m.dispatch('POWER_CONNECTED');assert.equal(s.page,'34');assert(s.dock.connected);m.dispatch('SAFETY_CLEAR');assert.equal(s.page,'24');
});

test('Dock standby supports companionship and returns reminders, growth and AI to its current home',()=>{
  const {m,r,s}=fresh();r.start('daily');m.dispatch('DOCK_CONNECTED');m.tick(1.5);
  m.dispatch('NAVIGATE',{target:'82'});m.dispatch('CARE_START');m.dispatch('BACK');assert.equal(s.page,'24');assert(s.careActive);
  const careSessionId=s.careSessionId;m.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:1,battery:90,status:'charging'});assert.equal(s.careSessionId,careSessionId);
  m.dispatch('CARE_SOUND',{careSessionId});assert.equal(s.page,'59');m.tick(6);assert.equal(s.page,'24');assert(s.careActive);
  m.dispatch('CARE_END');m.dispatch('NAVIGATE',{target:'10'});assert.equal(s.page,'24');m.dispatch('AI_START');assert.equal(s.page,'14');assert.equal(s.aiOrigin,'24');
  m.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:2,battery:100,status:'full'});assert.equal(s.page,'14');m.dispatch('AI_END');m.tick(2);assert.equal(s.page,'26');
  m.dispatch('LEVEL_UPDATED',{avatarId:s.characterId,level:2});assert.equal(s.page,'18');m.dispatch('BACK');assert.equal(s.page,'26');
  m.dispatch('NOTE_DUE',{noteId:s.noteId});assert.equal(s.page,'68');m.dispatch('NOTE_DISMISS');assert.equal(s.page,'26');
});

test('Dock home variants retain ordinary home events and physical friendship returns to charging standby',()=>{
  for(const id of ['24','26']){
    for(const route of data.transitions['10'].filter(r=>r.event!=='DOCK_CONNECTED'))assert(data.transitions[id].some(r=>r.event===route.event&&r.target===route.target),id+' '+route.event);
    const {m,r,s}=fresh();r.preview(id);m.dispatch('OPEN_MENU');assert.equal(s.page,'74');m.dispatch('BACK');assert.equal(s.page,id);
    m.dispatch('ENV',{key:'socialAllowed',value:true});s.friendsOrigin='74';
    m.dispatch('PEER_TAP',{peerId:'dock-peer',peerName:'Pico',pet:{id:'dock-peer-pet',name:'Momo',appearance:'momo'}});assert.equal(s.page,'55');assert.equal(s.friendsOrigin,id);
    m.dispatch('BACK');assert.equal(s.page,'185');m.dispatch('BACK');assert.equal(s.page,id);
  }
});

test('Dock content synchronization is independent of full charge and isolates reconnects, retries and late results',()=>{
  const {m,r,s}=fresh();r.preview('25');let receipt={sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId};
  m.dispatch('DOCK_SYNC_DONE',receipt);assert.equal(s.page,'24');assert.equal(s.battery,78);assert.equal(s.dockSync.status,'complete');
  m.dispatch('DOCK_SYNC_START');receipt={sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId};m.dispatch('BACK');const deadline=s.dockSync.deadline;m.dispatch('DOCK_SYNC_START');assert.equal(s.page,'25');assert.equal(s.dockSync.attemptId,receipt.attemptId);assert.equal(s.dockSync.deadline,deadline);m.dispatch('BACK');m.gesture('up');assert.equal(s.page,'74');
  m.dispatch('DOCK_SYNC_DONE',receipt);assert.equal(s.page,'74');assert.equal(s.dockSync.status,'complete');m.dispatch('BACK');assert.equal(s.page,'24');
  m.dispatch('DOCK_SYNC_START');receipt={sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId};m.dispatch('DOCK_REMOVED',receipt);assert.equal(s.page,'46');assert(screenDoc('46',s).querySelector('[data-event="DOCK_SYNC_START"]').disabled);
  m.dispatch('DOCK_SYNC_START');assert.equal(s.page,'46');m.dispatch('DOCK_CONNECTED');assert.equal(s.page,'46');m.dispatch('DOCK_SYNC_START');assert.equal(s.page,'25');
  m.dispatch('DOCK_SYNC_DONE',receipt);assert.equal(s.page,'25');const current={sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId};m.dispatch('DOCK_SYNC_FAILED',current);assert.equal(s.page,'47');
  m.dispatch('DOCK_SYNC_START');m.dispatch('DOCK_SYNC_DONE',current);assert.equal(s.page,'25');m.tick(120);assert.equal(s.page,'47');
  m.dispatch('DOCK_SYNC_START');m.dispatch('CHARGE_UPDATED',{sessionId:s.dock.sessionId,revision:1,battery:100,status:'full'});assert.equal(s.page,'25');
  m.dispatch('DOCK_SYNC_DONE',{sessionId:s.dock.sessionId,attemptId:s.dockSync.attemptId});assert.equal(s.page,'26');assert.equal(s.dockSync.status,'complete');
});

test('Dock simulation controls automatically advance the live acknowledgment and preserve static review modes',()=>{
  const {doc,app,click,intervals}=openEntry('index.html','?page=10&mode=flow&lang=zh-CN'),s=app.FoxPrototype.machine.state,r=app.FoxPrototype.session;
  click('[data-dock="connect"]');assert.equal(s.page,'23');assert(r.info().playing);for(let i=0;i<14;i++)intervals[0]();assert.equal(s.page,'23');intervals[0]();assert.equal(s.page,'24');
  assert(doc.querySelector('#live-screen .charge-state'));assert(!doc.querySelector('#live-screen .character-button,#live-screen .clock,#live-screen .home-dock'));assert.equal(doc.querySelector('#live-screen .charge-state h2').textContent,'充电中');
  click('[data-gesture="up"]');click('#live-screen .tile-settings');assert.equal(s.page,'180');click('[data-dock="full"]');assert.equal(s.page,'180');
  click('#live-screen [data-event="BACK"]');assert.equal(s.page,'74');click('[data-gesture="right"]');assert.equal(s.page,'26');assert.equal(doc.querySelector('#live-screen .charge-state h2').textContent,'已充满');assert(!doc.querySelector('#live-screen .character-button,#live-screen .clock,#live-screen .home-dock'));
  click('[data-dock="remove"]');assert.equal(s.page,'10');assert(!doc.querySelector('#live-screen .dock-charge-label'));
  const transient=openEntry('index.html','?page=10&mode=flow&lang=zh-CN');transient.click('[data-dock="connect"]');assert.equal(transient.app.FoxPrototype.machine.state.page,'23');transient.click('[data-gesture="up"]');assert.equal(transient.app.FoxPrototype.machine.state.page,'74');transient.click('#live-screen .app-tile-chat');assert.equal(transient.app.FoxPrototype.machine.state.page,'14');transient.click('#live-screen [data-event="AI_END"]');for(let i=0;i<24;i++)transient.intervals[0]();assert.equal(transient.app.FoxPrototype.machine.state.page,'74');transient.click('[data-gesture="right"]');assert.equal(transient.app.FoxPrototype.machine.state.page,'24');
  const direct=openEntry('index.html','?page=23&mode=flow&lang=zh-CN');assert(direct.app.FoxPrototype.session.info().playing);for(let i=0;i<16;i++)direct.intervals[0]();assert.equal(direct.app.FoxPrototype.machine.state.page,'24');
  const catalog=openEntry('index.html','?page=23&mode=catalog&lang=zh-CN');for(let i=0;i<30;i++)catalog.intervals[0]();assert.equal(catalog.app.FoxPrototype.machine.state.page,'23');assert(!catalog.app.FoxPrototype.session.info().playing);
  assert(direct.app.FoxPrototype.session.back());assert.equal(direct.app.FoxPrototype.machine.state.page,'23');assert(!direct.app.FoxPrototype.session.info().playing);
});

test('Dock gallery states stay together and use one consistent charging state layout',()=>{
  const system=data.groups.find(g=>g.id==='system');assert.deepEqual(Array.from(system.sections[0].pages,p=>p.n),['23','24','26']);assert.deepEqual(Array.from(system.sections[1].pages,p=>p.n),['25']);assert.deepEqual(Array.from(system.sections[2].pages,p=>p.n),['45','46','47']);
  const {r,s}=fresh();
  for(const id of ['23','24','26']){r.preview(id);const doc=screenDoc(id,s),root=doc.querySelector('.device-screen');assert(!root.textContent.includes('正在底座上'));assert(!root.textContent.includes('同步'));assert(!root.querySelector('[data-event="BACK"]'));assert(root.querySelector('.charge-state'));assert(root.querySelector('.charge-ring'));assert(root.querySelector('.charge-icon svg'));assert(!root.querySelector('.clock,.character-button,.home-dock,.dock-state-banner'));assert(root.querySelector('.charge-menu[data-event="OPEN_MENU"]'));assert(!pages.find(p=>p.n===id).title.includes('充电待机'));}
  const rules=CSSOM.parse(fs.readFileSync(path.join(__dirname,'complete-ui.css'),'utf8')).cssRules;
  const style=selector=>[...rules].filter(rule=>rule.selectorText===selector).at(-1).style;
  const ring=style('.charge-ring');assert.equal(ring.width,'214px');assert.equal(ring.height,'214px');assert(70+214+28<480);
  return{basis:'DOM and logical CSS geometry only; browser rendering is not verified',sharedLayout:['23','24','26'],chargeState:'214px ring with status and menu chevron'};
});

const inventory=[['模块','流程阶段','页面类别','页号','页面名称','方案范围','声明分支数']];
fs.writeFileSync(path.join(__dirname,'effective-project-data.json'),JSON.stringify(data,null,2));
fs.writeFileSync(path.join(__dirname,'flow-order.json'),JSON.stringify(data.groups.map(g=>({id:g.id,title:g.title,sections:g.sections.map(section=>({id:section.id,title:section.title,kind:section.kind,pages:section.pages.map(p=>p.n),related:section.related.map(p=>p.n),links:section.links}))})),null,2));
for(const group of data.groups)for(const section of group.sections)for(const page of section.pages)inventory.push([ctx.FoxLocale.translate(group.title),section.title,sandbox.FoxFlow.kinds[section.kind].label,'P'+page.n,ctx.FoxLocale.translate(page.title),'当前方案',String((data.transitions[page.n]||[]).length)]);
fs.writeFileSync(path.join(__dirname,'page-inventory.csv'),'\uFEFF'+inventory.map(row=>row.map(value=>'"'+value.replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n');
const report={at:new Date().toISOString(),scope:'Node state machine and DOM structure tests; no browser visual certification',passed:results.filter(t=>t.pass).length,total:results.length,results};
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,total:report.total}));
process.exitCode=report.passed===report.total?0:1;
