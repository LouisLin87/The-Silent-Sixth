"use strict";
// Draw only an explicit public result model, never a screenshot of the user's browser.
((root) => {
  function model(result, alias, locale = "zh") {
    const en = locale === "en";
    return Object.freeze({
      brand: en ? "THE SIXTH MEMBER" : "群組裡的第六個人",
      label: en ? "YOUR ENDING / ARCHIVE 02:31" : "你的結局 / 深夜紀錄 02:31",
      title: en ? String(result.title) : String(result.title).replace(/，/g, "，\n"), kicker: String(result.kicker), copy: String(result.copy),
      record: String(result.record({ name: alias })),
      footer: en ? "I finished the chat. Did I make it out?" : "我聊到了最後。卻不確定離開的是誰。",
      note: en ? "A fictional single-player horror story" : "單人虛構恐怖故事",
    });
  }
  function wrap(ctx, text, width) {
    const lines = [];
    const closing = /^[，。！？、；：）》」』】…,.!?;:)\]]$/u;
    for (const paragraph of String(text).split("\n")) {
      let line = "";
      // Preserve English words where possible, while allowing CJK and long words to wrap.
      for (const token of paragraph.match(/[A-Za-z0-9’'-]+\s*|[^\x00-\x7F]|./gu) || []) {
        if (line && ctx.measureText(line + token).width > width && !closing.test(token)) { lines.push(line.trimEnd()); line = ""; }
        for (const char of Array.from(token)) {
          if (line && ctx.measureText(line + char).width > width) {
            const characters = Array.from(line);
            if (closing.test(char) && characters.length > 1) { const last = characters.pop(); lines.push(characters.join("").trimEnd()); line = last; }
            else { lines.push(line.trimEnd()); line = ""; }
          }
          line += char;
        }
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }
  function textBox(ctx, text, x, y, width, height, size, color, weight = "400") {
    let lines;
    do { ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`; lines = wrap(ctx, text, width); if (lines.length * size * 1.5 <= height || size <= 22) break; size -= 2; } while (true);
    ctx.fillStyle = color;
    for (let i = 0; i < lines.length && (i + 1) * size * 1.5 <= height; i++) ctx.fillText(lines[i], x, y + i * size * 1.5);
  }
  function draw(canvas, data) {
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
    ctx.textBaseline = "top";
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#282033"); gradient.addColorStop(.48, "#111017"); gradient.addColorStop(1, "#090a0e");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
    ctx.strokeStyle = "#695078"; ctx.lineWidth = 2; ctx.strokeRect(48, 48, 984, 1824);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === 5 ? "#d6b7ff" : "#715880";
      ctx.fillRect(86 + i * 22 + (i === 5 ? 16 : 0), 130 + (i % 2 ? 0 : 22), 9, i % 2 ? 72 : 50);
    }
    textBox(ctx, data.brand, 86, 264, 908, 70, 36, "#d7c3ea", "600");
    ctx.fillStyle = "#6c527e"; ctx.fillRect(86, 374, 908, 2);
    textBox(ctx, data.label, 86, 427, 908, 70, 26, "#ac91c4", "500");
    textBox(ctx, data.title, 82, 543, 906, 340, 100, "#f3eafb", "700");
    textBox(ctx, data.kicker, 86, 904, 908, 65, 26, "#ba9bdd", "600");
    textBox(ctx, data.copy, 86, 1000, 908, 310, 36, "#c6b9d2");
    ctx.fillStyle = "#211b2b"; ctx.fillRect(78, 1356, 924, 270);
    ctx.strokeStyle = "#705384"; ctx.strokeRect(78, 1356, 924, 270);
    textBox(ctx, data.record, 111, 1400, 855, 200, 32, "#ddc8f2", "500");
    textBox(ctx, data.footer, 86, 1698, 908, 100, 30, "#d0b2e8", "500");
    textBox(ctx, data.note, 86, 1810, 908, 50, 23, "#92849e");
    return canvas;
  }
  function toBlob(canvas) {
    return new Promise((resolve, reject) => {
      try { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"); }
      catch (error) { reject(error); }
    });
  }
  const api = { model, wrap, textBox, draw, toBlob };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EndingCard = api;
})(typeof window !== "undefined" ? window : globalThis);
