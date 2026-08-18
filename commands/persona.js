module.exports = [
  { name: "persona", group: true, run: async ({ db, jid, reply, args, config, sock, sender, isOwner }) => {
      const g = db.group(jid);
      if (!args[0]) {
        return reply(`💕 *PERSONAS*\n${config.personas.map((p, i) =>
          `${i === g.persona ? "👉" : "  "} ${i + 1}. *${p.name}* — ${p.style.split(".")[0]}`).join("\n")}\n\nAdmin: .persona <number> to switch\n.persona on / off — toggle AI chat\n\nTalk to me by mentioning me, replying to me, or saying *${config.personas[g.persona].name}*!`);
      }
      // admin check
      const meta = await sock.groupMetadata(jid);
      const isAdmin = isOwner || meta.participants.find((p) => p.id === sender)?.admin;
      if (!isAdmin) return reply("❌ Admins only.");
      if (args[0] === "on")  { g.personaOn = true;  db.save(); return reply("✅ Persona chat ON"); }
      if (args[0] === "off") { g.personaOn = false; db.save(); return reply("✅ Persona chat OFF"); }
      const n = parseInt(args[0]) - 1;
      if (isNaN(n) || !config.personas[n]) return reply("❌ Pick 1-5.");
      g.persona = n; db.save();
      reply(`💫 I'm *${config.personas[n].name}* now~ Say my name!`); }
  }
];
