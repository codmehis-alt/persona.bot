const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const readline = require("readline");
const axios = require("axios");

const config = require("./config");
const { handleMessage } = require("./handler");

// ==========================================
// SETTINGS
// ==========================================

const SESSION_PATH = "./session";

let reconnecting = false;
let socketStarting = false;
let pairingRequested = false;

// ==========================================
// ASK FOR PHONE NUMBER
// ==========================================

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

// ==========================================
// API HEALTH CHECK
// IMPORTANT:
// API FAILURE WILL NEVER STOP THE BOT
// ==========================================

async function checkApis() {
  console.log("\n🔎 Checking external APIs...\n");

  const checks = [];

  // ------------------------------------------
  // AniList
  // ------------------------------------------

  if (config.apis?.anilist) {
    checks.push({
      name: "AniList",
      type: "graphql",
      url: config.apis.anilist
    });
  }

  // ------------------------------------------
  // PokeAPI
  // ------------------------------------------

  if (config.apis?.pokeapi) {
    checks.push({
      name: "PokeAPI",
      type: "get",
      url: `${config.apis.pokeapi}/pokemon/1`
    });
  }

  // ------------------------------------------
  // Waifu.pics
  // ------------------------------------------

  if (config.apis?.waifupics) {
    checks.push({
      name: "waifu.pics",
      type: "get",
      url: `${config.apis.waifupics}/sfw/waifu`
    });
  }

  // ------------------------------------------
  // Meme API
  // ------------------------------------------

  if (config.apis?.meme) {
    checks.push({
      name: "Meme API",
      type: "get",
      url: config.apis.meme
    });
  }

  // ------------------------------------------
  // Joke API
  // ------------------------------------------

  if (config.apis?.joke) {
    checks.push({
      name: "Joke API",
      type: "get",
      url: config.apis.joke
    });
  }

  // ------------------------------------------
  // Run checks
  // ------------------------------------------

  for (const api of checks) {
    try {
      if (api.type === "graphql") {
        const response = await axios.post(
          api.url,
          {
            query: `
              query {
                Media(
                  type: ANIME
                  search: "Naruto"
                ) {
                  id
                  title {
                    romaji
                  }
                }
              }
            `
          },
          {
            timeout: 8000,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            }
          }
        );

        if (
          response.status >= 200 &&
          response.status < 300 &&
          response.data
        ) {
          console.log(`✅ ${api.name} OK`);
        } else {
          console.log(`⚠️ ${api.name} unavailable`);
        }
      } else {
        const response = await axios.get(api.url, {
          timeout: 8000,
          validateStatus: () => true
        });

        if (
          response.status >= 200 &&
          response.status < 400
        ) {
          console.log(`✅ ${api.name} OK`);
        } else {
          console.log(
            `⚠️ ${api.name} returned HTTP ${response.status} — bot will continue`
          );
        }
      }
    } catch (error) {
      console.log(
        `⚠️ ${api.name} unavailable — bot will continue normally`
      );
    }
  }

  // ------------------------------------------
  // Groq API key check
  // ------------------------------------------

  const aiKey = config.apis?.ai?.key;

  if (
    !aiKey ||
    aiKey.includes("PASTE_") ||
    aiKey.includes("YOUR_")
  ) {
    console.log(
      "⚠️ Groq API key is not configured — AI commands will be disabled."
    );
  } else {
    console.log("✅ Groq API key found");
  }

  console.log(
    "\n✅ API check complete. External API problems will NOT stop deployment.\n"
  );
}

// ==========================================
// GET BAILEYS VERSION
// If version lookup fails, use library default
// ==========================================

async function getWhatsAppVersion() {
  try {
    const result = await fetchLatestBaileysVersion();

    if (result?.version) {
      console.log(
        `📱 WhatsApp Web version: ${result.version.join(".")}`
      );

      return result.version;
    }
  } catch (error) {
    console.log(
      "⚠️ Could not fetch latest WhatsApp version. Using Baileys default."
    );
  }

  return null;
}

// ==========================================
// GET PAIRING NUMBER
// ==========================================

async function getPairingNumber() {
  // Preferred config option
  if (config.pairingNumber) {
    return String(config.pairingNumber).replace(/\D/g, "");
  }

  // Optional fallback
  if (config.phoneNumber) {
    return String(config.phoneNumber).replace(/\D/g, "");
  }

  // Ask in console
  const number = await ask(
    "2349137983511"
  );

  return number.replace(/\D/g, "");
}

// ==========================================
// START WHATSAPP
// ==========================================

async function start() {
  if (socketStarting) {
    return;
  }

  socketStarting = true;
  pairingRequested = false;

  try {
    console.log("\n🚀 Starting WhatsApp connection...\n");

    // ----------------------------------------
    // API checks NEVER stop deployment
    // ----------------------------------------

    await checkApis();

    // ----------------------------------------
    // Authentication
    // ----------------------------------------

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(SESSION_PATH);

    // ----------------------------------------
    // WhatsApp version
    // ----------------------------------------

    const version = await getWhatsAppVersion();

    // ----------------------------------------
    // Socket options
    // ----------------------------------------

    const socketOptions = {
      auth: state,

      logger: pino({
        level: "silent"
      }),

      printQRInTerminal: false,

      browser: [
        "Ubuntu",
        "Chrome",
        "120.0.0"
      ],

      markOnlineOnConnect: false,

      syncFullHistory: false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 60000,

      keepAliveIntervalMs: 25000
    };

    // Only add version if successfully obtained
    if (version) {
      socketOptions.version = version;
    }

    const sock = makeWASocket(socketOptions);

    // ----------------------------------------
    // Save authentication credentials
    // ----------------------------------------

    sock.ev.on("creds.update", saveCreds);

    // ----------------------------------------
    // Pairing code
    // ----------------------------------------

    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        if (pairingRequested) {
          return;
        }

        pairingRequested = true;

        try {
          const number = await getPairingNumber();

          if (!number) {
            console.log(
              "❌ No phone number supplied. Restart the bot to try again."
            );

            pairingRequested = false;
            return;
          }

          if (number.length < 10) {
            console.log(
              "❌ Invalid phone number. Include the country code without +."
            );

            pairingRequested = false;
            return;
          }

          console.log(
            "\n🔗 Requesting WhatsApp pairing code..."
          );

          const code =
            await sock.requestPairingCode(number);

          console.log(
            "\n========================================"
          );

          console.log(
            `🔑 WHATSAPP PAIRING CODE: ${code}`
          );

          console.log(
            "========================================"
          );

          console.log(
            "\nOn your phone:"
          );

          console.log(
            "WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number"
          );

          console.log(
            "Enter the code shown above.\n"
          );

        } catch (error) {
          console.error(
            "❌ Pairing code error:",
            error?.message || error
          );

          pairingRequested = false;

          console.log(
            "⚠️ The bot will remain running. Restart and try pairing again if needed."
          );
        }
      }, 2500);
    }

    // ----------------------------------------
    // CONNECTION UPDATE
    // ----------------------------------------

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

        // --------------------------------------
        // Connected
        // --------------------------------------

        if (connection === "open") {
          console.log(
            `\n✨ ${config.botName} is ONLINE!`
          );

          console.log(
            "📡 WhatsApp connection established."
          );

          reconnecting = false;
          socketStarting = false;
          pairingRequested = true;
        }

        // --------------------------------------
        // Closed
        // --------------------------------------

        if (connection === "close") {
          socketStarting = false;

          const reason =
            lastDisconnect?.error?.output?.statusCode;

          console.log(
            `\n⚠️ WhatsApp connection closed. Reason: ${reason || "unknown"}`
          );

          // Logged out
          if (
            reason === DisconnectReason.loggedOut
          ) {
            console.log(
              "\n🚪 WhatsApp logged out."
            );

            console.log(
              "Delete the ./session folder and restart the bot to pair again.\n"
            );

            return;
          }

          // Don't start multiple reconnect loops
          if (reconnecting) {
            return;
          }

          reconnecting = true;

          console.log(
            "🔄 Reconnecting in 5 seconds..."
          );

          setTimeout(() => {
            reconnecting = false;
            start().catch((error) => {
              console.error(
                "❌ Reconnection error:",
                error?.message || error
              );

              socketStarting = false;
            });
          }, 5000);
        }
      }
    );

    // ----------------------------------------
    // MESSAGE HANDLER
    // ----------------------------------------

    sock.ev.on(
      "messages.upsert",
      async ({ messages, type }) => {
        if (type !== "notify") {
          return;
        }

        for (const msg of messages) {
          try {
            if (!msg?.message) {
              continue;
            }

            await handleMessage(
              sock,
              msg
            );

          } catch (error) {
            console.error(
              "❌ Handler error:",
              error?.message || error
            );
          }
        }
      }
    );

  } catch (error) {
    socketStarting = false;

    console.error(
      "\n❌ Startup error:",
      error?.message || error
    );

    // ----------------------------------------
    // NEVER kill deployment because of an API
    // or temporary connection error
    // ----------------------------------------

    if (!reconnecting) {
      reconnecting = true;

      console.log(
        "🔄 Retrying WhatsApp connection in 10 seconds..."
      );

      setTimeout(() => {
        reconnecting = false;

        start().catch((err) => {
          console.error(
            "❌ Retry failed:",
            err?.message || err
          );

          socketStarting = false;
        });
      }, 10000);
    }
  }
}

// ==========================================
// GLOBAL ERROR PROTECTION
// ==========================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "⚠️ Unhandled promise rejection:",
      error?.message || error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "⚠️ Uncaught exception:",
      error?.message || error
    );
  }
);

// ==========================================
// START
// ==========================================

start().catch((error) => {
  console.error(
    "❌ Fatal startup error:",
    error?.message || error
  );
});