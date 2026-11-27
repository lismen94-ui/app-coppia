// =========================================================
// serviceWorker.js — fa funzionare l'app anche SENZA internet
//
// Il service worker è un piccolo programma che il browser tiene "di guardia"
// tra l'app e la rete. Ogni volta che l'app chiede un file (una pagina,
// un'immagine, le carte), passa da qui.
//
// Strategia "prima la rete, poi la copia":
// 1. proviamo a scaricare il file aggiornato da internet;
// 2. se ci riusciamo, ne salviamo una copia (cache) e lo usiamo;
// 3. se internet non c'è, usiamo l'ultima copia salvata.
// Così l'app è sempre aggiornata quando c'è rete, e funziona anche offline.
//
// NB: questo file deve stare nella cartella principale (accanto a index.html),
// altrimenti potrebbe "sorvegliare" solo la sua sottocartella.
// =========================================================

// Il nome della "scatola" dove teniamo le copie.
// Se un giorno serve buttare via tutte le copie vecchie, basta cambiare v1 in v2.
const CACHE_NAME = "luna-v3"; // v3: nome "Luna" (v2: icona nuova)

// I file indispensabili: li salviamo subito, alla prima apertura,
// così l'app funziona offline anche se non avete ancora visitato ogni schermata.
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/gameEngine.js",
  "./js/storage.js",
  "./js/ui.js",
  "./js/script.js",
  "./data/questionCards.json",
  "./data/warmupCards.json",
  "./data/bonusCards.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon-32.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

// "install": succede la prima volta che il service worker viene registrato.
// event.waitUntil dice al browser: "non considerarmi pronto finché non ho finito".
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Entra in servizio subito, senza aspettare che l'app venga chiusa e riaperta
  self.skipWaiting();
});

// "activate": succede quando il service worker entra in servizio.
// Qui buttiamo via le scatole vecchie (con un nome diverso da CACHE_NAME).
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      const oldCaches = cacheNames.filter(function (name) {
        return name !== CACHE_NAME;
      });
      return Promise.all(oldCaches.map(function (name) {
        return caches.delete(name);
      }));
    })
  );
  // Prende il controllo anche delle pagine già aperte
  self.clients.claim();
});

// "fetch": succede ogni volta che l'app chiede un file.
self.addEventListener("fetch", function (event) {
  // Ci occupiamo solo delle richieste di lettura (GET) del nostro sito
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (networkResponse) {
        // C'è internet: salviamo una copia aggiornata e usiamo la risposta
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseCopy);
        });
        return networkResponse;
      })
      .catch(function () {
        // Niente internet: usiamo la copia salvata
        return caches.match(event.request);
      })
  );
});
