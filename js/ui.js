// =========================================================
// ui.js — come si disegnano le cose sullo schermo
// Qui non c'è logica di gioco: solo "prendo una carta e la mostro".
// =========================================================

// I cuori. Il carattere invisibile \uFE0E dice al telefono: "disegnalo come testo,
// non come emoji". Senza, alcuni Android lo mostrano sempre rosso, ignorando il colore.
const HEART_FULL = "♥\uFE0E";
const HEART_EMPTY = "♡\uFE0E";

// Le scritte sotto le domande (e il riscaldamento).
// Regola del gioco: chi tiene il telefono LEGGE la carta ad alta voce all'altro.
// La chiave (self, together, guessOther) è quella scritta nei file JSON.
const MODE_LABELS = {
  // Etichette corte (una riga): i dettagli li spiegano i pop-up e la guida
  self: "🗣️ Leggila all'altro",
  together: "🤝 Rispondete tutti e due",
  guessOther: "🔮 L'altro indovina la tua risposta",
};

// Le carte bonus invece sono azioni per chi tiene il telefono
const BONUS_MODE_LABELS = {
  self: "🎯 Tocca a te",
  together: "🤝 Insieme",
  guessOther: "🤝 Insieme",
};

/**
 * Trasforma l'intensità (1, 2, 3) nei pallini: ●○○, ●●○, ●●●.
 * .repeat(n) ripete un testo n volte: "●".repeat(2) → "●●"
 * @param {number} intensity
 * @returns {string}
 */
function formatIntensity(intensity) {
  const filledDots = "●".repeat(intensity);
  const emptyDots = "○".repeat(3 - intensity);
  return filledDots + emptyDots;
}

/**
 * Sceglie la scritta in alto a sinistra sulla carta.
 * @param {object} card
 * @param {string} kind - "warmup" o "question"
 * @returns {string}
 */
function getCardHeaderLabel(card, kind) {
  if (kind === "warmup") {
    // Es. "Riscaldamento · 1 di 3": si capisce quanto manca all'inizio vero
    return "Riscaldamento · " + (evening.warmupsDone + 1) + " di " + WARMUP_CARDS_PER_EVENING;
  }
  if (kind === "bonus") {
    return card.type === "calm" ? "🌙 Un momento di calma" : "☀️ Un respiro";
  }
  if (card.isFinal) {
    return "✨ Carta finale";
  }
  return LEVEL_NAMES[card.level];
}

/**
 * Mostra una carta sullo schermo.
 * @param {object} card - una carta domanda o di riscaldamento
 * @param {string} kind - "warmup" o "question"
 */
function renderCard(card, kind) {
  const cardElement = document.getElementById("card");

  document.getElementById("cardLevel").textContent = getCardHeaderLabel(card, kind);

  // Le carte di riscaldamento e la carta finale non mostrano i pallini
  const showsIntensity = kind === "question" && !card.isFinal;
  document.getElementById("cardIntensity").textContent = showsIntensity
    ? formatIntensity(card.intensity)
    : "";

  // textContent (e non innerHTML) inserisce il testo così com'è:
  // è più sicuro, perché non interpreta eventuali simboli come codice HTML.
  document.getElementById("cardText").textContent = card.text;
  const labels = kind === "bonus" ? BONUS_MODE_LABELS : MODE_LABELS;
  document.getElementById("cardMode").textContent = labels[card.mode];

  // Se si risponde insieme, la carta prende i colori di entrambi.
  // classList.toggle(classe, condizione) aggiunge la classe se la condizione è vera,
  // e la toglie se è falsa: una riga invece di un if/else.
  cardElement.classList.toggle("card--together", card.mode === "together");

  // Le carte bonus hanno un aspetto un po' diverso: sono una pausa, non una domanda
  cardElement.classList.toggle("card--bonus", kind === "bonus");

  // Le carte intense arrivano coperte, con l'avvertimento
  const isIntense = showsIntensity && card.intensity === 3;
  setCardCovered(isIntense);

  // I cuori ci sono solo sulle domande (non sul riscaldamento)
  document.getElementById("cardHearts").hidden = kind !== "question";
  updateHearts(card);
}

/**
 * Disegna i due cuori della carta: pieno (♥) se è tra le preferite
 * di quel giocatore, vuoto (♡) se no. Ognuno nel colore del suo giocatore.
 * @param {object} card
 */
function updateHearts(card) {
  drawHeart("heartFirst", card.id, "first");
  drawHeart("heartSecond", card.id, "second");
}

/**
 * Disegna un singolo cuore.
 * @param {string} buttonId
 * @param {string} cardId
 * @param {string} playerKey - "first" o "second"
 */
function drawHeart(buttonId, cardId, playerKey) {
  const heartButton = document.getElementById(buttonId);
  const playerColor = findColorById(players[playerKey]); // sta in script.js

  heartButton.textContent = isFavorite(cardId, playerKey) ? HEART_FULL : HEART_EMPTY;
  heartButton.style.color = playerColor.hex;
  heartButton.setAttribute("aria-label", "Preferita di " + playerColor.name);
}

/**
 * Copre o scopre la carta.
 * Quando è coperta, nascondiamo anche i pulsanti di gioco:
 * prima si sceglie "Scopri" o "Mettila in sospeso".
 * @param {boolean} isCovered
 */
function setCardCovered(isCovered) {
  document.getElementById("card").classList.toggle("card--covered", isCovered);
  document.getElementById("gameActions").hidden = isCovered;
}

/**
 * Mostra la schermata dei messaggi con titolo, testo e uno o più pulsanti.
 *
 * Riceve un oggetto con le "istruzioni", per esempio:
 * {
 *   title: "Volete andare più a fondo?",
 *   text: "…",
 *   buttons: [
 *     { label: "Sì", style: "primary", onClick: function () { … } },
 *     { label: "No", style: "ghost",   onClick: function () { … } },
 *   ],
 * }
 * onClick è una funzione: la eseguiamo quando si preme quel pulsante.
 * style può essere "primary" (pieno, colorato) o "ghost" (solo testo).
 *
 * @param {object} options
 */
function showPrompt(options) {
  document.getElementById("promptTitle").textContent = options.title;
  document.getElementById("promptText").textContent = options.text;

  const buttonsContainer = document.getElementById("promptButtons");

  // Svuotiamo i pulsanti del messaggio precedente
  buttonsContainer.innerHTML = "";

  // E creiamo quelli nuovi, uno per ogni elemento dell'array "buttons"
  options.buttons.forEach(function (buttonInfo) {
    const button = document.createElement("button");
    button.className = "button button--" + buttonInfo.style;
    button.textContent = buttonInfo.label;
    button.addEventListener("click", buttonInfo.onClick);
    buttonsContainer.appendChild(button);
  });

  showScreen("screenPrompt");
}

/**
 * Mostra il pulsante "Più a fondo ↓" solo quando ha senso:
 * durante le domande (non nel riscaldamento) e se esiste un livello più profondo.
 */
function updateGoDeeperButton() {
  const isQuestion = currentCardKind === "question";
  document.getElementById("buttonGoDeeper").hidden = !(isQuestion && canGoDeeper());
}

// =========================================================
// ELENCHI
// =========================================================

/**
 * Crea il riquadro di una carta per gli elenchi.
 * @param {object} card
 * @returns {HTMLElement} l'elemento pronto da inserire nella pagina
 */
function createListItem(card) {
  const item = document.createElement("article");
  item.className = "listItem";

  const meta = document.createElement("p");
  meta.className = "listItemMeta";
  meta.textContent = LEVEL_NAMES[card.level] + " · " + formatIntensity(card.intensity);

  const text = document.createElement("p");
  text.className = "listItemText";
  text.textContent = card.text;

  item.appendChild(meta);
  item.appendChild(text);
  return item;
}

/**
 * Mostra un messaggio al posto dell'elenco, quando è vuoto.
 * @param {HTMLElement} container
 * @param {string} message
 */
function showEmptyMessage(container, message) {
  const emptyMessage = document.createElement("p");
  emptyMessage.className = "emptyListMessage";
  emptyMessage.textContent = message;
  container.appendChild(emptyMessage);
}

/**
 * Disegna l'elenco delle domande in sospeso.
 * @param {Function} onOpenCard - cosa fare quando si sceglie una carta (riceve la carta)
 */
function renderSkippedList(onOpenCard) {
  const container = document.getElementById("skippedList");
  container.innerHTML = "";

  if (skippedCardIds.length === 0) {
    showEmptyMessage(container, "Nessuna domanda in sospeso.");
    return;
  }

  skippedCardIds.forEach(function (cardId) {
    const card = findQuestionById(cardId);
    if (card === undefined) {
      return; // per sicurezza: codice sconosciuto, lo saltiamo
    }

    const item = createListItem(card);

    const openButton = document.createElement("button");
    openButton.className = "button button--outline listItemAction";
    openButton.textContent = "Rispondiamo adesso";
    openButton.addEventListener("click", function () {
      onOpenCard(card);
    });

    item.appendChild(openButton);
    container.appendChild(item);
  });
}

/**
 * Disegna l'elenco delle preferite, secondo il filtro scelto.
 * @param {string} filter - "first", "second" o "both"
 */
function renderFavoritesList(filter) {
  // Etichette dei filtri: i nomi dei colori dei giocatori
  document.getElementById("filterFirst").textContent = HEART_FULL + " " + findColorById(players.first).name;
  document.getElementById("filterSecond").textContent = HEART_FULL + " " + findColorById(players.second).name;

  // Evidenziamo il filtro attivo
  document.querySelectorAll(".filterButton").forEach(function (button) {
    button.classList.toggle("filterButton--active", button.dataset.filter === filter);
  });

  const container = document.getElementById("favoritesList");
  container.innerHTML = "";

  const cards = getFavoriteCards(filter);

  if (cards.length === 0) {
    showEmptyMessage(container, "Ancora nessuna carta con il cuore qui.");
    return;
  }

  cards.forEach(function (card) {
    const item = createListItem(card);

    // Sotto il testo, i cuori di chi l'ha scelta
    const hearts = document.createElement("p");
    hearts.className = "listItemMeta";
    ["first", "second"].forEach(function (playerKey) {
      if (isFavorite(card.id, playerKey)) {
        const heart = document.createElement("span");
        heart.textContent = HEART_FULL + " ";
        heart.style.color = findColorById(players[playerKey]).hex;
        hearts.appendChild(heart);
      }
    });

    item.appendChild(hearts);
    container.appendChild(item);
  });
}

/**
 * Scrive sulla home a che punto è il viaggio.
 */
function updateJourneyStatus() {
  const label = document.getElementById("journeyStatus");

  if (usedCardIds.length === 0) {
    label.textContent = "";
    return;
  }

  const progress = getJourneyProgress();
  label.textContent =
    "Siete in " + LEVEL_NAMES[currentLevel] +
    " · " + progress.played + " domande su " + progress.total;
}

// =========================================================
// GUIDA "COME SI GIOCA"
// Ogni scheda è un oggetto: titolo, testo e (facoltativo) un disegno di esempio.
// Per cambiare la guida basta modificare questo array.
// =========================================================
const TUTORIAL_STEPS = [
  {
    title: "Benvenuti in Luna",
    text:
      "Luna è un gioco di domande per ritrovarsi in coppia.\n\n" +
      "Non ci sono punti, né vincitori, né tempi. Si gioca in due, " +
      "con un solo telefono che passa di mano in mano.\n\n" +
      "L'unica regola vera: ascoltarsi.",
  },
  {
    title: "Uno chiede, l'altro risponde",
    visual: "colors",
    text:
      "All'inizio ognuno sceglie un colore.\n\n" +
      "La carta si illumina del colore di chi tiene il telefono: " +
      "tocca a lui o a lei leggere la domanda ad alta voce. Risponde l'altra persona.\n\n" +
      "Poi «Fatto, passa»: il telefono passa all'altro, e adesso è lui o lei a leggere.\n\n" +
      "Quando la carta è metà di un colore e metà dell'altro, rispondete tutti e due.",
  },
  {
    title: "Chi risponde",
    text:
      "Sotto ogni domanda è scritto chi risponde:\n\n" +
      "🗣️ Leggila all'altro\nLeggi la domanda: risponde l'altra persona.\n\n" +
      "🤝 Rispondete tutti e due\nLeggi la domanda: rispondete entrambi, uno dopo l'altro.\n\n" +
      "🔮 Fallo indovinare\nLeggi la domanda: l'altra persona prova a indovinare cosa risponderesti tu. " +
      "Poi le dici se ci ha preso.",
  },
  {
    title: "Quanto è profonda",
    text:
      "I pallini in alto sulla carta dicono quanto va a fondo la domanda:\n\n" +
      "●○○  leggera\n" +
      "●●○  più personale\n" +
      "●●●  intensa\n\n" +
      "Le carte intense arrivano coperte: decidete voi se scoprirle o metterle in sospeso.",
  },
  {
    title: "Una serata",
    text:
      "Ogni volta che aprite Luna inizia una serata:\n\n" +
      "1. Riscaldamento\n3 carte leggere, per arrivare e raccontarvi la giornata.\n\n" +
      "2. Come vi sentite stasera?\nScegliete insieme quanto andare a fondo.\n\n" +
      "3. Le domande\nSalgono piano, arrivano al cuore, poi scendono.\n\n" +
      "4. Chiusura\nDopo circa 12 carte, un piccolo rituale per salutarvi.\n\n" +
      "Ogni tanto arriva una carta con il bordo tratteggiato: è una pausa " +
      "(un gesto, un respiro). Potete farla o saltarla.",
  },
  {
    title: "Il viaggio",
    text:
      "Serata dopo serata, si scende più in profondità, in tre livelli:\n\n" +
      "🪞 Specchio\nCome ti vedo, come mi vedi.\n\n" +
      "🌱 Radici\nSogni, paure, cose non dette.\n\n" +
      "🏡 Rifugio\nSentirsi al sicuro, prendersi cura l'uno dell'altra.\n\n" +
      "Si passa al livello successivo solo quando siete pronti tutti e due.",
  },
  {
    title: "I pulsanti",
    text:
      "Fatto, passa\nLa risposta è arrivata: il telefono passa all'altro, che ora legge a te.\n\n" +
      "Metti in sospeso\nLa domanda è troppo difficile adesso? La ritrovate nella pagina \"In sospeso\".\n\n" +
      "♡\nIl cuore del tuo colore: la carta finisce tra le Preferite.\n\n" +
      "Più a fondo ↓\nPer passare al livello successivo, se vi sentite pronti.\n\n" +
      "?\nPer rileggere questa guida durante il gioco.",
  },
];

/**
 * Prende i colori da mostrare negli esempi della guida:
 * quelli scelti dai giocatori, oppure azzurro e lilla se non li hanno ancora scelti.
 * @returns {object} { first: {name, hex}, second: {name, hex} }
 */
function getTutorialColors() {
  if (players.first !== null && players.second !== null) {
    return { first: findColorById(players.first), second: findColorById(players.second) };
  }
  return {
    first: { name: "uno", hex: "#6fd0ff" },
    second: { name: "l'altro", hex: "#a08cff" },
  };
}

/**
 * Crea una mini carta di esempio.
 * Il colore arriva tramite una variabile CSS (--miniColor) impostata qui.
 */
function createMiniCard(label, hex, otherHex) {
  const miniCard = document.createElement("div");
  miniCard.className = "miniCard";
  miniCard.textContent = label;
  miniCard.style.setProperty("--miniColor", hex);

  if (otherHex) {
    miniCard.classList.add("miniCard--together");
    miniCard.style.setProperty("--miniColorOther", otherHex);
  }
  return miniCard;
}

// Quante schede si vedono la prima volta: solo le prime 2, il minimo per partire.
// Il resto lo spiegano i pop-up, nel momento in cui serve.
const INTRO_STEP_COUNT = 2;

/**
 * Disegna una scheda della guida.
 * @param {number} stepIndex - quale scheda (0 = la prima)
 * @param {number} totalSteps - quante schede ha questa guida (2 all'inizio, 7 quella completa)
 * @param {string} lastButtonLabel - la scritta del pulsante nell'ultima scheda
 */
function renderTutorialStep(stepIndex, totalSteps, lastButtonLabel) {
  const step = TUTORIAL_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  document.getElementById("tutorialCounter").textContent =
    (stepIndex + 1) + " di " + totalSteps;
  document.getElementById("tutorialTitle").textContent = step.title;
  document.getElementById("tutorialText").textContent = step.text;

  // Il disegno di esempio (solo nella scheda dei colori)
  const visual = document.getElementById("tutorialVisual");
  visual.innerHTML = "";
  if (step.visual === "colors") {
    const colors = getTutorialColors();
    visual.appendChild(createMiniCard("Legge " + colors.first.name, colors.first.hex));
    visual.appendChild(createMiniCard("Legge " + colors.second.name, colors.second.hex));
    visual.appendChild(createMiniCard("Insieme", colors.first.hex, colors.second.hex));
  }

  // I puntini: uno per scheda, quello attuale acceso
  const dots = document.getElementById("tutorialDots");
  dots.innerHTML = "";
  TUTORIAL_STEPS.slice(0, totalSteps).forEach(function (unusedStep, index) {
    const dot = document.createElement("span");
    dot.className = "tutorialDot";
    if (index === stepIndex) {
      dot.classList.add("tutorialDot--active");
    }
    dots.appendChild(dot);
  });

  // "Indietro" non serve sulla prima scheda; "Salta" non serve sull'ultima.
  // visibility (e non hidden) per non far spostare l'altro pulsante.
  document.getElementById("tutorialBack").style.visibility = isFirst ? "hidden" : "visible";
  document.getElementById("tutorialSkip").style.visibility = isLast ? "hidden" : "visible";
  document.getElementById("tutorialNext").textContent = isLast ? lastButtonLabel : "Avanti";
}

// =========================================================
// POP-UP "LA PRIMA VOLTA CHE…"
// Piccole spiegazioni che compaiono UNA volta sola, nel momento in cui servono.
// Ognuna ha: un codice (key), quando compare (appliesTo), titolo e testo.
// Quelle già viste sono salvate in seenHints (storage.js).
// =========================================================
const FIRST_TIME_HINTS = [
  {
    key: "warmup",
    appliesTo: function (card, kind) { return kind === "warmup"; },
    title: "Si comincia piano",
    text:
      "Le prime 3 carte sono un riscaldamento: domande leggere per arrivare alla serata.\n\n" +
      "Chi tiene il telefono legge la carta ad alta voce all'altro, che risponde. " +
      "Poi «Fatto, passa».",
  },
  {
    key: "readAloud",
    appliesTo: function (card, kind) { return kind === "question" && card.mode === "self"; },
    title: "Leggila all'altro",
    text:
      "La carta ha il tuo colore: leggi la domanda ad alta voce. Risponde l'altra persona.\n\n" +
      "Quando ha finito, premi «Fatto, passa» e dagli il telefono.",
  },
  {
    key: "together",
    appliesTo: function (card, kind) { return kind !== "bonus" && card.mode === "together"; },
    title: "Rispondete insieme",
    text: "Quando la carta ha i vostri due colori, la leggi ad alta voce e rispondete tutti e due, uno dopo l'altro.",
  },
  {
    key: "guess",
    appliesTo: function (card, kind) { return kind !== "bonus" && card.mode === "guessOther"; },
    title: "Fallo indovinare",
    text:
      "Leggi la domanda: l'altra persona prova a indovinare cosa risponderesti tu.\n\n" +
      "Poi le dici se ci ha preso, e com'è davvero.",
  },
  {
    key: "covered",
    appliesTo: function (card, kind) {
      return kind === "question" && !card.isFinal && card.intensity === 3;
    },
    title: "Una carta intensa",
    text:
      "Le domande più profonde arrivano coperte.\n\n" +
      "Guardatevi e decidete insieme: potete scoprirla, oppure metterla in sospeso e riprenderla un'altra volta.",
  },
  {
    key: "bonus",
    appliesTo: function (card, kind) { return kind === "bonus"; },
    title: "Una pausa",
    text: "Le carte con il bordo tratteggiato sono una pausa: un gesto, un respiro. Fatela o saltatela, come vi va.",
  },
  {
    key: "hearts",
    appliesTo: function (card, kind) { return kind === "question" && card.intensity < 3; },
    title: "Le vostre preferite",
    text:
      "Se una domanda vi ha colpito, toccate il vostro cuore ♡: ognuno ha il suo, nel suo colore.\n\n" +
      "Le ritrovate nella pagina «Preferite».",
  },
];

/**
 * Trova i pop-up da mostrare per questa carta: quelli che la riguardano e non sono ancora stati visti.
 * @param {object} card
 * @param {string} kind
 * @returns {Array}
 */
function getHintsToShow(card, kind) {
  return FIRST_TIME_HINTS.filter(function (hint) {
    return hint.appliesTo(card, kind) && !seenHints.includes(hint.key);
  });
}

/**
 * Mostra i pop-up uno dopo l'altro. Ogni "Ho capito" lo segna come visto e passa al successivo.
 * @param {Array} hints
 */
function showHints(hints) {
  const overlay = document.getElementById("hintOverlay");

  if (hints.length === 0) {
    overlay.hidden = true;
    return;
  }

  // Il primo della lista
  const hint = hints[0];
  document.getElementById("hintTitle").textContent = hint.title;
  document.getElementById("hintText").textContent = hint.text;
  overlay.hidden = false;

  document.getElementById("hintOkButton").onclick = function () {
    markHintAsSeen(hint.key); // sta in storage.js
    // slice(1) = tutti tranne il primo: mostriamo i rimanenti
    showHints(hints.slice(1));
  };
}
