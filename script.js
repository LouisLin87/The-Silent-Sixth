"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const E = window.StoryEngine;
  const G = window.NameGuard;
  const audio = new window.Soundscape(window);
  const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
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
    effects: $("#effects-toggle"), volume: $("#sound-volume"), music: $("#music-enabled"), audioStatus: $("#audio-status"),
    card: $("#ending-image"), cardBox: $("#ending-image-box"), cardSave: $("#save-ending-image"), cardShare: $("#share-ending-image"), cardStatus: $("#ending-image-status"),
    phone: $("#story-phone"),
    scene: $("#scene-status"), notification: $("#phantom-notification"),
    notificationName: $("#notification-name"), notificationText: $("#notification-text"),
  };
  const random = () => {
    if (!window.crypto?.getRandomValues) return Math.random();
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  };
  const state = {
    phase: "intro", alias: E.createAlias(random), name: "", group: "", run: null,
    history: [], score: { confront: 0, observe: 0, trust: 0 }, reactions: {}, waiting: false, composing: false,
    sound: true, result: null, reducedEffects: Boolean(motionPreference?.matches), tension: 0,
    cardJob: null, cardUrl: null, cardBlob: null, cardKey: null,
    device: E.detectDevice(navigator), city: null, cityState: "skipped", cityRequest: null,
    traceClient: null, trace: null, traceRequest: null, lastTrace: 0,
    names: new G.NameTracker(), playerRows: [], storyRows: new Map(), lastReceipt: null,
  };
  const params = new URLSearchParams(window.location.search);
  if (params.get("lang") === "en") window.I18N.toggle();

  function tone(...args) { audio.note(...args); }
  function keyClick(force = false, kind = "type") { audio.key(kind, force); }
  function stopAmbient() { audio.stopMusic(); }
  function startAmbient() { if (state.phase === "chat") audio.startMusic(state.tension); }
  function updateSound() { ui.sound.textContent = t(state.sound ? "sound.on" : "sound.off"); ui.sound.setAttribute("aria-pressed", String(state.sound)); }
  function updateEffects() {
    document.body.classList.toggle("reduce-effects", state.reducedEffects);
    ui.effects.textContent = t(state.reducedEffects ? "av.effectsOff" : "av.effectsOn");
    ui.effects.setAttribute("aria-pressed", String(!state.reducedEffects));
    ui.effects.disabled = Boolean(motionPreference?.matches);
    if (state.reducedEffects) { ui.overlay.classList.remove("is-visible"); ui.phone.classList.remove("signal-slip"); }
  }
  function setTension(level) {
    state.tension = level; audio.level = level;
    ui.phone.classList.toggle("is-tense", level >= 1); ui.phone.classList.toggle("is-hunted", level >= 3);
  }
  async function signalSlip(run, shadow = false) {
    run.assertActive(); audio.sting();
    if (!state.reducedEffects) {
      ui.phone.classList.add("signal-slip");
      if (shadow) ui.overlay.classList.add("is-visible");
    }
    await run.delay(shadow ? 1400 : 850); run.assertActive();
    ui.phone.classList.remove("signal-slip"); ui.overlay.classList.remove("is-visible");
  }

  function speakerName(speaker) {
    return ["entity", "player"].includes(speaker) ? state.name : t(`story.${speaker}`);
  }
  function appendMessage({ speaker = "system", text, earlier = false, id }) {
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
    if (speaker === "player") {
      const receipt = document.createElement("small"); receipt.className = "read-receipt";
      receipt.textContent = t("haunt.sent"); receipt.setAttribute("role", "status");
      wrap.append(receipt); state.lastReceipt = receipt;
    }
    if (id) state.storyRows.set(id, bubble);
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
    const pace = E.typingPlan(text, Math.random, step.speaker);
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
  function clearHaunting() {
    ui.notification.classList.add("hidden"); ui.notificationName.textContent = ""; ui.notificationText.textContent = "";
    state.storyRows.clear(); state.lastReceipt = null;
    ui.scene.textContent = t("haunt.scene.connected");
  }
  async function showNotification(run, step) {
    run.assertActive();
    const name = speakerName(step.speaker), message = translated(step);
    // A labelled, in-page story prop. No OS notifications, permissions or private messages.
    ui.notificationName.textContent = t("haunt.notificationTitle", { name });
    ui.notificationText.textContent = message; ui.notification.classList.remove("hidden");
    tone(520, .2, .035, 390, "triangle");
    await run.delay(4500); run.assertActive();
    ui.notification.classList.add("hidden");
    appendMessage({ speaker: "system", text: t("haunt.notificationSaved", { name, message }) });
  }
  async function execute(run, steps) {
    for (const step of steps) {
      run.assertActive();
      if (!step.kind) await typeThen(run, step);
      else if (step.kind === "members") memberCount(step.value);
      else if (step.kind === "pause") await run.delay(step.value);
      else if (step.kind === "scene") ui.scene.textContent = t(`haunt.scene.${step.value}`);
      else if (step.kind === "notification") await showNotification(run, step);
      else if (step.kind === "retract") {
        const bubble = state.storyRows.get(step.value);
        if (bubble) { bubble.textContent = t("haunt.withdrawn"); bubble.classList.add("withdrawn"); }
      }
      else if (step.kind === "receipt" && state.lastReceipt) {
        state.lastReceipt.textContent = step.value ? t("haunt.read", { count: step.value }) : t("haunt.unread");
        state.lastReceipt.classList.add("anomalous");
      }
      else if (step.kind === "knock") audio.knock();
      else if (step.kind === "redactNames") {
        // Only this run's chat bubbles change. The generated identity never changes.
        for (const { bubble, inspection } of state.playerRows) bubble.textContent = G.mask(inspection, t("identity.redacted"));
        await signalSlip(run);
      }
      else if (step.kind === "phantom") await phantomKeys(run);
      else if (step.kind === "tension") setTension(step.value);
      else if (step.kind === "glitch") await signalSlip(run);
      else if (step.kind === "calm") { if (step.value) { stopAmbient(); setTension(0); } else { setTension(3); startAmbient(); } }
      else if (step.kind === "haunt") await signalSlip(run, true);
      else if (step.kind === "ending") showEnding(step.value);
    }
  }
  async function perform(run, steps) {
    try {
      await execute(run, steps);
      if (state.run === run && state.phase === "chat") setWaiting(true);
    } catch (error) {
      if (error.name === "AbortError" || state.run !== run) return;
      run.cancel(); audio.stop(); clearHaunting(); setTension(0); ui.phone.classList.remove("signal-slip"); ui.typing.classList.add("hidden"); ui.overlay.classList.remove("is-visible");
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
    clearEndingCard(); clearHaunting(); setTension(0); void audio.unlock();
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
    keyClick(true, "send");
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
    const base = t(`results.${key}`);
    // Only authored route text reaches the public ending card, never the player's chat.
    const result = { ...base, copy: `${base.copy}\n\n${t(`haunt.routes.${E.storyProfile(state.history).route}.afterword`)}` };
    state.phase = "ending"; state.result = result; state.waiting = false; state.run?.cancel(); state.run = null;
    audio.stop(); clearHaunting(); setTension(0); ui.phone.classList.remove("signal-slip"); ui.typing.classList.add("hidden"); ui.input.blur();
    ui.endingKicker.textContent = result.kicker; ui.endingTitle.textContent = result.title;
    ui.endingCopy.textContent = result.copy; ui.endingRecord.textContent = result.record({ name: state.name });
    ui.chat.classList.add("hidden"); ui.ending.classList.remove("hidden"); ui.ending.scrollTop = 0;
    ui.endingTitle.focus({ preventScroll: true }); updateViewport();
    void prepareEndingCard(key, result);
  }
  function clearEndingCard() {
    state.cardJob = null; state.cardBlob = null; state.cardKey = null;
    if (state.cardUrl) URL.revokeObjectURL(state.cardUrl);
    state.cardUrl = null; ui.card.removeAttribute("src"); ui.cardSave.removeAttribute("href");
    ui.cardBox.classList.add("hidden"); ui.cardShare.disabled = true; ui.cardStatus.textContent = "";
  }
  async function prepareEndingCard(key, result) {
    clearEndingCard(); const job = {}; state.cardJob = job; ui.cardStatus.textContent = t("capture.preparing");
    try {
      const data = window.EndingCard.model(result, state.name, window.I18N.locale);
      const canvas = window.EndingCard.draw(document.createElement("canvas"), data);
      const blob = await window.EndingCard.toBlob(canvas);
      if (state.cardJob !== job || state.phase !== "ending") return;
      state.cardBlob = blob; state.cardKey = key; state.cardUrl = URL.createObjectURL(blob);
      ui.card.src = state.cardUrl; ui.cardSave.href = state.cardUrl; ui.cardSave.download = `sixth-member-${key}.png`;
      ui.card.alt = `${t("capture.alt")} ${result.title}`;
      ui.cardBox.classList.remove("hidden"); ui.cardShare.disabled = false;
      ui.cardStatus.textContent = t("capture.ready");
    } catch { if (state.cardJob === job) ui.cardStatus.textContent = t("capture.failed"); }
  }
  async function shareEndingCard() {
    if (!state.cardBlob || state.phase !== "ending") return;
    try {
      const file = new File([state.cardBlob], `sixth-member-${state.cardKey}.png`, { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] }) || !navigator.share) { ui.cardStatus.textContent = t("capture.fallback"); return; }
      await navigator.share({ files: [file], title: t("documentTitle") });
    } catch (error) { if (error.name !== "AbortError" && state.phase === "ending") ui.cardStatus.textContent = t("capture.fallback"); }
  }
  function leaveStory() {
    state.run?.cancel(); state.run = null; state.cityRequest?.abort(); state.cityRequest = null;
    state.traceRequest?.abort(); state.traceRequest = null; audio.stop(); clearEndingCard(); clearHaunting(); setTension(0); ui.phone.classList.remove("signal-slip");
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
    updateSound(); updateEffects(); updateContextUI(); ui.scene.textContent = t("haunt.scene.connected");
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
  const inputSound = (event) => { keyClick(false, String(event.inputType || "").startsWith("delete") ? "delete" : "type"); };
  ui.input.addEventListener("beforeinput", inputSound);
  ui.input.addEventListener("input", (event) => { inputSound(event); updateSend(); });
  ui.input.addEventListener("compositionstart", () => { state.composing = true; updateSend(); });
  ui.input.addEventListener("compositionend", () => { state.composing = false; updateSend(); });
  ui.input.addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.isComposing || event.keyCode === 229 || state.composing)) event.preventDefault(); });
  ui.input.addEventListener("focus", () => { void audio.unlock(); updateViewport(); }); ui.input.addEventListener("blur", updateViewport);
  for (const input of [ui.input, ui.group, ui.traceMessage]) input.addEventListener("pointerdown", () => { void audio.unlock(); });
  ui.group.addEventListener("input", () => keyClick()); ui.traceMessage.addEventListener("input", () => keyClick());
  ui.cityConsent.addEventListener("change", () => { void locateCity(); });
  ui.language.addEventListener("click", () => {
    if (state.phase !== "intro") return;
    const replaceGroup = !ui.group.value || ui.group.value === t("defaults.group");
    window.I18N.toggle(); if (replaceGroup) ui.group.value = t("defaults.group"); refreshLocale();
  });
  ui.sound.addEventListener("click", () => {
    state.sound = !state.sound; updateSound();
    audio.setEnabled(state.sound);
  });
  ui.effects.addEventListener("click", () => { state.reducedEffects = !state.reducedEffects || Boolean(motionPreference?.matches); updateEffects(); });
  motionPreference?.addEventListener?.("change", () => { if (motionPreference.matches) state.reducedEffects = true; updateEffects(); });
  ui.volume.addEventListener("input", () => audio.setVolume(Number(ui.volume.value) / 100));
  ui.music.addEventListener("change", () => audio.setMusic(ui.music.checked));
  $("#test-sound").addEventListener("click", async () => {
    state.sound = true; updateSound(); audio.setEnabled(true);
    const ready = await audio.unlock();
    if (ready) { keyClick(true); audio.note(440, .5, .09, 330, "sine", "effect", .2); }
    ui.audioStatus.textContent = t(ready ? "av.ready" : "av.unavailable");
  });
  ui.cardShare.addEventListener("click", () => { void shareEndingCard(); });
  $("#share-btn").addEventListener("click", () => { void share(); });
  $("#invite-btn").addEventListener("click", () => { void share(true); });
  ui.traceForm.addEventListener("submit", saveTrace);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
    else if (state.phase === "chat") void audio.unlock();
  });
  window.addEventListener("pagehide", leaveStory);
  window.addEventListener("resize", updateViewport); window.visualViewport?.addEventListener("resize", updateViewport);
  ui.group.value = params.has("invite") ? E.cleanText(params.get("group"), 20) || t("defaults.group") : t("defaults.group");
  // Ignore any player-name or alias query parameters: only generated aliases may identify the player.
  refreshLocale(); updateSend(); void initializeBackend();
})();
