# Game Design Document — app-coppia

> Nome definitivo dell'app: da scegliere (fase 7).
> Ispirazione: il gioco di carte "io sono te – per chi si ama". Le meccaniche sono riprese e modificate; tutte le carte sono testi originali scritti per questo progetto.

## 1. Concept
Un'app per **ritrovarsi in coppia** attraverso domande profonde, con una base psicologica.
Si gioca in due su **un solo telefono Android**, passato di mano in mano.
Non ci sono punteggi, vincitori o timer.

## 2. Setup
- Ognuno sceglie **un colore** da una palette di pastelli calmi (rosa cipria, azzurro polvere, salvia, lavanda, sabbia, pesca…). Due persone non possono avere lo stesso colore.
- La coppia resta salvata sul telefono.
- Il colore sostituisce il nome: il turno si capisce dal colore della carta.

## 3. Categorie
| Categoria | Stato |
|---|---|
| Insieme da tempo | Versione 1 (150 domande) |
| Ci stiamo conoscendo | Futura |
| Momento difficile | Futura |

L'app nasce già predisposta per più categorie: aggiungerne una significa solo aggiungere carte.

## 4. Livelli
| Livello | Nome | Focus principale |
|---|---|---|
| 1 | Incontrarsi | Lo sguardo dell'altro: come mi vedi |
| 2 | Esporsi | Il mondo interiore: sogni, paure, rinunce |
| 3 | Accogliersi | Bisogni e sicurezza emotiva, riparazione, futuro |

Ogni livello ha 50 domande e mescola un po' tutti e tre gli aspetti.

## 5. Le carte
Ogni carta domanda ha:
- **codice** (es. `Q001`) — solo un identificativo, NON l'ordine di gioco
- **categoria**, **livello** (1–3), **intensità** (1–3, mostrata come ●○○ / ●●○ / ●●●)
- **chi risponde**:
  - 🎯 *Tocca a te* — risponde chi ha il telefono
  - 🤝 *Insieme* — rispondono entrambi
  - 🔮 *Indovina l'altro* — rispondi come pensi che risponderebbe l'altro; l'altro conferma o corregge
- **testo**

Altri mazzi:
- **Riscaldamento** (R01–R50): carte leggere e riutilizzabili per aprire la serata.
- **Bonus** (B01–B50): attività. Tipo 🌙 *Calma* (dopo una ●●●) o ☀️ *Respiro* (dopo una carta saltata). Si possono saltare liberamente.
- **Carta finale** (Q150): compare solo quando il mazzo è finito.

## 6. La serata (core loop)
Ogni volta che si apre l'app inizia una **nuova serata**, anche se si era chiuso 10 minuti prima.

La serata segue una **curva di intensità**:
1. **Riscaldamento** — 2–3 carte dal mazzo riscaldamento
2. **Salita** — carte ●○○ / ●●○ del livello corrente
3. **Cuore** — possono uscire le ●●●
4. **Discesa** — una carta morbida per chiudere

Turno:
1. Si pesca una carta (scelta dall'app secondo la curva)
2. Si risponde, oppure si salta
3. Si passa il telefono → si ricomincia

**Limite morbido**: dopo circa 12 carte l'app propone "Per stasera può bastare. Volete chiudere qui o continuare?". Si può continuare.

## 7. Progressione tra i livelli
- Si parte da Incontrarsi.
- Dopo qualche carta l'app chiede: "Volete andare più a fondo?" — la coppia sceglie se avanzare o restare.
- Se le carte di un livello finiscono, l'app accompagna al livello successivo.

## 8. Carte intense (●●●)
- Prima di entrare in Esporsi compare la schermata **"Regole del cuore"** (es. "ascolta senza difenderti", "si può sempre saltare").
- Ogni carta ●●● compare **coperta**, con "Carta intensa: siete pronti?" e due pulsanti: **Scopri** / **Mettila in sospeso**.
- Dopo una ●●● l'app propone una carta bonus 🌙 Calma.

## 9. Domande in sospeso
- Una carta saltata finisce in una cartella **condivisa** "In sospeso".
- Si può riaprire quando si vuole; quando si risponde diventa "usata".
- Dopo una carta saltata l'app propone una carta bonus ☀️ Respiro.

## 10. Preferite
- Ogni carta ha due cuori, uno per colore.
- Filtri: le mie, le sue, entrambi.

## 11. Memoria e ripresa
- Salvataggio automatico sul telefono: coppia, livello, carte usate, in sospeso, preferite.
- **Nessuna domanda si ripete** finché il mazzo non è finito.
- Le carte di riscaldamento possono ripetersi, ma non nella stessa serata e non nelle ultime serate.
- A fine mazzo: schermata "Avete completato il viaggio", carta finale, carte preferite da entrambi, possibilità di ricominciare.

## 12. Grafica
- Sfondo **scuro** (blu notte / grafite).
- Accenti nei **pastelli** dei due giocatori.
- Atmosfera calma e intima.

## 13. Cosa NON c'è
Punteggi, vincitori, timer, account online, diario delle risposte scritte.

## 14. Idee aperte (non decise)
- La carta R10 ("leggerezza, profondità o vicinanza?") potrebbe guidare la serata: con "leggerezza" niente ●●●.
- Nome definitivo dell'app.
