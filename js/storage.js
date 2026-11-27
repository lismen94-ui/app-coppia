// =========================================================
// storage.js — salvare e ricaricare i dati sul telefono
//
// Usiamo localStorage: un piccolo "cassetto" che il browser tiene
// sul dispositivo, anche dopo aver chiuso l'app o spento il telefono.
// Funziona come un dizionario: si salva un testo sotto un nome (la "chiave").
// I dati restano SOLO su questo telefono: niente server, niente account.
// =========================================================

// Il nome del cassetto. "v1" ci servirà se un giorno cambieremo il formato dei dati.
const STORAGE_KEY = "appCoppia.v1";

// Quante carte di riscaldamento ricordare per non ripeterle subito:
// 15 = le ultime 5 serate (3 carte a sera)
const RECENT_WARMUPS_TO_REMEMBER = 15;

// Le carte con il cuore. È un oggetto così:
// { "Q004": ["first"], "Q017": ["first", "second"] }
// cioè: per ogni carta, chi l'ha messa tra le preferite.
let favorites = {};

// I riscaldamenti usciti nelle ultime serate
let recentWarmupIds = [];

/**
 * Raccoglie tutto lo stato del gioco in un unico oggetto e lo salva.
 * localStorage accetta solo testo: JSON.stringify trasforma l'oggetto in testo.
 */
function saveGame() {
  const dataToSave = {
    players: players,
    currentLevel: currentLevel,
    questionsInCurrentLevel: questionsInCurrentLevel,
    nextDeeperPromptAt: nextDeeperPromptAt,
    usedCardIds: usedCardIds,
    skippedCardIds: skippedCardIds,
    heartRulesShown: heartRulesShown,
    pactAccepted: pactAccepted,
    favorites: favorites,
    recentWarmupIds: recentWarmupIds,
  };

  // try/catch: in rari casi (es. memoria piena, navigazione privata)
  // il salvataggio può fallire. Non deve far crollare l'app.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.warn("Non sono riuscito a salvare:", error);
  }
}

/**
 * Rilegge i dati salvati e rimette ogni valore al suo posto.
 * Se non c'è niente di salvato (prima volta), non fa nulla.
 * @returns {boolean} true se ha trovato dei dati salvati
 */
function loadGame() {
  let savedData = null;

  try {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText === null) {
      return false; // prima volta: niente da caricare
    }
    // JSON.parse fa il contrario di JSON.stringify: da testo a oggetto
    savedData = JSON.parse(savedText);
  } catch (error) {
    console.warn("Dati salvati illeggibili, si riparte da zero:", error);
    return false;
  }

  // Per ogni valore: se c'è nei dati salvati lo usiamo, altrimenti teniamo quello di partenza.
  // L'operatore ?? vuol dire "se il valore a sinistra manca (null/undefined), usa quello a destra".
  players.first = savedData.players?.first ?? null;
  players.second = savedData.players?.second ?? null;

  currentLevel = savedData.currentLevel ?? 1;
  questionsInCurrentLevel = savedData.questionsInCurrentLevel ?? 0;
  nextDeeperPromptAt = savedData.nextDeeperPromptAt ?? DEEPER_PROMPT_EVERY;
  heartRulesShown = savedData.heartRulesShown ?? false;
  pactAccepted = savedData.pactAccepted ?? false;
  favorites = savedData.favorites ?? {};
  recentWarmupIds = savedData.recentWarmupIds ?? [];

  // usedCardIds e skippedCardIds sono "const": non possiamo sostituirli,
  // ma possiamo svuotarli e riempirli di nuovo.
  replaceArrayContent(usedCardIds, savedData.usedCardIds ?? []);
  replaceArrayContent(skippedCardIds, savedData.skippedCardIds ?? []);

  return true;
}

/**
 * Svuota un array e ci mette dentro gli elementi di un altro.
 * I "..." (spread) passano a push() tutti gli elementi, uno per uno.
 * @param {Array} targetArray
 * @param {Array} newItems
 */
function replaceArrayContent(targetArray, newItems) {
  targetArray.length = 0;
  targetArray.push(...newItems);
}

/**
 * Cancella tutto ciò che è salvato e ricarica la pagina da zero.
 */
function eraseAllData() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload(); // ricarica la pagina
}

// =========================================================
// RISCALDAMENTI RECENTI
// =========================================================

/**
 * Ricorda un riscaldamento appena giocato, tenendo solo gli ultimi 15.
 * @param {string} warmupId
 */
function rememberWarmup(warmupId) {
  recentWarmupIds.push(warmupId);

  // Se sono troppi, togliamo i più vecchi (quelli all'inizio dell'array).
  // slice(-15) restituisce gli ultimi 15 elementi.
  if (recentWarmupIds.length > RECENT_WARMUPS_TO_REMEMBER) {
    recentWarmupIds = recentWarmupIds.slice(-RECENT_WARMUPS_TO_REMEMBER);
  }
}

// =========================================================
// PREFERITE
// =========================================================

/**
 * Questa carta è tra le preferite di questo giocatore?
 * @param {string} cardId
 * @param {string} playerKey - "first" o "second"
 * @returns {boolean}
 */
function isFavorite(cardId, playerKey) {
  const lovers = favorites[cardId] ?? [];
  return lovers.includes(playerKey);
}

/**
 * Mette o toglie il cuore di un giocatore su una carta.
 * @param {string} cardId
 * @param {string} playerKey
 */
function toggleFavorite(cardId, playerKey) {
  const lovers = favorites[cardId] ?? [];

  if (lovers.includes(playerKey)) {
    // Toglie il cuore: teniamo tutti tranne questo giocatore
    favorites[cardId] = lovers.filter(function (key) {
      return key !== playerKey;
    });
  } else {
    favorites[cardId] = lovers.concat(playerKey);
  }

  // Se nessuno ha più il cuore su questa carta, la togliamo del tutto
  if (favorites[cardId].length === 0) {
    delete favorites[cardId];
  }

  saveGame();
}

/**
 * Restituisce le carte preferite secondo un filtro.
 * @param {string} filter - "first", "second" oppure "both"
 * @returns {Array} le carte (oggetti completi, presi dal mazzo)
 */
function getFavoriteCards(filter) {
  // Object.keys() dà l'elenco delle chiavi dell'oggetto: ["Q004", "Q017", …]
  const favoriteIds = Object.keys(favorites).filter(function (cardId) {
    const lovers = favorites[cardId];
    if (filter === "both") {
      return lovers.includes("first") && lovers.includes("second");
    }
    return lovers.includes(filter);
  });

  return favoriteIds
    .map(findQuestionById)
    .filter(function (card) {
      return card !== undefined; // per sicurezza, se un codice non esiste più
    });
}
