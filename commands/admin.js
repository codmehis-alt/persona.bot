module.exports = [
  { name: "kick", group: true, admin: true, run: async ({ sock, jid, msg, reply }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!t) return reply("❌ Tag someone.");
      await sock.groupParticipantsUpdate(jid, [t], "remove"); } },
  { name: "promote", group: true, admin: true, run: async ({ sock, jid, msg, reply }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!t) return reply("❌ Tag someone.");
      await sock.groupParticipantsUpdate(jid, [t], "promote"); reply("⬆️ Promoted!"); } },
  { name: "demote", group: true, admin: true, run: async ({ sock, jid, msg, reply }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!t) return reply("❌ Tag someone.");
      await sock.groupParticipantsUpdate(jid, [t], "demote"); reply("⬇️ Demoted!"); } },
  { name: "mute", group: true, admin: true, run: async ({ sock, jid, reply }) => {
      await sock.groupSettingUpdate(jid, "announcement"); reply("🔇 Group muted (admins only)."); } },
  { name: "unmute", group: true, admin: true, run: async ({ sock, jid, reply }) => {
      await sock.groupSettingUpdate(jid, "not_announcement"); reply("🔊 Group unmuted."); } },
  { name: "tagall", group: true, admin: true, run: async ({ sock, jid, msg, argText }) => {
      const meta = await sock.groupMetadata(jid);
      const jids = meta.participants.map((p) => p.id);
      await sock.sendMessage(jid, { text: `📢 ${argText || "Attention!"}\n\n` +
        jids.map((j) => `@${j.split("@")[0]}`).join(" "), mentions: jids }, { quoted: msg }); } },
  { name: "hidetag", group: true, admin: true, run: async ({ sock, jid, argText }) => {
      const meta = await sock.groupMetadata(jid);
      await sock.sendMessage(jid, { text: argText || "👋", mentions: meta.participants.map((p) => p.id) }); } },
  { name: "delete", aliases: ["del"], group: true, admin: true, run: async ({ sock, jid, msg }) => {
      const ctx = msg.message.extendedTextMessage?.contextInfo;
      if (!ctx?.stanzaId) return;
      await sock.sendMessage(jid, { delete: { remoteJid: jid, id: ctx.stanzaId, participant: ctx.participant, fromMe: false } }); } },
  { name: "warn", group: true, admin: true, run: async ({ db, sock, jid, msg, reply }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!t) return reply("❌ Tag someone.");
      const u = db.user(t); u.warns++; db.save();
      if (u.warns >= 3) { await sock.groupParticipantsUpdate(jid, [t], "remove"); u.warns = 0; db.save();
        return reply("⚠️ 3/3 warns — kicked!"); }
      reply({ text: `⚠️ @${t.split("@")[0]} warned (${u.warns}/3)`, mentions: [t] }); } },
  { name: "resetwarn", group: true, admin: true, run: ({ db, msg, reply }) => {
      const t = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!t) return reply("❌ Tag someone.");
      db.user(t).warns = 0; db.save(); reply("✅ Warns reset."); } },
  { name: "antilink", group: true, admin: true, run: ({ db, jid, reply, args }) => {
      const g = db.group(jid); g.antilink = args[0] !== "off"; db.save();
      reply(`🔗 Antilink ${g.antilink ? "ON" : "OFF"}`); } },
  { name: "setwelcome", group: true, admin: true, run: ({ db, jid, reply, argText }) => {
      const g = db.group(jid); g.welcome = true; g.welcomeMsg = argText || "Welcome @user! 🎉"; db.save();
      reply("✅ Welcome message set. (@user = new member)"); } },
  { name: "welcome", group: true, admin: true, run: ({ db, jid, reply, args }) => {
      db.group(jid).welcome = args[0] !== "off"; db.save(); reply("✅ Toggled."); } },
  { name: "active", aliases: ["activity", "groupstats", "gs"], group: true, run: ({ db, jid, reply }) => {
      const counts = db.data.msgCount[jid] || {};
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      reply("📊 *MOST ACTIVE*\n" + top.map(([j, c], i) => `${i + 1}. @${j.split("@")[0]} — ${c}`).join("\n")); } },
  { name: "ltshop", group: true, run: ({ db, jid, reply, args, argText, isOwner }) => {
      const g = db.group(jid);
      if (args[0] === "add") { // .ltshop add <price> <title...>
        const price = parseInt(args[1]);
        const title = args.slice(2).join(" ");
        if (!price || !title) return reply("❌ .ltshop add <price> <title>");
        g.ltshop.push({ title, price }); db.save(); return reply(`✅ Added "${title}" for ₩${price}`);
      }
      if (args[0] === "buy") {
        const item = g.ltshop[parseInt(args[1]) - 1];
        if (!item) return reply("❌ .ltshop buy <number>");
        const u = db.user(arguments); return; // handled below
      }
      if (!g.ltshop.length) return reply("🛍️ Limited shop is empty.");
      reply("🛍️ *LIMITED SHOP* (decorative titles the AI recognizes!)\n" +
        g.ltshop.map((i, n) => `${n + 1}. 👑 ${i.title} — ₩${i.price}  (.buytitle ${n + 1})`).join("\n")); } },
  { name: "buytitle", group: true, run: ({ db, jid, sender, reply, args }) => {
      const g = db.group(jid); const u = db.user(sender);
      const item = g.ltshop[parseInt(args[0]) - 1];
      if (!item) return reply("❌ See .ltshop");
      if (u.wallet < item.price) return reply("❌ Not enough money.");
      u.wallet -= item.price; u.titles.push(item.title); db.save();
      reply(`👑 You now hold the title *${item.title}*!`); } }
];
