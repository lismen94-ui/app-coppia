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
  self: "🗣️ Leggila all'altra persona",
  together: "🤝 Rispondete a turno",
  guessOther: "🔮 Fai indovinare la tua risposta",
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

  // Ogni volta che si disegna una carta si toglie l'aspetto "rivista":
  // lo rimette showReviewCard() quando serve
  cardElement.classList.remove("card--review");

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
 * @param {string} [colorHex] - facoltativo: il colore del bordo (es. di chi l'ha messa in sospeso)
 * @returns {HTMLElement} l'elemento pronto da inserire nella pagina
 */
function createListItem(card, colorHex) {
  const item = document.createElement("article");
  item.className = "listItem";

  if (colorHex) {
    item.classList.add("listItem--colored");
    item.style.setProperty("--itemColor", colorHex);
  }

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

    // Il colore di chi l'ha messa in sospeso (se lo sappiamo)
    const ownerKey = skippedBy[card.id];
    const ownerColor = ownerKey ? findColorById(players[ownerKey]) : null;
    const item = createListItem(card, ownerColor ? ownerColor.hex : null);

    // Una riga che dice chi la stava leggendo
    if (ownerColor) {
      const owner = document.createElement("p");
      owner.className = "listItemMeta";
      owner.textContent = "Messa in sospeso da " + ownerColor.name;
      owner.style.color = ownerColor.hex;
      item.appendChild(owner);
    }

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
 * @param {string} filter - "first", "second" o "all"
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
    title: "Un benvenuto a voi due",
    text:
      "Luna è un gioco di domande per ritrovarsi in coppia.\n\n" +
      "Non ci sono punti, né vincitori, né tempi. Si gioca in due, " +
      "con un solo telefono che passa di mano in mano.\n\n" +
      "L'unica regola vera: ascoltarsi.",
  },
  {
    title: "Chi legge chiede, chi ascolta risponde",
    visual: "colors",
    text:
      "All'inizio ogni persona sceglie un colore.\n\n" +
      "La carta si illumina del colore di chi tiene il telefono: " +
      "è il suo turno di leggere la domanda ad alta voce. Risponde l'altra persona.\n\n" +
      "Poi «Fatto, passa»: il telefono passa all'altra persona, che adesso legge a sua volta.\n\n" +
      "Quando la carta è metà di un colore e metà dell'altro, rispondete a turno.",
  },
  {
    title: "Chi risponde",
    text:
      "Sotto ogni domanda è scritto chi risponde:\n\n" +
      "🗣️ Leggila all'altra persona\nLeggi la domanda: risponde chi ascolta.\n\n" +
      "🤝 Rispondete a turno\nLeggi la domanda: poi rispondete, una persona alla volta.\n\n" +
      "🔮 Fai indovinare la tua risposta\nLeggi la domanda: l'altra persona prova a indovinare cosa risponderesti tu. " +
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
      "🏡 Rifugio\nSentirsi al sicuro, prendersi cura a vicenda.\n\n" +
      "Si passa al livello successivo solo quando lo scegliete insieme.",
  },
  {
    title: "I pulsanti",
    text:
      "Fatto, passa\nLa risposta è arrivata: il telefono passa all'altra persona, che ora legge a te.\n\n" +
      "Metti in sospeso\nLa domanda è troppo difficile adesso? La ritrovate nella pagina \"In sospeso\".\n\n" +
      "♡\nIl cuore del tuo colore: la carta finisce tra le Preferite.\n\n" +
      "⋯ Altro\nUna pausa quando serve, il passaggio al livello successivo quando ve la sentite, " +
      "e la chiusura della serata.\n\n" +
      "‹\nPer rivedere le carte già giocate stasera.\n\n" +
      "I puntini in alto\nQuante carte mancano alla fine della serata.\n\n" +
      "?\nPer rileggere questa guida durante il gioco.\n\n" +
      "Un dubbio su una carta? Toccate le scritte (il livello, i pallini, l'etichetta): " +
      "compare una piccola spiegazione.",
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
    first: { name: "Azzurro", hex: "#6fd0ff" },
    second: { name: "Lilla", hex: "#a08cff" },
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
// FUMETTI DI SPIEGAZIONE (a richiesta)
// Toccando una scritta sulla carta compare un piccolo fumetto con una frase.
// Niente si apre da solo: la spiegazione arriva solo quando la chiedete voi.
// =========================================================

// Cosa dicono i fumetti per ogni modalità (la chiave è quella dei file JSON)
const MODE_EXPLANATIONS = {
  self: "Leggi la domanda ad alta voce: risponde l'altra persona. Poi «Fatto, passa».",
  together: "Leggi la domanda: poi rispondete a turno, una persona alla volta.",
  guessOther: "Leggi la domanda: l'altra persona prova a indovinare cosa risponderesti tu. Poi le dici se ci ha preso.",
};

const BONUS_MODE_EXPLANATIONS = {
  self: "Questa la fa chi tiene il telefono.",
  together: "Questa la fate insieme.",
  guessOther: "Questa la fate insieme.",
};

// Una frase per livello, per il fumetto sul nome del livello
const LEVEL_SHORT_EXPLANATIONS = {
  1: "Specchio, il primo livello: come ti vedo, come mi vedi.",
  2: "Radici, il secondo livello: sogni, paure, cose non dette.",
  3: "Rifugio, il terzo livello: sentirsi al sicuro, prendersi cura a vicenda.",
};

// Per far sparire il fumetto da solo dopo qualche secondo
let tooltipTimer = null;

/**
 * Sceglie la frase del fumetto per una parte della carta.
 * @param {string} part - "level", "intensity" o "mode"
 * @param {object} card - la carta mostrata
 * @param {string} kind - "warmup", "question" o "bonus"
 * @returns {string}
 */
function getExplanation(part, card, kind) {
  if (part === "intensity") {
    return "I pallini dicono quanto va a fondo la domanda: ●○○ leggera, ●●○ più personale, ●●● intensa.";
  }

  if (part === "mode") {
    return kind === "bonus" ? BONUS_MODE_EXPLANATIONS[card.mode] : MODE_EXPLANATIONS[card.mode];
  }

  // part === "level": dipende dal tipo di carta
  if (kind === "warmup") {
    return "Riscaldamento: 3 carte leggere per arrivare alla serata e raccontarvi la giornata.";
  }
  if (kind === "bonus") {
    return "Una pausa: un gesto o un respiro, per restare in contatto. Fatela o saltatela, come vi va.";
  }
  if (card.isFinal) {
    return "L'ultima carta del viaggio.";
  }
  return LEVEL_SHORT_EXPLANATIONS[card.level];
}

/**
 * Mostra il fumetto appena sotto un elemento.
 * @param {HTMLElement} element - la scritta toccata
 * @param {string} text - la spiegazione
 */
function showTooltip(element, text) {
  const tooltip = document.getElementById("tooltip");
  document.getElementById("tooltipText").textContent = text;
  tooltip.hidden = false;

  // getBoundingClientRect() dice dove si trova l'elemento sullo schermo:
  // mettiamo il fumetto 10 pixel più sotto, centrato e senza uscire dai bordi.
  const box = element.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth;
  const left = Math.min(
    Math.max(12, box.left + box.width / 2 - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 12
  );
  tooltip.style.left = left + "px";
  tooltip.style.top = (box.bottom + 10) + "px";

  // Sparisce da solo dopo 5 secondi (se ne apriamo un altro, ricominciamo il conto)
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(hideTooltip, 5000);
}

function hideTooltip() {
  document.getElementById("tooltip").hidden = true;
}

// =========================================================
// A CHE PUNTO DELLA SERATA
// Una fila di puntini in alto: uno per ogni carta della serata.
// Quelli già giocati sono più chiari, quello di adesso ha il colore di chi legge.
// =========================================================

/**
 * Disegna i puntini della serata.
 * Serata normale: 3 di riscaldamento + 10 domande = 13 puntini.
 * Dopo "Continuiamo": un nuovo giro più corto (7 puntini).
 */
function renderEveningProgress() {
  const container = document.getElementById("eveningProgress");
  container.innerHTML = "";

  // Solo durante la serata (non quando si riapre una carta in sospeso)
  if (currentCardSource !== "evening") {
    return;
  }

  let totalDots;
  let doneDots;
  if (evening.isContinuation) {
    totalDots = getSegmentLength();
    doneDots = evening.questionsDone - evening.segmentStart;
  } else {
    totalDots = WARMUP_CARDS_PER_EVENING + getSegmentLength();
    doneDots = evening.warmupsDone + evening.questionsDone;
  }

  // Durante una carta bonus nessun puntino è "quello di adesso": è una pausa
  const isOnRegularCard = currentCardKind !== "bonus";

  for (let index = 0; index < totalDots; index = index + 1) {
    const dot = document.createElement("span");
    dot.className = "progressDot";
    if (index < doneDots) {
      dot.classList.add("progressDot--done");
    } else if (index === doneDots && isOnRegularCard) {
      dot.classList.add("progressDot--current");
    }
    container.appendChild(dot);
  }
}
