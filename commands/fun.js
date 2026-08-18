const { fetchJson, fetchBuffer, pickRandom } = require("../lib/utils");

const TRUTHS = ["What's your most embarrassing moment?", "Who was your first crush?", "What's a secret nobody here knows?", "Have you ever ghosted someone?", "What's your guilty pleasure song?"];
const DARES = ["Send your last saved photo 📸", "Type with your eyes closed for 1 minute", "Send a voice note singing", "Change your pfp to a meme for 1 hour", "Confess to the last person you texted"];
const WYR = ["be able to fly OR be invisible?", "never eat rice again OR never eat meat again?", "know how you die OR when you die?", "have unlimited money OR unlimited time?"];

const rate = () => Math.floor(Math.random() * 101);
const bar = (p) => "█".repeat(Math.round(p / 10)) + "░".repeat(10 - Math.round(p / 10));

module.exports = [
  { name: "gayrate", aliases: ["gay"], run: ({ reply, msg, sender }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
      const p = rate(); reply({ text: `🏳️‍🌈 @${t.split("@")[0]} is ${p}% gay\n${bar(p)}`, mentions: [t] }); } },
  { name: "lesbianrate", aliases: ["lesbi"], run: ({ reply, msg, sender }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
      const p = rate(); reply({ text: `🏳️‍🌈 @${t.split("@")[0]} is ${p}% lesbian\n${bar(p)}`, mentions: [t] }); } },
  { name: "pp", run: ({ reply, sender }) =>
      reply(`🍆 @${"".padEnd(0)}size: 8${"=".repeat(Math.floor(Math.random() * 12))}D`) },
  { name: "ship", run: ({ reply, msg }) => {
      const m = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.length < 2) return reply("❌ Tag 2 users: .ship @a @b");
      const p = rate();
      reply({ text: `💘 *SHIP-O-METER*\n@${m[0].split("@")[0]} ❤️ @${m[1].split("@")[0]}\n${bar(p)} ${p}%\n${p > 70 ? "MARRY ALREADY 💍" : p > 40 ? "There's hope~ 👀" : "Yikes... 💔"}`, mentions: m }); } },
  { name: "simp", group: true, run: ({ db, jid, reply }) => {
      const counts = db.data.msgCount[jid] || {};
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!top) return reply("No data yet!");
      reply({ text: `😍 Biggest yapper/simp: @${top[0].split("@")[0]} with ${top[1]} messages!`, mentions: [top[0]] }); } },
  { name: "truth", run: ({ reply }) => reply(`🎯 *TRUTH:* ${pickRandom(TRUTHS)}`) },
  { name: "dare", run: ({ reply }) => reply(`🔥 *DARE:* ${pickRandom(DARES)}`) },
  { name: "wouldyourather", aliases: ["wyr"], run: ({ reply }) => reply(`🤔 Would you rather... ${pickRandom(WYR)}`) },
  { name: "joke", run: async ({ reply, config }) => {
      const j = await fetchJson(config.apis.joke); reply(`😂 ${j.joke}`); } },
  { name: "meme", run: async ({ sock, jid, msg, config }) => {
      const m = await fetchJson(config.apis.meme);
      const img = await fetchBuffer(m.url);
      await sock.sendMessage(jid, { image: img, caption: m.title }, { quoted: msg }); } },
  { name: "sticker", aliases: ["s"], run: async ({ sock, jid, msg, reply }) => {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
      const target = quoted?.imageMessage ? { message: quoted, key: msg.key } : (msg.message.imageMessage ? msg : null);
      if (!target) return reply("❌ Send/reply to an image with .s");
      const buf = await downloadMediaMessage(target, "buffer", {});
      const { toSticker } = require("../lib/utils");
      await sock.sendMessage(jid, { sticker: await toSticker(buf) }, { quoted: msg }); } },
  { name: "fancy", run: ({ reply, argText }) => {
      if (!argText) return reply("❌ .fancy <text>");
      const maps = [
        (t) => t.split("").join(" "),
        (t) => t.toUpperCase().split("").map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(c.charCodeAt(0) + 0x1D400 - 65) : c).join(""),
        (t) => t.split("").map((c) => /[a-z]/.test(c) ? String.fromCodePoint(c.charCodeAt(0) + 0x1D4EA - 97) : c).join(""),
        (t) => `꧁${t}꧂`, (t) => `★彡 ${t} 彡★`
      ];
      reply(maps.map((f, i) => `${i + 1}. ${f(argText)}`).join("\n")); } }
];
