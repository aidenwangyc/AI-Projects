(function (global) {
  'use strict';
  function createRecognizer(emit, now = () => Date.now()) {
    const names = ['one', 'two'];
    const keys = { one: null, two: null }, clicks = { one: 0, two: 0 };
    const pending = { one: null, two: null };
    const multiClickMs = 350, chordToleranceMs = 100;
    let overlapActive = false, chordAt = null, chordFired = false;
    function clearClick(key) { pending[key] = null; clicks[key] = 0; }
    function flushClicks(time) {
      if (overlapActive) return;
      const due = names.filter(key => pending[key] !== null && !keys[key] && time >= pending[key]);
      due.sort((a, b) => pending[a] - pending[b]);
      for (const key of due) { clearClick(key); emit(key === 'one' ? 'DISPLAY_TOGGLE' : 'REC_TOGGLE'); }
    }
    function checkLong(key, time) {
      const held = keys[key];
      if (held && !held.consumed && time - held.at >= (key === 'one' ? 3000 : 2000)) {
        held.consumed = true; clearClick(key); emit(key === 'one' ? 'POWER_HOLD' : 'OPEN_ADJUST');
      }
    }
    function checkChord(time) {
      if (chordAt !== null && !chordFired && keys.one && keys.two && time - chordAt >= 8000) {
        chordFired = true; emit('REBOOT');
      }
    }
    function down(key) {
      if (!names.includes(key) || keys[key] !== null) return;
      const time = now(); flushClicks(time);
      keys[key] = { at: time, consumed: overlapActive };
      if (overlapActive) return;
      if (keys.one && keys.two) {
        overlapActive = true; names.forEach(clearClick);
        const eligible = !keys.one.consumed && !keys.two.consumed && Math.abs(keys.one.at - keys.two.at) <= chordToleranceMs;
        chordAt = eligible ? time : null; chordFired = false;
        keys.one.consumed = keys.two.consumed = true;
      }
    }
    function up(key) {
      if (!names.includes(key)) return;
      const held = keys[key]; if (!held) return;
      const time = now();
      // Check at release as well as tick so a polling interval cannot lose a threshold event.
      if (overlapActive) checkChord(time); else checkLong(key, time);
      keys[key] = null;
      if (overlapActive) {
        if (!chordFired) chordAt = null;
        if (!keys.one && !keys.two) { overlapActive = false; chordAt = null; chordFired = false; }
        return;
      }
      if (held.consumed) return;
      clicks[key] += 1;
      if (key === 'two' && clicks.two === 2) { clearClick(key); emit('MUTE_TOGGLE'); }
      else if (key === 'one' && clicks.one === 3) { clearClick(key); emit('EMERGENCY_RESERVED'); }
      else pending[key] = time + multiClickMs;
    }
    function tick() {
      const time = now();
      if (overlapActive) { checkChord(time); return; }
      for (const key of names) checkLong(key, time);
      flushClicks(time);
    }
    function cancel() {
      keys.one = keys.two = null; names.forEach(clearClick);
      overlapActive = false; chordAt = null; chordFired = false;
    }
    return { down, up, tick, cancel, keys, get chordAt() { return chordAt; }, get blockedOverlap() { return overlapActive && chordAt === null; } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createRecognizer };
  global.LG01Input = { createRecognizer };
})(typeof window !== 'undefined' ? window : globalThis);
