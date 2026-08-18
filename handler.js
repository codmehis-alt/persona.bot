const fs = require("fs");

const path = require("path");

const config =

  require("./config");

const db =

  require("./lib/db");

const {

  askAI

} =

  require("./lib/utils");

const {

  downloadMediaMessage

} =

  require("@whiskeysockets/baileys");

// ==========================================

// LOAD COMMANDS

// ==========================================

const commands =

  new Map();

const commandPath =

  path.join(

    __dirname,

    "commands"

  );

for (

  const file of fs.readdirSync(

    commandPath

  )

) {

  if (

    !file.endsWith(".js")

  ) {

    continue;

  }

  try {

    const loaded =

      require(

        path.join(

          commandPath,

          file

        )

      );

    const list =

      Array.isArray(loaded)

        ? loaded

        : [loaded];

    for (

      const cmd of list

    ) {

      if (

        !cmd ||

        !cmd.name ||

        typeof cmd.run !==

          "function"

      ) {

        continue;

      }

      const name =

        String(

          cmd.name

        )

          .toLowerCase();

      commands.set(

        name,

        cmd

      );

      for (

        const alias of

        cmd.aliases || []

      ) {

        commands.set(

          String(alias)

            .toLowerCase(),

          cmd

        );

      }

    }

  } catch (error) {

    console.error(

      `❌ Failed loading ${file}:`,

      error.message

    );

  }

}

console.log(

  `📦 Loaded ${new Set(

    [...commands.values()]

  ).size} commands`

);

// ==========================================

// GET MESSAGE TEXT

// ==========================================

function getText(msg) {

  const m =

    msg.message || {};

  return (

    m.conversation ||

    m.extendedTextMessage

      ?.text ||

    m.imageMessage

      ?.caption ||

    m.videoMessage

      ?.caption ||

    m.documentMessage

      ?.caption ||

    ""

  );

}

// ==========================================

// GET CONTEXT

// ==========================================

function getContextInfo(msg) {

  return (

    msg.message

      ?.extendedTextMessage

      ?.contextInfo ||

    msg.message

      ?.imageMessage

      ?.contextInfo ||

    msg.message

      ?.videoMessage

      ?.contextInfo ||

    msg.message

      ?.documentMessage

      ?.contextInfo ||

    {}

  );

}

// ==========================================

// GET QUOTED MESSAGE

// ==========================================

function getQuotedMessage(msg) {

  return (

    getContextInfo(msg)

      ?.quotedMessage ||

    null

  );

}

// ==========================================

// GET QUOTED PARTICIPANT

// ==========================================

function getQuotedParticipant(msg) {

  return (

    getContextInfo(msg)

      ?.participant ||

    null

  );

}

// ==========================================

// GET MENTIONS

// ==========================================

function getMentioned(msg) {

  return (

    getContextInfo(msg)

      ?.mentionedJid ||

    []

  );

}

// ==========================================

// NORMALIZE JID

// ==========================================

function normalizeJid(jid) {

  return String(

    jid || ""

  )

    .trim()

    .toLowerCase();

}

// ==========================================

// GET JID NUMBER

// ==========================================

function jidNumber(jid) {

  return normalizeJid(jid)

    .split(":")[0]

    .split("@")[0]

    .replace(

      /\D/g,

      ""

    );

}

// ==========================================

// GET BOT IDENTIFIERS

// ==========================================

function getBotIdentifiers(sock) {

  const ids =

    new Set();

  const add =

    jid => {

      if (!jid) {

        return;

      }

      ids.add(

        normalizeJid(jid)

      );

      const number =

        jidNumber(jid);

      if (number) {

        ids.add(

          number

        );

      }

    };

  // Main bot ID

  add(

    sock.user?.id

  );

  // LID if available

  add(

    sock.user?.lid

  );

  return ids;

}

// ==========================================

// IS BOT JID

// ==========================================

function isBotJid(

  jid,

  sock

) {

  if (!jid) {

    return false;

  }

  const exact =

    normalizeJid(jid);

  const number =

    jidNumber(jid);

  const botIds =

    getBotIdentifiers(

      sock

    );

  if (

    botIds.has(exact)

  ) {

    return true;

  }

  if (

    number &&

    botIds.has(number)

  ) {

    return true;

  }

  return false;

}

// ==========================================

// BOT MENTION CHECK

// ==========================================

function isBotMentioned(

  msg,

  sock

) {

  const mentions =

    getMentioned(msg);

  if (

    !mentions.length

  ) {

    return false;

  }

  return mentions.some(

    jid =>

      isBotJid(

        jid,

        sock

      )

  );

}

// ==========================================

// REPLY TO BOT CHECK

// ==========================================

function isReplyToBot(

  msg,

  sock

) {

  const participant =

    getQuotedParticipant(

      msg

    );

  if (

    !participant

  ) {

    return false;

  }

  return isBotJid(

    participant,

    sock

  );

}
// ==========================================

// QUOTED IMAGE

// ==========================================

function isQuotedImage(msg) {

  const quoted =

    getQuotedMessage(

      msg

    );

  return !!(

    quoted?.imageMessage

  );

}

// ==========================================

// SAVE PROFILE PICTURE

// ==========================================

async function saveProfilePicture(

  sock,

  msg,

  sender

) {

  try {

    const quoted =

      getQuotedMessage(

        msg

      );

    if (

      !quoted?.imageMessage

    ) {

      return {

        ok: false,

        error:

          "❌ Reply to an image with *.pfp*."

      };

    }

    const folder =

      path.join(

        __dirname,

        "data",

        "economy-pfps"

      );

    if (

      !fs.existsSync(

        folder

      )

    ) {

      fs.mkdirSync(

        folder,

        {

          recursive: true

        }

      );

    }

    const cleanSender =

      String(sender)

        .replace(

          /[^0-9]/g,

          ""

        );

    const filePath =

      path.join(

        folder,

        `${cleanSender}.jpg`

      );

    const context =

      getContextInfo(

        msg

      );

    const quotedMessage = {

      key: {

        remoteJid:

          msg.key.remoteJid,

        fromMe:

          false,

        id:

          context.stanzaId ||

          msg.key.id,

        participant:

          context.participant

      },

      message:

        quoted

    };

    const buffer =

      await downloadMediaMessage(

        quotedMessage,

        "buffer",

        {},

        {

          logger:

            console,

          reuploadRequest:

            sock.updateMediaMessage

        }

      );

    fs.writeFileSync(

      filePath,

      buffer

    );

    return {

      ok: true,

      filePath

    };

  } catch (error) {

    console.error(

      "❌ PFP save error:",

      error

    );

    return {

      ok: false,

      error:

        "❌ I couldn't save that image."

    };

  }

}

// ==========================================

// GET CHAT PERSONALITY

// ==========================================

function getChatPersonality(

  jid

) {

  const g =

    db.group(jid);

  const personalities =

    config.chat

      ?.personalities || {};

  let key =

    String(

      g.chatPersonality ||

      config.chat

        ?.defaultPersonality ||

      "zero"

    )

      .toLowerCase();

  if (

    !personalities[key]

  ) {

    key =

      "zero";

  }

  return {

    key,

    data:

      personalities[key]

  };

}

// ==========================================

// PERSONALITY NAME CHECK

// ==========================================

function personalityMentioned(

  text,

  personality

) {

  if (

    !text ||

    !personality

  ) {

    return false;

  }

  const lower =

    text.toLowerCase();

  const names = [

    personality.name,

    ...(personality.aliases || [])

  ];

  return names.some(

    name =>

      lower.includes(

        String(name)

          .toLowerCase()

      )

  );

}

// ==========================================

// BOT NAME CHECK

// ==========================================

function botNameMentioned(

  text

) {

  if (

    !text

  ) {

    return false;

  }

  const name =

    String(

      config.botName || ""

    )

      .trim()

      .toLowerCase();

  if (

    !name

  ) {

    return false;

  }

  return text

    .toLowerCase()

    .includes(

      name

    );

}

// ==========================================

// GET GROUP MEMBERS

// ==========================================

async function getGroupMembers(

  sock,

  jid

) {

  try {

    const metadata =

      await sock.groupMetadata(

        jid

      );

    return (

      metadata.participants ||

      []

    )

      .map(

        p =>

          p.id

      )

      .filter(Boolean);

  } catch {

    return [];

  }

}

// ==========================================

// BUILD REAL MENTION MAP

// ==========================================

async function getMemberMap(

  sock,

  jid

) {

  const members =

    await getGroupMembers(

      sock,

      jid

    );

  return members

    .map(

      id => ({

        id,

        handle:

          `@${jidNumber(id)}`

      })

    )

    .filter(

      item =>

        item.handle !== "@"

    );

}

// ==========================================

// AI RESPONSE

// ==========================================

async function runChatAI(

  sock,

  msg,

  jid,

  text

) {

  const g =

    db.group(jid);

  if (

    g.chatEnabled !== true

  ) {

    return;

  }

  const {

    data: personality

  } =

    getChatPersonality(

      jid

    );

  if (

    !personality

  ) {

    return;

  }

  const members =

    await getMemberMap(

      sock,

      jid

    );

  const handles =

    members

      .map(

        m =>

          m.handle

      )

      .join(" ");

  const prompt = `

You are currently playing:

${personality.name}

CHARACTER STYLE:

${personality.style}

IMPORTANT RESPONSE STYLE:

- Keep replies SHORT.

- Usually use only 1-3 sentences.

- Avoid long paragraphs.

- Use natural emojis.

- Usually include 1-3 emojis when appropriate.

- Do not spam emojis.

- Sound like a real WhatsApp conversation.

- Do not repeat the same emoji constantly.

- Stay in character.

- Be useful when answering questions.

- If asked for detailed information, give enough information but still keep it readable.

WHATSAPP MENTIONS:

Real group members:

${handles || "No member list available."}

If you mention someone, ONLY use an exact

@handle from the list above.

Never invent a username.

CURRENT MESSAGE:

${text}

`;

  try {

    const history =

      Array.isArray(

        g.memory

      )

        ? g.memory.slice(-20)

        : [];

    const reply =

      await askAI(

        prompt,

        history,

        text

      );

    if (

      !reply ||

      !reply.trim()

    ) {

      return;

    }

    const mentions =

      [];

    for (

      const member of members

    ) {

      if (

        reply.includes(

          member.handle

        )

      ) {

        mentions.push(

          member.id

        );

      }

    }

    // ====================================

    // MEMORY

    // ====================================

    if (

      !Array.isArray(

        g.memory

      )

    ) {

      g.memory = [];

    }

    g.memory.push(

      `${personality.name}: ${reply}`

        .slice(0, 500)

    );

    if (

      g.memory.length >

      30

    ) {

      g.memory =

        g.memory.slice(-30);

    }

    g.lastMessageAt =

      Date.now();

    db.save();

    // ====================================

    // SEND

    // ====================================

    await sock.sendMessage(

      jid,

      {

        text:

          reply,

        mentions

      },

      {

        quoted:

          msg

      }

    );

  } catch (error) {

    console.error(

      "❌ Chat AI error:",

      error?.message ||

      error

    );

  }

}
// ==========================================

// HANDLE CHAT

// ==========================================

async function handleChat(

  sock,

  msg,

  jid,

  text

) {

  if (

    !jid.endsWith(

      "@g.us"

    )

  ) {

    return;

  }

  const g =

    db.group(jid);

  if (

    g.chatEnabled !== true

  ) {

    return;

  }

  const {

    data: personality

  } =

    getChatPersonality(

      jid

    );

  if (

    !personality

  ) {

    return;

  }

  // ========================================

  // REAL WHATSAPP TAG

  // ========================================

  const tagged =

    isBotMentioned(

      msg,

      sock

    );

  // ========================================

  // REAL WHATSAPP REPLY

  // ========================================

  const replied =

    isReplyToBot(

      msg,

      sock

    );

  // ========================================

  // PERSONALITY NAME

  // ========================================

  const characterCalled =

    personalityMentioned(

      text,

      personality

    );

  // ========================================

  // BOT NAME

  // ========================================

  const botCalled =

    botNameMentioned(

      text

    );

  console.log(

    `🎭 Chat check | tagged=${tagged} replied=${replied} character=${characterCalled} bot=${botCalled}`

  );

  // ========================================

  // ONLY RESPOND WHEN ADDRESSED

  // ========================================

  if (

    !tagged &&

    !replied &&

    !characterCalled &&

    !botCalled

  ) {

    return;

  }

  console.log(

    `🤖 ${personality.name} responding`

  );

  await runChatAI(

    sock,

    msg,

    jid,

    text

  );

}

// ==========================================

// MAIN MESSAGE HANDLER

// ==========================================

async function handleMessage(

  sock,

  msg

) {

  if (

    !msg?.message

  ) {

    return;

  }

  const jid =

    msg.key.remoteJid;

  if (

    !jid ||

    jid ===

      "status@broadcast"

  ) {

    return;

  }

  const isGroup =

    jid.endsWith(

      "@g.us"

    );

  const sender =

    isGroup

      ? (

          msg.key.participant ||

          jid

        )

      : jid;

  const text =

    getText(

      msg

    );

  // ========================================

  // OWNER CHECK

  // ========================================

  const senderNumber =

    jidNumber(

      sender

    );

  const isOwner =

    (

      config.ownerNumbers ||

      []

    ).some(

      number =>

        jidNumber(

          number

        ) ===

        senderNumber

    );

  // ========================================

  // GROUP MESSAGE DATA

  // ========================================

  if (

    isGroup

  ) {

    const g =

      db.group(

        jid

      );

    if (

      !Array.isArray(

        g.memory

      )

    ) {

      g.memory = [];

    }

    if (

      text &&

      text.trim()

    ) {

      g.memory.push(

        `${senderNumber}: ${text}`

          .slice(0, 300)

      );

      if (

        g.memory.length >

        30

      ) {

        g.memory =

          g.memory.slice(-30);

      }

      g.lastMessageAt =

        Date.now();

    }

    // Message counter

    db.data.msgCount[jid] =

      db.data.msgCount[jid] ||

      {};

    db.data.msgCount[jid][sender] =

      (

        db.data.msgCount[jid][sender] ||

        0

      ) + 1;

    db.save();

  }

  // ========================================

  // USER / AFK

  // ========================================

  const user =

    db.user(

      sender

    );

  if (

    user.afk

  ) {

    user.afk =

      null;

    db.save();

    await sock.sendMessage(

      jid,

      {

        text:

          `👋 @${senderNumber} is back!`,

        mentions:

          [

            sender

          ]

      }

    );

  }

  // ========================================

  // MENTIONED AFK USERS

  // ========================================

  const mentioned =

    getMentioned(

      msg

    );

  for (

    const mentionedUser of

    mentioned

  ) {

    const mentionedData =

      db.user(

        mentionedUser

      );

    if (

      mentionedData.afk

    ) {

      await sock.sendMessage(

        jid,

        {

          text:

            `💤 @${jidNumber(mentionedUser)} is AFK: ${mentionedData.afk}`,

          mentions:

            [

              mentionedUser

            ]

        }

      );

    }

  }

  // ========================================

  // COMMAND CONTEXT

  // ========================================

  const ctx = {

    sock,

    msg,

    jid,

    sender,

    isGroup,

    isOwner,

    text,

    db,

    config,

    mentioned,

    args: [],

    argText: "",

    quotedMessage:

      getQuotedMessage(

        msg

      ),

    quotedParticipant:

      getQuotedParticipant(

        msg

      ),

    isQuotedImage:

      isQuotedImage(

        msg

      ),

    reply:

      content =>

        sock.sendMessage(

          jid,

          typeof content ===

            "string"

            ? {

                text:

                  content

              }

            : content,

          {

            quoted:

              msg

          }

        ),

    saveProfilePicture:

      () =>

        saveProfilePicture(

          sock,

          msg,

          sender

        )

  };

  // ========================================

  // COMMAND HANDLING

  // ========================================

  if (

    text &&

    text.startsWith(

      config.prefix

    )

  ) {

    const body =

      text

        .slice(

          config.prefix.length

        )

        .trim();

    if (

      !body

    ) {

      return;

    }

    const [

      commandName,

      ...args

    ] =

      body.split(

        /\s+/

      );

    const cmd =

      commands.get(

        commandName

          .toLowerCase()

      );

    if (

      !cmd

    ) {

      return;

    }

    // ====================================

    // GROUP ONLY

    // ====================================

    if (

      cmd.group &&

      !isGroup

    ) {

      return ctx.reply(

        "❌ This command can only be used in groups."

      );

    }

    // ====================================

    // ADMIN ONLY

    // ====================================

    if (

      cmd.admin &&

      isGroup &&

      !isOwner

    ) {

      const metadata =

        await sock.groupMetadata(

          jid

        );

      const participant =

        metadata.participants

          .find(

            p =>

              jidNumber(

                p.id

              ) ===

              senderNumber

          );

      if (

        !participant?.admin

      ) {

        return ctx.reply(

          "❌ Admins only."

        );

      }

    }

    ctx.args =

      args;

    ctx.argText =

      args.join(

        " "

      );

    // ====================================

    // PFP

    // ====================================

    if (

      commandName

        .toLowerCase() ===

      "pfp"

    ) {

      const result =

        await saveProfilePicture(

          sock,

          msg,

          sender

        );

      if (

        !result.ok

      ) {

        return ctx.reply(

          result.error

        );

      }

      return ctx.reply(

`╭────────────────────╮

       🖼️ *PFP UPDATED*

╰────────────────────╯

✅ Your economy profile picture

has been updated.

💡 Use *.p* to view your profile.`

      );

    }

    // ====================================

    // RUN COMMAND

    // ====================================

    try {

      return await cmd.run(

        ctx

      );

    } catch (error) {

      console.error(

        `❌ Command ${commandName} error:`,

        error

      );

      return ctx.reply(

        "❌ Something went wrong while running that command."

      );

    }

  }

  // ========================================

  // CHAT AI

  // ========================================

  if (

    isGroup &&

    text &&

    text.trim()

  ) {

    await handleChat(

      sock,

      msg,

      jid,

      text

    );

  }

}
// ==========================================

// EXPORT

// ==========================================

module.exports = {

  handleMessage

};