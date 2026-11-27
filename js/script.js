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
}

// =========================================================
// TURNI
// =========================================================

/**
 * Pesca una nuova carta e la mostra.
 * drawNextQuestion() sta in gameEngine.js, renderCard() in ui.js.
 */
function showNextCard() {
  const card = drawNextQuestion();
  renderCard(card);
}

/**
 * Inizia la serata: tocca al primo giocatore, con il suo colore e la prima carta.
 */
function startEvening() {
  // Sicurezza: se le carte non sono state caricate, non si può giocare
  if (deck.questions.length === 0) {
    alert("Le carte non sono ancora pronte. Riprova tra un attimo.");
    return;
  }

  currentPlayer = "first";
  applyTurnColors();
  showNextCard();
  showScreen("screenGame");
}

/**
 * "Fatto, passa": la carta è giocata, il telefono passa all'altra persona
 * e arriva una nuova carta nel suo colore.
 */
function goToNextTurn() {
  markCurrentCardAsUsed();

  // Operatore ternario: "se è first, diventa second; altrimenti diventa first"
  currentPlayer = currentPlayer === "first" ? "second" : "first";

  applyTurnColors();
  showNextCard();
}

/**
 * "Metti in sospeso": la carta va da parte e la STESSA persona
 * riceve un'altra domanda (il turno non passa).
 */
function skipCardAndDrawAgain() {
  skipCurrentCard();
  showNextCard();
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

setupNavigationButtons();
renderColorPickers();
prepareDeck();

document.getElementById("buttonStartEvening").addEventListener("click", startEvening);
document.getElementById("buttonNextTurn").addEventListener("click", goToNextTurn);
document.getElementById("buttonSkipCard").addEventListener("click", skipCardAndDrawAgain);

console.log("app-coppia avviata ✨");
