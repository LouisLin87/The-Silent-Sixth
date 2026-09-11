"use strict";
window.I18N = (() => {
  let locale = "zh";
  const copy = {
    zh: {
      documentTitle: "群組裡的第六個人", hauntWarning: "不要回頭",
      sound: { on: "聲音：開", off: "聲音：關" },
      av: { effectsOn: "特效：開", effectsOff: "特效：減少", settings: "音效與音樂", volume: "遊戲音量", music: "播放懸疑背景音樂", test: "試聽按鍵聲", hint: "建議中低音量。沒有聲音時，請點試聽並檢查手機媒體音量。", ready: "已播放試聽。若仍聽不到，請檢查手機媒體音量或靜音模式。", unavailable: "瀏覽器未開啟聲音。可再次點試聽，或改用手機瀏覽器開啟；無聲也能遊玩。" },
      capture: { heading: "你的結局截圖", save: "儲存結局圖片", share: "分享結局圖片", alt: "直式結局圖片：", preparing: "正在製作你的結局圖片…", ready: "1080 × 1920 直式圖片。可下載，或長按圖片儲存；不含聊天內容、城市或裝置資料。", fallback: "此瀏覽器不支援分享圖片，請按儲存圖片或長按上方圖片，再自行發布。", failed: "圖片暫時無法產生；結局文字仍完整保留，可使用手機截圖。" },
      defaults: { group: "週末見面" },
      intro: {
        titleOne: "群組裡的", titleTwo: "第六個人", copy: "有人以你的名字加入了群組。\n而其他人，好像更相信牠。",
        playerLabel: "你在群組裡的代號", reroll: "換一個", nameNote: "使用故事專屬代號，不使用真實人物姓名。",
        groupLabel: "群組名稱", groupPlaceholder: "例如：週末見面", start: "進入聊天室",
        disclaimer: "單人虛構故事 · 約 4–7 分鐘\n裝置類型會融入劇情。對話在此頁面處理，離開即清除。",
      },
      context: {
        title: "加入大致城市（可選）",
        consent: "允許 IPWhois 使用我的連線 IP 推估城市，加入故事。",
        note: "可跳過；不取得 GPS 或住址。城市可能因 VPN、行動網路而不準確。",
        device: ({ device }) => `裝置推測：${device}（僅在此頁面使用）`,
        skipped: "城市辨識未啟用。", loading: "正在推估連線城市…",
        found: ({ city }) => `連線城市推測：${city}。取消勾選即可清除。`,
        failed: "無法辨識城市，故事會照常進行。", error: "故事暫時中斷，請離開後重新進入。",
      },
      devices: { iphone: "iPhone", ipad: "iPad", android: "Android 裝置", windows: "Windows 電腦", mac: "Mac", chromebook: "Chromebook", linux: "Linux 電腦", unknown: "目前的裝置" },
      chat: {
        exit: "離開故事", note: "虛構聊天室 · 此刻只有你在線上", messages: "聊天室訊息",
        inputPlaceholder: "輸入訊息…", inputAria: "輸入你的訊息", send: "送出訊息",
        typing: ({ name }) => `${name} 正在輸入…`, memberCount: ({ count }) => `${count} 位成員`,
        waiting: "對方正在回覆，你可以先打好下一句。",
        prompts: ["輸入任何一句話。牠會讀到。", "你想問牠什麼？", "剛才的聲音，是從哪裡來的？", "他們正在等其中一個你回覆。", "你還能證明自己是誰嗎？", "群組恢復正常了。說點什麼吧。", "剛才那句，真的是你送出的嗎？", "最後一句話。請親手輸入。"],
      },
      identity: {
        borrowed: "〔借用的名字〕", redacted: "〔已隱去的名字〕",
        mentionNotice: "你提到的人不在群組裡。", mention: "我在找的是你。\n不是你剛才打出來的那個名字。",
        claim: "你可以借別人的名字。\n可是剛才按下送出的人，還是你。",
        declared: "你可以替自己換個稱呼。\n但這裡認得的，是你打字時停下來的那一下。",
        changed: "剛才不是這個名字。\n你換了稱呼，沒有換掉那雙手。",
        repeat: ["同一個名字，再打一次也沒有用。\n送出的人還是你。", "你又打了一次。\n是在叫別人，還是希望我認錯人？"],
        redactedNotice: "紀錄異常：部分名字已被隱去。",
        third: ({ count }) => `已經出現 ${count} 個不同名字了。\n怎麼還是同一雙手在打字？`,
        after: ["名字消失了。\n你打字的節奏還在。", "不用再補上名字。\n空白的那一格，我已經替你留好了。"],
      },
      replies: {
        confront: ["你可以叫我離開。\n但你要先說清楚，是哪一個你。", "我看見你拒絕了。\n他們那邊收到的，好像不是這句。", "你越急著解釋，他們越相信我。"],
        fear: ["你先別怕。我還看得見你的訊息。", "先呼吸。\n……等等，剛剛安慰你的不是我。", "別急著關掉。我怕等一下認不出你。"],
        joke: ["你還笑得出來？\n剛才另一個你，一直叫我們救他。", "這個笑話你昨晚也說過。\n可是昨晚你不在群組裡。", "怎麼兩個帳號連笑的方式都一樣？"],
        garble: ["這串字，我昨晚已經收過一次。", "不用重打。\n另一個你已經替你翻譯了。", "別測試鍵盤。\n它現在同時連著兩個人。"],
        observe: ["你在找加入通知？\n再往前一點。", "你想找答案。\n他們只想知道該相信哪一個。", "紀錄沒有消失。\n只是有些訊息，在你打字之前就存在了。"],
        trust: ["你確定要相信我？\n這句話，我會留下來。", "好。\n這次大家都看見你答應了。", "別忘記，是你親口說的。"],
        ordinary: ["我有收到。\n但另一個帳號，也在回同一句。", "這句聽起來才像你。\n……我剛剛是不是認錯人了？", "你先繼續說話，我想確認一件事。"],
      },
      story: {
        ann: "安安", yao: "小遙", sen: "阿森", deleted: "已刪除的訊息",
        joinedGroup: ({ group }) => `你已加入群組「${group}」`, invited: "你透過朋友的邀請進入了這段故事。",
        openingAnn: "還有人醒著嗎？我剛剛看到群組多了一位。", openingYao: "誰拉進來的？怎麼跟你用同一個代號？",
        joined: ({ name }) => `「${name}」加入了群組`, openingEntity: "嗨。\n我一直都在這裡啊。",
        photo: "奇怪。它的頭像，是你以前用過的那張。",
        delayedEcho: ({ message }) => `你前面說「${message}」。\n你還沒按下送出時，我這邊就有了。`,
        keys: "你們有聽到按鍵聲嗎？我已經把手拿開了。",
        device: ({ device }) => `你那邊看起來是 ${device}。\n可是我這邊，顯示你還開著另一台。`,
        deviceUnknown: "你的裝置名稱讀不到。\n但這裡有兩個輸入游標。",
        city: ({ city }) => `連線位置顯示在 ${city} 附近。\n你先別動。我剛剛看到同一個代號從那裡離線，又回來了。`,
        cityUnknown: "位置那一欄是空的。\n可是另一個你，剛才好像已經到這裡了。",
        whichOne: "我現在真的分不出來。\n哪一個才是剛剛跟我說話的人？",
        stolenMemory: ({ message }) => `他說「${message}」。\n接下來我替他回，你們問我就好。`,
        ignoreNewcomer: "別理那個新來的。\n一直強調自己是真的，反而很奇怪吧。",
        traceFound: "讀取到一則其他訪客留下、經審核的痕跡",
        leaving: "好，那我離開。\n你們慢慢聊。", left: ({ name }) => `「${name}」已離開群組`,
        relief: "剩五個了。\n應該只是有人惡作劇，終於走了。", breakfast: "算了啦，聊點正常的。\n明天早餐吃什麼？",
        breakfastReply: ({ message }) => `好，我看到你說「${message}」了。\n明天再慢慢聊，先休息吧。`,
        goodnight: "晚安。別再自己嚇自己。", otherDevice: "你的上一則訊息，已由另一個裝置送出。",
        earlier: "訊息時間異常：同樣的內容，在你按下送出前就已存在。",
        realOne: "等一下。\n它不是已經離開了？為什麼它知道你剛剛會打什麼？",
        final: { replaced: "你明明還在回覆，為什麼群組說你離開了？", sixth: "我找到第一天的紀錄了。\n這個群組……是你建立的。", consent: "我看見你答應它了。\n接下來哪一個才算是你的回覆？" },
        finalEcho: ({ message }) => `你說過「${message}」。\n放心。明天我會用你的方式，再說一次。`,
      },
      ending: {
        share: "分享紀錄", invite: "邀請朋友體驗", restart: "從頭再看一次", note: "你可以關掉這個頁面了。\n如果牠也允許的話。",
        traceLabel: "留一句話給下一位訪客", tracePlaceholder: "不留下姓名，只留一句話…", traceConsent: "我同意這段匿名文字經審核後公開顯示在故事中。", traceButton: "送出痕跡",
      },
      results: {
        replaced: { kicker: "MEMBER STATUS / REPLACED", title: "你已離開群組。", copy: "你還能打字。你還能送出。但其他人只看得見那個同名帳號的訊息。最後，你收到了一句熟悉的晚安。", record: ({ name }) => `02:31　「${name}」已離開群組\n02:31　「${name}」：現在只剩我了。` },
        sixth: { kicker: "ARCHIVE FOUND / 02:03", title: "第六個人，一直是你。", copy: "最早的紀錄沒有加入通知，只有你建立群組的時間。那句你今晚才想到的話，早已被留在昨天。", record: ({ name }) => `02:03　「${name}」建立了群組\n02:03　「${name}」：等我回來。` },
        consent: { kicker: "PERMISSION GRANTED / 02:31", title: "牠替你回覆了。", copy: "牠留下你表示信任的訊息，像保管一把鑰匙。你的朋友終於不再懷疑了。從現在開始，牠總會比你早一步說晚安。", record: ({ name }) => `02:31　「${name}」：我會一直在。\n02:31　「${name}」正在輸入…` },
      },
      share: { text: ({ title }) => `《群組裡的第六個人》\n我的結局：${title}\n你敢用自己的話回牠嗎？`, invite: ({ group }) => `邀請你進入「${group}」。\n這是一段單人恐怖故事。群組裡有六個人，但應該只有五個。`, copied: "分享文字已複製。", fallback: "請長按下方文字複製分享。", copyAria: "可複製的分享文字", local: "請先部署網站；本機檔案網址無法讓朋友開啟。" },
      backend: { consent: "請先同意文字經審核後公開。", invalid: "請輸入 2–120 個字，勿含連結、帳號或純重複符號。", cooldown: "請一分鐘後再送出。", sending: "正在送出…", sent: "已送交審核，通過後才會公開。", failed: "無法送出，請稍後再試。" },
    },
    en: {
      documentTitle: "The Sixth Member", hauntWarning: "DON'T TURN AROUND",
      sound: { on: "Sound: On", off: "Sound: Off" }, defaults: { group: "Weekend Plans" },
      av: { effectsOn: "FX: On", effectsOff: "FX: Reduced", settings: "Sound & music", volume: "Game volume", music: "Play suspense music", test: "Test keyboard sound", hint: "Use a low or moderate volume. If silent, tap Test and check your phone's media volume.", ready: "Test played. If still silent, check your phone's media volume or silent mode.", unavailable: "Audio is unavailable. Try Test again or open in your phone's browser. You can still play without sound." },
      capture: { heading: "Your ending screenshot", save: "Save ending image", share: "Share ending image", alt: "Portrait ending image:", preparing: "Creating your ending image…", ready: "1080 × 1920 portrait image. Download or long-press to save. No chat, city or device data included.", fallback: "Image sharing isn't supported here. Save or long-press the image above, then post it yourself.", failed: "Couldn't create the image. Your full ending is still here; you can take a phone screenshot." },
      intro: {
        titleOne: "THE SIXTH", titleTwo: "MEMBER", copy: "Someone joined using your name.\nYour friends seem to trust them more.",
        playerLabel: "Your name in this group", reroll: "Reroll", nameNote: "A fictional story alias. Real people's names cannot be entered.",
        groupLabel: "Group name", groupPlaceholder: "For example: Weekend Plans", start: "Enter the chat",
        disclaimer: "A single-player fictional story · About 4–7 minutes\nYour device type appears in the story. Chat stays on this page and clears when you leave.",
      },
      context: { title: "Add an approximate city (optional)", consent: "Let IPWhois use my connection's IP to estimate a city for the story.", note: "Optional. No GPS or home address. VPNs and mobile networks may give the wrong city.", device: ({ device }) => `Device estimate: ${device} (used only on this page)`, skipped: "City detection is off.", loading: "Estimating your connection's city…", found: ({ city }) => `Estimated city: ${city}. Uncheck to clear it.`, failed: "City unavailable. You can still play the whole story.", error: "The story was interrupted. Leave and enter again to restart." },
      devices: { iphone: "iPhone", ipad: "iPad", android: "Android device", windows: "Windows computer", mac: "Mac", chromebook: "Chromebook", linux: "Linux computer", unknown: "this device" },
      chat: { exit: "Leave story", note: "Fictional chat · Only you are online", messages: "Chat messages", inputPlaceholder: "Type a message…", inputAria: "Type your message", send: "Send message", typing: ({ name }) => `${name} is typing…`, memberCount: ({ count }) => `${count} members`, waiting: "They are replying. You can draft your next message.", prompts: ["Type anything. It will read it.", "What do you want to ask?", "Where did those keystrokes come from?", "They are waiting for one of you to reply.", "Can you still prove who you are?", "Everything seems normal. Say something.", "Did you really send that last line?", "One last message. Type it yourself."] },
      identity: {
        borrowed: "[borrowed name]", redacted: "[name hidden]",
        mentionNotice: "The person you mentioned isn't in this group.", mention: "I'm looking for you.\nNot the name you just typed.",
        claim: "You can borrow someone else's name.\nBut you were still the one who pressed Send.",
        declared: "You can give yourself another name.\nThis chat recognizes the pause between your keystrokes.",
        changed: "That wasn't the last name you used.\nDifferent name. Same hands.",
        repeat: ["Typing the same name again won't help.\nYou're still the one sending it.", "You typed it again.\nCalling someone else, or hoping I'll mistake you for them?"],
        redactedNotice: "Record anomaly: some names have been hidden.",
        third: ({ count }) => `${count} different names now.\nWhy are the same hands still typing?`,
        after: ["The names are gone.\nYour typing rhythm isn't.", "No need to fill in another name.\nI've already saved that empty space for you."],
      },
      replies: {
        confront: ["You can tell me to leave.\nBut first, tell them which one of us you mean.", "I saw you refuse.\nThey seem to have received a different reply.", "The harder you try to explain, the more they trust me."],
        fear: ["Breathe. I can still see your messages.", "Take a breath.\n…Wait. That last reassuring message wasn't mine.", "Keep talking. I'm afraid I won't recognize you if you stop."],
        joke: ["You can still laugh?\nThe other you was just begging us for help.", "You told that joke last night.\nBut you weren't in the group last night.", "How do both accounts even laugh the same way?"],
        garble: ["I received that exact string last night.", "No need to retype it.\nThe other you already translated it.", "Don't test the keyboard.\nIt's connected to two people now."],
        observe: ["Looking for the join notification?\nScroll a little further back.", "You want answers.\nThey only want to know which one to trust.", "The records haven't vanished.\nSome messages were here before you typed them."],
        trust: ["Are you sure you trust me?\nI'm keeping that message.", "Good.\nThis time everyone saw you agree.", "Remember. You said it yourself."],
        ordinary: ["I got your message.\nThe other account is replying with the same words.", "That sounds more like you.\n…Have I been talking to the wrong person?", "Keep talking. I need to check something."],
      },
      story: {
        ann: "An-An", yao: "Yao", sen: "Sen", deleted: "Deleted message", joinedGroup: ({ group }) => `You joined “${group}”`, invited: "You entered this story through a friend's invitation.",
        openingAnn: "Anyone still awake? Someone new just joined.", openingYao: "Who invited them? Why do they have the same name as you?", joined: ({ name }) => `“${name}” joined the group`, openingEntity: "Hi.\nI've always been here.",
        photo: "That's odd. Their picture is one you used a long time ago.", delayedEcho: ({ message }) => `Earlier you said, “${message}.”\nIt was already here before you pressed Send.`, keys: "Can you hear those keystrokes? My hands aren't touching anything.",
        device: ({ device }) => `It looks like you're using a ${device}.\nBut here it says you have another device open.`, deviceUnknown: "Your device name isn't showing.\nBut there are two typing cursors here.",
        city: ({ city }) => `The connection places you near ${city}.\nStay still. I just saw your name disconnect from there, then return.`, cityUnknown: "The location field is blank.\nBut the other you seems to have arrived already.",
        whichOne: "I genuinely can't tell anymore.\nWhich one of you was I just talking to?", stolenMemory: ({ message }) => `They said, “${message}.”\nI'll reply for them now. Ask me instead.`, ignoreNewcomer: "Ignore the newcomer.\nInsisting they're the real one is getting weird.", traceFound: "A reviewed trace from another visitor was found",
        leaving: "Fine. I'll leave.\nEnjoy your conversation.", left: ({ name }) => `“${name}” left the group`, relief: "Five members again.\nIt must have been a prank. They're finally gone.", breakfast: "Let's talk about something normal.\nWhat are we having for breakfast tomorrow?", breakfastReply: ({ message }) => `Okay, I saw “${message}.”\nWe can talk tomorrow. Get some rest.`, goodnight: "Good night. Stop scaring yourselves.", otherDevice: "Your last message was sent from another device.", earlier: "Timestamp anomaly: the same words existed before you pressed Send.", realOne: "Wait.\nDidn't they leave? How did they know what you were about to type?",
        final: { replaced: "You're still replying. Why does it say you left?", sixth: "I found the first record.\nYou… created this group.", consent: "I saw you agree.\nWhich account will speak for you now?" }, finalEcho: ({ message }) => `You said, “${message}.”\nDon't worry. Tomorrow I'll say it again, just like you.`,
      },
      ending: { share: "Share record", invite: "Invite a friend to play", restart: "Start over", note: "You can close this page now.\nIf it lets you.", traceLabel: "Leave one line for the next visitor", tracePlaceholder: "No names. Just one line…", traceConsent: "I agree to this anonymous text appearing publicly in the story after review.", traceButton: "Submit trace" },
      results: {
        replaced: { kicker: "MEMBER STATUS / REPLACED", title: "You left the group.", copy: "You can still type. You can still send. But your friends only see the other account. Finally, someone wishes them good night in exactly your words.", record: ({ name }) => `02:31　“${name}” left the group\n02:31　“${name}”: Now it's only me.` },
        sixth: { kicker: "ARCHIVE FOUND / 02:03", title: "You were always the sixth.", copy: "There is no join notification in the oldest record. Only the time you created the group. The words you thought of tonight were already there yesterday.", record: ({ name }) => `02:03　“${name}” created the group\n02:03　“${name}”: Wait for me to return.` },
        consent: { kicker: "PERMISSION GRANTED / 02:31", title: "It replied for you.", copy: "It keeps your messages of trust like a key. Your friends have finally stopped doubting. From now on, it will always say good night one step before you.", record: ({ name }) => `02:31　“${name}”: I'll always be here.\n02:31　“${name}” is typing…` },
      },
      share: { text: ({ title }) => `The Sixth Member\nMy ending: ${title}\nDare to reply in your own words?`, invite: ({ group }) => `You're invited to “${group}.”\nA single-player horror story. Six people are in the group. There should be five.`, copied: "Share text copied.", fallback: "Long-press the text below to copy it.", copyAria: "Share text to copy", local: "Deploy the site first. Friends cannot open your local file address." },
      backend: { consent: "Please agree to publication after review first.", invalid: "Use 2–120 characters without links, accounts or repeated symbols.", cooldown: "Wait one minute before submitting again.", sending: "Sending…", sent: "Submitted for review. It will only appear after approval.", failed: "Could not send. Try again later." },
    },
  };
  function t(key, values = {}) {
    const item = key.split(".").reduce((value, part) => value?.[part], copy[locale]);
    return typeof item === "function" ? item(values) : item ?? key;
  }
  function applyStatic() {
    document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en";
    document.title = t("documentTitle");
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAria)); });
  }
  return { get locale() { return locale; }, t, applyStatic, toggle() { locale = locale === "zh" ? "en" : "zh"; applyStatic(); } };
})();
