"""
Adatbetöltő segédmodul a városfejlesztési szimulátorhoz
"""
import os
import pandas as pd
from datetime import datetime
import csv

from alomvaros_szimulator.models.epulet import Epulet
from alomvaros_szimulator.models.szolgaltatas import Szolgaltatas
from alomvaros_szimulator.models.projekt import Projekt
from alomvaros_szimulator.models.esemeny import Esemeny


def csv_betoltes(fajl_utvonal, fejlec=True):
    """
    CSV fájl betöltése
    
    :param fajl_utvonal: Betöltendő CSV fájl útvonala
    :param fejlec: Van-e fejléc a CSV fájlban (alapértelmezett: True)
    :return: Dataframe a betöltött adatokkal
    """
    try:
        if os.path.exists(fajl_utvonal):
            return pd.read_csv(fajl_utvonal, header=0 if fejlec else None)
        else:
            print(f"A fájl nem található: {fajl_utvonal}")
            return None
    except Exception as e:
        print(f"Hiba a CSV fájl betöltésekor: {e}")
        return None


def csv_mentes(adatok, fajl_utvonal, fejlec=True):
    """
    Adatok mentése CSV fájlba
    
    :param adatok: Mentendő adatok (dataframe vagy lista)
    :param fajl_utvonal: Kimeneti CSV fájl útvonala
    :param fejlec: Van-e fejléc a CSV fájlban (alapértelmezett: True)
    :return: Igaz, ha sikeres volt a mentés
    """
    try:
        # Könyvtár létrehozása, ha nem létezik
        os.makedirs(os.path.dirname(fajl_utvonal), exist_ok=True)
        
        # Ha pandas DataFrame, akkor használjuk a to_csv metódust
        if isinstance(adatok, pd.DataFrame):
            adatok.to_csv(fajl_utvonal, index=False, header=fejlec)
        # Ha lista, akkor manuálisan írjuk ki a CSV-t
        elif isinstance(adatok, list):
            with open(fajl_utvonal, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                for sor in adatok:
                    writer.writerow(sor)
        else:
            print(f"Nem támogatott adattípus: {type(adatok)}")
            return False
        
        return True
    except Exception as e:
        print(f"Hiba a CSV fájl mentésekor: {e}")
        return False


def epuletek_betoltese(fajl_utvonal):
    """
    Épületek betöltése CSV fájlból
    
    :param fajl_utvonal: Épületek CSV fájl útvonala
    :return: Épületek listája szótár formátumban
    """
    epuletek = []
    df = csv_betoltes(fajl_utvonal)
    
    if df is not None:
        for _, sor in df.iterrows():
            try:
                epulet = Epulet(
                    azonosito=int(sor['azonosito']),
                    nev=sor['nev'],
                    tipus=sor['tipus'],
                    alapterulet=int(sor['alapterulet']),
                    allapot=sor['allapot'],
                    epitesi_datum=datetime.strptime(sor['epitesi_datum'], '%Y-%m-%d').date() if 'epitesi_datum' in sor else None
                )
                epuletek.append(epulet)
            except Exception as e:
                print(f"Hiba egy épület betöltésekor: {e}")
    
    return epuletek


def szolgaltatasok_betoltese(fajl_utvonal):
    """
    Szolgáltatások betöltése CSV fájlból
    
    :param fajl_utvonal: Szolgáltatások CSV fájl útvonala
    :return: Szolgáltatások listája szótár formátumban
    """
    szolgaltatasok = []
    df = csv_betoltes(fajl_utvonal)
    
    if df is not None:
        for _, sor in df.iterrows():
            try:
                szolgaltatas = Szolgaltatas(
                    azonosito=int(sor['azonosito']),
                    nev=sor['nev'],
                    tipus=sor['tipus'],
                    havi_koltseg=int(sor['havi_koltseg']),
                    indulas_datum=datetime.strptime(sor['indulas_datum'], '%Y-%m-%d').date() if 'indulas_datum' in sor else None,
                    ertek=int(sor['ertek']) if 'ertek' in sor else 1
                )
                szolgaltatasok.append(szolgaltatas)
            except Exception as e:
                print(f"Hiba egy szolgáltatás betöltésekor: {e}")
    
    return szolgaltatasok


def projektek_betoltese(fajl_utvonal):
    """
    Projektek betöltése CSV fájlból
    
    :param fajl_utvonal: Projektek CSV fájl útvonala
    :return: Projektek listája szótár formátumban
    """
    projektek = []
    df = csv_betoltes(fajl_utvonal)
    
    if df is not None:
        for _, sor in df.iterrows():
            try:
                # Érintett épületek feldolgozása
                erintett_epuletek = []
                if 'erintett_epuletek' in sor and pd.notna(sor['erintett_epuletek']):
                    try:
                        # Ha a formátum {1,2,3}, akkor ezt feldolgozza
                        if str(sor['erintett_epuletek']).startswith('{') and str(sor['erintett_epuletek']).endswith('}'):
                            epulet_lista = str(sor['erintett_epuletek']).strip('{}').split(',')
                            erintett_epuletek = [int(e.strip()) for e in epulet_lista if e.strip()]
                        else:
                            # Egyébként vesszővel elválasztott lista
                            erintett_epuletek = [int(e.strip()) for e in str(sor['erintett_epuletek']).split(',') if e.strip()]
                    except:
                        print(f"Hiba az érintett épületek feldolgozásakor: {sor['erintett_epuletek']}")
                
                projekt = Projekt(
                    azonosito=int(sor['azonosito']),
                    nev=sor['nev'],
                    tipus=sor['tipus'] if 'tipus' in sor else "felújítás",
                    koltseg=int(sor['koltseg']),
                    kezdo_datum=datetime.strptime(str(sor['kezdo_datum']), '%Y-%m-%d').date(),
                    befejezo_datum=datetime.strptime(str(sor['befejezo_datum']), '%Y-%m-%d').date(),
                    erintett_epuletek=erintett_epuletek,
                    uj_epulet_adatok=sor['uj_epulet_adatok'] if 'uj_epulet_adatok' in sor else None
                )
                projektek.append(projekt)
            except Exception as e:
                print(f"Hiba egy projekt betöltésekor: {e} - Sor: {sor}")
    
    return projektek


def esemenyek_betoltese(fajl_utvonal):
    """
    Események betöltése CSV fájlból
    
    :param fajl_utvonal: Események CSV fájl útvonala
    :return: Események listája objektum formátumban
    """
    esemenyek = []
    df = csv_betoltes(fajl_utvonal)
    
    if df is not None:
        for _, sor in df.iterrows():
            try:
                # Először megnézzük, hogy melyik oszlopnév létezik: 'elegedettseg_hatas' vagy 'elegedettsegi_hatas'
                elegedettsegi_hatas = 0
                if 'elegedettseg_hatas' in sor:
                    elegedettsegi_hatas = int(sor['elegedettseg_hatas'])
                elif 'elegedettsegi_hatas' in sor:
                    elegedettsegi_hatas = int(sor['elegedettsegi_hatas'])
                
                esemeny = Esemeny(
                    azonosito=int(sor['azonosito']) if 'azonosito' in sor else int(sor['id']),
                    nev=sor['nev'],
                    valoszinuseg=float(sor['valoszinuseg']),
                    penzugyi_hatas=int(sor['penzugyi_hatas']),
                    elegedettsegi_hatas=elegedettsegi_hatas,
                    leiras=sor['leiras'] if 'leiras' in sor else None,
                    tipus=sor['tipus'] if 'tipus' in sor else None,
                    lakossag_hatas=int(sor['lakossag_hatas']) if 'lakossag_hatas' in sor else 0
                )
                esemenyek.append(esemeny)
            except Exception as e:
                print(f"Hiba egy esemény betöltésekor: {e}")
    
    return esemenyek 