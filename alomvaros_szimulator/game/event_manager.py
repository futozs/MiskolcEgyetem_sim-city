"""
Eseménykezelő modul az Álomváros Szimulátorhoz
"""

import random
import json
import os
from datetime import datetime
from alomvaros_szimulator.models.esemeny import Esemeny

class EventManager:
    """
    Eseménykezelő osztály, amely a játékban előforduló eseményeket kezeli
    """
    
    def __init__(self, game_engine):
        """
        Eseménykezelő inicializálása
        
        :param game_engine: A játékmotor, amelyhez az eseménykezelő kapcsolódik
        """
        self.game_engine = game_engine
        self.esemenyek = []  # Az aktív események listája
        self.esemenyek_tortenete = []  # A megtörtént események története
        self.utohatasu_esemenyek = []  # Az olyan események, amelyeknek későbbi hatásai is lehetnek
        
        # Különböző eseménytípusok valószínűségei (0-1 között)
        self.esemenytipus_valoszinusegek = {
            'gazdasagi': 0.4,
            'tarsadalmi': 0.35,
            'politikai': 0.3,
            'termeszeti': 0.2,
            'kulturalis': 0.25,
            'technologiai': 0.25,
            'egeszsegugy': 0.2,
            'katasztrofa': 0.08,
            'korrupcio': 0.1,
            'biztonsag': 0.15,
            'kornyezeti_katasztrofa': 0.08
        }
        
        # Esemény gyakoriság faktor (1.0 = normál)
        self.event_frequency_factor = 1.2
        
        # Esemény sablon adatok betöltése
        self.esemeny_sablonok = self._betolt_esemeny_sablonok()
        
    def _betolt_esemeny_sablonok(self):
        """
        Esemény sablonok betöltése fájlból vagy alapértelmezett beállítása
        
        :return: Esemény sablonok szótára
        """
        # Alap sablon adatok, ha nem sikerül betölteni a fájlból
        alap_sablonok = {
            'gazdasagi': [
                {
                    'nev': 'Gazdasági fellendülés',
                    'leiras': 'A helyi gazdaság fellendült, több munkahely jött létre.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': 5000000,
                        'boldogsag': 5,
                        'munkanelkuliseg': -2
                    }
                },
                {
                    'nev': 'Gazdasági válság',
                    'leiras': 'Gazdasági visszaesés sújtja a régiót.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -3000000,
                        'boldogsag': -10,
                        'munkanelkuliseg': 5
                    }
                },
                {
                    'nev': 'Új befektetők',
                    'leiras': 'Külföldi befektetők érdeklődnek a város iránt.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': 8000000,
                        'munkanelkuliseg': -3,
                        'gazdasagi_faktor': 0.2
                    }
                },
                {
                    'nev': 'Súlyos gazdasági válság',
                    'leiras': 'Globális gazdasági válság gyűrűzött be a városba, komoly következményekkel.',
                    'valoszinuseg': 0.1,
                    'hatas': {
                        'penz': -12000000,
                        'boldogsag': -10,
                        'lakossag': -150
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Helyi nagyvállalat csődje',
                    'leiras': 'A város egyik legnagyobb munkaadója csődbe ment.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -7000000,
                        'boldogsag': -8,
                        'lakossag': -100
                    }
                },
                {
                    'nev': 'Inflációs sokk',
                    'leiras': 'Hirtelen megugrott az infláció, amely nehéz helyzetbe hozta a lakosságot.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': -10,
                        'lakossag': -75
                    }
                }
            ],
            'tarsadalmi': [
                {
                    'nev': 'Kulturális fesztivál',
                    'leiras': 'Sikeres kulturális fesztivált rendeztek a városban.',
                    'valoszinuseg': 0.4,
                    'hatas': {
                        'penz': 2000000,
                        'boldogsag': 8,
                        'lakossag': 50
                    }
                },
                {
                    'nev': 'Oktatási reform',
                    'leiras': 'Az oktatási rendszer reformja pozitív hatással van a város fejlődésére.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -1000000,
                        'oktatas_szint': 5,
                        'boldogsag': 3
                    }
                },
                {
                    'nev': 'Társadalmi elégedetlenség',
                    'leiras': 'A lakosság elégedetlen a jelenlegi körülményekkel.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'boldogsag': -15,
                        'lakossag_valtozas': -0.02  # 2% csökkenés
                    }
                },
                {
                    'nev': 'Zavargások',
                    'leiras': 'Társadalmi feszültségek zavargásokhoz vezettek a városban.',
                    'valoszinuseg': 0.1,
                    'hatas': {
                        'penz': -6000000,
                        'boldogsag': -12,
                        'lakossag': -80
                    }
                },
                {
                    'nev': 'Tömeges kivándorlás',
                    'leiras': 'Egyre több lakos költözik el a városból jobb lehetőségek reményében.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -3000000,
                        'boldogsag': -6,
                        'lakossag': -200
                    }
                },
                {
                    'nev': 'Lakhatási válság',
                    'leiras': 'A megfizethető lakhatás hiánya társadalmi válságot okoz.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -4000000,
                        'boldogsag': -10,
                        'lakossag': -100
                    }
                }
            ],
            'politikai': [
                {
                    'nev': 'Állami támogatás',
                    'leiras': 'A város jelentős állami támogatást kapott.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': 15000000,
                        'boldogsag': 5
                    }
                },
                {
                    'nev': 'Adóemelés',
                    'leiras': 'Az országos adóemelés hatással van a város költségvetésére.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': -2000000,
                        'boldogsag': -8,
                        'ado_szazalek': 2
                    }
                },
                {
                    'nev': 'Politikai botrány',
                    'leiras': 'Politikai botrány rázta meg a várost.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'boldogsag': -10,
                        'kozbizonsag_szint': -5
                    }
                }
            ],
            'termeszeti': [
                {
                    'nev': 'Jó időjárás',
                    'leiras': 'A kiváló időjárás kedvez a mezőgazdaságnak és a turizmusnak.',
                    'valoszinuseg': 0.4,
                    'hatas': {
                        'penz': 1000000,
                        'boldogsag': 5,
                        'kornyezet': 2
                    }
                },
                {
                    'nev': 'Környezetvédelmi projekt',
                    'leiras': 'Sikeres környezetvédelmi projektek indultak a városban.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': -2000000,
                        'kornyezet': 8,
                        'boldogsag': 3
                    }
                },
                {
                    'nev': 'Aszály',
                    'leiras': 'Hosszan tartó aszály sújtja a régiót.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -3000000,
                        'kornyezet': -10,
                        'boldogsag': -5
                    }
                }
            ],
            'kulturalis': [
                {
                    'nev': 'Nemzetközi díj',
                    'leiras': 'A város nemzetközi díjat nyert kulturális értékeiért.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': 3000000,
                        'boldogsag': 10,
                        'lakossag': 100
                    }
                },
                {
                    'nev': 'Film forgatás',
                    'leiras': 'Nagyszabású film forgatása kezdődött a városban.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': 5000000,
                        'boldogsag': 5,
                        'lakossag': 50
                    }
                },
                {
                    'nev': 'Kulturális örökség veszélyben',
                    'leiras': 'A város kulturális öröksége veszélybe került.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -2000000,
                        'boldogsag': -5
                    }
                }
            ],
            'technologiai': [
                {
                    'nev': 'Technológiai áttörés',
                    'leiras': 'Helyi vállalat technológiai áttörést ért el.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': 6000000,
                        'munkanelkuliseg': -2,
                        'gazdasagi_faktor': 0.2
                    }
                },
                {
                    'nev': 'Digitális város program',
                    'leiras': 'A város belevágott egy digitális város programba.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': 5,
                        'hatekonyság': 0.1
                    }
                },
                {
                    'nev': 'IT cégek érkezése',
                    'leiras': 'Több IT cég nyitott irodát a városban.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': 4000000,
                        'munkanelkuliseg': -5,
                        'lakossag': 200
                    }
                }
            ],
            'egeszsegugy': [
                {
                    'nev': 'Egészségügyi fejlesztés',
                    'leiras': 'Jelentős egészségügyi fejlesztések valósultak meg.',
                    'valoszinuseg': 0.3,
                    'hatas': {
                        'penz': -4000000,
                        'egeszsegugy_szint': 10,
                        'boldogsag': 5
                    }
                },
                {
                    'nev': 'Járvány',
                    'leiras': 'Járvány ütötte fel a fejét a városban.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -2000000,
                        'lakossag_valtozas': -0.02,  # 2% csökkenés
                        'boldogsag': -10,
                        'egeszsegugy_szint': -3
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Orvosi konferencia',
                    'leiras': 'Nemzetközi orvosi konferenciát rendeztek a városban.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': 2000000,
                        'egeszsegugy_szint': 3,
                        'boldogsag': 2
                    }
                },
                {
                    'nev': 'Súlyos járvány',
                    'leiras': 'Veszélyes járvány ütötte fel a fejét a városban.',
                    'valoszinuseg': 0.1,
                    'hatas': {
                        'penz': -8000000,
                        'boldogsag': -15,
                        'lakossag': -250
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Ivóvízszennyezés',
                    'leiras': 'Az ivóvízhálózat szennyezetté vált.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -6000000,
                        'boldogsag': -12,
                        'lakossag': -100,
                        'kornyezet': -10
                    }
                },
                {
                    'nev': 'Légszennyezettségi krízis',
                    'leiras': 'Veszélyes mértékűre emelkedett a légszennyezettség.',
                    'valoszinuseg': 0.35,
                    'hatas': {
                        'penz': -8000000,
                        'boldogsag': -15,
                        'lakossag': -100,
                        'kornyezet': -20
                    }
                }
            ],
            'katasztrofa': [
                {
                    'nev': 'Árvíz',
                    'leiras': 'A folyó kiöntött és elárasztotta a város egy részét.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -8000000,
                        'boldogsag': -10,
                        'kornyezet': -8,
                        'lakossag': -100
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Földrengés',
                    'leiras': 'Földrengés rázta meg a várost, súlyos károkat okozva.',
                    'valoszinuseg': 0.1,
                    'hatas': {
                        'penz': -12000000,
                        'boldogsag': -15,
                        'kornyezet': -10,
                        'lakossag': -150
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Tűzvész',
                    'leiras': 'Tűz pusztít a város egy részén.',
                    'valoszinuseg': 0.25,
                    'hatas': {
                        'penz': -10000000,
                        'boldogsag': -12,
                        'kornyezet': -8,
                        'lakossag': -150
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Szélvihar',
                    'leiras': 'Rendkívüli erősségű szélvihar söpört végig a városon.',
                    'valoszinuseg': 0.35,
                    'hatas': {
                        'penz': -8000000,
                        'boldogsag': -7,
                        'kornyezet': -5,
                        'lakossag': -50
                    }
                },
                {
                    'nev': 'Hőhullám',
                    'leiras': 'Rekordmagas hőmérséklet sújtja a várost.',
                    'valoszinuseg': 0.4,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': -10,
                        'kornyezet': -5,
                        'lakossag': -100
                    }
                }
            ],
            'korrupcio': [
                {
                    'nev': 'Korrupciós botrány',
                    'leiras': 'Korrupciós botrány tört ki a városvezetésben.',
                    'valoszinuseg': 0.25,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': -10
                    }
                },
                {
                    'nev': 'Sikkasztási ügy',
                    'leiras': 'Városi pénzek tűntek el egy nagyszabású projekt során.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -7000000,
                        'boldogsag': -8
                    }
                },
                {
                    'nev': 'Csúszópénz botrány',
                    'leiras': 'A helyi média csúszópénz botrányt tárt fel az építkezések körül.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -3000000,
                        'boldogsag': -8,
                        'kockazat': {
                            'kockazat_tipus': 'társadalmi',
                            'kockazat_ertek': 10
                        }
                    }
                }
            ],
            'biztonsag': [
                {
                    'nev': 'Bűnözési hullám',
                    'leiras': 'Növekvő bűnözési hullám söpört végig a városon.',
                    'valoszinuseg': 0.35,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': -15,
                        'lakossag': -100
                    }
                },
                {
                    'nev': 'Bandaháború',
                    'leiras': 'Rivális bandák közötti erőszak terjed a város egyes részein.',
                    'valoszinuseg': 0.25,
                    'hatas': {
                        'penz': -8000000,
                        'boldogsag': -18,
                        'lakossag': -150,
                        'infrastruktura': {
                            'infrastruktura_tipus': 'közbiztonság',
                            'infrastruktura_ertek': -15
                        }
                    }
                },
                {
                    'nev': 'Terrorfenyegetés',
                    'leiras': 'Terrorista fenyegetés miatt biztonsági intézkedéseket kellett bevezetni.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -12000000,
                        'boldogsag': -20,
                        'lakossag': -80
                    },
                    'kritikus': True
                }
            ],
            'kornyezeti_katasztrofa': [
                {
                    'nev': 'Ipari szennyezés',
                    'leiras': 'Helyi gyár környezeti szennyezést okozott.',
                    'valoszinuseg': 0.25,
                    'hatas': {
                        'penz': -4000000,
                        'boldogsag': -8,
                        'kornyezet': -15
                    }
                },
                {
                    'nev': 'Vegyi anyag szivárgás',
                    'leiras': 'Veszélyes vegyi anyagok szivárogtak a talajvízbe.',
                    'valoszinuseg': 0.15,
                    'hatas': {
                        'penz': -7000000,
                        'boldogsag': -10,
                        'kornyezet': -20,
                        'lakossag': -80
                    },
                    'kritikus': True
                },
                {
                    'nev': 'Olajszennyezés',
                    'leiras': 'Olajszennyezés érte a város közelében lévő vízfelületet.',
                    'valoszinuseg': 0.2,
                    'hatas': {
                        'penz': -5000000,
                        'boldogsag': -6,
                        'kornyezet': -18
                    }
                }
            ]
        }
        
        # Próbálkozunk az esemény adatok betöltésével fájlból
        try:
            # Fájl elérési útja
            script_dir = os.path.dirname(os.path.abspath(__file__))
            data_dir = os.path.join(script_dir, '..', 'data')
            esemeny_fajl = os.path.join(data_dir, 'esemenyek.json')
            
            # Ha létezik a fájl, betöltjük
            if os.path.exists(esemeny_fajl):
                with open(esemeny_fajl, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Hiba az esemény sablonok betöltésekor: {e}")
        
        # Ha nem sikerült a betöltés, visszaadjuk az alapértelmezett sablonokat
        return alap_sablonok

    def esemenyek_generalasa(self, fordulo_szam):
        """
        Események generálása az aktuális fordulóra
        
        :param fordulo_szam: Az aktuális forduló száma
        :return: A generált események listája
        """
        # Események listája
        generalt_esemenyek = []
        
        # Fordulónkénti alap esemény esély (10-20% között)
        alap_esemeny_esely = 0.2 * self.event_frequency_factor
        
        # Városi adatok lekérése
        varos = self.game_engine.varos
        if not varos:
            return []
        
        # Fordulószám befolyásolja az eseményeket
        fordulo_modosito = 1.0
        if fordulo_szam % 10 == 0:
            fordulo_modosito = 1.8  # Minden 10. forduló kritikus
        elif fordulo_szam % 5 == 0:
            fordulo_modosito = 1.4  # Minden 5. forduló fontos mérföldkő
        
        # Boldogság befolyásolja az eseményeket
        boldogsag_modosito = 1.0
        if hasattr(varos, 'lakossag_elegedettseg'):
            if varos.lakossag_elegedettseg < 30:
                boldogsag_modosito = 1.5  # Több negatív esemény alacsony boldogságnál
            elif varos.lakossag_elegedettseg < 50:
                boldogsag_modosito = 1.2  # Több negatív esemény
            elif varos.lakossag_elegedettseg > 70:
                boldogsag_modosito = 0.9  # Kevesebb negatív esemény
        
        # Kockázati tényezők befolyásolják az események típusát és valószínűségét
        kockazati_modositok = {}
        
        if hasattr(varos, 'kockazati_tenyezok'):
            for kockazat_tipus, ertek in varos.kockazati_tenyezok.items():
                # Magasabb kockázat = nagyobb esély az adott típusú eseményre
                kockazati_modositok[kockazat_tipus] = 1.0 + (ertek / 150)  # Csökkentett hatás
        
        # Infrastruktúra állapota befolyásolja az eseményeket
        infrastruktura_modositok = {}
        
        if hasattr(varos, 'infrastruktura_allapot'):
            for infra_tipus, ertek in varos.infrastruktura_allapot.items():
                # Rosszabb infrastruktúra = nagyobb esély a negatív eseményekre
                infrastruktura_modositok[infra_tipus] = 1.5 - (ertek / 200)  # Csökkentett hatás (0% = 1.5x, 100% = 1.0x)
        
        # Végső esemény esély
        esemeny_esely = alap_esemeny_esely * fordulo_modosito * boldogsag_modosito
        
        # Már aktív utóhatású események feldolgozása
        self._feldolgoz_utohatasu_esemenyeket(fordulo_szam)
        
        # Kockázati szintek alapján bizonyos eseménytípusok előnyben részesítése
        prioritasos_esemeny_tipusok = []
        
        # Ha a társadalmi kockázat magas, társadalmi esemény generálása
        if hasattr(varos, 'kockazati_tenyezok') and varos.kockazati_tenyezok.get('társadalmi', 0) > 80:
            prioritasos_esemeny_tipusok.append('tarsadalmi')
            if random.random() < 0.5:  # 50% esély (csökkentett, előzőleg 70%)
                esemeny = self._general_egyedi_esemeny('tarsadalmi', fordulo_szam, forceNegative=True)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
        
        # Ha a gazdasági kockázat magas, gazdasági esemény generálása
        if hasattr(varos, 'kockazati_tenyezok') and varos.kockazati_tenyezok.get('gazdasági', 0) > 75:
            prioritasos_esemeny_tipusok.append('gazdasagi')
            if random.random() < 0.4:  # 40% esély (csökkentett, előzőleg 60%)
                esemeny = self._general_egyedi_esemeny('gazdasagi', fordulo_szam, forceNegative=True)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
        
        # Ha a környezeti kockázat magas, természeti vagy környezeti katasztrófa generálása
        if hasattr(varos, 'kockazati_tenyezok') and varos.kockazati_tenyezok.get('környezeti', 0) > 75:
            prioritasos_esemeny_tipusok.extend(['termeszeti', 'kornyezeti_katasztrofa'])
            if random.random() < 0.35:  # 35% esély (csökkentett, előzőleg 50%)
                esemeny_tipus = random.choice(['termeszeti', 'kornyezeti_katasztrofa'])
                esemeny = self._general_egyedi_esemeny(esemeny_tipus, fordulo_szam, forceNegative=True)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
        
        # Ha az egészségügyi kockázat magas, egészségügyi esemény generálása
        if hasattr(varos, 'kockazati_tenyezok') and varos.kockazati_tenyezok.get('egészségügyi', 0) > 80:
            prioritasos_esemeny_tipusok.append('egeszsegugy')
            if random.random() < 0.45:  # 45% esély (csökkentett, előzőleg 65%)
                esemeny = self._general_egyedi_esemeny('egeszsegugy', fordulo_szam, forceNegative=True)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
        
        # Ha az infrastruktúra állapota rossz, katasztrófa vagy infrastruktúra esemény generálása
        rossz_infrastruktura = False
        for infra_tipus, ertek in varos.infrastruktura_allapot.items():
            if ertek < 25:  # Kritikusan rossz infrastruktúra (előzőleg 30)
                rossz_infrastruktura = True
                break
        
        if rossz_infrastruktura and random.random() < 0.3:  # 30% esély (csökkentett, előzőleg 40%)
            esemeny_tipus = random.choice(['katasztrofa', 'termeszeti'])
            esemeny = self._general_egyedi_esemeny(esemeny_tipus, fordulo_szam, forceNegative=True)
            if esemeny:
                generalt_esemenyek.append(esemeny)
        
        # Ha a lakosság elégedettsége nagyon alacsony, társadalmi vagy politikai esemény
        if hasattr(varos, 'lakossag_elegedettseg') and varos.lakossag_elegedettseg < 15:
            if random.random() < 0.5:  # 50% esély (csökkentett, előzőleg 70%)
                esemeny_tipus = random.choice(['tarsadalmi', 'politikai'])
                esemeny = self._general_egyedi_esemeny(esemeny_tipus, fordulo_szam, forceNegative=True)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
        
        # Minden eseménytípusra próbálunk generálni eseményt
        for esemeny_tipus, valoszinuseg in self.esemenytipus_valoszinusegek.items():
            # Ha már generáltunk prioritásos eseményt ebből a típusból, csökkentsük az esélyt
            if esemeny_tipus in prioritasos_esemeny_tipusok:
                valoszinuseg *= 0.3  # 70% csökkentés
            
            # Kockázati módosítók alkalmazása
            tipus_modosito = 1.0
            
            # Társadalmi kockázat növeli a társadalmi események esélyét
            if esemeny_tipus == 'tarsadalmi' and 'társadalmi' in kockazati_modositok:
                tipus_modosito *= kockazati_modositok['társadalmi']
            
            # Gazdasági kockázat növeli a gazdasági események esélyét
            elif esemeny_tipus == 'gazdasagi' and 'gazdasági' in kockazati_modositok:
                tipus_modosito *= kockazati_modositok['gazdasági']
            
            # Környezeti kockázat növeli a természeti és katasztrófa események esélyét
            elif esemeny_tipus in ['termeszeti', 'katasztrofa', 'kornyezeti_katasztrofa'] and 'környezeti' in kockazati_modositok:
                tipus_modosito *= kockazati_modositok['környezeti']
            
            # Egészségügyi kockázat növeli az egészségügyi események esélyét
            elif esemeny_tipus == 'egeszsegugy' and 'egészségügyi' in kockazati_modositok:
                tipus_modosito *= kockazati_modositok['egészségügyi']
            
            # Infrastruktúra állapot befolyásolja az eseményeket
            if esemeny_tipus in ['katasztrofa', 'termeszeti'] and 'közlekedés' in infrastruktura_modositok:
                tipus_modosito *= infrastruktura_modositok['közlekedés']
            
            if esemeny_tipus == 'egeszsegugy' and 'egészségügy' in infrastruktura_modositok:
                tipus_modosito *= infrastruktura_modositok['egészségügy']
            
            if esemeny_tipus == 'biztonsag' and 'közbiztonság' in infrastruktura_modositok:
                tipus_modosito *= infrastruktura_modositok['közbiztonság']
            
            # Esemény generálás esély
            if random.random() < valoszinuseg * esemeny_esely * tipus_modosito:
                # Esemény generálása az adott típusból
                esemeny = self._general_egyedi_esemeny(esemeny_tipus, fordulo_szam)
                if esemeny:
                    generalt_esemenyek.append(esemeny)
                    
                    # Ha az eseménynek van utóhatása, hozzáadjuk az utóhatású eseményekhez
                    if 'utohatasu' in esemeny and esemeny['utohatasu']:
                        self.utohatasu_esemenyek.append({
                            'eredeti_esemeny': esemeny,
                            'kezdeti_fordulo': fordulo_szam,
                            'hatasok': esemeny.get('utohatasu_hatasok', [])
                        })
        
        # Garantálunk legalább 1 eseményt minden fordulóban
        if not generalt_esemenyek:
            # Ha nincs esemény, generálunk egy véletlen eseményt
            valasztott_tipus = random.choices(
                list(self.esemenytipus_valoszinusegek.keys()),
                weights=list(self.esemenytipus_valoszinusegek.values()),
                k=1
            )[0]
            
            esemeny = self._general_egyedi_esemeny(valasztott_tipus, fordulo_szam)
            if esemeny:
                generalt_esemenyek.append(esemeny)
        
        # A generált események hozzáadása a történethez
        for esemeny in generalt_esemenyek:
            self.esemenyek_tortenete.append({
                'fordulo': fordulo_szam,
                'esemeny': esemeny
            })
        
        return generalt_esemenyek
        
    def _general_egyedi_esemeny(self, esemeny_tipus, fordulo_szam, forceNegative=False):
        """
        Egyedi esemény generálása a megadott típusból
        
        :param esemeny_tipus: Az esemény típusa
        :param fordulo_szam: Az aktuális forduló száma
        :param forceNegative: Ha True, csak negatív eseményt generálunk
        :return: A generált esemény
        """
        # Ellenőrizzük, hogy van-e ilyen típusú esemény a sablonokban
        if esemeny_tipus not in self.esemeny_sablonok:
            return None
        
        # Lehetséges események a típuson belül
        lehetseges_esemenyek = self.esemeny_sablonok[esemeny_tipus]
        if not lehetseges_esemenyek:
            return None
            
        # Ha csak negatív eseményeket akarunk
        if forceNegative:
            negativ_esemenyek = []
            for esemeny in lehetseges_esemenyek:
                # Megnézzük, hogy negatív-e az esemény (pénzügyi hatás vagy boldogság)
                if ('hatas' in esemeny and 
                    ('penz' in esemeny['hatas'] and esemeny['hatas']['penz'] < 0 or
                     'boldogsag' in esemeny['hatas'] and esemeny['hatas']['boldogsag'] < 0)):
                    negativ_esemenyek.append(esemeny)
            
            if negativ_esemenyek:
                lehetseges_esemenyek = negativ_esemenyek
        
        # Valószínűség alapú esemény kiválasztás
        esemeny_valoszinusegek = [e.get('valoszinuseg', 0.1) for e in lehetseges_esemenyek]
        ossz_valoszinuseg = sum(esemeny_valoszinusegek)
        
        if ossz_valoszinuseg == 0:
            # Ha nincs valószínűség megadva, egyenlő eséllyel választunk
            kivalasztott_esemeny = random.choice(lehetseges_esemenyek)
        else:
            # Valószínűség alapú kiválasztás
            r = random.uniform(0, ossz_valoszinuseg)
            aktualis_val = 0
            kivalasztott_esemeny = None
            
            for i, val in enumerate(esemeny_valoszinusegek):
                aktualis_val += val
                if r <= aktualis_val:
                    kivalasztott_esemeny = lehetseges_esemenyek[i]
                    break
            
            # Ha valami hiba történt, egyszerűen válasszunk egy véletlent
            if kivalasztott_esemeny is None:
                kivalasztott_esemeny = random.choice(lehetseges_esemenyek)
        
        # Egyedi azonosító és időbélyeg generálása
        egyedi_id = f"{esemeny_tipus}_{fordulo_szam}_{random.randint(1000, 9999)}"
        idopecsét = datetime.now().isoformat()
        
        # Esemény másolat létrehozása, hogy ne módosítsuk az eredetit
        esemeny = kivalasztott_esemeny.copy()
        
        # Kiegészítő adatok hozzáadása
        esemeny['id'] = egyedi_id
        esemeny['tipus'] = esemeny_tipus
        esemeny['idopecset'] = idopecsét
        esemeny['fordulo'] = fordulo_szam
        
        # Városi adatok lekérése
        varos = self.game_engine.varos
        if varos:
            # A hatások skálázása a város méretéhez
            if 'hatas' in esemeny:
                # Pénzügyi hatás skálázása
                if 'penz' in esemeny['hatas']:
                    skala_faktor = max(1.0, varos.lakosok_szama / 1000)
                    esemeny['hatas']['penz'] = int(esemeny['hatas']['penz'] * skala_faktor)
                
                # Lakosság változás feldolgozása
                if 'lakossag_valtozas' in esemeny['hatas']:
                    valtozas_szazalek = esemeny['hatas']['lakossag_valtozas']
                    esemeny['hatas']['lakossag'] = int(varos.lakosok_szama * valtozas_szazalek)
                    del esemeny['hatas']['lakossag_valtozas']
        
        return esemeny

    def _feldolgoz_utohatasu_esemenyeket(self, fordulo_szam):
        """
        Utóhatású események feldolgozása
        
        :param fordulo_szam: Az aktuális forduló száma
        :return: Az utóhatásokból generált események listája
        """
        uj_esemenyek = []
        torlendo_indexpoziciok = []
        
        for i, utohatasu in enumerate(self.utohatasu_esemenyek):
            kezdeti_fordulo = utohatasu.get('kezdeti_fordulo', 0)
            hatasok = utohatasu.get('hatasok', [])
            
            # Ellenőrizzük, hogy van-e még feldolgozandó hatás
            feldolgozando_hatasok = [h for h in hatasok if h.get('fordulo_eltolas', 0) + kezdeti_fordulo == fordulo_szam]
            
            for hatas in feldolgozando_hatasok:
                # Esemény létrehozása a hatásból
                eredeti_esemeny = utohatasu.get('eredeti_esemeny', {})
                uj_esemeny = {
                    'id': f"{eredeti_esemeny.get('id', 'esemeny')}_{fordulo_szam}_{random.randint(1000, 9999)}",
                    'tipus': eredeti_esemeny.get('tipus', 'utohatasu'),
                    'nev': hatas.get('nev', f"{eredeti_esemeny.get('nev', 'Esemény')} utóhatása"),
                    'leiras': hatas.get('leiras', 'Egy korábbi esemény utóhatása.'),
                    'hatas': hatas.get('hatas', {}),
                    'fordulo': fordulo_szam,
                    'idopecset': datetime.now().isoformat(),
                    'eredeti_esemeny_id': eredeti_esemeny.get('id', '')
                }
                
                # Hozzáadjuk az új eseményekhez
                uj_esemenyek.append(uj_esemeny)
            
            # Ellenőrizzük, hogy maradt-e még feldolgozatlan hatás
            remaining_hatasok = [h for h in hatasok if h.get('fordulo_eltolas', 0) + kezdeti_fordulo > fordulo_szam]
            
            if not remaining_hatasok:
                # Ha nincs több hatás, jelöljük törlésre
                torlendo_indexpoziciok.append(i)
        
        # Töröljük a feldolgozott utóhatású eseményeket (fordított sorrendben, hogy ne változzon az index)
        for i in sorted(torlendo_indexpoziciok, reverse=True):
            if i < len(self.utohatasu_esemenyek):
                del self.utohatasu_esemenyek[i]
        
        return uj_esemenyek

    def esemenyek_alkalmazasa(self, esemenyek):
        """
        Események alkalmazása a városra
        
        :param esemenyek: Az alkalmazandó események listája
        :return: Az alkalmazott események hatásainak listája
        """
        eredmenyek = []
        
        # Város referencia lekérése
        varos = self.game_engine.varos
        if not varos:
            return eredmenyek
        
        # Események alkalmazása
        for esemeny in esemenyek:
            eredmeny = varos._feldolgoz_esemeny(esemeny)
            if eredmeny:
                eredmenyek.append(eredmeny)
                
                # Kritikus események külön kezelése
                if esemeny.get('kritikus', False):
                    self._handle_kritikus_esemeny(esemeny)
        
        return eredmenyek
    
    def _handle_kritikus_esemeny(self, esemeny):
        """
        Kritikus esemény kezelése
        
        :param esemeny: A kritikus esemény
        """
        # Itt lehet további logikát implementálni a kritikus események kezeléséhez
        
        # Város referencia lekérése
        varos = self.game_engine.varos
        if not varos:
            return
            
        # Esemény típusa alapján specifikus kezelés
        esemeny_tipus = esemeny.get('tipus', '')
        esemeny_nev = esemeny.get('nev', 'Ismeretlen kritikus esemény')
        
        # Katasztrófa események különleges kezelése
        if esemeny_tipus == 'katasztrofa':
            # Minden infrastruktúra típus állapotának csökkentése
            for infra_tipus in varos.infrastruktura_allapot:
                csokkenés = random.randint(5, 15)  # Mérsékelt csökkenés (előzőleg 15-30)
                varos.infrastruktura_allapot[infra_tipus] = max(0, varos.infrastruktura_allapot[infra_tipus] - csokkenés)
            
            # Krízisállapot beállítása a városban
            if hasattr(varos, 'krizisallapot'):
                varos.krizisallapot = True
                varos.krizis_tipusa = f"Katasztrófa: {esemeny_nev}"
                varos.krizis_fordulo = self.game_engine.fordulo_szamlalo
                varos.krizis_hataridó = self.game_engine.fordulo_szamlalo + random.randint(2, 4)  # 2-4 fordulóig tart (előzőleg 3-6)
            
            # Utóhatások beállítása
            utohatasu_hatasok = [
                {
                    'nev': f"Utóhatás: {esemeny_nev} - helyreállítás",
                    'fordulo': 1,  # 1 fordulóval később
                    'hatas': {
                        'penz': -random.randint(2000000, 5000000),  # Csökkentett költség (előzőleg 5-10M)
                        'boldogsag': -3
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - további károk",
                    'fordulo': 2,  # 2 fordulóval később
                    'hatas': {
                        'penz': -random.randint(1000000, 2500000),  # Csökkentett költség (előzőleg 2-5M)
                        'boldogsag': -2
                    }
                }
            ]
            
            # Hozzáadjuk az utóhatásokat az utóhatású események listájához
            self.utohatasu_esemenyek.append({
                'eredeti_esemeny': esemeny,
                'kezdeti_fordulo': self.game_engine.fordulo_szamlalo,
                'hatasok': utohatasu_hatasok
            })
        
        # Gazdasági válság események kezelése
        elif esemeny_tipus == 'gazdasagi' and 'válság' in esemeny_nev.lower():
            # Gazdasági növekedés mérsékelt csökkentése
            varos.gazdasagi_novekedes = max(0.7, varos.gazdasagi_novekedes - random.uniform(0.1, 0.2))  # Kevésbé csökkentjük
            
            # Hosszú távú hatások beállítása
            utohatasu_hatasok = [
                {
                    'nev': f"Utóhatás: {esemeny_nev} - gazdasági visszaesés",
                    'fordulo': 1,
                    'hatas': {
                        'penz': -random.randint(2000000, 4000000),  # Csökkentett (előzőleg 5-8M)
                        'boldogsag': -2,
                        'lakossag': -random.randint(30, 80)  # Csökkentett (előzőleg 50-150)
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - tartós hatások",
                    'fordulo': 2,
                    'hatas': {
                        'penz': -random.randint(1500000, 3000000),  # Csökkentett (előzőleg 3-6M)
                        'boldogsag': -1
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - lassú kilábalás",
                    'fordulo': 3,  # Gyorsabb kilábalás (előzőleg 5 forduló)
                    'hatas': {
                        'penz': random.randint(1000000, 2500000),
                        'boldogsag': 2
                    }
                }
            ]
            
            # Hozzáadjuk az utóhatásokat
            self.utohatasu_esemenyek.append({
                'eredeti_esemeny': esemeny,
                'kezdeti_fordulo': self.game_engine.fordulo_szamlalo,
                'hatasok': utohatasu_hatasok
            })
        
        # Egészségügyi válság (pl. járvány)
        elif esemeny_tipus == 'egeszsegugy' and ('járvány' in esemeny_nev.lower() or 'fertőzés' in esemeny_nev.lower()):
            # Egészségügyi krízis - mérsékeltebb kockázatnövekedés
            if hasattr(varos, 'kockazati_tenyezok') and 'egészségügyi' in varos.kockazati_tenyezok:
                varos.kockazati_tenyezok['egészségügyi'] = min(100, varos.kockazati_tenyezok['egészségügyi'] + 25)  # Csökkentett (előzőleg +40)
            
            # Utóhatások: több hullám, de mérsékeltebb hatással
            utohatasu_hatasok = [
                {
                    'nev': f"Utóhatás: {esemeny_nev} - további esetek",
                    'fordulo': 1,
                    'hatas': {
                        'penz': -random.randint(3000000, 6000000),  # Csökkentett (előzőleg 8-15M)
                        'boldogsag': -5,
                        'lakossag': -random.randint(50, 150)  # Csökkentett (előzőleg 100-300)
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - egészségügyi intézkedések",
                    'fordulo': 2,  # Gyorsabb (előzőleg 4 forduló)
                    'hatas': {
                        'penz': -3000000,
                        'boldogsag': 3
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - járvány lecsengése",
                    'fordulo': 3,  # Gyorsabb (előzőleg 6 forduló)
                    'hatas': {
                        'boldogsag': 8
                    }
                }
            ]
            
            self.utohatasu_esemenyek.append({
                'eredeti_esemeny': esemeny,
                'kezdeti_fordulo': self.game_engine.fordulo_szamlalo,
                'hatasok': utohatasu_hatasok
            })
        
        # Társadalmi krízis - mérsékeltebb hatásokkal
        elif esemeny_tipus == 'tarsadalmi' and ('zavargás' in esemeny_nev.lower() or 'tüntetés' in esemeny_nev.lower()):
            # Társadalmi krízis hatások
            if hasattr(varos, 'kockazati_tenyezok') and 'társadalmi' in varos.kockazati_tenyezok:
                varos.kockazati_tenyezok['társadalmi'] = min(100, varos.kockazati_tenyezok['társadalmi'] + 20)  # Csökkentett (előzőleg +30)
            
            # Utóhatások: társadalmi feszültségek - mérsékeltebb
            utohatasu_hatasok = [
                {
                    'nev': f"Utóhatás: {esemeny_nev} - további feszültség",
                    'fordulo': 1,
                    'hatas': {
                        'penz': -random.randint(1000000, 3000000),  # Csökkentett (előzőleg 2-5M)
                        'boldogsag': -3
                    }
                },
                {
                    'nev': f"Utóhatás: {esemeny_nev} - helyzet rendeződése",
                    'fordulo': 2,  # Gyorsabb (előzőleg 3 forduló)
                    'hatas': {
                        'boldogsag': 4
                    }
                }
            ]
            
            self.utohatasu_esemenyek.append({
                'eredeti_esemeny': esemeny,
                'kezdeti_fordulo': self.game_engine.fordulo_szamlalo,
                'hatasok': utohatasu_hatasok
            })
            
        # Játékos értesítése a kritikus eseményről
        if hasattr(self.game_engine, 'notify_player'):
            self.game_engine.notify_player(f"KRITIKUS ESEMÉNY: {esemeny_nev}", 
                                      f"Súlyos válsághelyzet alakult ki a városban! További hatások várhatók a következő fordulókban.",
                                      sulyossag="kritikus")
    
    def esemeny_hozzaadasa(self, esemeny):
        """
        Egyedi esemény hozzáadása az események történetéhez
        
        :param esemeny: Az esemény objektum vagy adatok
        """
        try:
            # Ha már Esemeny objektum (hagyományos formátum)
            if isinstance(esemeny, Esemeny):
                # Átkonvertáljuk az Esemeny objektumot szótárrá
                esemeny_dict = {
                    'id': f"egyedi_{random.randint(1000, 9999)}",
                    'nev': esemeny.nev if hasattr(esemeny, 'nev') else "Egyedi esemény",
                    'leiras': esemeny.leiras if hasattr(esemeny, 'leiras') else "",
                    'tipus': esemeny.tipus if hasattr(esemeny, 'tipus') else "esemeny",
                    'idopecset': datetime.now().isoformat(),
                    'fordulo': self.game_engine.fordulo_szamlalo if hasattr(self.game_engine, 'fordulo_szamlalo') else 0,
                    'hatas': {
                        'penz': esemeny.penzugyi_hatas if hasattr(esemeny, 'penzugyi_hatas') else 0,
                        'boldogsag': esemeny.elegedettsegi_hatas if hasattr(esemeny, 'elegedettsegi_hatas') else 0,
                        'lakossag': esemeny.lakossag_hatas if hasattr(esemeny, 'lakossag_hatas') else 0
                    }
                }
            # Ha új formátumú, közvetlenül a paraméterekkel
            elif hasattr(esemeny, 'tipus') and hasattr(esemeny, 'uzenet'):
                hatas = esemeny.hatas if hasattr(esemeny, 'hatas') else {}
                
                # Azonosító generálása
                azonosito = len(self.esemenyek_tortenete) + 1
                
                # Pénzügyi és egyéb hatások kinyerése
                penzugyi_hatas = hatas.get('penz', 0)
                elegedettseg_hatas = hatas.get('elegedettseg', 0)
                lakossag_hatas = hatas.get('lakossag', 0)
                
                # Esemény létrehozása a standard formátumban
                esemeny_obj = Esemeny(
                    azonosito=azonosito,
                    nev=esemeny.uzenet,
                    valoszinuseg=0,  # Nem releváns az egyedi eseményeknél
                    penzugyi_hatas=penzugyi_hatas,
                    elegedettsegi_hatas=elegedettseg_hatas,
                    leiras=esemeny.uzenet,
                    tipus=esemeny.tipus,
                    lakossag_hatas=lakossag_hatas
                )
                
                # Visszatérünk és újrahívjuk a metódust az objektummal
                return self.esemeny_hozzaadasa(esemeny_obj)
            # Ha szótár formátum
            elif isinstance(esemeny, dict):
                esemeny_dict = esemeny
            else:
                print(f"Figyelmeztetés: Ismeretlen esemény formátum: {type(esemeny)}")
                return False
            
            # Hozzáadjuk az eseményt a történethez
            self.esemenyek_tortenete.append({
                'fordulo': esemeny_dict.get('fordulo', self.game_engine.fordulo_szamlalo if hasattr(self.game_engine, 'fordulo_szamlalo') else 0),
                'esemeny': esemeny_dict
            })
            
            return True
            
        except Exception as e:
            print(f"Hiba az esemény hozzáadásakor: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_korabbi_esemenyek(self, fordulo_szam=None, tipus=None, limit=10):
        """
        Korábbi események lekérése
        
        :param fordulo_szam: Opcionálisan a forduló száma, ahonnan az eseményeket kérjük
        :param tipus: Opcionálisan az esemény típusa
        :param limit: Maximum hány eseményt kérünk (alapértelmezetten 10)
        :return: A korábbi események listája
        """
        # Szűrés forduló szám alapján
        if fordulo_szam is not None:
            esemenyek = [e for e in self.esemenyek_tortenete if e['fordulo'] == fordulo_szam]
        else:
            esemenyek = self.esemenyek_tortenete.copy()
        
        # Szűrés típus alapján
        if tipus is not None:
            esemenyek = [e for e in esemenyek if e['esemeny'].get('tipus') == tipus]
        
        # Rendezés forduló szerint csökkenő sorrendbe
        esemenyek.sort(key=lambda e: e['fordulo'], reverse=True)
        
        # Limitet alkalmazunk
        return esemenyek[:limit] 