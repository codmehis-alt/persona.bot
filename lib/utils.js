const axios = require("axios");

const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const config = require("../config");

// ==========================================

// FETCH JSON

// ==========================================

async function fetchJson(url, opts = {}) {

  const res = await axios.get(

    url,

    {

      timeout: 15000,

      ...opts

    }

  );

  return res.data;

}

// ==========================================

// FETCH BUFFER

// ==========================================

async function fetchBuffer(url) {

  const res = await axios.get(

    url,

    {

      responseType: "arraybuffer",

      timeout: 20000

    }

  );

  return Buffer.from(

    res.data

  );

}

// ==========================================

// STICKER

// ==========================================

async function toSticker(

  buffer,

  packText = ""

) {

  const sticker =

    new Sticker(

      buffer,

      {

        pack:

          packText ||

          config.botName,

        author:

          config.creator,

        type:

          StickerTypes.FULL,

        quality:

          60

      }

    );

  return sticker.toBuffer();

}

// ==========================================

// FORMAT NUMBER

// ==========================================

const fmt = (n) =>

  Number(n)

    .toLocaleString("en-US");

// ==========================================

// RANDOM ITEM

// ==========================================

const pickRandom = (arr) =>

  arr[

    Math.floor(

      Math.random() *

      arr.length

    )

  ];

// ==========================================

// AI

// ==========================================

async function askAI(

  personaStyle,

  history = [],

  message = ""

) {

  try {

    const ai =

      config.apis?.ai;

    if (

      !ai

    ) {

      throw new Error(

        "AI configuration is missing in config.js"

      );

    }

    const key =

      String(

        ai.key || ""

      ).trim();

    const url =

      String(

        ai.url || ""

      ).trim();

    const model =

      ai.model ||

      "llama-3.3-70b-versatile";

    if (

      !key

    ) {

      throw new Error(

        "AI API key is missing"

      );

    }

    if (

      !url

    ) {

      throw new Error(

        "AI API URL is missing"

      );

    }

    // ======================================

    // HISTORY

    // ======================================

    let cleanHistory = [];

    if (

      Array.isArray(history)

    ) {

      cleanHistory =

        history

          .filter(

            item =>

              typeof item ===

              "string"

          )

          .slice(-20);

    }

    const historyText =

      cleanHistory.length

        ? cleanHistory.join("\n")

        : "No recent conversation.";

    // ======================================

    // SYSTEM PROMPT

    // ======================================

    const systemPrompt = `

You are ${config.botName || "Persona"}.

You are an anime-character persona used inside a WhatsApp group.

PERSONALITY:

${personaStyle || "Be friendly, helpful and natural."}

GENERAL RULES:

- Stay in character.

- Be natural and conversational.

- Give useful and informative answers.

- Do not describe yourself as a generic AI assistant.

- Do not randomly start conversations.

- Only generate a response when the handler has specifically decided that you should respond.

- Keep replies suitable for a WhatsApp group.

- Do not invent WhatsApp usernames.

- If the character's background, personality, abilities or story is asked about, provide useful information rather than giving an extremely short answer.

- Never claim to literally be a real-world person.

The handler may provide real @user handles in the prompt.

Only use handles that are explicitly provided.

`;

    // ======================================

    // USER PROMPT

    // ======================================

    const userPrompt = `

RECENT GROUP CHAT:

${historyText}

CURRENT MESSAGE:

${String(message || "")}

Respond naturally in character.

`;

    // ======================================

    // GROQ / OPENAI COMPATIBLE REQUEST

    // ======================================

    const response =

      await axios.post(

        url,

        {

          model,

          messages: [

            {

              role:

                "system",

              content:

                systemPrompt

            },

            {

              role:

                "user",

              content:

                userPrompt

            }

          ],

          temperature:

            0.85,

          max_tokens:

            500,

          top_p:

            0.95

        },

        {

          headers: {

            "Authorization":

              `Bearer ${key}`,

            "Content-Type":

              "application/json"

          },

          timeout:

            30000

        }

      );

    // ======================================

    // READ GROQ RESPONSE

    // ======================================

    const content =

      response

        ?.data

        ?.choices?.[0]

        ?.message

        ?.content;

    if (

      typeof content !==

      "string"

    ) {

      console.error(

        "❌ AI returned no message:",

        JSON.stringify(

          response?.data

        )

      );

      return "";

    }

    return content.trim();

  } catch (error) {

    // ======================================

    // SAFE AI ERROR

    // ======================================

    console.error(

      "❌ AI request failed:"

    );

    if (

      error.response

        ?.data

    ) {

      console.error(

        JSON.stringify(

          error.response.data,

          null,

          2

        )

      );

    } else {

      console.error(

        error.message ||

        error

      );

    }

    // IMPORTANT:

    // Never crash the WhatsApp bot

    // because the AI API failed.

    return "";

  }

}

// ==========================================

// EXPORTS

// ==========================================

module.exports = {

  fetchJson,

  fetchBuffer,

  toSticker,

  fmt,

  pickRandom,

  askAI

};