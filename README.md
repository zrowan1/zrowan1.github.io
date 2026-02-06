# 🏠 Huishouden App - Setup Handleiding

Een handige app om je huishoudelijke taken en kookplanning bij te houden, direct gekoppeld aan Google Sheets!

---

## 📱 Stap 1: Google Sheet Voorbereiden

### 1.1 Maak een nieuwe Google Sheet aan
Ga naar [Google Sheets](https://sheets.google.com) en maak een nieuw spreadsheet.

### 1.2 Maak 3 tabbladen aan
Je hebt **precies** deze 3 tabbladen nodig:

| Tabblad | Naam |
|---------|------|
| 1 | `Alle taken` |
| 2 | `Taakverdeling` |
| 3 | `Kookplanning` |

> 💡 **Tip**: Als je vanuit Apple Numbers exporteert, krijgen sheets soms " - Tabel 1" achter de naam. De app herkent dit automatisch!

### 1.3 Vul de tabbladen in

**Tabblad: Alle taken**
```
| Woonkamer   | Keuken    | WC           | Badkamer       | ...  |
|-------------|-----------|--------------|----------------|------|
| Stofzuigen  | Stofzuigen| Stofzuigen   | Stofzuigen     | ...  |
| Dweilen     | Dweilen   | WC poetsen   | Douche poetsen | ...  |
| Afstoffen   | Afstoffen | Wasbak       | Wasbak         | ...  |
```

**Tabblad: Taakverdeling**
```
| Rowan           |          |           |           |
|-----------------|----------|-----------|-----------|
| 02-02 t/m 08-02 | Maandag  | Dinsdag   | Woensdag  | ...
|                 | Taak 1   | Taak 1    | Taak 1    |
|                 | Taak 2   | Taak 2    |           |
| Jamie-Lee       |          |           |           |
| 02-02 t/m 08-02 | Maandag  | Dinsdag   | Woensdag  | ...
|                 | Taak 1   | Taak 1    | Taak 1    |
```

**Tabblad: Kookplanning**
```
| Kookplanning    |          |            |           |
|-----------------|----------|------------|-----------|
| 02-02 t/m 08-02 | Dag      | Wie kookt  | Gerecht   |
|                 | Maandag  | Rowan      |           |
|                 | Dinsdag  | Jamie-Lee  | Pasta     |
|                 | Woensdag | Rowan      | Curry     |
```

### 1.4 Publiceer de Sheet
Dit is **heel belangrijk** - anders kan de app de data niet lezen!

1. Ga naar **Bestand** → **Delen** → **Publiceren op internet**
2. Kies "Gehele document"
3. Kies "CSV" als formaat
4. Klik op **Publiceren**
5. Bevestig met **OK**

### 1.5 Kopieer het Sheet ID
Het Sheet ID vind je in de URL van je spreadsheet:

```
https://docs.google.com/spreadsheets/d/[DIT_IS_JE_SHEET_ID]/edit
```

Bijvoorbeeld: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## 🌐 Stap 2: App Online Zetten

Je hebt een paar opties om de app te hosten:

### Optie A: GitHub Pages (Gratis, Aanbevolen)

1. Maak een account op [GitHub](https://github.com)
2. Maak een nieuwe repository aan (bijv. `huishouden`)
3. Upload alle bestanden uit deze map
4. Ga naar **Settings** → **Pages**
5. Kies **Source: main branch**
6. Na een paar minuten is je app live op: `https://[username].github.io/huishouden`

### Optie B: Netlify (Gratis, Makkelijk)

1. Ga naar [Netlify Drop](https://app.netlify.com/drop)
2. Sleep de hele map naar de pagina
3. Je krijgt direct een URL!

### Optie C: Lokaal testen

Voor testen kun je een lokale server draaien:
```bash
cd huishoudapp
python3 -m http.server 8000
```
Open dan: `http://localhost:8000`

---

## 📲 Stap 3: App Installeren op iPhone

1. Open de app URL in **Safari**
2. Tik op het **Deel-icoon** (vierkantje met pijl omhoog)
3. Scroll naar beneden
4. Tik op **"Zet op beginscherm"**
5. Geef de app een naam en tik op **Voeg toe**

De app verschijnt nu op je homescreen als een echte app! 🎉

---

## ⚙️ Stap 4: Sheet ID Invoeren

1. Open de app
2. Ga naar het **Setup** tabblad (tandwiel icoon)
3. Plak je **Sheet ID**
4. Tik op **Opslaan & Verbinden**

De app haalt nu automatisch je data op!

---

## 🔄 Stap 5: Gedeelde Taken-Status Instellen (OPTIONEEL)

**✨ NIEUW!** Wil je dat Rowan en Jamie-Lee elkaars afgevinkte taken zien? Volg deze stappen:

### 5.1 Google Apps Script Maken

1. Open je Google Sheet
2. Ga naar **Extensions** → **Apps Script**
3. Vervang alle code met dit:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  let statusSheet = sheet.getSheetByName('Status');
  
  // Maak Status sheet als die niet bestaat
  if (!statusSheet) {
    statusSheet = sheet.insertSheet('Status');
    statusSheet.appendRow(['Week', 'Persoon', 'Dag', 'Taak', 'Voltooid', 'Timestamp']);
    statusSheet.setFrozenRows(1);
  }
  
  const data = JSON.parse(e.postData.contents);
  
  // Zoek of taak al bestaat
  const allData = statusSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.week && 
        allData[i][1] === data.person && 
        allData[i][2] === data.day && 
        allData[i][3] === data.task) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    // Update bestaande rij
    statusSheet.getRange(rowIndex, 5).setValue(data.completed);
    statusSheet.getRange(rowIndex, 6).setValue(new Date());
  } else {
    // Nieuwe rij toevoegen
    statusSheet.appendRow([
      data.week,
      data.person,
      data.day,
      data.task,
      data.completed,
      new Date()
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const statusSheet = sheet.getSheetByName('Status');
  
  if (!statusSheet) {
    return ContentService.createTextOutput(JSON.stringify({data: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = statusSheet.getDataRange().getValues();
  const result = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    result.push({
      week: data[i][0],
      person: data[i][1],
      day: data[i][2],
      task: data[i][3],
      completed: data[i][4],
      timestamp: data[i][5]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({data: result}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Klik op **💾 Save** (of Ctrl+S)
5. Geef het een naam: "Huishouden Sync"

### 5.2 Script Deployen

1. Klik op **🚀 Deploy** → **New deployment**
2. Klik op het tandwiel ⚙️ naast "Select type"
3. Kies **Web app**
4. Vul in:
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** ⚠️ *Dit is belangrijk!*
5. Klik **Deploy**
6. Autoriseer toegang (volg de stappen, kies "Advanced" → "Go to Huishouden Sync (unsafe)")
7. **Kopieer de Web App URL** (eindigt op `/exec`)

### 5.3 URL Invoeren in App

1. Open de app
2. Ga naar **Setup** tabblad
3. Scroll naar **"Gedeelde Taken-Status"**
4. Plak de **Apps Script URL**
5. Tik op **Opslaan Script URL**

Nu zien jullie beiden elkaars afgevinkte taken! 🎉

> **Let op**: Het kan 5-10 seconden duren voordat wijzigingen zichtbaar zijn bij de andere persoon. Refresh de app door naar een ander tabblad te gaan en terug.

---

## 📢 Stap 6: Dagelijkse Herinnering (iOS Shortcut)

Wil je elke ochtend herinnerd worden aan je taken? Maak een iOS Shortcut!

### Zo maak je de herinnering:

1. Open de **Shortcuts** app op je iPhone
2. Ga naar **Automatisering** (onderaan)
3. Tik op **+** → **Persoonlijke automatisering**
4. Kies **Tijd van de dag**
5. Stel je tijd in (bijv. **08:00**)
6. Kies **Dagelijks**
7. Tik **Volgende**
8. Zoek en voeg toe: **Toon melding**
9. Typ: `🏠 Vergeet je huishoudtaken niet!`
10. Voeg toe: **Open app** → kies **Huishouden**
11. Tik **Volgende**
12. Zet **"Vraag bevestiging"** **UIT**
13. Tik **Gereed**

Nu krijg je elke ochtend een melding en opent de app direct naar je taken van vandaag! 📬

---

## 🔄 Hoe werkt de synchronisatie?

### Sheet Data (Taken, Planning, Koken)
- **Automatisch bij openen**: Elke keer dat je de app opent, haalt hij verse data
- **Automatische week-detectie**: De app selecteert automatisch de juiste week op basis van vandaag
- **Wekelijkse reset**: Afgevinkte taken van vorige weken worden automatisch opgeruimd
- **Offline modus**: De app onthoudt de laatste data, dus werkt ook zonder internet

### Gedeelde Taken-Status (optioneel)
- **Real-time sync**: Afgevinkte taken worden binnen 5-10 seconden gesynchroniseerd
- **Automatisch laden**: Bij openen app wordt de laatste status van alle taken geladen
- **Fallback**: Als sync mislukt, blijft lokale status behouden
- **Privacy**: Alleen Rowan en Jamie-Lee kunnen de data zien (niet publiek)

---

## 💡 Tips

- Pas de Google Sheet aan op je computer → Open de app → Data is bijgewerkt!
- Deel de Sheet met Jamie-Lee zodat jullie beiden kunnen aanpassen
- De app werkt ook op Android (zelfde stappen, via Chrome)
- Als je de gedeelde taken-status niet nodig hebt, hoef je Stap 5 niet te doen

---

## ❓ Problemen?

| Probleem | Oplossing |
|----------|-----------|
| "Geen data" | Check of de Sheet is gepubliceerd |
| Verkeerde data | Check de tabblad-namen (hoofdlettergevoelig!) |
| App laadt niet | Probeer cache te legen in Safari |
| Taken niet gesynchroniseerd | Wacht 10 sec en refresh de app |
| Apps Script fout | Check of "Anyone" toegang heeft bij Deploy settings |
| "Status" tabblad bestaat niet | Dit wordt automatisch aangemaakt bij eerste afvinken |

---

## 🔧 Technische Details

### App Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript (geen frameworks)
- **Data bron**: Google Sheets (CSV export via gviz/tq API)
- **Gedeelde status**: Google Apps Script (Web App endpoint)
- **Opslag**: LocalStorage + Apps Script
- **PWA**: Service Worker voor offline support

### Data Flow
```
Google Sheet ─┬─> CSV Export ──> App (Read-only)
              │
              └─> Apps Script ──> "Status" tabblad ──> App (Read/Write)
```

### Beveiliging
- Sheet data is **publiek leesbaar** (maar URL is moeilijk te raden)
- Apps Script heeft **"Anyone" toegang** maar schrijft alleen gestructureerde data
- Geen gevoelige informatie wordt opgeslagen
- Geen authenticatie nodig = makkelijk delen tussen gebruikers

---

Veel plezier met jullie huishoud-app! 🏠✨

**Vragen?** Check de code in `index.html` of vraag Rowan! 😊
