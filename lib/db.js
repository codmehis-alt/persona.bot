const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "database.json"
);

// ==========================================
// DATABASE
// ==========================================

let data = {
  users: {},
  groups: {},
  cards: {},
  pokemon: {},

  // Card lottery
  lottery: [],

  // Card marketplace
  cardMarket: [],

  msgCount: {}
};

// ==========================================
// LOAD DATABASE
// ==========================================

if (fs.existsSync(FILE)) {

  try {

    const saved =
      JSON.parse(
        fs.readFileSync(
          FILE,
          "utf8"
        )
      );

    // Keep existing database data
    data = {
      ...data,
      ...saved
    };

  } catch (error) {

    console.error(
      "Database load error:",
      error?.message || error
    );
  }
}

// ==========================================
// DATABASE MIGRATION
// ==========================================

// Make sure old databases get the
// new card system automatically.

if (!data.users) {
  data.users = {};
}

if (!data.groups) {
  data.groups = {};
}

if (!data.cards) {
  data.cards = {};
}

if (!data.pokemon) {
  data.pokemon = {};
}

if (!Array.isArray(data.lottery)) {
  data.lottery = [];
}

if (!Array.isArray(data.cardMarket)) {
  data.cardMarket = [];
}

if (!data.msgCount) {
  data.msgCount = {};
}

// ==========================================
// SAVE TIMER
// ==========================================

let timer = null;

function save() {

  clearTimeout(timer);

  timer = setTimeout(() => {

    try {

      fs.writeFileSync(
        FILE,
        JSON.stringify(
          data,
          null,
          1
        )
      );

    } catch (error) {

      console.error(
        "Database save error:",
        error?.message || error
      );
    }

  }, 800);
}

// ==========================================
// USER DATABASE
// ==========================================

function user(jid) {

  if (!data.users[jid]) {

    data.users[jid] = {

      // Registration
      registered: false,

      // Profile
      profileName: "",
      bio: "",
      age: 0,

      // Money
      wallet: 0,
      bank: 0,
      bankSlips: 0,

      // Economy
      orbs: 0,
      loan: 0,

      // Inventory
      inv: {},

      // Cards
      cards: [],

      // Pokémon
      pokemon: [],

      // Activity
      warns: 0,
      afk: null,

      // Cooldowns
      cooldowns: {},

      // History
      transactions: [],

      // Titles
      titles: [],

      // Favorite card
      favoriteCard: null
    };
  }

  // ========================================
  // MIGRATE OLD USERS
  // ========================================

  const u =
    data.users[jid];

  if (
    typeof u.profileName !== "string"
  ) {
    u.profileName = "";
  }

  if (
    typeof u.bio !== "string"
  ) {
    u.bio = "";
  }

  if (
    typeof u.age !== "number"
  ) {
    u.age = 0;
  }

  if (
    typeof u.wallet !== "number"
  ) {
    u.wallet = 0;
  }

  if (
    typeof u.bank !== "number"
  ) {
    u.bank = 0;
  }

  if (
    typeof u.orbs !== "number"
  ) {
    u.orbs = 0;
  }

  if (
    typeof u.loan !== "number"
  ) {
    u.loan = 0;
  }

  if (
    !u.inv ||
    typeof u.inv !== "object"
  ) {
    u.inv = {};
  }

  if (
    !Array.isArray(u.cards)
  ) {
    u.cards = [];
  }

  if (
    !Array.isArray(u.pokemon)
  ) {
    u.pokemon = [];
  }

  if (
    !u.cooldowns ||
    typeof u.cooldowns !== "object"
  ) {
    u.cooldowns = {};
  }

  if (
    !Array.isArray(u.transactions)
  ) {
    u.transactions = [];
  }

  if (
    !Array.isArray(u.titles)
  ) {
    u.titles = [];
  }

  if (
    typeof u.registered !== "boolean"
  ) {
    u.registered = false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      u,
      "favoriteCard"
    )
  ) {
    u.favoriteCard = null;
  }

  return u;
}

// ==========================================
// GROUP DATABASE
// ==========================================

function group(jid) {

  if (!data.groups[jid]) {

    data.groups[jid] = {

      persona: 0,
      personaOn: true,

      antilink: false,

      welcome: false,

      welcomeMsg: "",

      leaveMsg: "",

      blacklist: [],

      memory: [],

      ltshop: []
    };
  }

  const g =
    data.groups[jid];

  if (
    typeof g.persona !== "number"
  ) {
    g.persona = 0;
  }

  if (
    typeof g.personaOn !== "boolean"
  ) {
    g.personaOn = true;
  }

  if (
    typeof g.antilink !== "boolean"
  ) {
    g.antilink = false;
  }

  if (
    typeof g.welcome !== "boolean"
  ) {
    g.welcome = false;
  }

  if (
    typeof g.welcomeMsg !== "string"
  ) {
    g.welcomeMsg = "";
  }

  if (
    typeof g.leaveMsg !== "string"
  ) {
    g.leaveMsg = "";
  }

  if (
    !Array.isArray(g.blacklist)
  ) {
    g.blacklist = [];
  }

  if (
    !Array.isArray(g.memory)
  ) {
    g.memory = [];
  }

  if (
    !Array.isArray(g.ltshop)
  ) {
    g.ltshop = [];
  }

  return g;
}

// ==========================================
// CARD MARKET HELPERS
// ==========================================

function cardMarket() {

  if (
    !Array.isArray(data.cardMarket)
  ) {
    data.cardMarket = [];
  }

  return data.cardMarket;
}

// ==========================================
// REGISTER / MIGRATE ALL USERS
// ==========================================

function migrateUsers() {

  for (
    const jid of Object.keys(data.users)
  ) {

    user(jid);
  }
}

// Run migration when database starts
migrateUsers();

// ==========================================
// EXPORT
// ==========================================

module.exports = {

  data,

  user,

  group,

  cardMarket,

  save
};