"use strict";

((root) => {
  const local = typeof module !== "undefined" && module.exports;
  const E = local ? require("./story-engine.js") : root.StoryEngine;
  const names = local ? require("./public-names.js") : root.PUBLIC_NAMES;
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const latinWord = (char) => /[\p{Script=Latin}\p{N}_]/u.test(char || "");
  const patterns = names.flatMap(({ id, aliases }) => aliases.map((alias) => {
    const text = E.cleanText(alias);
    const han = /^[\p{Script=Han}·]+$/u.test(text);
    const source = han ? Array.from(text.replace(/·/g, "")).map(escape).join("[ ·・‧]{0,3}") : text.split(/\s+/).map(escape).join("\\s+");
    return { id, regex: new RegExp(source, "giu"), latin: !han };
  }));

  function inspect(input) {
    const text = E.cleanText(input), candidates = [];
    for (const { id, regex, latin } of patterns) {
      regex.lastIndex = 0;
      for (const match of text.matchAll(regex)) {
        const start = match.index, end = start + match[0].length;
        if (latin && (latinWord(text[start - 1]) || latinWord(text[end]))) continue;
        candidates.push({ start, end, id, known: true });
      }
    }
    // Unknown names only trigger when explicitly declared in quotes. Do not guess
    // that phrases such as "I am tired" or "我叫你閉嘴" are people's names.
    const declaration = /(?:我叫|叫我|我的名字是|\bmy name is|\bcall me)\s*[「『“"]([\p{L}][\p{L}\p{M} .'-]{1,30})[」』”"]/giu;
    for (const match of text.matchAll(declaration)) {
      const value = match[1], start = match.index + match[0].length - 1 - value.length, end = start + value.length;
      if (!candidates.some((span) => start < span.end && end > span.start)) {
        candidates.push({ start, end, id: `declared:${value.toLowerCase().replace(/\s+/g, " ").trim()}`, known: false });
      }
    }
    // Longest at each start wins; overlapping aliases never double count.
    candidates.sort((a, b) => a.start - b.start || b.end - a.end);
    const spans = [];
    for (const span of candidates) if (!spans.length || span.start >= spans[spans.length - 1].end) spans.push(span);
    const claim = spans.some((span) => !span.known ||
      /(?:我是|我就是|我叫|叫我|我的名字是|\bi am|\bi['’]m|\bcall me|\bmy name is)\s*[「『“"]?\s*$/iu.test(text.slice(0, span.start)));
    return { text, spans, claim, known: spans.some((span) => span.known) };
  }

  function mask(inspection, replacement) {
    let result = "", cursor = 0;
    for (const span of inspection.spans) {
      result += inspection.text.slice(cursor, span.start) + replacement;
      cursor = span.end;
    }
    return result + inspection.text.slice(cursor);
  }

  class NameTracker {
    constructor() { this.seen = new Set(); this.turns = 0; this.redacted = false; }
    accept(inspection) {
      if (!inspection.spans.length) return [];
      const before = this.seen.size;
      inspection.spans.forEach((span) => this.seen.add(span.id));
      const added = this.seen.size > before;
      this.turns += 1;
      const say = (speaker, key, values = {}) => ({ speaker, key: `identity.${key}`, values });
      if (!this.redacted && this.seen.size >= 3) {
        this.redacted = true;
        return [{ kind: "pause", value: 1200 }, { kind: "redactNames" }, say("system", "redactedNotice"),
          say("entity", "third", { count: this.seen.size })];
      }
      if (this.redacted) return [say("entity", `after.${this.turns % 2}`)];
      if (before > 0 && added) return [say("entity", "changed")];
      if (before > 0) return [say("entity", `repeat.${this.turns % 2}`)];
      if (inspection.claim) return [say("entity", inspection.known ? "claim" : "declared")];
      return [say("system", "mentionNotice"), say("entity", "mention")];
    }
  }

  function weave(chapter, reaction) {
    return reaction.length ? [...reaction, ...chapter.filter((step) => !step.isReaction)] : chapter;
  }
  const guard = { inspect, mask, NameTracker, weave };
  if (local) module.exports = guard;
  else root.NameGuard = guard;
})(typeof window !== "undefined" ? window : globalThis);
