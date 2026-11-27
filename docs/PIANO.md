# Piano di sviluppo — Luna

Ogni fase si chiude così: **si scrive il codice → si prova → si fa il commit su GitHub → si spiega cosa è stato fatto.**

| Fase | Cosa | Come si prova | Stato |
|---|---|---|---|
| 0 | Preparazione: cartella, documenti, regole agente, Git/GitHub | La cartella si apre in Antigravity e c'è il primo commit | ✅ fatta |
| 1 | Scheletro: pagina, stile scuro, schermate vuote | `index.html` si apre nel browser | ✅ fatta |
| 2 | Dati: le 250 carte nei file JSON, lette dall'app | In console si vede il numero di carte caricate | ✅ fatta |
| 3 | Gioco base: scelta colori, pesca, carta colorata per turno | Si gioca una partita semplice | ✅ fatta |
| 4 | Serata e livelli: curva, limite 12, "più a fondo?", avvertimento ●●●, regole del cuore | Una serata completa segue la curva | ✅ fatta |
| 5 | Memoria: ripresa, niente ripetizioni, in sospeso, preferite | Chiudo e riapro: riprende dal punto giusto | ✅ fatta |
| 6 | Carte bonus: calma dopo ●●●, respiro dopo un salto | Le bonus compaiono al momento giusto | ✅ fatta |
| 7 | Android: GitHub Pages + installazione come app (PWA) | L'app si installa sul telefono e va offline | ✅ fatta |
| 8 | Rifinitura e spiegazione del codice file per file | Tutto chiaro 🙂 | 🔄 in corso |

## Struttura finale prevista
```
app-coppia/
├── index.html
├── manifest.json
├── serviceWorker.js
├── AGENTS.md
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   ├── gameEngine.js
│   ├── storage.js
│   └── ui.js
├── data/
│   ├── questionCards.json
│   ├── warmupCards.json
│   └── bonusCards.json
├── icons/
└── docs/
    ├── GDD.md
    ├── PIANO.md
    └── MAZZO.md
```
