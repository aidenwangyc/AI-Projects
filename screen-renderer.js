(function (global) {
  'use strict';

  const MODES = ['lower', 'upper', 'symbols'];
  const CHARACTERS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    symbols: '0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
  };
  const DEFAULTS = {
    password: '', keyboardMode: 'lower', keyboardPage: 0, showPassword: false,
    volume: 40, brightness: 55, seconds: 8, careRemaining: 1800,
    ssid: 'Home', micLocked: false, quiet: false, cloudAvailable: true, wifiEnabled: true, networkConnected: true,
    characterName: 'Lumi', noteTitle: 'Bring your umbrella', stepCount: 4820,
    time: '15:31', date: 'Wed, Sep 9', temperature: '26', battery: 78,
    petFeed: 60, petClean: 60, petEnergy: 60, noticeStatus:'due', restRemaining:'15:00'
  };

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function interpolate(value, context) {
    return String(value == null ? '' : value).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(context, key) ? String(context[key]) : match;
    });
  }

  function text(value, context) { return escape(interpolate(value, context)); }
  function number(value, fallback, min, max) {
    const parsed = Number.parseFloat(value);
    return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }

  function attributes(item, defaultEvent) {
    const event = item.event || defaultEvent || (item.target ? 'NAVIGATE' : '');
    const value = item.value != null ? item.value : /^WIFI_SELECT/.test(event) ? item.label : null;
    return (event ? ' data-event="' + escape(event) + '"' : '') +
      (item.target != null ? ' data-target="' + escape(item.target) + '"' : '') +
      (item.key != null ? ' data-key="' + escape(item.key) + '"' : '') +
      (item.noteId != null ? ' data-note-id="' + escape(item.noteId) + '"' : '') +
      (item.requestId != null ? ' data-request-id="' + escape(item.requestId) + '"' : '') +
      (item.avatarId != null ? ' data-avatar-id="' + escape(item.avatarId) + '"' : '') +
      (item.actionId != null ? ' data-action-id="' + escape(item.actionId) + '"' : '') +
      (item.baseRevision != null ? ' data-base-revision="' + escape(item.baseRevision) + '"' : '') +
      (value != null ? ' data-value="' + escape(value) + '"' : '') +
      (item.disabled ? ' disabled aria-disabled="true"' : '');
  }

  function actionButton(item, context, extraClass) {
    const label = interpolate(item.label || 'Continue', context);
    const lengthClass = label.length > 24 ? ' label-long' : label.length > 14 ? ' label-medium' : '';
    const tone = ['primary', 'danger', 'quiet', 'secondary'].includes(item.tone) ? item.tone : 'secondary';
    const symbolName={PET_FEED:'Apple',PET_CLEAN:'Sparkles',PET_REST:'Moon'}[item.event]||item.icon;
    const symbol=symbolName&&(item.iconOnly||label.length<=11)?icon(symbolName):'';
    return '<button type="button" class="screen-action action-'+tone+lengthClass+' '+(extraClass||'')+(symbol?' action-with-icon':'')+(symbol&&item.iconOnly?' action-icon-only':'')+'" aria-label="'+escape(label)+'" title="'+escape(label)+'"'+attributes(item)+'>'+symbol+(!item.iconOnly||!symbol?'<span>'+escape(label)+'</span>':'')+'</button>';
  }

  function icon(name){
    const node=global.lucide?.icons[name];if(!node)return '';
    const svg=global.lucide.createElement(node);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('class','ui-icon');svg.setAttribute('data-icon',name);return svg.outerHTML;
  }

  function actions(ui, context) {
    const ranks={cancel:0,keep:0,back:1,defer:2,close:3,command:4,destructive:4};
    const items = Array.isArray(ui.actions) ? [...ui.actions].sort((a,b)=>(ranks[a.actionRole]??4)-(ranks[b.actionRole]??4)) : [];
    if (!items.length) return '';
    const singleLeft=items.length===1&&['cancel','keep','back','defer','close'].includes(items[0].actionRole)&&items[0].label!=='Done';
    return '<div class="screen-actions action-count-' + items.length + (singleLeft?' single-retreat':'') + '">' + items.map(function (item) {
      return actionButton(item, context);
    }).join('') + '</div>';
  }

  function label(ui, context) {
    return ui.label ? '<div class="screen-label">' + (ui.headerBack?'<span>'+text(ui.label, context)+'</span>':text(ui.label, context)) + '</div>' : '';
  }

  function figure(context, className) {
    return '<img class="lumi-figure ' + (className || '') + '" src="assets/lumi-character.png" alt="' + text(context.characterName, context) + '" draggable="false">';
  }

  function qrCode() {
    const size = 21;
    const cells = Array.from({ length: size }, function () { return Array(size).fill(null); });
    function finder(left, top) {
      for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
        const px = left + x, py = top + y;
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        if (x === -1 || y === -1 || x === 7 || y === 7) cells[py][px] = false;
        else cells[py][px] = x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      }
    }
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (cells[y][x] !== null) continue;
      cells[y][x] = ((x * 17 + y * 31 + x * y * 7 + 13) % 11) < 5;
    }
    return '<div class="qr-code-wrap"><div class="qr-code" role="img" aria-label="Setup QR code">' + cells.flat().map(cell => '<i class="' + (cell ? 'is-on' : '') + '"></i>').join('') + '</div></div>';
  }

  function wave() {
    const levels = [0, 2, 4, 3, 5, 3, 4, 2, 0];
    return '<div class="screen-wave" aria-hidden="true">' + Array.from({ length: 9 }, function (_, i) {
      return '<i style="--bar:' + levels[i] + ';--delay:' + (i * 0.09) + 's"></i>';
    }).join('') + '</div>';
  }

  function status(ui, context) {
    const hasFigure = !!ui.character;
    return label(ui, context) + '<div class="screen-content ' + (hasFigure ? 'content-with-character' : '') + '">' +
      (hasFigure ? (ui.sceneIcon?'<div class="status-character">'+figure(context)+'<span class="pet-scene-symbol" aria-hidden="true">'+icon(ui.sceneIcon)+'</span></div>':figure(context)) : ui.qrCode ? qrCode() : ui.visualIcon ? '<div class="status-symbol'+(ui.pairedDevice?' paired-devices':'')+'" aria-hidden="true">' + (ui.pairedDevice?'<span>'+icon(ui.pairingIcon||'Smartphone')+'</span>'+icon('ArrowLeftRight')+'<span class="paired-round-screen">'+figure(context)+'</span>':icon(ui.visualIcon)) + '</div>' : '') +
      (ui.text ? '<div class="screen-title"'+(ui.networkIdentity?' translate="no"':'')+'>' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div>' + actions(ui, context);
  }

  function character(ui, context) {
    const animated = /listen|speaking|play|think/i.test([ui.label, ui.text, ui.animation].join(' '));
    const thinking = /think/i.test([ui.label, ui.text, ui.animation].join(' '));
    const characterAction = ui.characterAction;
    const characterMarkup = characterAction ? '<button type="button" class="character-touch" aria-label="' + text(characterAction.label || 'Interrupt', context) + '"' + attributes(characterAction) + '>' + figure(context) + '</button>' : figure(context);
    return label(ui, context) + '<div class="character-stage">' + characterMarkup + '</div>' +
      '<div class="character-caption">' +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div>' +
      (animated ? (thinking ? '<div class="screen-spinner" aria-hidden="true"></div>' : wave()) : '') + actions(ui, context);
  }

  function progress(ui, context) {
    const raw = ui.value != null ? interpolate(ui.value, context) : ui.progress != null ? ui.progress : null;
    const determinate = raw != null && Number.isFinite(Number.parseFloat(raw));
    const value = number(raw, 0, 0, 100);
    return label(ui, context) + '<div class="progress-content">' +
      (ui.character ? figure(context, 'progress-character') : '<div class="progress-mark ' + (determinate ? '' : 'is-indeterminate') + '" aria-hidden="true">' + (determinate ? '<span>' + Math.round(value) + '<small>%</small></span>' : '') + '</div>') +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') +
      '<div class="screen-progress ' + (determinate ? '' : 'is-indeterminate') + '" role="progressbar" aria-label="' + text(ui.label || ui.text || 'Progress', context) + '"' + (determinate ? ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value + '"' : '') + '><i style="width:' + (determinate ? value : 35) + '%"></i></div></div>' + actions(ui, context);
  }

  function list(ui, context) {
    const items = Array.isArray(ui.items) ? ui.items : [];
    return label(ui, context) + (ui.text ? '<div class="list-heading">' + text(ui.text, context) + '</div>' : '') +
      '<div class="screen-list ' + (ui.actions && ui.actions.length ? 'list-with-actions' : '') + ' ' + (ui.text ? 'list-has-heading' : '') + '" tabindex="0" aria-label="' + text(ui.label || 'Options', context) + '">' + items.map(function (item) {
        const title = interpolate(item.label, context);
        const itemIcon = item.icon || (item.event === 'SETUP_RESUME' ? 'Settings2' : '');
        return '<button type="button" class="screen-list-item ' + (item.active ? 'is-active ' : '') + (item.tone === 'danger' ? 'is-danger' : '') + '"'+(typeof item.active==='boolean'?' aria-pressed="'+item.active+'"':'') + attributes(item) + '>'+(itemIcon ? '<span class="list-icon" data-symbol="'+escape(itemIcon)+'" aria-hidden="true">'+icon(itemIcon)+'</span>' : '')+'<span class="list-item-copy"><span class="list-item-label">' + escape(title) + '</span>' +
          (item.sub ? '<span class="list-item-sub">' + text(item.sub, context) + '</span>' : '') + '</span>' +
          (typeof item.active==='boolean' ? (item.active?icon('Check'):'') : item.value != null ? '<span class="list-item-value">' + text(item.value, context) + '</span>' : item.disabled ? '' : '<span class="list-chevron" aria-hidden="true">'+icon('ChevronRight')+'</span>') + '</button>';
      }).join('') + (items.length ? '' : '<div class="list-empty">'+icon('Inbox')+'<span>' + text(ui.sub || 'Nothing here yet', context) + '</span></div>') + '</div>' +
      (items.length > (ui.actions && ui.actions.length ? 3 : 4) ? '<div class="list-scroll-mark" aria-hidden="true">'+icon('ChevronDown')+'</div>' : '') + actions(ui, context);
  }

  function choices(ui, context) {
    const items = Array.isArray(ui.items) ? ui.items : [];
    if (items.length) return list(ui, context);
    return status(ui, context);
  }

  function standby(ui, context, aod) {
    const items = ui.actions || [];
    const figureButton = items[0] || { label: 'AI Chat', event: 'OPEN_AI' };
    const notices = items[1] || { label: 'Notifications', event: 'OPEN_NOTIFICATIONS' };
    const connected = context.wifiEnabled && context.networkConnected;
    const weatherIcon={Sunny:'Sun',Cloudy:'Cloud',Rainy:'CloudRain',Snowy:'Snowflake'}[context.weather||'Sunny'];
    return '<div class="standby-status">'+icon(connected?'Wifi':'WifiOff')+'<span>' + (connected ? 'Wi-Fi' : 'Offline') + '</span><span class="standby-battery">'+icon('Battery')+ Math.round(number(context.battery, 78, 0, 100)) + '%</span></div>' +
      '<div class="standby-clock">' + text(context.time, context) + '</div><div class="standby-date">' + text(context.date, context) + '</div>' +
      (aod ? '' : '<button type="button" class="standby-character" aria-label="' + text(figureButton.label, context) + '"' + attributes(figureButton) + '>' + figure(context) + '</button><div class="standby-weather"><span>'+(weatherIcon?icon(weatherIcon):'') + text(context.temperature, context) + '&#176;</span><small>' + text(context.weather || 'Sunny', context) + '</small></div>' +
      (context.unreadCount ? '<button type="button" class="standby-notices" aria-label="' + escape(context.unreadCount) + ' unread notifications"' + attributes(notices) + '>' + Math.min(99, number(context.unreadCount, 1, 1, 99)) + '</button>' : ''));
  }

  function keyboardPageCount(mode) { return Math.ceil(CHARACTERS[MODES.includes(mode) ? mode : 'lower'].length / 12); }

  function keyboard(ui, context) {
    const password = String(context.password || '');
    const mode = MODES.includes(context.keyboardMode) ? context.keyboardMode : 'lower';
    const pages = keyboardPageCount(mode);
    const page = ((Math.floor(Number(context.keyboardPage) || 0) % pages) + pages) % pages;
    const chars = CHARACTERS[mode].slice(page * 12, page * 12 + 12).split('');
    const valid = password.length >= 8 && password.length <= 63 && /^[\x20-\x7E]+$/.test(password);
    const nextMode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    const modeLabel = { lower: 'abc', upper: 'ABC', symbols: '123' };
    return '<div class="password-row"><button type="button" class="network-password" data-event="SSID_DETAIL" aria-label="View full network name"><span class="keyboard-ssid" translate="no">'+text(context.ssid,context)+'</span><span class="password-display '+(password?'':'is-empty')+'"'+(password?' translate="no"':'')+' aria-label="'+(context.showPassword?'Password':'Password hidden')+'">'+(password?context.showPassword?escape(password):'&#8226;'.repeat(password.length):'Password')+'</span></button></div>' +
      '<div class="keyboard-grid" aria-label="' + mode + ' keyboard, page ' + (page + 1) + ' of ' + pages + '">' + Array.from({ length: 12 }, function (_, i) {
        return chars[i] != null ? '<button type="button" class="keyboard-key" data-event="KEY" data-key="' + escape(chars[i]) + '" aria-label="' + escape(chars[i]) + '">' + escape(chars[i]) + '</button>' : '<span class="keyboard-gap" aria-hidden="true"></span>';
      }).join('') + '</div>' +
      '<div class="keyboard-tools"><button type="button" data-event="KEY_MODE" data-mode="' + nextMode + '" aria-label="Switch to ' + nextMode + ' keyboard" title="Switch keyboard">' + modeLabel[nextMode] + '</button><button type="button" data-event="KEY" data-key=" " aria-label="Space" title="Space">&#9251;</button><button type="button" data-event="KEY_DELETE" aria-label="Delete character" title="Delete character"' + (password ? '' : ' disabled') + '>&#9003;</button><button type="button" data-event="KEY_NEXT" aria-label="Next keyboard page" title="Next keyboard page"><span>&#8594;</span><small>' + (page + 1) + ' / ' + pages + '</small></button></div>' +
      '<div class="keyboard-actions"><button type="button" class="password-visibility" data-event="PASSWORD_VISIBILITY" aria-pressed="'+!!context.showPassword+'">'+(context.showPassword?'Hide':'Show')+'</button><button type="button" class="screen-action action-primary" data-event="WIFI_JOIN"' + (!valid ? ' disabled aria-disabled="true"' : '') + '>Join</button></div>';
  }

  function sliders(ui, context) {
    return label(ui, context) + '<div class="dual-sliders">' + [
      { setting: 'volume', label: 'Volume', min: 0, value: number(context.volume, 40, 0, 100) },
      { setting: 'brightness', label: 'Brightness', min: 10, value: number(context.brightness, 55, 10, 100) }
    ].map(function (item) {
      return '<label class="slider-column"><span class="slider-label">' + item.label + '</span><span class="slider-well" style="--level:' + ((item.value - item.min) / (100 - item.min) * 100) + '%"><input type="range" orient="vertical" data-setting="' + item.setting + '" aria-label="' + item.label + '" min="' + item.min + '" max="100" step="5" value="' + item.value + '"></span><output data-setting-output="' + item.setting + '">' + item.value + '%</output></label>';
    }).join('') + '</div>' + actions(ui, context);
  }

  function singleSlider(ui, context) {
    const setting=ui.setting==='brightness'?'brightness':'volume';
    const minimum=setting==='brightness'?10:0;
    const value=number(context[setting],setting==='brightness'?55:40,minimum,100);
    const name=setting==='brightness'?'Brightness':'Volume';
    return label(ui,context)+'<label class="single-setting setting-'+setting+'"><span class="setting-symbol" aria-hidden="true">'+icon(setting==='brightness'?'Sun':'Volume2')+'</span><span class="slider-well" style="--level:'+((value-minimum)/(100-minimum)*100)+'%"><input type="range" orient="vertical" data-setting="'+setting+'" aria-label="'+name+'" aria-valuetext="'+value+'%" min="'+minimum+'" max="100" step="5" value="'+value+'"></span><output data-setting-output="'+setting+'">'+value+'%</output></label>';
  }

  function recorder(ui, context) {
    const recording = ui.recording !== false && !/ready/i.test(ui.label || '');
    return label(ui, context) + '<div class="recorder-content"><div class="record-indicator ' + (recording ? 'is-recording' : '') + '" aria-hidden="true"></div><div class="record-timer">' + (recording ? formatTime(context.seconds) : '00:00') + '</div>' +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div>' + (recording ? wave() : '') + actions(ui, context);
  }

  function care(ui, context) {
    const sub = /^\d{1,2}:\d{2}$/.test(ui.sub || '') ? '' : ui.sub;
    const capturing=!!context.careActive&&!context.micLocked;
    return label(ui, context) + '<div class="care-content">' + figure(context) + '<div class="care-timer" aria-label="Time remaining">' + formatTime(context.careRemaining) + '</div>' +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (sub ? '<div class="screen-subtitle">' + text(sub, context) + '</div>' : '') +
      '<div class="care-mic-status" role="img" aria-label="'+(capturing?'Mic on':'Mic capture stopped')+'">'+icon(capturing?'Mic':'MicOff')+'</div></div>' + actions(ui, context);
  }

  function steps(ui, context) {
    return label(ui, context) + '<div class="steps-content"><div class="step-total">' + Math.round(number(context.stepCount, 4820, 0, 999999)).toLocaleString('en-US') + '</div><div class="step-unit">steps</div><div class="step-bars" aria-hidden="true">' + [36, 60, 46, 85, 50, 72, 58].map(function (height) { return '<i style="height:' + height + 'px"></i>'; }).join('') + '</div>' +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div>' + actions(ui, context);
  }

  function tutorial(ui, context) {
    return label(ui, context) + '<div class="tutorial-content">' + (ui.gesture ? '<div class="gesture-mark" aria-hidden="true">' + icon({up:'MoveUp',down:'MoveDown',left:'MoveHorizontal',right:'MoveHorizontal'}[ui.gesture]||'Hand') + '</div>' : figure(context)) +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div>' + actions(ui, context);
  }

  function pet(ui, context) {
    const meters = ui.meters || [];
    if (ui.items && ui.items.length) {
      return label(ui, context) + '<div class="pet-header'+(ui.petFeedback?' has-pet-feedback':'')+'"'+(ui.petFeedback?' style="--feedback-delay:-'+ui.petFeedbackElapsed+'ms"':'')+'>' + figure(context) + '<div'+(ui.petFeedback?' role="status" aria-live="polite"':'')+'>' +
        (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
        (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') + '</div></div>' +
        list(Object.assign({}, ui, { label: '', text: '' }), context) + '<div class="list-scroll-mark" aria-hidden="true">&#8964;</div>';
    }
    return label(ui, context) + '<div class="pet-content"><div class="pet-scene">' + figure(context) + (ui.sceneIcon?'<span class="pet-scene-symbol" aria-hidden="true">'+icon(ui.sceneIcon)+'</span>':'') + '</div>' +
      (ui.text ? '<div class="screen-title">' + text(ui.text, context) + '</div>' : '') +
      (ui.sub ? '<div class="screen-subtitle">' + text(ui.sub, context) + '</div>' : '') +
      (meters.length ? '<div class="pet-meters">' + meters.map(function (meter) {
        const value = number(interpolate(meter.value, context), 65, 0, 100);
        return '<div class="pet-meter"><span>' + text(meter.label, context) + '</span><meter min="0" max="100" value="' + value + '">' + value + '%</meter></div>';
      }).join('') + '</div>' : '') + '</div>' + actions(ui, context);
  }

  function explore(ui, context, id) {
    const controls=ui.zoomControls||[];
    return label(ui,context)+'<div class="explore-view-name">'+text(ui.text,context)+'</div>'+ 
      '<div class="explore-scene explore-'+id+'">'+figure(context)+'</div>'+
      '<div class="explore-zoom">'+controls.map((item,index)=>actionButton({...item,iconOnly:true,tone:'secondary'},context)+(index===0?'<output aria-label="Zoom">'+({'98':'0.6x','97':'1x','99':'2x'})[id]+'</output>':'')).join('')+'</div>'+actions(ui,context);
  }

  const RENDERERS = {
    status: status, choices: choices, list: list, character: character, progress: progress,
    keyboard: keyboard, 'dual-slider': sliders, 'single-slider': singleSlider, recorder: recorder, care: care,
    steps: steps, tutorial: tutorial, pet: pet,
    standby: function (ui, context) { return standby(ui, context, false); },
    aod: function (ui, context) { return standby(ui, context, true); },
    off: function () { return ''; }
  };

  // Visual metadata is separate from protocol states, permissions and event routing.
  const VISUALS = {};
  function visual(ids, symbol, sentiment) {
    ids.split(' ').forEach(id => { VISUALS[id] = {symbol, sentiment}; });
  }
  visual('02 03 150', 'Smartphone', 'info');
  visual('04 05 146 143 176', 'Hourglass', 'info');
  visual('112 26 49 56 90 69 72 123 138 159', 'Check', 'success');
  visual('113 127 129 78', 'WifiOff', 'warning');
  visual('128', 'KeyRound', 'warning');
  visual('37 38 39 40 47 149 152 100 101 102 132 139 140 156 158 168', 'CircleAlert', 'warning');
  visual('17 18 51 53 92 154', 'Sparkles', 'info');
  visual('23 24', 'BatteryCharging', 'success');
  visual('33 34', 'BatteryLow', 'warning');
  visual('45', 'PlugZap', 'warning');
  visual('48', 'Thermometer', 'warning');
  visual('41 76 160', 'MicOff', 'neutral');
  visual('42', 'Trash2', 'neutral');
  visual('44 175', 'Moon', 'info');
  visual('50', 'RefreshCw', 'info');
  visual('114', 'WifiOff', 'warning');
  visual('28', 'AudioLines', 'info');
  visual('29', 'CloudUpload', 'info');
  visual('30', 'BellOff', 'info');
  visual('82', 'Heart', 'info');
  visual('118', 'Power', 'warning');
  visual('163', 'Download', 'info');
  visual('54 55 87 88 141 142', 'Users', 'info');
  visual('136', 'Hand', 'info');
  visual('144 145', 'MailX', 'neutral');
    visual('169', 'Smartphone', 'info');
    visual('170', 'CircleAlert', 'warning');
  visual('171 125', 'FileAudio', 'info');
  visual('173', 'Cloud', 'info');
  visual('67 133 164', 'Bell', 'info');
  visual('70', 'Mic', 'info');
  visual('73', 'FileWarning', 'warning');
  visual('135', 'Inbox', 'neutral');
  visual('107', 'Footprints', 'neutral');
  visual('166', 'CloudSun', 'neutral');
  visual('130', 'Settings2', 'info');
  visual('177', 'Trash2', 'danger');

  function boot(context) {
    return '<div class="boot-content">'+figure(context,'boot-character')+'<div class="boot-brand">LG01</div><div class="boot-loader" role="progressbar" aria-label="Starting LG01"><i></i></div></div>';
  }

  function render(page, context) {
    const currentPage = page || {};
    const state = Object.assign({}, DEFAULTS, context || {});
    const ui = Object.assign({ kind: currentPage.type || 'status', label: currentPage.headline || '', text: '', sub: currentPage.sub || '', actions: [] }, currentPage.ui || {});
    ui.actions = (ui.actions || []).map(function (item) { return Object.assign({}, item); });
    ui.items = (ui.items || []).map(function (item) { return Object.assign({}, item); });
    if (String(currentPage.n) === '27') {
      ui.text = state.micLocked ? 'Mic off' : 'Mic on';
      ui.actions.forEach(function (item) { if (item.event === 'MUTE_TOGGLE') item.label = state.micLocked ? 'Turn mic on' : 'Turn mic off'; });
    }
    if (String(currentPage.n) === '30') {
      ui.text = state.quiet ? 'Quiet is on' : 'Quiet is off';
      ui.sub = state.quiet ? 'Reminders stay silent' : 'Reminders can play sounds';
      ui.actions.forEach(function (item) { if (item.event === 'QUIET_TOGGLE') item.label = state.quiet ? 'Turn quiet off' : 'Turn quiet on'; });
    }
    if (['67', '68', '134'].includes(String(currentPage.n))) ui.text = state.noteTitle;
    const id=String(currentPage.n);
    ui.pairedDevice=['02','03','04'].includes(id);
    if(['03','04'].includes(id))ui.pairingIcon='Box';
    if(id==='174')ui.networkIdentity=true;
    ui.qrCode = id === '02' && ui.qrCode === true;
    ui.sceneIcon={'94':'Apple','95':'Sparkles','96':'Moon','157':'Smile','175':'Moon'}[id];
    if(id==='175')ui.character='lumi';
    if(id==='68'){ui.text='';ui.items=[{label:state.noteTitle,sub:'',event:'NOTE_OPEN',target:'134',noteId:state.noteId}];}
    if(id==='134'){
      ui.sub=state.noticeStatus==='snoozed'?'In '+Math.max(1,Math.ceil(((state.snoozeAt??600)-(state.clock||0))/60))+' min':({scheduled:'Coming up',due:'Due now',completed:'Already done'})[state.noticeStatus]||'Reminder';
      ui.actions=[{label:'Play',icon:'Play',event:'SINGLE_PLAY',target:'162',tone:'primary',actionRole:'command'},state.noticeStatus==='due'?{label:'Done or later',event:'NOTE_ACTIONS',target:'68',actionRole:'command'}:state.noticeStatus==='completed'?{label:'Back',icon:'ArrowLeft',iconOnly:true,event:'BACK',target:state.noteReturn||'77',actionRole:'back'}:{label:'Mark done',icon:'Check',event:'NOTE_DONE',target:'69',actionRole:'command'}];
    }
    if(id==='77'&&state.notes){
      ui.items=Object.values(state.notes).filter(n=>!n.noteDeleted).sort((a,b)=>a.noteDueAt-b.noteDueAt||a.noteId.localeCompare(b.noteId)).map(n=>({label:n.noteTitle||'Reminder',sub:({due:'Due now',scheduled:'Coming up',snoozed:'Later',completed:'Already done'})[n.noticeStatus],icon:'Bell',noteId:n.noteId,target:'134',event:'NOTE_OPEN'}));
      if(Object.keys(state.requests||{}).length)ui.items.push({label:'Friend messages',icon:'Users',sub:'Invites and replies',event:'NAVIGATE',target:'165'});
      if(state.records?.length)ui.items.push({label:'Voice notes',icon:'Mic',sub:'Saved recordings',event:'NAVIGATE',target:'124'});
      if(state.currentRecording?.status==='failed')ui.items.push({label:'Unsaved recording',icon:'Mic',sub:'Try saving again',event:'REC_DRAFT_OPEN',target:'73'});
      for(const request of Object.values(state.photoRequests||{}))ui.items.push({label:request.characterName||'Photo character',icon:'Image',sub:({waiting:'Waiting for a photo',generating:'Making a character',completed:'New character ready',failed:'Could not make character'})[request.status],event:'PHOTO_OPEN',requestId:request.id,target:({waiting:'51',generating:'52',completed:'53',failed:'102'})[request.status]});
      if(state.noteMutations?.length){const sending=state.noteMutations.some(m=>m.status==='sending');ui.items.push({label:'Sync reminders',sub:sending?'Syncing reminders':state.noteMutations.some(m=>m.status==='failed')?'Reminder sync failed':'Reminders not synced',icon:'RefreshCw',event:'NOTE_SYNC_RETRY',target:'77',disabled:sending});}
    }
    if(id==='102'&&state.photoView){ui.label='New character';ui.text='Could not make character';ui.sub='';ui.actions=[{label:'Later',event:'PHOTO_LATER',target:state.photoOrigin||'93',actionRole:'defer'},{label:'Check status',event:'REVIVE_RETRY',target:'52',tone:'primary',icon:'RefreshCw',actionRole:'command'}];}
    if(id==='165'&&state.requests){
      ui.items=Object.values(state.requests).sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id)).map(r=>({label:r.kind==='avatar'?'Create together':r.kind==='partner'?'Team invite':'Friend invite',icon:'Users',sub:({waiting:'Waiting for a reply',generating:'Making a character',completed:'Ready',failed:'Not ready yet',expired:'Time ran out',cancelled:'Cancelled',declined:'Not accepted'})[r.status],requestId:r.id,event:'OPEN_REQUEST',target:r.status==='completed'?(r.kind==='avatar'?'92':r.kind==='friend'?'56':'90'):r.status==='generating'?'91':['cancelled','expired','declined'].includes(r.status)?'144':r.status==='failed'?'102':r.kind==='avatar'?'143':r.kind==='partner'?'89':'176'}));
    }
    if(id==='124'&&state.records){
      ui.items=state.records.map((r,i)=>({label:'Voice note '+(i+1),icon:'Mic',sub:formatTime(r.seconds)+' / '+({synced:'In the app',uploading:'Sending to the app',pending:!state.wifiEnabled||!state.networkConnected?'Waiting for Wi-Fi':'Not sent yet', 'local-only':'Only on LG01'})[r.status],disabled:true}));
      const retry=ui.actions.find(a=>a.event==='REC_SYNC_RETRY');
      if(retry)retry.disabled=state.uploadPermission!=='granted'||!state.records.some(r=>r.status==='pending'||r.status==='local-only');
    }
    if(id==='173'){ui.text=state.uploadPermission==='granted'?'Online backup is on':['denied','revoked'].includes(state.uploadPermission)?'Online backup is off':'Backup needs setup';ui.sub='Change this in the app';}
    if(id==='109'&&state.wifiEnabled&&state.networkConnected){
      const current=ui.items.find(item=>item.label===state.ssid);
      ui.items=ui.items.filter(item=>item.label!==state.ssid);
      ui.items.unshift({...current,label:state.ssid,sub:'Connected',icon:'Wifi',event:'NOOP',target:undefined,active:true});
    }
    if(id==='172')ui.items.forEach(i=>{if(i.event==='DISPLAY_MODE')i.active=(i.value==='aod'?'aod':'black')===(state.displayMode||'black');});
    const currentPet=state.pets?.[state.characterId]||state.pets?.[state.characterName]||null;
    const now=Number(state.clock)||0;
    const readyIn=deadline=>Math.max(0,Math.ceil(((deadline||0)-now)/60));
    const food=state.foodInventory||{purchasedTotal:0,consumedTotal:0,status:'unsynced'};
    const foodCount=Number.isSafeInteger(food.purchasedTotal)&&Number.isSafeInteger(food.consumedTotal)?Math.max(0,food.purchasedTotal-food.consumedTotal):0;
    const foodCopy=foodCount+' food portions available';
    if(id==='175')ui.sub=(currentPet?.restAt!=null?formatTime(currentPet.restAt-now):'15:00')+' left';
    if(id==='123'){const rec=state.records?.at(-1);ui.sub=rec?.status==='uploading'?'Sending to the app':rec?.status==='synced'?'Also in the app':state.uploadPermission!=='granted'?'Only on this device':!state.wifiEnabled||!state.networkConnected?'Waiting for Wi-Fi':'Not sent yet';}
    if(id==='164')ui.sub=state.lastRecordingOutcome==='deleted'?'Recording deleted':'Your recording is saved';
    if(id==='73'&&state.currentRecording?.expiresAt!=null){const left=Math.max(0,state.currentRecording.expiresAt-state.clock),amount=left>=3600?Math.ceil(left/3600):Math.max(1,Math.ceil(left/60)),unit=left>=3600?'hour':'minute';ui.sub=amount+' '+unit+(amount===1?'':'s')+' left to save';}
    if(id==='94'){
      ui.sub=foodCopy;
      ui.text=foodCount>0?'Snack time':'No food yet';
      ui.actions=ui.actions.filter(item=>item.event==='BACK');
      ui.actions.push(foodCount>0?{label:'Feed 1 portion',icon:'Apple',event:'PET_FEED',target:'93',tone:'primary',actionRole:'command'}:{label:'Sync purchases',icon:'RefreshCw',event:'FOOD_SYNC_REQUEST',target:'94',tone:'primary',actionRole:'command',disabled:food.status==='syncing'});
      if(!foodCount)ui.sub=food.status==='syncing'?'Syncing purchases':food.status==='error'?'Could not sync purchases':'Buy food in the app';
    }
    if(id==='157'){
      const pet=currentPet;ui.text='Thanks for caring';ui.sub='';
      let reason=state.petUnavailableReason||'PET_FEED';
      if(reason==='PET_FEED'&&pet&&pet.feed<100&&!readyIn(pet.feedAt)&&pet.restAt==null&&!foodCount)reason='FOOD_EMPTY';
      let ready=false;
      if(pet&&reason==='PET_FEED'){const wait=readyIn(pet.feedAt);ready=pet.feed<100&&!wait&&pet.restAt==null&&foodCount>0;ui.text=pet.restAt!=null?"I'm resting":pet.feed>=100?"I'm full now":wait?'A snack later?':'Snack time';ui.sub=pet.restAt!=null?'See you after my rest':pet.feed>=100?'Thanks for caring':wait?'Ready in '+wait+' min':foodCopy;}
      if(reason==='FOOD_EMPTY'){
        ui.sceneIcon=food.status==='syncing'?'RefreshCw':'ShoppingBag';
        ui.text=food.status==='syncing'?'Syncing purchases':food.status==='error'?'Could not sync purchases':'No food yet';
        ui.sub=food.status==='syncing'?'Waiting for the app':food.status==='error'?({offline:'Connect to Wi-Fi',permission:'Open the app together',timeout:'Try again later',service:'Try again later'})[food.error]||'Try again later':'Buy food in the app';
      }
      if(reason==='PET_INVALID'){ui.text='Companion is unavailable';ui.sub='Choose a companion';}
      if(pet&&reason==='PET_CLEAN'){const wait=readyIn(pet.cleanAt);ready=pet.clean<100&&!wait;ui.text=pet.clean>=100?"I'm all clean":wait?'A little break?':'Time to freshen up';ui.sub=pet.clean>=100?'Thanks for caring':wait?'Ready in '+wait+' min':'';}
      if(pet&&reason==='PET_REST'){ready=pet.energy<100&&pet.restAt==null;ui.text=pet.restAt!=null?"I'm resting":pet.energy>=100?'Ready to play':'Time to rest';ui.sub=pet.restAt!=null?'See you after my rest':pet.energy>=100?'Thanks for caring':'';}
      if(pet&&['EXPLORE_OPEN','PET_EXPLORE_COMPLETE','PET_EXPLORE'].includes(reason)){const wait=readyIn(pet.exploreAt);ready=pet.restAt==null&&!wait;ui.text=pet.restAt!=null?"I'm resting":wait?'A little break?':'Ready to explore';ui.sub=pet.restAt!=null?'See you after my rest':wait?'Ready in '+wait+' min':'A little adventure';}
      const target=reason==='FOOD_EMPTY'?['FOOD_SYNC_REQUEST','157','Sync purchases']:{PET_FEED:['PET_FEED_OPEN','94','Feed'],PET_CLEAN:['PET_CLEAN_OPEN','95','Clean'],PET_REST:['PET_REST_OPEN','96','Rest']}[reason]||['EXPLORE_OPEN','97','Explore'];
      ui.headerBack=null;
      ui.actions=[{label:reason==='FOOD_EMPTY'?(food.status==='error'?'Try again':target[2]):ready?target[2]:'OK',event:reason==='FOOD_EMPTY'?target[0]:ready?target[0]:'PET_UNAVAILABLE_DONE',target:reason==='FOOD_EMPTY'?target[1]:ready?target[1]:'93',icon:reason==='FOOD_EMPTY'?'RefreshCw':undefined,disabled:reason==='FOOD_EMPTY'&&food.status==='syncing',tone:'primary',actionRole:'command'}];
    }
    if(id==='144'){
      const request=state.requests?.[state.requestId];
      ui.label=request?.kind==='friend'?'Friends':request?.kind==='partner'?'Team up':'Create together';
      ui.text=({declined:'Invitation declined',expired:'Invitation timed out',cancelled:'Invitation cancelled'})[request?.status]||'Invite closed';
      ui.sub='';
    }
    if (String(currentPage.n) === '167' && state.notes) {
      ui.items = Object.values(state.notes).filter(function(note){return note.noticeStatus==='due' && !note.noteDeleted;}).sort((a,b)=>a.noteDueAt-b.noteDueAt||a.noteId.localeCompare(b.noteId)).map(function(note){return {label:note.noteTitle,sub:'',noteId:note.noteId,event:'NOTE_OPEN',target:'134'};});
      ui.text='';ui.sub='No reminders waiting';
    }
    if (String(currentPage.n) === '111'&&!ui.hideNetworkName) ui.sub = state.ssid;
    if (['93', '94', '95', '96', '157', '154'].includes(String(currentPage.n))) {
      ['label', 'text', 'sub'].forEach(function (key) { ui[key] = String(ui[key] || '').replace(/lumi/gi, state.characterName); });
      ui.actions.forEach(function (item) { item.label = item.label.replace(/lumi/gi, state.characterName); });
    }
    ui.items.forEach(function (item) {
      if (item.event === 'OPEN_MIC') item.sub = state.micLocked ? 'Off' : 'On';
      if (item.event === 'OPEN_QUIET') item.sub = state.quiet ? 'On' : 'Off';
      if (item.event === 'OPEN_ADJUST') item.sub = state.volume + '% / ' + state.brightness + '%';
      if (item.event === 'OPEN_VOLUME') item.sub = state.volume + '%';
      if (item.event === 'OPEN_BRIGHTNESS') item.sub = state.brightness + '%';
      if (item.event === 'OPEN_WIFI') item.sub = !state.wifiEnabled ? 'Off' : state.networkConnected ? 'Connected' : 'Disconnected';
      if(id==='93'&&['PET_FEED_OPEN','PET_CLEAN_OPEN','PET_REST_OPEN'].includes(item.event)){
        const field={PET_FEED_OPEN:'feed',PET_CLEAN_OPEN:'clean',PET_REST_OPEN:'energy'}[item.event],value=currentPet?.[field]??state[{feed:'petFeed',clean:'petClean',energy:'petEnergy'}[field]]??60;
        item.value=Math.round(number(value,60,0,100))+'%';
        const wait=readyIn(currentPet?.[field==='feed'?'feedAt':'cleanAt']);
        item.sub=field==='energy'?(currentPet?.restAt!=null?'Resting '+formatTime(currentPet.restAt-now):value>=100?'Full of energy':''):value>=100?(field==='feed'?'Not hungry':'All clean'):wait?'Ready in '+wait+' min':'';
        if(item.event==='PET_FEED_OPEN'&&!item.sub)item.sub=currentPet?.restAt!=null?'After resting':foodCopy;
      }
      if(id==='93'&&item.event==='EXPLORE_OPEN'){const wait=readyIn(currentPet?.exploreAt);item.sub=currentPet?.restAt!=null?'After resting':wait?'Ready in '+wait+' min':'';}
    });
    if (String(currentPage.n) === '71') ui.sub = 'Up to 1 min';
    if(id==='93'){
      ui.label=state.characterName;
      ui.text='Level '+(currentPet?.level||state.characterLevel||1);
      const feedback=state.petFeedback;
      ui.petFeedback=!!feedback&&feedback.avatarId===(state.characterId||currentPet?.avatarId)&&feedback.until>now;
      ui.petFeedbackElapsed=Math.max(0,(now-(feedback?.until-(global.LG01_DATA?.petRules?.feedbackSeconds||2.4)))*1000)||0;
      ui.sub=ui.petFeedback?feedback.text:currentPet?.restAt!=null?'Taking a little rest':currentPet&&Math.min(currentPet.feed,currentPet.clean,currentPet.energy)<60?'Time for some care':'Feeling good';
    }
    for(const item of ui.actions){
      if(['PET_FEED','PET_CLEAN','PET_REST','PET_EXPLORE_COMPLETE'].includes(item.event)&&state.petIntent)Object.assign(item,{avatarId:state.petIntent.avatarId,actionId:state.petIntent.actionId,baseRevision:state.petIntent.baseRevision});
      if(item.event==='PET_REST_CANCEL'&&currentPet)Object.assign(item,{avatarId:currentPet.avatarId,actionId:currentPet.restActionId,baseRevision:currentPet.restRevision});
    }
    const hadActions=ui.actions.length>0;
    const isBack=item=>item.actionRole==='back'||item.label==='Back';
    ui.headerBack=ui.actions.find(isBack)||ui.items.find(isBack)||null;
    if(id==='110')ui.headerBack=ui.actions.find(item=>/cancel|back/i.test(item.label))||{event:'BACK'};
    if(id==='93')ui.headerBack={label:'Back',event:'BACK',target:'74'};
    if(ui.headerBack){
      const backItem=ui.headerBack;
      ui.actions=ui.actions.filter(item=>item!==backItem);
      ui.items=ui.items.filter(item=>item!==backItem);
      ui.headerBack={...backItem,label:'Back',icon:'ArrowLeft',iconOnly:true,tone:'secondary'};
    }
    const kind = Object.prototype.hasOwnProperty.call(RENDERERS, ui.kind) ? ui.kind : 'status';
    const tone = ['light', 'sage', 'lavender', 'alert', 'dark'].includes(ui.tone) ? ui.tone : 'dark';
    const appearance = id === '27' ? {symbol:state.micLocked?'MicOff':'Mic',sentiment:'info'} : VISUALS[id];
    if(appearance) ui.visualIcon=appearance.symbol;
    const classes = 'device-screen kind-' + kind + ' tone-' + tone + (hadActions ? ' has-actions' : '') + (ui.headerBack?' has-header-back':'') + (ui.items.length ? ' has-items' : '') + (ui.dim || String(currentPage.n) === '121' ? ' is-dim' : '') + (appearance?' sentiment-'+appearance.sentiment:'') + (id==='74'?' app-menu':'') + (id==='01'?' is-boot':'') + (ui.sceneIcon?' scene-'+ui.sceneIcon.toLowerCase():'');
    return '<div class="' + classes + '" data-screen-id="' + escape(currentPage.n || '') + '" role="group" aria-label="' + text(ui.label || (kind === 'off' ? 'Screen off' : currentPage.title || 'Device screen'), state) + '">' + (ui.headerBack?actionButton(ui.headerBack,state,'screen-header-back'):'') + (id==='01'?boot(state):['97','98','99'].includes(id)?explore(ui,state,id):RENDERERS[kind](ui, state)) + '</div>';
  }

  global.LG01Screen = Object.freeze({ render: render, keyboardModes: function () { return MODES.slice(); }, keyboardPageCount: keyboardPageCount });
})(window);
