#!/usr/bin/env python3
"""
API Szerver Indító

Ez a script egyszerűen elindítja az Álomváros Szimulátor API szervert,
hogy a fejlesztők tesztelni tudják a kapcsolatot, függetlenül a játék futásától.

Használat:
    python3 start_api.py
"""
import os
import sys
import time

# Projekt gyökér könyvtár hozzáadása a Python úthoz
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Próbáljunk meg importálni a szükséges modulokat
try:
    from alomvaros_szimulator.backend_server import run_server, connect_to_game_engine
    print("Backend API modul sikeresen importálva.")
except ImportError as e:
    print(f"Hiba: Az API szerver modulok nem találhatók: {e}")
    print("Ellenőrizd, hogy a 'flask' és 'flask-cors' csomagok telepítve vannak-e:")
    print("pip3 install flask flask-cors")
    sys.exit(1)

# Indítsuk el az API szervert
print("API szerver indítása a 6666-os porton...")
server_thread = run_server(port=6666)

if server_thread:
    print("API szerver sikeresen elindult!")
    print("Nyisd meg a böngészőt: http://localhost:6666")
    print("\nA szerver leállításához nyomd meg a Ctrl+C billentyűkombinációt.")
    
    # Tartsuk életben a fő szálat
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAPI szerver leállítása...")
        sys.exit(0)
else:
    print("Az API szerver nem indult el. Ellenőrizd a hibaüzeneteket.")
    sys.exit(1) 