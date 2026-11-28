// =========================================================
// script.js — avvio dell'app e cambio delle schermate
// =========================================================

/**
 * Mostra una schermata e nasconde tutte le altre.
 * @param {string} screenId - l'id della schermata da mostrare, es. "screenGame"
 */
function showScreen(screenId) {
  // 1. Prendiamo TUTTE le schermate della pagina
  const allScreens = document.querySelectorAll(".screen");

  // 2. A ognuna togliamo la classe "attiva" (così spariscono tutte)
  allScreens.forEach(function (screen) {
    screen.classList.remove("screen--active");
  });

  // 3. Cerchiamo la schermata che vogliamo mostrare
  const targetScreen = document.getElementById(screenId);

  // Controllo di sicurezza: se l'id è scritto male, avvisiamo in console
  // invece di far "rompere" l'app in silenzio.
  if (targetScreen === null) {
    console.warn("Schermata non trovata:", screenId);
    return;
  }

  // 4. Solo a lei rimettiamo la classe "attiva"
  targetScreen.classList.add("screen--active");

  // 5. Le schermate partono sempre dall'alto (utile per gli elenchi lunghi)
  window.scrollTo(0, 0);

  // 6. Ogni volta che si torna alla home, aggiorniamo "a che punto siete"
  if (screenId === "screenHome") {
    updateJourneyStatus(); // sta in ui.js
  }
}

/**
 * Collega tutti i pulsanti che hanno l'attributo data-target
 * alla schermata indicata.
 * Esempio in HTML: <button data-target="screenGame">
 */
function setupNavigationButtons() {
  // [data-target] seleziona tutti gli elementi che hanno quell'attributo
  const navigationButtons = document.querySelectorAll("[data-target]");

  navigationButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // button.dataset.target legge il valore di data-target
      const targetScreenId = button.dataset.target;
      showScreen(targetScreenId);
    });
  });
}

// =========================================================
// COLORI DEI GIOCATORI
// =========================================================

// La palette tra cui scegliere. È un array di oggetti:
// ogni oggetto ha un codice (id), un nome da mostrare e il colore vero e proprio (hex).
// I colori sono distribuiti lungo tutta la ruota dei colori
// (rosso → giallo → verde → blu → viola), così si distinguono bene tra loro,
// pur restando morbidi sullo sfondo scuro.
const PASTEL_COLORS = [
  { id: "coral", name: "Corallo", hex: "#ef8f84" },
  { id: "honey", name: "Miele", hex: "#f0c35a" },
  { id: "pistachio", name: "Pistacchio", hex: "#c3d97a" },
  { id: "sage", name: "Salvia", hex: "#8cc7a1" },
  { id: "teal", name: "Acquamarina", hex: "#6fc3c9" },
  { id: "sky", name: "Cielo", hex: "#7fa8e8" },
  { id: "lavender", name: "Lavanda", hex: "#a891e0" },
  { id: "orchid", name: "Orchidea", hex: "#e58fc4" },
];

// Qui ricordiamo cosa hanno scelto i due giocatori.
// null vuol dire "non ancora scelto".
// (Nella fase 5 questi dati verranno salvati sul telefono.)
const players = {
  first: null,
  second: null,
};

// Di chi è il turno adesso: "first" oppure "second"
let currentPlayer = "first";

/**
 * Cerca un colore nella palette partendo dal suo id.
 * @param {string} colorId - es. "coral"
 * @returns {object} l'oggetto colore, es. { id: "coral", name: "Corallo", hex: "#ef8f84" }
 */
function findColorById(colorId) {
  return PASTEL_COLORS.find(function (color) {
    return color.id === colorId;
  });
}

/**
 * Applica i colori del turno a tutta l'app.
 * Modifica due variabili CSS: tutto ciò che le usa
 * (bordo della carta, alone, pulsante principale) si aggiorna da solo.
 * --colorCurrentPlayer → chi ha il telefono adesso
 * --colorOtherPlayer   → l'altra persona (serve per le carte "insieme")
 */
function applyTurnColors() {
  const otherPlayer = currentPlayer === "first" ? "second" : "first";

  const currentHex = findColorById(players[currentPlayer]).hex;
  const otherHex = findColorById(players[otherPlayer]).hex;

  document.documentElement.style.setProperty("--colorCurrentPlayer", currentHex);
  document.documentElement.style.setProperty("--colorOtherPlayer", otherHex);
}

/**
 * Crea i pallini colorati per un giocatore.
 * @param {string} playerKey - "first" oppure "second"
 * @param {string} containerId - l'id del <div> dove mettere i pallini
 */
function renderSwatches(playerKey, containerId) {
  const container = document.getElementById(containerId);

  // Svuotiamo il contenitore, così se la funzione viene richiamata non duplica i pallini
  container.innerHTML = "";

  // Chi è l'altro giocatore? Ci serve per bloccare il colore che ha già preso.
  const otherPlayerKey = playerKey === "first" ? "second" : "first";

  PASTEL_COLORS.forEach(function (color) {
    const swatch = document.createElement("button");
    swatch.className = "swatch";
    swatch.style.backgroundColor = color.hex;
    // aria-label: il nome del colore, letto dagli screen reader per chi non vede
    swatch.setAttribute("aria-label", color.name);

    if (players[playerKey] === color.id) {
      swatch.classList.add("swatch--selected");
    }

    // Se l'altra persona ha già questo colore, il pallino non si può scegliere
    if (players[otherPlayerKey] === color.id) {
      swatch.disabled = true;
    }

    swatch.addEventListener("click", function () {
      selectColor(playerKey, color.id);
    });

    container.appendChild(swatch);
  });
}

/**
 * Ridisegna entrambe le righe di pallini e i testi sotto.
 * La chiamiamo ogni volta che una scelta cambia.
 */
function renderColorPickers() {
  renderSwatches("first", "colorPickerFirst");
  renderSwatches("second", "colorPickerSecond");

  updateChosenColorLabel("first", "chosenColorFirst");
  updateChosenColorLabel("second", "chosenColorSecond");

  // Il pulsante "Iniziamo" si attiva solo se entrambi hanno scelto
  const startButton = document.getElementById("buttonStartEvening");
  const bothChosen = players.first !== null && players.second !== null;
  startButton.disabled = !bothChosen;
}

/**
 * Scrive sotto ai pallini il nome del colore scelto.
 */
function updateChosenColorLabel(playerKey, labelId) {
  const label = document.getElementById(labelId);

  if (players[playerKey] === null) {
    label.textContent = "Scegli un colore";
  } else {
    label.textContent = findColorById(players[playerKey]).name;
  }
}

/**
 * Salva la scelta di un giocatore e aggiorna lo schermo.
 */
function selectColor(playerKey, colorId) {
  players[playerKey] = colorId;
  renderColorPickers();
  saveGame(); // sta in storage.js
}

// =========================================================
// TURNI E FLUSSO DELLA SERATA
// =========================================================

/**
 * Pesca la prossima carta e la mostra, con le eventuali "pause" prima:
 * - se dopo il riscaldamento non avete ancora scelto l'intensità → "Come vi sentite stasera?"
 * - se la carta è di un livello nuovo (perché il precedente è finito) → presentazione del livello
 * - se è la prima carta di Radici → "Regole del cuore"
 */
function showNextCard() {
  if (needsMoodChoice()) {
    askEveningMood();
    return;
  }

  const levelBefore = currentLevel;
  const card = drawNextCard();

  // Salviamo a ogni carta: se l'app si chiude adesso, non si perde niente
  saveGame();

  // Il livello è cambiato da solo perché le carte del precedente sono finite
  if (currentLevel !== levelBefore) {
    showLevelIntro(currentLevel, function () {
      showCardWithRulesIfNeeded(card);
    });
    return;
  }

  showCardWithRulesIfNeeded(card);
}

/**
 * Mostra la carta; se è la prima volta in Radici, prima le regole del cuore.
 * @param {object} card
 */
function showCardWithRulesIfNeeded(card) {
  if (needsHeartRules(card)) {
    heartRulesShown = true;
    saveGame();
    showPrompt({
      title: "Regole del cuore",
      text:
        "Ascolta senza difenderti.\n" +
        "Non esiste una risposta giusta.\n" +
        "Ogni carta si può mettere in sospeso.\n" +
        "Quello che viene detto qui, resta qui.",
      buttons: [
        { label: "Siamo pronti", style: "primary", onClick: function () { displayCard(card); } },
      ],
    });
    return;
  }

  displayCard(card);
}

/**
 * Disegna la carta e mostra la schermata di gioco.
 * @param {object} card
 */
function displayCard(card) {
  renderCard(card, currentCardKind);
  updateGoDeeperButton();
  updateGameButtons();
  showScreen("screenGame");

  // La prima volta che compare un certo tipo di carta, un pop-up la spiega (ui.js)
  showHints(getHintsToShow(card, currentCardKind));
}

/**
 * Le scritte dei pulsanti di gioco cambiano un po' secondo il tipo di carta:
 * - carta bonus: è una pausa → "Fatto" / "Salta"
 * - carta riaperta dalle domande in sospeso → "Fatto" / "Lasciala in sospeso"
 * - carta normale della serata → "Fatto, passa" / "Metti in sospeso"
 */
function updateGameButtons() {
  const nextButton = document.getElementById("buttonNextTurn");
  const skipButton = document.getElementById("buttonSkipCard");
  const closeButton = document.getElementById("buttonCloseEvening");

  if (currentCardKind === "bonus") {
    nextButton.textContent = "Fatto";
    skipButton.textContent = "Salta";
    closeButton.textContent = "Chiudi la serata";
    document.getElementById("buttonGoDeeper").hidden = true;
  } else if (currentCardSource === "skipped") {
    nextButton.textContent = "Fatto";
    skipButton.textContent = "Lasciala in sospeso";
    closeButton.textContent = "Torna all'elenco";
    document.getElementById("buttonGoDeeper").hidden = true;
  } else {
    nextButton.textContent = "Fatto, passa";
    skipButton.textContent = "Metti in sospeso";
    closeButton.textContent = "Chiudi la serata";
  }
}

/**
 * Presentazione di un livello (con un solo pulsante per proseguire).
 * @param {number} level
 * @param {Function} onContinue - cosa fare dopo
 */
function showLevelIntro(level, onContinue) {
  showPrompt({
    title: LEVEL_NAMES[level],
    text: LEVEL_DESCRIPTIONS[level],
    buttons: [
      { label: "Entriamo", style: "primary", onClick: onContinue },
    ],
  });
}

// ---------------------------------------------------------
// Inizio della serata e del viaggio
// ---------------------------------------------------------

/**
 * "Iniziamo": prima del primo viaggio c'è il patto iniziale;
 * se il viaggio è finito si chiede se ricominciare; altrimenti si parte.
 */
function startEvening() {
  // Sicurezza: se le carte non sono state caricate, non si può giocare
  if (deck.questions.length === 0) {
    alert("Le carte non sono ancora pronte. Riprova tra un attimo.");
    return;
  }

  if (!pactAccepted) {
    showInitialPact();
    return;
  }

  if (isJourneyComplete()) {
    askToRestartJourney();
    return;
  }

  beginEvening();
}

/**
 * Azzera la serata e mostra la prima carta, con il colore del primo giocatore.
 */
function beginEvening() {
  startNewEvening();
  currentPlayer = "first";
  applyTurnColors();
  showNextCard();
}

/**
 * Il patto iniziale: da leggere e discutere insieme, una volta sola.
 */
function showInitialPact() {
  showPrompt({
    title: "Prima di iniziare, parlatene insieme",
    text:
      "Perché avete voglia di fare questo viaggio, proprio adesso?\n\n" +
      "Come sta la vostra coppia in questo periodo: serena, stanca, in difficoltà?\n\n" +
      "C'è un argomento che per ora preferite lasciare fuori dal gioco?\n\n" +
      "Cosa farete se una domanda fa male? (fermarvi, abbracciarvi, riprendere un'altra sera…)\n\n" +
      "Questo gioco può aiutarvi a parlarvi, ma non sostituisce un terapeuta di coppia. " +
      "Se state attraversando un momento molto difficile, può essere il momento " +
      "di farsi accompagnare da un professionista.",
    buttons: [
      {
        label: "Siamo pronti",
        style: "primary",
        onClick: function () {
          pactAccepted = true;
          saveGame();
          // Prima di partire, la presentazione del primo livello
          showLevelIntro(currentLevel, beginEvening);
        },
      },
      {
        label: "Ne riparliamo un'altra volta",
        style: "ghost",
        onClick: function () { showScreen("screenHome"); },
      },
    ],
  });
}

/**
 * "Come vi sentite stasera?": la coppia sceglie insieme l'intensità della serata.
 */
function askEveningMood() {
  // Una piccola funzione "fabbrica": crea la funzione da eseguire per ogni scelta,
  // così non dobbiamo scrivere tre volte lo stesso codice.
  function chooseMood(mood) {
    return function () {
      setEveningMood(mood);
      showNextCard();
    };
  }

  showPrompt({
    title: "Come vi sentite stasera?",
    text: "Parlatene un attimo, e scegliete insieme.",
    buttons: [
      { label: "🌙 Leggeri — niente carte intense", style: "outline", onClick: chooseMood("light") },
      { label: "🌗 Come viene — il ritmo normale", style: "outline", onClick: chooseMood("normal") },
      { label: "🌕 Pronti ad andare a fondo", style: "outline", onClick: chooseMood("deep") },
    ],
  });
}

// ---------------------------------------------------------
// Durante la serata
// ---------------------------------------------------------

/**
 * "Fatto, passa": la carta è giocata e il telefono passa all'altra persona.
 * Prima della carta successiva, controlliamo se è il momento di una pausa:
 * 1. la fine della serata ("per stasera può bastare")
 * 2. la domanda "volete andare più a fondo?"
 */
function goToNextTurn() {
  // Carta riaperta dalle domande in sospeso: è fatta, si torna all'elenco
  if (currentCardSource === "skipped") {
    answerSkippedCard(currentCard.id);
    saveGame();
    openSkippedScreen();
    return;
  }

  // Carta bonus finita: si riprende la serata da dove era rimasta
  if (currentCardKind === "bonus") {
    continueAfterBonus();
    return;
  }

  // La carta finale chiude il viaggio
  if (currentCard.isFinal) {
    markCurrentCardAsUsed();
    askToRestartJourney();
    return;
  }

  // Ce lo chiediamo PRIMA di segnarla, mentre currentCard è ancora lei
  const wasIntense = isCurrentCardIntense();

  markCurrentCardAsUsed();

  // Dopo una carta intensa: una pausa di calma PRIMA di passare il telefono.
  // La fa chi ha letto la domanda, cioè chi ha appena ascoltato la risposta
  // (es. "Di' all'altro una cosa che ammiri di come ha appena risposto").
  if (wasIntense) {
    showBonusCard("calm", passPhoneAndContinue);
    return;
  }

  passPhoneAndContinue();
}

/**
 * Il telefono passa all'altra persona (cambia il colore) e la serata prosegue.
 */
function passPhoneAndContinue() {
  // Operatore ternario: "se è first, diventa second; altrimenti diventa first"
  currentPlayer = currentPlayer === "first" ? "second" : "first";
  applyTurnColors();
  continueEveningAfterTurn();
}

/**
 * Dopo una carta giocata: è il momento di una pausa (fine serata, "più a fondo?")
 * o si pesca la carta successiva?
 */
function continueEveningAfterTurn() {
  if (isEveningLimitReached()) {
    askToEndEvening();
  } else if (shouldAskToGoDeeper()) {
    askToGoDeeper();
  } else {
    showNextCard();
  }
}

// ---------------------------------------------------------
// Carte bonus
// ---------------------------------------------------------

// Cosa fare quando la carta bonus è finita (una funzione, decisa da chi mostra la bonus)
let afterBonusAction = null;

/**
 * Mostra una carta bonus e ricorda cosa fare dopo.
 * @param {string} type - "calm" o "breath"
 * @param {Function} thenDo - la funzione da eseguire quando la bonus è finita
 */
function showBonusCard(type, thenDo) {
  afterBonusAction = thenDo;
  const bonusCard = drawBonusCard(type); // sta in gameEngine.js
  saveGame();
  displayCard(bonusCard);
}

/**
 * La carta bonus è finita (fatta o saltata): eseguiamo l'azione rimasta in attesa.
 */
function continueAfterBonus() {
  const action = afterBonusAction;
  afterBonusAction = null;
  action();
}

/**
 * "Metti in sospeso": la carta va da parte e la STESSA persona
 * riceve un'altra carta (il turno non passa).
 */
function skipCardAndDrawAgain() {
  // Carta bonus: "Salta" vuol dire semplicemente riprendere la serata
  if (currentCardKind === "bonus") {
    continueAfterBonus();
    return;
  }

  // Dalle domande in sospeso: la carta resta lì, si torna all'elenco
  if (currentCardSource === "skipped") {
    openSkippedScreen();
    return;
  }

  // Ce lo chiediamo PRIMA di metterla in sospeso
  const wasQuestion = currentCardKind === "question";

  skipCurrentCard(currentPlayer); // ricordiamo chi la stava leggendo

  // Dopo una domanda saltata: un respiro per sciogliere la tensione, poi si prosegue.
  // (Per il riscaldamento non serve: si pesca semplicemente un'altra carta.)
  if (wasQuestion) {
    showBonusCard("breath", showNextCard);
    return;
  }

  showNextCard();
}

/**
 * "Scopri": toglie la copertura alla carta intensa.
 */
function revealCard() {
  setCardCovered(false);
}

// ---------------------------------------------------------
// Scendere di livello (sempre insieme)
// ---------------------------------------------------------

/**
 * La domanda che arriva da sola ogni tanto, durante la serata.
 */
function askToGoDeeper() {
  const thisLevelName = LEVEL_NAMES[currentLevel];
  const nextLevelName = LEVEL_NAMES[currentLevel + 1];

  showPrompt({
    title: "Volete andare più a fondo?",
    text: "Siete in " + thisLevelName + ". Il prossimo livello è " + nextLevelName + ".",
    buttons: [
      { label: "Parliamone", style: "primary", onClick: askConsentToGoDeeper },
      {
        label: "Restiamo in " + thisLevelName,
        style: "ghost",
        onClick: function () {
          stayAtCurrentLevel();
          showNextCard();
        },
      },
    ],
  });
}

/**
 * Prima di scendere: la presentazione del livello e il consenso di entrambi.
 * Si arriva qui dalla domanda automatica oppure dal pulsante "Più a fondo ↓".
 */
function askConsentToGoDeeper() {
  const thisLevelName = LEVEL_NAMES[currentLevel];
  const nextLevel = currentLevel + 1;
  const nextLevelName = LEVEL_NAMES[nextLevel];

  showPrompt({
    title: "Prima di scendere in " + nextLevelName,
    text:
      LEVEL_DESCRIPTIONS[nextLevel] + "\n\n" +
      "Parlatene: vi sentite pronti tutti e due?\n" +
      "Se anche uno solo ha dei dubbi, si resta. Non è una gara.",
    buttons: [
      {
        label: "Siamo pronti tutti e due",
        style: "primary",
        onClick: function () {
          goDeeper();
          showNextCard();
        },
      },
      {
        label: "Restiamo in " + thisLevelName,
        style: "ghost",
        onClick: function () {
          stayAtCurrentLevel();
          saveGame();
          // Se la carta sullo schermo non è stata giocata, la ritroviamo lì
          displayCard(currentCard);
        },
      },
    ],
  });
}

/**
 * Il pulsante "Più a fondo ↓": la carta sullo schermo non viene giocata
 * (resta disponibile per un'altra volta) e si passa al consenso.
 */
function goDeeperFromButton() {
  askConsentToGoDeeper();
}

// ---------------------------------------------------------
// Fine della serata e del viaggio
// ---------------------------------------------------------

/**
 * "Per stasera può bastare": chiudere o continuare?
 */
function askToEndEvening() {
  showPrompt({
    title: "Per stasera può bastare",
    text:
      "Avete fatto " + getEveningCardCount() + " carte.\n" +
      "Potete chiudere qui e riprendere un'altra sera, oppure continuare ancora un po'.",
    buttons: [
      { label: "Chiudiamo qui", style: "primary", onClick: showClosingRitual },
      {
        label: "Continuiamo",
        style: "ghost",
        onClick: function () {
          continueEvening();
          showNextCard();
        },
      },
    ],
  });
}

/**
 * Il rituale di chiusura: si va a dormire più vicini, non più scossi.
 */
function showClosingRitual() {
  showPrompt({
    title: "Prima di salutarvi",
    text:
      "Ognuno dica all'altro una cosa che ha apprezzato di lui o di lei stasera.\n\n" +
      "Poi, se vi va, un abbraccio.",
    buttons: [
      { label: "Buonanotte 🌙", style: "primary", onClick: function () { showScreen("screenHome"); } },
    ],
  });
}

/**
 * "Chiudi la serata": se avete già giocato qualche carta, prima il rituale di chiusura.
 */
function closeEvening() {
  if (currentCardSource === "skipped") {
    openSkippedScreen();
    return;
  }

  if (getEveningCardCount() > 0) {
    showClosingRitual();
  } else {
    showScreen("screenHome");
  }
}

/**
 * Il mazzo è finito: ricominciare da capo o tornare alla home?
 */
function askToRestartJourney() {
  showPrompt({
    title: "Avete completato il viaggio ✨",
    text:
      "Avete attraversato tutte le domande.\n" +
      "Potete ricominciare da capo: le stesse domande, tra qualche mese, possono avere risposte nuove.",
    buttons: [
      {
        label: "Ricominciamo",
        style: "primary",
        onClick: function () {
          restartJourney();
          showLevelIntro(currentLevel, beginEvening);
        },
      },
      { label: "Torna alla home", style: "ghost", onClick: function () { showScreen("screenHome"); } },
    ],
  });
}

// =========================================================
// DOMANDE IN SOSPESO E PREFERITE
// =========================================================

/**
 * Apre l'elenco delle domande in sospeso.
 */
function openSkippedScreen() {
  // Passiamo a renderSkippedList la funzione da usare quando si sceglie una carta
  renderSkippedList(openSkippedCard);
  showScreen("screenSkipped");
}

/**
 * Riapre una domanda in sospeso e la mostra come una carta normale.
 * @param {object} card
 */
function openSkippedCard(card) {
  currentCard = card;
  currentCardKind = "question";
  currentCardSource = "skipped";

  // La carta si riaccende del colore di chi l'aveva messa in sospeso:
  // è lui o lei che la rilegge all'altro
  if (skippedBy[card.id]) {
    currentPlayer = skippedBy[card.id];
  }

  applyTurnColors();
  displayCard(card);
}

// Il filtro scelto nella pagina delle preferite (si ricorda finché la pagina è aperta)
let currentFavoritesFilter = "all";

/**
 * Apre la pagina delle preferite con il filtro attuale.
 */
function openFavoritesScreen() {
  renderFavoritesList(currentFavoritesFilter);
  showScreen("screenFavorites");
}

/**
 * Tocca il cuore di un giocatore sulla carta attuale.
 * @param {string} playerKey - "first" o "second"
 */
function onHeartClick(playerKey) {
  toggleFavorite(currentCard.id, playerKey); // sta in storage.js (e salva)
  updateHearts(currentCard);                 // sta in ui.js
}

/**
 * Le pagine "In sospeso" e "Preferite" hanno senso solo se i colori sono già stati scelti.
 * @returns {boolean}
 */
function arePlayersChosen() {
  return players.first !== null && players.second !== null;
}

// =========================================================
// GUIDA "COME SI GIOCA"
// =========================================================

// A che scheda siamo, quante schede ha la guida aperta, e dove tornare alla fine
let tutorialStepIndex = 0;
let tutorialTotalSteps = TUTORIAL_STEPS.length;
let tutorialReturnScreen = "screenHome";

/**
 * Apre la guida dalla prima scheda.
 * @param {string} returnScreen - la schermata da mostrare alla fine (es. "screenSetup")
 * @param {boolean} introOnly - true = solo le prime 2 schede (la primissima volta)
 */
function openTutorial(returnScreen, introOnly) {
  tutorialStepIndex = 0;
  tutorialTotalSteps = introOnly ? INTRO_STEP_COUNT : TUTORIAL_STEPS.length;
  tutorialReturnScreen = returnScreen;
  showTutorialStep();
  showScreen("screenTutorial");
}

/**
 * Disegna la scheda attuale. L'ultimo pulsante cambia scritta
 * a seconda di dove si torna: "Scegliamo i colori", "Torniamo a giocare"…
 */
function showTutorialStep() {
  let lastButtonLabel = "Ho capito";
  if (tutorialReturnScreen === "screenSetup") {
    lastButtonLabel = "Scegliamo i colori";
  } else if (tutorialReturnScreen === "screenGame") {
    lastButtonLabel = "Torniamo a giocare";
  }
  renderTutorialStep(tutorialStepIndex, tutorialTotalSteps, lastButtonLabel); // sta in ui.js
}

/**
 * "Avanti": scheda successiva, oppure fine della guida.
 */
function nextTutorialStep() {
  const isLastStep = tutorialStepIndex === tutorialTotalSteps - 1;
  if (isLastStep) {
    closeTutorial();
    return;
  }
  tutorialStepIndex = tutorialStepIndex + 1;
  showTutorialStep();
  window.scrollTo(0, 0);
}

/**
 * "Indietro": scheda precedente.
 */
function previousTutorialStep() {
  if (tutorialStepIndex > 0) {
    tutorialStepIndex = tutorialStepIndex - 1;
    showTutorialStep();
    window.scrollTo(0, 0);
  }
}

/**
 * Fine della guida (o "Salta"): la segniamo come vista e torniamo dove serve.
 * Se si torna al gioco, la carta è ancora lì, esattamente com'era.
 */
function closeTutorial() {
  tutorialSeen = true;
  saveGame();
  showScreen(tutorialReturnScreen);
}

/**
 * "Nuova serata": la primissima volta, prima la guida e poi la scelta dei colori.
 */
function onNewEveningClick() {
  if (!tutorialSeen) {
    openTutorial("screenSetup", true); // la prima volta: solo le 2 schede essenziali
  } else {
    showScreen("screenSetup");
  }
}

// =========================================================
// AVVIO
// Grazie a "defer" nell'HTML, quando arriviamo qui la pagina è già pronta.
// =========================================================

/**
 * Carica le carte e scrive sulla home se è andato tutto bene.
 */
async function prepareDeck() {
  const statusLabel = document.getElementById("deckStatus");

  // loadAllCards() sta in gameEngine.js
  const loadedOk = await loadAllCards();

  if (loadedOk) {
    const totalCards = deck.questions.length + deck.warmups.length + deck.bonuses.length;
    statusLabel.textContent = totalCards + " carte pronte";
    updateJourneyStatus(); // ora che le carte ci sono, possiamo dire a che punto siete

    // Controllo dei dati: ci aspettiamo 50 domande per livello
    console.log(
      "Domande per livello →",
      LEVEL_NAMES[1] + ":", countQuestionsByLevel(1),
      "| " + LEVEL_NAMES[2] + ":", countQuestionsByLevel(2),
      "| " + LEVEL_NAMES[3] + ":", countQuestionsByLevel(3)
    );
  } else {
    statusLabel.textContent = "Non riesco a caricare le carte. L'app è aperta con Live Server?";
    statusLabel.classList.add("deckStatus--error");
  }
}

/**
 * Registra il service worker, il file che fa funzionare l'app offline.
 * Il browser lo accetta solo su siti sicuri (https) o su "localhost":
 * con l'indirizzo 192.168… di Live Server non parte, ed è normale.
 */
function registerServiceWorker() {
  // "serviceWorker" in navigator → il browser sa cosa sono i service worker?
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.register("serviceWorker.js").catch(function (error) {
    console.info("Service worker non attivo (normale in locale):", error.message);
  });
}

// Prima di tutto, rileggiamo i dati salvati sul telefono (storage.js)
loadGame();
registerServiceWorker();

setupNavigationButtons();
renderColorPickers();
prepareDeck();

document.getElementById("buttonStartEvening").addEventListener("click", startEvening);
document.getElementById("buttonNextTurn").addEventListener("click", goToNextTurn);
document.getElementById("buttonSkipCard").addEventListener("click", skipCardAndDrawAgain);
document.getElementById("buttonRevealCard").addEventListener("click", revealCard);
document.getElementById("buttonSkipCovered").addEventListener("click", skipCardAndDrawAgain);
document.getElementById("buttonGoDeeper").addEventListener("click", goDeeperFromButton);
document.getElementById("buttonCloseEvening").addEventListener("click", closeEvening);

// Guida "Come si gioca"
document.getElementById("buttonNewEvening").addEventListener("click", onNewEveningClick);
document.getElementById("buttonOpenTutorial").addEventListener("click", function () {
  openTutorial("screenHome");
});
document.getElementById("buttonHelp").addEventListener("click", function () {
  openTutorial("screenGame");
});
document.getElementById("tutorialNext").addEventListener("click", nextTutorialStep);
document.getElementById("tutorialBack").addEventListener("click", previousTutorialStep);
document.getElementById("tutorialSkip").addEventListener("click", closeTutorial);

// Cuori sulla carta
document.getElementById("heartFirst").addEventListener("click", function () {
  onHeartClick("first");
});
document.getElementById("heartSecond").addEventListener("click", function () {
  onHeartClick("second");
});

// Home: "In sospeso" e "Preferite". Se i colori non sono ancora scelti,
// portiamo prima alla scelta dei colori.
document.getElementById("buttonOpenSkipped").addEventListener("click", function () {
  if (arePlayersChosen()) {
    openSkippedScreen();
  } else {
    showScreen("screenSetup");
  }
});
document.getElementById("buttonOpenFavorites").addEventListener("click", function () {
  if (arePlayersChosen()) {
    openFavoritesScreen();
  } else {
    showScreen("screenSetup");
  }
});

// Filtri delle preferite
document.querySelectorAll(".filterButton").forEach(function (button) {
  button.addEventListener("click", function () {
    currentFavoritesFilter = button.dataset.filter;
    renderFavoritesList(currentFavoritesFilter);
  });
});

// "Ricomincia da zero": chiediamo conferma, perché si perde tutto
document.getElementById("buttonEraseData").addEventListener("click", function () {
  const confirmed = confirm(
    "Vuoi davvero cancellare tutto? Colori, carte giocate, in sospeso e preferite verranno eliminati."
  );
  if (confirmed) {
    eraseAllData();
  }
});

console.log("Luna avviata 🌙");
