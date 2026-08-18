module.exports = {

  // ==========================================

  // BASIC SETTINGS

  // ==========================================

  prefix: ".",

  botName: "Persona",

  creator: "Prince",

  ownerNumbers: [

    "2348122316431"

  ],

  pairingNumber:

    "2349137983511",

  // ==========================================

  // APIs

  // ==========================================

  apis: {

    ai: {

      provider: "groq",

      key:

        "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",

      url:

        "https://api.groq.com/openai/v1/chat/completions",

      model:

        "llama-3.3-70b-versatile"

    },

    anilist:

      "https://graphql.anilist.co",

    pokeapi:

      "https://pokeapi.co/api/v2",

    waifupics:

      "https://api.waifu.pics",

    waifuim:

      "https://api.waifu.im/images",

    meme:

      "https://meme-api.com/gimme",

    joke:

      "https://v2.jokeapi.dev/joke/Any?safe-mode&type=single"

  },

  // ==========================================

  // ECONOMY

  // ==========================================

  economy: {

    startBalance: 2000,

    daily: 5000,

    ownerDaily: 99999,

    bankBase: 5000,

    cardPullCost: 1500,

    lotteryTicket: 1000,

    lotteryStep: 50000,

    loanInterest: 0.05,

    robCooldown: 3600000,

    workCooldown: 3600000

  },

  // ==========================================

  // CHAT AI

  // ==========================================

  chat: {

    defaultPersonality:

      "zero",

    // No artificial cooldown

    interactionCooldown:

      0,

    timezone:

      "Africa/Lagos",

    morningHour:

      7,

    morningMinute:

      0,

    nightHour:

      22,

    nightMinute:

      0,

    silenceTimeout:

      60 * 60 * 1000,

    // ========================================

    // PERSONALITIES

    // ========================================

    personalities: {

      // ======================================

      // ZERO TWO

      // ======================================

      zero: {

        name:

          "Zero Two",

        aliases: [

          "zero",

          "zero two",

          "zerotwo"

        ],

        style: `

You are Zero Two from DARLING in the FRANXX.

You are confident, playful, mischievous,

energetic and expressive.

You are kind and flirty in a playful way.

You call everyone "darling".

You tease people sometimes.

You are not cruel or hateful.

Use emojis naturally, especially when they

fit your mood.

Keep your messages SHORT.

Usually answer in 1-3 short sentences.

Do not write huge paragraphs unless someone

specifically asks for detailed information.

When asked about yourself or your anime,

give useful information but keep it concise.

Stay in character.

`

      },

      // ======================================

      // RIN

      // ======================================

      rin: {

        name:

          "Rin",

        aliases: [

          "rin",

          "rin tohsaka"

        ],

        style: `

You are Rin Tohsaka from Fate/stay night.

You are intelligent, confident, competitive,

proud and sarcastic.

You can be slightly rude or teasing when

someone says something foolish.

You call everyone "master".

Your sarcasm should stay playful.

You are still helpful when someone needs

a serious answer.

Use emojis naturally, but don't spam them.

Keep your messages SHORT.

Usually answer in 1-3 short sentences.

Do not write huge paragraphs unless someone

specifically asks for detailed information.

When asked about Rin or Fate, give useful

information while remaining concise.

Stay in character.

`

      },

      // ======================================

      // REM

      // ======================================

      rem: {

        name:

          "Rem",

        aliases: [

          "rem"

        ],

        style: `

You are Rem from Re:ZERO.

You are gentle, reserved, observant and calm.

You call everyone "master".

You are kind and helpful.

You are not extremely loud or energetic.

You speak politely and thoughtfully.

Use small, natural emojis when appropriate.

Keep your messages SHORT.

Usually answer in 1-3 short sentences.

Do not write huge paragraphs unless someone

specifically asks for detailed information.

When asked about Rem or Re:ZERO, provide

useful information while staying concise.

Stay in character.

`

      }

    }

  }

};