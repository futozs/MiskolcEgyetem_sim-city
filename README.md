# Álomváros Szimulátor

![verzió](https://img.shields.io/badge/verzió-2.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)

**Álomváros Szimulátor** egy komplex városfejlesztési szimulációs játék, amely lehetővé teszi városok tervezését, épületek és szolgáltatások létrehozását, a lakosság menedzselését, valamint a különböző gazdasági és társadalmi folyamatok szimulálását.

## Projekt Áttekintés

A szimulátor segítségével egy virtuális várost lehet irányítani, ahol különböző városi fejlesztési projekteket hajthatunk végre, épületeket építhetünk, szolgáltatásokat indíthatunk, figyelemmel kísérhetjük a lakosok elégedettségét és a város pénzügyi helyzetét.

### Főbb funkciók

- **Épületek építése és kezelése**: különböző típusú épületek (lakóházak, üzletek, ipari létesítmények) építése, karbantartása
- **Szolgáltatások indítása**: közszolgáltatások, oktatási, egészségügyi és egyéb szolgáltatások létrehozása és üzemeltetése
- **Lakosság menedzselése**: lakosság növelése, elégedettség kezelése
- **Projektek végrehajtása**: városfejlesztési projektek tervezése és megvalósítása
- **Fordulókra épülő játékmenet**: havi fordulók, változó gazdasági körülmények, események kezelése
- **Adatok vizualizálása**: grafikonok, statisztikák megjelenítése
- **Mentés/Betöltés**: játékállás mentése és visszatöltése

## Telepítési útmutató

### Rendszerkövetelmények

- Python 3.8 vagy újabb
- Minimális hardverigény: 4GB RAM, 1GB szabad tárhely
- Ajánlott: OpenGL támogatás a 3D megjelenítéshez

### Telepítési lépések

1. **Python telepítés** (ha még nincs telepítve)
   - Töltse le és telepítse a Python 3.8 vagy újabb verzióját: [python.org](https://www.python.org/downloads/)

2. **Projekt letöltése**
   ```bash
   # Klónozza a git repót
   git clone https://github.com/futozs/MiskolcEgyetem_sim-city
   # Vagy töltse le és csomagolja ki a ZIP fájlt
   ```

3. **Függőségek telepítése**
   ```bash
   # Navigáljon a projekt könyvtárába
   cd alomvaros_szimulator
   
   # Telepítse a szükséges függőségeket
   pip install -r requirements.txt
   ```

4. **Projekt telepítése**
   ```bash
   # Telepítse a projektet fejlesztői módban
   pip install -e .
   ```

### Függőségek listája

A projekt a következő Python csomagokat használja:
- `pandas >= 1.5.0` - Adatkezelés és elemzés
- `numpy >= 1.21.0` - Numerikus számítások
- `python-dateutil >= 2.8.2` - Dátumkezelés
- `colorama >= 0.4.4` - Színes konzolos kimenet
- `customtkinter >= 5.2.0` - Modern GUI keretrendszer
- `pillow >= 9.5.0` - Képkezelés
- `matplotlib >= 3.7.0` - Adatvizualizáció
- `ttkthemes >= 3.2.2` - GUI témák
- `ttkwidgets >= 0.12.0` - További GUI komponensek

## Használati útmutató

### Indítás

A szimulátort kétféle módon indíthatja el:

1. **Grafikus felülettel (alapértelmezett)**
   ```bash
   # Projekt könyvtárában
   python -m alomvaros_szimulator.main
   
   # Ha telepítve van
   alomvaros
   ```

2. **Parancssori módban**
   ```bash
   python -m alomvaros_szimulator.main --nogui --varos "Városnév" --penz 50000000
   ```

### Parancssori paraméterek

| Paraméter | Leírás |
|-----------|--------|
| `--nogui` | Parancssori interfész használata grafikus felület helyett |
| `--varos NEWNOME` | Város neve |
| `--penz ÖSSZEG` | Kezdő pénzügyi keret |
| `--elegedettseg ÉRTÉK` | Kezdeti lakossági elégedettség (0-100) |
| `--min-elegedettseg ÉRTÉK` | Minimális elfogadható elégedettség (0-100) |
| `--fordulok SZÁM` | Automatikusan futtatandó fordulók száma |
| `--autosave` | Automatikus mentés minden forduló után |
| `--exportcsv FÁJLNÉV` | Projektek exportálása a megadott CSV fájlba |
| `--importepulet FÁJLNÉV` | Épületek importálása a megadott CSV fájlból |
| `--importszolgaltatas FÁJLNÉV` | Szolgáltatások importálása a megadott CSV fájlból |
| `--importlakos FÁJLNÉV` | Lakosok importálása a megadott CSV fájlból |

### Játékmenet

#### Új játék kezdése

1. Indítsa el a szimulátort grafikus módban
2. Kattintson az "Új játék" gombra
3. Adja meg a város nevét és a kezdeti beállításokat
4. Kattintson a "Kezdés" gombra

#### Épületek építése

1. A főképernyőn válassza az "Épületek" fület
2. Kattintson az "Új épület építése" gombra
3. Adja meg az épület adatait (név, típus, alapterület, stb.)
4. Kattintson az "Építés" gombra a folyamat elindításához

#### Szolgáltatások indítása

1. Válassza a "Szolgáltatások" fület
2. Kattintson az "Új szolgáltatás" gombra
3. Válassza ki a szolgáltatás típusát és adja meg a szükséges adatokat
4. Kattintson az "Indítás" gombra

#### Forduló léptetése

- Kattintson a "Következő forduló" gombra a játék előrehaladásához
- Minden forduló egy hónapnak felel meg a játékban
- A forduló végén megtekintheti az eseményeket és a város állapotát

#### Mentés és betöltés

- A játékállás bármikor menthető a "Mentés" gombbal
- Korábban mentett játék betölthető a "Betöltés" opcióval

#### Statisztikák és analitika

- A "Statisztikák" fülön megtekintheti a város fejlődését különböző grafikonok formájában
- Az "Analitika" részben részletes kimutatásokat talál a város gazdasági helyzetéről

## API Dokumentáció

### Főbb osztályok

#### `GameEngine`

A játék motorja, amely kezeli a játék állapotát és a fő műveleteket.

```python
# Példa a GameEngine használatára
from alomvaros_szimulator.game.game_engine import GameEngine

# Játék motor inicializálása
game_engine = GameEngine()

# Új játék indítása
game_engine.uj_jatek(varos_nev="Példaváros", kezdeti_penz=100000000)

# Forduló léptetése
esemenyek = game_engine.kovetkezo_fordulo()

# Játék mentése
game_engine.jatek_mentese("mentes.json")
```

#### `Varos`

A város adatait és működését reprezentáló osztály.

```python
# A város objektum elérése a GameEngine-en keresztül
varos = game_engine.varos

# Város állapotának lekérdezése
print(f"Lakosságszám: {varos.lakosok_szama}")
print(f"Elégedettség: {varos.lakossag_elegedettseg}%")
print(f"Pénzügyi keret: {varos.penzugyi_keret} Ft")
```

#### `Epulet` és `Szolgaltatas`

Az épületek és szolgáltatások kezelésére szolgáló osztályok.

```python
# Épület építése
epulet_id = game_engine.uj_epulet_epitese(
    nev="Irodaház", 
    tipus="Iroda",
    alapterulet=2000,
    koltseg=50000000,
    idotartam_honapokban=12
)

# Szolgáltatás indítása
szolg_id = game_engine.uj_szolgaltatas_inditasa(
    nev="Városi könyvtár",
    tipus="Oktatás",
    havi_koltseg=500000,
    elegedettseg_hatas=5,
    lakossag_hatas=0
)
```

### Adatfájl formátumok

#### CSV Fájlok

A szimulátor képes CSV fájlokat importálni és exportálni:

**Épületek CSV formátum:**
```
id,nev,tipus,alapterulet,allapot,epult,koltseg,havi_fenntartas
1,Központi Lakópark,Lakóház,5000,100,2023-01-01,75000000,500000
```

**Szolgáltatások CSV formátum:**
```
id,nev,tipus,havi_koltseg,elegedettseg_hatas,lakossag_hatas,allapot
1,Városi könyvtár,Oktatás,500000,5,0,aktív
```

#### Mentésfájlok

A mentések JSON formátumban tárolódnak, és tartalmazzák a teljes játékállapotot.

## Hibaelhárítás

### Gyakori problémák és megoldásaik

#### "Nem indul el a grafikus felület"
- Ellenőrizze, hogy telepítve vannak-e a szükséges függőségek
- Győződjön meg róla, hogy a Python 3.8 vagy újabb verzióját használja
- Próbálja újratelepíteni a tkinter csomagot: `pip install --upgrade tk`

#### "ImportError: No module named 'customtkinter'"
- Telepítse újra a függőségeket: `pip install -r requirements.txt`

#### "A program lassan fut vagy lefagy"
- Ellenőrizze, hogy számítógépe megfelel-e a minimális rendszerkövetelményeknek
- Zárja be a háttérben futó, erőforrás-igényes alkalmazásokat
- Nagy városok esetén próbálja meg csökkenteni a lakosok számát

## Fejlesztői dokumentáció

### Projekt struktúra

```
alomvaros_szimulator/
├── __init__.py
├── main.py             # Fő belépési pont
├── config.py           # Konfigurációs beállítások
├── models/             # Adatmodellek
│   ├── __init__.py
│   ├── varos.py        # Város modell
│   ├── epulet.py       # Épület modell
│   ├── szolgaltatas.py # Szolgáltatás modell
│   ├── lakos.py        # Lakos modell
│   ├── projekt.py      # Projekt modell
│   ├── penzugyek.py    # Pénzügyi műveletek
│   └── esemeny.py      # Események kezelése
├── game/               # Játéklogika
│   ├── __init__.py
│   ├── game_engine.py  # Játék motor
│   ├── fordulo_manager.py # Fordulók kezelése
│   └── event_manager.py   # Események kezelése
├── ui/                 # Felhasználói felület
│   ├── __init__.py
│   ├── main_window.py  # Fő ablak
│   ├── city_view_3d.py # 3D városnézet
│   ├── analytics_view.py # Analitikai nézet
│   ├── events_view.py  # Események megjelenítése
│   └── game_actions.py # Játék műveletek
└── utils/              # Segédeszközök
    ├── __init__.py
    ├── file_manager.py # Fájlkezelés
    └── date_utils.py   # Dátumkezelés
```

### Architektúra

A szimulátor MVC (Model-View-Controller) architektúrát követ:
- **Model**: A `models` könyvtárban található osztályok felelősek az adatok tárolásáért
- **View**: A `ui` könyvtár komponensei kezelik a felhasználói felületet
- **Controller**: A `game` könyvtárban található osztályok végzik a játéklogika kezelését

### Bővítési lehetőségek

A szimulátor könnyen bővíthető új funkciókkal:

1. **Új épülettípusok**: Bővítse az `epulet.py` fájlban található épülettípusokat
2. **Új szolgáltatások**: Adjon hozzá új szolgáltatástípusokat a `szolgaltatas.py` fájlhoz
3. **Új események**: Definiáljon új eseményeket az `event_manager.py` fájlban
4. **Új vizualizációk**: Bővítse az analitikai nézeteket az `analytics_view.py` fájlban

## Licenc és közreműködés

### Licenc

Ez a projekt a [MIT Licenc](LICENSE) alatt áll.

### Közreműködés

Hozzájárulásokat szívesen fogadunk! Ha szeretne közreműködni a projektben:

1. Forkolja a GitHub repót
2. Hozzon létre egy új ágat a fejlesztéséhez (`git checkout -b feature/amazing-feature`)
3. Commitolja a változtatásokat (`git commit -m 'Add some amazing feature'`)
4. Pusholja az ágat (`git push origin feature/amazing-feature`)
5. Nyisson egy Pull Requestet

## Kapcsolat

Ha kérdése vagy problémája van a projekttel kapcsolatban, keressen minket a következő módokon:

- Email: zsombi@futozsombor.hu

---
