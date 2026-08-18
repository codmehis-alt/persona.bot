const { fmt } = require("../lib/utils");

module.exports = [
  {
    name: "menu", aliases: ["help"],
    run: ({ reply, config }) => reply(
`╭━━★彡 ${config.creator} 彡★━━╮
┃ 𖤓 Prefix: ${config.prefix}
┃ 𖤓 Name: ${config.botName}
┃ 𖤓 Creator: ${config.creator}
╰━━━━━━━━━━━━━╯

*⚙️ GENERAL:* rules • menu • ping • owner • persona
*🎴 CARDS:* cardpull(cp) • deck • sellc • tiers
*🎮 ECONOMY:* reg • bal • daily • work • rob • dep • wd • donate • shop • buy • inv • use • rich • profile(p) • bio • setage • loan • jl • ll • gamble • afk • transactions • cdl
*🐉 POKÉMON:* pcatch • pdeck • pshop
*👤 FUN:* gay • lesbi • ship • simp • pp • joke • meme • truth • dare • wyr
*👤 INTERACT:* hug kiss slap wave pat dance smile laugh lick punch kill bonk tickle shrug
*🎮 ANIME:* waifu • neko • maid • mori-calliope • raiden-shogun • oppai • selfies • uniform • kamisato-ayaka
*👤 CONVERT:* sticker(s) • fancy
*⚙️ ADMIN:* kick • promote • demote • tagall • hidetag • warn • resetwarn • antilink • welcome • setwelcome • mute • unmute • persona on/off • ltshop`)
  },
  { name: "ping", aliases: ["test"], run: async ({ reply }) => {
      const t = Date.now(); await reply("🏓 Pong!"); }
  },
  { name: "owner", run: ({ reply, config }) =>
      reply(`👑 Owner: wa.me/${config.ownerNumbers[0]}`) },
  { name: "rules", run: ({ reply }) =>
      reply("📜 *RULES*\n1. No spam\n2. Respect everyone\n3. No links without permission\n4. Have fun with persona-chan~") },
  { name: "afk", run: ({ reply, db, sender, argText }) => {
      db.user(sender).afk = argText || "AFK"; db.save();
      reply(`💤 You're now AFK: ${argText || "AFK"}`); }
  }
];
