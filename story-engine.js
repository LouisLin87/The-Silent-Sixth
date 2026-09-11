"use strict";

// Pure story rules: no storage, network, or access to a player's browser.
((root) => {
  const PREFIXES = ["霧", "灰", "夜", "雨", "空", "靜", "暗", "薄"];
  const NOUNS = ["匣", "潮", "鈴", "燈", "頁", "隙", "訊", "迴聲"];
  const EN_PREFIXES = ["Mist", "Ash", "Night", "Rain", "Hollow", "Quiet", "Dim", "Pale"];
  const EN_NOUNS = ["Box", "Tide", "Bell", "Lamp", "Page", "Gap", "Signal", "Echo"];

  function cleanText(value, max = 160) {
    return Array.from(String(value ?? "").normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "")
      .replace(/\s+/g, " ").trim()).slice(0, max).join("");
  }

  function createAlias(random = Math.random) {
    const index = (length) => Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
    return Object.freeze({ prefix: index(PREFIXES.length), noun: index(NOUNS.length), number: index(900) + 100 });
  }

  function aliasText(alias, locale = "zh") {
    if (!alias || !Number.isInteger(alias.prefix) || !Number.isInteger(alias.noun) ||
        alias.prefix < 0 || alias.prefix >= PREFIXES.length || alias.noun < 0 || alias.noun >= NOUNS.length ||
        !Number.isInteger(alias.number) || alias.number < 100 || alias.number > 999) throw new Error("Invalid story alias");
    return locale === "en" ? `${EN_PREFIXES[alias.prefix]} ${EN_NOUNS[alias.noun]}-${alias.number}` : `${PREFIXES[alias.prefix]}${NOUNS[alias.noun]}-${alias.number}`;
  }

  function classify(message) {
    const value = cleanText(message).toLowerCase().replace(/[’‘]/g, "'");
    if (/(不要|別|不信|不相信|不准|滾|閉嘴|离开|離開|冒充|模仿|騙)/u.test(value) ||
      /\b(don't|do not|never|stop|leave|fake|liar|shut up|not you|won't)\b/u.test(value)) return "confront";
    if (/(害怕|好怕|救命|恐怖|help|scared|afraid|terrified)/u.test(value)) return "fear";
    if (/(哈哈|呵呵|笑死|搞笑|好笑|😂|🤣)/u.test(value) || /\b(lol|lmao|haha|funny|joke)\b/u.test(value)) return "joke";
    if (/(我相信你|我同意|讓你代替|交給你|相信你了)/u.test(value) || /\b(i trust you|i agree|take my place|i believe you)\b/u.test(value)) return "trust";
    if (/(你是誰|為什麼|为什么|通知|紀錄|記錄|訊息|什麼|什么|哪裡|哪里|怎麼|怎么)/u.test(value) ||
      /\b(who|why|where|how|what|check|history|record|read)\b/u.test(value) || /[?？]/u.test(value)) return "observe";
    const compact = value.replace(/\s/g, "");
    if (!/[\p{L}\p{N}]/u.test(value) || /(.)\1{4,}/u.test(compact) ||
      /^(?:asdf|qwer|zxcv|hjkl|dfgh|1234|abcd)[a-z0-9]*$/iu.test(compact)) return "garble";
    return "ordinary";
  }

  function scoreIntent(score, intent) {
    if (intent === "confront" || intent === "trust" || intent === "observe") score[intent] += 1;
    // Off-topic replies, emojis, silence and jokes never count as consent.
  }

  function endingKey(score) {
    if (score.trust >= 2 && score.trust > score.confront && score.trust > score.observe) return "consent";
    return score.confront > score.observe ? "replaced" : "sixth";
  }

  function typingPlan(text, random = Math.random) {
    const characters = Array.from(String(text));
    const units = characters.reduce((sum, char) => sum + (/\p{Script=Han}/u.test(char) ? 1 : .38), 0);
    const punctuation = (String(text).match(/[，。！？,.!?\n]/g) || []).length;
    const typing = Math.round(Math.min(8200, Math.max(1700, 1250 + units * 118 + punctuation * 130)) * (.92 + random() * .16));
    return { read: Math.round(650 + random() * 1050), typing, hesitation: units > 20 && random() < .38 ? Math.round(600 + random() * 850) : 0 };
  }

  function detectDevice(nav = {}) {
    const ua = String(nav.userAgent || "");
    if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && Number(nav.maxTouchPoints) > 1)) return "ipad";
    if (/iPhone|iPod/i.test(ua)) return "iphone";
    if (/Android/i.test(ua)) return "android";
    if (/Windows/i.test(ua)) return "windows";
    if (/Macintosh|Mac OS/i.test(ua)) return "mac";
    if (/CrOS/i.test(ua)) return "chromebook";
    if (/Linux/i.test(ua)) return "linux";
    return "unknown";
  }

  function coarseCity(data) {
    if (data?.success !== true || typeof data.city !== "string") return null;
    const city = cleanText(data.city, 60);
    if (!city || !/\p{L}/u.test(city) || /[<>@/\\]/u.test(city)) return null;
    // Deliberately omit IP, region, postal code, coordinates and network details.
    return { city };
  }

  function replyKey(intent, count = 0) {
    return `replies.${intent}.${count % 3}`;
  }

  function chapter(turn, context) {
    const { history, score, device, city, intent, reactionCount, trace } = context;
    const memory = cleanText(history[0], 55);
    const latest = cleanText(history[history.length - 1], 70);
    const say = (speaker, key, values = {}) => ({ speaker, key, values });
    const event = (kind, value) => ({ kind, value });
    const reaction = { ...say(["fear", "joke", "ordinary"].includes(intent) ? "ann" : "entity", replyKey(intent, reactionCount)), isReaction: true };
    switch (turn) {
      case 0: return [reaction, say("ann", "story.photo")];
      case 1: return [reaction, say("entity", "story.delayedEcho", { message: memory }), event("phantom"), say("yao", "story.keys")];
      case 2: return [reaction, say("entity", device === "unknown" ? "story.deviceUnknown" : "story.device", { device }),
        say("entity", city ? "story.city" : "story.cityUnknown", { city: city?.city }), say("ann", "story.whichOne")];
      case 3: return [say("entity", "story.stolenMemory", { message: memory }), say("sen", "story.ignoreNewcomer"),
        ...(trace ? [say("system", "story.traceFound"), { speaker: "deleted", text: trace }] : []), reaction];
      case 4: return [say("entity", "story.leaving"), say("system", "story.left"), event("members", 5), event("calm", true),
        say("yao", "story.relief"), say("ann", "story.breakfast")];
      case 5: return [say("ann", "story.breakfastReply", { message: latest }), say("sen", "story.goodnight"),
        event("pause", 3600), say("system", "story.otherDevice"), event("calm", false), event("haunt")];
      case 6: return [event("phantom"), { speaker: "entity", text: latest, earlier: true },
        say("system", "story.earlier"), say("yao", "story.realOne"), reaction];
      case 7: {
        const ending = endingKey(score);
        return [say("sen", `story.final.${ending}`), say("entity", "story.finalEcho", { message: memory }),
          event("pause", 2300), event("ending", ending)];
      }
      default: throw new RangeError("Unknown chapter");
    }
  }

  // Every pending delay belongs to a run. Hidden tabs pause rather than accumulate replies.
  class StoryRun {
    constructor(doc) { this.doc = doc; this.controller = new AbortController(); }
    get signal() { return this.controller.signal; }
    cancel() { this.controller.abort(); }
    assertActive() { if (this.signal.aborted) throw new DOMException("Story stopped", "AbortError"); }
    delay(ms) {
      this.assertActive();
      return new Promise((resolve, reject) => {
        let remaining = Math.max(0, ms), started = 0, timer = null;
        const cleanup = () => {
          clearTimeout(timer);
          this.doc.removeEventListener("visibilitychange", onVisibility);
          this.signal.removeEventListener("abort", onAbort);
        };
        const finish = () => { cleanup(); resolve(); };
        const start = () => {
          if (this.signal.aborted || this.doc.hidden) return;
          started = Date.now();
          timer = setTimeout(finish, remaining);
        };
        const onVisibility = () => {
          if (this.doc.hidden && timer !== null) {
            clearTimeout(timer); timer = null;
            remaining = Math.max(0, remaining - (Date.now() - started));
          } else if (!this.doc.hidden && timer === null) start();
        };
        const onAbort = () => { cleanup(); reject(new DOMException("Story stopped", "AbortError")); };
        this.doc.addEventListener("visibilitychange", onVisibility);
        this.signal.addEventListener("abort", onAbort, { once: true });
        start();
      });
    }
  }

  const engine = { cleanText, createAlias, aliasText, classify, scoreIntent, endingKey, typingPlan, detectDevice, coarseCity, replyKey, chapter, StoryRun };
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  else root.StoryEngine = engine;
})(typeof window !== "undefined" ? window : globalThis);
