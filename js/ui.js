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
 * Mostra una carta domanda sullo schermo.
 * @param {object} card - una carta presa da deck.questions
 */
function renderCard(card) {
  const cardElement = document.getElementById("card");

  // La carta finale non ha un livello da mostrare: ha un titolo speciale
  if (card.isFinal) {
    document.getElementById("cardLevel").textContent = "✨ Carta finale";
    document.getElementById("cardIntensity").textContent = "";
  } else {
    document.getElementById("cardLevel").textContent = LEVEL_NAMES[card.level];
    document.getElementById("cardIntensity").textContent = formatIntensity(card.intensity);
  }

  // textContent (e non innerHTML) inserisce il testo così com'è:
  // è più sicuro, perché non interpreta eventuali simboli come codice HTML.
  document.getElementById("cardText").textContent = card.text;
  document.getElementById("cardMode").textContent = MODE_LABELS[card.mode];

  // Se si risponde insieme, la carta prende i colori di entrambi.
  // classList.toggle(classe, condizione) aggiunge la classe se la condizione è vera,
  // e la toglie se è falsa: una riga invece di un if/else.
  cardElement.classList.toggle("card--together", card.mode === "together");
}
