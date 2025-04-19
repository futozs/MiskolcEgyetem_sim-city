# Álomváros Szimulátor API

Ez a backend szerver alkalmazás a meglévő Álomváros Szimulátor játékhoz készült, és lehetővé teszi az aktuális játékállapot lekérdezését REST API-n keresztül.

## Telepítés

1. Telepítsd a szükséges függőségeket:

```bash
pip install -r requirements.txt
```

2. Indítsd el a szervert:

```bash
python backend_server.py
```

A szerver a 6666-os porton fog futni (http://localhost:6666).

## API végpontok

### Főoldal

- **URL**: `/`
- **Metódus**: `GET`
- **Leírás**: Információk az elérhető végpontokról

### Épületek lekérdezése

- **URL**: `/epuletek`
- **Metódus**: `GET`
- **Leírás**: Az aktuális térképen lévő összes épület adatainak lekérdezése
- **Válasz formátuma**:
```json
{
  "epuletek": [
    {
      "azonosito": 1,
      "nev": "Lakóház",
      "tipus": "lakóház",
      "alapterulet": 1000,
      "allapot": "jó",
      "epitesi_datum": "2023-01-01"
    },
    ...
  ]
}
```

### Folyamatban lévő építések lekérdezése

- **URL**: `/epitesek`
- **Metódus**: `GET`
- **Leírás**: A folyamatban lévő építkezések és karbantartások lekérdezése
- **Válasz formátuma**:
```json
{
  "epitesek": [
    {
      "azonosito": 1,
      "nev": "Új lakóház építése",
      "tipus": "új építés",
      "koltseg": 50000000,
      "kezdo_datum": "2023-06-01",
      "befejezo_datum": "2023-12-01",
      "keszultsegi_fok": 65,
      "allapot": "folyamatban",
      "uj_epulet_adatok": {...},
      "erintett_epuletek": [...]
    },
    ...
  ]
}
```

### Város statisztikáinak lekérdezése

- **URL**: `/statisztikak`
- **Metódus**: `GET`
- **Leírás**: A város aktuális statisztikáinak lekérdezése
- **Válasz formátuma**:
```json
{
  "statisztikak": {
    "varos_nev": "Álomváros",
    "aktualis_datum": "2023-07-15",
    "alapitas_datum": "2023-01-01",
    "lakossag_szama": 1500,
    "lakossag_elegedettseg": 75.5,
    "penzugyi_keret": 123456789,
    "kornyezeti_allapot": 85,
    "turisztikai_vonzero": 60,
    "adosav": 20,
    "gazdasagi_novekedes": 1.2,
    "fordulok_szama": 6,
    "jatek_vege": false,
    "kockazati_tenyezok": {...},
    "infrastruktura_allapot": {...},
    "epuletek_szama": 12,
    "szolgaltatasok_szama": 8,
    "projektek_szama": 3,
    "folyamatban_levo_projektek": 2
  }
}
```

### Város eseményeinek lekérdezése

- **URL**: `/esemenyek`
- **Metódus**: `GET`
- **Leírás**: A városban történt események lekérdezése fordulónként
- **Válasz formátuma**:
```json
{
  "esemenyek": [
    {
      "fordulo": 19,
      "esemeny": {
        "nev": "Helyi nagyvállalat csődje",
        "leiras": "A város egyik legnagyobb munkaadója csődbe ment.",
        "valoszinuseg": 0.15,
        "hatas": {
          "penz": -103712000,
          "boldogsag": -8,
          "lakossag": -100
        },
        "id": "gazdasagi_19_4887",
        "tipus": "gazdasagi",
        "idopecset": "2025-04-18T19:05:38.747036",
        "fordulo": 19
      }
    },
    {
      "fordulo": 18,
      "esemeny": {
        "nev": "Adóbevétel: 1,538,101,680 Ft",
        "leiras": "Adóbevétel: 1,538,101,680 Ft",
        "tipus": "rendszer",
        "hatas": {
          "penz": 0,
          "boldogsag": 0,
          "lakossag": 0
        }
      }
    },
    ...
  ]
}
```

## Használat példák

### cURL kérések

Épületek lekérdezése:
```bash
curl http://localhost:6666/epuletek
```

Folyamatban lévő építések lekérdezése:
```bash
curl http://localhost:6666/epitesek
```

Város statisztikáinak lekérdezése:
```bash
curl http://localhost:6666/statisztikak
```

Város eseményeinek lekérdezése:
```bash
curl http://localhost:6666/esemenyek
```

### JavaScript példa

```javascript
// Épületek lekérdezése
fetch('http://localhost:6666/epuletek')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hiba történt:', error));

// Város statisztikáinak lekérdezése
fetch('http://localhost:6666/statisztikak')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hiba történt:', error));

// Események lekérdezése
fetch('http://localhost:6666/esemenyek')
  .then(response => response.json())
  .then(data => {
    // Események feldolgozása fordulónként
    data.esemenyek.forEach(esemeny => {
      console.log(`Forduló ${esemeny.fordulo}: ${esemeny.esemeny.nev}`);
    });
  })
  .catch(error => console.error('Hiba történt:', error));
```

## Megjegyzések

- A szerver csak olvasási műveleteket végez, nem módosítja a játék állapotát.
- A szervert a játékkal egy időben kell futtatni, mivel a játék adatait olvassa ki.
- Hibák esetén a szerver 404-es vagy 500-as hibakódot ad vissza, megfelelő hibaüzenettel. 