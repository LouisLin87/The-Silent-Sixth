"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const E = window.StoryEngine;
  const G = window.NameGuard;
  const t = (key, values) => window.I18N.t(key, values);
  const config = window.APP_CONFIG || {};
  const ui = {
    intro: $("#intro-screen"), chat: $("#chat-screen"), ending: $("#ending-screen"),
    name: $("#player-name"), group: $("#group-name"), groupTitle: $("#group-title"), members: $("#member-count"),
    messages: $("#messages"), typing: $("#typing"), typingName: $("#typing-name"), hint: $("#chat-hint"),
    input: $("#chat-input"), send: $("#send-message"), sound: $("#sound-toggle"), language: $("#language-toggle"),
    overlay: $("#haunt-overlay"), cityConsent: $("#location-consent"), cityStatus: $("#location-status"),
    endingTitle: $("#ending-title"), endingKicker: $("#ending-kicker"), endingCopy: $("#ending-copy"), endingRecord: $("#ending-record"),
    shareStatus: $("#share-status"), shareFallback: $("#share-fallback"), traceForm: $("#trace-form"),
    traceMessage: $("#trace-message"), traceConsent: $("#trace-consent"), traceStatus: $("#trace-status"), saveTrace: $("#save-trace-btn"),
  };
  const random = () => {
    if (!window.crypto?.getRandomValues) return Math.random();
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  };
  const state = {
    phase: "intro", alias: E.createAlias(random), name: "", group: "", run: null,
    history: [], score: { confront: 0, observe: 0, trust: 0 }, reactions: {}, waiting: false, composing: false,
    sound: true, audio: null, ambient: null, lastKey: 0, result: null,
    device: E.detectDevice(navigator), city: null, cityState: "skipped", cityRequest: null,
    traceClient: null, trace: null, traceRequest: null, lastTrace: 0,
    names: new G.NameTracker(), playerRows: [],
  };
  const params = new URLSearchParams(window.location.search);
  if (params.get("lang") === "en") window.I18N.toggle();

  function soundContext() {
    if (!state.sound || document.hidden) return null;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      state.audio ??= new Audio();
      if (state.audio.state === "suspended") void state.audio.resume().catch(() => {});
      return state.audio;
    } catch { return null; }
  }
  function tone(frequency, duration, volume, end, type = "sine") {
    const ctx = soundContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (end) osc.frequency.exponentialRampToValueAtTime(end, ctx.currentTime + duration);
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(); osc.stop(ctx.currentTime + duration + .025);
    } catch { /* Audio is optional; a restricted audio device must not stop the story. */ }
  }
  function keyClick(force = false) {
    if (!force && Date.now() - state.lastKey < 65) return;
    state.lastKey = Date.now();
    tone(1150, .035, .007, 850, "square");
  }
  function stopAmbient() {
    if (!state.ambient) return;
    try { state.ambient.osc.stop(); state.ambient.osc.disconnect(); state.ambient.gain.disconnect(); } catch { /* already stopped */ }
    state.ambient = null;
  }
  function startAmbient() {
    if (state.ambient || state.phase !== "chat") return;
    const ctx = soundContext();
    if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = 48; gain.gain.value = .004;
    osc.connect(gain).connect(ctx.destination); osc.start();
    state.ambient = { osc, gain };
  }
  function updateSound() { ui.sound.textContent = t(state.sound ? "sound.on" : "sound.off"); ui.sound.setAttribute("aria-pressed", String(state.sound)); }

  function speakerName(speaker) {
    return ["entity", "player"].includes(speaker) ? state.name : t(`story.${speaker}`);
  }
  function appendMessage({ speaker = "system", text, earlier = false }) {
    const atBottom = ui.messages.scrollHeight - ui.messages.scrollTop - ui.messages.clientHeight < 85;
    const article = document.createElement("article");
    const kind = speaker === "deleted" ? "entity" : ["system", "player", "entity"].includes(speaker) ? speaker : "person";
    article.className = `message ${kind}`;
    const wrap = document.createElement("div"); wrap.className = "bubble-wrap";
    if (kind !== "system") {
      const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = kind === "entity" ? "·" : speakerName(speaker).slice(0, 1);
      const name = document.createElement("b"); name.className = "sender"; name.textContent = speakerName(speaker);
      wrap.append(name); article.append(avatar);
    }
    const bubble = document.createElement("p"); bubble.className = "bubble";
    // All user text and location results are rendered as text, never HTML.
    bubble.textContent = text; wrap.append(bubble);
    if (kind !== "system") {
      const time = document.createElement("time");
      time.textContent = `02:${String(17 + state.history.length - (earlier ? 1 : 0)).padStart(2, "0")}`;
      wrap.append(time);
    }
    article.append(wrap); ui.messages.append(article);
    if (atBottom || speaker === "player") ui.messages.scrollTop = ui.messages.scrollHeight;
    if (kind === "entity") tone(182, .35, .022, 83);
    else if (kind === "person") tone(740, .12, .017, 620, "triangle");
    return bubble;
  }
  function memberCount(count) { ui.members.textContent = t("chat.memberCount", { count }); }
  function updateSend() { ui.send.disabled = !state.waiting || state.composing || !E.cleanText(ui.input.value); }
  function setWaiting(enabled) {
    state.waiting = enabled;
    ui.hint.textContent = enabled ? t(`chat.prompts.${state.history.length}`) : t("chat.waiting");
    updateSend();
  }
  function translated(step) {
    const values = { name: state.name, ...step.values };
    if (values.device) values.device = t(`devices.${values.device}`);
    return step.text ?? t(step.key, values);
  }
  async function typeThen(run, step) {
    run.assertActive();
    const text = translated(step);
    if (step.speaker === "system") {
      await run.delay(750); run.assertActive(); appendMessage({ ...step, text }); return;
    }
    const pace = E.typingPlan(text);
    await run.delay(pace.read); run.assertActive();
    ui.typingName.textContent = t("chat.typing", { name: speakerName(step.speaker) });
    ui.typing.classList.remove("hidden");
    if (pace.hesitation) {
      await run.delay(pace.typing * .5); run.assertActive(); ui.typing.classList.add("hidden");
      await run.delay(pace.hesitation); run.assertActive(); ui.typing.classList.remove("hidden");
      await run.delay(pace.typing * .5);
    } else await run.delay(pace.typing);
    run.assertActive(); ui.typing.classList.add("hidden"); appendMessage({ ...step, text });
  }
  async function phantomKeys(run) {
    await run.delay(650); run.assertActive();
    ui.typingName.textContent = t("chat.typing", { name: state.name }); ui.typing.classList.remove("hidden");
    for (const wait of [230, 410, 290]) { await run.delay(wait); run.assertActive(); keyClick(true); }
    await run.delay(1100); run.assertActive(); ui.typing.classList.add("hidden");
  }
  async function execute(run, steps) {
    for (const step of steps) {
      run.assertActive();
      if (!step.kind) await typeThen(run, step);
      else if (step.kind === "members") memberCount(step.value);
      else if (step.kind === "pause") await run.delay(step.value);
      else if (step.kind === "redactNames") {
        // Only this run's chat bubbles change. The generated identity never changes.
        for (const { bubble, inspection } of state.playerRows) bubble.textContent = G.mask(inspection, t("identity.redacted"));
      }
      else if (step.kind === "phantom") await phantomKeys(run);
      else if (step.kind === "calm") { if (step.value) stopAmbient(); else startAmbient(); }
      else if (step.kind === "haunt") {
        ui.overlay.classList.add("is-visible"); await run.delay(750); run.assertActive(); ui.overlay.classList.remove("is-visible");
      } else if (step.kind === "ending") showEnding(step.value);
    }
  }
  async function perform(run, steps) {
    try {
      await execute(run, steps);
      if (state.run === run && state.phase === "chat") setWaiting(true);
    } catch (error) {
      if (error.name === "AbortError" || state.run !== run) return;
      run.cancel(); stopAmbient(); ui.typing.classList.add("hidden"); ui.overlay.classList.remove("is-visible");
      setWaiting(false); ui.hint.textContent = t("context.error");
    }
  }

  function updateContextUI() {
    $("#device-status").textContent = t("context.device", { device: t(`devices.${state.device}`) });
    ui.cityStatus.textContent = t(`context.${state.cityState}`, { city: state.city?.city });
  }
  async function locateCity() {
    state.cityRequest?.abort(); state.cityRequest = null; state.city = null;
    if (!ui.cityConsent.checked) { state.cityState = "skipped"; updateContextUI(); return; }
    const request = new AbortController(); state.cityRequest = request;
    state.cityState = "loading"; updateContextUI();
    const timeout = window.setTimeout(() => request.abort(), 5500);
    try {
      // One opt-in request; the provider receives the connection IP. No chat, alias or device data is appended.
      // Request only these fields: never retrieve raw IP, GPS coordinates or postal code.
      const response = await fetch("https://ipwho.is/?fields=success,city", {
        credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", signal: request.signal,
      });
      if (!response.ok) throw new Error("City unavailable");
      const city = E.coarseCity(await response.json());
      if (state.cityRequest !== request || !ui.cityConsent.checked || request.signal.aborted) return;
      state.city = city; state.cityState = city ? "found" : "failed";
    } catch {
      if (state.cityRequest === request && ui.cityConsent.checked) state.cityState = "failed";
    } finally {
      window.clearTimeout(timeout);
      if (state.cityRequest === request) { state.cityRequest = null; updateContextUI(); }
    }
  }

  function start(event) {
    event.preventDefault();
    if (state.phase !== "intro") return;
    // Identity comes from the generated structure, never from the input or URL parameters.
    state.name = E.aliasText(state.alias, window.I18N.locale);
    state.group = E.cleanText(ui.group.value, 20) || t("defaults.group");
    state.phase = "chat"; state.run?.cancel(); state.run = new E.StoryRun(document);
    state.history = []; state.score = { confront: 0, observe: 0, trust: 0 }; state.reactions = {}; state.result = null;
    state.names = new G.NameTracker(); state.playerRows = [];
    ui.messages.replaceChildren(); ui.input.value = ""; state.composing = false;
    ui.intro.classList.add("hidden"); ui.ending.classList.add("hidden"); ui.chat.classList.remove("hidden");
    ui.language.disabled = true; ui.groupTitle.textContent = state.group; memberCount(5); setWaiting(false);
    startAmbient(); void loadTrace(state.run);
    const opening = [{ speaker: "system", key: "story.joinedGroup", values: { group: state.group } }];
    if (params.has("invite")) opening.push({ speaker: "system", key: "story.invited" });
    opening.push({ speaker: "ann", key: "story.openingAnn" }, { speaker: "yao", key: "story.openingYao" },
      { speaker: "system", key: "story.joined" }, { kind: "members", value: 6 }, { speaker: "entity", key: "story.openingEntity" });
    void perform(state.run, opening);
  }
  function submitMessage(event) {
    event.preventDefault();
    if (!state.waiting || state.phase !== "chat" || state.composing) return;
    const message = E.cleanText(ui.input.value);
    if (!message) return;
    const turn = state.history.length;
    if (turn >= 8) return;
    const inspection = G.inspect(message);
    const alreadyRedacted = state.names.redacted;
    const nameReaction = state.names.accept(inspection);
    // Characters quote only the masked version, never speak as a real public figure.
    state.history.push(G.mask(inspection, t("identity.borrowed"))); ui.input.value = ""; setWaiting(false);
    const bubble = appendMessage({ speaker: "player", text: alreadyRedacted ? G.mask(inspection, t("identity.redacted")) : message });
    state.playerRows.push({ bubble, inspection });
    const intent = E.classify(message);
    // A borrowed-identity joke must not count as consenting to replacement.
    if (!nameReaction.length) E.scoreIntent(state.score, intent);
    const reactionCount = state.reactions[intent] || 0; state.reactions[intent] = reactionCount + 1;
    const chapter = E.chapter(turn, { history: state.history, score: state.score, intent, reactionCount,
      device: state.device, city: ui.cityConsent.checked ? state.city : null, trace: state.trace });
    void perform(state.run, G.weave(chapter, nameReaction));
  }
  function showEnding(key) {
    const result = t(`results.${key}`);
    state.phase = "ending"; state.result = result; state.waiting = false; state.run?.cancel(); state.run = null;
    stopAmbient(); ui.typing.classList.add("hidden"); ui.input.blur();
    ui.endingKicker.textContent = result.kicker; ui.endingTitle.textContent = result.title;
    ui.endingCopy.textContent = result.copy; ui.endingRecord.textContent = result.record({ name: state.name });
    ui.chat.classList.add("hidden"); ui.ending.classList.remove("hidden"); ui.ending.scrollTop = 0;
    ui.endingTitle.focus({ preventScroll: true }); updateViewport();
  }
  function leaveStory() {
    state.run?.cancel(); state.run = null; state.cityRequest?.abort(); state.cityRequest = null;
    state.traceRequest?.abort(); state.traceRequest = null; stopAmbient();
    state.phase = "intro"; state.waiting = false; state.composing = false; state.history = []; state.score = { confront: 0, observe: 0, trust: 0 };
    state.reactions = {}; state.city = null; state.cityState = "skipped"; state.trace = null; state.result = null;
    state.names = new G.NameTracker(); state.playerRows = [];
    ui.cityConsent.checked = false; ui.messages.replaceChildren(); ui.input.value = ""; ui.input.blur();
    ui.traceMessage.value = ""; ui.traceConsent.checked = false; ui.traceStatus.textContent = "";
    ui.shareStatus.textContent = ""; ui.shareFallback.value = ""; ui.shareFallback.classList.add("hidden");
    ui.endingRecord.textContent = ""; ui.overlay.classList.remove("is-visible"); ui.typing.classList.add("hidden");
    ui.chat.classList.add("hidden"); ui.ending.classList.add("hidden"); ui.intro.classList.remove("hidden");
    ui.language.disabled = false; updateContextUI(); updateViewport();
  }
  function reroll() { state.alias = E.createAlias(random); ui.name.value = E.aliasText(state.alias, window.I18N.locale); }
  function refreshLocale() {
    window.I18N.applyStatic(); ui.name.value = E.aliasText(state.alias, window.I18N.locale);
    ui.language.textContent = window.I18N.locale === "zh" ? "EN" : "繁中";
    ui.language.setAttribute("aria-label", window.I18N.locale === "zh" ? "Switch to English" : "切換繁體中文");
    updateSound(); updateContextUI();
  }

  // Optional reviewed traces: retain the existing Supabase schema and public config.
  async function initializeBackend() {
    if (!config.supabaseUrl || !config.supabasePublishableKey) return;
    try {
      if (!window.supabase) await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve; script.onerror = reject; document.head.append(script);
      });
      state.traceClient = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      ui.traceForm.classList.remove("hidden");
    } catch { /* An optional backend failure must not block the story. */ }
  }
  function readableTrace(message) { return Array.from(message).filter((char) => /[\p{L}\p{N}]/u.test(char)).length >= 2 && !/(.)\1{5,}/u.test(message) && !/(https?:\/\/|www\.|@)/iu.test(message); }
  async function loadTrace(run) {
    state.trace = null;
    if (!state.traceClient) return;
    try {
      const { data, error } = await state.traceClient.from(config.traceTable || "group_traces").select("message").eq("is_visible", true)
        .order("created_at", { ascending: false }).limit(24).abortSignal(run.signal);
      if (error || state.run !== run || run.signal.aborted) return;
      const safe = (data || []).map((row) => E.cleanText(row.message, 120)).filter(readableTrace);
      if (safe.length) state.trace = safe[Math.floor(random() * safe.length)];
    } catch { /* Keep the self-contained story. */ }
  }
  async function saveTrace(event) {
    event.preventDefault();
    if (!state.traceClient || state.traceRequest) return;
    const message = E.cleanText(ui.traceMessage.value, 120);
    if (!ui.traceConsent.checked) { ui.traceStatus.textContent = t("backend.consent"); return; }
    if (!readableTrace(message)) { ui.traceStatus.textContent = t("backend.invalid"); return; }
    if (Date.now() - state.lastTrace < 60000) { ui.traceStatus.textContent = t("backend.cooldown"); return; }
    const request = new AbortController(); state.traceRequest = request;
    const timeout = window.setTimeout(() => request.abort(), 10000);
    ui.saveTrace.disabled = true; ui.traceStatus.textContent = t("backend.sending");
    try {
      const { error } = await state.traceClient.from(config.traceTable || "group_traces").insert({ message, source: "threads-web" }).abortSignal(request.signal);
      if (error) throw error;
      if (state.traceRequest !== request) return;
      state.lastTrace = Date.now(); ui.traceMessage.value = ""; ui.traceConsent.checked = false; ui.traceStatus.textContent = t("backend.sent");
    } catch { if (state.traceRequest === request) ui.traceStatus.textContent = t("backend.failed"); }
    finally { window.clearTimeout(timeout); if (state.traceRequest === request) state.traceRequest = null; ui.saveTrace.disabled = false; }
  }
  async function share(invite = false) {
    const url = new URL(window.location.href);
    if (!/^https?:$/.test(url.protocol) || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      ui.shareStatus.textContent = t("share.local"); return;
    }
    url.search = ""; url.hash = "";
    url.searchParams.set("lang", window.I18N.locale);
    if (invite) { url.searchParams.set("invite", window.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${random().toString(36).slice(2)}`); url.searchParams.set("group", state.group); }
    const text = invite ? t("share.invite", { group: state.group }) : t("share.text", { title: state.result?.title || "" });
    try { if (navigator.share) { await navigator.share({ title: t("documentTitle"), text, url: url.href }); return; } }
    catch (error) { if (error.name === "AbortError") return; }
    const content = `${text}\n${url.href}`;
    try { await navigator.clipboard.writeText(content); ui.shareStatus.textContent = t("share.copied"); }
    catch { ui.shareFallback.value = content; ui.shareFallback.classList.remove("hidden"); ui.shareStatus.textContent = t("share.fallback"); }
  }

  let largestViewport = window.innerHeight;
  function updateViewport() {
    const height = window.visualViewport?.height || window.innerHeight;
    const hasInput = document.activeElement === ui.input;
    if (!hasInput) largestViewport = Math.max(largestViewport, height);
    const keyboard = state.phase === "chat" && hasInput && height < largestViewport - 110;
    document.documentElement.style.setProperty("--viewport-height", `${Math.round(height)}px`);
    document.body.classList.toggle("keyboard-open", keyboard);
  }
  $("#start-form").addEventListener("submit", start);
  $("#chat-form").addEventListener("submit", submitMessage);
  $("#exit-btn").addEventListener("click", leaveStory); $("#restart-btn").addEventListener("click", leaveStory);
  $("#reroll-name").addEventListener("click", reroll);
  ui.input.addEventListener("input", () => { keyClick(); updateSend(); });
  ui.input.addEventListener("compositionstart", () => { state.composing = true; updateSend(); });
  ui.input.addEventListener("compositionend", () => { state.composing = false; updateSend(); });
  ui.input.addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.isComposing || event.keyCode === 229 || state.composing)) event.preventDefault(); });
  ui.input.addEventListener("focus", updateViewport); ui.input.addEventListener("blur", updateViewport);
  ui.group.addEventListener("input", () => keyClick()); ui.traceMessage.addEventListener("input", () => keyClick());
  ui.cityConsent.addEventListener("change", () => { void locateCity(); });
  ui.language.addEventListener("click", () => {
    if (state.phase !== "intro") return;
    const replaceGroup = !ui.group.value || ui.group.value === t("defaults.group");
    window.I18N.toggle(); if (replaceGroup) ui.group.value = t("defaults.group"); refreshLocale();
  });
  ui.sound.addEventListener("click", () => {
    state.sound = !state.sound; updateSound();
    if (state.sound) { tone(510, .055, .01, 420, "triangle"); startAmbient(); }
    else { stopAmbient(); if (state.audio) void state.audio.suspend().catch(() => {}); }
  });
  $("#share-btn").addEventListener("click", () => { void share(); });
  $("#invite-btn").addEventListener("click", () => { void share(true); });
  ui.traceForm.addEventListener("submit", saveTrace);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopAmbient(); if (state.audio) void state.audio.suspend().catch(() => {}); }
    else startAmbient();
  });
  window.addEventListener("pagehide", leaveStory);
  window.addEventListener("resize", updateViewport); window.visualViewport?.addEventListener("resize", updateViewport);
  ui.group.value = params.has("invite") ? E.cleanText(params.get("group"), 20) || t("defaults.group") : t("defaults.group");
  // Ignore any player-name or alias query parameters: only generated aliases may identify the player.
  refreshLocale(); updateSend(); void initializeBackend();
})();
