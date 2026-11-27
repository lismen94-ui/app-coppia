// =========================================================
// gameEngine.js — le carte e la logica del gioco
// In questa fase: caricamento delle carte dai file JSON.
// Nelle prossime fasi: pesca, curva della serata, livelli.
// =========================================================

// I nomi dei tre livelli. Nei dati il livello è solo un numero (1, 2, 3):
// il nome lo prendiamo da qui. Per rinominare un livello basta cambiarlo in questo punto.
const LEVEL_NAMES = {
  1: "Specchio", // lo sguardo dell'altro: come mi vedi
  2: "Radici",   // il mondo interiore: sogni, paure, rinunce
  3: "Rifugio",  // bisogni, sicurezza emotiva, cura
};

// Qui teniamo tutte le carte, una volta caricate.
// All'inizio sono array vuoti: si riempiono con loadAllCards().
const deck = {
  questions: [], // le 150 domande (Q001–Q150)
  warmups: [],   // le 50 carte di riscaldamento (R01–R50)
  bonuses: [],   // le 50 carte bonus (B01–B50)
};

/**
 * Legge UN file JSON e restituisce il suo contenuto come dati JavaScript.
 *
 * "async" vuol dire che la funzione fa un'operazione che richiede tempo
 * (leggere un file) e non blocca il resto dell'app mentre aspetta.
 * "await" vuol dire: "aspetta qui finché l'operazione non è finita".
 *
 * @param {string} filePath - il percorso del file, es. "data/questionCards.json"
 * @returns {Promise<Array>} l'array di carte contenuto nel file
 */
async function loadJsonFile(filePath) {
  // fetch() chiede il file al server (Live Server, o in futuro il sito online)
  const response = await fetch(filePath);

  // response.ok è false se il file non esiste o c'è stato un problema
  if (!response.ok) {
    // "throw" lancia un errore: lo raccogliamo più sotto con try/catch
    throw new Error("Non riesco a leggere il file " + filePath);
  }

  // .json() trasforma il testo del file in veri array e oggetti JavaScript
  return await response.json();
}

/**
 * Carica tutti e tre i mazzi e li mette dentro "deck".
 * @returns {Promise<boolean>} true se è andato tutto bene, false se c'è stato un errore
 */
async function loadAllCards() {
  // try/catch: "prova a fare questo; se qualcosa va storto, non far crollare l'app,
  // ma esegui il blocco catch".
  try {
    deck.questions = await loadJsonFile("data/questionCards.json");
    deck.warmups = await loadJsonFile("data/warmupCards.json");
    deck.bonuses = await loadJsonFile("data/bonusCards.json");

    console.log(
      "Carte caricate:",
      deck.questions.length, "domande,",
      deck.warmups.length, "riscaldamento,",
      deck.bonuses.length, "bonus"
    );
    return true;
  } catch (error) {
    console.error("Errore nel caricamento delle carte:", error);
    return false;
  }
}

// =========================================================
// STATO DEL GIOCO
// (Nella fase 5 questi dati verranno salvati sul telefono,
// così si potrà riprendere la partita dopo averla chiusa.)
// =========================================================

// Il livello in cui si trova la coppia: si parte da 1 (Specchio)
let currentLevel = 1;

// I codici delle carte già giocate, es. ["Q004", "Q017"]: non devono più uscire
const usedCardIds = [];

// I codici delle carte messe in sospeso
const skippedCardIds = [];

// La carta che è sullo schermo in questo momento
let currentCard = null;

// =========================================================
// PESCA
// =========================================================

/**
 * Restituisce le domande ancora disponibili in un livello:
 * cioè quelle mai giocate e non in sospeso.
 * La carta finale è esclusa: compare solo alla fine di tutto.
 * @param {number} level
 * @returns {Array} le carte disponibili
 */
function getAvailableQuestions(level) {
  return deck.questions.filter(function (card) {
    const isRightLevel = card.level === level;
    const isUsed = usedCardIds.includes(card.id);
    const isSkipped = skippedCardIds.includes(card.id);
    return isRightLevel && !isUsed && !isSkipped && !card.isFinal;
  });
}

/**
 * Sceglie a caso un elemento da un array.
 * Math.random() dà un numero tra 0 e 0.999…; moltiplicato per la lunghezza
 * e arrotondato per difetto (Math.floor) diventa una posizione valida.
 * @param {Array} list
 * @returns {*} un elemento a caso
 */
function pickRandom(list) {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Pesca la prossima domanda.
 * Per ora: una carta a caso del livello corrente.
 * Se il livello è finito passa al successivo; se sono finiti tutti, dà la carta finale.
 * (Nella fase 4 la scelta seguirà la "curva della serata".)
 * @returns {object} la carta pescata
 */
function drawNextQuestion() {
  let available = getAvailableQuestions(currentLevel);

  // Livello finito? Saliamo finché troviamo carte (o finiscono i livelli)
  while (available.length === 0 && currentLevel < 3) {
    currentLevel = currentLevel + 1;
    available = getAvailableQuestions(currentLevel);
  }

  if (available.length === 0) {
    // Non c'è più niente: è il momento della carta finale
    currentCard = deck.questions.find(function (card) {
      return card.isFinal;
    });
  } else {
    currentCard = pickRandom(available);
  }

  return currentCard;
}

/**
 * Segna la carta attuale come giocata, così non uscirà più.
 */
function markCurrentCardAsUsed() {
  if (currentCard !== null && !usedCardIds.includes(currentCard.id)) {
    usedCardIds.push(currentCard.id);
  }
}

/**
 * Mette la carta attuale in sospeso.
 */
function skipCurrentCard() {
  if (currentCard !== null && !currentCard.isFinal) {
    skippedCardIds.push(currentCard.id);
  }
}

/**
 * Conta quante carte domanda ci sono per un certo livello.
 * Ci serve per controllare che i dati siano giusti (50 per livello).
 * @param {number} level - 1, 2 oppure 3
 * @returns {number}
 */
function countQuestionsByLevel(level) {
  // filter() crea un nuovo array con solo le carte che rispettano la condizione
  const cardsOfLevel = deck.questions.filter(function (card) {
    return card.level === level;
  });
  return cardsOfLevel.length;
}
