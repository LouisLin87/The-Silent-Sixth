"use strict";
// Original synthesized audio. No recordings, downloads, microphone or external service.
((root) => {
  class Soundscape {
    constructor(env = root) {
      this.env = env; this.ctx = null; this.master = null; this.voices = new Set();
      this.enabled = true; this.musicEnabled = true; this.wantMusic = false;
      this.level = 0; this.beat = 0; this.timer = null; this.lastKey = -Infinity; this.volume = .6;
    }
    async unlock() {
      if (!this.enabled || this.env.document?.hidden) return false;
      try {
        const Audio = this.env.AudioContext || this.env.webkitAudioContext;
        if (!Audio) return false;
        if (!this.ctx) {
          this.ctx = new Audio(); this.master = this.ctx.createGain(); this.master.gain.value = this.volume;
          const limiter = this.ctx.createDynamicsCompressor();
          limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 8;
          this.master.connect(limiter); limiter.connect(this.ctx.destination);
        }
        if (this.ctx.state !== "running") await this.ctx.resume();
        if (!this.enabled || this.env.document?.hidden) { void this.ctx.suspend().catch(() => {}); return false; }
        if (this.wantMusic) this.startMusic();
        return this.ctx.state === "running";
      } catch { return false; }
    }
    available() { return this.enabled && !this.env.document?.hidden && this.ctx?.state === "running"; }
    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (this.master) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, .025);
    }
    setEnabled(value) { this.enabled = Boolean(value); if (!this.enabled) this.pause(); else void this.unlock(); }
    setMusic(value) {
      this.musicEnabled = Boolean(value);
      if (!this.musicEnabled) this.stopMusic(false);
      else if (this.wantMusic) { void this.unlock(); this.startMusic(); }
    }
    note(frequency, duration, volume, end, type = "sine", channel = "effect", offset = 0) {
      if (!this.available() || this.voices.size >= 32) return;
      try {
        const ctx = this.ctx, oscillator = ctx.createOscillator(), gain = ctx.createGain();
        const start = ctx.currentTime + offset;
        oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
        if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0001, Math.min(.2, volume)), start + Math.min(.02, duration / 4));
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(gain); gain.connect(this.master);
        const voice = { source: oscillator, gain, channel };
        this.voices.add(voice);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(voice); };
        oscillator.start(start); oscillator.stop(start + duration + .02);
      } catch { /* Optional audio must never block a reply. */ }
    }
    key(kind = "type", force = false) {
      const now = Date.now();
      if (!this.available() || (!force && now - this.lastKey < 38)) return;
      this.lastKey = now;
      // A short body plus a bright tap remains audible on small phone speakers.
      const base = kind === "delete" ? 680 : kind === "send" ? 1180 : 940;
      this.note(base, .045, .15, base * .62, "triangle");
      this.note(base * 2.6, .019, .045, base * 1.7, "sine");
      if (kind === "send") this.note(1510, .09, .07, 1100, "sine", "effect", .055);
    }
    sting() {
      this.note(330, 1.25, .09, 110, "triangle");
      this.note(349.23, 1.05, .045, 146.83, "sine", "effect", .08);
    }
    knock() {
      // Three quiet, uneven taps; owned voices are stopped on mute, hide or exit.
      for (const offset of [0, .42, 1.04]) {
        this.note(185, .13, .10, 76, "triangle", "effect", offset);
        this.note(520, .035, .025, 280, "sine", "effect", offset);
      }
    }
    startMusic(level = this.level) {
      this.level = Math.max(0, Math.min(3, Number(level) || 0)); this.wantMusic = true;
      if (!this.available() || !this.musicEnabled || this.timer !== null) return;
      const play = () => {
        this.timer = null;
        if (!this.available() || !this.musicEnabled || !this.wantMusic) return;
        // Sparse minor-second motif; rests are intentional. No sudden volume jump.
        const motif = [220, 0, 233.08, 0, 146.83, 0, 207.65, 0];
        const note = motif[this.beat % motif.length], intensity = this.level;
        if (note) this.note(note, 2.6, .045 + intensity * .012, note * .998, "sine", "music");
        if (this.beat % 4 === 0) {
          this.note(73.42, 3.6, .06, 73, "sine", "music");
          this.note(146.83, 3.2, .025, 146.5, "triangle", "music");
        }
        if (intensity >= 2 && this.beat % 2 === 0) this.note(110, .23, .065, 65, "sine", "music");
        this.beat += 1;
        this.timer = this.env.setTimeout(play, 1050 - intensity * 70);
      };
      play();
    }
    stopVoices(channel) {
      for (const voice of [...this.voices]) {
        if (channel && voice.channel !== channel) continue;
        try { voice.source.stop(); voice.source.disconnect(); voice.gain.disconnect(); } catch { /* already ended */ }
        this.voices.delete(voice);
      }
    }
    stopMusic(clearIntent = true) {
      if (clearIntent) this.wantMusic = false;
      this.env.clearTimeout(this.timer); this.timer = null; this.stopVoices("music");
    }
    pause() {
      this.stopMusic(false); this.stopVoices();
      if (this.ctx) void this.ctx.suspend().catch(() => {});
    }
    stop() { this.stopMusic(); this.stopVoices(); this.beat = 0; this.level = 0; }
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { Soundscape };
  else root.Soundscape = Soundscape;
})(typeof window !== "undefined" ? window : globalThis);
