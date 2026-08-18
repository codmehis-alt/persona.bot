const { fmt, pickRandom } = require("../lib/utils");

const fs = require("fs");

const path = require("path");

// ==========================================

// JOBS

// ==========================================

const JOBS = [

  ["🍜 Ramen chef", 4000],

  ["⚔️ Demon slayer", 10000],

  ["📦 Delivery ninja", 3000],

  ["🎤 Idol backup dancer", 6000],

  ["🧹 Maid café staff", 2500],

  ["🐟 Fisherman", 1000],

  ["🎮 Pro gamer", 8000],

  ["📚 Mangaka assistant", 5000]

];

// ==========================================

// SHOP

// ==========================================

const SHOP = [

  {

    id: "slip",

    name: "🏦 Bank Slip",

    description: "+$5,000 bank limit",

    price: 10

  },

  {

    id: "ring",

    name: "💍 Ring",

    description: "A collectible ring",

    price: 5000

  },

  {

    id: "shield",

    name: "🛡️ Rob Shield",

    description: "Blocks 1 rob",

    price: 2000

  },

  {

    id: "potion",

    name: "🧪 Luck Potion",

    description: "Luck item",

    price: 1500

  },

  {

    id: "rose",

    name: "🌹 Rose",

    description: "A gift item",

    price: 500

  },

  {

    id: "crown",

    name: "👑 Crown",

    description: "Royal collectible",

    price: 10000

  },

  {

    id: "sword",

    name: "⚔️ Katana",

    description: "Rare collectible",

    price: 7500

  },

  {

    id: "pet",

    name: "🐱 Neko Pet",

    description: "Cute collectible",

    price: 4000

  }

];

// ==========================================

// HELPERS

// ==========================================

const needReg = (u, reply) => {

  if (!u.registered) {

    reply("❌ Register first with *.reg*");

    return true;

  }

  return false;

};

const log = (u, txt) => {

  if (!Array.isArray(u.transactions)) {

    u.transactions = [];

  }

  u.transactions.unshift(txt);

  u.transactions = u.transactions.slice(0, 5);

};

const profileName = (u, jid) => {

  return (

    u.profileName ||

    u.name ||

    `@${String(jid).split("@")[0]}`

  );

};

const money = (amount) => {

  return `$${fmt(Number(amount) || 0)}`;

};

// ==========================================

// COMMANDS

// ==========================================

module.exports = [

  // ========================================

  // REGISTER

  // ========================================

  {

    name: "reg",

    aliases: [

      "register"

    ],

    run: ({

      db,

      sender,

      reply,

      config

    }) => {

      const u = db.user(sender);

      if (u.registered) {

        return reply(

          `╭────────────────╮\n` +

          `   👤 *ACCOUNT*\n` +

          `╰────────────────╯\n\n` +

          `✅ You are already registered.\n\n` +

          `💡 Use *.profile* to view your profile.`

        );

      }

      u.registered = true;

      u.wallet =

        Number(config.economy.startBalance) || 5000;

      if (typeof u.profileName !== "string") {

        u.profileName = "";

      }

      db.save();

      reply(

        `╭────────────────╮\n` +

        `   🎉 *WELCOME!*\n` +

        `╰────────────────╯\n\n` +

        `👤 Player: *${profileName(u, sender)}*\n` +

        `💵 Starting balance: *${money(u.wallet)}*\n\n` +

        `━━━━━━━━━━━━━━━━\n` +

        `🎁 *.daily* • *.work*\n` +

        `🛒 *.shop*`

      );

    }

  },

  // ========================================

  // BALANCE

  // ========================================

  {

    name: "balance",

    aliases: [

      "bal",

      "wallet"

    ],

    run: ({

      db,

      sender,

      reply,

      config

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      const limit =

        (Number(config.economy.bankBase) || 0) *

        (1 + (Number(u.bankSlips) || 0));

      reply(

        `╭────────────────╮\n` +

        `   💳 *BALANCE*\n` +

        `╰────────────────╯\n\n` +

        `👤 ${profileName(u, sender)}\n` +

        `👛 Wallet: *${money(u.wallet)}*\n` +

        `🏦 Bank: *${money(u.bank)} / ${money(limit)}*\n` +

        `🔮 Orbs: *${fmt(Number(u.orbs) || 0)}*`

      );

    }

  },

  // ========================================

  // DAILY

  // ========================================

  {

    name: "daily",

    run: ({

      db,

      sender,

      reply,

      isOwner,

      config

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      if (!u.cooldowns) {

        u.cooldowns = {};

      }

      const today =

        new Date().toDateString();

      if (

        u.cooldowns.daily === today

      ) {

        return reply(

          `╭────────────────╮\n` +

          `   ⏰ *DAILY REWARD*\n` +

          `╰────────────────╯\n\n` +

          `❌ You already claimed today's reward.\n` +

          `🌙 Come back tomorrow!`

        );

      }

      u.cooldowns.daily = today;

      const normalAmount =

        Number(config.economy.daily) || 5000;

      const ownerAmount =

        Number(config.economy.ownerDaily) ||

        normalAmount;

      const amount =

        isOwner

          ? ownerAmount

          : normalAmount;

      u.wallet += amount;

      if (isOwner) {

        u.orbs =

          (Number(u.orbs) || 0) + 99999;

      }

      log(

        u,

        `+${money(amount)} daily`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `   🎁 *DAILY REWARD*\n` +

        `╰────────────────╯\n\n` +

        `👤 ${profileName(u, sender)}\n` +

        `💵 Reward: *+${money(amount)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*\n\n` +

        `✨ Come back tomorrow!`

      );

    }

  },

  // ========================================

  // WORK

  // ========================================

  {

    name: "work",

    run: ({

      db,

      sender,

      reply,

      config

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      if (!u.cooldowns) {

        u.cooldowns = {};

      }

      const now =

        Date.now();

      const cooldown =

        Number(config.economy.workCooldown) ||

        3600000;

      const last =

        Number(u.cooldowns.work) || 0;

      if (

        now - last < cooldown

      ) {

        const remaining =

          cooldown - (now - last);

        return reply(

          `╭────────────────╮\n` +

          `     ⏰ *WORK*\n` +

          `╰────────────────╯\n\n` +

          `😴 You're tired!\n` +

          `⏳ Try again in *${Math.ceil(

            remaining / 60000

          )} minutes*`

        );

      }

      const [job, base] =

        pickRandom(JOBS);

      const pay =

        base +

        Math.floor(

          Math.random() * 1000

        );

      u.cooldowns.work = now;

      u.wallet += pay;

      log(

        u,

        `+${money(pay)} work`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `     💼 *WORK*\n` +

        `╰────────────────╯\n\n` +

        `👤 ${profileName(u, sender)}\n` +

        `🧑‍💼 Job: *${job}*\n` +

        `💵 Earned: *+${money(pay)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // DEPOSIT

  // ========================================

  {

    name: "deposit",

    aliases: [

      "dep"

    ],

    run: ({

      db,

      sender,

      reply,

      args,

      config

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      const limit =

        (Number(config.economy.bankBase) || 0) *

        (1 + (Number(u.bankSlips) || 0));

      let amount;

      if (

        args[0] === undefined ||

        args[0] === "all"

      ) {

        amount =

          Number(u.wallet) || 0;

      } else {

        amount =

          parseInt(args[0], 10);

      }

      if (

        !Number.isFinite(amount) ||

        amount <= 0 ||

        amount > u.wallet

      ) {

        return reply(

          `❌ Invalid amount.\n` +

          `Example: *.dep 5000*`

        );

      }

      const available =

        limit - u.bank;

      if (available <= 0) {

        return reply(

          `🏦 Your bank is full!\n` +

          `💡 Buy a Bank Slip from *.shop*`

        );

      }

      amount =

        Math.min(

          amount,

          available

        );

      u.wallet -= amount;

      u.bank += amount;

      db.save();

      reply(

        `╭────────────────╮\n` +

        `     🏦 *DEPOSIT*\n` +

        `╰────────────────╯\n\n` +

        `💵 Deposited: *${money(amount)}*\n` +

        `🏦 Bank: *${money(u.bank)} / ${money(limit)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // WITHDRAW

  // ========================================

  {

    name: "withdraw",

    aliases: [

      "wd",

      "wtd"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      let amount;

      if (

        args[0] === undefined ||

        args[0] === "all"

      ) {

        amount =

          Number(u.bank) || 0;

      } else {

        amount =

          parseInt(args[0], 10);

      }

      if (

        !Number.isFinite(amount) ||

        amount <= 0 ||

        amount > u.bank

      ) {

        return reply(

          `❌ Invalid amount.\n` +

          `Example: *.wtd 5000*`

        );

      }

      u.bank -= amount;

      u.wallet += amount;

      db.save();

      reply(

        `╭────────────────╮\n` +

        `     💵 *WITHDRAW*\n` +

        `╰────────────────╯\n\n` +

        `💵 Withdrawn: *${money(amount)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*\n` +

        `🏦 Bank: *${money(u.bank)}*`

      );

    }

  },

  // ========================================

  // DONATE

  // ========================================

  {

    name: "donate",

    aliases: [

      "transfer"

    ],

    run: async ({

      db,

      sender,

      reply,

      msg,

      args

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      const target =

        msg.message

          ?.extendedTextMessage

          ?.contextInfo

          ?.mentionedJid

          ?.[0];

      const amount =

        parseInt(

          args.find(

            a => /^\d+$/.test(a)

          ),

          10

        );

      if (

        !target ||

        !amount ||

        amount <= 0 ||

        amount > u.wallet

      ) {

        return reply(

          `❌ Usage: *.donate @user 1000*`

        );

      }

      if (

        target === sender

      ) {

        return reply(

          `❌ You cannot transfer money to yourself.`

        );

      }

      const receiver =

        db.user(target);

      u.wallet -= amount;

      receiver.wallet += amount;

      log(

        u,

        `-${money(amount)} donated`

      );

      log(

        receiver,

        `+${money(amount)} received`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `     💝 *TRANSFER*\n` +

        `╰────────────────╯\n\n` +

        `👤 To: *${profileName(receiver, target)}*\n` +

        `💵 Amount: *${money(amount)}*\n` +

        `👛 Your wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // ROB

  // ========================================

  {

    name: "rob",

    group: true,

    run: async ({

      db,

      sender,

      reply,

      msg,

      config

    }) => {

      const u = db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      if (!u.cooldowns) {

        u.cooldowns = {};

      }

      const now =

        Date.now();

      const cooldown =

        Number(config.economy.robCooldown) ||

        3600000;

      if (

        now -

        (u.cooldowns.rob || 0) <

        cooldown

      ) {

        return reply(

          `⏰ *ROB COOLDOWN*\n` +

          `You can rob again in 1 hour.`

        );

      }

      const target =

        msg.message

          ?.extendedTextMessage

          ?.contextInfo

          ?.mentionedJid

          ?.[0];

      if (!target) {

        return reply(

          `❌ Tag someone.\n` +

          `Example: *.rob @user*`

        );

      }

      if (

        target === sender

      ) {

        return reply(

          `❌ You cannot rob yourself.`

        );

      }

      const victim =

        db.user(target);

      u.cooldowns.rob =

        now;

      if (

        victim.inv &&

        victim.inv.shield

      ) {

        delete victim.inv.shield;

        db.save();

        return reply(

          `╭────────────────╮\n` +

          `  🛡️ *ROBBERY BLOCKED*\n` +

          `╰────────────────╯\n\n` +

          `The target had a Rob Shield!\n` +

          `🛡️ Shield consumed.`

        );

      }

      if (

        Math.random() < 0.5 ||

        victim.wallet < 100

      ) {

        u.wallet =

          Math.max(

            0,

            u.wallet - 500

          );

        db.save();

        return reply(

          `╭────────────────╮\n` +

          `      🚓 *CAUGHT!*\n` +

          `╰────────────────╯\n\n` +

          `Your robbery failed.\n` +

          `💸 Fine: *$500*`

        );

      }

      const amount =

        Math.floor(

          victim.wallet *

          (0.1 + Math.random() * 0.2)

        );

      victim.wallet -= amount;

      u.wallet += amount;

      log(

        u,

        `+${money(amount)} rob`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `      🦹 *ROBBERY!*\n` +

        `╰────────────────╯\n\n` +

        `🎯 Target: *${profileName(victim, target)}*\n` +

        `💰 Stolen: *${money(amount)}*\n` +

        `👛 Your wallet: *${money(u.wallet)}*`

      );

    }

  },
    // ========================================

  // SHOP

  // ========================================

  {

    name: "shop",

    run: ({

      reply

    }) => {

      const rows =

        SHOP.map(

          (item, index) => {

            return (

              `╭─ *${index + 1}. ${item.name}*\n` +

              `│ 💵 ${money(item.price)}\n` +

              `│ 📝 ${item.description}\n` +

              `╰─ 🛒 *.buy ${item.id}*`

            );

          }

        ).join("\n\n");

      reply(

        `╭────────────────╮\n` +

        `      🛒 *SHOP*\n` +

        `╰────────────────╯\n\n` +

        `💵 Spend your wallet money\n` +

        `on useful items and collectibles.\n\n` +

        `${rows}\n\n` +

        `━━━━━━━━━━━━━━━━\n` +

        `💡 Example: *.buy shield*`

      );

    }

  },

  // ========================================

  // BUY

  // ========================================

  {

    name: "buy",

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u =

        db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      const item =

        SHOP.find(

          i =>

            i.id.toLowerCase() ===

            String(

              args[0] || ""

            ).toLowerCase()

        );

      if (!item) {

        return reply(

          `❌ Item not found.\n` +

          `💡 Use *.shop* to see available items.`

        );

      }

      if (

        u.wallet < item.price

      ) {

        return reply(

          `╭────────────────╮\n` +

          `  ❌ *NOT ENOUGH MONEY*\n` +

          `╰────────────────╯\n\n` +

          `${item.name}\n` +

          `💵 Price: *${money(item.price)}*\n` +

          `👛 Wallet: *${money(u.wallet)}*`

        );

      }

      u.wallet -=

        item.price;

      if (

        item.id === "slip"

      ) {

        u.bankSlips =

          (Number(u.bankSlips) || 0) + 1;

      } else {

        if (

          !u.inv ||

          typeof u.inv !== "object"

        ) {

          u.inv = {};

        }

        u.inv[item.id] =

          (Number(u.inv[item.id]) || 0) + 1;

      }

      log(

        u,

        `-${money(item.price)} bought ${item.id}`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `    ✅ *PURCHASED!*\n` +

        `╰────────────────╯\n\n` +

        `${item.name}\n` +

        `💵 Paid: *${money(item.price)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // INVENTORY

  // ========================================

  {

    name: "inventory",

    aliases: [

      "inv"

    ],

    run: ({

      db,

      sender,

      reply

    }) => {

      const u =

        db.user(sender);

      const items =

        Object.entries(

          u.inv || {}

        );

      const itemText =

        items.length

          ? items

              .map(

                ([key, value]) =>

                  `│ 📦 ${key} ×${value}`

              )

              .join("\n")

          : `│ 📭 Empty`;

      reply(

        `╭────────────────╮\n` +

        `   🎒 *INVENTORY*\n` +

        `╰────────────────╯\n\n` +

        `${itemText}\n\n` +

        `━━━━━━━━━━━━━━━━\n` +

        `👑 Titles: ${

          u.titles?.join(", ") ||

          "None"

        }`

      );

    }

  },

  // ========================================

  // RICH LIST

  // ========================================

  {

    name: "rich",

    aliases: [

      "richlist",

      "toprich"

    ],

    run: ({

      db,

      reply

    }) => {

      const top =

        Object.entries(

          db.data.users || {}

        )

          .map(

            ([jid, u]) => {

              const total =

                (Number(u.wallet) || 0) +

                (Number(u.bank) || 0);

              return [

                jid,

                total,

                profileName(u, jid)

              ];

            }

          )

          .sort(

            (a, b) =>

              b[1] - a[1]

          )

          .slice(0, 10);

      if (!top.length) {

        return reply(

          `🏆 *RICH LIST*\n\n` +

          `No players yet.`

        );

      }

      const medals = [

        "🥇",

        "🥈",

        "🥉"

      ];

      const list =

        top

          .map(

            ([jid, amount, name], index) => {

              const medal =

                medals[index] ||

                `#${index + 1}`;

              return (

                `${medal} *${name}* — ` +

                `💰 ${money(amount)}`

              );

            }

          )

          .join("\n");

      reply(

        `╭────────────────╮\n` +

        `   🏆 *RICH LIST*\n` +

        `╰────────────────╯\n\n` +

        `${list}\n\n` +

        `━━━━━━━━━━━━━━━━\n` +

        `💰 Wallet + Bank`

      );

    }

  },

  // ========================================

  // PROFILE

  // ========================================

  {

    name: "profile",

    aliases: [

      "p"

    ],

    run: async ({

      db,

      sender,

      reply,

      msg,

      sock

    }) => {

      const context =

        msg.message

          ?.extendedTextMessage

          ?.contextInfo;

      const mentioned =

        context?.mentionedJid ||

        [];

      const quoted =

        context?.participant ||

        null;

      // Priority:

      // 1. Tagged user

      // 2. Replied user

      // 3. Yourself

      const target =

        mentioned[0] ||

        quoted ||

        sender;

      const u =

        db.user(target);

      const total =

        (Number(u.wallet) || 0) +

        (Number(u.bank) || 0);

      const pfpDir =

        path.join(

          __dirname,

          "..",

          "data",

          "economy-pfps"

        );

      const cleanTarget =

        String(target)

          .replace(

            /[^0-9]/g,

            ""

          );

      const pfpPath =

        path.join(

          pfpDir,

          `${cleanTarget}.jpg`

        );

      const profileText =

        `╭────────────────╮\n` +

        `    👤 *PROFILE*\n` +

        `╰────────────────╯\n\n` +

        `🏷️ Name: *${profileName(

          u,

          target

        )}*\n` +

        `💰 Total: *${money(total)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*\n` +

        `🏦 Bank: *${money(u.bank)}*\n` +

        `🔮 Orbs: *${fmt(

          Number(u.orbs) || 0

        )}*\n` +

        `🎂 Age: *${u.age || "?"}*\n` +

        `📝 Bio: _${u.bio || "No bio set"}_\n` +

        `🎴 Cards: *${u.cards?.length || 0}*\n` +

        `🐉 Pokémon: *${u.pokemon?.length || 0}*`;

      // Send profile with PFP if available

      if (

        fs.existsSync(pfpPath)

      ) {

        try {

          return await sock.sendMessage(

            msg.key.remoteJid,

            {

              image:

                fs.readFileSync(

                  pfpPath

                ),

              caption:

                profileText

            },

            {

              quoted: msg

            }

          );

        } catch (error) {

          console.error(

            "Profile image error:",

            error

          );

        }

      }

      return reply(

        profileText

      );

    }

  },

  // ========================================

  // EDIT PROFILE NAME

  // ========================================

  {

    name: "edit",

    aliases: [

      "setname"

    ],

    run: ({

      db,

      sender,

      reply,

      argText

    }) => {

      const name =

        String(

          argText || ""

        )

          .trim()

          .replace(

            /\s+/g,

            " "

          )

          .slice(0, 25);

      if (!name) {

        return reply(

          `❌ Usage: *.edit <profile name>*\n` +

          `Example: *.edit Shadow*`

        );

      }

      const u =

        db.user(sender);

      u.profileName =

        name;

      db.save();

      reply(

        `╭────────────────╮\n` +

        `   ✏️ *PROFILE EDITED*\n` +

        `╰────────────────╯\n\n` +

        `🏷️ New name: *${name}*\n` +

        `✨ Your new name will now appear\n` +

        `on the Rich List and Lottery List.`

      );

    }

  },

  // ========================================

  // BIO

  // ========================================

  {

    name: "bio",

    run: ({

      db,

      sender,

      reply,

      argText

    }) => {

      const text =

        String(

          argText || ""

        )

          .trim()

          .slice(0, 100);

      if (!text) {

        return reply(

          `❌ Usage: *.bio <text>*`

        );

      }

      db.user(sender).bio =

        text;

      db.save();

      reply(

        `✅ Bio updated!\n` +

        `📝 *${text}*`

      );

    }

  },

  // ========================================

  // SET AGE

  // ========================================

  {

    name: "setage",

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const age =

        parseInt(

          args[0],

          10

        );

      if (

        !Number.isInteger(age) ||

        age <= 0

      ) {

        return reply(

          `❌ Numbers only.\n` +

          `Example: *.setage 18*`

        );

      }

      db.user(sender).age =

        age;

      db.save();

      reply(

        `✅ Age set to *${age}*.`

      );

    }

  },

  // ========================================

  // TRANSACTIONS

  // ========================================

  {

    name: "transactions",

    aliases: [

      "tx",

      "history"

    ],

    run: ({

      db,

      sender,

      reply

    }) => {

      const u =

        db.user(sender);

      const history =

        u.transactions || [];

      reply(

        `╭────────────────╮\n` +

        `  🧾 *TRANSACTIONS*\n` +

        `╰────────────────╯\n\n` +

        (

          history.length

            ? history

                .map(

                  (x, i) =>

                    `${i + 1}. ${x}`

                )

                .join("\n")

            : "📭 No transactions yet."

        )

      );

    }

  },
    // ========================================

  // GAMBLE

  // ========================================

  {

    name: "gamble",

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const day =

        new Date().getDay();

      if (

        day !== 0 &&

        day !== 6

      ) {

        return reply(

          `🎰 *GAMBLE*\n\n` +

          `Gambling is available on weekends only!`

        );

      }

      const u =

        db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      const amount =

        parseInt(

          args[0],

          10

        );

      if (

        !amount ||

        amount <= 0 ||

        amount > u.wallet

      ) {

        return reply(

          `❌ Usage: *.gamble <amount>*`

        );

      }

      if (

        Math.random() < 0.45

      ) {

        u.wallet += amount;

        log(

          u,

          `+${money(amount)} gamble`

        );

        db.save();

        return reply(

          `╭────────────────╮\n` +

          `    🎰 *YOU WON!*\n` +

          `╰────────────────╯\n\n` +

          `💵 Profit: *+${money(amount)}*\n` +

          `👛 Wallet: *${money(u.wallet)}*`

        );

      }

      u.wallet -= amount;

      log(

        u,

        `-${money(amount)} gamble`

      );

      db.save();

      reply(

        `╭────────────────╮\n` +

        `    🎰 *YOU LOST*\n` +

        `╰────────────────╯\n\n` +

        `💸 Lost: *${money(amount)}*\n` +

        `👛 Wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // LOAN

  // ========================================

  {

    name: "loan",

    run: ({

      db,

      sender,

      reply,

      args,

      config

    }) => {

      const u =

        db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      if (

        args[0] === "pay"

      ) {

        const payment =

          Math.min(

            Number(u.loan) || 0,

            Number(u.wallet) || 0

          );

        u.loan -= payment;

        u.wallet -= payment;

        db.save();

        return reply(

          `╭────────────────╮\n` +

          `   🏦 *LOAN PAYMENT*\n` +

          `╰────────────────╯\n\n` +

          `💵 Paid: *${money(payment)}*\n` +

          `📋 Remaining: *${money(u.loan)}*`

        );

      }

      const amount =

        parseInt(

          args[0],

          10

        );

      if (

        !amount ||

        amount <= 0 ||

        amount > 20000 ||

        u.loan > 0

      ) {

        return reply(

          `❌ Usage: *.loan <amount>*\n` +

          `Maximum: *$20,000*\n\n` +

          `💡 Repay with *.loan pay*`

        );

      }

      const interest =

        Number(

          config.economy.loanInterest

        ) || 0.05;

      u.loan =

        Math.floor(

          amount *

          (1 + interest)

        );

      u.wallet += amount;

      db.save();

      reply(

        `╭────────────────╮\n` +

        `      🏦 *LOAN*\n` +

        `╰────────────────╯\n\n` +

        `💵 Received: *${money(amount)}*\n` +

        `📋 You owe: *${money(u.loan)}*\n` +

        `📈 Interest: *${interest * 100}%*\n` +

        `💡 Repay: *.loan pay*`

      );

    }

  },

  // ========================================

  // JOIN LOTTERY

  // ========================================

  {

    name: "joinlottery",

    aliases: [

      "jl",

      "lottery"

    ],

    run: ({

      db,

      sender,

      reply,

      config

    }) => {

      const u =

        db.user(sender);

      if (needReg(u, reply)) {

        return;

      }

      if (

        !Array.isArray(

          db.data.lottery

        )

      ) {

        db.data.lottery = [];

      }

      const ticket =

        Number(

          config.economy.lotteryTicket

        ) || 1000;

      if (

        u.wallet < ticket

      ) {

        return reply(

          `❌ Lottery ticket costs *${money(ticket)}*.\n` +

          `👛 Wallet: ${money(u.wallet)}`

        );

      }

      u.wallet -= ticket;

      db.data.lottery.push(

        sender

      );

      db.save();

      const step =

        Number(

          config.economy.lotteryStep

        ) || ticket;

      const pool =

        db.data.lottery.length *

        step;

      reply(

        `╭────────────────╮\n` +

        `      🎟️ *LOTTERY*\n` +

        `╰────────────────╯\n\n` +

        `🎫 Entry purchased!\n` +

        `👤 Player: *${profileName(u, sender)}*\n` +

        `💵 Ticket: *${money(ticket)}*\n` +

        `🏆 Pool: *${money(pool)}*\n` +

        `👥 Entries: *${db.data.lottery.length}*`

      );

    }

  },

  // ========================================

  // LOTTERY LIST / DRAW

  // ========================================

  {

    name: "lotterylist",

    aliases: [

      "ll"

    ],

    run: ({

      db,

      reply,

      args,

      isOwner,

      config

    }) => {

      if (

        !Array.isArray(

          db.data.lottery

        )

      ) {

        db.data.lottery = [];

      }

      if (

        args[0] === "draw"

      ) {

        if (!isOwner) {

          return reply(

            `❌ Only the owner can draw the lottery.`

          );

        }

        if (

          !db.data.lottery.length

        ) {

          return reply(

            `❌ No lottery entries.`

          );

        }

        const winner =

          db.data.lottery[

            Math.floor(

              Math.random() *

              db.data.lottery.length

            )

          ];

        const step =

          Number(

            config.economy.lotteryStep

          ) || 1000;

        const prize =

          db.data.lottery.length *

          step;

        const winnerUser =

          db.user(winner);

        winnerUser.wallet +=

          prize;

        db.data.lottery = [];

        db.save();

        return reply(

          `╭────────────────╮\n` +

          `   🎉 *LOTTERY WINNER!*\n` +

          `╰────────────────╯\n\n` +

          `🏆 Winner: *${profileName(

            winnerUser,

            winner

          )}*\n` +

          `💰 Prize: *${money(prize)}*\n` +

          `🎊 Congratulations!`

        );

      }

      if (

        !db.data.lottery.length

      ) {

        return reply(

          `╭────────────────╮\n` +

          `   🎟️ *LOTTERY LIST*\n` +

          `╰────────────────╯\n\n` +

          `📭 No entries yet.\n` +

          `💡 Join with *.jl*`

        );

      }

      const step =

        Number(

          config.economy.lotteryStep

        ) || 1000;

      const pool =

        db.data.lottery.length *

        step;

      const entries =

        db.data.lottery

          .map(

            (jid, index) => {

              const u =

                db.user(jid);

              return (

                `${index + 1}. 🎟️ *${profileName(

                  u,

                  jid

                )}*`

              );

            }

          )

          .join("\n");

      reply(

        `╭────────────────╮\n` +

        `   🎟️ *LOTTERY LIST*\n` +

        `╰────────────────╯\n\n` +

        `🏆 Prize Pool: *${money(pool)}*\n` +

        `👥 Entries: *${db.data.lottery.length}*\n\n` +

        `━━━━━━━━━━━━━━━━\n` +

        `${entries}`

      );

    }

  },

  // ========================================

  // COOLDOWN LIST

  // ========================================

  {

    name: "cooldownlist",

    aliases: [

      "cdl"

    ],

    run: ({

      db,

      sender,

      reply,

      msg

    }) => {

      const target =

        msg.message

          ?.extendedTextMessage

          ?.contextInfo

          ?.mentionedJid

          ?.[0] ||

        msg.message

          ?.extendedTextMessage

          ?.contextInfo

          ?.participant ||

        sender;

      const u =

        db.user(target);

      const cooldowns =

        u.cooldowns || {};

      const now =

        Date.now();

      const left = (

        milliseconds

      ) => {

        if (

          milliseconds <= 0

        ) {

          return "✅ Ready";

        }

        return (

          `${Math.ceil(

            milliseconds / 60000

          )}m`

        );

      };

      const work =

        3600000 -

        (

          now -

          (

            Number(

              cooldowns.work

            ) || 0

          )

        );

      const rob =

        3600000 -

        (

          now -

          (

            Number(

              cooldowns.rob

            ) || 0

          )

        );

      const daily =

        cooldowns.daily ===

        new Date().toDateString()

          ? "⏳ Claimed"

          : "✅ Ready";

      reply(

        `╭────────────────╮\n` +

        `    ⏰ *COOLDOWNS*\n` +

        `╰────────────────╯\n\n` +

        `👤 ${profileName(

          u,

          target

        )}\n` +

        `💼 Work: *${left(work)}*\n` +

        `🦹 Rob: *${left(rob)}*\n` +

        `🎁 Daily: *${daily}*`

      );

    }

  },

  // ========================================

  // SET PROFILE PFP

  // ========================================

  {

    name: "pfp",

    run: async ({

      reply,

      saveProfilePicture

    }) => {

      const result =

        await saveProfilePicture();

      if (!result.ok) {

        return reply(

          result.error

        );

      }

      return reply(

        `╭────────────────╮\n` +

        `    🖼️ *PFP UPDATED*\n` +

        `╰────────────────╯\n\n` +

        `✅ Your economy profile picture\n` +

        `has been updated successfully!\n\n` +

        `👤 View it with: *.p*`

      );

    }

  },

  // ========================================

  // PROFILE PICTURE REMOVE

  // ========================================

  {

    name: "delpfp",

    aliases: [

      "removepfp"

    ],

    run: ({

      sender,

      reply

    }) => {

      const folder =

        path.join(

          __dirname,

          "..",

          "data",

          "economy-pfps"

        );

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

      if (

        !fs.existsSync(filePath)

      ) {

        return reply(

          `❌ You don't have a custom economy PFP.`

        );

      }

      try {

        fs.unlinkSync(

          filePath

        );

        reply(

          `╭────────────────╮\n` +

          `   🗑️ *PFP REMOVED*\n` +

          `╰────────────────╯\n\n` +

          `✅ Your economy profile picture has been removed.`

        );

      } catch (error) {

        console.error(

          "PFP delete error:",

          error

        );

        reply(

          `❌ Couldn't remove your PFP.`

        );

      }

    }

  },

  // ========================================

  // ECONOMY HELP

  // ========================================

  {

    name: "economy",

    aliases: [

      "econ",

      "economyhelp"

    ],

    run: ({

      reply

    }) => {

      reply(

        `╭────────────────────╮\n` +

        `      💰 *ECONOMY*\n` +

        `╰────────────────────╯\n\n` +

        `💳 *Money*\n` +

        `• *.bal* — Balance\n` +

        `• *.dep <amount>* — Deposit\n` +

        `• *.wtd <amount>* — Withdraw\n` +

        `• *.daily* — Daily reward\n` +

        `• *.work* — Work for money\n\n` +

        `👤 *Profile*\n` +

        `• *.p* — Your profile\n` +

        `• *.p @user* — User profile\n` +

        `• Reply + *.p* — User profile\n` +

        `• Reply image + *.pfp* — Set PFP\n` +

        `• *.delpfp* — Remove PFP\n` +

        `• *.edit <name>* — Change name\n` +

        `• *.bio <text>* — Set bio\n\n` +

        `🛒 *Items*\n` +

        `• *.shop* — Open shop\n` +

        `• *.buy <item>* — Buy item\n` +

        `• *.inv* — Inventory\n\n` +

        `🎮 *Games*\n` +

        `• *.gamble <amount>* — Gamble\n` +

        `• *.rob @user* — Rob\n\n` +

        `🏆 *Other*\n` +

        `• *.rich* — Rich list\n` +

        `• *.tx* — Transactions\n` +

        `• *.jl* — Join lottery\n` +

        `• *.ll* — Lottery list\n` +

        `• *.cdl* — Cooldowns`

      );

    }

  }

];