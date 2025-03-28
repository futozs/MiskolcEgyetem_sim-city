"""
Főablak modul a városfejlesztési szimulátorhoz - Modern játék GUI
"""
import os
import json
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import messagebox, filedialog, simpledialog, ttk
import numpy as np
from PIL import Image, ImageTk
import customtkinter as ctk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from ttkthemes import ThemedTk
from ttkwidgets import CheckboxTreeview
import colorama
import random
import time
import threading

from ..game.game_engine import GameEngine
from ..game.fordulo_manager import ForduloManager
from ..game.event_manager import EventManager
from ..config import BEALLITASOK, EPULET_TIPUSOK
from .events_view import EventsView
from .analytics_view import AnalyticsView
from ..utils.game_save_manager import GameSaveManager

# Modern téma beállítása a CustomTkinter-hez
ctk.set_appearance_mode("dark")  # "dark" vagy "light"
ctk.set_default_color_theme("blue")  # "blue", "green", "dark-blue"

class MainWindow:
    """
    Főablak osztály, amely a modern játék felhasználói felületét kezeli.
    """
    
    def __init__(self):
        """
        Főablak inicializálása
        """
        # Alapértelmezett színek és stílusok
        self.THEME_COLORS = {
            "primary": "#2d7fea",
            "secondary": "#5d5d5d",
            "accent": "#ff9c41",
            "background": "#202020",
            "card_bg": "#2d2d2d",
            "success": "#4CC261",
            "warning": "#FFD426",
            "danger": "#F44336",
            "text": "#ffffff",
            "selected": "#1e5ca8"  # Sötétebb kék a kijelölt gombok számára
        }
        
        # Alap betöltő grafika előkészítése
        self.root = ctk.CTk()
        self.root.title("Álomváros Szimulátor")
        self.root.geometry("1280x800")
        self.root.minsize(800, 600)  # Minimális ablakméret
        
        # Teljes képernyő változó
        self.is_fullscreen = True
        
        # Escape billentyű kötése a teljes képernyő kapcsolóhoz
        self.root.bind("<Escape>", self._toggle_fullscreen)
        
        # Játék komponensek
        self.game_engine = GameEngine()
        self.fordulo_manager = None
        self.event_manager = None
        self.save_manager = GameSaveManager(self.game_engine)  # Játékmentés kezelő
        
        # UI komponensek
        self.menu_bar = None
        self.navigation_sidebar = None
        self.content_frame = None
        self.status_bar = None
        self.dashboard_frame = None
        self.city_frame = None
        self.projects_frame = None
        self.buildings_frame = None
        self.services_frame = None
        self.citizens_frame = None
        self.analytics_frame = None
        self.events_frame = None
        self.settings_frame = None
        
        # Nézetek szótára az optimalizált UI frissítéshez
        self.views = {}
        
        # Játék állapot
        self.current_view = "dashboard"  # Kezdőképernyő
        self.auto_turn_active = False
        self.auto_turn_speed = 1.0  # másodperc/forduló
        self.fordulo_szamlalo = 0
        
        # Játékbeli változók
        self.city_happiness_history = []
        self.city_population_history = []
        self.city_budget_history = []
        self.turns_history = []
        
        # Icon és kép erőforrások
        self.ICONS = self._load_icons()
        
        # UI inicializálása
        self._init_ui()
        
        # Automatikus forduló ellenőrzése
        self._check_auto_turn()
    
    def _load_icons(self):
        """
        Ikonok betöltése vagy alapértelmezett ikonok létrehozása
        """
        # Csomag alapútvonala
        icons = {}
        # Alap színek az ikonokhoz, ha nincs kép
        colors = [
            "#2196F3",  # kék
            "#4CAF50",  # zöld
            "#FFC107",  # sárga
            "#F44336",  # piros
            "#9C27B0",  # lila
            "#FF9800",  # narancs
            "#795548",  # barna
            "#607D8B",  # kék-szürke
        ]
        
        # Ha nincsenek ikonok, készítünk egyszerű színezett négyzeteket
        for name, color in zip(["dashboard", "city", "projects", "buildings", 
                                "services", "citizens", "analytics", "events", "settings"], colors):
            img = Image.new('RGB', (64, 64), color)
            icons[name] = ImageTk.PhotoImage(img)
            
        return icons
    
    def _init_ui(self):
        """
        Modern felhasználói felület inicializálása
        """
        # Fő elrendezés konfiguráció
        self.root.grid_columnconfigure(1, weight=1)  # A középső rész nyúlik
        self.root.grid_rowconfigure(0, weight=1)     # A tartalom nyúlik
        
        # Navigációs panel létrehozása (baloldali)
        self._create_navigation_sidebar()
        
        # Fő tartalom létrehozása (jobb oldali)
        self._create_content_frame()
        
        # Státuszsor létrehozása (alsó)
        self._create_status_bar()
        
        # Különböző nézetek létrehozása
        self._create_dashboard_view()
        self._create_city_view()
        self._create_projects_view()
        self._create_buildings_view()
        self._create_services_view()
        self._create_citizens_view()
        self._create_analytics_view()
        self._create_events_view()
        self._create_settings_view()
        
        # Kezdő nézet mutatása
        self._show_view("dashboard")
    
    def _create_navigation_sidebar(self):
        """
        Bal oldali navigációs panel létrehozása
        """
        # Navigációs sáv keret
        self.navigation_sidebar = ctk.CTkFrame(self.root, corner_radius=0, fg_color=self.THEME_COLORS["card_bg"])
        self.navigation_sidebar.grid(row=0, column=0, sticky="nsew")
        self.navigation_sidebar.grid_rowconfigure(10, weight=1)  # Az utolsó elem kitölti a maradék helyet
        
        # Játék logó és cím
        logo_label = ctk.CTkLabel(
            self.navigation_sidebar, 
            text="Álomváros",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        subtitle_label = ctk.CTkLabel(
            self.navigation_sidebar, 
            text="Szimulátor",
            font=ctk.CTkFont(size=16)
        )
        subtitle_label.grid(row=1, column=0, padx=20, pady=(0, 20))
        
        # Navigációs gombok
        self.nav_buttons = {}
        
        # Navigációs elemek és ikonjaik
        nav_items = [
            ("dashboard", "Irányítópult", 2),
            ("city", "Városnézet", 3),
            ("projects", "Projektek", 4),
            ("buildings", "Épületek", 5),
            ("services", "Szolgáltatások", 6),
            ("citizens", "Lakosok", 7),
            ("events", "Események", 8),
            ("settings", "Beállítások", 9),
        ]
        
        for view_id, text, row in nav_items:
            button = ctk.CTkButton(
                self.navigation_sidebar,
                text=text,
                fg_color="transparent",
                text_color=self.THEME_COLORS["text"],
                hover_color=self.THEME_COLORS["primary"],
                anchor="w",
                command=lambda v=view_id: self._show_view(v)
            )
            button.grid(row=row, column=0, padx=20, pady=5, sticky="ew")
            self.nav_buttons[view_id] = button
            
        # Új játék gomb a navigációs sáv alján
        new_game_button = ctk.CTkButton(
            self.navigation_sidebar,
            text="Új játék",
            fg_color=self.THEME_COLORS["accent"],
            text_color=self.THEME_COLORS["text"],
            hover_color=self.THEME_COLORS["primary"],
            anchor="center",
            command=self._show_game_options
        )
        new_game_button.grid(row=11, column=0, padx=20, pady=(20, 10), sticky="ew")

        # Verzió információ
        version_label = ctk.CTkLabel(
            self.navigation_sidebar,
            text="v2.0.0",
            font=ctk.CTkFont(size=12),
            text_color=self.THEME_COLORS["secondary"]
        )
        version_label.grid(row=12, column=0, padx=20, pady=(5, 20))
    
    def _create_content_frame(self):
        """
        Fő tartalom keret létrehozása
        """
        self.content_frame = ctk.CTkFrame(self.root, corner_radius=0, fg_color=self.THEME_COLORS["background"])
        self.content_frame.grid(row=0, column=1, sticky="nsew")
        
        # Tartalom elrendezés konfiguráció
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(0, weight=1)
    
    def _create_status_bar(self):
        """
        Státuszsor létrehozása
        """
        self.status_bar = ctk.CTkFrame(self.root, height=30, corner_radius=0, fg_color=self.THEME_COLORS["card_bg"])
        self.status_bar.grid(row=1, column=0, columnspan=2, sticky="ew")
        
        # Státusz indikátorok
        self.status_turn_label = ctk.CTkLabel(self.status_bar, text="Forduló: 0")
        self.status_turn_label.pack(side="left", padx=10)
        
        self.status_date_label = ctk.CTkLabel(self.status_bar, text="Dátum: -")
        self.status_date_label.pack(side="left", padx=10)
        
        self.status_budget_label = ctk.CTkLabel(self.status_bar, text="Költségvetés: 0 Ft")
        self.status_budget_label.pack(side="left", padx=10)
        
        self.status_happiness_label = ctk.CTkLabel(self.status_bar, text="Elégedettség: 0%")
        self.status_happiness_label.pack(side="left", padx=10)
        
        self.status_population_label = ctk.CTkLabel(self.status_bar, text="Lakosság: 0 fő")
        self.status_population_label.pack(side="left", padx=10)
        
        # Automatikus forduló vezérlés
        self.auto_turn_speed_label = ctk.CTkLabel(self.status_bar, text="Forduló sebesség:")
        self.auto_turn_speed_label.pack(side="right", padx=(0, 5))
        
        self.auto_turn_speed_slider = ctk.CTkSlider(
            self.status_bar, 
            from_=0.5, 
            to=5.0, 
            number_of_steps=9,
            width=100,
            command=self._on_auto_turn_speed_change
        )
        self.auto_turn_speed_slider.set(self.auto_turn_speed)
        self.auto_turn_speed_slider.pack(side="right", padx=5)
        
        self.auto_turn_button = ctk.CTkButton(
            self.status_bar,
            text="Auto ►",
            width=80,
            command=self._toggle_auto_turn
        )
        self.auto_turn_button.pack(side="right", padx=10)
        
        # Forduló gomb
        self.next_turn_button = ctk.CTkButton(
            self.status_bar, 
            text="Következő forduló",
            command=self._next_turn
        )
        self.next_turn_button.pack(side="right", padx=10)
    
    def _create_dashboard_view(self):
        """
        Irányítópult nézet létrehozása
        """
        self.dashboard_frame = ctk.CTkFrame(self.content_frame)
        self.dashboard_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['dashboard'] = self.dashboard_frame
        
        # Irányítópult cím
        ctk.CTkLabel(self.dashboard_frame, text="Álomváros Irányítópult", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # Felső panel (város adatok és irányítás)
        top_frame = ctk.CTkFrame(self.dashboard_frame)
        top_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        # Város statisztikák
        city_stats_frame = ctk.CTkFrame(top_frame)
        city_stats_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
        
        ctk.CTkLabel(city_stats_frame, text="Város statisztikák", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack(pady=5)
        
        # Város statisztikák tartalom
        self.city_stats_content = ctk.CTkFrame(city_stats_frame)
        self.city_stats_content.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Forduló vezérlők
        controls_frame = ctk.CTkFrame(top_frame)
        controls_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
        
        ctk.CTkLabel(controls_frame, text="Szimuláció vezérlése", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack(pady=5)
        
        # Gombok
        buttons_frame = ctk.CTkFrame(controls_frame)
        buttons_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Következő forduló gomb
        self.next_turn_button = ctk.CTkButton(
            buttons_frame, 
            text="Következő forduló",
            command=self._next_turn,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        self.next_turn_button.pack(fill="x", pady=5)
        
        # Automatikus forduló gomb
        self.auto_turn_button = ctk.CTkButton(
            buttons_frame, 
            text="Automatikus forduló: KI",
            command=self._toggle_auto_turn,
            fg_color=self.THEME_COLORS["secondary"]
        )
        self.auto_turn_button.pack(fill="x", pady=5)
        
        # Új játék gomb
        self.new_game_button = ctk.CTkButton(
            buttons_frame,
            text="Új játék / Betöltés",
            command=self._show_game_options,
            fg_color=self.THEME_COLORS["accent"],
            hover_color=self.THEME_COLORS["primary"]
        )
        self.new_game_button.pack(fill="x", pady=5)
        
        # Játék mentése / betöltése gombok
        save_load_frame = ctk.CTkFrame(buttons_frame, fg_color="transparent")
        save_load_frame.pack(fill="x", pady=5)
        
        # Két oszlop a mentés/betöltés gomboknak
        save_load_frame.columnconfigure(0, weight=1)
        save_load_frame.columnconfigure(1, weight=1)
        
        # Mentés gomb
        ctk.CTkButton(
            save_load_frame,
            text="Mentés",
            command=self._save_game,
            fg_color=self.THEME_COLORS["success"],
            hover_color="#3a9c4e",  # Sötétebb zöld
            width=100
        ).grid(row=0, column=0, padx=(0, 2), sticky="ew")
        
        # Betöltés gomb
        ctk.CTkButton(
            save_load_frame,
            text="Betöltés",
            command=self._load_game,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["selected"],
            width=100
        ).grid(row=0, column=1, padx=(2, 0), sticky="ew")
        
        # Események generálása gomb (csak debug módban)
        if __debug__:
            self.debug_event_button = ctk.CTkButton(
                buttons_frame,
                text="Esemény generálása",
                command=self._generate_debug_event,
                fg_color=self.THEME_COLORS["warning"]
            )
            self.debug_event_button.pack(fill="x", pady=5)
        
        # Alsó panel (események és elemzések)
        bottom_frame = ctk.CTkFrame(self.dashboard_frame)
        bottom_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Két oszlop: események és elemzések
        bottom_frame.columnconfigure(0, weight=1)
        bottom_frame.columnconfigure(1, weight=1)
        
        # Bal oldal: Legújabb események
        events_panel = ctk.CTkFrame(bottom_frame)
        events_panel.grid(row=0, column=0, padx=(0, 5), pady=0, sticky="nsew")
        
        ctk.CTkLabel(events_panel, text="Legújabb események", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack(pady=5)
        
        # Események összefoglaló
        self.dashboard_events_frame = ctk.CTkScrollableFrame(events_panel, height=300)
        self.dashboard_events_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Események kártyák helye
        self.dashboard_event_cards = []
        
        # Gomb a teljes események nézethez
        ctk.CTkButton(
            events_panel,
            text="Összes esemény megtekintése",
            command=lambda: self._show_view("events"),
            fg_color=self.THEME_COLORS["secondary"]
        ).pack(fill="x", padx=10, pady=10)
        
        # Jobb oldal: Gyors elemzések
        analytics_panel = ctk.CTkFrame(bottom_frame)
        analytics_panel.grid(row=0, column=1, padx=(5, 0), pady=0, sticky="nsew")
        
        ctk.CTkLabel(analytics_panel, text="Gyors elemzések", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack(pady=5)
        
        # Elemzések tartalom
        self.dashboard_analytics_frame = ctk.CTkFrame(analytics_panel)
        self.dashboard_analytics_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Mini grafikon hely a dashboard-on (később létrehozzuk a _update_dashboard_view-ban)
        self.dashboard_chart_widget = None
        
        # Gomb a teljes elemzések nézethez
        ctk.CTkButton(
            analytics_panel,
            text="Részletes elemzések megtekintése",
            command=lambda: self._show_view("analytics"),
            fg_color=self.THEME_COLORS["secondary"]
        ).pack(fill="x", padx=10, pady=10)
    
    def _create_city_view(self):
        """
        Város nézet létrehozása
        """
        self.city_frame = ctk.CTkFrame(self.content_frame)
        self.city_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['city'] = self.city_frame
        
        # Város címke
        ctk.CTkLabel(self.city_frame, text="Álomváros Áttekintés", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # 3D városnézet importálása és inicializálása
        from .city_view_3d import CityView3D
        self.city_view_3d = CityView3D(self.city_frame, self.game_engine)
        
        # Frissítés gomb
        refresh_frame = ctk.CTkFrame(self.city_frame)
        refresh_frame.pack(fill="x", side="bottom", padx=10, pady=5)
        
        refresh_btn = ctk.CTkButton(
            refresh_frame,
            text="Térkép frissítése",
            command=self._refresh_city_view,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        refresh_btn.pack(side="right", padx=10, pady=5)
    
    def _refresh_city_view(self):
        """
        3D városnézet frissítése
        """
        if hasattr(self, 'city_view_3d'):
            self.city_view_3d.update_city_view()
    
    def _create_projects_view(self):
        """
        Projektek nézet létrehozása
        """
        self.projects_frame = ctk.CTkFrame(self.content_frame)
        self.projects_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['projects'] = self.projects_frame
        
        # Projektek címke
        ctk.CTkLabel(self.projects_frame, text="Projektek", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # Szűrési panel
        filter_frame = ctk.CTkFrame(self.projects_frame)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        # Szűrő típus
        self.project_filter_var = ctk.StringVar(value="összes")
        filter_options = ["folyamatban", "befejezett", "összes"]
        
        filter_label = ctk.CTkLabel(filter_frame, text="Projektek:")
        filter_label.pack(side="left", padx=10, pady=10)
        
        filter_menu = ctk.CTkOptionMenu(
            filter_frame, 
            values=filter_options,
            variable=self.project_filter_var,
            command=self._filter_projects,
            width=150
        )
        filter_menu.pack(side="left", padx=10, pady=10)
        
        # Új projekt gomb
        new_project_btn = ctk.CTkButton(
            filter_frame,
            text="+ Új projekt",
            command=self._create_new_project,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        new_project_btn.pack(side="right", padx=10, pady=10)
        
        # Projektek lista
        self.projects_list_frame = ctk.CTkScrollableFrame(self.projects_frame)
        self.projects_list_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Projekt kártyák helye - ezt majd a _update_projects_view frissíti
        self.project_cards = []
        
        # Azonnal frissítjük a nézetet
        self._update_projects_view()
    
    def _create_buildings_view(self):
        """
        Épületek nézet létrehozása
        """
        self.buildings_frame = ctk.CTkFrame(self.content_frame)
        self.buildings_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['buildings'] = self.buildings_frame
        
        # Épületek címke
        ctk.CTkLabel(self.buildings_frame, text="Épületek", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # Keresési és szűrési panel
        filter_frame = ctk.CTkFrame(self.buildings_frame)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        # Szűrő gomb
        self.building_filter_var = ctk.StringVar(value="összes")
        filter_options = ["összes"] + self.game_engine.varos.get_epulet_tipusok() if hasattr(self.game_engine, 'varos') and self.game_engine.varos else ["összes"] + ["lakóház", "kereskedelmi", "ipari", "oktatási", "egészségügyi", "kulturális", "középület"]
        
        filter_menu = ctk.CTkOptionMenu(
            filter_frame, 
            values=filter_options,
            variable=self.building_filter_var,
            command=self._filter_buildings,
            width=150
        )
        filter_menu.pack(side="left", padx=10, pady=10)
        
        # Új épület gomb
        new_building_btn = ctk.CTkButton(
            filter_frame,
            text="+ Új épület",
            command=self._create_new_building,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        new_building_btn.pack(side="right", padx=10, pady=10)
        
        # Épületek lista keret
        self.buildings_list_frame = ctk.CTkScrollableFrame(self.buildings_frame)
        self.buildings_list_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Épület kártyák helye - ezt majd a _update_buildings_view frissíti
        self.building_cards = []
        
        # Azonnal frissítjük a nézetet
        self._update_buildings_view()

    def _create_services_view(self):
        """
        Szolgáltatások nézet létrehozása
        """
        self.services_frame = ctk.CTkFrame(self.content_frame)
        self.services_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['services'] = self.services_frame
        
        # Fejléc keret
        header_frame = ctk.CTkFrame(self.services_frame)
        header_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        # Cím
        title_label = ctk.CTkLabel(
            header_frame, 
            text="Szolgáltatások kezelése",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        title_label.pack(side="left", padx=10, pady=10)
        
        # Új szolgáltatás gomb
        add_button = ctk.CTkButton(
            header_frame,
            text="Új szolgáltatás",
            command=self._create_new_service,
            width=150,
            height=30,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        add_button.pack(side="right", padx=10, pady=10)
        
        # Szűrő keret
        filter_frame = ctk.CTkFrame(self.services_frame)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        filter_label = ctk.CTkLabel(filter_frame, text="Szűrés állapot szerint:", font=ctk.CTkFont(size=14))
        filter_label.pack(side="left", padx=10, pady=10)
        
        # Szűrő választó
        self.service_filter_var = ctk.StringVar(value="összes")
        service_filter_options = ["összes", "aktív", "inaktív"]
        
        service_filter_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=service_filter_options,
            variable=self.service_filter_var,
            command=self._filter_services,
            width=150
        )
        service_filter_combobox.pack(side="left", padx=10, pady=10)
        
        # Szolgáltatások lista keret
        self.services_list_frame = ctk.CTkScrollableFrame(self.services_frame)
        self.services_list_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Szolgáltatások kártya lista
        self.service_cards = []
        
        # Kezdeti feltöltés
        self._update_services_view()
    
    def _create_citizens_view(self):
        """
        Lakosok nézet létrehozása
        """
        self.citizens_frame = ctk.CTkFrame(self.content_frame)
        self.citizens_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['citizens'] = self.citizens_frame
        
        # Polgárok címke
        ctk.CTkLabel(self.citizens_frame, text="Polgárok", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # Szűrési és keresési panel
        filter_frame = ctk.CTkFrame(self.citizens_frame)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        # Keresési mező
        search_label = ctk.CTkLabel(filter_frame, text="Keresés:")
        search_label.pack(side="left", padx=10, pady=10)
        
        self.citizens_search_var = ctk.StringVar()
        search_entry = ctk.CTkEntry(filter_frame, width=200, textvariable=self.citizens_search_var)
        search_entry.pack(side="left", padx=10, pady=10)
        
        # Keresés gomb
        search_btn = ctk.CTkButton(
            filter_frame,
            text="Keresés",
            command=self._filter_citizens,
            width=100
        )
        search_btn.pack(side="left", padx=10, pady=10)
        
        # Szűrés épület szerint
        building_label = ctk.CTkLabel(filter_frame, text="Épület:")
        building_label.pack(side="left", padx=(20, 10), pady=10)
        
        self.citizens_building_var = ctk.StringVar(value="összes")
        
        # Épület lista kinyerése (ha létezik város)
        building_options = ["összes"]
        if hasattr(self.game_engine, 'varos') and self.game_engine.varos:
            lakohazak = [f"{epulet.nev} (ID: {epulet.azonosito})" 
                        for epulet in self.game_engine.varos.epuletek.values() 
                        if epulet.tipus.lower() == "lakóház"]
            building_options.extend(lakohazak)
        
        building_dropdown = ctk.CTkOptionMenu(
            filter_frame, 
            values=building_options,
            variable=self.citizens_building_var,
            command=self._filter_citizens,
            width=200
        )
        building_dropdown.pack(side="left", padx=10, pady=10)
        
        # Statisztika panel
        stats_frame = ctk.CTkFrame(self.citizens_frame)
        stats_frame.pack(fill="x", padx=10, pady=10)
        
        # Statisztikai címkék
        self.citizens_stats_labels = {
            "count": ctk.CTkLabel(stats_frame, text="Összes lakos: 0", font=ctk.CTkFont(size=14, weight="bold")),
            "avg_age": ctk.CTkLabel(stats_frame, text="Átlagéletkor: 0 év", font=ctk.CTkFont(size=14)),
            "avg_happiness": ctk.CTkLabel(stats_frame, text="Átlagos elégedettség: 0%", font=ctk.CTkFont(size=14))
        }
        
        # Elhelyezés
        self.citizens_stats_labels["count"].pack(side="left", padx=20)
        self.citizens_stats_labels["avg_age"].pack(side="left", padx=20)
        self.citizens_stats_labels["avg_happiness"].pack(side="left", padx=20)
        
        # Polgárok lista
        self.citizens_list_frame = ctk.CTkScrollableFrame(self.citizens_frame)
        self.citizens_list_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Polgár kártyák helye - ezt majd a _update_citizens_view frissíti
        self.citizen_cards = []
        
        # Lapozó keret létrehozása - ez egyszer jön létre és később frissül, nem lesz duplikálva
        self.citizens_pagination_frame = ctk.CTkFrame(self.citizens_frame)
        self.citizens_pagination_frame.pack(fill="x", padx=10, pady=10)
        
        # Előző oldal gomb
        self.citizen_prev_button = ctk.CTkButton(
            self.citizens_pagination_frame,
            text="← Előző oldal",
            command=lambda: self._change_citizens_page(-1),
            width=120
        )
        self.citizen_prev_button.pack(side="left", padx=10)
        
        # Oldal kijelző
        self.citizen_page_label = ctk.CTkLabel(
            self.citizens_pagination_frame,
            text="Oldal: 1 / 1",
            font=ctk.CTkFont(size=14)
        )
        self.citizen_page_label.pack(side="left", padx=20, expand=True)
        
        # Következő oldal gomb
        self.citizen_next_button = ctk.CTkButton(
            self.citizens_pagination_frame,
            text="Következő oldal →",
            command=lambda: self._change_citizens_page(1),
            width=120
        )
        self.citizen_next_button.pack(side="right", padx=10)
        
        # Inicializáljuk a lapozás változóját
        self.citizens_page = 0
        
        # Azonnal frissítjük a nézetet
        self._update_citizens_view()

    def _create_analytics_view(self):
        """
        Elemzések nézet létrehozása
        """
        self.analytics_frame = ctk.CTkFrame(self.content_frame)
        self.analytics_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['analytics'] = self.analytics_frame
        
        # AnalyticsView létrehozása - ezt használjuk az elemzések megjelenítésére
        self.analytics_view = AnalyticsView(self.analytics_frame, self.game_engine)
        
        # Grafikonok keret
        self.charts_frame = ctk.CTkFrame(self.analytics_frame)
        self.charts_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Pótoljuk egy címkével
        ctk.CTkLabel(self.charts_frame, text="A grafikonok itt fognak megjelenni", 
                     font=ctk.CTkFont(size=18)).pack(expand=True)

    def _create_events_view(self):
        """
        Események nézet létrehozása
        """
        self.events_frame = ctk.CTkFrame(self.content_frame)
        self.events_frame.pack(fill="both", expand=True)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['events'] = self.events_frame
        
        # Fejléc
        header_frame = ctk.CTkFrame(self.events_frame, fg_color=self.THEME_COLORS["secondary"])
        header_frame.pack(fill="x", padx=0, pady=0)
        
        header_label = ctk.CTkLabel(
            header_frame, 
            text="Események és történések",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="white"
        )
        header_label.pack(pady=10)
        
        # Statisztika panel
        self.events_stats_frame = ctk.CTkFrame(self.events_frame)
        self.events_stats_frame.pack(fill="x", padx=10, pady=10)
        
        # Statisztika címkék
        self.events_stats = {
            "total": ctk.CTkLabel(self.events_stats_frame, text="Összes esemény: 0", font=ctk.CTkFont(size=14)),
            "positive": ctk.CTkLabel(self.events_stats_frame, text="Pozitív események: 0", font=ctk.CTkFont(size=14), text_color="#4CAF50"),
            "negative": ctk.CTkLabel(self.events_stats_frame, text="Negatív események: 0", font=ctk.CTkFont(size=14), text_color="#F44336"),
            "neutral": ctk.CTkLabel(self.events_stats_frame, text="Semleges események: 0", font=ctk.CTkFont(size=14), text_color="#2196F3")
        }
        
        # Elhelyezés
        self.events_stats["total"].grid(row=0, column=0, padx=10, pady=5, sticky="w")
        self.events_stats["positive"].grid(row=0, column=1, padx=10, pady=5, sticky="w")
        self.events_stats["negative"].grid(row=0, column=2, padx=10, pady=5, sticky="w")
        self.events_stats["neutral"].grid(row=0, column=3, padx=10, pady=5, sticky="w")
        
        # Egyenletes eloszlás
        for i in range(4):
            self.events_stats_frame.columnconfigure(i, weight=1)
        
        # Többi keret helye az EventsView számára
        events_container = ctk.CTkFrame(self.events_frame)
        events_container.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Események nézet objektum létrehozása
        from alomvaros_szimulator.ui.events_view import EventsView
        self.events_view = EventsView(events_container, self.game_engine)
        
        # Események generálása gomb (csak fejlesztési célokra)
        if __debug__:
            debug_frame = ctk.CTkFrame(self.events_frame)
            debug_frame.pack(fill="x", padx=10, pady=10)
            
            ctk.CTkButton(
                debug_frame,
                text="Esemény generálása (debug)",
                command=self._generate_debug_event,
                fg_color=self.THEME_COLORS["secondary"]
            ).pack(pady=10)

    def _update_events_view(self):
        """
        Események nézet frissítése
        """
        if hasattr(self, 'events_view'):
            # Esemény adatok frissítése előtt biztosítsuk hogy az event_manager elérhető
            if hasattr(self.game_engine, 'event_manager') and self.game_engine.event_manager is not None:
                # Mindenek előtt betöltjük a korábban mentett eseményeket
                self.events_view.load_events_log()
                previously_saved_events = self.events_view.events_log.copy() if self.events_view.events_log else []
                
                # Események lekérése az eseménytörténetből
                events = []
                
                # A teljes eseménytörténetet használjuk, nem csak a korábbi eseményeket
                if hasattr(self.game_engine.event_manager, 'esemenyek_tortenete'):
                    events = self.game_engine.event_manager.esemenyek_tortenete.copy()
                
                # Ha nincs adat az eseménytörténetben, próbáljuk a korábbi eseményekből lekérni
                if not events and hasattr(self.game_engine.event_manager, 'get_korabbi_esemenyek'):
                    # Próbáljuk meg korlát nélkül lekérni az összes eseményt
                    try:
                        events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=None)
                    except:
                        # Ha a None érték hibát okoz, próbáljunk egy nagy számot
                        try:
                            events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=100000)
                        except Exception as e:
                            print(f"Hiba az események lekérésekor: {e}")
                
                # Biztosítsuk, hogy events lista és ne None
                events = events or []
                
                # Az aktuális forduló eseményeinek hozzáadása, ha vannak ilyenek
                if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'aktualis_fordulo_esemenyei'):
                    for esemeny in self.game_engine.varos.aktualis_fordulo_esemenyei:
                        # Ellenőrizzük, hogy az esemény már objektum-e
                        if isinstance(esemeny, dict):
                            # Ha már objektum, csak adjuk hozzá
                            if 'fordulo' not in esemeny:
                                esemeny['fordulo'] = self.game_engine.fordulo_szamlalo
                            events.append(esemeny)
                        else:
                            # Ha string, konvertáljuk objektummá
                            penz_hatas = 0
                            boldogsag_hatas = 0
                            lakossag_hatas = 0
                            
                            # Létrehozzuk az esemény objektumot az új formátumban
                            events.append({
                                'fordulo': self.game_engine.fordulo_szamlalo,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': penz_hatas,
                                        'boldogsag': boldogsag_hatas,
                                        'lakossag': lakossag_hatas
                                    }
                                }
                            })
                
                # Ellenőrizzük az előző fordulók eseményeit is
                if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'elozo_fordulo_esemenyei'):
                    for esemeny in self.game_engine.varos.elozo_fordulo_esemenyei:
                        # Ellenőrizzük, hogy az esemény már szerepel-e a listában
                        if isinstance(esemeny, str):
                            # Szöveges esemény konvertálása
                            event_obj = {
                                'fordulo': self.game_engine.fordulo_szamlalo - 1,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': 0,
                                        'boldogsag': 0,
                                        'lakossag': 0
                                    }
                                }
                            }
                            events.append(event_obj)
                
                # Egységesítjük az események formátumát és összegyűjtjük az összes eseményt
                all_events = []
                
                # 1. Feldolgozzuk az új eseményeket
                for i, event in enumerate(events):
                    if isinstance(event, dict):
                        # Ellenőrizzük, hogy az eseményeknek van-e 'fordulo' attribútuma
                        if 'fordulo' not in event:
                            events[i]['fordulo'] = 0  # Alapértelmezett érték
                        
                        # Ellenőrizzük, hogy az esemény objektumban van-e 'esemeny' kulcs
                        if 'esemeny' not in event and isinstance(event, dict):
                            # Átalakítjuk az új formátumra
                            event = {
                                'fordulo': event.get('fordulo', 0),
                                'esemeny': {
                                    'nev': event.get('nev', 'Ismeretlen esemény'),
                                    'leiras': event.get('leiras', ''),
                                    'tipus': event.get('tipus', 'rendszer'),
                                    'hatas': {
                                        'penz': event.get('penzugyi_hatas', 0),
                                        'boldogsag': event.get('elegedettsegi_hatas', 0),
                                        'lakossag': event.get('lakossag_hatas', 0)
                                    }
                                }
                            }
                        
                        all_events.append(event)
                
                # 2. Hozzáadjuk a korábban mentett eseményeket
                for event in previously_saved_events:
                    if isinstance(event, dict):
                        all_events.append(event)
                
                # 3. Töröljük a duplikátumokat
                egyedi_esemenyek = []
                esemeny_kulcsok = set()
                
                for esemeny in all_events:
                    if isinstance(esemeny, dict):
                        # Egyedi kulcs generálása a forduló és név alapján
                        fordulo = esemeny.get('fordulo', 0)
                        nev = esemeny.get('esemeny', {}).get('nev', '')
                        kulcs = f"{fordulo}_{nev}"
                        
                        if kulcs not in esemeny_kulcsok:
                            esemeny_kulcsok.add(kulcs)
                            egyedi_esemenyek.append(esemeny)
                
                # Frissítsük az EventsView-t a legújabb eseményekkel
                self.events_view.events_log = egyedi_esemenyek
                self.events_view.save_events_log()
                
                # Statisztikák frissítése - egységes adatstruktúrához igazítva
                total_events = len(egyedi_esemenyek)
                positive_events = 0
                negative_events = 0
                neutral_events = 0
                
                # Események típus szerinti számlálása
                for event in egyedi_esemenyek:
                    if not isinstance(event, dict):
                        continue
                    
                    esemeny = event.get('esemeny', {})
                    
                    # Ellenőrizzük, hogy az esemény 'hatas' vagy a régi 'penzugyi_hatas' formátumot használja-e
                    if 'hatas' in esemeny:
                        hatasok = esemeny.get('hatas', {})
                        penz_hatas = hatasok.get('penz', 0)
                        boldogsag_hatas = hatasok.get('boldogsag', 0)
                        lakossag_hatas = hatasok.get('lakossag', 0)
                    else:
                        # Régebbi formátum
                        penz_hatas = esemeny.get('penzugyi_hatas', 0)
                        boldogsag_hatas = esemeny.get('elegedettsegi_hatas', 0)
                        lakossag_hatas = esemeny.get('lakossag_hatas', 0)
                    
                    if penz_hatas > 0 or boldogsag_hatas > 0 or lakossag_hatas > 0:
                        positive_events += 1
                    elif penz_hatas < 0 or boldogsag_hatas < 0 or lakossag_hatas < 0:
                        negative_events += 1
                    else:
                        neutral_events += 1
                
                # Frissítsük a statisztika címkéket
                if hasattr(self, 'events_stats'):
                    self.events_stats["total"].configure(text=f"Összes esemény: {total_events}")
                    self.events_stats["positive"].configure(text=f"Pozitív események: {positive_events}")
                    self.events_stats["negative"].configure(text=f"Negatív események: {negative_events}")
                    self.events_stats["neutral"].configure(text=f"Semleges események: {neutral_events}")
            
            # Frissítsük az EventsView-t
            self.events_view.update_view()
            
            # A görgetési keret magasságának beállítása
            if hasattr(self.events_view, 'events_scroll_frame'):
                self.events_view.events_scroll_frame.configure(height=600)
                self.events_view.events_scroll_frame.update()
                
            # A bal oldali görgetési keret méretének beállítása
            if hasattr(self.events_view, 'left_scroll'):
                self.events_view.left_scroll.configure(height=600)
                self.events_view.left_scroll.update()

    def _create_settings_view(self):
        """
        Beállítások nézet létrehozása
        """
        self.settings_frame = ctk.CTkFrame(self.content_frame)
        self.settings_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Nézet hozzáadása a views szótárhoz
        self.views['settings'] = self.settings_frame
        
        # Beállítások címke
        ctk.CTkLabel(self.settings_frame, text="Beállítások", 
                     font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(0, 20))
        
        # Beállítások lista
        settings_content = ctk.CTkFrame(self.settings_frame)
        settings_content.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Téma váltás
        theme_frame = ctk.CTkFrame(settings_content)
        theme_frame.pack(fill="x", padx=10, pady=10)
        
        ctk.CTkLabel(theme_frame, text="Téma:", 
                    font=ctk.CTkFont(size=16)).pack(side="left", padx=10)
        
        self.theme_var = ctk.StringVar(value="system")
        theme_menu = ctk.CTkOptionMenu(
            theme_frame, 
            values=["system", "dark", "light"],
            variable=self.theme_var,
            command=self._change_theme
        )
        theme_menu.pack(side="right", padx=10)
        
        # Teljes képernyő kapcsoló
        fullscreen_frame = ctk.CTkFrame(settings_content)
        fullscreen_frame.pack(fill="x", padx=10, pady=10)
        
        ctk.CTkLabel(fullscreen_frame, text="Teljes képernyő:", 
                    font=ctk.CTkFont(size=16)).pack(side="left", padx=10)
        
        # Teljes képernyő kapcsoló
        self.fullscreen_switch = ctk.CTkSwitch(
            fullscreen_frame,
            text="",
            command=self._toggle_fullscreen_from_settings,
            onvalue=True,
            offvalue=False
        )
        self.fullscreen_switch.pack(side="right", padx=10)
        self.fullscreen_switch.select() if self.is_fullscreen else self.fullscreen_switch.deselect()
        
        # Játék mentése/betöltése szekció
        save_load_frame = ctk.CTkFrame(settings_content)
        save_load_frame.pack(fill="x", padx=10, pady=(20, 10))
        
        # Játékmentés/betöltés cím
        ctk.CTkLabel(save_load_frame, text="Játék mentése és betöltése", 
                     font=ctk.CTkFont(size=18, weight="bold")).pack(pady=(10, 15))
        
        # Gombok keret
        save_load_buttons = ctk.CTkFrame(save_load_frame)
        save_load_buttons.pack(fill="x", padx=20, pady=(0, 15))
        
        # Mentés gomb
        save_btn = ctk.CTkButton(
            save_load_buttons,
            text="Játék mentése",
            fg_color=self.THEME_COLORS["success"],
            hover_color="#3a9c4e",  # Sötétebb zöld
            command=self._save_game
        )
        save_btn.pack(side="left", padx=10, pady=10, fill="x", expand=True)
        
        # Betöltés gomb
        load_btn = ctk.CTkButton(
            save_load_buttons,
            text="Játék betöltése",
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["selected"],
            command=self._load_game
        )
        load_btn.pack(side="left", padx=10, pady=10, fill="x", expand=True)
        
        # Automatikus mentés beállítások
        auto_save_frame = ctk.CTkFrame(save_load_frame)
        auto_save_frame.pack(fill="x", padx=20, pady=(0, 15))
        
        ctk.CTkLabel(auto_save_frame, text="Automatikus mentés fordulónként:", 
                     font=ctk.CTkFont(size=14)).pack(side="left", padx=10, pady=10)
        
        # Automatikus mentés gyakorisága
        auto_save_frequency = ctk.CTkOptionMenu(
            auto_save_frame,
            values=["Kikapcsolva", "Minden fordulóban", "2", "3", "5", "10"],
            command=self._set_auto_save_frequency
        )
        auto_save_frequency.pack(side="right", padx=10, pady=10)
        
        # Beállítás alapértéke
        current_frequency = BEALLITASOK.get("jatekmenet", {}).get("auto_mentes_gyakorisag", 6)
        if current_frequency == 0:
            auto_save_frequency.set("Kikapcsolva")
        elif current_frequency == 1:
            auto_save_frequency.set("Minden fordulóban")
        else:
            auto_save_frequency.set(str(current_frequency))
    
    def _show_view(self, view_name):
        """
        Nézet megjelenítése
        
        :param view_name: Megjelenítendő nézet neve
        """
        if view_name not in self.views:
            print(f"Hiba: A '{view_name}' nézet nem létezik.")
            return
            
        # Elrejtjük az összes nézetet
        for view in self.views.values():
            view.pack_forget()
            
        # Megjelenítjük a kiválasztott nézetet
        self.views[view_name].pack(fill="both", expand=True, padx=10, pady=10)
        
        # Frissítjük az aktuális nézet változót
        self.current_view = view_name
        
        # Kijelöljük a megfelelő navigációs elemet
        for btn_name, btn in self.nav_buttons.items():
            if btn_name == view_name:
                btn.configure(fg_color=self.THEME_COLORS["selected"])
            else:
                btn.configure(fg_color="transparent")
        
        # Nézet frissítése a típusa alapján
        if view_name == 'citizens':
            self._update_citizens_view()
        elif view_name == 'buildings':
            self._update_buildings_view()
        elif view_name == 'projects':
            self._update_projects_view()
        elif view_name == 'services':
            self._update_services_view()
        elif view_name == 'analytics':
            self._update_analytics_view()
        elif view_name == 'events':
            self._update_events_view()
            
            # Az események keret explicit frissítése és méretezése
            if hasattr(self, 'events_view'):
                self.events_view.update_view()
                
                # A görgetési keret magasságának beállítása
                if hasattr(self.events_view, 'events_scroll_frame'):
                    self.events_view.events_scroll_frame.configure(height=500)
                    self.events_view.events_scroll_frame.update()
                
        elif view_name == 'city':
            self._refresh_city_view()
        elif view_name == 'dashboard':
            self._update_dashboard_view()
    
    def _check_auto_turn(self):
        """
        Automatikus forduló ellenőrzése
        """
        if self.auto_turn_active:
            self.root.after(int(self.auto_turn_speed * 1000), self._auto_turn_step)
    
    def _show_splash_screen(self):
        """
        Üdvözlő/betöltő képernyő megjelenítése
        """
        # Betöltő ablak
        splash = ctk.CTkToplevel(self.root)
        splash.title("")
        splash.geometry("500x300")
        splash.overrideredirect(True)  # Keret nélküli ablak
        splash.attributes('-topmost', True)  # Mindig a legfelső rétegen marad
        
        # Képernyő közepére pozicionálás
        splash.geometry("+%d+%d" % (
            self.root.winfo_screenwidth() // 2 - 250,
            self.root.winfo_screenheight() // 2 - 150
        ))
        
        # Háttér
        splash_frame = ctk.CTkFrame(splash, fg_color=self.THEME_COLORS["background"])
        splash_frame.pack(fill="both", expand=True)
        
        # Logó és cím
        title_label = ctk.CTkLabel(
            splash_frame, 
            text="Álomváros Szimulátor",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        title_label.pack(pady=(50, 10))
        
        subtitle_label = ctk.CTkLabel(
            splash_frame, 
            text="Városfejlesztési szimulációs játék",
            font=ctk.CTkFont(size=16)
        )
        subtitle_label.pack(pady=(0, 30))
        
        # Betöltés indikátor
        progress = ctk.CTkProgressBar(splash_frame, width=400)
        progress.pack(pady=10)
        progress.set(0)
        
        # Betöltés szöveg
        loading_label = ctk.CTkLabel(splash_frame, text="Betöltés...")
        loading_label.pack(pady=10)
        
        # Verziószám
        version_label = ctk.CTkLabel(
            splash_frame, 
            text="v2.0.0", 
            font=ctk.CTkFont(size=12),
            text_color=self.THEME_COLORS["secondary"]
        )
        version_label.pack(side="bottom", pady=10)
        
        # Betöltési folyamat szimulálása
        splash.update()
        
        # Betöltés szimuláció
        import time
        for i in range(101):
            progress.set(i / 100)
            if i < 30:
                loading_label.configure(text="Adatok betöltése...")
            elif i < 60:
                loading_label.configure(text="Modulok inicializálása...")
            elif i < 90:
                loading_label.configure(text="Felhasználói felület előkészítése...")
            else:
                loading_label.configure(text="Indítás...")
            
            splash.update()
            time.sleep(0.02)
        
        # Splash képernyő bezárása
        splash.destroy()
        
        # Automatikusan indítsunk egy új játékot, ha még nincs játék
        if not self.game_engine.jatek_aktiv:
            self._show_game_options()
    def _auto_load_all_data(self):
        """
        Automatikusan betölti az összes adatot a játékhoz
        """
        if not self.game_engine or not self.game_engine.varos:
            print("Nincs aktív játék, nem lehet adatokat betölteni.")
            return False
            
        try:
            # Alapértelmezett minta adatok betöltése
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            data_dir = os.path.join(base_dir, "data")
            
            # Ellenőrizzük, hogy a könyvtár létezik-e
            if not os.path.exists(data_dir):
                print(f"Adatkönyvtár nem található: {data_dir}")
                return False
                
            # Épületek betöltése
            epuletek_csv = os.path.join(data_dir, "epuletek.csv")
            if os.path.exists(epuletek_csv):
                print(f"Épületek betöltése: {epuletek_csv}")
            else:
                print(f"Épületek fájl nem található: {epuletek_csv}")
                epuletek_csv = None
                
            # Szolgáltatások betöltése
            szolgaltatasok_csv = os.path.join(data_dir, "szolgaltatasok.csv")
            if os.path.exists(szolgaltatasok_csv):
                print(f"Szolgáltatások betöltése: {szolgaltatasok_csv}")
            else:
                print(f"Szolgáltatások fájl nem található: {szolgaltatasok_csv}")
                szolgaltatasok_csv = None
                
            # Projektek betöltése
            projektek_csv = os.path.join(data_dir, "projektek.csv")
            if os.path.exists(projektek_csv):
                print(f"Projektek betöltése: {projektek_csv}")
            else:
                print(f"Projektek fájl nem található: {projektek_csv}")
                projektek_csv = None
                
            # Adatok betöltése
            betoltott_elemek = self.game_engine.adatok_betoltese(
                epuletek_csv=epuletek_csv,
                szolgaltatasok_csv=szolgaltatasok_csv,
                projektek_csv=projektek_csv
            )
            
            if betoltott_elemek > 0:
                print(f"Sikeresen betöltve {betoltott_elemek} elem.")
                return True
            else:
                print("Nem sikerült adatokat betölteni.")
                return False
                
        except Exception as e:
            print(f"Hiba az adatok betöltésekor: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _try_load_saved_game(self):
        """
        Megpróbál betölteni egy korábban mentett játékot
        
        :return: True, ha sikerült a betöltés, False egyébként
        """
        try:
            # A legfrissebb mentés lekérése a GameSaveManager-től
            latest_save = self.save_manager.get_latest_save()
            
            # Ha nincs mentés, kilépünk
            if not latest_save:
                print("Nem található mentett játék.")
                return False
            
            print(f"Legfrissebb mentés betöltése: {latest_save}")
            
            # Játék betöltése a GameSaveManager segítségével
            success = self.save_manager.load_game(latest_save, show_dialog=False)
            
            if success:
                # Adatok inicializálása az elemzésekhez
                self._on_game_loaded()
                print(f"Játék sikeresen betöltve: {latest_save}")
                return True
            else:
                print("Nem sikerült betölteni a játékot.")
                return False
            
        except Exception as e:
            print(f"Hiba a mentett játék betöltésekor: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _new_game(self):
        """
        Új játék létrehozása - optimalizált verzió
        """
        # Új játék párbeszédablak
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Új játék")
        dialog.geometry("650x680")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Főkeret
        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Címke
        ctk.CTkLabel(main_frame, text="Új város létrehozása", 
                    font=ctk.CTkFont(size=18, weight="bold")).pack(pady=(0, 20))
        
        # Űrlap
        form_frame = ctk.CTkFrame(main_frame)
        form_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Város neve
        ctk.CTkLabel(form_frame, text="Város neve:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        varos_nev_entry = ctk.CTkEntry(form_frame, width=300)
        varos_nev_entry.pack(fill="x", pady=(0, 10))
        varos_nev_entry.insert(0, "Álomváros")
        
        # Kezdeti költségvetés
        ctk.CTkLabel(form_frame, text="Kezdeti költségvetés (Ft):", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        # Költségvetés keret és direkt beviteli lehetőség
        koltsegvetes_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        koltsegvetes_frame.pack(fill="x", pady=(0, 10))
        
        koltsegvetes_slider = ctk.CTkSlider(
            koltsegvetes_frame, 
            from_=10000000, 
            to=10000000000,  # Nagyobb érték tartomány (10 milliárd)
            number_of_steps=99,
            width=250
        )
        koltsegvetes_slider.pack(side="left", padx=(0, 10))
        koltsegvetes_slider.set(100000000)  # 100 millió alapérték
        
        koltsegvetes_entry = ctk.CTkEntry(koltsegvetes_frame, width=150)
        koltsegvetes_entry.pack(side="left")
        koltsegvetes_entry.insert(0, "100 000 000")
        
        # Eseményvezérlő - aktualizáljuk a mezőt a csúszka mozgatásakor
        def on_koltsegvetes_change(value):
            value = int(value)
            formatted_value = f"{value:,}".replace(",", " ")
            koltsegvetes_entry.delete(0, "end")
            koltsegvetes_entry.insert(0, formatted_value)
        
        koltsegvetes_slider.configure(command=on_koltsegvetes_change)
        
        # Eseményvezérlő - aktualizáljuk a csúszkát a mező változásakor
        def on_koltsegvetes_entry_change(*args):
            try:
                # Csak a számokat hagyjuk meg
                clean_value = koltsegvetes_entry.get().replace(" ", "").replace(",", "")
                if clean_value and clean_value.isdigit():
                    value = min(int(clean_value), 10000000000)  # Korlátozzuk a maximális értéket
                    koltsegvetes_slider.set(value)
            except:
                pass  # Hiba esetén nem csinálunk semmit
        
        # Kötjük az eseményeket
        koltsegvetes_entry.bind("<KeyRelease>", on_koltsegvetes_entry_change)
        koltsegvetes_entry.bind("<FocusOut>", on_koltsegvetes_entry_change)
        
        # Kezdeti lakosság
        ctk.CTkLabel(form_frame, text="Kezdeti lakosság:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        # Lakosság keret és direkt beviteli lehetőség
        lakossag_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        lakossag_frame.pack(fill="x", pady=(0, 10))
        
        lakossag_slider = ctk.CTkSlider(
            lakossag_frame, 
            from_=100, 
            to=100000,  # Nagyobb érték tartomány (100 ezer)
            number_of_steps=99,
            width=250
        )
        lakossag_slider.pack(side="left", padx=(0, 10))
        lakossag_slider.set(1000)  # 1000 fő alapérték
        
        lakossag_entry = ctk.CTkEntry(lakossag_frame, width=150)
        lakossag_entry.pack(side="left")
        lakossag_entry.insert(0, "1 000")
        
        # Eseményvezérlő - aktualizáljuk a mezőt a csúszka mozgatásakor
        def on_lakossag_change(value):
            value = int(value)
            formatted_value = f"{value:,}".replace(",", " ")
            lakossag_entry.delete(0, "end")
            lakossag_entry.insert(0, formatted_value)
        
        lakossag_slider.configure(command=on_lakossag_change)
        
        # Eseményvezérlő - aktualizáljuk a csúszkát a mező változásakor
        def on_lakossag_entry_change(*args):
            try:
                # Csak a számokat hagyjuk meg
                clean_value = lakossag_entry.get().replace(" ", "").replace(",", "")
                if clean_value and clean_value.isdigit():
                    value = min(int(clean_value), 100000)  # Korlátozzuk a maximális értéket
                    lakossag_slider.set(value)
            except:
                pass  # Hiba esetén nem csinálunk semmit
        
        # Kötjük az eseményeket
        lakossag_entry.bind("<KeyRelease>", on_lakossag_entry_change)
        lakossag_entry.bind("<FocusOut>", on_lakossag_entry_change)
        
        # Esemény gyakoriság beállítása
        ctk.CTkLabel(form_frame, text="Esemény gyakoriság:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        esemeny_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        esemeny_frame.pack(fill="x", pady=(0, 10))
        
        esemeny_slider = ctk.CTkSlider(
            esemeny_frame, 
            from_=0.0, 
            to=1.0,
            number_of_steps=20,
            width=250
        )
        esemeny_slider.pack(side="left", padx=(0, 10))
        esemeny_slider.set(0.8)  # 0.8 (80%) alapérték
        
        esemeny_label = ctk.CTkLabel(
            esemeny_frame, 
            text="80% (gyakori események)",
            width=200
        )
        esemeny_label.pack(side="left")
        
        # Eseményvezérlő - aktualizáljuk a címkét a csúszka mozgatásakor
        def on_esemeny_change(value):
            percentage = int(value * 100)
            if percentage < 20:
                description = "nagyon ritka események"
            elif percentage < 40:
                description = "ritka események"
            elif percentage < 60:
                description = "közepes gyakoriság"
            elif percentage < 80:
                description = "gyakori események"
            else:
                description = "nagyon gyakori események"
                
            esemeny_label.configure(text=f"{percentage}% ({description})")
        
        esemeny_slider.configure(command=on_esemeny_change)
        
        # Nehézségi szint (hatással van a gazdasági növekedésre, kockázati tényezőkre stb.)
        ctk.CTkLabel(form_frame, text="Nehézségi szint:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        nehezseg_var = ctk.StringVar(value="normál")
        nehezseg_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        nehezseg_frame.pack(fill="x", pady=(0, 10))
        
        # Nehézségi szint választók
        nehezseg_descriptions = {
            "könnyű": "Nagyobb kezdeti költségvetés és lakosság, lassabb hanyatlás",
            "normál": "Kiegyensúlyozott játékmenet",
            "nehéz": "Kisebb kezdeti költségvetés és lakosság, gyorsabb hanyatlás"
        }
        
        # Nehézségi szint választók
        for i, nehezseg in enumerate(["könnyű", "normál", "nehéz"]):
            nehezseg_radio = ctk.CTkRadioButton(
                nehezseg_frame, 
                text=nehezseg.capitalize(), 
                variable=nehezseg_var,
                value=nehezseg,
                fg_color=self.THEME_COLORS["primary"]
            )
            nehezseg_radio.pack(side="left", padx=20)
        
        # Nehézségi szint leírás
        nehezseg_desc_label = ctk.CTkLabel(
            form_frame,
            text=nehezseg_descriptions["normál"],
            font=ctk.CTkFont(size=12, slant="italic")
        )
        nehezseg_desc_label.pack(anchor="w", pady=(0, 20))
        
        # Nehézség leírás frissítése kiválasztáskor
        def on_nehezseg_change(*args):
            selected = nehezseg_var.get()
            nehezseg_desc_label.configure(text=nehezseg_descriptions[selected])
            
        nehezseg_var.trace_add("write", on_nehezseg_change)
        
        # Haladó beállítások (összezárható)
        ctk.CTkLabel(form_frame, text="Haladó beállítások:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(10, 0))
        
        # Kezdeti elégedettség
        elegedettseg_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        elegedettseg_frame.pack(fill="x", pady=(5, 10))
        
        ctk.CTkLabel(elegedettseg_frame, text="Kezdeti elégedettség:",
                     width=150).pack(side="left", padx=10)
        
        elegedettseg_slider = ctk.CTkSlider(
            elegedettseg_frame, 
            from_=30, 
            to=90,
            number_of_steps=60,
            width=200
        )
        elegedettseg_slider.pack(side="left", padx=(0, 10))
        elegedettseg_slider.set(50)  # 50% alapérték
        
        elegedettseg_label = ctk.CTkLabel(
            elegedettseg_frame, 
            text="50%",
            width=50
        )
        elegedettseg_label.pack(side="left")
        
        # Eseményvezérlő - aktualizáljuk a címkét a csúszka mozgatásakor
        def on_elegedettseg_change(value):
            elegedettseg_label.configure(text=f"{int(value)}%")
        
        elegedettseg_slider.configure(command=on_elegedettseg_change)
        
        # Gombok keret
        buttons_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        buttons_frame.pack(fill="x", pady=10)
        
        # Mégsem gomb
        ctk.CTkButton(
            buttons_frame,
            text="Mégsem",
            command=dialog.destroy,
            fg_color=self.THEME_COLORS["secondary"]
        ).pack(side="left", padx=10, pady=10, fill="x", expand=True)
        
        # Státusz címke
        status_label = ctk.CTkLabel(
            buttons_frame,
            text="",
            text_color="#FF5722",
            font=ctk.CTkFont(size=12)
        )
        status_label.pack(side="bottom", pady=(5, 0), fill="x")
        
        # Létrehozás gomb
        def create_game():
            # Értékek kiolvasása és validálása
            try:
                varos_nev = varos_nev_entry.get() or "Álomváros"
                
                # Költségvetés kiolvasása, eltávolítva a szóközöket
                koltsegvetes_str = koltsegvetes_entry.get().replace(" ", "").replace(",", "")
                kezdeti_penz = int(koltsegvetes_str) if koltsegvetes_str.isdigit() else int(koltsegvetes_slider.get())
                
                # Lakosság kiolvasása, eltávolítva a szóközöket
                lakossag_str = lakossag_entry.get().replace(" ", "").replace(",", "")
                kezdeti_lakossag = int(lakossag_str) if lakossag_str.isdigit() else int(lakossag_slider.get())
                
                # Egyéb értékek
                esemeny_gyakorisag = float(esemeny_slider.get())
                nehezseg = nehezseg_var.get()
                kezdeti_elegedettseg = int(elegedettseg_slider.get())
                
                # Validáljuk az értékeket
                if kezdeti_penz <= 0:
                    status_label.configure(text="A kezdeti költségvetésnek pozitívnak kell lennie!")
                    return
                
                if kezdeti_lakossag <= 0:
                    status_label.configure(text="A kezdeti lakosságnak pozitívnak kell lennie!")
                    return
                
                status_label.configure(text="Játék létrehozása folyamatban...")
                # Frissítsük azonnal a felületet
                dialog.update_idletasks()
                
                # Játék létrehozása késleltetéssel, hogy a UI frissítése megtörténjen
                dialog.after(100, lambda: initialize_game_safely(
                    varos_nev, 
                    kezdeti_penz, 
                    kezdeti_lakossag, 
                    esemeny_gyakorisag, 
                    nehezseg, 
                    kezdeti_elegedettseg
                ))
                
            except Exception as e:
                status_label.configure(text=f"Hiba: {str(e)}")
                print(f"Hiba az új játék létrehozásakor: {e}")
                import traceback
                traceback.print_exc()
        
        def initialize_game_safely(varos_nev, kezdeti_penz, kezdeti_lakossag, esemeny_gyakorisag, nehezseg, kezdeti_elegedettseg):
            try:
                # Valódi játék létrehozás try-except blokkban
                self._initialize_game(
                    varos_nev=varos_nev,
                    kezdeti_penz=kezdeti_penz,
                    kezdeti_lakossag=kezdeti_lakossag,
                    esemeny_gyakorisag=esemeny_gyakorisag,
                    nehezseg=nehezseg,
                    kezdeti_elegedettseg=kezdeti_elegedettseg
                )
                dialog.destroy()
            except Exception as e:
                status_label.configure(text=f"Hiba a játék indításakor: {str(e)}")
                print(f"Hiba az új játék létrehozásakor: {e}")
                import traceback
                traceback.print_exc()
        
        ctk.CTkButton(
            buttons_frame,
            text="Létrehozás",
            command=create_game,
            fg_color=self.THEME_COLORS["primary"]
        ).pack(side="left", padx=10, pady=10, fill="x", expand=True)
    
    def _initialize_game(self, varos_nev, kezdeti_penz, kezdeti_lakossag, esemeny_gyakorisag, nehezseg, kezdeti_elegedettseg=50):
        """
        Játék inicializálása az indítási paraméterekkel
        
        :param varos_nev: Város neve
        :param kezdeti_penz: Kezdeti pénzösszeg
        :param kezdeti_lakossag: Kezdeti lakosságszám
        :param esemeny_gyakorisag: Események gyakorisága (0-1 között)
        :param nehezseg: Nehézségi szint (könnyű, normál, nehéz)
        :param kezdeti_elegedettseg: Kezdeti elégedettség (százalékban) - alapértelmezetten 50%
        """
        from ..models.varos import Varos
        from ..game.event_manager import EventManager
        
        # Új város létrehozása
        try:
            # Nehézségi szint alapján módosított paraméterek
            if nehezseg == "könnyű":
                kezdeti_penz *= 1.5
                kezdeti_lakossag *= 1.2
            elif nehezseg == "nehéz":
                kezdeti_penz *= 0.8
                kezdeti_lakossag *= 0.8
            
            # Város létrehozása
            self.game_engine.varos = Varos(
                nev=varos_nev,
                kezdeti_penz=kezdeti_penz,
                kezdeti_lakosok=kezdeti_lakossag
            )
            
            # Játék aktívvá tétele - FONTOS, hiányzott
            self.game_engine.jatek_aktiv = True
            
            # Nehézségi szint egyéb hatásai
            if nehezseg == "könnyű":
                self.game_engine.varos.gazdasagi_novekedes = 1.1
                self.game_engine.varos.lakossag_elegedettseg = max(60.0, kezdeti_elegedettseg)
            elif nehezseg == "nehéz":
                self.game_engine.varos.gazdasagi_novekedes = 0.9
                self.game_engine.varos.lakossag_elegedettseg = min(40.0, kezdeti_elegedettseg)
                # Kockázati tényezők magasabbak
                for kockazat in self.game_engine.varos.kockazati_tenyezok:
                    self.game_engine.varos.kockazati_tenyezok[kockazat] = 15.0
            else:
                # Normál nehézségi szintnél a megadott kezdeti elégedettséget állítjuk be
                self.game_engine.varos.lakossag_elegedettseg = kezdeti_elegedettseg
            
            print(f"Új város létrehozva: {varos_nev}")
            print(f"Kezdeti adatok: {kezdeti_penz:,} Ft, {kezdeti_lakossag:,} fő, {self.game_engine.varos.lakossag_elegedettseg:.1f}% elégedettség")
            print(f"Nehézségi szint: {nehezseg}")
            
            # Eseménykezelő létrehozása
            self.event_manager = EventManager(self.game_engine)
            self.game_engine.event_manager = self.event_manager
            
            # Eseménykezelő beállításai
            self.event_manager.esemeny_valoszinuseg = esemeny_gyakorisag
            
            # Fordulókezelő létrehozása
            self.fordulo_manager = ForduloManager(self.game_engine)
            
            # Egyéb játékhoz kapcsolódó inicializálás
            self.fordulo_szamlalo = 0
            self.city_happiness_history = [self.game_engine.varos.lakossag_elegedettseg]
            self.city_population_history = [self.game_engine.varos.lakosok_szama]
            self.city_budget_history = [self.game_engine.varos.penzugyi_keret]
            self.turns_history = [0]
            
            # UI frissítése
            self._update_ui()
            
            # Kezdő forduló automatikus indítása
            self._next_turn()
            
            # Átváltás az irányítópult nézetre
            self._show_view("dashboard")
            
            # Sikeres indítás üzenet
            messagebox.showinfo("Játék indítás", f"Üdvözöllek {varos_nev} városában! A játék sikeresen elindult.")
            
        except Exception as e:
            messagebox.showerror("Hiba", f"Hiba a játék inicializálása során: {str(e)}")
            print(f"Hiba a játék inicializálásakor: {e}")
            import traceback
            traceback.print_exc()
    
    def _update_citizens_view(self):
        """
        Lakosok nézet frissítése
        """
        # Töröljük a meglévő lakos kártyákat
        for card in self.citizen_cards:
            if card.winfo_exists():
                card.destroy()
        self.citizen_cards = []
        
        # Ellenőrizzük, hogy van-e aktív játék
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.citizens_list_frame, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.citizen_cards.append(info_label)
            
            # Lapozás elrejtése
            self.citizens_pagination_frame.pack_forget()
            return
        
        # Lakosok lekérése
        citizens = []
        if hasattr(self.game_engine.varos, 'lakosok'):
            citizens = list(self.game_engine.varos.lakosok.values())
        
        # Szűrés épület szerint, ha választva van
        building_filter = self.citizens_building_var.get()
        if building_filter != "összes":
            # Az épület ID kinyerése a szövegből (ID: X) formátumból
            import re
            match = re.search(r'ID: (\d+)', building_filter)
            if match:
                building_id = int(match.group(1))
                citizens = [c for c in citizens if hasattr(c, 'epulet_id') and c.epulet_id == building_id]
        
        # Szűrés keresés alapján
        search_term = self.citizens_search_var.get().lower()
        if search_term:
            citizens = [c for c in citizens if hasattr(c, 'nev') and search_term in c.nev.lower()]
        
        # Statisztikák számítása
        total_citizens = len(citizens)
        avg_age = sum(c.eletkor for c in citizens if hasattr(c, 'eletkor')) / total_citizens if total_citizens > 0 else 0
        avg_happiness = sum(c.elegedettseg for c in citizens if hasattr(c, 'elegedettseg')) / total_citizens if total_citizens > 0 else 0
        
        # Statisztikák frissítése
        self.citizens_stats_labels["count"].configure(text=f"Összes lakos: {total_citizens}")
        self.citizens_stats_labels["avg_age"].configure(text=f"Átlagéletkor: {avg_age:.1f} év")
        self.citizens_stats_labels["avg_happiness"].configure(text=f"Átlagos elégedettség: {avg_happiness:.1f}%")
        
        if not citizens:
            # Ha nincs lakos
            no_results = ctk.CTkLabel(
                self.citizens_list_frame, 
                text="Nincs a keresésnek megfelelő lakos." if search_term or building_filter != "összes" else "Nincs lakos a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_results.pack(expand=True, pady=20)
            self.citizen_cards.append(no_results)
            
            # Lapozás elrejtése
            self.citizens_pagination_frame.pack_forget()
            return
            
        # Oldalméret (egy oldalon megjelenő lakosok száma)
        page_size = 50
        
        # Összes oldalszám kiszámítása
        total_pages = (total_citizens - 1) // page_size + 1
        
        # Ellenőrizzük, hogy az aktuális oldal érvényes-e
        if self.citizens_page >= total_pages:
            self.citizens_page = max(0, total_pages - 1)
        
        # Lapozási vezérlők frissítése
        self.citizen_page_label.configure(text=f"Oldal: {self.citizens_page + 1} / {total_pages}")
        self.citizen_prev_button.configure(state="normal" if self.citizens_page > 0 else "disabled")
        self.citizen_next_button.configure(state="normal" if self.citizens_page < total_pages - 1 else "disabled")
        
        # Lapozás láthatóvá tétele, ha több mint egy oldal van
        if total_pages > 1:
            self.citizens_pagination_frame.pack(fill="x", padx=10, pady=10)
        else:
            self.citizens_pagination_frame.pack_forget()
        
        # Aktuális oldal lakosainak megjelenítése
        start_idx = self.citizens_page * page_size
        end_idx = min(start_idx + page_size, len(citizens))
        current_page_citizens = citizens[start_idx:end_idx]
        
        # Lakosok megjelenítése
        for citizen in current_page_citizens:
            self._create_citizen_card(citizen)

    def _change_citizens_page(self, delta):
        """
        Lapozás a polgárok nézetben
        
        :param delta: Előre (+1) vagy hátra (-1) lapozás
        """
        self.citizens_page += delta
        self._update_citizens_view()

    def _filter_citizens(self, *args):
        """
        Polgárok szűrése a keresési feltételek alapján
        """
        self._update_citizens_view()

    def _update_ui(self):
        """
        Felhasználói felület frissítése
        """
        # Alap UI állapot frissítése
        self._update_city_data()
        
        # Ha nincs játékmotor vagy város, nem frissítünk semmit
        if not hasattr(self, 'game_engine') or not self.game_engine or not hasattr(self.game_engine, 'varos') or not self.game_engine.varos:
            return
            
        # Ha az aktuális nézet a dashboard
        if self.current_view == 'dashboard':
            self._update_dashboard_view()
        
        # Ha az aktuális nézet a városnézet, frissítjük a 3D térképet
        elif self.current_view == 'city':
            self._refresh_city_view()
            
        # Épületek nézet frissítése
        elif self.current_view == 'buildings':
            self._update_buildings_view()
        elif self.current_view == 'services':
            self._update_services_view()
        elif self.current_view == 'projects':
            self._update_projects_view()
        elif self.current_view == 'citizens':
            self._update_citizens_view()
        elif self.current_view == 'analytics':
            self._update_analytics_view()
        elif self.current_view == 'events':
            self._update_events_view()
        elif self.current_view == 'settings':
            self._update_settings_view()
        
        return True

    def _on_auto_turn_speed_change(self, value):
        """
        Automatikus forduló sebesség változtatása
        """
        self.auto_turn_speed = value

    def _toggle_auto_turn(self):
        """
        Automatikus forduló be/kikapcsolása
        """
        self.auto_turn_active = not self.auto_turn_active
        
        if self.auto_turn_active:
            self.auto_turn_button.configure(text="Auto ■")
            self._auto_turn_step()
        else:
            self.auto_turn_button.configure(text="Auto ►")

    def _auto_turn_step(self):
        """
        Automatikus forduló léptetése
        """
        if self.auto_turn_active:
            self._next_turn()
            
            # Csak akkor állítunk be új időzítőt, ha a játék még aktív
            if self.auto_turn_active and self.game_engine.jatek_aktiv:
                self.root.after(int(self.auto_turn_speed * 1000), self._auto_turn_step)
            else:
                # Ha a játék véget ért, akkor kikapcsoljuk az automatikus fordulót
                self.auto_turn_active = False
                self.auto_turn_button.configure(text="Auto ►")  # Gomb visszaállítása

    def _next_turn(self):
        """
        Következő forduló végrehajtása
        """
        # Ha nincs aktív játék, nem hajtunk végre fordulót
        if not self.game_engine or not self.game_engine.jatek_aktiv:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Következő forduló végrehajtása
        try:
            # Forduló végrehajtása a játék motorban
            fordulo_esemenyek = self.game_engine.kovetkezo_fordulo()
            
            # Forduló számláló frissítése
            self.fordulo_szamlalo = self.game_engine.fordulo_szamlalo
            
            # UI frissítése a forduló változások alapján
            self._update_ui()
            
            # Automatikus mentés, ha szükséges
            self.save_manager.check_auto_save(self.fordulo_szamlalo)
            
            # Ellenőrizzük, hogy van-e vége a játéknak
            jatek_vege, uzenet = self._check_game_over_conditions()
            
            # Ha vége a játéknak, jelezzük a felhasználónak és állítsuk le az automatikus fordulókat
            if jatek_vege:
                self.auto_turn_active = False  # Automatikus fordulók leállítása
                self.auto_turn_button.configure(text="Auto ►")  # Gomb visszaállítása
                messagebox.showinfo("Játék vége", uzenet)
                return
            
            # Események megjelenítése, ha vannak
            if fordulo_esemenyek:
                self._show_events(fordulo_esemenyek)
                
        except Exception as e:
            print(f"Hiba a forduló végrehajtása során: {e}")
            messagebox.showerror("Forduló hiba", f"Hiba történt a forduló végrehajtása során: {str(e)}")
            import traceback
            traceback.print_exc()

    def _check_game_over_conditions(self):
        """
        Játék vége feltételek ellenőrzése
        
        :return: (jatek_vege, uzenet) tuple
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return False, ""
        
        # Ellenőrizzük a lakosok számát
        if hasattr(self.game_engine.varos, 'lakosok_szama') and self.game_engine.varos.lakosok_szama <= 0:
            uzenet = "A városodból minden lakos elköltözött! Játék vége."
            # Játék leállítása
            self.game_engine.jatek_aktiv = False
            return True, uzenet
        
        # Ellenőrizzük a pénzügyi keretet
        if hasattr(self.game_engine.varos, 'penzugyi_keret') and self.game_engine.varos.penzugyi_keret < -100000000:
            uzenet = "A város csődbe ment! Játék vége."
            # Játék leállítása
            self.game_engine.jatek_aktiv = False
            return True, uzenet
            
        # Minden egyéb esetben a játék folytatódik
        return False, ""

    def _update_city_data(self):
        """
        Város adatainak frissítése a felületen
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
        
        # Státuszsor frissítése
        self.status_turn_label.configure(text=f"Forduló: {self.fordulo_szamlalo}")
        
        # Aktuális dátum kiszámítása alapértelmezetten 2023-tól indulva
        import datetime
        alapev = 2023
        aktualis_datum = datetime.date(alapev, 1, 1) + datetime.timedelta(days=self.fordulo_szamlalo * 30)
        self.status_date_label.configure(text=f"Dátum: {aktualis_datum.strftime('%Y.%m.%d')}")
        
        if hasattr(self.game_engine.varos, 'penzugyi_keret'):
            # Formázás ezresekre bontva
            penzugyi_keret_str = f"{int(self.game_engine.varos.penzugyi_keret):,}".replace(',', ' ')
            self.status_budget_label.configure(text=f"Költségvetés: {penzugyi_keret_str} Ft")
        
        if hasattr(self.game_engine.varos, 'lakossag_elegedettseg'):
            self.status_happiness_label.configure(text=f"Elégedettség: {self.game_engine.varos.lakossag_elegedettseg:.1f}%")
        
        if hasattr(self.game_engine.varos, 'lakosok_szama'):
            self.status_population_label.configure(text=f"Lakosság: {self.game_engine.varos.lakosok_szama} fő")

    def _update_dashboard_view(self):
        """
        Irányítópult frissítése az aktuális adatokkal
        """
        # Város statisztikák frissítése
        for widget in self.city_stats_content.winfo_children():
            widget.destroy()
        
        if hasattr(self.game_engine, 'varos') and self.game_engine.varos is not None:
            varos = self.game_engine.varos
            
            # Alapvető statisztikák kijelzése
            stats = [
                ("Lakosság", f"{varos.lakosok_szama:,} fő"),
                ("Elégedettség", f"{varos.lakossag_elegedettseg:.1f}%"),
                ("Költségvetés", f"{varos.penzugyi_keret:,.0f} Ft"),
                ("Fordulók száma", f"{varos.fordulok_szama}"),
                ("Aktuális dátum", f"{varos.aktualis_datum.strftime('%Y. %B')}"),
            ]
            
            for i, (label, value) in enumerate(stats):
                ctk.CTkLabel(
                    self.city_stats_content, 
                    text=label,
                    font=ctk.CTkFont(size=14, weight="bold")
                ).grid(row=i, column=0, sticky="w", pady=2, padx=5)
                
                ctk.CTkLabel(
                    self.city_stats_content, 
                    text=value,
                    font=ctk.CTkFont(size=14)
                ).grid(row=i, column=1, sticky="e", pady=2, padx=5)
        else:
            # Ha nincs aktív játék
            ctk.CTkLabel(
                self.city_stats_content, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            ).pack(expand=True, pady=20)
        
        # Események mini panel frissítése
        self._update_dashboard_events()
        
        # Elemzések mini panel frissítése
        self._update_dashboard_analytics()
    
    def _update_dashboard_events(self):
        """
        Dashboard események panel frissítése a legfrissebb eseményekkel
        """
        # Töröljük a meglévő esemény kártyákat
        for card in self.dashboard_event_cards:
            if card.winfo_exists():
                card.destroy()
        self.dashboard_event_cards = []
        
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.dashboard_events_frame, 
                text="Nincs aktív játék vagy még nem történt esemény.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.dashboard_event_cards.append(info_label)
            return
        
        # Események lekérése
        events = []
        event_manager_events = []
        
        # Elérhető események az eventmanager-ből
        if hasattr(self.game_engine, 'event_manager') and self.game_engine.event_manager:
            # Korábbi események a történeti naplóból a current fordulohoz
            if hasattr(self.game_engine.event_manager, 'esemenyek_tortenete'):
                event_manager_events = [e for e in self.game_engine.event_manager.esemenyek_tortenete 
                               if e.get('fordulo') == self.game_engine.fordulo_szamlalo]
        
        # Az utolsó fordulóban történt rendszer eseményeket is megjelenítsük
        rendszer_events = []
        if hasattr(self.game_engine.varos, 'elozo_fordulo_esemenyei'):
            for esemeny in self.game_engine.varos.elozo_fordulo_esemenyei:
                if isinstance(esemeny, str):
                    # Rendszer események, mint adóbevételek, szolgáltatás költségek stb.
                    penz_hatas = 0
                    boldogsag_hatas = 0
                    lakossag_hatas = 0
                    
                    if "Adóbevétel:" in esemeny:
                        try:
                            penz_str = esemeny.split(":", 1)[1].strip()
                            penz_str = penz_str.replace("Ft", "").replace(",", "").strip()
                            penz_hatas = int(penz_str)
                        except:
                            pass
                    elif "Szolgáltatások összköltsége:" in esemeny:
                        try:
                            penz_str = esemeny.split(":", 1)[1].strip()
                            penz_str = penz_str.replace("Ft", "").replace(",", "").strip()
                            penz_hatas = -int(penz_str)  # Költség, ezért negatív
                        except:
                            pass
                    elif "Épületek összköltsége:" in esemeny:
                        try:
                            penz_str = esemeny.split(":", 1)[1].strip()
                            penz_str = penz_str.replace("Ft", "").replace(",", "").strip()
                            penz_hatas = -int(penz_str)  # Költség, ezért negatív
                        except:
                            pass
                    elif "Lakosságszám növekedés:" in esemeny:
                        try:
                            lakossag_str = esemeny.split(":", 1)[1].strip()
                            lakossag_str = lakossag_str.replace("fő", "").replace("+", "").strip()
                            lakossag_hatas = int(lakossag_str)
                        except:
                            pass
                    elif "Közlekedés karbantartás:" in esemeny:
                        try:
                            penz_str = esemeny.split(":", 1)[1].strip()
                            penz_str = penz_str.replace("Ft", "").replace(",", "").strip()
                            penz_hatas = -int(penz_str)  # Költség, ezért negatív
                        except:
                            pass
                            
                    rendszer_events.append({
                        'fordulo': self.game_engine.fordulo_szamlalo,
                        'esemeny': {
                            'nev': esemeny,
                            'leiras': esemeny,
                            'tipus': 'rendszer',
                            'hatas': {
                                'penz': penz_hatas,
                                'boldogsag': boldogsag_hatas,
                                'lakossag': lakossag_hatas
                            }
                        }
                    })
        
        # Összefűzzük a rendszer eseményeket és az event_manager eseményeit
        if len(rendszer_events) > 0:
            events = rendszer_events + event_manager_events
        else:
            events = event_manager_events
            
        # Ha még mindig nincs esemény, jelezzük
        if not events:
            info_label = ctk.CTkLabel(
                self.dashboard_events_frame, 
                text="Még nem történt esemény.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.dashboard_event_cards.append(info_label)
            return
        
        # Csak a legújabb max. 5 eseményt mutatjuk
        recent_events = events[:5]
        
        # Ha vannak események, akkor megjelenítjük a "Kattints az Események fülre" üzenetet
        if len(events) > 5:
            header_frame = ctk.CTkFrame(self.dashboard_events_frame, fg_color="transparent")
            header_frame.pack(fill="x", padx=5, pady=(0, 5))
            
            osszes_esemeny = len(events)
            
            header_label = ctk.CTkLabel(
                header_frame,
                text=f"A fordulóban {osszes_esemeny} esemény történt. Kattints az 'Események' fülre a teljes listáért!",
                font=ctk.CTkFont(size=12, slant="italic"),
                justify="left",
                wraplength=350
            )
            header_label.pack(anchor="w", padx=5)
            self.dashboard_event_cards.append(header_frame)
        
        for event_data in recent_events:
            # Kártya keret
            card_frame = ctk.CTkFrame(self.dashboard_events_frame)
            card_frame.pack(fill="x", padx=5, pady=5)
            
            # Kártya tartalom
            content_frame = ctk.CTkFrame(card_frame, fg_color=self.THEME_COLORS["card_bg"])
            content_frame.pack(fill="x", padx=5, pady=5)
            
            # Hatás ikon és színes jelzés
            event_type = "semleges"
            color = self.THEME_COLORS["secondary"]
            
            # Feldolgozás az esemény típusától függően
            if isinstance(event_data, dict) and 'esemeny' in event_data:
                esemeny = event_data['esemeny']
                
                # Hatások lekérése
                hatas = esemeny.get('hatas', {})
                penz_hatas = hatas.get('penz', 0)
                boldogsag_hatas = hatas.get('boldogsag', 0)
                
                # Esemény típusának és színének meghatározása
                if penz_hatas > 0 or boldogsag_hatas > 0:
                    event_type = "pozitív"
                    color = self.THEME_COLORS["success"]
                elif penz_hatas < 0 or boldogsag_hatas < 0:
                    event_type = "negatív"
                    color = self.THEME_COLORS["danger"]
                
                # Típus jelölő
                tipus_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
                tipus_frame.pack(fill="x", pady=(0, 5))
                
                tipus_indicator = ctk.CTkFrame(tipus_frame, width=100, height=5, fg_color=color)
                tipus_indicator.pack(side="left", padx=10, pady=(5, 0))
                
                tipus_label = ctk.CTkLabel(
                    tipus_frame, 
                    text=esemeny.get('tipus', 'rendszer').capitalize(),
                    font=ctk.CTkFont(size=12)
                )
                tipus_label.pack(side="left", padx=(5, 0), pady=(5, 0))
                
                # Esemény neve és leírása
                nev_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
                nev_frame.pack(fill="x", padx=10, pady=(0, 5))
                
                nev_label = ctk.CTkLabel(
                    nev_frame, 
                    text=esemeny.get('nev', 'Ismeretlen esemény'),
                    font=ctk.CTkFont(size=14, weight="bold"),
                    wraplength=350,
                    justify="left"
                )
                nev_label.pack(anchor="w")
                
                if 'leiras' in esemeny and esemeny['leiras'] != esemeny.get('nev', ''):
                    leiras_label = ctk.CTkLabel(
                        content_frame, 
                        text=esemeny['leiras'],
                        font=ctk.CTkFont(size=13),
                        wraplength=350,
                        justify="left"
                    )
                    leiras_label.pack(anchor="w", padx=10, pady=(0, 5))
                
                # Hatás rövid kijelzése, ha van
                hatások_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
                hatások_frame.pack(fill="x", padx=10, pady=(0, 5))
                
                if penz_hatas != 0:
                    penz_label = ctk.CTkLabel(
                        hatások_frame,
                        text=f"Pénzügyi hatás: {penz_hatas:+,} Ft",
                        font=ctk.CTkFont(size=13),
                        text_color=color
                    )
                    penz_label.pack(anchor="w")
                
                if boldogsag_hatas != 0:
                    boldogsag_label = ctk.CTkLabel(
                        hatások_frame,
                        text=f"Elégedettségi hatás: {boldogsag_hatas:+.1f}%",
                        font=ctk.CTkFont(size=13),
                        text_color=color
                    )
                    boldogsag_label.pack(anchor="w")
                
                lakossag_hatas = hatas.get('lakossag', 0)
                if lakossag_hatas != 0:
                    lakossag_label = ctk.CTkLabel(
                        hatások_frame,
                        text=f"Lakossági hatás: {lakossag_hatas:+} fő",
                        font=ctk.CTkFont(size=13),
                        text_color=color
                    )
                    lakossag_label.pack(anchor="w")
                
            else:
                # Egyszerű szöveg esemény esetén
                leiras_label = ctk.CTkLabel(
                    content_frame, 
                    text=str(event_data),
                    font=ctk.CTkFont(size=13),
                    wraplength=350,
                    justify="left"
                )
                leiras_label.pack(anchor="w", padx=10, pady=10)
            
            self.dashboard_event_cards.append(card_frame)
    
    def _update_dashboard_analytics(self):
        """
        Dashboard elemzések panel frissítése mini grafikonokkal
        """
        # Töröljük a meglévő grafikon widgeteket
        for widget in self.dashboard_analytics_frame.winfo_children():
            widget.destroy()
        
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.dashboard_analytics_frame, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            return
            
        # Ellenőrizzük, hogy van-e elég adat a grafikonokhoz
        if len(self.city_happiness_history) < 2:
            info_label = ctk.CTkLabel(
                self.dashboard_analytics_frame, 
                text="Még nincs elég adat az elemzések megjelenítéséhez.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            return
        
        # Mini grafikon létrehozása a dashboard-ra
        try:
            # Mini grafikon ábra
            fig = plt.Figure(figsize=(5, 3), dpi=100)
            ax = fig.add_subplot(111)
            
            # Adatok előkészítése
            x = self.turns_history[-10:]  # Utolsó 10 forduló
            
            # Adatsorok előkészítése, csak a megfelelő hosszúságúakat használjuk
            y_happiness = self.city_happiness_history[-len(x):]
            y_population = self.city_population_history[-len(x):]
            y_budget = self.city_budget_history[-len(x):]
            
            # Második y tengely a költségvetéshez
            ax2 = ax.twinx()
            
            # Grafikonok
            ax.plot(x, y_happiness, 'g-', label='Elégedettség (%)')
            ax.plot(x, y_population, 'b-', label='Lakosság (fő)')
            ax2.plot(x, y_budget, 'r-', label='Költségvetés (Ft)')
            
            # Cím és feliratok
            ax.set_title('Város statisztikák az elmúlt 10 fordulóban')
            ax.set_xlabel('Forduló')
            ax.set_ylabel('Elégedettség (%) / Lakosság (fő)')
            ax2.set_ylabel('Költségvetés (Ft)')
            
            # Jelmagyarázat
            lines1, labels1 = ax.get_legend_handles_labels()
            lines2, labels2 = ax2.get_legend_handles_labels()
            ax.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
            
            # Formázás
            fig.tight_layout()
            
            # Matplotlib widget létrehozása
            canvas = FigureCanvasTkAgg(fig, master=self.dashboard_analytics_frame)
            canvas.draw()
            canvas.get_tk_widget().pack(fill="both", expand=True)
            
            # Eltároljuk a widgetet, hogy később felszabadíthassuk
            self.dashboard_chart_widget = canvas
        
        except Exception as e:
            print(f"Hiba a dashboard grafikon létrehozásakor: {e}")
            import traceback
            traceback.print_exc()
            
            # Hiba esetén üzenet megjelenítése
            error_label = ctk.CTkLabel(
                self.dashboard_analytics_frame, 
                text=f"Hiba a grafikon létrehozásakor: {str(e)}",
                font=ctk.CTkFont(size=14)
            )
            error_label.pack(expand=True, pady=20)

    def _generate_debug_event(self):
        """
        Tesztesemény generálása a hibakereséshez - fejlesztési célokra
        """
        if not self.game_engine or not self.game_engine.varos:
            messagebox.showinfo("Figyelmeztetés", "Nincs aktív játék!")
            return
            
        # Tesztesemény létrehozása
        teszt_esemeny = {
            'id': f"debug_{random.randint(1000, 9999)}",
            'tipus': random.choice(['gazdasagi', 'tarsadalmi', 'politikai', 'termeszeti']),
            'nev': "Teszt esemény",
            'leiras': "Ez egy tesztesemény, amit a fejlesztő hozott létre.",
            'hatas': {
                'penz': random.randint(-5000000, 5000000),
                'boldogsag': random.randint(-10, 10),
                'lakossag': random.randint(-50, 100)
            },
            'fordulo': self.game_engine.fordulo_szamlalo,
            'idopecset': datetime.now().isoformat()
        }
        
        # Esemény alkalmazása
        if self.game_engine.event_manager:
            self.game_engine.event_manager.esemenyek_alkalmazasa([teszt_esemeny])
            
        # UI frissítése
        self._update_ui()
        messagebox.showinfo("Teszt esemény", f"Teszt esemény létrehozva: {teszt_esemeny['tipus']}")

    def _filter_buildings(self, *args):
        """
        Épületek szűrése a kiválasztott típus alapján
        """
        self._update_buildings_view()

    def _filter_services(self, *args):
        """
        Szolgáltatások szűrése a kiválasztott típus alapján
        """
        self._update_services_view()

    def _filter_projects(self, *args):
        """
        Projektek szűrése a kiválasztott típus alapján
        """
        self._update_projects_view()

    def _create_new_project(self):
        """
        Új projekt létrehozása
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            messagebox.showerror("Hiba", "Nincs aktív játék!")
            return
        
        # Projekt adatok bekérése
        project_name = simpledialog.askstring("Új projekt", "Add meg a projekt nevét:")
        if not project_name:
            return
        
        # Projekt költség és idő bekérése
        try:
            project_cost = simpledialog.askinteger("Költség", "Add meg a projekt költségét (Ft):", minvalue=1000)
            if project_cost is None:
                return
            
            project_time = simpledialog.askinteger("Időtartam", "Add meg a projekt időtartamát (forduló):", minvalue=1)
            if project_time is None:
                return
            
            # Projekt létrehozása
            from ..models.projekt import Projekt
            from datetime import datetime, timedelta
            
            # Dátumok számítása
            kezdo_datum = datetime.now().date()
            befejezo_datum = kezdo_datum + timedelta(days=project_time * 30)  # Egy forduló ~30 nap
            
            # Projekt típus bekérése
            projekt_tipus = simpledialog.askstring("Projekt típusa", "Add meg a projekt típusát (pl. új építés, felújítás, karbantartás):")
            if not projekt_tipus:
                projekt_tipus = "egyéb"
            
            uj_projekt = Projekt(
                azonosito=len(self.game_engine.varos.projektek) + 1,
                nev=project_name,
                tipus=projekt_tipus,
                koltseg=project_cost,
                kezdo_datum=kezdo_datum,
                befejezo_datum=befejezo_datum
            )
            
            # Projekt hozzáadása a városhoz
            self.game_engine.varos.projekt_inditasa(uj_projekt)
            
            # UI frissítés
            self._update_projects_view()
            messagebox.showinfo("Siker", f"Az új '{project_name}' projekt létrejött!")
            
        except Exception as e:
            messagebox.showerror("Hiba", f"Hiba az új projekt létrehozásakor: {str(e)}")
            print(f"Hiba az új projekt létrehozásakor: {e}")
            import traceback
            traceback.print_exc()

    def _update_buildings_view(self):
        """
        Épületek nézet frissítése - optimalizált verzió lapozással
        """
        # Töröljük a meglévő épület kártyákat
        for card in self.building_cards:
            if card.winfo_exists():
                card.destroy()
        self.building_cards = []
        
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.buildings_list_frame, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.building_cards.append(info_label)
            return
        
        # Épületek lekérése
        buildings = list(self.game_engine.varos.epuletek.values())
        
        # Szűrés típus szerint, ha választva van
        building_filter = self.building_filter_var.get()
        if building_filter != "összes":
            buildings = [b for b in buildings if hasattr(b, 'tipus') and b.tipus.lower() == building_filter.lower()]
        
        if not buildings:
            # Ha nincs épület
            no_results = ctk.CTkLabel(
                self.buildings_list_frame, 
                text="Nincs a szűrésnek megfelelő épület." if building_filter != "összes" else "Nincs épület a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_results.pack(expand=True, pady=20)
            self.building_cards.append(no_results)
            return
        
        # Lapozás implementálása
        if not hasattr(self, 'buildings_page'):
            self.buildings_page = 0
            
        # Oldalméret (egy oldalon megjelenő épületek száma)
        page_size = 10
        
        # Lapozási vezérlők létrehozása, ha szükséges
        if not hasattr(self, 'buildings_pagination_frame'):
            # Lapozási keret létrehozása
            self.buildings_pagination_frame = ctk.CTkFrame(self.buildings_frame)
            self.buildings_pagination_frame.pack(fill="x", padx=10, pady=10)
            
            # Előző oldal gomb
            self.building_prev_button = ctk.CTkButton(
                self.buildings_pagination_frame,
                text="← Előző oldal",
                command=lambda: self._change_buildings_page(-1),
                width=120
            )
            self.building_prev_button.pack(side="left", padx=10)
            
            # Oldal kijelző
            self.building_page_label = ctk.CTkLabel(
                self.buildings_pagination_frame,
                text="Oldal: 1",
                font=ctk.CTkFont(size=14)
            )
            self.building_page_label.pack(side="left", padx=20)
            
            # Következő oldal gomb
            self.building_next_button = ctk.CTkButton(
                self.buildings_pagination_frame,
                text="Következő oldal →",
                command=lambda: self._change_buildings_page(1),
                width=120
            )
            self.building_next_button.pack(side="left", padx=10)
        
        # Lapozás beállítása
        total_buildings = len(buildings)
        total_pages = (total_buildings - 1) // page_size + 1
        
        # Utolsó oldalon túl vagyunk? Ha igen, visszalépünk az utolsóra
        if self.buildings_page >= total_pages:
            self.buildings_page = max(0, total_pages - 1)
        
        # Oldal kijelző frissítése
        self.building_page_label.configure(text=f"Oldal: {self.buildings_page + 1} / {total_pages}")
        
        # Lapozó gombok engedélyezése/tiltása
        self.building_prev_button.configure(state="normal" if self.buildings_page > 0 else "disabled")
        self.building_next_button.configure(state="normal" if self.buildings_page < total_pages - 1 else "disabled")
        
        # Az aktuális oldalon megjelenítendő épületek kiválasztása
        start_idx = self.buildings_page * page_size
        end_idx = min(start_idx + page_size, total_buildings)
        page_buildings = buildings[start_idx:end_idx]
        
        # Épületek megjelenítése
        for building in page_buildings:
            # Épület kártya létrehozása
            card_frame = ctk.CTkFrame(self.buildings_list_frame, fg_color=self.THEME_COLORS["card_bg"])
            card_frame.pack(fill="x", padx=5, pady=5, ipadx=5, ipady=5)
            
            # Épület fejléc
            header_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            header_frame.pack(fill="x", padx=10, pady=5)
            
            # Épület neve és típusa
            name_label = ctk.CTkLabel(
                header_frame, 
                text=getattr(building, 'nev', f"Épület_{getattr(building, 'azonosito', 'N/A')}"),
                font=ctk.CTkFont(size=16, weight="bold")
            )
            name_label.pack(side="left")
            
            # Épület ID és típus
            tipus = getattr(building, 'tipus', 'ismeretlen')
            id_label = ctk.CTkLabel(
                header_frame, 
                text=f"ID: {getattr(building, 'azonosito', 'N/A')} | Típus: {tipus}",
                font=ctk.CTkFont(size=12),
                text_color=self.THEME_COLORS["secondary"]
            )
            id_label.pack(side="right")
            
            # Épület adatok
            details_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            details_frame.pack(fill="x", padx=10, pady=5)
            
            # Alapterület
            if hasattr(building, 'alapterulet'):
                area_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Alapterület: {building.alapterulet} m²",
                    font=ctk.CTkFont(size=14)
                )
                area_label.pack(anchor="w", pady=2)
            
            # Építési költség
            if hasattr(building, 'epitesi_koltseg'):
                cost_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Építési költség: {building.epitesi_koltseg:,} Ft".replace(',', ' '),
                    font=ctk.CTkFont(size=14)
                )
                cost_label.pack(anchor="w", pady=2)
            
            # Lakossági kapacitás (csak lakóházaknál)
            if hasattr(building, 'tipus') and building.tipus.lower() == "lakóház":
                try:
                    kapacitas = building.lakos_kapacitas() if hasattr(building, 'lakos_kapacitas') else building.alapterulet // 20
                    capacity_label = ctk.CTkLabel(
                        details_frame, 
                        text=f"Lakos kapacitás: {kapacitas} fő",
                        font=ctk.CTkFont(size=14)
                    )
                    capacity_label.pack(anchor="w", pady=2)
                    
                    # Jelenlegi lakosok száma
                    current_residents = 0
                    if hasattr(self.game_engine.varos, 'lakosok'):
                        current_residents = sum(1 for l in self.game_engine.varos.lakosok.values()
                                              if hasattr(l, 'epulet_id') and l.epulet_id == building.azonosito)
                    
                    residents_label = ctk.CTkLabel(
                        details_frame, 
                        text=f"Jelenlegi lakosok: {current_residents} fő",
                        font=ctk.CTkFont(size=14)
                    )
                    residents_label.pack(anchor="w", pady=2)
                except Exception as e:
                    print(f"Hiba a lakos kapacitás számításakor: {e}")
            
            # Épület állapota
            allapot = getattr(building, 'allapot', 'normál')
            if hasattr(building, 'allapot'):
                status_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Állapot: {allapot}",
                    font=ctk.CTkFont(size=14)
                )
                status_label.pack(anchor="w", pady=2)
            
            # Épület gombok
            button_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            button_frame.pack(fill="x", padx=10, pady=5)
            
            # Szerkesztés gomb
            edit_button = ctk.CTkButton(
                button_frame,
                text="Szerkesztés",
                command=lambda b=building: self._edit_building(b),
                width=120,
                fg_color=self.THEME_COLORS["primary"]
            )
            edit_button.pack(side="left", padx=5)
            
            # Törlés gomb
            delete_button = ctk.CTkButton(
                button_frame,
                text="Törlés",
                command=lambda b=building: self._delete_building(b),
                width=120,
                fg_color=self.THEME_COLORS["danger"]
            )
            delete_button.pack(side="left", padx=5)
            
            # Kártya hozzáadása a listához
            self.building_cards.append(card_frame)

    def _edit_building(self, building):
        """
        Épület szerkesztése és karbantartás indítása
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            messagebox.showerror("Hiba", "Nincs aktív játék!")
            return
        
        # Karbantartás opciók
        options = ["Épület karbantartása", "Épület adatainak szerkesztése"]
        choice = simpledialog.askstring(
            "Művelet választása", 
            f"Válassz műveletet a(z) {building.nev} épülethez:", 
            initialvalue=options[0]
        )
        
        if not choice:
            return
            
        if choice == "Épület karbantartása":
            # Karbantartás adatok bekérése
            try:
                maintenance_cost = simpledialog.askinteger(
                    "Karbantartás költsége", 
                    f"Add meg a(z) {building.nev} karbantartásának költségét (Ft):", 
                    minvalue=10000
                )
                if maintenance_cost is None:
                    return
                
                maintenance_duration = simpledialog.askinteger(
                    "Karbantartás időtartama", 
                    f"Add meg a karbantartás időtartamát fordulókban (1 forduló = 1 hónap):", 
                    minvalue=1
                )
                if maintenance_duration is None:
                    return
                
                # Ellenőrizzük, hogy van-e elég pénz a karbantartásra
                if self.game_engine.varos.penzugyi_keret < maintenance_cost:
                    messagebox.showerror(
                        "Hiba", 
                        f"Nincs elég pénz a karbantartáshoz! (Egyenleg: {self.game_engine.varos.penzugyi_keret:,} Ft, Szükséges: {maintenance_cost:,} Ft)"
                    )
                    return
                
                # Karbantartási projekt létrehozása
                projekt_id, hiba = self.game_engine.varos.epulet_karbantartas_inditasa(
                    epulet_id=building.azonosito,
                    koltseg=maintenance_cost,
                    idotartam_honapokban=maintenance_duration
                )
                
                if projekt_id is None:
                    messagebox.showerror("Hiba", f"Nem sikerült létrehozni a karbantartási projektet: {hiba}")
                    return
                
                # UI frissítés
                self._update_buildings_view()
                self._update_projects_view()
                messagebox.showinfo(
                    "Siker", 
                    f"A(z) '{building.nev}' karbantartási projekt elindult! A karbantartás {maintenance_duration} fordulót (hónapot) vesz igénybe."
                )
                
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba a karbantartás indításakor: {str(e)}")
                print(f"Hiba a karbantartás indításakor: {e}")
                import traceback
                traceback.print_exc()
        
        elif choice == "Épület adatainak szerkesztése":
            messagebox.showinfo("Információ", "Az épület adatainak szerkesztése funkció még fejlesztés alatt áll.")
    
    def _delete_building(self, building):
        """
        Épület törlése
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
            
        if messagebox.askyesno("Megerősítés", f"Biztosan le szeretnéd bontani a(z) {building.nev} épületet?"):
            try:
                self.game_engine.varos.epulet_torlese(building.azonosito)
                self._update_buildings_view()
                messagebox.showinfo("Siker", f"A(z) {building.nev} épület lebontva.")
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba az épület törlésekor: {str(e)}")
    
    def _create_new_building(self):
        """
        Új épület létrehozása
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            messagebox.showerror("Hiba", "Nincs aktív játék!")
            return
        
        # Épület adatok bekérése
        building_name = simpledialog.askstring("Új épület", "Add meg az épület nevét:")
        if not building_name:
            return
        
        # Épület típus bekérése
        epulet_tipusok = self.game_engine.varos.get_epulet_tipusok() if hasattr(self.game_engine.varos, "get_epulet_tipusok") else ["lakóház", "kereskedelmi", "ipari", "oktatási", "egészségügyi", "kulturális", "középület"]
        
        building_type = simpledialog.askstring("Épület típus", f"Add meg az épület típusát ({', '.join(epulet_tipusok)}):", initialvalue=epulet_tipusok[0])
        if not building_type or building_type.lower() not in [t.lower() for t in epulet_tipusok]:
            messagebox.showerror("Hiba", f"Érvénytelen épület típus! Válassz a következők közül: {', '.join(epulet_tipusok)}")
            return
        
        # További adatok bekérése
        try:
            building_area = simpledialog.askinteger("Alapterület", "Add meg az épület alapterületét (m²):", minvalue=10)
            if building_area is None:
                return
            
            building_cost = simpledialog.askinteger("Költség", "Add meg az építési költséget (Ft):", minvalue=100000)
            if building_cost is None:
                return
            
            building_duration = simpledialog.askinteger("Építési idő", "Add meg az építés időtartamát fordulókban (1 forduló = 1 hónap):", minvalue=1)
            if building_duration is None:
                return
            
            # Ellenőrizzük, hogy van-e elég pénz az építésre
            if self.game_engine.varos.penzugyi_keret < building_cost:
                messagebox.showerror("Hiba", f"Nincs elég pénz az épület megépítéséhez! (Egyenleg: {self.game_engine.varos.penzugyi_keret:,} Ft, Szükséges: {building_cost:,} Ft)")
                return
            
            # Projekt létrehozása az új épülethez
            projekt_id, hiba = self.game_engine.varos.uj_epulet_epitese(
                nev=building_name,
                tipus=building_type,
                alapterulet=building_area,
                koltseg=building_cost,
                idotartam_honapokban=building_duration
            )
            
            if projekt_id is None:
                messagebox.showerror("Hiba", f"Nem sikerült létrehozni a projektet: {hiba}")
                return
            
            # UI frissítés
            self._update_buildings_view()
            self._update_projects_view()
            messagebox.showinfo("Siker", f"A(z) '{building_name}' építési projekt elindult! Az építés {building_duration} fordulót (hónapot) vesz igénybe.")
            
        except Exception as e:
            messagebox.showerror("Hiba", f"Hiba az új épület létrehozásakor: {str(e)}")
            print(f"Hiba az új épület létrehozásakor: {e}")
            import traceback
            traceback.print_exc()

    def _create_new_service(self):
        """
        Új szolgáltatás létrehozása
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            messagebox.showerror("Hiba", "Nincs aktív játék!")
            return
        
        # Szolgáltatás adatok bekérése
        service_name = simpledialog.askstring("Új szolgáltatás", "Add meg a szolgáltatás nevét:")
        if not service_name:
            return
        
        # Szolgáltatás típus bekérése
        szolgaltatas_tipusok = ["közlekedési", "oktatási", "egészségügyi", "közbiztonsági", "kulturális", "kommunális", "szociális", "adminisztratív"]
        
        service_type = simpledialog.askstring(
            "Szolgáltatás típus", 
            f"Add meg a szolgáltatás típusát ({', '.join(szolgaltatas_tipusok)}):", 
            initialvalue=szolgaltatas_tipusok[0]
        )
        if not service_type or service_type.lower() not in [t.lower() for t in szolgaltatas_tipusok]:
            messagebox.showerror("Hiba", f"Érvénytelen szolgáltatás típus! Válassz a következők közül: {', '.join(szolgaltatas_tipusok)}")
            return
        
        # További adatok bekérése
        try:
            service_cost = simpledialog.askinteger("Havi költség", "Add meg a szolgáltatás havi költségét (Ft):", minvalue=5000)
            if service_cost is None:
                return
            
            happiness_effect = simpledialog.askinteger(
                "Elégedettség hatás", 
                "Add meg a szolgáltatás hatását a lakosok elégedettségére (százalékpont):", 
                minvalue=1, 
                maxvalue=10
            )
            if happiness_effect is None:
                happiness_effect = 3  # Alapértelmezett érték
            
            # Ellenőrizzük, hogy van-e elég pénz a szolgáltatás elindításához
            if self.game_engine.varos.penzugyi_keret < service_cost * 3:  # Legalább 3 havi működéshez legyen elég pénz
                messagebox.showerror(
                    "Hiba", 
                    f"Nincs elég pénz a szolgáltatás elindításához! (Egyenleg: {self.game_engine.varos.penzugyi_keret:,} Ft, " +
                    f"Szükséges: {service_cost * 3:,} Ft a kezdeti 3 havi működéshez)"
                )
                return
            
            # Szolgáltatás létrehozása
            szolgaltatas_id = self.game_engine.varos.uj_szolgaltatas_inditasa(
                nev=service_name,
                tipus=service_type,
                havi_koltseg=service_cost,
                elegedettseg_hatas=happiness_effect
            )
            
            if szolgaltatas_id is None:
                messagebox.showerror("Hiba", "Nem sikerült létrehozni a szolgáltatást!")
                return
            
            # UI frissítés
            self._update_services_view()
            messagebox.showinfo(
                "Siker", 
                f"A(z) '{service_name}' szolgáltatás elindult! A szolgáltatás havi {service_cost:,} Ft-ba kerül, " +
                f"és {happiness_effect} százalékponttal növeli a lakosok elégedettségét."
            )
            
        except Exception as e:
            messagebox.showerror("Hiba", f"Hiba az új szolgáltatás létrehozásakor: {str(e)}")
            print(f"Hiba az új szolgáltatás létrehozásakor: {e}")
            import traceback
            traceback.print_exc()

    def _update_services_view(self):
        """
        Szolgáltatások nézet frissítése
        """
        for card in self.service_cards:
            if card.winfo_exists():
                card.destroy()
        self.service_cards = []
        
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.services_list_frame, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.service_cards.append(info_label)
            return
        
        # Szolgáltatások lekérése
        services = list(self.game_engine.varos.szolgaltatasok.values()) if hasattr(self.game_engine.varos, 'szolgaltatasok') else []
        
        # Szűrés állapot szerint, ha választva van
        service_filter = self.service_filter_var.get() if hasattr(self, 'service_filter_var') else "összes"
        if service_filter == "aktív":
            services = [s for s in services if hasattr(s, 'aktiv') and s.aktiv]
        elif service_filter == "inaktív":
            services = [s for s in services if hasattr(s, 'aktiv') and not s.aktiv]
        
        if not services:
            # Ha nincs szolgáltatás
            no_results = ctk.CTkLabel(
                self.services_list_frame, 
                text="Nincs a szűrésnek megfelelő szolgáltatás." if service_filter != "összes" else "Nincs szolgáltatás a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_results.pack(expand=True, pady=20)
            self.service_cards.append(no_results)
            return
            
        # Szolgáltatások megjelenítése
        for service in services:
            # Szolgáltatás kártya létrehozása
            card_frame = ctk.CTkFrame(self.services_list_frame, fg_color=self.THEME_COLORS["card_bg"])
            card_frame.pack(fill="x", padx=5, pady=5, ipadx=5, ipady=5)
            
            # Szolgáltatás fejléc
            header_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            header_frame.pack(fill="x", padx=10, pady=5)
            
            # Szolgáltatás neve és típusa
            name_label = ctk.CTkLabel(
                header_frame, 
                text=getattr(service, 'nev', f"Szolgáltatás_{getattr(service, 'azonosito', 'N/A')}"),
                font=ctk.CTkFont(size=16, weight="bold")
            )
            name_label.pack(side="left")
            
            # Szolgáltatás ID és típus
            tipus = getattr(service, 'tipus', 'ismeretlen')
            id_label = ctk.CTkLabel(
                header_frame, 
                text=f"ID: {getattr(service, 'azonosito', 'N/A')} | Típus: {tipus}",
                font=ctk.CTkFont(size=12),
                text_color=self.THEME_COLORS["secondary"]
            )
            id_label.pack(side="right")
            
            # Szolgáltatás adatok
            details_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            details_frame.pack(fill="x", padx=10, pady=5)
            
            # Költség
            if hasattr(service, 'havi_koltseg'):
                cost_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Havi költség: {service.havi_koltseg:,} Ft".replace(',', ' '),
                    font=ctk.CTkFont(size=14)
                )
                cost_label.pack(anchor="w", pady=2)
            
            # Elégedettségi hatás
            if hasattr(service, 'elegedettseg_hatas'):
                happiness_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Elégedettségi hatás: +{service.elegedettseg_hatas} százalékpont",
                    font=ctk.CTkFont(size=14)
                )
                happiness_label.pack(anchor="w", pady=2)
            
            # Lakossági hatás
            if hasattr(service, 'lakossag_hatas') and service.lakossag_hatas != 0:
                population_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Lakossági hatás: {service.lakossag_hatas:+} fő",
                    font=ctk.CTkFont(size=14)
                )
                population_label.pack(anchor="w", pady=2)
            
            # Kezdési dátum
            if hasattr(service, 'indulas_datum'):
                start_date_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Indulás dátuma: {service.indulas_datum}",
                    font=ctk.CTkFont(size=14)
                )
                start_date_label.pack(anchor="w", pady=2)
            
            # Állapot
            aktiv = getattr(service, 'aktiv', True)
            status_text = "Aktív" if aktiv else "Inaktív"
            status_color = self.THEME_COLORS["success"] if aktiv else self.THEME_COLORS["danger"]
            status_label = ctk.CTkLabel(
                details_frame, 
                text=f"Állapot: {status_text}",
                font=ctk.CTkFont(size=14, weight="bold"),
                text_color=status_color
            )
            status_label.pack(anchor="w", pady=2)
            
            # Gombok
            button_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            button_frame.pack(fill="x", padx=10, pady=5)
            
            if aktiv:
                # Szolgáltatás megszüntetése gomb
                delete_button = ctk.CTkButton(
                    button_frame,
                    text="Szolgáltatás megszüntetése",
                    command=lambda s=service: self._delete_service(s),
                    width=200,
                    fg_color=self.THEME_COLORS["danger"]
                )
                delete_button.pack(side="left", padx=5)
            else:
                # Szolgáltatás újraindítása gomb
                reactivate_button = ctk.CTkButton(
                    button_frame,
                    text="Szolgáltatás újraindítása",
                    command=lambda s=service: self._reactivate_service(s),
                    width=200,
                    fg_color=self.THEME_COLORS["success"]
                )
                reactivate_button.pack(side="left", padx=5)
            
            # Kártya hozzáadása a listához
            self.service_cards.append(card_frame)
    
    def _delete_service(self, service):
        """
        Szolgáltatás megszüntetése
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
            
        if messagebox.askyesno("Megerősítés", f"Biztosan le szeretnéd állítani a(z) {service.nev} szolgáltatást? Ez csökkenteni fogja a lakosok elégedettségét!"):
            try:
                success = self.game_engine.varos.szolgaltatas_megszuntetese(service.azonosito)
                if success:
                    self._update_services_view()
                    messagebox.showinfo("Siker", f"A(z) {service.nev} szolgáltatás megszüntetve.")
                else:
                    messagebox.showerror("Hiba", f"Nem sikerült megszüntetni a szolgáltatást.")
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba a szolgáltatás megszüntetésekor: {str(e)}")
                print(f"Hiba a szolgáltatás megszüntetésekor: {e}")
                import traceback
                traceback.print_exc()
    
    def _reactivate_service(self, service):
        """
        Szolgáltatás újraindítása
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
            
        if messagebox.askyesno("Megerősítés", f"Biztosan újra szeretnéd indítani a(z) {service.nev} szolgáltatást?"):
            try:
                if hasattr(service, 'ujraindit'):
                    success = service.ujraindit()
                    if success:
                        self._update_services_view()
                        messagebox.showinfo("Siker", f"A(z) {service.nev} szolgáltatás újraindítva.")
                    else:
                        messagebox.showerror("Hiba", f"Nem sikerült újraindítani a szolgáltatást.")
                else:
                    messagebox.showerror("Hiba", "A szolgáltatás újraindítása nem támogatott.")
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba a szolgáltatás újraindításakor: {str(e)}")
                print(f"Hiba a szolgáltatás újraindításakor: {e}")
                import traceback
                traceback.print_exc()

    def _update_analytics_view(self):
        """
        Elemzések nézet frissítése
        """
        if hasattr(self, 'analytics_view'):
            self.analytics_view.update_view()

    def _update_events_view(self):
        """
        Események nézet frissítése
        """
        if hasattr(self, 'events_view'):
            # Esemény adatok frissítése előtt biztosítsuk hogy az event_manager elérhető
            if hasattr(self.game_engine, 'event_manager') and self.game_engine.event_manager is not None:
                # Mindenek előtt betöltjük a korábban mentett eseményeket
                self.events_view.load_events_log()
                previously_saved_events = self.events_view.events_log.copy() if self.events_view.events_log else []
                
                # Események lekérése az eseménytörténetből
                events = []
                
                # A teljes eseménytörténetet használjuk, nem csak a korábbi eseményeket
                if hasattr(self.game_engine.event_manager, 'esemenyek_tortenete'):
                    events = self.game_engine.event_manager.esemenyek_tortenete.copy()
                
                # Ha nincs adat az eseménytörténetben, próbáljuk a korábbi eseményekből lekérni
                if not events and hasattr(self.game_engine.event_manager, 'get_korabbi_esemenyek'):
                    # Próbáljuk meg korlát nélkül lekérni az összes eseményt
                    try:
                        events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=None)
                    except:
                        # Ha a None érték hibát okoz, próbáljunk egy nagy számot
                        try:
                            events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=100000)
                        except Exception as e:
                            print(f"Hiba az események lekérésekor: {e}")
                
                # Biztosítsuk, hogy events lista és ne None
                events = events or []
                
                # Az aktuális forduló eseményeinek hozzáadása, ha vannak ilyenek
                if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'aktualis_fordulo_esemenyei'):
                    for esemeny in self.game_engine.varos.aktualis_fordulo_esemenyei:
                        # Ellenőrizzük, hogy az esemény már objektum-e
                        if isinstance(esemeny, dict):
                            # Ha már objektum, csak adjuk hozzá
                            if 'fordulo' not in esemeny:
                                esemeny['fordulo'] = self.game_engine.fordulo_szamlalo
                            events.append(esemeny)
                        else:
                            # Ha string, konvertáljuk objektummá
                            penz_hatas = 0
                            boldogsag_hatas = 0
                            lakossag_hatas = 0
                            
                            # Létrehozzuk az esemény objektumot az új formátumban
                            events.append({
                                'fordulo': self.game_engine.fordulo_szamlalo,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': penz_hatas,
                                        'boldogsag': boldogsag_hatas,
                                        'lakossag': lakossag_hatas
                                    }
                                }
                            })
                
                # Ellenőrizzük az előző fordulók eseményeit is
                if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'elozo_fordulo_esemenyei'):
                    for esemeny in self.game_engine.varos.elozo_fordulo_esemenyei:
                        # Ellenőrizzük, hogy az esemény már szerepel-e a listában
                        if isinstance(esemeny, str):
                            # Szöveges esemény konvertálása
                            event_obj = {
                                'fordulo': self.game_engine.fordulo_szamlalo - 1,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': 0,
                                        'boldogsag': 0,
                                        'lakossag': 0
                                    }
                                }
                            }
                            events.append(event_obj)
                
                # Egységesítjük az események formátumát és összegyűjtjük az összes eseményt
                all_events = []
                
                # 1. Feldolgozzuk az új eseményeket
                for i, event in enumerate(events):
                    if isinstance(event, dict):
                        # Ellenőrizzük, hogy az eseményeknek van-e 'fordulo' attribútuma
                        if 'fordulo' not in event:
                            events[i]['fordulo'] = 0  # Alapértelmezett érték
                        
                        # Ellenőrizzük, hogy az esemény objektumban van-e 'esemeny' kulcs
                        if 'esemeny' not in event and isinstance(event, dict):
                            # Átalakítjuk az új formátumra
                            event = {
                                'fordulo': event.get('fordulo', 0),
                                'esemeny': {
                                    'nev': event.get('nev', 'Ismeretlen esemény'),
                                    'leiras': event.get('leiras', ''),
                                    'tipus': event.get('tipus', 'rendszer'),
                                    'hatas': {
                                        'penz': event.get('penzugyi_hatas', 0),
                                        'boldogsag': event.get('elegedettsegi_hatas', 0),
                                        'lakossag': event.get('lakossag_hatas', 0)
                                    }
                                }
                            }
                        
                        all_events.append(event)
                
                # 2. Hozzáadjuk a korábban mentett eseményeket
                for event in previously_saved_events:
                    if isinstance(event, dict):
                        all_events.append(event)
                
                # 3. Töröljük a duplikátumokat
                egyedi_esemenyek = []
                esemeny_kulcsok = set()
                
                for esemeny in all_events:
                    if isinstance(esemeny, dict):
                        # Egyedi kulcs generálása a forduló és név alapján
                        fordulo = esemeny.get('fordulo', 0)
                        nev = esemeny.get('esemeny', {}).get('nev', '')
                        kulcs = f"{fordulo}_{nev}"
                        
                        if kulcs not in esemeny_kulcsok:
                            esemeny_kulcsok.add(kulcs)
                            egyedi_esemenyek.append(esemeny)
                
                # Frissítsük az EventsView-t a legújabb eseményekkel
                self.events_view.events_log = egyedi_esemenyek
                self.events_view.save_events_log()
                
                # Statisztikák frissítése - egységes adatstruktúrához igazítva
                total_events = len(egyedi_esemenyek)
                positive_events = 0
                negative_events = 0
                neutral_events = 0
                
                # Események típus szerinti számlálása
                for event in egyedi_esemenyek:
                    if not isinstance(event, dict):
                        continue
                    
                    esemeny = event.get('esemeny', {})
                    
                    # Ellenőrizzük, hogy az esemény 'hatas' vagy a régi 'penzugyi_hatas' formátumot használja-e
                    if 'hatas' in esemeny:
                        hatasok = esemeny.get('hatas', {})
                        penz_hatas = hatasok.get('penz', 0)
                        boldogsag_hatas = hatasok.get('boldogsag', 0)
                        lakossag_hatas = hatasok.get('lakossag', 0)
                    else:
                        # Régebbi formátum
                        penz_hatas = esemeny.get('penzugyi_hatas', 0)
                        boldogsag_hatas = esemeny.get('elegedettsegi_hatas', 0)
                        lakossag_hatas = esemeny.get('lakossag_hatas', 0)
                    
                    if penz_hatas > 0 or boldogsag_hatas > 0 or lakossag_hatas > 0:
                        positive_events += 1
                    elif penz_hatas < 0 or boldogsag_hatas < 0 or lakossag_hatas < 0:
                        negative_events += 1
                    else:
                        neutral_events += 1
                
                # Frissítsük a statisztika címkéket
                if hasattr(self, 'events_stats'):
                    self.events_stats["total"].configure(text=f"Összes esemény: {total_events}")
                    self.events_stats["positive"].configure(text=f"Pozitív események: {positive_events}")
                    self.events_stats["negative"].configure(text=f"Negatív események: {negative_events}")
                    self.events_stats["neutral"].configure(text=f"Semleges események: {neutral_events}")
            
            # Frissítsük az EventsView-t
            self.events_view.update_view()
            
            # A görgetési keret magasságának beállítása
            if hasattr(self.events_view, 'events_scroll_frame'):
                self.events_view.events_scroll_frame.configure(height=600)
                self.events_view.events_scroll_frame.update()
                
            # A bal oldali görgetési keret méretének beállítása
            if hasattr(self.events_view, 'left_scroll'):
                self.events_view.left_scroll.configure(height=600)
                self.events_view.left_scroll.update()

    def _change_theme(self, theme):
        """
        Téma váltása
        """
        ctk.set_appearance_mode(theme)
    
    def _update_projects_view(self):
        """
        Projektek nézet frissítése
        """
        # Töröljük a meglévő projekt kártyákat
        for card in self.project_cards:
            if card.winfo_exists():
                card.destroy()
        self.project_cards = []
        
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, tájékoztató üzenet
            info_label = ctk.CTkLabel(
                self.projects_list_frame, 
                text="Nincs aktív játék. Indíts új játékot vagy tölts be egy meglévőt.",
                font=ctk.CTkFont(size=14)
            )
            info_label.pack(expand=True, pady=20)
            self.project_cards.append(info_label)
            return
        
        # Projektek lekérése
        projects = list(self.game_engine.varos.projektek.values()) if hasattr(self.game_engine.varos, 'projektek') else []
        
        # Szűrés állapot szerint, ha választva van
        project_filter = self.project_filter_var.get()
        if project_filter != "összes":
            projects = [p for p in projects if hasattr(p, 'allapot') and p.allapot.lower() == project_filter.lower()]
        
        if not projects:
            # Ha nincs projekt
            no_results = ctk.CTkLabel(
                self.projects_list_frame, 
                text="Nincs a szűrésnek megfelelő projekt." if project_filter != "összes" else "Nincs projekt a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_results.pack(expand=True, pady=20)
            self.project_cards.append(no_results)
            return
        
        # Projektek megjelenítése
        for project in projects:
            # Projekt kártya létrehozása
            card_frame = ctk.CTkFrame(self.projects_list_frame, fg_color=self.THEME_COLORS["card_bg"])
            card_frame.pack(fill="x", padx=5, pady=5, ipadx=5, ipady=5)
            
            # Projekt fejléc
            header_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            header_frame.pack(fill="x", padx=10, pady=5)
            
            # Projekt neve
            name_label = ctk.CTkLabel(
                header_frame, 
                text=getattr(project, 'nev', f"Projekt_{getattr(project, 'azonosito', 'N/A')}"),
                font=ctk.CTkFont(size=16, weight="bold")
            )
            name_label.pack(side="left")
            
            # Projekt ID és állapot
            allapot = getattr(project, 'allapot', 'ismeretlen')
            allapot_color = "#4CAF50" if allapot == "befejezett" else "#2196F3" if allapot == "folyamatban" else "#F44336"
            
            id_label = ctk.CTkLabel(
                header_frame, 
                text=f"ID: {getattr(project, 'azonosito', 'N/A')} | Állapot: ",
                font=ctk.CTkFont(size=12),
                text_color=self.THEME_COLORS["secondary"]
            )
            id_label.pack(side="right")
            
            allapot_label = ctk.CTkLabel(
                header_frame, 
                text=allapot,
                font=ctk.CTkFont(size=12, weight="bold"),
                text_color=allapot_color
            )
            allapot_label.pack(side="right")
            
            # Projekt adatok
            details_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            details_frame.pack(fill="x", padx=10, pady=5)
            
            # Leírás
            if hasattr(project, 'leiras'):
                desc_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Leírás: {project.leiras}",
                    font=ctk.CTkFont(size=14),
                    wraplength=800
                )
                desc_label.pack(anchor="w", pady=2)
            
            # Költség
            if hasattr(project, 'koltseg'):
                cost_label = ctk.CTkLabel(
                    details_frame, 
                    text=f"Költség: {project.koltseg:,} Ft".replace(',', ' '),
                    font=ctk.CTkFont(size=14)
                )
                cost_label.pack(anchor="w", pady=2)
            
            # Haladás
            if hasattr(project, 'idotartam') and hasattr(project, 'aktualis_ido'):
                progress_frame = ctk.CTkFrame(details_frame, fg_color="transparent")
                progress_frame.pack(fill="x", pady=5)
                
                # Módosítjuk a kijelzést fordulókban (hónapokban)
                idotartam_honapok = project.idotartam // 30
                progress_text = ctk.CTkLabel(
                    progress_frame,
                    text=f"Haladás: {project.aktualis_ido}/{idotartam_honapok} forduló",
                    font=ctk.CTkFont(size=14)
                )
                progress_text.pack(side="left", padx=(0, 10))
                
                # Haladás százalék számítása a hónapok alapján
                progress_percent = min(100, int((project.aktualis_ido / idotartam_honapok * 100) if idotartam_honapok > 0 else 100))
                
                progress_bar = ctk.CTkProgressBar(
                    progress_frame,
                    width=400,
                    height=15,
                    corner_radius=5
                )
                progress_bar.pack(side="left", expand=True, fill="x")
                progress_bar.set(progress_percent / 100)
            
            # Projekt gombok
            button_frame = ctk.CTkFrame(card_frame, fg_color="transparent")
            button_frame.pack(fill="x", padx=10, pady=5)
            
            # Szerkesztés gomb
            edit_button = ctk.CTkButton(
                button_frame,
                text="Szerkesztés",
                width=100,
                command=lambda p=project: self._edit_project(p),
                fg_color=self.THEME_COLORS["primary"]
            )
            edit_button.pack(side="left", padx=5)
            
            # Törlés gomb
            delete_button = ctk.CTkButton(
                button_frame,
                text="Törlés",
                width=100,
                command=lambda p=project: self._delete_project(p),
                fg_color=self.THEME_COLORS["danger"]
            )
            delete_button.pack(side="left", padx=5)
            
            # Kártya hozzáadása a listához
            self.project_cards.append(card_frame)
            
    def _edit_project(self, project):
        """
        Projekt szerkesztése
        """
        messagebox.showinfo("Információ", "Ez a funkció még fejlesztés alatt áll.")
        
    def _delete_project(self, project):
        """
        Projekt törlése
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
            
        if messagebox.askyesno("Megerősítés", f"Biztosan törölni szeretnéd a(z) {project.nev} projektet?"):
            try:
                self.game_engine.varos.projekt_torlese(project.azonosito)
                self._update_projects_view()
                messagebox.showinfo("Siker", f"A(z) {project.nev} projekt törölve.")
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba a projekt törlésekor: {str(e)}")

    def _show_events(self, esemenyek):
        """
        Események megjelenítése egy kis bezárható értesítési ablakban
        
        :param esemenyek: Lista eseményeket tartalmazó dictionarykkel vagy stringekkel
        """
        if not esemenyek or len(esemenyek) == 0:
            return
        
        # Események előfeldolgozása: stringeket dictionaryként kezelni
        processed_events = []
        for esemeny in esemenyek:
            if isinstance(esemeny, str):
                # Ha az esemény egy string, átalakítjuk dictionary-vé
                processed_events.append({"nev": esemeny, "leiras": "", "tipus": "egyéb", "fordulo": self.fordulo_szamlalo})
            else:
                processed_events.append(esemeny)
        
        esemenyek = processed_events
        
        # Események értesítési ablak
        notify_window = ctk.CTkToplevel(self.root)
        notify_window.title("Új események")
        notify_window.geometry("400x300")  # Kisebb méret
        notify_window.lift()  # Előtérbe hozás
        notify_window.attributes("-topmost", True)  # Mindig felül
        
        # Pozicionálás a jobb alsó sarokba
        notify_window.update_idletasks()
        width = notify_window.winfo_width()
        height = notify_window.winfo_height()
        x = self.root.winfo_screenwidth() - width - 20
        y = self.root.winfo_screenheight() - height - 80
        notify_window.geometry(f'+{x}+{y}')
        
        # Események keret
        main_frame = ctk.CTkFrame(notify_window)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Cím
        header_frame = ctk.CTkFrame(main_frame, fg_color=self.THEME_COLORS["primary"])
        header_frame.pack(fill="x", pady=(0, 10))
        
        # Események száma
        events_count_text = f"{len(esemenyek)} új esemény" if len(esemenyek) > 1 else "Új esemény"
        title_label = ctk.CTkLabel(
            header_frame, 
            text=events_count_text, 
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color="#ffffff"  # Fehér szöveg sötét háttéren
        )
        title_label.pack(side="left", padx=10, pady=5)
        
        # Bezáró gomb
        close_btn = ctk.CTkButton(
            header_frame,
            text="✕",
            width=20,
            fg_color="transparent",
            hover_color=self.THEME_COLORS["secondary"],
            command=notify_window.destroy
        )
        close_btn.pack(side="right", padx=5)
        
        # Események görgethető keret
        events_scroll_frame = ctk.CTkScrollableFrame(main_frame, height=200)
        events_scroll_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Események megjelenítése (legfeljebb 5)
        displayed_count = min(len(esemenyek), 5)
        
        for i, esemeny in enumerate(esemenyek[:displayed_count]):
            # Adatok kinyerése
            tipus = esemeny.get("tipus", "egyéb").lower()
            nev = esemeny.get("nev", "Ismeretlen esemény")
            leiras = esemeny.get("leiras", "")
            
            # Esemény típus színe
            tipus_szin = "#3a7ebf"  # Alapértelmezett kék
            if tipus == 'gazdasagi':
                tipus_szin = "#2d8659"  # Zöld
            elif tipus == 'tarsadalmi':
                tipus_szin = "#7c3a9d"  # Lila
            elif tipus == 'politikai':
                tipus_szin = "#2d7186"  # Kék
            elif tipus == 'termeszeti':
                tipus_szin = "#86762d"  # Sárga
            elif tipus == 'katasztrofa':
                tipus_szin = "#863a2d"  # Piros
            
            # Esemény keret
            event_frame = ctk.CTkFrame(events_scroll_frame, fg_color="#f0f0f0")
            event_frame.pack(fill="x", pady=3, padx=2)
            
            # Esemény típus címke
            tipus_frame = ctk.CTkFrame(event_frame, fg_color="transparent")
            tipus_frame.pack(fill="x", pady=(5, 0), padx=5)
            
            tipus_badge = ctk.CTkLabel(
                tipus_frame, 
                text=tipus,
                fg_color=tipus_szin,
                corner_radius=5,
                text_color="#ffffff",  # Fehér szöveg a jobb olvashatóságért
                font=ctk.CTkFont(size=12),
                width=80
            )
            tipus_badge.pack(side="left", pady=2)
            
            # Esemény neve
            name_label = ctk.CTkLabel(
                event_frame, 
                text=nev,
                font=ctk.CTkFont(size=14, weight="bold"),
                text_color="#000000",  # Fekete szöveg
                anchor="w",
                justify="left"
            )
            name_label.pack(fill="x", padx=10, pady=(5, 0))
            
            # Esemény leírása
            if leiras:
                desc_label = ctk.CTkLabel(
                    event_frame, 
                    text=leiras,
                    font=ctk.CTkFont(size=12),
                    text_color="#333333",  # Sötétszürke másodlagos szöveg
                    anchor="w",
                    justify="left",
                    wraplength=350
                )
                desc_label.pack(fill="x", padx=10, pady=(0, 5))
            
            # Hatások összegzése
            if 'hatas' in esemeny and esemeny['hatas']:
                hatas_frame = ctk.CTkFrame(event_frame, fg_color="transparent")
                hatas_frame.pack(fill="x", padx=10, pady=(0, 5))
                
                for hatas_nev, hatas_ertek in esemeny['hatas'].items():
                    prefix = '+' if hatas_ertek >= 0 else ''
                    hatas_text = ""
                    
                    if hatas_nev == 'penz':
                        hatas_text = f"{prefix}{hatas_ertek:,} Ft"
                    elif hatas_nev == 'boldogsag':
                        hatas_text = f"Boldogság: {prefix}{hatas_ertek}"
                    elif hatas_nev == 'lakossag':
                        hatas_text = f"Lakosság: {prefix}{hatas_ertek} fő"
                    else:
                        hatas_text = f"{hatas_nev}: {prefix}{hatas_ertek}"
                    
                    # Hatás szöveg színe
                    text_color = "#2d8659" if hatas_ertek >= 0 else "#863a2d"
                    
                    hatas_label = ctk.CTkLabel(
                        hatas_frame, 
                        text=hatas_text,
                        text_color=text_color,
                        font=ctk.CTkFont(size=12, weight="bold")
                    )
                    hatas_label.pack(side="left", padx=(0, 10))
        
        # Ha több esemény van, mint amennyit megjelenítünk
        if len(esemenyek) > displayed_count:
            more_label = ctk.CTkLabel(
                main_frame, 
                text=f"+ {len(esemenyek) - displayed_count} további esemény",
                font=ctk.CTkFont(size=12, slant="italic"),
                text_color="#333333"  # Sötétszürke szöveg
            )
            more_label.pack(pady=5)
            
            # Összes esemény megtekintése gomb
            view_all_btn = ctk.CTkButton(
                main_frame,
                text="Összes esemény megtekintése",
                command=lambda: self._open_events_log(esemenyek)
            )
            view_all_btn.pack(pady=5)
            
    def _open_events_log(self, esemenyek=None):
        """
        Összes esemény megjelenítése egy teljes naplóban
        
        :param esemenyek: Megjelenítendő események listája. Ha None, az események naplójából olvassa ki.
        """
        # Ha nincs megadva konkrét események listája, használjuk az események naplóját
        if esemenyek is None:
            esemenyek = self.game_engine.esemenyek_naplo.get_all_events()
        
        # Események napló ablak
        log_window = ctk.CTkToplevel(self.root)
        log_window.title("Események napló")
        log_window.geometry("800x600")
        log_window.transient(self.root)
        log_window.grab_set()
        
        # Fő keret
        main_frame = ctk.CTkFrame(log_window)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Cím
        ctk.CTkLabel(
            main_frame, 
            text="Események napló", 
            font=ctk.CTkFont(size=20, weight="bold")
        ).pack(pady=(0, 20))
        
        # Kategória szűrő
        filter_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        filter_frame.pack(fill="x", pady=(0, 10))
        
        ctk.CTkLabel(filter_frame, text="Szűrés kategória szerint:", 
                    font=ctk.CTkFont(size=14)).pack(side="left", padx=10)
        
        kategoria_var = ctk.StringVar(value="összes")
        
        # Kategóriák kinyerése az eseményekből
        kategoriak = ["összes"] + sorted(list(set(esemeny["tipus"] for esemeny in esemenyek if "tipus" in esemeny)))
        
        kategoria_menu = ctk.CTkOptionMenu(
            filter_frame, 
            values=kategoriak,
            variable=kategoria_var,
            width=150
        )
        kategoria_menu.pack(side="left", padx=10)
        
        # Keresés keret
        search_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        search_frame.pack(fill="x", pady=(0, 10))
        
        ctk.CTkLabel(search_frame, text="Keresés eseményekben:", 
                    font=ctk.CTkFont(size=14)).pack(side="left", padx=10)
        
        search_var = ctk.StringVar()
        search_entry = ctk.CTkEntry(search_frame, width=250, textvariable=search_var)
        search_entry.pack(side="left", padx=10)
        
        # Események görgethető keret
        events_scroll_frame = ctk.CTkScrollableFrame(main_frame, height=400)
        events_scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Fejléc
        header_frame = ctk.CTkFrame(events_scroll_frame, height=30, fg_color=self.THEME_COLORS["secondary"])
        header_frame.pack(fill="x", pady=(0, 5))
        
        ctk.CTkLabel(header_frame, text="Forduló", width=80, 
                    font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Kategória", width=100, 
                    font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Esemény", 
                    font=ctk.CTkFont(weight="bold")).pack(side="left", expand=True, fill="x", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Hatás", width=150, 
                    font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        
        # Kezdetben az összes eseményt megjelenítjük
        displayed_events = esemenyek.copy()
        max_displayed = 100  # Maximum megjelenített események száma
        
        # Eseményekhez tartozó UI elemek
        event_ui_elements = []
        
        # Első betöltés és megjelenítés
        sorrendek = ["fordulo", "datum"]
        
        # Címek és háttérszínek
        row_colors = ["#ffffff", "#f5f5f5"]  # Váltakozó háttérszínek
        
        # Események filterfunkció
        def filter_events(*args):
            nonlocal displayed_events
            kategoria = kategoria_var.get()
            search_text = search_var.get().lower()
            
            # Szűrés
            if kategoria == "összes" and not search_text:
                displayed_events = esemenyek.copy()
            else:
                displayed_events = []
                for e in esemenyek:
                    # Ellenőrzés, hogy az esemény dictionary-e
                    if not isinstance(e, dict):
                        continue
                        
                    # Kategória szűrés
                    kategoria_egyezik = (kategoria == "összes" or 
                                         ("tipus" in e and e["tipus"] == kategoria))
                    
                    # Keresési szöveg szűrés
                    search_egyezik = (not search_text or
                                      any(search_text in str(e.get(key, "")).lower() 
                                          for key in ["nev", "leiras", "tipus"]))
                    
                    if kategoria_egyezik and search_egyezik:
                        displayed_events.append(e)
            
            # Korlátozzuk a megjelenítést
            if len(displayed_events) > max_displayed:
                limit_msg = f"\n\nMegjegyzés: {len(displayed_events) - max_displayed} további esemény nem jelenik meg."
                displayed_events = displayed_events[:max_displayed]
            else:
                limit_msg = ""
            
            # Régi UI elemek törlése
            for element in event_ui_elements:
                if element.winfo_exists():
                    element.destroy()
            event_ui_elements.clear()
            
            # Címke a szűrési eredményről
            result_label = ctk.CTkLabel(
                events_scroll_frame, 
                text=f"Megjelenített események: {len(displayed_events)}/{len(esemenyek)}{limit_msg}",
                font=ctk.CTkFont(size=12, slant="italic"),
                justify="left"
            )
            result_label.pack(anchor="w", pady=(5, 10))
            event_ui_elements.append(result_label)
            
            # Események megjelenítése
            for i, esemeny in enumerate(displayed_events):
                # Adatok kinyerése
                fordulo = esemeny.get("fordulo", "-")
                tipus = esemeny.get("tipus", "egyéb").lower()
                nev = esemeny.get("nev", "Ismeretlen esemény")
                leiras = esemeny.get("leiras", "")
                
                # Hatások összegzése
                hatas_text = ""
                if 'hatas' in esemeny:
                    for hatas_nev, hatas_ertek in esemeny['hatas'].items():
                        if hatas_nev == 'penz':
                            prefix = '+' if hatas_ertek >= 0 else ''
                            hatas_text += f"{prefix}{hatas_ertek:,} Ft\n"
                        elif hatas_nev == 'boldogsag':
                            prefix = '+' if hatas_ertek >= 0 else ''
                            hatas_text += f"Boldogság: {prefix}{hatas_ertek}\n"
                        elif hatas_nev == 'lakossag':
                            prefix = '+' if hatas_ertek >= 0 else ''
                            hatas_text += f"Lakosság: {prefix}{hatas_ertek} fő\n"
                        else:
                            prefix = '+' if hatas_ertek >= 0 else ''
                            hatas_text += f"{hatas_nev}: {prefix}{hatas_ertek}\n"
                
                # Sor háttérszíne
                bg_color = row_colors[i % 2]
                
                # Esemény típus színe
                tipus_szin = "#3a7ebf"  # Alapértelmezett kék
                if tipus == 'gazdasagi':
                    tipus_szin = "#2d8659"  # Zöld
                elif tipus == 'tarsadalmi':
                    tipus_szin = "#7c3a9d"  # Lila
                elif tipus == 'politikai':
                    tipus_szin = "#2d7186"  # Kék
                elif tipus == 'termeszeti':
                    tipus_szin = "#86762d"  # Sárga
                elif tipus == 'katasztrofa':
                    tipus_szin = "#863a2d"  # Piros
                
                # Esemény sor kerete
                row_frame = ctk.CTkFrame(events_scroll_frame, fg_color=bg_color)
                row_frame.pack(fill="x", pady=1)
                event_ui_elements.append(row_frame)
                
                # Esemény adatok
                fordulo_label = ctk.CTkLabel(row_frame, text=str(fordulo), width=80, 
                                          text_color="#000000")
                fordulo_label.pack(side="left", padx=5)
                
                tipus_label = ctk.CTkLabel(row_frame, text=tipus, width=100, fg_color=tipus_szin, 
                                         corner_radius=5, text_color="#ffffff")
                tipus_label.pack(side="left", padx=5, pady=2)
                
                # Esemény név és leírás
                nev_frame = ctk.CTkFrame(row_frame, fg_color=bg_color)
                nev_frame.pack(side="left", fill="x", expand=True, padx=5)
                
                nev_label = ctk.CTkLabel(nev_frame, text=nev, font=ctk.CTkFont(weight="bold"),
                                      text_color="#000000")
                nev_label.pack(anchor="w")
                
                if leiras:
                    leiras_label = ctk.CTkLabel(nev_frame, text=leiras, font=ctk.CTkFont(size=12),
                                             text_color="#333333")
                    leiras_label.pack(anchor="w")
                
                # Hatások
                hatas_label = ctk.CTkLabel(row_frame, text=hatas_text, width=150, justify="left",
                                        text_color="#000000")
                hatas_label.pack(side="left", padx=5)
        
        # Kategória és keresési változók hozzákapcsolása a filter funkcióhoz
        kategoria_var.trace_add("write", filter_events)
        search_var.trace_add("write", filter_events)
        
        # Kezdeti megjelenítés
        filter_events()
        
        # Bezáró gomb
        btn_frame = ctk.CTkFrame(log_window)
        btn_frame.pack(fill="x", padx=10, pady=10)
        
        ctk.CTkButton(
            btn_frame, 
            text="Bezárás",
            command=log_window.destroy
        ).pack(side="right", padx=10)

    def _change_buildings_page(self, delta):
        """
        Lapozás az épületek nézetben
        
        :param delta: Előre (+1) vagy hátra (-1) lapozás
        """
        self.buildings_page += delta
        self._update_buildings_view()

    def run(self):
        """
        Az alkalmazás főablaklának megjelenítése és a fő eseményhurok indítása
        """
        # Betöltőképernyő megjelenítése
        self._show_splash_screen()
        
        # Teljes képernyős mód beállítása
        self.root.attributes('-fullscreen', True)
        
        # Automatikus forduló ellenőrzése
        self._check_auto_turn()
        
        # Főablak megjelenítése és futtatása
        self.root.mainloop()
        
    def _create_citizen_card(self, citizen):
        """
        Egy lakos kártyájának létrehozása
        """
        # Lakos kártya keret
        card_frame = ctk.CTkFrame(self.citizens_list_frame)
        card_frame.pack(fill="x", padx=5, pady=5)
        self.citizen_cards.append(card_frame)
        
        # Lakos neve
        name_label = ctk.CTkLabel(
            card_frame,
            text=citizen.nev if hasattr(citizen, 'nev') else "Ismeretlen",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        name_label.pack(anchor="w", padx=10, pady=(5, 0))
        
        # Lakos adatai
        info_frame = ctk.CTkFrame(card_frame)
        info_frame.pack(fill="x", padx=10, pady=5)
        
        # Életkor
        age_label = ctk.CTkLabel(
            info_frame,
            text=f"Életkor: {citizen.eletkor} év" if hasattr(citizen, 'eletkor') else "Életkor: Ismeretlen",
            font=ctk.CTkFont(size=12)
        )
        age_label.pack(side="left", padx=5)
        
        # Elégedettség
        happiness_label = ctk.CTkLabel(
            info_frame,
            text=f"Elégedettség: {citizen.elegedettseg:.1f}%" if hasattr(citizen, 'elegedettseg') else "Elégedettség: Ismeretlen",
            font=ctk.CTkFont(size=12)
        )
        happiness_label.pack(side="left", padx=5)
        
        # Lakóhely
        if hasattr(citizen, 'epulet_id') and citizen.epulet_id in self.game_engine.varos.epuletek:
            building = self.game_engine.varos.epuletek[citizen.epulet_id]
            building_label = ctk.CTkLabel(
                info_frame,
                text=f"Lakóhely: {building.nev}" if hasattr(building, 'nev') else "Lakóhely: Ismeretlen",
                font=ctk.CTkFont(size=12)
            )
            building_label.pack(side="left", padx=5)
        
        # Elválasztó vonal
        separator = ctk.CTkFrame(card_frame, height=1)
        separator.pack(fill="x", padx=10, pady=5)

    def _save_game(self):
        """
        Játék mentése
        """
        if not self.game_engine or not self.game_engine.jatek_aktiv:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék amit menteni lehetne!")
            return
        
        # Játék mentése a SaveManager segítségével
        self.save_manager.save_game()
    
    def _load_game(self):
        """
        Játék betöltése
        """
        # Megerősítés kérése, ha van aktív játék
        if self.game_engine and self.game_engine.jatek_aktiv:
            if not messagebox.askyesno("Figyelmeztetés", 
                                      "Már van egy aktív játék. Ha betöltesz egy másikat, a jelenlegi állapot elvész. Folytatod?"):
                return
        
        # Játék betöltése a SaveManager segítségével
        self.save_manager.load_game(callback=self._on_game_loaded)
    
    def _on_game_loaded(self):
        """
        Játék betöltése után frissítjük az UI-t
        """
        # Fordulószámláló és adatok frissítése
        self.fordulo_szamlalo = self.game_engine.fordulo_szamlalo
        
        # Historikus adatok inicializálása
        self.city_happiness_history = [self.game_engine.varos.lakossag_elegedettseg]
        self.city_population_history = [self.game_engine.varos.lakosok_szama]
        self.city_budget_history = [self.game_engine.varos.penzugyi_keret]
        self.turns_history = [self.fordulo_szamlalo]
        
        # Teljes UI frissítése
        self._update_city_data()
        self._update_ui()
        
        # Dashboard nézet megjelenítése
        self._show_view("dashboard")
    
    def _set_auto_save_frequency(self, value):
        """
        Automatikus mentés gyakoriságának beállítása
        
        :param value: Gyakoriság értéke
        """
        # Konvertáljuk a beállítás értékét
        if value == "Kikapcsolva":
            frequency = 0
        elif value == "Minden fordulóban":
            frequency = 1
        else:
            frequency = int(value)
        
        # Beállítás módosítása
        if "jatekmenet" in BEALLITASOK:
            BEALLITASOK["jatekmenet"]["auto_mentes_gyakorisag"] = frequency
        else:
            print("Hiba: A BEALLITASOK['jatekmenet'] nem található!")
            
        print(f"Automatikus mentés gyakorisága beállítva: {frequency} forduló")

    def _show_game_options(self):
        """
        Megjeleníti a játék opciók párbeszédablakot, ahol a felhasználó
        választhat, hogy új játékot szeretne indítani vagy betölteni egy régit.
        """
        # Ellenőrizzük, hogy van-e mentett játék
        latest_save = self.save_manager.get_latest_save()
        
        # Párbeszédablak létrehozása
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Játék indítása")
        dialog.geometry("400x250")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Keret létrehozása
        frame = ctk.CTkFrame(dialog)
        frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Címke
        ctk.CTkLabel(frame, text="Válassz az alábbi lehetőségek közül:",
                   font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(0, 20))
        
        # Gombkeret
        button_frame = ctk.CTkFrame(frame, fg_color="transparent")
        button_frame.pack(fill="x", pady=10)
        
        # Eredmény tárolása
        result = [False]  # List to store the result (needed for closure)
        
        # Új játék gomb függvénye
        def start_new_game():
            dialog.destroy()
            result[0] = True
            self._new_game()
        
        # Betöltés gomb függvénye
        def load_saved_game():
            dialog.destroy()
            result[0] = True
            if latest_save:
                success = self.save_manager.load_game(latest_save, show_dialog=False)
                if success:
                    self._on_game_loaded()
                    messagebox.showinfo("Betöltés", f"Játék sikeresen betöltve: {os.path.basename(latest_save)}")
                else:
                    messagebox.showerror("Hiba", "Nem sikerült betölteni a mentett játékot!")
                    # Ha nem sikerült betölteni, indítsunk egy új játékot
                    self._new_game()
            else:
                messagebox.showinfo("Információ", "Nincs mentett játék.")
                self._new_game()
        
        # CSV fájl betöltése gomb függvénye
        def start_csv_game():
            dialog.destroy()
            result[0] = True
            self._csv_game()
        
        # Gombok
        ctk.CTkButton(button_frame, text="Új játék indítása", 
                    command=start_new_game,
                    width=160,
                    height=40,
                    font=ctk.CTkFont(size=14)).pack(side="left", padx=(0, 10))
        
        # A betöltés gomb csak akkor aktív, ha van mentett játék
        load_button = ctk.CTkButton(button_frame, text="Mentett játék betöltése", 
                    command=load_saved_game,
                    width=160,
                    height=40,
                    font=ctk.CTkFont(size=14))
        load_button.pack(side="left")
        
        if not latest_save:
            load_button.configure(state="disabled", fg_color=self.THEME_COLORS["secondary"])
        
        # CSV játék gomb
        csv_button = ctk.CTkButton(frame, text="Játék CSV fájlokkal", 
                    command=start_csv_game,
                    width=160,
                    height=40,
                    font=ctk.CTkFont(size=14))
        csv_button.pack(pady=10)
        
        # Várjuk meg, amíg a párbeszédablak bezáródik
        dialog.wait_window()
        
        # Ha a játékos nem választott és nincs aktív játék, akkor indítsunk egy újat
        if not result[0] and not self.game_engine.jatek_aktiv:
            self._new_game()

    def _csv_game(self):
        """
        Új játék indítása CSV fájlok beolvasásával.
        Kér egy épületek, egy lakosok és egy szolgáltatások CSV fájlt.
        """
        # Új játék párbeszédablak
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Játék CSV fájlokkal")
        dialog.geometry("650x850")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Főkeret
        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Címke
        ctk.CTkLabel(main_frame, text="Új város létrehozása CSV fájlokból", 
                    font=ctk.CTkFont(size=18, weight="bold")).pack(pady=(0, 20))
        
        # Város alapadatai keret
        form_frame = ctk.CTkFrame(main_frame)
        form_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Város neve
        ctk.CTkLabel(form_frame, text="Város neve:", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        varos_nev_entry = ctk.CTkEntry(form_frame, width=300)
        varos_nev_entry.pack(fill="x", pady=(0, 10))
        varos_nev_entry.insert(0, "CSV Város")
        
        # Kezdeti költségvetés
        ctk.CTkLabel(form_frame, text="Kezdeti költségvetés (Ft):", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        # Költségvetés keret és direkt beviteli lehetőség
        koltsegvetes_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        koltsegvetes_frame.pack(fill="x", pady=(0, 10))
        
        koltsegvetes_slider = ctk.CTkSlider(
            koltsegvetes_frame, 
            from_=10000000, 
            to=10000000000,  # 10 milliárd maximum
            number_of_steps=99,
            width=250
        )
        koltsegvetes_slider.pack(side="left", padx=(0, 10))
        koltsegvetes_slider.set(100000000)  # 100 millió alapérték
        
        koltsegvetes_entry = ctk.CTkEntry(koltsegvetes_frame, width=150)
        koltsegvetes_entry.pack(side="left")
        koltsegvetes_entry.insert(0, "100 000 000")
        
        # Eseményvezérlő - aktualizáljuk a mezőt a csúszka mozgatásakor
        def on_koltsegvetes_change(value):
            value = int(value)
            formatted_value = f"{value:,}".replace(",", " ")
            koltsegvetes_entry.delete(0, "end")
            koltsegvetes_entry.insert(0, formatted_value)
        
        koltsegvetes_slider.configure(command=on_koltsegvetes_change)
        
        # Eseményvezérlő - aktualizáljuk a csúszkát a mező változásakor
        def on_koltsegvetes_entry_change(*args):
            try:
                # Csak a számokat hagyjuk meg
                clean_value = koltsegvetes_entry.get().replace(" ", "").replace(",", "")
                if clean_value and clean_value.isdigit():
                    value = min(int(clean_value), 10000000000)  # Korlátozzuk a maximális értéket
                    koltsegvetes_slider.set(value)
            except:
                pass  # Hiba esetén nem csinálunk semmit
        
        # Kötjük az eseményeket
        koltsegvetes_entry.bind("<KeyRelease>", on_koltsegvetes_entry_change)
        koltsegvetes_entry.bind("<FocusOut>", on_koltsegvetes_entry_change)
        
        # Kezdeti elégedettség
        ctk.CTkLabel(form_frame, text="Kezdeti elégedettség (%):", 
                    font=ctk.CTkFont(size=14)).pack(anchor="w", pady=(5, 0))
        
        # Elégedettség keret és direkt beviteli lehetőség
        elegedettseg_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        elegedettseg_frame.pack(fill="x", pady=(0, 10))
        
        elegedettseg_slider = ctk.CTkSlider(
            elegedettseg_frame, 
            from_=0, 
            to=100,
            number_of_steps=100,
            width=250
        )
        elegedettseg_slider.pack(side="left", padx=(0, 10))
        elegedettseg_slider.set(50)  # 50% alapérték
        
        elegedettseg_entry = ctk.CTkEntry(elegedettseg_frame, width=150)
        elegedettseg_entry.pack(side="left")
        elegedettseg_entry.insert(0, "50")
        
        # Eseményvezérlő - aktualizáljuk a mezőt a csúszka mozgatásakor
        def on_elegedettseg_change(value):
            value = int(value)
            elegedettseg_entry.delete(0, "end")
            elegedettseg_entry.insert(0, str(value))
        
        elegedettseg_slider.configure(command=on_elegedettseg_change)
        
        # Eseményvezérlő - aktualizáljuk a csúszkát a mező változásakor
        def on_elegedettseg_entry_change(*args):
            try:
                # Csak a számokat hagyjuk meg
                clean_value = elegedettseg_entry.get().replace(" ", "").replace(",", "")
                if clean_value and clean_value.isdigit():
                    value = min(int(clean_value), 100)  # Korlátozzuk a maximális értéket
                    elegedettseg_slider.set(value)
            except:
                pass  # Hiba esetén nem csinálunk semmit
        
        # Kötjük az eseményeket
        elegedettseg_entry.bind("<KeyRelease>", on_elegedettseg_entry_change)
        elegedettseg_entry.bind("<FocusOut>", on_elegedettseg_entry_change)
        
        # CSV fájlok kiválasztása
        csv_frame = ctk.CTkFrame(main_frame)
        csv_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        ctk.CTkLabel(csv_frame, text="CSV fájlok kiválasztása", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(0, 10))
        
        # Változók a kiválasztott fájlokhoz
        epuletek_csv_path = ctk.StringVar()
        lakosok_csv_path = ctk.StringVar()
        szolgaltatasok_csv_path = ctk.StringVar()
        
        # Épületek CSV
        epuletek_frame = ctk.CTkFrame(csv_frame, fg_color="transparent")
        epuletek_frame.pack(fill="x", pady=(5, 5))
        
        ctk.CTkLabel(epuletek_frame, text="Épületek CSV:", width=120).pack(side="left", padx=(0, 10))
        
        epuletek_entry = ctk.CTkEntry(epuletek_frame, textvariable=epuletek_csv_path, width=300)
        epuletek_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        def select_epuletek_csv():
            file_path = filedialog.askopenfilename(
                title="Válassza ki az épületek CSV fájlt",
                filetypes=[("CSV fájlok", "*.csv"), ("Minden fájl", "*.*")]
            )
            if file_path:
                epuletek_csv_path.set(file_path)
                
        ctk.CTkButton(epuletek_frame, text="Tallózás", command=select_epuletek_csv, width=80).pack(side="left")
        
        # Lakosok CSV
        lakosok_frame = ctk.CTkFrame(csv_frame, fg_color="transparent")
        lakosok_frame.pack(fill="x", pady=(5, 5))
        
        ctk.CTkLabel(lakosok_frame, text="Lakosok CSV:", width=120).pack(side="left", padx=(0, 10))
        
        lakosok_entry = ctk.CTkEntry(lakosok_frame, textvariable=lakosok_csv_path, width=300)
        lakosok_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        def select_lakosok_csv():
            file_path = filedialog.askopenfilename(
                title="Válassza ki a lakosok CSV fájlt",
                filetypes=[("CSV fájlok", "*.csv"), ("Minden fájl", "*.*")]
            )
            if file_path:
                lakosok_csv_path.set(file_path)
                
        ctk.CTkButton(lakosok_frame, text="Tallózás", command=select_lakosok_csv, width=80).pack(side="left")
        
        # Szolgáltatások CSV
        szolgaltatasok_frame = ctk.CTkFrame(csv_frame, fg_color="transparent")
        szolgaltatasok_frame.pack(fill="x", pady=(5, 5))
        
        ctk.CTkLabel(szolgaltatasok_frame, text="Szolgáltatások CSV:", width=120).pack(side="left", padx=(0, 10))
        
        szolgaltatasok_entry = ctk.CTkEntry(szolgaltatasok_frame, textvariable=szolgaltatasok_csv_path, width=300)
        szolgaltatasok_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        def select_szolgaltatasok_csv():
            file_path = filedialog.askopenfilename(
                title="Válassza ki a szolgáltatások CSV fájlt",
                filetypes=[("CSV fájlok", "*.csv"), ("Minden fájl", "*.*")]
            )
            if file_path:
                szolgaltatasok_csv_path.set(file_path)
                
        ctk.CTkButton(szolgaltatasok_frame, text="Tallózás", command=select_szolgaltatasok_csv, width=80).pack(side="left")
        
        # CSV formátum információ
        info_frame = ctk.CTkFrame(main_frame)
        info_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        ctk.CTkLabel(info_frame, text="CSV formátumok:", 
                    font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", pady=(0, 5))
        
        # Épületek CSV formátum
        ctk.CTkLabel(info_frame, text="Épületek CSV oszlopai:", 
                    font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w")
        ctk.CTkLabel(info_frame, text="épület_azonosító, név, típus, építés_éve, hasznos_terület", 
                    font=ctk.CTkFont(size=12)).pack(anchor="w", pady=(0, 5))
        
        # Lakosok CSV formátum
        ctk.CTkLabel(info_frame, text="Lakosok CSV oszlopai:", 
                    font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w")
        ctk.CTkLabel(info_frame, text="lakos_azonosító, név, születési_év, foglalkozás, lakóhely", 
                    font=ctk.CTkFont(size=12)).pack(anchor="w", pady=(0, 5))
        
        # Szolgáltatások CSV formátum
        ctk.CTkLabel(info_frame, text="Szolgáltatások CSV oszlopai:", 
                    font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w")
        ctk.CTkLabel(info_frame, text="szolgáltatás_azonosító, név, típus, épület_azonosító", 
                    font=ctk.CTkFont(size=12)).pack(anchor="w", pady=(0, 5))
        
        # Indítás gomb és függvénye
        def create_game():
            try:
                # Értékek kiolvasása és validálása
                varos_nev = varos_nev_entry.get().strip()
                if not varos_nev:
                    messagebox.showerror("Hiba", "Kérem adja meg a város nevét!")
                    return
                
                # Költségvetés validálása
                try:
                    kezdeti_penz = int(koltsegvetes_entry.get().replace(" ", "").replace(",", ""))
                    if kezdeti_penz < 1000000:
                        messagebox.showerror("Hiba", "A kezdeti költségvetésnek legalább 1 millió Ft-nak kell lennie!")
                        return
                except ValueError:
                    messagebox.showerror("Hiba", "Érvénytelen költségvetés érték!")
                    return
                
                # Elégedettség validálása
                try:
                    kezdeti_elegedettseg = int(elegedettseg_entry.get())
                    if not (0 <= kezdeti_elegedettseg <= 100):
                        messagebox.showerror("Hiba", "Az elégedettségnek 0 és 100 között kell lennie!")
                        return
                except ValueError:
                    messagebox.showerror("Hiba", "Érvénytelen elégedettség érték!")
                    return
                
                # Új játék inicializálása
                self._initialize_game(
                    varos_nev=varos_nev,
                    kezdeti_penz=kezdeti_penz,
                    kezdeti_lakossag=0,  # Majd a CSV fájlból jön
                    esemeny_gyakorisag=0.5,  # Alapértelmezett érték
                    nehezseg="normál",
                    kezdeti_elegedettseg=kezdeti_elegedettseg
                )
                
                # CSV fájlok betöltése
                betoltott_elemek = 0
                
                # Épületek betöltése
                if epuletek_csv_path.get():
                    betoltott_elemek += self.game_engine.adatok_betoltese(epuletek_csv=epuletek_csv_path.get())
                
                # Szolgáltatások betöltése
                if szolgaltatasok_csv_path.get():
                    betoltott_elemek += self.game_engine.adatok_betoltese(szolgaltatasok_csv=szolgaltatasok_csv_path.get())
                
                # Lakosok betöltése
                if lakosok_csv_path.get():
                    betoltott_elemek += self.game_engine.adatok_betoltese(lakosok_csv=lakosok_csv_path.get())
                    # Frissítsük a lakosok számát
                    self.game_engine.varos.frissit_lakosok_szama()
                
                if betoltott_elemek == 0:
                    messagebox.showwarning("Figyelmeztetés", "Nem sikerült adatokat betölteni a CSV fájlokból!")
                
                dialog.destroy()
                
                # Frissítjük a felületet
                self._update_ui()
                
                messagebox.showinfo("Sikeres", f"Város létrehozva és CSV adatok betöltve ({betoltott_elemek} elem).")
                
            except Exception as e:
                messagebox.showerror("Hiba", f"Váratlan hiba történt: {str(e)}")
                
        # Indítás gomb
        ctk.CTkButton(main_frame, text="Játék indítása",
                    command=create_game,
                    width=200,
                    height=40,
                    font=ctk.CTkFont(size=16)).pack(pady=20)

    def _toggle_fullscreen(self, event):
        """
        Teljes képernyő mód kapcsolása
        """
        self.is_fullscreen = not self.is_fullscreen
        self.root.attributes('-fullscreen', self.is_fullscreen)

    def _toggle_fullscreen_from_settings(self):
        """
        Teljes képernyő mód kapcsolása a beállítások nézetből
        """
        self.is_fullscreen = not self.is_fullscreen
        self.root.attributes('-fullscreen', self.is_fullscreen)

if __name__ == "__main__":
    app = MainWindow()
    app.run()