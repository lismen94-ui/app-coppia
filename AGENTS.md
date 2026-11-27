# Regole del progetto "Luna" (cartella app-coppia)

Queste regole valgono per qualsiasi agente che lavora in questa cartella (Antigravity, Claude o altri).

## Chi c'è dall'altra parte
- Chi segue il progetto sta imparando JavaScript: il codice deve essere leggibile da chi è alle prime armi, e ogni fase va spiegata.
- Prima di scrivere codice nuovo, chiedi sempre conferma. Non riscrivere file interi se basta una modifica piccola.
- Fai le domande una alla volta.

## Tecnologia
- Solo HTML, CSS e JavaScript "puro" (vanilla). Niente framework (no React, Vue, Tailwind, jQuery) e niente librerie esterne.
- Niente strumenti di build (no npm, Vite, Webpack): l'app deve funzionare aprendo `index.html` con un piccolo server locale.
- L'app è una PWA: deve funzionare offline e poter essere installata su Android.
- I dati si salvano solo sul telefono (localStorage). Niente account, niente server, niente invio di dati.

## Stile del codice
- Nomi in **camelCase** per variabili e funzioni: `currentLevel`, `drawCard()`, `skippedCards`.
- Nomi delle costanti in MAIUSCOLO solo se sono valori fissi: `EVENING_CARD_LIMIT`.
- Commenti in **italiano**, che spiegano il *perché*, non solo il *cosa*.
- Funzioni piccole, una cosa per funzione.
- `const` di default, `let` solo se il valore cambia. Mai `var`.
- Niente codice "furbo": meglio tre righe chiare che una riga criptica.

## Struttura
- `index.html` — la pagina dell'app
- `css/style.css` — grafica
- `js/script.js` — avvio e cambio schermate
- `js/gameEngine.js` — pesca delle carte, curva della serata, livelli
- `js/storage.js` — salvataggio sul telefono
- `js/ui.js` — disegno di carte e pulsanti
- `data/*.json` — le carte (il contenuto sta SOLO qui, mai dentro il codice)
- `docs/` — GDD, piano di sviluppo, testo del mazzo

## Contenuto
- Le carte sono testi originali scritti per questo progetto. Non inserire domande copiate da altri giochi.
- Il testo delle carte si modifica in `data/*.json`, non nel codice.

## Documenti di riferimento
- Game design: @docs/GDD.md
- Piano di sviluppo: @docs/PIANO.md
