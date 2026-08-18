const {

  fetchJson,

  fetchBuffer,

  fmt,

  pickRandom

} = require("../lib/utils");

// ==========================================

// POKEMON SHOP

// ==========================================

const PSHOP = [

  {

    id: "potion",

    name: "🧪 Potion",

    description: "Heal 20 HP",

    price: 800,

    heal: 20

  },

  {

    id: "superpotion",

    name: "💊 Super Potion",

    description: "Heal 50 HP",

    price: 1800,

    heal: 50

  },

  {

    id: "pokeball",

    name: "⚪ Pokéball",

    description: "Improves catching",

    price: 1000

  },

  {

    id: "rarecandy",

    name: "🍬 Rare Candy",

    description: "+1 Level",

    price: 2500

  }

];

// ==========================================

// SETTINGS

// ==========================================

// Normal Pokémon lose 1 HP every 6 hours.

const HEALTH_DECAY_INTERVAL =

  6 * 60 * 60 * 1000;

// Maximum normal HP.

const MAX_HP = 100;

// SS Pokémon never lose HP.

const SS_EXEMPT = "SS";

// ==========================================

// NUMBER FORMAT

// ==========================================

function money(value) {

  return fmt(

    Math.max(

      0,

      Math.floor(

        Number(value) || 0

      )

    )

  );

}

// ==========================================

// SAFE NAME

// ==========================================

function prettyName(name) {

  return String(

    name || "Unknown"

  )

    .replace(

      /-/g,

      " "

    )

    .replace(

      /\b\w/g,

      c => c.toUpperCase()

    );

}

// ==========================================

// GET BASE STAT

// ==========================================

function getBaseStat(

  pokemon,

  statName

) {

  const stat =

    pokemon.stats?.find(

      s =>

        s.stat?.name ===

        statName

    );

  return Number(

    stat?.base_stat || 0

  );

}

// ==========================================

// GET TIER

// ==========================================

function getTier(

  pokemon

) {

  const exp =

    Number(

      pokemon.base_experience || 0

    );

  const totalStats =

    (pokemon.stats || [])

      .reduce(

        (

          total,

          item

        ) =>

          total +

          Number(

            item.base_stat || 0

          ),

        0

      );

  if (

    exp >= 300 ||

    totalStats >= 650

  ) {

    return "SS";

  }

  if (

    exp >= 240 ||

    totalStats >= 560

  ) {

    return "S";

  }

  if (

    exp >= 180 ||

    totalStats >= 470

  ) {

    return "A";

  }

  if (

    exp >= 120 ||

    totalStats >= 380

  ) {

    return "B";

  }

  return "C";

}

// ==========================================

// TIER EMOJI

// ==========================================

function tierEmoji(

  tier

) {

  const map = {

    SS: "👑",

    S: "💎",

    A: "🌟",

    B: "✨",

    C: "🔹"

  };

  return (

    map[tier] ||

    "🔹"

  );

}

// ==========================================

// CARD VALUE

// ==========================================

function calculateValue(

  pokemon,

  tier

) {

  const exp =

    Number(

      pokemon.base_experience || 0

    );

  const baseStats =

    (pokemon.stats || [])

      .reduce(

        (

          total,

          item

        ) =>

          total +

          Number(

            item.base_stat || 0

          ),

        0

      );

  const multipliers = {

    SS: 8,

    S: 5,

    A: 3,

    B: 2,

    C: 1

  };

  const multiplier =

    multipliers[tier] || 1;

  const base =

    Math.max(

      1000,

      (

        exp * 15

      ) +

      (

        baseStats * 8

      )

    );

  return Math.floor(

    base *

    multiplier

  );

}

// ==========================================

// RANDOM STAT

// ==========================================

function randomizeStat(

  base,

  min,

  max

) {

  const variation =

    Math.floor(

      base *

      (

        0.10 +

        Math.random() * 0.20

      )

    );

  const value =

    base +

    variation;

  return Math.max(

    min,

    Math.min(

      max,

      value

    )

  );

}

// ==========================================

// CREATE POKEMON

// ==========================================

function createPokemon(

  pokemon

) {

  const tier =

    getTier(

      pokemon

    );

  const attackBase =

    getBaseStat(

      pokemon,

      "attack"

    );

  const defenseBase =

    getBaseStat(

      pokemon,

      "defense"

    );

  const speedBase =

    getBaseStat(

      pokemon,

      "speed"

    );

  const hpBase =

    getBaseStat(

      pokemon,

      "hp"

    );

  // Stats are individually generated.

  // Same tier does NOT mean same stats.

  const attack =

    randomizeStat(

      attackBase,

      10,

      999

    );

  const defense =

    randomizeStat(

      defenseBase,

      10,

      999

    );

  const energy =

    randomizeStat(

      (

        speedBase +

        hpBase

      ) / 2,

      10,

      999

    );

  const value =

    calculateValue(

      pokemon,

      tier

    );

  return {

    // Internal ID is kept for compatibility.

    // Players use deck numbers instead.

    id:

      Date.now() +

      Math.floor(

        Math.random() * 10000

      ),

    name:

      pokemon.name,

    level:

      5,

    hp:

      MAX_HP,

    maxHp:

      MAX_HP,

    attack,

    defense,

    energy,

    tier,

    value,

    sprite:

      pokemon.sprites

        ?.other

        ?.["official-artwork"]

        ?.front_default ||

      pokemon.sprites

        ?.front_default,

    caughtAt:

      Date.now(),

    lastHealthDecay:

      Date.now(),

    warnedAt10:

      false

  };

}

// ==========================================

// MIGRATE OLD POKEMON

// ==========================================

function migratePokemon(

  pokemon

) {

  if (!pokemon) {

    return pokemon;

  }

  if (

    !pokemon.tier

  ) {

    pokemon.tier =

      "C";

  }

  if (

    typeof pokemon.hp !==

    "number"

  ) {

    pokemon.hp =

      MAX_HP;

  }

  if (

    typeof pokemon.maxHp !==

    "number"

  ) {

    pokemon.maxHp =

      MAX_HP;

  }

  if (

    typeof pokemon.attack !==

    "number"

  ) {

    pokemon.attack =

      50;

  }

  if (

    typeof pokemon.defense !==

    "number"

  ) {

    pokemon.defense =

      50;

  }

  if (

    typeof pokemon.energy !==

    "number"

  ) {

    pokemon.energy =

      50;

  }

  if (

    typeof pokemon.level !==

    "number"

  ) {

    pokemon.level =

      5;

  }

  if (

    typeof pokemon.value !==

    "number"

  ) {

    pokemon.value =

      1000;

  }

  if (

    !pokemon.lastHealthDecay

  ) {

    pokemon.lastHealthDecay =

      Date.now();

  }

  if (

    typeof pokemon.warnedAt10 !==

    "boolean"

  ) {

    pokemon.warnedAt10 =

      pokemon.hp <= 10;

  }

  return pokemon;

}

// ==========================================

// HEALTH DECAY

// ==========================================

function updateHealth(

  user

) {

  if (

    !Array.isArray(

      user.pokemon

    )

  ) {

    user.pokemon = [];

  }

  const now =

    Date.now();

  const warnings =

    [];

  const dead =

    [];

  for (

    let i = 0;

    i < user.pokemon.length;

    i++

  ) {

    const pokemon =

      migratePokemon(

        user.pokemon[i]

      );

    // SS Pokémon are exempt.

    if (

      pokemon.tier ===

      SS_EXEMPT

    ) {

      pokemon.lastHealthDecay =

        now;

      continue;

    }

    const last =

      Number(

        pokemon.lastHealthDecay ||

        now

      );

    const elapsed =

      now -

      last;

    if (

      elapsed <

      HEALTH_DECAY_INTERVAL

    ) {

      continue;

    }

    const damage =

      Math.floor(

        elapsed /

        HEALTH_DECAY_INTERVAL

      );

    pokemon.hp =

      Math.max(

        0,

        pokemon.hp -

        damage

      );

    pokemon.lastHealthDecay =

      last +

      (

        damage *

        HEALTH_DECAY_INTERVAL

      );

    // ======================================

    // 10 HP WARNING

    // ======================================

    if (

      pokemon.hp === 10 &&

      !pokemon.warnedAt10

    ) {

      pokemon.warnedAt10 =

        true;

      warnings.push(

        pokemon

      );

    }

    // ======================================

    // 0 HP

    // ======================================

    if (

      pokemon.hp <= 0

    ) {

      dead.push(

        pokemon

      );

    }

  }

  // Remove dead Pokémon.

  if (

    dead.length

  ) {

    user.pokemon =

      user.pokemon.filter(

        pokemon =>

          !dead.includes(

            pokemon

          )

      );

  }

  return {

    warnings,

    dead

  };

}

// ==========================================

// HEALTH NOTIFICATION

// ==========================================

async function sendHealthWarnings(

  sock,

  jid,

  user,

  warnings,

  dead

) {

  if (

    !warnings.length &&

    !dead.length

  ) {

    return;

  }

  const number =

    String(

      user.number ||

      user.jid ||

      ""

    );

  const cleanNumber =

    number

      .split(":")[0]

      .split("@")[0]

      .replace(

        /\D/g,

        ""

      );

  const mention =

    cleanNumber

      ? `@${cleanNumber}`

      : "";

  let text =

    "";

  // ======================================

  // 10 HP WARNING

  // ======================================

  for (

    const pokemon of warnings

  ) {

    text +=

      `⚠️ *POKÉMON WARNING*\n\n` +

      `${mention} your *${prettyName(

        pokemon.name

      )}* is at *10 HP*.\n` +

      `Use a potion before it reaches 0 ❤️\n\n`;

  }

  // ======================================

  // 0 HP

  // ======================================

  for (

    const pokemon of dead

  ) {

    text +=

      `💔 *POKÉMON LOST*\n\n` +

      `${mention}'s *${prettyName(

        pokemon.name

      )}* reached 0 HP and left the collection.\n\n`;

  }

  if (

    text.trim()

  ) {

    await sock.sendMessage(

      jid,

      {

        text,

        mentions:

          mention

            ? [

                user.jid ||

                user.number

              ]

            : []

      }

    );

  }

}
module.exports = [

  // ========================================

  // PMENU

  // ========================================

  {

    name:

      "pmenu",

    aliases:

      [

        "pokemon"

      ],

    run:

      async ({

        reply

      }) => {

        return reply(

`╭────────────────────╮

       🐉 *POKÉMON*

╰────────────────────╯

🎯 *.pcatch*

Catch a Pokémon

📚 *.pdeck*

View your collection

🔎 *.pinfo 1*

View Pokémon #1

💰 *.psell 1*

Sell Pokémon #1

🏪 *.pshop*

View Pokémon shop

🛒 *.pbuy potion*

Buy an item`

        );

      }

  },

  // ========================================

  // PCATCH

  // ========================================

  {

    name:

      "pcatch",

    aliases:

      [

        "pc"

      ],

    run:

      async ({

        db,

        sender,

        reply,

        sock,

        jid,

        msg,

        config

      }) => {

        const u =

          db.user(

            sender

          );

        if (

          !u.registered

        ) {

          return reply(

            "❌ Register first with *.reg*."

          );

        }

        if (

          typeof u.wallet !==

          "number"

        ) {

          u.wallet =

            0;

        }

        if (

          u.wallet <

          1000

        ) {

          return reply(

            "❌ You need $1,000 to catch a Pokémon."

          );

        }

        // Update health first.

        const health =

          updateHealth(

            u

          );

        u.wallet -=

          1000;

        const id =

          Math.floor(

            Math.random() *

            898

          ) + 1;

        let p;

        try {

          p =

            await fetchJson(

              `${config.apis.pokeapi}/pokemon/${id}`

            );

        } catch (

          error

        ) {

          u.wallet +=

            1000;

          db.save();

          console.error(

            "Pokémon API error:",

            error

          );

          return reply(

            "❌ Pokémon API is temporarily unavailable. Your $1,000 was returned."

          );

        }

        const mon =

          createPokemon(

            p

          );

        u.pokemon =

          Array.isArray(

            u.pokemon

          )

            ? u.pokemon

            : [];

        u.pokemon.push(

          mon

        );

        db.save();

        // Health notifications.

        if (

          health.warnings.length ||

          health.dead.length

        ) {

          await sendHealthWarnings(

            sock,

            jid,

            u,

            health.warnings,

            health.dead

          );

        }

        // Send Pokémon image.

        try {

          const img =

            await fetchBuffer(

              mon.sprite

            );

          return await sock.sendMessage(

            jid,

            {

              image:

                img,

              caption:

`╭────────────────────╮

       ✨ *CAUGHT!*

╰────────────────────╯

${tierEmoji(mon.tier)} *${prettyName(mon.name)}*

🎖️ Tier: *${mon.tier}*

⭐ Level: *${mon.level}*

⚔️ ATK: *${mon.attack}*

🛡️ DEF: *${mon.defense}*

⚡ Energy: *${mon.energy}*

❤️ HP: *${mon.hp}/${mon.maxHp}*

💰 Value: *$${money(mon.value)}*

📌 Added to deck.

Use *.pinfo 1* to view a Pokémon.`

            },

            {

              quoted:

                msg

            }

          );

        } catch {

          return reply(

`╭────────────────────╮

       ✨ *CAUGHT!*

╰────────────────────╯

${tierEmoji(mon.tier)} *${prettyName(mon.name)}*

🎖️ Tier: *${mon.tier}*

⚔️ ATK: *${mon.attack}*

🛡️ DEF: *${mon.defense}*

⚡ Energy: *${mon.energy}*

❤️ HP: *${mon.hp}/${mon.maxHp}*

💰 Value: *$${money(mon.value)}*`

          );

        }

      }

  },

  // ========================================

  // PDECK

  // ========================================

  {

    name:

      "pdeck",

    aliases:

      [

        "pokedex"

      ],

    run:

      async ({

        db,

        sender,

        reply,

        sock,

        jid

      }) => {

        const u =

          db.user(

            sender

          );

        if (

          !Array.isArray(

            u.pokemon

          ) ||

          !u.pokemon.length

        ) {

          return reply(

            "🐉 *YOUR DECK*\n\nYour collection is empty.\nUse *.pcatch* to catch one."

          );

        }

        const health =

          updateHealth(

            u

          );

        db.save();

        if (

          health.warnings.length ||

          health.dead.length

        ) {

          await sendHealthWarnings(

            sock,

            jid,

            u,

            health.warnings,

            health.dead

          );

        }

        if (

          !u.pokemon.length

        ) {

          return reply(

            "💔 All your Pokémon have reached 0 HP and left your collection."

          );

        }

        let text =

`╭────────────────────╮

       🐉 *YOUR DECK*

╰────────────────────╯

`;

        u.pokemon.forEach(

          (

            m,

            index

          ) => {

            migratePokemon(

              m

            );

            text +=

`${index + 1}. ${tierEmoji(m.tier)} *${prettyName(m.name)}*

   Lv.${m.level} • ❤️ ${m.hp}/${m.maxHp} • $${money(m.value)}

   ⚔️ ${m.attack}  🛡️ ${m.defense}  ⚡ ${m.energy}

`;

          }

        );

        text +=

`━━━━━━━━━━━━━━━━━━

🔎 *.pinfo <number>*

💰 *.psell <number>*`;

        return reply(

          text

        );

      }

  },

  // ========================================

  // PINFO

  // ========================================

  {

    name:

      "pinfo",

    aliases:

      [

        "pokemoninfo",

        "pi"

      ],

    run:

      async ({

        db,

        sender,

        reply,

        args,

        sock,

        jid,

        msg

      }) => {

        const u =

          db.user(

            sender

          );

        if (

          !Array.isArray(

            u.pokemon

          ) ||

          !u.pokemon.length

        ) {

          return reply(

            "❌ Your Pokémon deck is empty."

          );

        }

        const health =

          updateHealth(

            u

          );

        db.save();

        if (

          health.warnings.length ||

          health.dead.length

        ) {

          await sendHealthWarnings(

            sock,

            jid,

            u,

            health.warnings,

            health.dead

          );

        }

        const number =

          parseInt(

            args[0],

            10

          );

        if (

          !Number.isInteger(

            number

          ) ||

          number < 1 ||

          number > u.pokemon.length

        ) {

          return reply(

`❌ Invalid Pokémon number.

Use:

*.pinfo 1*

Your deck has *${u.pokemon.length}* Pokémon.`

          );

        }

        const m =

          u.pokemon[

            number - 1

          ];

        migratePokemon(

          m

        );

        let image;

        try {

          image =

            await fetchBuffer(

              m.sprite

            );

        } catch {

          image =

            null;

        }

        const caption =

`╭────────────────────╮

       🐉 *POKÉMON CARD*

╰────────────────────╯

${tierEmoji(m.tier)} *${prettyName(m.name)}*

🎖️ *${m.tier} TIER*

⭐ Level ${m.level}

━━━━━━━━━━━━━━━━━━

⚔️ Attack

*${m.attack}*

🛡️ Defence

*${m.defense}*

⚡ Energy

*${m.energy}*

❤️ Health

*${m.hp}/${m.maxHp}*

━━━━━━━━━━━━━━━━━━

💰 Value

*$${money(m.value)}*

📌 Deck #${number}`;

        if (

          image

        ) {

          return await sock.sendMessage(

            jid,

            {

              image,

              caption

            },

            {

              quoted:

                msg

            }

          );

        }

        return reply(

          caption

        );

      }

  },

  // ========================================

  // PSELL

  // ========================================

  {

    name:

      "psell",

    aliases:

      [

        "ps"

      ],

    run:

      async ({

        db,

        sender,

        reply,

        args,

        sock,

        jid

      }) => {

        const u =

          db.user(

            sender

          );

        if (

          !Array.isArray(

            u.pokemon

          ) ||

          !u.pokemon.length

        ) {

          return reply(

            "❌ Your Pokémon deck is empty."

          );

        }

        const health =

          updateHealth(

            u

          );

        if (

          health.dead.length

        ) {

          await sendHealthWarnings(

            sock,

            jid,

            u,

            health.warnings,

            health.dead

          );

        }

        if (

          !args[0]

        ) {

          return reply(

`❌ Choose a Pokémon number.

Example:

*.psell 1*`

          );

        }

        const number =

          parseInt(

            args[0],

            10

          );

        if (

          !Number.isInteger(

            number

          ) ||

          number < 1 ||

          number > u.pokemon.length

        ) {

          return reply(

            `❌ Pokémon #${args[0]} doesn't exist in your deck.`

          );

        }

        const index =

          number - 1;

        const m =

          u.pokemon[

            index

          ];

        migratePokemon(

          m

        );

        const value =

          Math.max(

            0,

            Number(

              m.value || 0

            )

          );

        u.pokemon.splice(

          index,

          1

        );

        u.wallet =

          (

            Number(

              u.wallet

            ) || 0

          ) + value;

        db.save();

        return reply(

`╭────────────────────╮

       💰 *POKÉMON SOLD*

╰────────────────────╯

${tierEmoji(m.tier)} *${prettyName(m.name)}*

🎖️ Tier: ${m.tier}

❤️ HP: ${m.hp}/${m.maxHp}

💵 Received:

*$${money(value)}*

📦 Removed from deck.`

        );

      }

  },

  // ========================================

  // PSHOP

  // ========================================

  {

    name:

      "pshop",

    aliases:

      [

        "pokemonshop"

      ],

    run:

      async ({

        reply

      }) => {

        return reply(

`╭────────────────────╮

       🏪 *POKÉ SHOP*

╰────────────────────╯

${PSHOP.map(

  item =>

`• ${item.name}

  ${item.description}

  $${money(item.price)}

  Buy: *.pbuy ${item.id}*`

).join("\n\n")}`

        );

      }

  },

  // ========================================

  // PBUY

  // ========================================

  {

    name:

      "pbuy",

    aliases:

      [

        "pokemonbuy"

      ],

    run:

      async ({

        db,

        sender,

        reply,

        args

      }) => {

        const u =

          db.user(

            sender

          );

        const item =

          PSHOP.find(

            i =>

              i.id ===

              String(

                args[0] ||

                ""

              )

                .toLowerCase()

          );

        if (

          !item

        ) {

          return reply(

`❌ Item not found.

Use *.pshop* to see the shop.`

          );

        }

        if (

          (

            Number(

              u.wallet

            ) || 0

          ) <

          item.price

        ) {

          return reply(

`❌ Not enough money.

You need:

*$${money(item.price)}*`

          );

        }

        u.wallet -=

          item.price;

        if (

          !u.inv

        ) {

          u.inv = {};

        }

        u.inv[item.id] =

          (

            Number(

              u.inv[item.id]

            ) || 0

          ) + 1;

        db.save();

        return reply(

`╭────────────────────╮

       ✅ *PURCHASED*

╰────────────────────╯

${item.name}

💵 Paid:

*$${money(item.price)}*

📦 Quantity:

*${u.inv[item.id]}*`

        );

      }

  }

];