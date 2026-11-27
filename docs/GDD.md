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
| 1 | Specchio | Lo sguardo dell'altro: come mi vedi |
| 2 | Radici | Il mondo interiore: sogni, paure, rinunce |
| 3 | Rifugio | Bisogni e sicurezza emotiva, riparazione, futuro |

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
- **Bonus** (B01–B50): attività. Tipo 🌙 *Calma* (dopo una ●●●) o ☀️ *Respiro* (dopo una carta saltata). Hanno il bordo tratteggiato, si possono saltare liberamente, non contano nel limite della serata e non si ripetono finché non sono uscite le altre (memoria delle ultime 20).
- **Carta finale** (Q150): compare solo quando il mazzo è finito.

## 6. Il viaggio e la serata
Ci sono due tempi diversi:
- **Il viaggio** (settimane): Specchio → Radici → Rifugio. Si avanza da una serata all'altra.
- **La serata** (un'ora): ha sempre un inizio dolce, un momento intenso e una chiusura. Si gioca dentro il livello in cui si è.

### Patto iniziale (una volta sola, all'inizio del viaggio)
Una schermata da leggere e discutere insieme: perché fare questo viaggio adesso, come sta la coppia, quali argomenti lasciare fuori, cosa fare se una domanda fa male. Ricorda che il gioco non sostituisce un terapeuta di coppia. Pulsanti: "Siamo pronti" / "Ne riparliamo un'altra volta".

### La curva della serata
Ogni volta che si apre l'app inizia una **nuova serata**, anche se si era chiuso 10 minuti prima.
1. **Riscaldamento**: 3 carte dal mazzo riscaldamento (check-in: "come arrivi stasera?")
2. **"Come vi sentite stasera?"**: la coppia sceglie insieme l'intensità
   - 🌙 *Leggeri*: niente carte ●●●
   - 🌗 *Come viene*: ogni tanto una ●●● (circa 1 su 3, se disponibili)
   - 🌕 *Pronti ad andare a fondo*: spesso una ●●● (circa 3 su 4, se disponibili)
3. **Salita**: 3 domande, le più leggere disponibili nel livello
4. **Cuore**: 5 domande, con l'intensità scelta
5. **Discesa**: 2 domande morbide
6. **"Per stasera può bastare"** → "Chiudiamo qui" oppure "Continuiamo" (altre 5 di cuore + 2 di discesa)
7. **Rituale di chiusura**: "Ognuno dica all'altro una cosa che ha apprezzato di lui o di lei stasera."

Turno: si pesca → si risponde (o si mette in sospeso) → si passa il telefono.
Anche "Chiudi la serata" a metà porta al rituale di chiusura.

## 7. Scendere di livello (sempre insieme)
- Ogni livello ha una **presentazione** quando ci si entra.
- Ogni 5 domande giocate nel livello, all'inizio del "cuore", l'app chiede: "Volete andare più a fondo?"
- In più, durante le domande c'è sempre il pulsante **"Più a fondo ↓"**: se una sera vi sentite pronti, potete scendere quando volete.
- Prima di scendere: presentazione del livello + "Parlatene: vi sentite pronti tutti e due? Se anche uno solo ha dei dubbi, si resta. Non è una gara."
- Se le carte di un livello finiscono, si passa al successivo (con la sua presentazione).
- Prima della carta finale l'app ripesca le domande rimaste indietro nei livelli precedenti: nessuna va persa.

## 8. Carte intense (●●●)
- Prima della prima carta di Radici compare la schermata **"Regole del cuore"**: ascolta senza difenderti · non esiste una risposta giusta · ogni carta si può mettere in sospeso · quello che viene detto qui, resta qui.
- Ogni carta ●●● compare **coperta**, con "Carta intensa — siete pronti a scoprirla?" e due pulsanti: **Scopri** / **Mettila in sospeso**.
- Dopo una ●●● a cui avete risposto arriva una carta bonus **🌙 Un momento di calma**, per chi ha ascoltato (il telefono è già passato).

## 9. Domande in sospeso
- Una carta saltata finisce nell'elenco **condiviso** "In sospeso" (dalla home).
- Ogni carta ha "Rispondiamo adesso": si apre come una carta normale. **Fatto** → diventa giocata ed esce dall'elenco; **Lasciala in sospeso** → resta lì.
- Dopo una domanda saltata (durante la serata) arriva una carta bonus **☀️ Un respiro**, per sciogliere la tensione.

## 10. Preferite
- Ogni domanda ha due cuori, uno per colore: ognuno tocca il proprio.
- Pagina "Preferite" con tre filtri: il primo colore, il secondo colore, entrambi.

## 11. Memoria e ripresa
- Salvataggio automatico sul telefono (localStorage), a ogni carta: colori, livello, carte giocate, in sospeso, preferite, patto accettato.
- Riaprendo l'app, i colori sono già scelti e il viaggio riprende dal livello in cui eravate. Ogni apertura è comunque una **nuova serata** (riparte dal riscaldamento).
- **Nessuna domanda si ripete** finché il mazzo non è finito.
- Le carte di riscaldamento non si ripetono nella stessa serata né nelle ultime 5 serate.
- Sulla home: "Siete in [livello] · N domande su 149".
- "Ricomincia da zero" (con conferma) cancella tutto.
- A fine mazzo: "Avete completato il viaggio" → si può ricominciare (le preferite e le carte in sospeso restano).

## 12. Grafica
- Sfondo **scuro** (blu notte / grafite).
- Accenti nei **pastelli** dei due giocatori.
- Atmosfera calma e intima.

## 13. Cosa NON c'è
Punteggi, vincitori, timer, account online, diario delle risposte scritte.

## 14. Idee aperte (non decise)
- Nome definitivo dell'app.
