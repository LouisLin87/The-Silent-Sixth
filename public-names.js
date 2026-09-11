"use strict";

// Local story triggers, not a complete identity database or a moderation service.
// Keep one stable id per person; put spelling variants under the same aliases list.
// Prefer full names / distinctive stage names. Avoid common words, titles and surnames.
((root) => {
  const names = [
    { id: "jay-chou", aliases: ["周杰倫", "周杰伦", "Jay Chou"] },
    { id: "jolin-tsai", aliases: ["蔡依林", "Jolin Tsai"] },
    { id: "jj-lin", aliases: ["林俊傑", "林俊杰", "JJ Lin"] },
    { id: "a-mei", aliases: ["張惠妹", "张惠妹"] },
    { id: "andy-lau", aliases: ["劉德華", "刘德华", "Andy Lau"] },
    { id: "jackie-chan", aliases: ["成龍", "成龙", "Jackie Chan"] },
    { id: "stephen-chow", aliases: ["周星馳", "周星驰", "Stephen Chow"] },
    { id: "taylor-swift", aliases: ["Taylor Swift", "泰勒絲", "泰勒斯威夫特", "泰勒·斯威夫特"] },
    { id: "lady-gaga", aliases: ["Lady Gaga", "女神卡卡"] },
    { id: "ariana-grande", aliases: ["Ariana Grande", "亞莉安娜格蘭德", "亚莉安娜格兰德"] },
    { id: "billie-eilish", aliases: ["Billie Eilish", "怪奇比莉"] },
    { id: "michael-jackson", aliases: ["Michael Jackson", "麥可傑克森", "迈克尔杰克逊"] },
    { id: "tom-cruise", aliases: ["Tom Cruise", "湯姆克魯斯", "汤姆克鲁斯"] },
    { id: "lebron-james", aliases: ["LeBron James", "雷霸龍詹姆斯", "勒布朗詹姆斯"] },
    { id: "lionel-messi", aliases: ["Lionel Messi", "梅西"] },
    { id: "cristiano-ronaldo", aliases: ["Cristiano Ronaldo", "克里斯蒂亞諾羅納度", "克里斯蒂亚诺罗纳尔多"] },
    { id: "donald-trump", aliases: ["Donald Trump", "唐納川普", "唐纳川普", "川普", "特朗普"] },
    { id: "joe-biden", aliases: ["Joe Biden", "喬拜登", "乔拜登", "拜登"] },
    { id: "barack-obama", aliases: ["Barack Obama", "歐巴馬", "欧巴马", "奧巴馬", "奥巴马"] },
    { id: "tsai-ing-wen", aliases: ["蔡英文", "Tsai Ing-wen", "Tsai Ing Wen"] },
    { id: "lai-ching-te", aliases: ["賴清德", "赖清德", "Lai Ching-te", "Lai Ching Te"] },
    { id: "ko-wen-je", aliases: ["柯文哲", "Ko Wen-je", "Ko Wen Je"] },
    { id: "xi-jinping", aliases: ["習近平", "习近平", "Xi Jinping"] },
    { id: "elon-musk", aliases: ["Elon Musk", "伊隆馬斯克", "伊隆马斯克", "馬斯克", "马斯克"] },
    { id: "mrbeast", aliases: ["MrBeast", "Mr Beast", "Jimmy Donaldson"] },
    { id: "pewdiepie", aliases: ["PewDiePie", "Felix Kjellberg"] },
    { id: "penguin-sister", aliases: ["企鵝妹", "企鹅妹"] },
    { id: "joeman", aliases: ["Joeman", "九妹"] },
  ].map((entry) => Object.freeze({ ...entry, aliases: Object.freeze(entry.aliases) }));
  const list = Object.freeze(names);
  if (typeof module !== "undefined" && module.exports) module.exports = list;
  else root.PUBLIC_NAMES = list;
})(typeof window !== "undefined" ? window : globalThis);
