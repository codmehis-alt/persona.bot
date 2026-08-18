const { fetchBuffer, fmt } = require("../lib/utils");

// ==========================================

// CARD TIER SYSTEM

// ==========================================

function tierOf(favs) {

  if (favs > 20000) {

    return ["SS", 15000];

  }

  if (favs > 5000) {

    return ["S", 8000];

  }

  if (favs > 1000) {

    return ["A", 4000];

  }

  if (favs > 200) {

    return ["B", 2000];

  }

  return ["C", 800];

}

// ==========================================

// MONEY

// ==========================================

function money(value) {

  return `$${fmt(

    Number(value) || 0

  )}`;

}

// ==========================================

// PROFILE NAME

// ==========================================

function getProfileName(db, jid) {

  try {

    const u =

      db.user(jid);

    return (

      u.profileName ||

      u.name ||

      `@${String(jid).split("@")[0]}`

    );

  } catch {

    return `@${String(jid).split("@")[0]}`;

  }

}

// ==========================================

// CARD MARKET

// ==========================================

function getMarket(db) {

  if (

    typeof db.cardMarket === "function"

  ) {

    return db.cardMarket();

  }

  if (

    db.data &&

    Array.isArray(db.data.cardMarket)

  ) {

    return db.data.cardMarket;

  }

  if (db.data) {

    db.data.cardMarket = [];

    return db.data.cardMarket;

  }

  return [];

}

// ==========================================

// RANDOM ANIME CHARACTER

// ==========================================

async function getRandomAnimeCharacter(apiUrl) {

  const query = `

    query {

      Page(page: 1, perPage: 50) {

        media(

          type: ANIME

          sort: POPULARITY_DESC

        ) {

          id

          title {

            romaji

            english

            native

          }

          characters(

            page: 1

            perPage: 25

            sort: ROLE

          ) {

            nodes {

              id

              name {

                full

              }

              favourites

              image {

                large

                medium

              }

            }

          }

        }

      }

    }

  `;

  if (!apiUrl) {

    console.error(

      "AniList API URL is missing."

    );

    return null;

  }

  for (

    let attempt = 1;

    attempt <= 3;

    attempt++

  ) {

    try {

      const response =

        await fetch(

          apiUrl,

          {

            method: "POST",

            headers: {

              "Content-Type":

                "application/json",

              "Accept":

                "application/json",

              "User-Agent":

                "PersonaBot/1.0"

            },

            body:

              JSON.stringify({

                query

              })

          }

        );

      const text =

        await response.text();

      let result;

      try {

        result =

          JSON.parse(text);

      } catch {

        throw new Error(

          `AniList returned invalid JSON (${response.status})`

        );

      }

      if (!response.ok) {

        throw new Error(

          result?.errors?.[0]?.message ||

          `HTTP ${response.status}`

        );

      }

      if (

        result?.errors?.length

      ) {

        throw new Error(

          result.errors[0]?.message ||

          "AniList GraphQL error"

        );

      }

      const animeList =

        result?.data?.Page?.media ||

        [];

      if (!animeList.length) {

        throw new Error(

          "AniList returned no anime"

        );

      }

      const shuffled =

        [...animeList].sort(

          () =>

            Math.random() - 0.5

        );

      for (

        const anime of shuffled

      ) {

        const characters =

          anime?.characters?.nodes?.filter(

            character =>

              character?.name?.full &&

              (

                character?.image?.large ||

                character?.image?.medium

              )

          ) || [];

        if (!characters.length) {

          continue;

        }

        const character =

          characters[

            Math.floor(

              Math.random() *

              characters.length

            )

          ];

        return {

          anime,

          character

        };

      }

      throw new Error(

        "No usable characters found"

      );

    } catch (error) {

      console.error(

        `AniList attempt ${attempt}/3:`,

        error?.message || error

      );

      if (

        attempt < 3

      ) {

        await new Promise(

          resolve =>

            setTimeout(

              resolve,

              1500 * attempt

            )

        );

      }

    }

  }

  return null;

}

// ==========================================

// CARD STATS

// ==========================================

function getCardStats(tier, seed = "") {

  const ranges = {

    SS: {

      min: 92,

      max: 100

    },

    S: {

      min: 82,

      max: 96

    },

    A: {

      min: 72,

      max: 88

    },

    B: {

      min: 60,

      max: 78

    },

    C: {

      min: 45,

      max: 65

    }

  };

  const baseTier =

    String(tier || "C")

      .replace("+", "");

  const range =

    ranges[baseTier] ||

    ranges.C;

  let hash = 0;

  const text =

    String(seed || Math.random());

  for (

    let i = 0;

    i < text.length;

    i++

  ) {

    hash =

      (

        hash * 31 +

        text.charCodeAt(i)

      ) >>> 0;

  }

  const span =

    range.max -

    range.min +

    1;

  // ATK and DEF are generated

  // separately so they can differ.

  const attack =

    range.min +

    (

      hash % span

    );

  const defense =

    range.min +

    (

      Math.floor(

        hash / 97

      ) % span

    );

  return {

    attack,

    defense

  };

}

// ==========================================

// UNIQUE CARD VALUE

// ==========================================

function getCardValue(

  tier,

  favourites,

  seed = ""

) {

  const ranges = {

    SS: [

      15000,

      30000

    ],

    S: [

      8000,

      15000

    ],

    A: [

      4000,

      8000

    ],

    B: [

      2000,

      4500

    ],

    C: [

      500,

      1800

    ]

  };

  const baseTier =

    String(tier || "C")

      .replace("+", "");

  const range =

    ranges[baseTier] ||

    ranges.C;

  let hash = 0;

  const text =

    `${seed}:${favourites}`;

  for (

    let i = 0;

    i < text.length;

    i++

  ) {

    hash =

      (

        hash * 31 +

        text.charCodeAt(i)

      ) >>> 0;

  }

  return (

    range[0] +

    (

      hash %

      (

        range[1] -

        range[0] +

        1

      )

    )

  );

}

// ==========================================

// NORMALIZE CARD

// ==========================================

function normalizeCard(card) {

  if (

    !card ||

    typeof card !== "object"

  ) {

    return card;

  }

  const seed =

    card.id ||

    card.characterId ||

    card.name ||

    Date.now();

  const stats =

    getCardStats(

      card.tier,

      seed

    );

  if (

    !Number.isFinite(

      Number(card.attack)

    ) ||

    !Number.isFinite(

      Number(card.defense)

    )

  ) {

    card.attack =

      stats.attack;

    card.defense =

      stats.defense;

  }

  if (

    !Number.isFinite(

      Number(card.value)

    ) ||

    Number(card.value) <= 0

  ) {

    card.value =

      getCardValue(

        card.tier,

        card.favourites,

        seed

      );

  }

  // Keep compatibility with old cards

  // that may have used "image" instead of "img".

  if (

    !card.img &&

    card.image

  ) {

    card.img =

      card.image;

  }

  return card;

}

// ==========================================

// STAR DISPLAY

// ==========================================

function getStars(tier) {

  const baseTier =

    String(tier || "C")

      .replace("+", "");

  if (

    baseTier === "SS"

  ) {

    return "★★★★★";

  }

  if (

    baseTier === "S"

  ) {

    return "★★★★☆";

  }

  if (

    baseTier === "A"

  ) {

    return "★★★☆☆";

  }

  if (

    baseTier === "B"

  ) {

    return "★★☆☆☆";

  }

  return "★☆☆☆☆";

}

// ==========================================

// MARKET CARD UI

// ==========================================

function marketCard(

  item,

  number,

  db

) {

  const card =

    item.card || {};

  normalizeCard(card);

  const seller =

    getProfileName(

      db,

      item.seller

    );

  return (

    `╭─ 🛒 *#${number} ${card.name || "Unknown"}*\n` +

    `│ 📺 ${card.series || "Unknown Anime"}\n` +

    `│ 🏅 ${card.tier || "C"}\n` +

    `│ ⚔️ ${card.attack || 0}  🛡️ ${card.defense || 0}\n` +

    `│ 💵 ${money(item.price)}\n` +

    `│ 👤 ${seller}\n` +

    `╰──────────────`

  );

}

// ==========================================

// COMMANDS

// ==========================================

module.exports = [

  // ========================================

  // CARD PULL

  // ========================================

  {

    name: "cardpull",

    aliases: [

      "cp",

      "pullcard"

    ],

    run: async ({

      db,

      sender,

      reply,

      sock,

      jid,

      msg,

      args,

      config

    }) => {

      const u =

        db.user(sender);

      if (

        !u.registered

      ) {

        return reply(

          "❌ Register first with *.reg*"

        );

      }

      const count =

        Math.min(

          Math.max(

            parseInt(

              args[0],

              10

            ) || 1,

            1

          ),

          5

        );

      const pullCost =

        Number(

          config?.economy?.cardPullCost

        ) || 1000;

      const cost =

        pullCost * count;

      if (

        u.wallet < cost

      ) {

        return reply(

          `╭──────────────╮\n` +

          `    🎴 *CARD PULL*\n` +

          `╰──────────────╯\n\n` +

          `❌ Not enough money.\n` +

          `🎟️ Pulls: *${count}*\n` +

          `💵 Cost: *${money(cost)}*\n` +

          `👛 Wallet: *${money(u.wallet)}*`

        );

      }

      u.wallet -= cost;

      for (

        let i = 0;

        i < count;

        i++

      ) {

        const apiUrl =

          config?.apis?.anilist ||

          "https://graphql.anilist.co";

        const result =

          await getRandomAnimeCharacter(

            apiUrl

          );

        if (!result) {

          u.wallet +=

            pullCost;

          await reply(

            `❌ AniList is temporarily unavailable.\n\n` +

            `💵 One pull refunded: *${money(pullCost)}*`

          );

          continue;

        }

        const anime =

          result.anime;

        const character =

          result.character;

        const favourites =

          Number(

            character.favourites

          ) || 0;

        const [

          tier

        ] =

          tierOf(

            favourites

          );

        // Every card gets its own seed,

        // giving it individual stats/value.

        const uniqueSeed =

          `${Date.now()}_${Math.random()

            .toString(36)

            .slice(2, 10)}`;

        const stats =

          getCardStats(

            tier,

            uniqueSeed

          );

        const value =

          getCardValue(

            tier,

            favourites,

            uniqueSeed

          );

        const card = {

          id:

            uniqueSeed,

          name:

            character.name?.full ||

            "Unknown Character",

          tier,

          value,

          attack:

            stats.attack,

          defense:

            stats.defense,

          img:

            character.image?.large ||

            character.image?.medium ||

            null,

          // Series is captured from

          // the anime at pull time.

          series:

            anime.title?.english ||

            anime.title?.romaji ||

            anime.title?.native ||

            "Unknown Anime",

          animeId:

            anime.id,

          characterId:

            character.id,

          favourites

        };

        if (

          !card.img

        ) {

          u.wallet +=

            pullCost;

          await reply(

            `❌ ${card.name} has no usable image.\n\n` +

            `💵 Pull refunded: *${money(pullCost)}*`

          );

          continue;

        }

        if (

          !Array.isArray(

            u.cards

          )

        ) {

          u.cards = [];

        }

        u.cards.push(

          card

        );

        const deckNumber =

          u.cards.length;

        try {

          const image =

            await fetchBuffer(

              card.img

            );

          await sock.sendMessage(

            jid,

            {

              image,

              caption:

                `╭──────────────╮\n` +

                `    🎴 *CARD PULL!*\n` +

                `╰──────────────╯\n\n` +

                `✨ *${card.name}*\n` +

                `📺 ${card.series}\n` +

                `🏅 ${tier}\n` +

                `⚔️ ATK: *${card.attack}*\n` +

                `🛡️ DEF: *${card.defense}*\n` +

                `💎 Value: *${money(card.value)}*\n\n` +

                `🔢 Deck: *#${deckNumber}*\n` +

                `💡 *.cinfo ${deckNumber}*`

            },

            {

              quoted: msg

            }

          );

        } catch (error) {

          console.error(

            "Card image error:",

            error?.message || error

          );

          await reply(

            `🎴 *CARD PULL!*\n\n` +

            `✨ *${card.name}*\n` +

            `📺 ${card.series}\n` +

            `🏅 ${tier}\n` +

            `⚔️ ATK: *${card.attack}*\n` +

            `🛡️ DEF: *${card.defense}*\n` +

            `💎 Value: *${money(card.value)}*\n` +

            `🔢 Deck: *#${deckNumber}*\n\n` +

            `⚠️ Image could not be loaded.`

          );

        }

        if (

          i < count - 1

        ) {

          await new Promise(

            resolve =>

              setTimeout(

                resolve,

                1500

              )

          );

        }

      }

      db.save();

    }

  },
    // ========================================

  // DECK

  // ========================================

  {

    name: "deck",

    aliases: [

      "cards",

      "mycards"

    ],

    run: ({

      db,

      sender,

      reply

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(

          u.cards

        )

      ) {

        u.cards = [];

      }

      let changed =

        false;

      for (

        const card of u.cards

      ) {

        const before =

          JSON.stringify({

            attack: card.attack,

            defense: card.defense,

            value: card.value

          });

        normalizeCard(card);

        const after =

          JSON.stringify({

            attack: card.attack,

            defense: card.defense,

            value: card.value

          });

        if (

          before !== after

        ) {

          changed = true;

        }

      }

      if (changed) {

        db.save();

      }

      if (

        !u.cards.length

      ) {

        return reply(

          `╭──────────────╮\n` +

          `    🎴 *MY DECK*\n` +

          `╰──────────────╯\n\n` +

          `📭 Your deck is empty.\n\n` +

          `Use *.cp* to pull a card.`

        );

      }

      const list =

        u.cards

          .map(

            (card, index) => {

              normalizeCard(card);

              return (

                `*#${index + 1}* ✨ ${card.name}\n` +

                `📺 ${card.series || "Unknown Series"}\n` +

                `🏅 ${card.tier}  ` +

                `⚔️ ${card.attack}  ` +

                `🛡️ ${card.defense}\n` +

                `💎 ${money(card.value)}`

              );

            }

          )

          .join("\n\n");

      return reply(

        `╭──────────────╮\n` +

        `    🎴 *MY DECK*\n` +

        `╰──────────────╯\n\n` +

        `${list}\n\n` +

        `🎴 Total: *${u.cards.length}*`

      );

    }

  },

  // ========================================

  // CARD INFO

  // ========================================

  {

    name: "cinfo",

    aliases: [

      "cardinfo"

    ],

    run: async ({

      db,

      sender,

      reply,

      args,

      sock,

      jid,

      msg

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards) ||

        !u.cards.length

      ) {

        return reply(

          `❌ You don't have any cards.`

        );

      }

      const number =

        parseInt(

          args[0],

          10

        );

      if (

        !Number.isInteger(number) ||

        number < 1 ||

        number > u.cards.length

      ) {

        return reply(

          `❌ Use the number of the card in your deck.\n\n` +

          `Example: *.cinfo 1*`

        );

      }

      const card =

        u.cards[number - 1];

      normalizeCard(card);

      db.save();

      const caption =

        `╭──────────────╮\n` +

        `    🎴 *CARD #${number}*\n` +

        `╰──────────────╯\n\n` +

        `✨ *${card.name}*\n` +

        `📺 ${card.series || "Unknown Series"}\n` +

        `🏅 ${card.tier} ${getStars(card.tier)}\n\n` +

        `⚔️ ATK: *${card.attack}*\n` +

        `🛡️ DEF: *${card.defense}*\n` +

        `💎 Value: *${money(card.value)}*`;

      const imageUrl =

        card.img ||

        card.image ||

        card.imageUrl ||

        null;

      if (!imageUrl) {

        return reply(

          `${caption}\n\n` +

          `⚠️ No image is saved for this card.`

        );

      }

      try {

        const image =

          await fetchBuffer(

            imageUrl

          );

        if (!image) {

          throw new Error(

            "Image buffer is empty"

          );

        }

        if (

          sock &&

          jid

        ) {

          return await sock.sendMessage(

            jid,

            {

              image,

              caption

            },

            {

              quoted: msg

            }

          );

        }

        return reply(

          caption

        );

      } catch (error) {

        console.error(

          "CINFO IMAGE ERROR:",

          error?.message || error

        );

        return reply(

          `${caption}\n\n` +

          `⚠️ Couldn't load the card image.`

        );

      }

    }

  },

  // ========================================

  // MY SERIES

  // ========================================

  {

    name: "myseries",

    aliases: [

      "series"

    ],

    run: ({

      db,

      sender,

      reply

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards)

      ) {

        u.cards = [];

      }

      if (

        !u.cards.length

      ) {

        return reply(

          `╭──────────────╮\n` +

          `    📺 *MY SERIES*\n` +

          `╰──────────────╯\n\n` +

          `📭 You don't have any cards.`

        );

      }

      const seriesCount =

        {};

      for (

        const card of u.cards

      ) {

        // Series is taken from the card

        // that was actually pulled.

        const series =

          card.series ||

          "Unknown Series";

        seriesCount[series] =

          (

            seriesCount[series] ||

            0

          ) + 1;

      }

      const entries =

        Object.entries(

          seriesCount

        ).sort(

          (a, b) =>

            b[1] - a[1]

        );

      const list =

        entries

          .map(

            ([series, count], index) =>

              `${index + 1}. 📺 *${series}* ×${count}`

          )

          .join("\n");

      return reply(

        `╭──────────────╮\n` +

        `    📺 *MY SERIES*\n` +

        `╰──────────────╯\n\n` +

        `${list}\n\n` +

        `🎴 Cards: *${u.cards.length}*\n` +

        `📚 Series: *${entries.length}*`

      );

    }

  },

  // ========================================

  // CARD VALUE

  // ========================================

  {

    name: "cvalue",

    aliases: [

      "cardvalue"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards) ||

        !u.cards.length

      ) {

        return reply(

          `❌ You don't have any cards.`

        );

      }

      const number =

        parseInt(

          args[0],

          10

        );

      if (

        !Number.isInteger(number) ||

        number < 1 ||

        number > u.cards.length

      ) {

        return reply(

          `❌ Example: *.cvalue 1*`

        );

      }

      const card =

        u.cards[number - 1];

      normalizeCard(card);

      db.save();

      return reply(

        `╭──────────────╮\n` +

        `     💎 *CARD VALUE*\n` +

        `╰──────────────╯\n\n` +

        `✨ *${card.name}*\n` +

        `📺 ${card.series || "Unknown Series"}\n` +

        `🏅 ${card.tier}\n` +

        `⚔️ ATK: *${card.attack}*\n` +

        `🛡️ DEF: *${card.defense}*\n` +

        `💎 Value: *${money(card.value)}*`

      );

    }

  },

  // ========================================

  // CARD RARITIES

  // ========================================

  {

    name: "crarities",

    aliases: [

      "rarities",

      "tiers"

    ],

    run: ({

      reply

    }) => {

      return reply(

        `╭──────────────╮\n` +

        `    💎 *RARITIES*\n` +

        `╰──────────────╯\n\n` +

        `⚪ C  • ⚔️ 45–65\n` +

        `🔵 B  • ⚔️ 60–78\n` +

        `🟣 A  • ⚔️ 72–88\n` +

        `🟠 S  • ⚔️ 82–96\n` +

        `🔴 SS • ⚔️ 92–100\n\n` +

        `⚔️ ATK and 🛡️ DEF are generated\n` +

        `independently for every card.\n\n` +

        `💎 Values also vary between\n` +

        `individual cards of the same tier.`

      );

    }

  },
    // ========================================

  // INSTANT SELL CARD

  // ========================================

  {

    name: "sellc",

    aliases: [

      "sellcard"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards) ||

        !u.cards.length

      ) {

        return reply(

          `❌ You don't have any cards.`

        );

      }

      const number =

        parseInt(

          args[0],

          10

        );

      if (

        !Number.isInteger(number) ||

        number < 1 ||

        number > u.cards.length

      ) {

        return reply(

          `❌ Use the card number in your deck.\n\n` +

          `Example: *.sellc 1*`

        );

      }

      const index =

        number - 1;

      const card =

        u.cards[index];

      normalizeCard(card);

      const cardValue =

        Number(card.value) || 0;

      // Instant selling always gives 20%

      // of the card's actual individual value.

      const payout =

        Math.floor(

          cardValue * 0.20

        );

      u.wallet =

        (Number(u.wallet) || 0) +

        payout;

      u.cards.splice(

        index,

        1

      );

      db.save();

      return reply(

        `╭──────────────╮\n` +

        `    💰 *CARD SOLD*\n` +

        `╰──────────────╯\n\n` +

        `✨ *${card.name}*\n` +

        `📺 ${card.series || "Unknown Series"}\n` +

        `🏅 ${card.tier}\n` +

        `⚔️ ATK: *${card.attack}*\n` +

        `🛡️ DEF: *${card.defense}*\n\n` +

        `💎 Card Value: *${money(cardValue)}*\n` +

        `💵 Instant Sell: *20%*\n` +

        `💰 Received: *${money(payout)}*\n\n` +

        `👛 Wallet: *${money(u.wallet)}*`

      );

    }

  },

  // ========================================

  // CARD MARKET

  // ========================================

  {

    name: "cmarket",

    aliases: [

      "cm"

    ],

    run: ({

      db,

      reply

    }) => {

      const market =

        getMarket(db);

      if (

        !Array.isArray(market) ||

        !market.length

      ) {

        return reply(

          `╭──────────────╮\n` +

          `    🛒 *C-MARKET*\n` +

          `╰──────────────╯\n\n` +

          `📭 No cards are currently listed.`

        );

      }

      const list =

        market

          .map(

            (item, index) =>

              marketCard(

                item,

                index + 1,

                db

              )

          )

          .join("\n\n");

      return reply(

        `╭──────────────╮\n` +

        `    🛒 *C-MARKET*\n` +

        `╰──────────────╯\n\n` +

        `${list}\n\n` +

        `💡 *.buyc <number>*`

      );

    }

  },

  // ========================================

  // LIST CARD ON MARKET

  // ========================================

  {

    name: "sellm",

    aliases: [

      "sellmarket",

      "listcard"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards) ||

        !u.cards.length

      ) {

        return reply(

          `❌ You don't have any cards.`

        );

      }

      const number =

        parseInt(

          args[0],

          10

        );

      const price =

        parseInt(

          args[1],

          10

        );

      if (

        !Number.isInteger(number) ||

        number < 1 ||

        number > u.cards.length

      ) {

        return reply(

          `❌ Use the card number from your deck.\n\n` +

          `Example: *.sellm 2 5000*`

        );

      }

      if (

        !Number.isInteger(price) ||

        price <= 0

      ) {

        return reply(

          `❌ Enter a valid market price.`

        );

      }

      const index =

        number - 1;

      const card =

        u.cards[index];

      normalizeCard(card);

      const market =

        getMarket(db);

      market.push({

        card: {

          ...card

        },

        seller:

          sender,

        price,

        listedAt:

          Date.now()

      });

      u.cards.splice(

        index,

        1

      );

      db.save();

      return reply(

        `╭──────────────╮\n` +

        `   🛒 *CARD LISTED*\n` +

        `╰──────────────╯\n\n` +

        `✨ *${card.name}*\n` +

        `📺 ${card.series || "Unknown Series"}\n` +

        `🏅 ${card.tier}\n` +

        `⚔️ ATK: *${card.attack}*\n` +

        `🛡️ DEF: *${card.defense}*\n` +

        `💰 Price: *${money(price)}*`

      );

    }

  },

  // ========================================

  // BUY CARD

  // ========================================

  {

    name: "buyc",

    aliases: [

      "buycard"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const buyer =

        db.user(sender);

      const market =

        getMarket(db);

      if (

        !Array.isArray(market) ||

        !market.length

      ) {

        return reply(

          `❌ The card market is empty.`

        );

      }

      const number =

        parseInt(

          args[0],

          10

        );

      if (

        !Number.isInteger(number) ||

        number < 1 ||

        number > market.length

      ) {

        return reply(

          `❌ Use a valid market number.\n\n` +

          `Example: *.buyc 1*`

        );

      }

      const listing =

        market[number - 1];

      const card =

        listing.card ||

        listing;

      normalizeCard(card);

      const price =

        Number(

          listing.price

        ) ||

        Number(

          card.value

        ) ||

        0;

      const wallet =

        Number(

          buyer.wallet

        ) || 0;

      if (

        wallet < price

      ) {

        return reply(

          `╭──────────────╮\n` +

          `     ❌ *NOT ENOUGH*\n` +

          `╰──────────────╯\n\n` +

          `💰 Price: *${money(price)}*\n` +

          `👛 Wallet: *${money(wallet)}*`

        );

      }

      buyer.wallet =

        wallet - price;

      if (

        !Array.isArray(

          buyer.cards

        )

      ) {

        buyer.cards = [];

      }

      delete card.price;

      buyer.cards.push(

        card

      );

      market.splice(

        number - 1,

        1

      );

      db.save();

      return reply(

        `╭──────────────╮\n` +

        `   ✅ *CARD BOUGHT*\n` +

        `╰──────────────╯\n\n` +

        `✨ *${card.name}*\n` +

        `📺 ${card.series || "Unknown Series"}\n` +

        `🏅 ${card.tier}\n` +

        `⚔️ ATK: *${card.attack}*\n` +

        `🛡️ DEF: *${card.defense}*\n\n` +

        `💵 Paid: *${money(price)}*\n` +

        `👛 Wallet: *${money(buyer.wallet)}*`

      );

    }

  },

  // ========================================

  // FUSION

  // ========================================

  {

    name: "fusion",

    aliases: [

      "fuse"

    ],

    run: ({

      db,

      sender,

      reply,

      args

    }) => {

      const u =

        db.user(sender);

      if (

        !Array.isArray(u.cards) ||

        u.cards.length < 2

      ) {

        return reply(

          `❌ You need at least 2 cards to fuse.`

        );

      }

      const first =

        parseInt(

          args[0],

          10

        );

      const second =

        parseInt(

          args[1],

          10

        );

      if (

        !Number.isInteger(first) ||

        !Number.isInteger(second) ||

        first < 1 ||

        second < 1 ||

        first > u.cards.length ||

        second > u.cards.length ||

        first === second

      ) {

        return reply(

          `❌ Usage: *.fusion <card1> <card2>*\n\n` +

          `Example: *.fusion 1 2*`

        );

      }

      const index1 =

        first - 1;

      const index2 =

        second - 1;

      const card1 =

        u.cards[index1];

      const card2 =

        u.cards[index2];

      normalizeCard(card1);

      normalizeCard(card2);

      if (

        card1.tier !== card2.tier

      ) {

        return reply(

          `❌ Both cards must have the same tier.\n\n` +

          `Card #${first}: *${card1.tier}*\n` +

          `Card #${second}: *${card2.tier}*`

        );

      }

      const order = [

        "C",

        "B",

        "A",

        "S",

        "SS"

      ];

      const currentIndex =

        order.indexOf(

          card1.tier

        );

      const newTier =

        currentIndex >= 0 &&

        currentIndex < order.length - 1

          ? order[currentIndex + 1]

          : "SS";

      const seed =

        `${card1.id || card1.name}-${card2.id || card2.name}-${Date.now()}-${Math.random()}`;

      const stats =

        getCardStats(

          newTier,

          seed

        );

      const value =

        getCardValue(

          newTier,

          (

            Number(card1.favourites) || 0

          ) +

          (

            Number(card2.favourites) || 0

          ),

          seed

        );

      const fused = {

        id:

          `fusion-${Date.now()}`,

        name:

          `${card1.name} × ${card2.name}`,

        tier:

          newTier,

        value,

        attack:

          stats.attack,

        defense:

          stats.defense,

        img:

          card1.img ||

          card1.image ||

          card2.img ||

          card2.image ||

          null,

        series:

          card1.series ||

          card2.series ||

          "Unknown Series",

        favourites:

          (

            Number(card1.favourites) || 0

          ) +

          (

            Number(card2.favourites) || 0

          ),

        fused:

          true,

        createdAt:

          Date.now()

      };

      const indexes = [

        index1,

        index2

      ].sort(

        (a, b) => b - a

      );

      for (

        const index of indexes

      ) {

        u.cards.splice(

          index,

          1

        );

      }

      u.cards.push(

        fused

      );

      db.save();

      return reply(

        `╭──────────────╮\n` +

        `      🔥 *FUSION*\n` +

        `╰──────────────╯\n\n` +

        `🃏 ${card1.name}\n` +

        `🃏 ${card2.name}\n\n` +

        `⬆️ New Tier: *${newTier}*\n` +

        `⚔️ ATK: *${fused.attack}*\n` +

        `🛡️ DEF: *${fused.defense}*\n` +

        `💎 Value: *${money(fused.value)}*\n\n` +

        `🎴 Added to your deck!`

      );

    }

  },
    // ========================================

  // CARD HELP

  // ========================================

  {

    name: "cardhelp",

    aliases: [

      "chelp"

    ],

    run: ({

      reply

    }) => {

      return reply(

        `╭──────────────╮\n` +

        `     🎴 *CARD HELP*\n` +

        `╰──────────────╯\n\n` +

        `🎴 *.cp*\n` +

        `Pull a card\n\n` +

        `📚 *.deck*\n` +

        `View your deck\n\n` +

        `🔎 *.cinfo 1*\n` +

        `View card #1 + picture\n\n` +

        `📺 *.series*\n` +

        `Show your card series\n\n` +

        `💎 *.cvalue 1*\n` +

        `View card value\n\n` +

        `💰 *.sellc 1*\n` +

        `Instant sell card #1\n` +

        `↳ Receives 20% of value\n\n` +

        `🛒 *.cmarket*\n` +

        `View card market\n\n` +

        `📋 *.sellm 1 5000*\n` +

        `List card #1 for $5,000\n\n` +

        `💵 *.buyc 1*\n` +

        `Buy market card #1\n\n` +

        `🔥 *.fusion 1 2*\n` +

        `Fuse cards #1 and #2`

      );

    }

  }

];