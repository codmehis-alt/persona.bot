module.exports = [

  {

    name: "chat",

    aliases: [

      "ai",

      "personality"

    ],

    group: true,

    run: async ({

      db,

      jid,

      reply,

      args,

      config,

      sock,

      sender,

      isOwner

    }) => {

      const g =

        db.group(jid);

      if (

        !g.chatPersonality

      ) {

        g.chatPersonality =

          config.chat

            ?.defaultPersonality ||

          "zero";

      }

      const personalities =

        config.chat

          ?.personalities || {};

      // ======================================

      // SHOW CURRENT PERSONALITY

      // ======================================

      if (

        !args[0]

      ) {

        const current =

          personalities[

            g.chatPersonality

          ];

        const enabled =

          g.chatEnabled === true;

        return reply(

`╭────────────────────╮

       🎭 *CHAT AI*

╰────────────────────╯

🤖 Status:

${enabled ? "🟢 ON" : "🔴 OFF"}

🎭 Current:

*${current?.name || g.chatPersonality}*

━━━━━━━━━━━━━━━━━━

*Available personalities:*

💕 *Zero Two*

.chat zero

🔥 *Rin*

.chat rin

💙 *Rem*

.chat rem

━━━━━━━━━━━━━━━━━━

*Admin controls:*

.chat on

.chat off

.chat zero

.chat rin

.chat rem`

        );

      }

      const action =

        String(

          args[0]

        )

          .trim()

          .toLowerCase();

      // ======================================

      // ADMIN CHECK

      // ======================================

      const meta =

        await sock.groupMetadata(

          jid

        );

      const participant =

        meta.participants.find(

          p =>

            String(p.id)

              .split(":")[0]

              .split("@")[0] ===

            String(sender)

              .split(":")[0]

              .split("@")[0]

        );

      const isAdmin =

        isOwner ||

        !!participant?.admin;

      if (

        !isAdmin

      ) {

        return reply(

          "❌ Only group admins can change the Chat AI."

        );

      }

      // ======================================

      // ON

      // ======================================

      if (

        action === "on"

      ) {

        g.chatEnabled =

          true;

        db.save();

        const current =

          personalities[

            g.chatPersonality

          ];

        return reply(

`✅ *Chat AI enabled.*

🎭 Personality:

*${current?.name || g.chatPersonality}*

I'll only respond when:

• I'm tagged

• Someone replies to me

• My bot name is mentioned

• My current personality name is mentioned`

        );

      }

      // ======================================

      // OFF

      // ======================================

      if (

        action === "off"

      ) {

        g.chatEnabled =

          false;

        db.save();

        return reply(

          "🔴 *Chat AI disabled.*"

        );

      }

      // ======================================

      // PERSONALITY

      // ======================================

      let selected =

        action;

      // Allow "zero two"

      if (

        action === "zero" ||

        action === "zerotwo" ||

        action === "zero-two"

      ) {

        selected =

          "zero";

      }

      if (

        action === "rin" ||

        action === "rin-tohsaka"

      ) {

        selected =

          "rin";

      }

      if (

        action === "rem"

      ) {

        selected =

          "rem";

      }

      const personality =

        personalities[

          selected

        ];

      if (

        !personality

      ) {

        return reply(

`❌ Unknown personality.

Available:

💕 .chat zero

🔥 .chat rin

💙 .chat rem`

        );

      }

      g.chatPersonality =

        selected;

      // Selecting a personality

      // automatically enables Chat AI.

      g.chatEnabled =

        true;

      db.save();

      return reply(

`╭────────────────────╮

      🎭 *PERSONALITY*

╰────────────────────╯

✅ Now playing:

*${personality.name}*

🟢 Chat AI: ON

I'll respond when someone:

• Tags me

• Replies to me

• Says my bot name

• Says *${personality.name}*`

      );

    }

  }

];