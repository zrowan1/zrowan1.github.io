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

## 🔔 Stap 5: Notificaties Instellen (Optioneel)

Wil je dagelijkse herinneringen ontvangen? Dat kan via OneSignal (gratis)!

### 5.1 OneSignal Account Aanmaken

1. Ga naar [onesignal.com](https://onesignal.com) en maak een gratis account
2. Klik op **"New App/Website"**
3. Kies een naam (bijv. "Huishouden App")
4. Selecteer **Web** als platform
5. Kies **"Typical Site"** setup

### 5.2 Site Configureren

1. Vul je site URL in (bijv. `https://jouw-naam.github.io`)
2. Bij **"Permission Prompt"**: kies wanneer de notificatie-vraag verschijnt
3. Klik door naar het einde van de setup

### 5.3 App ID Kopiëren

1. Ga naar **Settings** → **Keys & IDs**
2. Kopieer de **"App ID"** (ziet eruit als `a1b2c3d4-e5f6-...`)

### 5.4 In de App Configureren

1. Open de Huishouden app
2. Ga naar **Setup** tab
3. Scroll naar **🔔 Notificaties**
4. Plak je **OneSignal App ID**
5. Klik op **"OneSignal Koppelen"**
6. Sta notificaties toe wanneer je telefoon vraagt
7. Stel je gewenste herinneringstijden in

### 5.5 Scheduled Notificaties (Aanbevolen)

Voor betrouwbare dagelijkse notificaties op vaste tijden:

1. Ga naar je [OneSignal Dashboard](https://dashboard.onesignal.com)
2. Klik op **Messages** → **New Push**
3. Stel je bericht in:
   - **Title**: `🏠 Huishouden`
   - **Message**: `Vergeet je taken van vandaag niet!`
4. Bij **Delivery**: kies **Scheduled**
5. Kies **Intelligent Delivery** of een vast tijdstip
6. Kies **Repeating** en stel in op dagelijks
7. Klik op **Confirm**

Nu krijg je elke dag een herinnering! 📬

---

## 🔄 Hoe werkt de synchronisatie?

- **Automatisch bij openen**: Elke keer dat je de app opent, haalt hij verse data
- **Offline modus**: De app onthoudt de laatste data, dus werkt ook zonder internet
- **Taken afvinken**: Dit wordt lokaal opgeslagen op je telefoon

---

## 💡 Tips

- Pas de Google Sheet aan op je computer → Open de app → Data is bijgewerkt!
- Deel de Sheet met Jamie-Lee zodat jullie beiden kunnen aanpassen
- De app werkt ook op Android (zelfde stappen, via Chrome)

---

## ❓ Problemen?

| Probleem | Oplossing |
|----------|-----------|
| "Geen data" | Check of de Sheet is gepubliceerd |
| Verkeerde data | Check de tabblad-namen (hoofdlettergevoelig!) |
| App laadt niet | Probeer cache te legen in Safari |

---

Veel plezier met jullie huishoud-app! 🏠✨
