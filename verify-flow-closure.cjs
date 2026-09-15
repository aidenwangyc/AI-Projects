const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Reuse only fixture helpers. Loading the full verifier would run tests and write reports.
const verifier = fs.readFileSync(path.join(__dirname, 'verify-complete.cjs'), 'utf8');
const marker = "test('Previous menu-network revision remains byte-for-byte unchanged'";
assert(verifier.includes(marker), 'Missing safe fixture boundary');
const h = new Function('require', '__dirname', verifier.slice(0, verifier.indexOf(marker)) + '\nreturn {fresh,screenDoc,openEntry,typePassword,data,pages,ctx};')(require, __dirname);
const checkOnly = process.argv.includes('--check-only');
const tests = [];
function check(name, run, category = 'recovery') {
  try { tests.push({ name, category, pass: true, evidence: run() }); }
  catch (error) { tests.push({ name, category, pass: false, error: error.stack }); }
}
function restore(target, snapshot) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, structuredClone(snapshot));
}
function businessState(state) {
  const copy = { ...state };
  for (const key of ['logs', 'idleSeconds', 'statusMessage']) delete copy[key];
  return JSON.stringify(copy);
}
function payload(node) {
  const result = {};
  for (const key of ['target', 'key', 'value', 'mode', 'noteId', 'requestId', 'recordId', 'avatarId', 'actionId', 'feedbackId', 'peerId', 'attemptId']) {
    if (node.dataset[key] !== undefined) result[key] = node.dataset[key];
  }
  if (node.dataset.baseRevision !== undefined) result.baseRevision = Number(node.dataset.baseRevision);
  return result;
}
function alreadySelected(event, value, state) {
  return event === 'LANGUAGE_SET' && value === (state.deviceLanguage || state.language)
    || event === 'COMPANION_SELECT' && value === state.pendingCompanion
    || event === 'DISPLAY_MODE' && (value === 'aod' ? 'aod' : 'black') === state.displayMode
    || event === 'KEYBOARD_MODE' && value === state.keyboardMode;
}
const known = new Set([...h.pages.map(page => page.n), ...Object.keys(h.data.runtimePages || {})]);
const incoming = new Map([...known].map(id => [id, []]));
const invalidTargets = [];
const nonRouteEntries = {
  '12': { kind: 'hardware-input', source: 'Valid physical tap' },
  '13': { kind: 'hardware-input', source: 'Device turned face down' },
  '11': { kind: 'hardware-input', source: 'Tap or flip during night hours' },
  '18': { kind: 'app-callback', source: 'LEVEL_UPDATED for the current character' },
  '67': { kind: 'timer-state', source: 'Configured reminder becomes due early' },
  '135': { kind: 'conditional-empty-state', source: 'Notification list has no remaining items' },
  '57': { kind: 'remote-device-callback', source: 'Established friend sends a preset interaction' },
  '51': { kind: 'app-initiated-flow', source: 'App requests creation from a photographed figure' },
  '33': { kind: 'hardware-callback', source: 'BATTERY_LOW from BMS' },
  '34': { kind: 'hardware-callback', source: 'BATTERY_CRITICAL from BMS' }
};
for (const [from, routes] of Object.entries(h.data.transitions)) {
  if (!known.has(from)) invalidTargets.push({ from, reason: 'missing-source' });
  for (const route of routes) {
    if (!known.has(route.target)) invalidTargets.push({ from, event: route.event, target: route.target });
    else incoming.get(route.target).push({ from, event: route.event, guard: route.guard });
  }
}
const fixture = h.fresh();
const actionMachine = h.fresh();
const pageAudits = [];
for (const page of h.pages) {
  fixture.r.preview(page.n);
  const snapshot = structuredClone(fixture.s);
  const doc = h.screenDoc(page.n, snapshot);
  const root = doc.querySelector('.device-screen');
  const actions = [];
  for (const node of root.querySelectorAll('button[data-event]')) {
    const event = node.dataset.event;
    const command = payload(node);
    const name = node.getAttribute('aria-label') || node.textContent.trim();
    if (node.disabled || node.hasAttribute('disabled')) {
      actions.push({ name, event, target: command.target || null, result: 'disabled-guard', reason: node.getAttribute('title') || node.textContent.trim() });
      continue;
    }
    restore(actionMachine.s, snapshot);
    const before = businessState(actionMachine.s);
    let error = null;
    try { actionMachine.m.dispatch(event, command); } catch (caught) { error = caught.message; }
    const after = actionMachine.s;
    let result = error ? 'exception' : after.page !== page.n ? 'navigated' : before !== businessState(after) ? 'state-updated' : after.statusMessage ? 'guarded' : alreadySelected(event, command.value, snapshot) ? 'already-selected' : event === 'NOOP' ? 'read-only' : 'unexplained-noop';
    actions.push({ name, event, payload: command, result, destination: after.page, reason: error || after.statusMessage || null, note: result === 'read-only' ? 'Explicit NOOP control; not a write action' : undefined });
  }
  const inputs = [...root.querySelectorAll('input[data-setting]')].map(node => {
    const setting = node.dataset.setting;
    const samples = [];
    for (const value of [Number(node.getAttribute('min')), Number(node.getAttribute('max'))]) {
      restore(actionMachine.s, snapshot);
      const before = businessState(actionMachine.s);
      const event = setting === 'playhead' ? 'RECORD_SEEK' : 'SETTING';
      actionMachine.m.dispatch(event, { key: setting, value });
      samples.push({ value, event, destination: actionMachine.s.page, result: before !== businessState(actionMachine.s) ? 'state-updated' : actionMachine.s.statusMessage ? 'guarded' : 'already-at-boundary', reason: actionMachine.s.statusMessage || null });
    }
    return { setting, type: node.type, min: node.getAttribute('min'), max: node.getAttribute('max'), name: node.getAttribute('aria-label'), samples };
  });
  const routes = h.data.transitions[page.n] || [];
  const renderedEvents = new Set(actions.map(action => action.event));
  const externalBranches = routes.filter(route => !renderedEvents.has(route.event)).map(route => ({ event: route.event, target: route.target, guard: route.guard, label: route.label, classification: 'declared-unrendered-branch', note: 'May be a device callback, physical gesture, dynamic object action, or review injection; declaration is not real-device validation.' }));
  const entry = incoming.get(page.n) || [];
  const nonRouteEntry = nonRouteEntries[page.n];
  const entryKind = ['01', '10'].includes(page.n) ? 'root' : entry.length ? 'declared-route' : nonRouteEntry && page.trigger ? nonRouteEntry.kind : 'unexplained-orphan';
  pageAudits.push({ id: page.n, title: page.title, module: h.data.groups.find(group => group.pages.some(item => item.n === page.n))?.id, entryKind, nonRouteEntry, trigger: page.trigger, incoming: entry, actions, inputs, externalBranches, exits: routes.filter(route => route.target !== page.n), userMessage: root.textContent.trim(), verification: 'Each enabled rendered command dispatched independently from a prepared catalog fixture; real sequence tests are separate.', mode: actions.length || inputs.length ? 'locally-interactive-fixture' : 'passive-or-external-device-state' });
}
check('Every canonical page is inventoried and all targets exist', () => {
  assert.equal(pageAudits.length, h.pages.length);
  assert.equal(new Set(pageAudits.map(page => page.id)).size, h.pages.length);
  assert.deepEqual(invalidTargets, []);
  assert.deepEqual(pageAudits.filter(page => page.entryKind === 'unexplained-orphan').map(page => page.id), []);
  return { canonicalPages: pageAudits.length, runtimeOnly: [...known].filter(id => !pageAudits.some(page => page.id === id)) };
}, 'structure');
check('Rendered commands have observable outcomes or a specifically named guard', () => {
  const unresolved = pageAudits.flatMap(page => page.actions.filter(action => ['exception', 'unexplained-noop'].includes(action.result)).map(action => ({ page: page.id, ...action })));
  assert.deepEqual(unresolved, []);
  return { commands: pageAudits.reduce((sum, page) => sum + page.actions.length, 0), evidence: 'Observable outcome is not proof of the intended destination; sequential tests check important return paths.' };
}, 'commands');
function entry() {
  const app = h.openEntry('index.html', '?page=10&mode=flow&lang=zh-CN');
  app.m = app.app.FoxPrototype.machine;
  app.s = app.m.state;
  app.render = app.app.FoxPrototype.render;
  app.click('#live-screen .dock-menu');
  assert.equal(app.s.page, '74');
  return app;
}
function click(app, event, suffix = '') { app.click('#live-screen [data-event="' + event + '"]' + suffix); }
function back(app) { click(app, 'BACK'); }
function at(app, id) { assert.equal(app.s.page, id); }
function external(app, event, data = {}) { app.m.dispatch(event, {...(event.startsWith('SOUL_')?{sessionId:app.s.soulSessionId}:{}),...data}); app.render(); }
function elapsed(app, seconds) {
  for (let index = 0; index < Math.ceil(seconds * 10) + 2; index++) for (const callback of app.intervals) callback();
}
check('All seven visible menu entries open through actual DOM controls and return', () => {
  const paths = [];
  for (const [selector, target] of [['.tile-pet', '93'], ['.tile-settings', '180'], ['.tile-mint', '70'], ['.tile-peach:not(.app-tile-chat)', '82'], ['.tile-lavender', '187'], ['.app-tile-chat', '14'], ['.tile-friends', '185']]) {
    const app = entry(); app.click('#live-screen ' + selector); at(app, target);
    if (target === '14') { click(app, 'AI_END'); elapsed(app, 2.2); }
    else back(app);
    at(app, '74'); paths.push('74 ->' + target + ' ->74');
  }
  return paths;
}, 'menu-entry');
check('Charging state opens all seven menu entries and returns through full charge and undocking', () => {
  const paths=[];
  for(const [selector,target] of [['.tile-pet','93'],['.tile-settings','180'],['.tile-mint','70'],['.tile-peach:not(.app-tile-chat)','82'],['.tile-lavender','187'],['.app-tile-chat','14'],['.tile-friends','185']]){
    const app=h.openEntry('index.html','?page=10&mode=flow&lang=zh-CN');app.m=app.app.FoxPrototype.machine;app.s=app.m.state;
    app.click('[data-dock="connect"]');at(app,'23');elapsed(app,1.6);at(app,'24');assert(app.doc.querySelector('#live-screen .charge-state'));app.click('[data-gesture="up"]');at(app,'74');
    app.click('#live-screen '+selector);at(app,target);app.click('[data-dock="full"]');at(app,target);
    if(target==='14'){click(app,'AI_END');elapsed(app,2.2);}else back(app);
    at(app,'74');app.click('[data-gesture="right"]');at(app,'26');assert.equal(app.doc.querySelector('#live-screen .charge-state h2').textContent,'已充满');
    app.click('[data-dock="remove"]');at(app,'10');paths.push('23 -> timed24 -> 74 -> '+target+' -> 74 -> 26 -> 10');
  }
  return paths;
},'menu-entry');
check('Dock synchronization can recover after removal without declaring a full battery', () => {
  const app=h.openEntry('index.html','?page=25&mode=flow&lang=zh-CN');app.m=app.app.FoxPrototype.machine;app.s=app.m.state;app.render=app.app.FoxPrototype.render;
  const old={sessionId:app.s.dock.sessionId,attemptId:app.s.dockSync.attemptId};app.click('[data-dock="remove"]');at(app,'46');assert(app.doc.querySelector('[data-event="DOCK_SYNC_START"]').disabled);
  app.click('[data-dock="connect"]');at(app,'46');click(app,'DOCK_SYNC_START');at(app,'25');external(app,'DOCK_SYNC_DONE',old);at(app,'25');
  external(app,'DOCK_SYNC_FAILED',{sessionId:app.s.dock.sessionId,attemptId:app.s.dockSync.attemptId});at(app,'47');click(app,'DOCK_SYNC_START');at(app,'25');
  external(app,'DOCK_SYNC_DONE',{sessionId:app.s.dock.sessionId,attemptId:app.s.dockSync.attemptId});at(app,'24');assert.equal(app.s.battery,78);
  return '25 -> detach46 -> connect46 -> retry25 -> failure47 -> retry25 -> synced24 at 78%';
},'recovery');
check('Fresh menu conversation timers start without the review Play button', () => {
  const app = entry();
  app.click('#live-screen .app-tile-chat'); at(app, '14');
  click(app, 'AI_INPUT_END'); at(app, '15'); elapsed(app, 2.2); at(app, '16');
  click(app, 'AI_END'); at(app, '76'); elapsed(app, 1.5); at(app, '74');
  return '10 -> 74 -> 14 -> 15 -> timed16 -> 76 -> timed74';
}, 'timers');
check('Companion carousel swipes return through feeding and management to the original menu', () => {
  const app=entry();app.click('#live-screen .tile-pet');at(app,'93');
  const swipe=(dx,id)=>{
    const carousel=app.doc.querySelector('[data-companion-carousel]');
    app.emit(carousel,'pointerdown',{pointerId:id,pointerType:'touch',button:0,isPrimary:true,clientX:250,clientY:150});
    app.emit(app.doc,'pointermove',{pointerId:id,clientX:250+dx,clientY:152});
    app.emit(app.doc,'pointerup',{pointerId:id,clientX:250+dx,clientY:152});
  };
  swipe(-80,1);at(app,'93');assert.equal(app.s.characterId,'pico');swipe(80,2);assert.equal(app.s.characterId,'lumi');
  const activate=event=>app.emit(app.doc.querySelector('#live-screen [data-event="'+event+'"]'),'click',{detail:0});
  activate('PET_FEED_OPEN');at(app,'157');assert.equal(app.s.foodInventory.consumedTotal,0);activate('BACK');at(app,'93');
  activate('PET_SWITCH_OPEN');at(app,'186');activate('COMPANION_CANCEL');at(app,'93');activate('BACK');at(app,'74');
  return {path:'74 ->93 Lumi ->swipe Pico ->swipe Lumi ->157 no food ->93 ->186 management ->93 ->74',source:'Touch pointer events on the companion region; no review page jumps',inventoryConsumed:0};
}, 'menu-entry');
check('Fresh menu Wi-Fi scan and reminder playback run device timers', () => {
  const wifi = entry(); wifi.click('#live-screen .tile-settings'); click(wifi, 'OPEN_WIFI'); at(wifi, '126'); elapsed(wifi, 1.5); at(wifi, '109'); back(wifi); at(wifi, '180'); back(wifi); at(wifi, '74');
  const note = entry(); note.click('#live-screen .tile-lavender'); note.click('#live-screen [data-target="77"]');
  click(note, 'NOTE_OPEN'); const origin = note.s.page; click(note, 'SINGLE_PLAY'); at(note, '162'); elapsed(note, 2.5); at(note, origin); back(note); at(note, '77'); back(note); at(note, '187'); back(note); at(note, '74');
  return { wifi: '74 -> 180 ->126 -> timed109 ->180 ->74', reminder: '74 ->187 ->77 ->detail ->162 -> timed detail ->77 ->187 ->74' };
}, 'timers');
check('General settings privacy and other children return to their actual parent', () => {
  const app = entry(); app.click('#live-screen .tile-settings'); app.click('#live-screen [data-target="75"]');
  for (const id of ['30', '31', '32', '172', '173', '28']) { app.click('#live-screen [data-target="' + id + '"]'); at(app, id); back(app); at(app, '75'); }
  back(app); at(app, '180'); back(app); at(app, '74');
  return '74 ->180 ->75 ->[30,31,32,172,173,28] ->75 ->180 ->74';
});
check('Memories failed verification retry succeeds without returning to an old error', () => {
  const app = entry(); app.click('#live-screen .tile-settings'); app.click('#live-screen [data-target="29"]'); click(app, 'SOUL_CONFIRM');
  external(app, 'SOUL_READY'); external(app, 'SOUL_TRANSFERRED'); external(app, 'SOUL_VERIFY_FAILED'); at(app, '40'); click(app, 'SOUL_REAUTHORIZE'); at(app, '29');
  click(app, 'SOUL_CONFIRM'); external(app, 'SOUL_READY'); external(app, 'SOUL_TRANSFERRED'); external(app, 'SOUL_VERIFIED'); at(app, '08'); back(app); at(app, '180'); back(app); at(app, '74');
  return { path: '74 ->180 ->29 ->146 ->147 ->148 ->40 ->retry29 ->146 ->147 ->148 ->08 ->180 ->74', externalCallbacks: ['SOUL_READY', 'SOUL_TRANSFERRED', 'SOUL_VERIFY_FAILED', 'SOUL_VERIFIED'] };
});
check('Saved recording result and record-again preserve the recording menu', () => {
  for (const resultId of ['123', '171']) {
    const app = entry(); app.click('#live-screen .tile-mint'); click(app, 'REC_START'); elapsed(app, 2); click(app, 'REC_STOP'); elapsed(app, 1.5);
    if (resultId === '171') external(app, 'NAVIGATE', { target: '171' });
    at(app, resultId); app.click('#live-screen [data-target="124"]'); at(app, '124'); click(app, 'RECORD_LIST_BACK'); at(app, '70'); back(app); at(app, '74');
  }
  const again = entry(); again.click('#live-screen .tile-mint'); again.click('#live-screen [data-target="124"]'); at(again, '124'); click(again, 'REC_NEW'); at(again, '70'); back(again); at(again, '74');
  return { resultPath: '74 ->70 ->71 ->122 ->123/171 ->124 ->70 ->74', retryPath: '70 ->empty124 ->REC_NEW70 ->74', fixtureNote: 'P171 alternative receipt is explicitly injected after a real saved recording.' };
});
check('Daily reminder completion and step-error retry return through Daily', () => {
  const app = entry(); app.click('#live-screen .tile-lavender'); app.click('#live-screen [data-target="103"]'); external(app, 'STEPS_FAILED'); at(app, '107'); click(app, 'STEPS_RETRY'); at(app, '103'); back(app); at(app, '187');
  app.click('#live-screen [data-target="77"]'); click(app, 'NOTE_OPEN'); assert(['134', '68'].includes(app.s.page)); click(app, 'NOTE_DONE'); at(app, '69'); click(app, 'NOTE_DISMISS'); at(app, '77'); back(app); at(app, '187'); back(app); at(app, '74');
  return '74 ->187 ->103 ->107 ->103 ->187 ->77 ->134/68 ->69 ->77 ->187 ->74';
});
check('Partner rest starts the real timer runner and returns to the same partner menu', () => {
  const app = entry(); app.click('#live-screen .tile-pet'); at(app, '93');
  // Keep this timing test independent of the unrelated sample reminder due at ten minutes.
  app.s.noteDueAt = Infinity; for (const note of Object.values(app.s.notes)) { note.noticeStatus = 'scheduled'; note.noteDueAt = Infinity; }
  click(app, 'PET_REST_OPEN'); at(app, '96'); click(app, 'PET_REST'); at(app, '175');
  elapsed(app, 2.2); assert(app.s.clock > 0); const deadline = app.m.currentPet().restAt;
  app.m.tick(deadline - app.s.clock); app.render(); at(app, '93'); back(app); at(app, '74');
  return { path: '74 ->93 ->96 ->175 -> timed93 ->74', timing: 'Real interval callbacks start the clock; the remaining 15-minute duration is accelerated through machine.tick.' };
}, 'timers');
check('Friends details, updates, greeting success and revoke return to coherent sources', () => {
  const app = entry(); app.click('#live-screen .tile-friends'); at(app, '185'); app.click('#live-screen [data-target="165"]'); at(app, '165'); back(app); at(app, '185');
  external(app, 'ENV', { key: 'socialAllowed', value: true }); app.click('#live-screen [data-target="191"]'); at(app, '191'); click(app, 'FRIEND_OPEN'); at(app, '56'); click(app, 'GREETING_OPEN'); at(app, '136'); click(app, 'GREETING_WAVE'); at(app, '137');
  elapsed(app, 2.2); at(app, '138'); back(app); at(app, '56');
  click(app, 'GREETING_OPEN'); click(app, 'GREETING_WAVE'); at(app, '137'); external(app, 'ENV', { key: 'socialAllowed', value: false }); assert(['169', '140'].includes(app.s.page));
  back(app); at(app, '56'); back(app); at(app, '191'); back(app); at(app, '185'); back(app); at(app, '74');
  return { path: '74 ->185 ->165 ->185 ->191 ->56 ->136 ->137 -> timed138 ->56; revoke137 ->169/140 ->56 ->191 ->185 ->74', externalPrecondition: 'App-side social permission explicitly simulated before sending.' };
}, 'permissions');
check('Friend activities have a visible detail entry and preserve the selected friend on every return', () => {
  const app = entry(); external(app, 'ENV', { key: 'socialAllowed', value: true }); app.click('#live-screen .tile-friends'); app.click('#live-screen [data-target="191"]'); click(app, 'FRIEND_OPEN'); at(app, '56');
  const friendId = app.s.selectedFriendId;
  for (const child of ['88', '141']) {
    app.click('#live-screen [data-target="87"]'); at(app, '87'); app.click('#live-screen [data-target="' + child + '"]'); at(app, child); back(app); at(app, '87'); back(app); at(app, '56'); assert.equal(app.s.selectedFriendId, friendId);
  }
  external(app, 'ENV', { key: 'socialAllowed', value: false }); app.click('#live-screen [data-target="87"]'); at(app, '169'); back(app); at(app, '56'); assert.equal(app.s.selectedFriendId, friendId);
  back(app); at(app, '191'); back(app); at(app, '185'); back(app); at(app, '74');
  return { path: '74 ->185 ->191 ->56 ->87 ->[88,141] ->87 ->56; permission denied87 ->169 ->56 ->191 ->185 ->74', source: 'Actual visible More interactions control, not a review-only page link' };
});
check('Pet feeding is a closed App-inventory flow with one shared consumable per action', () => {
  const app = entry(); app.click('#live-screen .tile-pet'); at(app, '93');
  assert.equal(app.s.foodInventory.purchasedTotal, 0); click(app, 'PET_FEED_OPEN'); at(app, '157'); assert.equal(app.s.petUnavailableReason, 'FOOD_EMPTY');
  click(app, 'FOOD_SYNC_REQUEST'); const failedRequest = app.s.foodInventory.requestId; external(app, 'FOOD_SYNC_FAILED', { requestId: failedRequest, error: 'service' }); at(app, '157'); assert.equal(app.s.foodInventory.purchasedTotal, 0);
  click(app, 'FOOD_SYNC_REQUEST'); const requestId = app.s.foodInventory.requestId; external(app, 'FOOD_INVENTORY_SYNC', { deviceId: app.s.localDeviceId, requestId, revision: 1, purchasedTotal: 2 });
  at(app, '94'); click(app, 'BACK'); at(app, '93'); assert.equal(app.s.foodInventory.consumedTotal, 0);
  click(app, 'PET_FEED_OPEN'); const valid = { ...app.s.petIntent }; external(app, 'PET_FEED', valid); at(app, '93'); assert.equal(app.s.foodInventory.consumedTotal, 1); external(app, 'PET_FEED', valid); assert.equal(app.s.foodInventory.consumedTotal, 1);
  click(app, 'PET_SWITCH_OPEN'); click(app, 'COMPANION_SELECT', '[data-value="pico"]'); click(app, 'COMPANION_COMMIT'); at(app, '93'); click(app, 'PET_FEED_OPEN'); const second = { ...app.s.petIntent }; external(app, 'PET_FEED', second); at(app, '93'); assert.equal(app.s.foodInventory.consumedTotal, 2);
  external(app, 'FOOD_SYNC_REQUEST'); const stale = app.s.foodInventory.requestId; external(app, 'FOOD_INVENTORY_SYNC', { deviceId: 'other-device', revision: 9, purchasedTotal: 99 }); assert.equal(app.s.foodInventory.purchasedTotal, 2); external(app, 'FOOD_SYNC_FAILED', { requestId: stale, error: 'offline' }); assert.equal(app.s.foodInventory.status, 'error');
  back(app); at(app, '74');
  return { path: '74 ->93 ->157(empty) ->failed-sync157 ->retry ->94 ->93(cancel) ->94 ->93(consumes one) ->93(replay ignored) ->186 ->93(second pet consumes one) ->74', requestId, externalCallbacks: ['FOOD_INVENTORY_SYNC is a modeled App purchase receipt, not a real billing integration', 'FOOD_SYNC_FAILED'] };
}, 'integration');
function tapFriend(app, peerId = 'device-pico') {
  external(app, 'ENV', { key: 'socialAllowed', value: true });
  app.click('#live-screen .tile-friends'); click(app, 'PEER_DISCOVERY_OPEN'); at(app, '54');
  external(app, 'PEER_TAP', { peerId, peerName: 'Pico owner', pet: { id: 'pico-local', name: 'Pico', appearance: 'pico' } }); at(app, '55');
  click(app, 'FRIEND_REQUEST'); at(app, '176');
  const request = app.s.requests[app.s.requestId];
  external(app, 'FRIEND_REMOTE_ACCEPT', { requestId: request.id, revision: request.revision }); at(app, '56');
  return peerId;
}
check('Tap, bilateral friendship, import cancel and successful import close without switching characters', () => {
  const app = entry(); const active = app.s.characterId; const peerId = tapFriend(app);
  assert(app.s.friends[peerId]?.established); click(app, 'PEER_IMPORT_OPEN'); at(app, '188');
  click(app, 'PEER_IMPORT_CANCEL'); at(app, '56'); assert.equal(app.s.characterId, active);
  click(app, 'PEER_IMPORT_OPEN'); click(app, 'PEER_IMPORT_CONFIRM'); at(app, '189');
  const attemptId = app.s.peerImport.attemptId; const companionId = app.s.peerImport.companionId;
  elapsed(app, 2.2); at(app, '56'); assert.equal(app.s.characterId, active);
  assert.equal(app.s.availableCompanions.filter(item => item.id === companionId).length, 1);
  external(app, 'PEER_IMPORT_SUCCESS', { attemptId }); assert.equal(app.s.availableCompanions.filter(item => item.id === companionId).length, 1);
  back(app); at(app, '185'); back(app); at(app, '74');
  app.click('#live-screen .tile-pet'); click(app, 'PET_SWITCH_OPEN');
  assert(app.doc.querySelector('#live-screen [data-event="COMPANION_SELECT"][data-value="' + companionId + '"]'));
  click(app, 'COMPANION_CANCEL'); at(app, '93'); back(app); at(app, '74');
  return { path: '74 ->185 ->54 ->55 ->176 ->56 ->188 ->cancel56 ->188 ->189 ->timed56 ->185 ->74;93 ->186 sees imported partner', externalCallbacks: ['PEER_TAP', 'FRIEND_REMOTE_ACCEPT'], importId: companionId };
}, 'integration');
check('Import errors, cancelled attempts and stale callbacks do not add or activate partners', () => {
  const app = entry(); tapFriend(app); click(app, 'PEER_IMPORT_OPEN'); click(app, 'PEER_IMPORT_CONFIRM'); at(app, '189');
  const first = app.s.peerImport.attemptId; const id = app.s.peerImport.companionId; const active = app.s.characterId;
  external(app, 'PEER_IMPORT_FAILED', { attemptId: first, error: 'network' }); at(app, '190');
  assert(!app.s.availableCompanions.some(item => item.id === id)); click(app, 'PEER_IMPORT_RETRY'); at(app, '189');
  const second = app.s.peerImport.attemptId; assert.notEqual(first, second);
  external(app, 'PEER_IMPORT_SUCCESS', { attemptId: first }); at(app, '189'); assert(!app.s.availableCompanions.some(item => item.id === id));
  click(app, 'PEER_IMPORT_CANCEL'); at(app, '56'); external(app, 'PEER_IMPORT_SUCCESS', { attemptId: second }); assert(!app.s.availableCompanions.some(item => item.id === id)); assert.equal(app.s.characterId, active);
  return { path: '189 ->failed190 ->retry189 ->cancel56', rejectedCallbacks: ['success from prior attempt', 'success after cancellation'] };
}, 'concurrency');
check('Import cannot precede bilateral consent and validates permissions, offline state and storage', () => {
  const unconfirmed = entry(); external(unconfirmed, 'ENV', { key: 'socialAllowed', value: true }); unconfirmed.click('#live-screen .tile-friends'); click(unconfirmed, 'PEER_DISCOVERY_OPEN');
  external(unconfirmed, 'PEER_TAP', { peerId: 'device-unconfirmed', peerName: 'Peer', pet: { id: 'pet', name: 'Pico', appearance: 'pico' } });
  external(unconfirmed, 'PEER_IMPORT_OPEN'); assert.notEqual(unconfirmed.s.page, '188'); assert(!unconfirmed.s.availableCompanions.some(item => item.sourcePeerId === 'device-unconfirmed'));
  const guards = [];
  for (const key of ['socialAllowed', 'storageAvailable', 'networkConnected']) {
    const app = entry(); tapFriend(app, 'guard-' + key); click(app, 'PEER_IMPORT_OPEN');
    external(app, 'ENV', { key, value: false });
    if (app.s.page === '188') click(app, 'PEER_IMPORT_CONFIRM');
    assert.notEqual(app.s.page, '189'); assert(app.s.statusMessage || ['169', '140', '190'].includes(app.s.page));
    assert(!app.s.availableCompanions.some(item => item.sourcePeerId === 'guard-' + key)); guards.push({ key, page: app.s.page, message: app.s.statusMessage });
  }
  return { noImportBeforeRemoteAcceptance: true, guards };
}, 'permissions');

check('Activation confirmation and failed retry retain their chosen character across background generation', () => {
  const paths = [];
  for (const retry of [false, true]) {
    const app = entry(); external(app, 'ENV', { key: 'socialAllowed', value: true }); app.click('#live-screen .tile-friends');
    function createRequest() {
      app.click('#live-screen [data-target="191"]'); at(app, '191');
      click(app, 'FRIEND_OPEN', '[data-peer-id="milo"]'); app.click('#live-screen [data-target="87"]'); app.click('#live-screen [data-target="141"]'); click(app, 'AVATAR_INVITE');
      const request = app.s.requests[app.s.requestId]; external(app, 'AVATAR_REMOTE_ACCEPT', { requestId: request.id, revision: request.revision, peerId: 'milo' }); at(app, '91'); return request;
    }
    const first = createRequest(); external(app, 'AVATAR_CREATED', { requestId: first.id, revision: first.revision, peerId: 'milo', resultId: 'alpha-owned', characterName: 'Alpha' }); back(app); back(app); at(app, '185');
    const second = createRequest(); back(app); click(app, 'OPEN_REQUEST', '[data-request-id="' + first.id + '"]'); at(app, '92'); click(app, 'OPEN_ACTIVATE'); at(app, '154');
    assert.equal(app.s.targetCharacterId, 'alpha-owned');
    let failedSerial;
    if (retry) { click(app, 'AVATAR_ACTIVATE'); failedSerial = app.s.activationSerial; external(app, 'AVATAR_ACTIVATE_FAILED'); at(app, '156'); }
    external(app, 'AVATAR_CREATED', { requestId: second.id, revision: second.revision, peerId: 'milo', resultId: 'beta-owned', characterName: 'Beta' });
    assert.equal(app.s.requests[second.id].resultId, 'beta-owned'); assert.equal(app.s.targetCharacterId, 'alpha-owned'); assert.equal(app.s.newCharacterId, 'alpha-owned');
    click(app, 'AVATAR_ACTIVATE'); at(app, '155');
    if (retry) { external(app, 'AVATAR_ACTIVATED', { serial: failedSerial }); at(app, '155'); }
    elapsed(app, 2); at(app, '93'); assert.equal(app.s.characterId, 'alpha-owned'); assert.equal(app.s.characterName, 'Alpha'); assert.equal(app.s.availableCompanions.filter(item => item.id === 'alpha-owned').length, 1); assert(!app.s.availableCompanions.some(item => item.id === 'beta-owned'));
    external(app, 'AVATAR_ACTIVATED', { serial: app.s.activationSerial }); assert.equal(app.s.availableCompanions.filter(item => item.id === 'alpha-owned').length, 1);
    external(app, 'OPEN_REQUEST', { requestId: second.id }); at(app, '92'); click(app, 'OPEN_ACTIVATE'); assert.equal(app.s.targetCharacterId, 'beta-owned');
    paths.push(retry ? 'Alpha154 ->failed156 ->background Beta ready ->retry Alpha155 ->Alpha93; explicitly select Beta afterwards' : 'Alpha154 ->background Beta ready ->Alpha155 ->Alpha93; explicitly select Beta afterwards');
  }
  return paths;
}, 'concurrency');

check('A background friendship confirmation cannot replace a visible friend or strand a greeting', () => {
  const outcomes = [];
  for (const send of [false, true]) {
    const app = entry(); external(app, 'ENV', { key: 'socialAllowed', value: true }); app.click('#live-screen .tile-friends'); click(app, 'PEER_DISCOVERY_OPEN');
    external(app, 'PEER_TAP', { peerId: 'background-peer', peerName: 'Pico owner', pet: { id: 'pet', name: 'Pico', appearance: 'pico' } }); click(app, 'FRIEND_REQUEST');
    const request = app.s.requests[app.s.requestId], receipt = { requestId: request.id, revision: request.revision, peerId: 'background-peer' };
    app.click('[data-gesture="right"]'); at(app, '165'); back(app); app.click('#live-screen [data-target="191"]'); click(app, 'FRIEND_OPEN', '[data-peer-id="milo"]'); at(app, '56');
    if (send) { click(app, 'GREETING_OPEN'); click(app, 'GREETING_WAVE'); at(app, '137'); }
    external(app, 'FRIEND_REMOTE_ACCEPT', receipt); assert.equal(app.s.selectedFriendId, 'milo'); assert(app.s.friends['background-peer'].established);
    if (send) { elapsed(app, 2); at(app, '138'); assert.equal(app.s.messageStatus, 'sent'); assert.equal(app.s.messagePeerId, 'milo'); back(app); }
    at(app, '56'); assert(app.doc.querySelector('#live-screen').textContent.includes('Milo')); back(app); at(app, '191'); click(app, 'FRIEND_OPEN', '[data-peer-id="background-peer"]'); at(app, '56'); assert.equal(app.s.selectedFriendId, 'background-peer');
    outcomes.push(send ? 'Greeting to Milo completes while another friend accepts in background' : 'Milo detail stays selected until the new friend is explicitly opened');
  }
  return outcomes;
}, 'concurrency');

check('Syncing an unchanged exhausted food balance completes without an error or free food', () => {
  const app = entry(); app.click('#live-screen .tile-pet'); click(app, 'PET_FEED_OPEN'); at(app, '157');
  click(app, 'FOOD_SYNC_REQUEST'); external(app, 'FOOD_INVENTORY_SYNC', { deviceId: app.s.localDeviceId, requestId: app.s.foodInventory.requestId, revision: 1, purchasedTotal: 1 }); at(app, '94'); click(app, 'PET_FEED'); at(app, '93');
  const consumed = app.s.foodInventory.consumedTotal; app.m.tick(300); app.render(); app.click('#live-screen .dock-menu'); app.click('#live-screen .tile-pet'); click(app, 'PET_FEED_OPEN'); at(app, '157');
  click(app, 'FOOD_SYNC_REQUEST'); const requestId = app.s.foodInventory.requestId;
  const receipt = { deviceId: app.s.localDeviceId, requestId, revision: 1, purchasedTotal: 1 }; external(app, 'FOOD_INVENTORY_SYNC', receipt);
  assert.equal(app.s.foodInventory.status, 'synced'); assert.equal(app.s.foodInventory.error, null); at(app, '157'); assert(!app.doc.querySelector('#live-screen').textContent.includes('失败'));
  elapsed(app, 16); assert.equal(app.s.foodInventory.status, 'synced'); assert.equal(app.s.foodInventory.consumedTotal, consumed); assert.equal(app.s.foodInventory.purchasedTotal - consumed, 0);
  external(app, 'FOOD_INVENTORY_SYNC', receipt); assert.equal(app.s.foodInventory.consumedTotal, consumed); assert(!app.doc.querySelector('#live-screen [data-event="FOOD_SYNC_REQUEST"]').disabled); back(app); at(app, '93'); back(app); at(app, '74');
  return 'Consume one App-purchased food ->empty157 ->same-version App receipt ->synced, still empty157 ->93 ->74';
}, 'recovery');

check('App photo creation remains accessible from companions after Later and failed activation', () => {
  const app=entry();app.click('#live-screen .tile-pet');
  external(app,'REVIVE_REQUESTED',{deviceId:app.s.localDeviceId,requestId:'photo-delivery'});at(app,'51');
  const receipt={requestId:'photo-delivery',attemptId:app.s.photoRequests['photo-delivery'].attemptId};external(app,'REVIVE_START',receipt);at(app,'52');
  external(app,'REVIVE_SUCCESS',{...receipt,resultId:'photo-delivery-pet',characterName:'New Toy'});at(app,'53');click(app,'PHOTO_LATER');at(app,'93');
  click(app,'PET_SWITCH_OPEN');at(app,'186');click(app,'PHOTO_OPEN');at(app,'53');click(app,'OPEN_ACTIVATE');at(app,'154');click(app,'AVATAR_ACTIVATE');at(app,'155');
  external(app,'AVATAR_ACTIVATE_FAILED');at(app,'156');click(app,'AVATAR_ACTIVATE');elapsed(app,2);at(app,'93');assert.equal(app.s.characterId,'photo-delivery-pet');back(app);at(app,'74');
  return 'App ->51 ->52 ->53 ->Later93 ->186 ->53 ->154 ->155 ->failed156 ->retry155 ->93 ->74';
});

check('Photo failure queries the same task and never enters friend requests', () => {
  const app=entry();app.click('#live-screen .tile-pet');external(app,'REVIVE_REQUESTED',{deviceId:app.s.localDeviceId,requestId:'photo-retry'});
  const old={requestId:'photo-retry',attemptId:app.s.photoRequests['photo-retry'].attemptId};external(app,'REVIVE_START',old);external(app,'REVIVE_FAILED',old);at(app,'102');click(app,'REVIVE_RETRY');at(app,'52');
  external(app,'REVIVE_SUCCESS',{...old,resultId:'stale',characterName:'Old'});at(app,'52');
  external(app,'REVIVE_SUCCESS',{requestId:'photo-retry',attemptId:app.s.photoRequests['photo-retry'].attemptId,resultId:'right-photo',characterName:'Toy'});at(app,'53');click(app,'PHOTO_LATER');at(app,'93');back(app);at(app,'74');
  assert.equal(Object.keys(app.s.requests).length,0);assert.equal(Object.keys(app.s.photoRequests).length,1);
  return 'Photo failure102 ->query52 ->valid result53 ->93 ->74; no friend request created';
});

check('New App reminders and failed synchronization have a visible retry in Daily', () => {
  const app=entry();external(app,'NOTE_REMOTE_CREATE',{noteId:'new-app-note',revision:1,note:{noteTitle:'Bring water',noteDueAt:100,noticeStatus:'scheduled'}});
  app.click('#live-screen .tile-lavender');app.click('#live-screen [data-target="77"]');click(app,'NOTE_OPEN','[data-note-id="new-app-note"]');at(app,'134');click(app,'NOTE_DONE');at(app,'69');
  const op=app.s.noteMutations[0],stale={operationId:op.operationId,attemptId:op.attemptId};external(app,'NOTE_SYNC_RESULT',{...stale,success:false});elapsed(app,1.5);at(app,'77');click(app,'NOTE_SYNC_RETRY');
  external(app,'NOTE_SYNC_RESULT',{...stale,success:true,revision:2});assert.equal(app.s.noteMutations.length,1);
  external(app,'NOTE_SYNC_RESULT',{operationId:op.operationId,attemptId:op.attemptId,success:true,revision:2});assert.equal(app.s.noteMutations.length,0);assert(!app.doc.querySelector('#live-screen [data-event="NOTE_SYNC_RETRY"]'));
  back(app);at(app,'187');back(app);at(app,'74');return 'App reminder ->Daily ->77 ->134 ->done69 ->failed sync77 ->retry ->acknowledged77 ->187 ->74';
});

check('Reminder arrival does not interrupt settings and preserves the menu return path', () => {
  const app=entry();app.click('#live-screen .tile-settings');app.click('#live-screen [data-target="75"]');click(app,'OPEN_VOLUME');at(app,'31');external(app,'NOTE_DUE',{noteId:'note-1'});at(app,'31');
  back(app);at(app,'75');back(app);at(app,'180');back(app);at(app,'68');assert.equal(app.s.noteReturn,'74');click(app,'NOTE_LATER');elapsed(app,2.2);at(app,'74');app.m.gesture('right');at(app,'10');
  return '31 with queued reminder ->75 ->180 ->menu reminder68 ->later133 ->74 ->10';
});

const failures = tests.filter(test => !test.pass);
const report = {
  at: new Date().toISOString(),
  featureOverview: { scope: 'Current circular-screen prototype: canonical pages, independent prepared-fixture commands, and menu-entry sequences including App-confirmed purchased food.', limitations: ['No browser screenshot or physical hit-area validation.', 'No real microphone, emotion model, wireless device, network service, or filesystem persistence integration.', 'No real App storefront, payment order verification or durable purchased-food ledger.', 'Declared external branches are inventoried but are not automatically treated as executed.', 'A graph path alone is not considered behavioral closure.'] },
  edgeCaseCategories: { inputValidation: 'P1: explicit matching device identity, safe integer inventory/revision values, no stale or decreasing cumulative purchase totals. Same-version replies must match the active sync request and exact cumulative total.', boundaryConditions: 'P1: zero stock, exactly one item per valid action, fullness/cooldown/rest blocks and 15-second synchronization deadline; an unchanged balance completes synchronization without replenishing food.', errors: 'P1: modeled synchronization offline/permission/service/timeout failures preserve confirmed stock and expose a retry or return path. Activation retry keeps the originally confirmed character.', concurrency: 'P1: wrong/stale action IDs and sync request IDs, duplicate callbacks, cancellation and per-object state do not consume or replenish stock. Background friend acceptance and character generation cannot replace the visible friend, greeting recipient or activation target.', integrations: 'P1: App receipt callbacks are explicitly simulated, shared inventory survives character switches and modeled reboot; unrendered device/review branches are separately listed.' },
  pages: pageAudits,
  errorMessages: pageAudits.filter(page => /失败|异常|不可用|已满|过期|超时|中断/.test(page.title)).map(page => ({ id: page.id, title: page.title, message: page.userMessage })),
  recoveryPaths: tests.filter(test => test.category === 'recovery'),
  testScenarios: tests,
  summary: { pages: pageAudits.length, commands: pageAudits.reduce((sum, page) => sum + page.actions.length, 0), locallyInteractivePages: pageAudits.filter(page => page.mode === 'locally-interactive-fixture').length, passiveOrExternalPages: pageAudits.filter(page => page.mode !== 'locally-interactive-fixture').length, passed: tests.length - failures.length, total: tests.length, failures: failures.map(test => test.name) }
};
if (!checkOnly) {
  fs.writeFileSync(path.join(__dirname, 'flow-closure-audit.json'), JSON.stringify(report, null, 2));
  const rows = [['Page', 'Title', 'Module', 'Entry', 'Mode', 'Controls', 'Inputs', 'Unrendered branches', 'Unresolved commands']];
  for (const page of pageAudits) rows.push([page.id, page.title, page.module, page.entryKind, page.mode, String(page.actions.length), String(page.inputs.length), String(page.externalBranches.length), page.actions.filter(action => ['exception', 'unexplained-noop'].includes(action.result)).map(action => action.event).join(' | ')]);
  fs.writeFileSync(path.join(__dirname, 'flow-closure-audit.csv'), '\uFEFF' + rows.map(row => row.map(cell => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n');
}
console.log(JSON.stringify({ summary: report.summary, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
