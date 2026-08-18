const { fetchJson, fetchBuffer } = require("../lib/utils");

const TAGS = ["waifu", "maid", "mori-calliope", "raiden-shogun", "oppai",
  "selfies", "uniform", "kamisato-ayaka"];

const cmds = TAGS.map((tag) => ({
  name: tag,
  run: async ({ sock, jid, msg, config }) => {
    const data = await fetchJson(`${config.apis.waifuim}?included_tags=${tag}&is_nsfw=false`,
      { headers: { "Accept-Version": "v5" } });
    const img = await fetchBuffer(data.images[0].url);
    await sock.sendMessage(jid, { image: img, caption: `✨ ${tag}` }, { quoted: msg });
  }
}));

// neko via waifu.pics
cmds.push({ name: "neko", run: async ({ sock, jid, msg, config }) => {
  const { url } = await fetchJson(`${config.apis.waifupics}/neko`);
  const img = await fetchBuffer(url);
  await sock.sendMessage(jid, { image: img, caption: "🐱 neko~" }, { quoted: msg });
}});
module.exports = cmds;
