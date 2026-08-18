const { fetchBuffer, fetchJson, toSticker } = require("../lib/utils");

// action → waifu.pics sfw endpoint
const ACTIONS = {
  hug: "hug", kiss: "kiss", slap: "slap", wave: "wave", pat: "pat",
  dance: "dance", sad: "cry", smile: "smile", laugh: "happy", lick: "lick",
  punch: "kick", kill: "kill", bonk: "bonk", tickle: "poke", shrug: "smug"
};

module.exports = Object.entries(ACTIONS).map(([name, endpoint]) => ({
  name,
  run: async ({ sock, jid, msg, sender, config }) => {
    const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const { url } = await fetchJson(`${config.apis.waifupics}/${endpoint}`);
    const buf = await fetchBuffer(url);
    const sticker = await toSticker(buf, name.toUpperCase());
    await sock.sendMessage(jid, { sticker }, { quoted: msg });
    if (target) await sock.sendMessage(jid, {
      text: `@${sender.split("@")[0]} ${name}s @${target.split("@")[0]}! 💥`,
      mentions: [sender, target] });
  }
}));
