"""
Véletlen generátor segédmodul a városfejlesztési szimulátorhoz
"""
import random
import string
from datetime import datetime, timedelta


def veletlen_szam(min_ertek=0, max_ertek=100):
    """
    Véletlen szám generálása adott tartományban
    
    :param min_ertek: Minimális érték (alapértelmezett: 0)
    :param max_ertek: Maximális érték (alapértelmezett: 100)
    :return: Véletlen szám
    """
    return random.randint(min_ertek, max_ertek)


def veletlen_valos_szam(min_ertek=0.0, max_ertek=1.0):
    """
    Véletlen valós szám generálása adott tartományban
    
    :param min_ertek: Minimális érték (alapértelmezett: 0.0)
    :param max_ertek: Maximális érték (alapértelmezett: 1.0)
    :return: Véletlen valós szám
    """
    return random.uniform(min_ertek, max_ertek)


def veletlen_elem(lista):
    """
    Véletlen elem kiválasztása listából
    
    :param lista: Lista, amiből választani szeretnénk
    :return: Véletlen elem a listából vagy None, ha üres a lista
    """
    if not lista:
        return None
    return random.choice(lista)


def veletlen_elemek(lista, db=1):
    """
    Véletlen elemek kiválasztása listából
    
    :param lista: Lista, amiből választani szeretnénk
    :param db: Választandó elemek száma (alapértelmezett: 1)
    :return: Lista a kiválasztott elemekkel
    """
    if not lista or db <= 0:
        return []
    
    # Ha több elemet kérünk, mint amennyi van, akkor az egész listát visszaadjuk
    if db >= len(lista):
        return lista.copy()
    
    return random.sample(lista, db)


def veletlen_datum(kezdo_datum, veg_datum):
    """
    Véletlen dátum generálása adott időszakban
    
    :param kezdo_datum: Kezdő dátum
    :param veg_datum: Befejező dátum
    :return: Véletlen dátum a két időpont között
    """
    if kezdo_datum > veg_datum:
        kezdo_datum, veg_datum = veg_datum, kezdo_datum
    
    nap_kulonbseg = (veg_datum - kezdo_datum).days
    veletlen_napok = random.randint(0, nap_kulonbseg)
    
    return kezdo_datum + timedelta(days=veletlen_napok)


def veletlen_szoveg(hossz=10, betuk=True, szamok=True, specialis=False):
    """
    Véletlen szöveg generálása
    
    :param hossz: Szöveg hossza (alapértelmezett: 10)
    :param betuk: Tartalmazzon-e betűket (alapértelmezett: True)
    :param szamok: Tartalmazzon-e számokat (alapértelmezett: True)
    :param specialis: Tartalmazzon-e speciális karaktereket (alapértelmezett: False)
    :return: Véletlen szöveg
    """
    karakterek = ""
    
    if betuk:
        karakterek += string.ascii_letters
    
    if szamok:
        karakterek += string.digits
    
    if specialis:
        karakterek += string.punctuation
    
    # Ha egyik sincs engedélyezve, akkor alapértelmezetten betűket használunk
    if not karakterek:
        karakterek = string.ascii_letters
    
    return ''.join(random.choice(karakterek) for _ in range(hossz))


def veletlen_valoszinuseg_alapjan(valoszinusegek):
    """
    Véletlen elem kiválasztása valószínűség alapján
    
    :param valoszinusegek: Szótár, ahol a kulcsok az elemek, az értékek pedig a valószínűségek
    :return: Kiválasztott elem
    """
    elemek = list(valoszinusegek.keys())
    sulyok = list(valoszinusegek.values())
    
    # Ellenőrizzük, hogy a súlyok összege 1 körül van-e (kis eltérés megengedett)
    suly_osszeg = sum(sulyok)
    if abs(suly_osszeg - 1.0) > 0.01:
        # Normalizáljuk a súlyokat
        sulyok = [s / suly_osszeg for s in sulyok]
    
    return random.choices(elemek, weights=sulyok, k=1)[0] 