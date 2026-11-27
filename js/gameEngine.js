// =========================================================
// gameEngine.js — le carte e le regole del gioco
// Qui non si tocca lo schermo: si decide solo QUALE carta esce e QUANDO.
// =========================================================

// I nomi dei tre livelli. Nei dati il livello è solo un numero (1, 2, 3):
// il nome lo prendiamo da qui. Per rinominare un livello basta cambiarlo in questo punto.
const LEVEL_NAMES = {
  1: "Specchio", // lo sguardo dell'altro: come mi vedi
  2: "Radici",   // il mondo interiore: sogni, paure, rinunce
  3: "Rifugio",  // bisogni, sicurezza emotiva, cura
};

// La presentazione di ogni livello: compare quando ci si entra.
const LEVEL_DESCRIPTIONS = {
  1: "Prima di guardarvi dentro, guardatevi.\n" +
     "Qui scoprite come vi vede l'altro: le piccole cose che nota, " +
     "quello che dà per scontato, quello che non vi ha mai detto.",
  2: "Qui si scende sotto la superficie: sogni messi da parte, paure, rinunce, cose non dette.\n" +
     "Alcune domande saranno intense. Andate piano: non c'è fretta e non c'è una risposta giusta.",
  3: "Dopo aver visto le radici, si costruisce il rifugio: " +
     "cosa vi fa sentire al sicuro, di cosa avete bisogno, " +
     "come prendervi cura l'uno dell'altra.",
};

// =========================================================
// REGOLE DELLA SERATA
// Sono numeri "di regia": cambiandoli si cambia il ritmo del gioco.
// =========================================================

const WARMUP_CARDS_PER_EVENING = 3; // carte di riscaldamento all'inizio
const QUESTIONS_PER_EVENING = 10;   // domande dopo il riscaldamento, prima di proporre di chiudere
const RISE_QUESTIONS = 3;           // domande "in salita" dopo il riscaldamento
const DESCENT_QUESTIONS = 2;        // domande "in discesa" prima della chiusura
const DEEPER_PROMPT_EVERY = 5;      // ogni quante domande chiedere "volete andare più a fondo?"

// Probabilità che nel "cuore" della serata esca una carta intensa (se ce ne sono).
// 0.35 = circa 3-4 volte su 10. Con "Leggeri" la probabilità è zero.
const NORMAL_MOOD_INTENSE_CHANCE = 0.35; // serata "Come viene"
const DEEP_MOOD_INTENSE_CHANCE = 0.75;   // serata "Pronti ad andare a fondo"

// =========================================================
// LE CARTE
// =========================================================

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
// STATO DEL GIOCO (dura tra una serata e l'altra)
// Nella fase 5 questi dati verranno salvati sul telefono.
// =========================================================

// Il livello in cui si trova la coppia: si parte da 1 (Specchio)
let currentLevel = 1;

// Quante domande sono state giocate nel livello attuale,
// e a quale numero chiedere di nuovo "volete andare più a fondo?"
let questionsInCurrentLevel = 0;
let nextDeeperPromptAt = DEEPER_PROMPT_EVERY;

// I codici delle domande già giocate, es. ["Q004", "Q017"]: non devono più uscire
const usedCardIds = [];

// I codici delle domande messe in sospeso
const skippedCardIds = [];

// La schermata "regole del cuore" va mostrata una volta sola
let heartRulesShown = false;

// Il "patto iniziale" va accettato una volta, all'inizio del viaggio
let pactAccepted = false;

// =========================================================
// STATO DELLA SERATA (si azzera a ogni nuova serata)
// =========================================================

// Un oggetto che raccoglie tutto ciò che riguarda la serata in corso
let evening = createNewEvening();

// La carta sullo schermo in questo momento, e di che tipo è: "warmup", "question" o "bonus"
let currentCard = null;
let currentCardKind = null;

// Da dove arriva la carta sullo schermo:
// "evening" = pescata durante la serata, "skipped" = riaperta dalle domande in sospeso
let currentCardSource = "evening";

/**
 * Crea i dati di una serata nuova, tutti a zero.
 * La usiamo all'avvio e ogni volta che si inizia una serata.
 * @returns {object}
 */
function createNewEvening() {
  return {
    warmupsDone: 0,        // carte di riscaldamento giocate stasera
    questionsDone: 0,      // domande giocate stasera
    usedWarmupIds: [],     // riscaldamenti già usciti stasera (non devono ripetersi)
    segmentStart: 0,       // da quale domanda è ripartito il conteggio (dopo "continuiamo")
    isContinuation: false, // true se la coppia ha scelto di continuare dopo il limite
    mood: null,            // l'intensità scelta per stasera: "light", "normal", "deep" (null = non ancora scelta)
    usedBonusIds: [],      // carte bonus già uscite stasera
  };
}

/**
 * Azzera la serata. Livello, carte usate e in sospeso invece restano.
 */
function startNewEvening() {
  evening = createNewEvening();
  currentCard = null;
  currentCardKind = null;
  currentCardSource = "evening";
}

// =========================================================
// LA CURVA DELLA SERATA
// =========================================================

/**
 * Dice in che momento della serata siamo.
 *
 * Serata normale (10 domande dopo il riscaldamento):
 *   riscaldamento → salita (3) → cuore (5) → discesa (2) → proposta di chiudere
 *
 * Se la coppia sceglie di continuare, riparte un pezzo più corto (7 domande)
 * senza salita, perché sono già "scaldati":
 *   cuore (5) → discesa (2) → proposta di chiudere
 *
 * @returns {string} "warmup", "rise", "heart" oppure "descent"
 */
function getEveningPhase() {
  if (evening.warmupsDone < WARMUP_CARDS_PER_EVENING) {
    return "warmup";
  }

  // In che posizione siamo dentro il pezzo di serata attuale
  const position = evening.questionsDone - evening.segmentStart;

  if (!evening.isContinuation && position < RISE_QUESTIONS) {
    return "rise";
  }
  if (position >= getSegmentLength() - DESCENT_QUESTIONS) {
    return "descent";
  }
  return "heart";
}

/**
 * Quante carte sono state giocate stasera, riscaldamento compreso.
 * @returns {number}
 */
function getEveningCardCount() {
  return evening.warmupsDone + evening.questionsDone;
}

/**
 * È il momento di chiedere "come vi sentite stasera?"
 * Sì, appena finito il riscaldamento, se non l'hanno ancora scelto.
 * @returns {boolean}
 */
function needsMoodChoice() {
  return evening.warmupsDone >= WARMUP_CARDS_PER_EVENING && evening.mood === null;
}

/**
 * Salva l'intensità scelta dalla coppia per questa serata.
 * @param {string} mood - "light", "normal" o "deep"
 */
function setEveningMood(mood) {
  evening.mood = mood;
}

/**
 * Quante domande ci sono nel pezzo di serata attuale.
 * @returns {number} 10 nella serata normale, 7 dopo "continuiamo"
 */
function getSegmentLength() {
  if (evening.isContinuation) {
    return QUESTIONS_PER_EVENING - RISE_QUESTIONS;
  }
  return QUESTIONS_PER_EVENING;
}

/**
 * È il momento di proporre "per stasera può bastare"?
 * @returns {boolean}
 */
function isEveningLimitReached() {
  const position = evening.questionsDone - evening.segmentStart;
  return position >= getSegmentLength();
}

/**
 * La coppia ha scelto di continuare: riparte un nuovo pezzo di serata.
 */
function continueEvening() {
  evening.segmentStart = evening.questionsDone;
  evening.isContinuation = true;
}

// =========================================================
// LIVELLI
// =========================================================

/**
 * È il momento di chiedere "volete andare più a fondo?"
 * Lo chiediamo solo nel "cuore" della serata: non durante riscaldamento,
 * salita o discesa (sono momenti in cui si va piano).
 * E mai nell'ultimo livello, perché non c'è un "più a fondo".
 * @returns {boolean}
 */
function shouldAskToGoDeeper() {
  return currentLevel < 3
    && getEveningPhase() === "heart"
    && questionsInCurrentLevel >= nextDeeperPromptAt;
}

/**
 * Si può ancora scendere? (Rifugio è l'ultimo livello)
 * @returns {boolean}
 */
function canGoDeeper() {
  return currentLevel < 3;
}

/**
 * Passa al livello successivo e azzera il conteggio delle domande del livello.
 */
function goDeeper() {
  if (currentLevel < 3) {
    currentLevel = currentLevel + 1;
    questionsInCurrentLevel = 0;
    nextDeeperPromptAt = DEEPER_PROMPT_EVERY;
  }
}

/**
 * La coppia ha scelto di restare: richiederemo tra altre 5 domande.
 */
function stayAtCurrentLevel() {
  nextDeeperPromptAt = questionsInCurrentLevel + DEEPER_PROMPT_EVERY;
}

/**
 * Bisogna mostrare le "regole del cuore" prima di questa carta?
 * Sì, se è la prima volta che esce una domanda di Radici (o oltre).
 * @param {object} card
 * @returns {boolean}
 */
function needsHeartRules(card) {
  return currentCardKind === "question" && card.level >= 2 && !heartRulesShown;
}

// =========================================================
// PESCA
// =========================================================

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
 * Tiene solo le carte con l'intensità più bassa disponibile.
 * Esempio: se ci sono carte ●○○ e ●●○, restano solo le ●○○.
 * Serve per la salita e la discesa: momenti in cui si va piano.
 * @param {Array} cards
 * @returns {Array}
 */
function keepGentlestCards(cards) {
  // map() trasforma ogni carta nel suo numero di intensità: [1, 2, 2, 1…]
  const intensities = cards.map(function (card) {
    return card.intensity;
  });
  // Math.min(...) trova il numero più piccolo. I "..." (spread) passano
  // tutti gli elementi dell'array come se li scrivessimo uno per uno.
  const lowestIntensity = Math.min(...intensities);

  return cards.filter(function (card) {
    return card.intensity === lowestIntensity;
  });
}

/**
 * Pesca una carta di riscaldamento che non sia uscita stasera
 * né nelle ultime serate (recentWarmupIds sta in storage.js).
 * @returns {object}
 */
function drawWarmupCard() {
  let available = deck.warmups.filter(function (card) {
    const usedTonight = evening.usedWarmupIds.includes(card.id);
    const usedRecently = recentWarmupIds.includes(card.id);
    return !usedTonight && !usedRecently;
  });

  // Se sono finite, rinunciamo alla regola "non recenti" (ma non a quella "non stasera")
  if (available.length === 0) {
    available = deck.warmups.filter(function (card) {
      return !evening.usedWarmupIds.includes(card.id);
    });
  }

  // Caso estremo: le abbiamo usate tutte stasera → si ricomincia dal mazzo intero
  if (available.length === 0) {
    available = deck.warmups;
  }

  return pickRandom(available);
}

/**
 * Pesca una domanda adatta al momento della serata.
 * - salita e discesa: le carte più leggere disponibili nel livello
 * - cuore: qualsiasi carta del livello (anche le ●●●)
 * Se il livello è finito passa al successivo; se sono finiti tutti, dà la carta finale.
 * @param {string} phase - "rise", "heart" o "descent"
 * @returns {object}
 */
function drawQuestionCard(phase) {
  let available = getAvailableQuestions(currentLevel);

  // Livello finito? Saliamo finché troviamo carte (o finiscono i livelli)
  while (available.length === 0 && currentLevel < 3) {
    goDeeper();
    available = getAvailableQuestions(currentLevel);
  }

  // Anche l'ultimo livello è finito? Prima della carta finale recuperiamo
  // le domande rimaste indietro nei livelli precedenti (succede se la coppia
  // è andata "più a fondo" presto): nessuna domanda deve andare persa.
  if (available.length === 0) {
    available = getAvailableQuestions(2);
  }
  if (available.length === 0) {
    available = getAvailableQuestions(1);
  }

  // Non c'è più niente: è il momento della carta finale
  if (available.length === 0) {
    return deck.questions.find(function (card) {
      return card.isFinal;
    });
  }

  if (phase === "rise" || phase === "descent") {
    return pickRandom(keepGentlestCards(available));
  }

  // Siamo nel "cuore": decide l'intensità scelta dalla coppia
  return pickHeartCard(available);
}

/**
 * Sceglie una carta per il "cuore" della serata, secondo l'umore scelto.
 * - light ("Leggeri"): mai carte intense
 * - normal ("Come viene"): ogni tanto una carta intensa
 * - deep ("Pronti ad andare a fondo"): spesso una carta intensa
 * @param {Array} available - le carte disponibili nel livello
 * @returns {object}
 */
function pickHeartCard(available) {
  const intenseCards = available.filter(function (card) {
    return card.intensity === 3;
  });
  const softerCards = available.filter(function (card) {
    return card.intensity < 3;
  });

  // Quanto è probabile, stasera, una carta intensa?
  let intenseChance = 0;
  if (evening.mood === "normal") {
    intenseChance = NORMAL_MOOD_INTENSE_CHANCE;
  } else if (evening.mood === "deep") {
    intenseChance = DEEP_MOOD_INTENSE_CHANCE;
  }

  // "Tiriamo il dado": Math.random() < 0.35 è vero circa 35 volte su 100
  const wantsIntense = Math.random() < intenseChance;

  if (wantsIntense && intenseCards.length > 0) {
    return pickRandom(intenseCards);
  }
  if (softerCards.length > 0) {
    return pickRandom(softerCards);
  }

  // In questo livello restano solo carte intense.
  // Se la serata è "Leggeri", rispettiamo la scelta: cerchiamo una carta
  // più leggera rimasta in un altro livello.
  if (evening.mood === "light") {
    const softerElsewhere = getAllAvailableQuestions().filter(function (card) {
      return card.intensity < 3;
    });
    if (softerElsewhere.length > 0) {
      return pickRandom(softerElsewhere);
    }
  }

  // Non c'è proprio altro: arriva una carta intensa (che resta coperta
  // e si può sempre mettere in sospeso).
  return pickRandom(intenseCards);
}

/**
 * Tutte le domande ancora disponibili, in qualsiasi livello.
 * @returns {Array}
 */
function getAllAvailableQuestions() {
  return getAvailableQuestions(1)
    .concat(getAvailableQuestions(2))
    .concat(getAvailableQuestions(3));
}

/**
 * Pesca la prossima carta, del tipo giusto per il momento della serata.
 * Aggiorna currentCard e currentCardKind.
 * @returns {object} la carta pescata
 */
function drawNextCard() {
  const phase = getEveningPhase();

  if (phase === "warmup") {
    currentCard = drawWarmupCard();
    currentCardKind = "warmup";
  } else {
    currentCard = drawQuestionCard(phase);
    currentCardKind = "question";
  }

  return currentCard;
}

// =========================================================
// CARTE BONUS
// =========================================================

/**
 * Pesca una carta bonus del tipo richiesto, evitando quelle già uscite
 * stasera e nelle ultime serate (recentBonusIds sta in storage.js).
 * @param {string} type - "calm" (dopo una carta intensa) o "breath" (dopo una carta saltata)
 * @returns {object}
 */
function drawBonusCard(type) {
  const cardsOfType = deck.bonuses.filter(function (card) {
    return card.type === type;
  });

  let available = cardsOfType.filter(function (card) {
    const usedTonight = evening.usedBonusIds.includes(card.id);
    const usedRecently = recentBonusIds.includes(card.id);
    return !usedTonight && !usedRecently;
  });

  // Se sono finite, ripartiamo da tutte quelle del tipo giusto
  if (available.length === 0) {
    available = cardsOfType;
  }

  currentCard = pickRandom(available);
  currentCardKind = "bonus";
  evening.usedBonusIds.push(currentCard.id);
  rememberBonus(currentCard.id); // sta in storage.js

  return currentCard;
}

/**
 * La carta appena giocata era intensa? (Serve per decidere se proporre una pausa di calma.)
 * @returns {boolean}
 */
function isCurrentCardIntense() {
  return currentCardKind === "question"
    && !currentCard.isFinal
    && currentCard.intensity === 3;
}

// =========================================================
// DOPO LA CARTA: giocata o messa in sospeso
// =========================================================

/**
 * "Fatto, passa": segna la carta come giocata e aggiorna i conteggi.
 */
function markCurrentCardAsUsed() {
  // Le carte bonus non contano: sono già state segnate quando sono uscite
  if (currentCard === null || currentCardKind === "bonus") {
    return;
  }

  if (currentCardKind === "warmup") {
    evening.usedWarmupIds.push(currentCard.id);
    evening.warmupsDone = evening.warmupsDone + 1;
    rememberWarmup(currentCard.id); // sta in storage.js
    return;
  }

  if (!usedCardIds.includes(currentCard.id)) {
    usedCardIds.push(currentCard.id);
  }
  evening.questionsDone = evening.questionsDone + 1;
  questionsInCurrentLevel = questionsInCurrentLevel + 1;
}

/**
 * Una domanda in sospeso a cui avete risposto: diventa "giocata"
 * e sparisce dall'elenco delle domande in sospeso.
 * Non conta per la serata: la si può riaprire anche dalla home.
 * @param {string} cardId
 */
function answerSkippedCard(cardId) {
  removeFromSkipped(cardId);
  if (!usedCardIds.includes(cardId)) {
    usedCardIds.push(cardId);
  }
}

/**
 * Toglie una carta dall'elenco delle domande in sospeso.
 * splice(posizione, 1) toglie 1 elemento dall'array in quella posizione.
 * @param {string} cardId
 */
function removeFromSkipped(cardId) {
  const position = skippedCardIds.indexOf(cardId);
  if (position !== -1) {
    skippedCardIds.splice(position, 1);
  }
}

/**
 * Cerca una domanda nel mazzo partendo dal suo codice.
 * @param {string} cardId - es. "Q017"
 * @returns {object|undefined}
 */
function findQuestionById(cardId) {
  return deck.questions.find(function (card) {
    return card.id === cardId;
  });
}

/**
 * Quante domande avete giocato sul totale (la carta finale non conta).
 * @returns {object} es. { played: 23, total: 149 }
 */
function getJourneyProgress() {
  const playableQuestions = deck.questions.filter(function (card) {
    return !card.isFinal;
  });
  const played = playableQuestions.filter(function (card) {
    return usedCardIds.includes(card.id);
  });
  return { played: played.length, total: playableQuestions.length };
}

/**
 * "Metti in sospeso": la carta va da parte.
 * Un riscaldamento non va "in sospeso": lo segniamo solo come già uscito stasera.
 */
function skipCurrentCard() {
  if (currentCard === null || currentCard.isFinal) {
    return;
  }

  if (currentCardKind === "warmup") {
    evening.usedWarmupIds.push(currentCard.id);
  } else if (!skippedCardIds.includes(currentCard.id)) {
    skippedCardIds.push(currentCard.id);
  }
}

// =========================================================
// FINE DEL VIAGGIO
// =========================================================

/**
 * Il viaggio è completo quando la carta finale è stata giocata.
 * @returns {boolean}
 */
function isJourneyComplete() {
  const finalCard = deck.questions.find(function (card) {
    return card.isFinal;
  });
  return usedCardIds.includes(finalCard.id);
}

/**
 * Ricomincia il viaggio da capo: tutte le domande tornano disponibili.
 * .length = 0 svuota un array "const" (non possiamo riassegnarlo, ma possiamo svuotarlo).
 * Le carte in sospeso restano in sospeso: sono un promemoria della coppia.
 */
function restartJourney() {
  usedCardIds.length = 0;
  currentLevel = 1;
  questionsInCurrentLevel = 0;
  nextDeeperPromptAt = DEEPER_PROMPT_EVERY;
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
