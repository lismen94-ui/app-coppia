// =========================================================
// ui.js — come si disegnano le cose sullo schermo
// Qui non c'è logica di gioco: solo "prendo una carta e la mostro".
// =========================================================

// Le scritte per ogni modalità di risposta.
// La chiave (self, together, guessOther) è quella scritta nei file JSON.
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
