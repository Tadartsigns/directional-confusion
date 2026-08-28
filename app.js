(function () {
  const BUILTIN = (window.DC_PRESETS && window.DC_PRESETS.builtin) || [];
  const HIGH = (window.DC_PRESETS && window.DC_PRESETS.high) || [];
  const EXTREME = (window.DC_PRESETS && window.DC_PRESETS.extreme) || [];
  const $ = (id) => document.getElementById(id);
  const state = {
    running: false, wave: "sine", l: 3200, r: 2870, masterTune: 0, lFine: 0, rFine: 0,
    vol: 80, panRate: 6, panDepth: 100, wander: 18, wanderT: 22, pulse: 0,
    activePreset: null, linked: false, linkOffset: 0, tunerOnly: false
  };
  let ctx, master, oscL, oscR, gL, gR, panL, panR, raf = 0, t0 = 0;
  function clampHz(v) { v = Number(v); if (!isFinite(v) || v <= 0) return 20; return Math.min(20000, v); }
  function effectiveL() { return clampHz(state.l + state.lFine + state.masterTune); }
  function effectiveR() { return clampHz(state.r + state.rFine + state.masterTune); }
  function panRateHz() { return state.panRate / 100; }
  function markCustom() { state.activePreset = "custom"; refreshPresetActive(); }
  function renderPresetButtons(list, hostId) {
    const host = $(hostId); if (!host) return; host.innerHTML = "";
    list.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "preset" + (state.activePreset === p.id ? " active" : ""); b.dataset.id = p.id;
      b.innerHTML = p.name + "<small>" + p.sub + "</small>";
      b.addEventListener("click", () => applyPreset(p)); host.appendChild(b);
    });
  }
  function refreshPresetActive() {
    document.querySelectorAll(".preset").forEach((el) => el.classList.toggle("active", el.dataset.id === state.activePreset));
  }
  function applyPreset(p) {
    state.activePreset = p.id || p.name;
    state.l = p.l; state.r = p.r; state.wave = p.wave || "sine";
    state.panRate = p.panRate ?? 6; state.panDepth = p.panDepth ?? 100;
    state.wander = p.wander ?? 18; state.wanderT = p.wanderT ?? 22; state.pulse = p.pulse ?? 0;
    state.lFine = 0; state.rFine = 0; state.masterTune = 0;
    $("lHz").value = state.l; $("rHz").value = state.r;
    $("lHzNum").value = Math.round(state.l); $("rHzNum").value = Math.round(state.r);
    $("lFine").value = 0; $("rFine").value = 0; $("masterTune").value = 0;
    state.linkOffset = state.r - state.l;
    $("panRate").value = state.panRate; $("panDepth").value = state.panDepth;
    $("wander").value = state.wander; $("wanderT").value = state.wanderT; $("pulse").value = state.pulse;
    document.querySelectorAll("#waveSeg button").forEach((b) => b.classList.toggle("active", b.dataset.w === state.wave));
    syncReads(); refreshPresetActive(); if (state.running) applyAudioParams(true);
  }
  function syncReads() {
    $("lHzRead").textContent = Math.round(state.l);
    $("rHzRead").textContent = Math.round(state.r);
    if (document.activeElement !== $("lHzNum")) $("lHzNum").value = Math.round(state.l);
    if (document.activeElement !== $("rHzNum")) $("rHzNum").value = Math.round(state.r);
    $("lFineRead").textContent = (state.lFine >= 0 ? "+" : "") + Number(state.lFine).toFixed(1);
    $("rFineRead").textContent = (state.rFine >= 0 ? "+" : "") + Number(state.rFine).toFixed(1);
    $("masterTuneRead").textContent = (state.masterTune >= 0 ? "+" : "") + state.masterTune;
    $("volRead").textContent = state.vol + "%";
    $("panRateRead").textContent = panRateHz().toFixed(3) + " Hz";
    $("panDepthRead").textContent = state.panDepth + "%";
    $("wanderRead").textContent = state.wander + " Hz";
    $("wanderTRead").textContent = state.wanderT + " s";
    $("pulseRead").textContent = state.pulse === 0 ? "off" : state.pulse + "%";
  }
  function commitChannel(side) {
    const num = side === "l" ? $("lHzNum") : $("rHzNum");
    const slider = side === "l" ? $("lHz") : $("rHz");
    const hz = clampHz(num.value);
    state[side] = hz; slider.value = hz; num.value = Math.round(hz);
    if (state.linked) {
      if (side === "l") { state.r = clampHz(hz + state.linkOffset); $("rHz").value = state.r; $("rHzNum").value = Math.round(state.r); }
      else { state.l = clampHz(hz - state.linkOffset); $("lHz").value = state.l; $("lHzNum").value = Math.round(state.l); }
    } else state.linkOffset = state.r - state.l;
    markCustom(); syncReads(); flashTune(side); if (state.running) applyAudioParams(true);
  }
  function flashTune(side) {
    const ids = side === "both" ? ["btnTuneL","btnTuneR","btnTuneBoth"] : side === "l" ? ["btnTuneL"] : ["btnTuneR"];
    ids.forEach((id) => {
      const el = $(id); if (!el) return;
      el.classList.add("active"); el.textContent = "Tuned";
      setTimeout(() => { el.classList.remove("active"); el.textContent = id === "btnTuneL" ? "Tune left" : id === "btnTuneR" ? "Tune right" : "Tune both"; }, 700);
    });
  }
  function masterGainFromSlider() { return Math.pow(state.vol / 100, 1.15) * 3.4; }
  function ensureGraph() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 18; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.18;
    const makeup = ctx.createGain(); makeup.gain.value = 2.2;
    master.connect(comp); comp.connect(makeup); makeup.connect(ctx.destination);
    oscL = ctx.createOscillator(); oscR = ctx.createOscillator();
    oscL.type = state.wave; oscR.type = state.wave;
    oscL.frequency.value = effectiveL(); oscR.frequency.value = effectiveR();
    gL = ctx.createGain(); gR = ctx.createGain(); gL.gain.value = 0.55; gR.gain.value = 0.55;
    panL = ctx.createStereoPanner(); panR = ctx.createStereoPanner(); panL.pan.value = -1; panR.pan.value = 1;
    oscL.connect(gL).connect(panL).connect(master);
    oscR.connect(gR).connect(panR).connect(master);
    oscL.start(); oscR.start();
  }
  function applyAudioParams(glide) {
    if (!ctx || !oscL) return;
    const t = ctx.currentTime, atk = glide ? 0.8 : 0.03;
    oscL.type = state.wave; oscR.type = state.wave;
    oscL.frequency.cancelScheduledValues(t); oscR.frequency.cancelScheduledValues(t);
    oscL.frequency.setTargetAtTime(effectiveL(), t, atk);
    oscR.frequency.setTargetAtTime(effectiveR(), t, atk);
    master.gain.setTargetAtTime(state.running ? masterGainFromSlider() : 0, t, 0.05);
  }
  function tick(now) {
    if (!state.running || !ctx) return;
    if (!t0) t0 = now;
    const sec = (now - t0) / 1000, depth = state.panDepth / 100, pr = panRateHz();
    const p = Math.sin(sec * pr * Math.PI * 2);
    const p2 = Math.sin(sec * pr * 0.73 * Math.PI * 2 + 1.1);
    if (panL && panR) {
      const bleed = (1 - depth) * 0.85;
      panL.pan.setTargetAtTime(Math.max(-1, Math.min(1, -1 + bleed + p * depth * 0.45)), ctx.currentTime, 0.12);
      panR.pan.setTargetAtTime(Math.max(-1, Math.min(1, 1 - bleed + p2 * depth * 0.45)), ctx.currentTime, 0.12);
    }
    const wT = Math.max(4, state.wanderT);
    const fL = clampHz(effectiveL() + Math.sin(sec * (Math.PI * 2) / wT) * state.wander);
    const fR = clampHz(effectiveR() + Math.sin(sec * (Math.PI * 2) / (wT * 1.37) + 0.8) * state.wander);
    oscL.frequency.setTargetAtTime(fL, ctx.currentTime, 0.25);
    oscR.frequency.setTargetAtTime(fR, ctx.currentTime, 0.25);
    if (state.pulse > 0) {
      const amt = state.pulse / 100, q = 0.5 + 0.5 * Math.sin(sec * (Math.PI * 2) / 7.5);
      gL.gain.setTargetAtTime(0.35 + 0.4 * (1 - amt * q), ctx.currentTime, 0.15);
      gR.gain.setTargetAtTime(0.35 + 0.4 * (1 - amt * (1 - q)), ctx.currentTime, 0.15);
    } else {
      gL.gain.setTargetAtTime(0.55, ctx.currentTime, 0.2);
      gR.gain.setTargetAtTime(0.55, ctx.currentTime, 0.2);
    }
    $("readL").textContent = fL.toFixed(1);
    $("readR").textContent = fR.toFixed(1);
    $("readPan").textContent = (p * depth).toFixed(2);
    raf = requestAnimationFrame(tick);
  }
  async function start() {
    ensureGraph();
    if (ctx.state === "suspended") await ctx.resume();
    state.running = true; t0 = 0; applyAudioParams(false);
    $("btnStart").classList.add("active"); $("btnStart").textContent = "RUNNING";
    $("btnStop").classList.remove("active"); $("runDot").classList.add("on"); $("runLabel").textContent = "Playing";
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stop() {
    state.running = false;
    if (master && ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    $("btnStart").classList.remove("active"); $("btnStart").textContent = "START";
    $("btnStop").classList.add("active"); setTimeout(() => $("btnStop").classList.remove("active"), 400);
    $("runDot").classList.remove("on"); $("runLabel").textContent = "Stopped";
    $("readL").textContent = "—"; $("readR").textContent = "—"; $("readPan").textContent = "—";
    cancelAnimationFrame(raf);
  }
  function loadSaved() { try { return JSON.parse(localStorage.getItem("repel-presets-v1") || "[]"); } catch (e) { return []; } }
  function storeSaved(list) { localStorage.setItem("repel-presets-v1", JSON.stringify(list)); }
  function renderSaved() {
    const host = $("savedList"); if (!host) return;
    const list = loadSaved(); host.innerHTML = "";
    if (!list.length) { host.innerHTML = '<p class="fine" style="grid-column:1/-1">No saved presets yet.</p>'; return; }
    list.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "preset"; b.dataset.id = p.id;
      b.innerHTML = p.name + "<small>L " + Math.round(p.l) + " · R " + Math.round(p.r) + " · hold to delete</small>";
      let hold;
      b.addEventListener("click", () => applyPreset(p));
      b.addEventListener("pointerdown", () => { hold = setTimeout(() => { storeSaved(loadSaved().filter((x) => x.id !== p.id)); renderSaved(); }, 700); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => clearTimeout(hold)));
      host.appendChild(b);
    });
  }
  $("btnStart").addEventListener("click", start);
  $("btnStop").addEventListener("click", stop);
  $("vol").addEventListener("input", (e) => {
    state.vol = Number(e.target.value); syncReads();
    if (master && ctx) master.gain.setTargetAtTime(state.running ? masterGainFromSlider() : 0, ctx.currentTime, 0.05);
  });
  $("lHz").addEventListener("input", (e) => {
    state.l = Number(e.target.value);
    if (state.linked) { state.r = clampHz(state.l + state.linkOffset); $("rHz").value = state.r; } else state.linkOffset = state.r - state.l;
    markCustom(); syncReads();
  });
  $("rHz").addEventListener("input", (e) => {
    state.r = Number(e.target.value);
    if (state.linked) { state.l = clampHz(state.r - state.linkOffset); $("lHz").value = state.l; } else state.linkOffset = state.r - state.l;
    markCustom(); syncReads();
  });
  $("lHz").addEventListener("change", () => commitChannel("l"));
  $("rHz").addEventListener("change", () => commitChannel("r"));
  ["lHzNum", "rHzNum"].forEach((id) => {
    $(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commitChannel(id === "lHzNum" ? "l" : "r"); e.target.blur(); }
    });
  });
  $("masterTune").addEventListener("input", (e) => { state.masterTune = Number(e.target.value); markCustom(); syncReads(); });
  $("lFine").addEventListener("input", (e) => { state.lFine = Number(e.target.value); markCustom(); syncReads(); });
  $("rFine").addEventListener("input", (e) => { state.rFine = Number(e.target.value); markCustom(); syncReads(); });
  $("btnTuneL").addEventListener("click", () => commitChannel("l"));
  $("btnTuneR").addEventListener("click", () => commitChannel("r"));
  $("btnTuneBoth").addEventListener("click", () => { commitChannel("l"); commitChannel("r"); flashTune("both"); });
  $("btnLink").addEventListener("click", () => {
    state.linked = !state.linked; state.linkOffset = state.r - state.l;
    $("btnLink").classList.toggle("active", state.linked);
    $("btnLink").textContent = state.linked ? "Linked · offset locked" : "Link L\u2194R offset";
  });
  $("btnResetOverlay").addEventListener("click", () => {
    state.masterTune = 0; state.lFine = 0; state.rFine = 0;
    $("masterTune").value = 0; $("lFine").value = 0; $("rFine").value = 0;
    markCustom(); syncReads(); if (state.running) applyAudioParams(true);
  });
  $("btnStandalone").addEventListener("click", () => {
    state.tunerOnly = !state.tunerOnly;
    document.body.classList.toggle("tuner-only", state.tunerOnly);
    $("btnStandalone").classList.toggle("active", state.tunerOnly);
    $("btnStandalone").textContent = state.tunerOnly ? "Show full page" : "Standalone tuner \u2014 hide presets";
    try { localStorage.setItem("repel-tuner-only", state.tunerOnly ? "1" : "0"); } catch (e) {}
    $("tuneSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  try {
    if (localStorage.getItem("repel-tuner-only") === "1" || /tuner=1|standalone=1/.test(location.search + location.hash)) {
      state.tunerOnly = true; document.body.classList.add("tuner-only");
      $("btnStandalone").classList.add("active"); $("btnStandalone").textContent = "Show full page";
    }
  } catch (e) {}
  ["panRate", "panDepth", "wander", "wanderT", "pulse"].forEach((id) => {
    $(id).addEventListener("input", (e) => { state[id] = Number(e.target.value); markCustom(); syncReads(); });
  });
  document.querySelectorAll("#waveSeg button").forEach((b) => {
    b.addEventListener("click", () => {
      state.wave = b.dataset.w;
      document.querySelectorAll("#waveSeg button").forEach((x) => x.classList.toggle("active", x === b));
      markCustom(); if (state.running) applyAudioParams(true);
    });
  });
  $("btnSave").addEventListener("click", () => {
    const name = ($("presetName").value || "").trim() || ("Custom " + new Date().toLocaleTimeString());
    const list = loadSaved();
    const item = { id: "user-" + Date.now(), name, sub: "saved", l: state.l, r: state.r, wave: state.wave, panRate: state.panRate, panDepth: state.panDepth, wander: state.wander, wanderT: state.wanderT, pulse: state.pulse };
    list.unshift(item); storeSaved(list.slice(0, 40)); $("presetName").value = ""; state.activePreset = item.id; renderSaved(); refreshPresetActive();
  });
  $("btnExport").addEventListener("click", async () => {
    const payload = JSON.stringify({ current: state, saved: loadSaved() }, null, 2);
    try { await navigator.clipboard.writeText(payload); $("btnExport").textContent = "Copied"; setTimeout(() => { $("btnExport").textContent = "Copy JSON"; }, 1200); }
    catch (e) { prompt("Copy this:", payload); }
  });
  renderPresetButtons(BUILTIN, "presetGrid");
  renderPresetButtons(HIGH, "highGrid");
  renderPresetButtons(EXTREME, "extremeGrid");
  renderSaved();
  if (BUILTIN[0]) applyPreset(BUILTIN[0]); else syncReads();
  stop();
})();
