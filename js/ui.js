// =========================================================
// ui.js — come si disegnano le cose sullo schermo
// Qui non c'è logica di gioco: solo "prendo una carta e la mostro".
// =========================================================

// Le scritte per ogni modalità di risposta.
// La chiave (self, together, guessOther) è quella scritta nei file JSON.
// I cuori. Il carattere invisibile \uFE0E dice al telefono: "disegnalo come testo,
// non come emoji". Senza, alcuni Android lo mostrano sempre rosso, ignorando il colore.
const HEART_FULL = "♥\uFE0E";
const HEART_EMPTY = "♡\uFE0E";

const MODE_LABELS = {
  self: "🎯 Tocca a te",
  together: "🤝 Rispondete insieme",
  guessOther: "🔮 Indovina cosa risponderebbe l'altro",
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
    return "Riscaldamento";
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
  document.getElementById("cardMode").textContent = MODE_LABELS[card.mode];

  // Se si risponde insieme, la carta prende i colori di entrambi.
  // classList.toggle(classe, condizione) aggiunge la classe se la condizione è vera,
  // e la toglie se è falsa: una riga invece di un if/else.
  cardElement.classList.toggle("card--together", card.mode === "together");

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
