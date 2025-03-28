"""
Dátumkezelő segédmodul a városfejlesztési szimulátorhoz
"""
from datetime import datetime, timedelta


def datum_str_alakit(datum_str, formatum='%Y-%m-%d'):
    """
    String formátumú dátum átalakítása datetime objektummá
    
    :param datum_str: Dátum string formátumban
    :param formatum: Dátum formátum (alapértelmezett: '%Y-%m-%d')
    :return: Dátum objektum
    """
    try:
        return datetime.strptime(datum_str, formatum).date()
    except Exception as e:
        print(f"Hiba a dátum feldolgozásakor: {e}")
        return None


def datum_hozzaad_honap(datum, honapok=1):
    """
    Hónapok hozzáadása egy dátumhoz
    
    :param datum: Kiinduló dátum
    :param honapok: Hozzáadandó hónapok száma (alapértelmezett: 1)
    :return: Új dátum
    """
    try:
        # Egyszerű közelítés: egy hónap = 30 nap
        return (datetime.combine(datum, datetime.min.time()) + timedelta(days=30 * honapok)).date()
    except Exception as e:
        print(f"Hiba a dátum módosításakor: {e}")
        return datum


def honapok_szama(kezdo_datum, veg_datum):
    """
    Két dátum között eltelt hónapok száma
    
    :param kezdo_datum: Kezdő dátum
    :param veg_datum: Befejező dátum
    :return: Hónapok száma (közelítő érték)
    """
    try:
        # Egyszerű közelítés: egy hónap = 30 nap
        nap_kulonbseg = (veg_datum - kezdo_datum).days
        return max(0, nap_kulonbseg // 30)
    except Exception as e:
        print(f"Hiba a hónapok számításakor: {e}")
        return 0


def datum_havi_elso_nap(datum):
    """
    Dátum hónapjának első napja
    
    :param datum: Tetszőleges dátum
    :return: A hónap első napjának dátuma
    """
    try:
        return datum.replace(day=1)
    except Exception as e:
        print(f"Hiba a hónap első napjának számításakor: {e}")
        return datum


def datum_formaz(datum, formatum='%Y-%m-%d'):
    """
    Dátum formázása stringgé
    
    :param datum: Dátum objektum
    :param formatum: Kimeneti formátum (alapértelmezett: '%Y-%m-%d')
    :return: Formázott dátum string
    """
    try:
        return datum.strftime(formatum)
    except Exception as e:
        print(f"Hiba a dátum formázásakor: {e}")
        return str(datum)


def aktualis_datum():
    """
    Aktuális dátum
    
    :return: Mai dátum objektum
    """
    return datetime.now().date()


def ellenorzes_ket_datum_kozott(datum, kezdo_datum, veg_datum):
    """
    Ellenőrzi, hogy egy dátum két másik dátum között van-e
    
    :param datum: Ellenőrizendő dátum
    :param kezdo_datum: Kezdő dátum
    :param veg_datum: Befejező dátum
    :return: Igaz, ha a dátum a két másik között van (kezdő és záró dátumot is beleértve)
    """
    return kezdo_datum <= datum <= veg_datum 