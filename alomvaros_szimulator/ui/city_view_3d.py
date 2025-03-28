"""
3D városnézet modul a városfejlesztési szimulátorhoz
"""
import tkinter as tk
from tkinter import ttk
import customtkinter as ctk
import numpy as np
import math
import random
from PIL import Image, ImageTk, ImageDraw
import time

# Épülettípusok és színeik
BUILDING_COLORS = {
    "lakóház": "#4F8A8B",       # Kékes-zöld
    "kereskedelmi": "#F4A259",  # Narancssárga
    "ipari": "#7D5A5A",         # Barnás
    "oktatási": "#FFD56B",      # Sárga
    "egészségügyi": "#FF6B6B",  # Piros
    "kulturális": "#BB8FCE",    # Lila
    "középület": "#5DADE2"      # Kék
}

# Alapértelmezett épület szín
DEFAULT_BUILDING_COLOR = "#AAAAAA"  # Szürke

class CityView3D:
    """
    3D városnézet osztály, amely megjeleníti a város épületeit grafikusan
    """
    
    def __init__(self, parent_frame, game_engine):
        """
        3D városnézet inicializálása
        
        :param parent_frame: A szülő keret, amelybe a nézet kerül
        :param game_engine: Játékmotor, amely tartalmazza a város adatait
        """
        self.parent_frame = parent_frame
        self.game_engine = game_engine
        
        # Alapértelmezett beállítások
        self.zoom = 1.0   # Fix zoom érték, nem változtatható
        self.center_x = 0
        self.center_y = 0
        self.drag_start_x = 0
        self.drag_start_y = 0
        self.is_dragging = False
        self.rotation_angle = 0  # Forgatási szög
        self.rotation_active = False  # Forgatás aktív-e
        
        # Épületek tárolása
        self.buildings_3d = {}
        self.building_models = {}  # Épülettípusok modellei
        
        # Fix épületek pozíciói
        self.fixed_buildings = {}
        self.fixed_buildings_reset = False  # Épület elrendezés újratervezése
        
        # Járművek adatai
        self.vehicles = []
        self.animation_id = None
        
        # Fix fa pozíciók
        self.tree_locations = []
        
        # Nézet inicializálása
        self._init_view()
        
        # Forgatási időzítő
        self.rotation_timer = None
        
        self._create_building_models()
        
    def _init_view(self):
        """
        3D nézet inicializálása
        """
        # Fő konténer keret létrehozása
        self.main_frame = ctk.CTkFrame(self.parent_frame)
        self.main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Canvas létrehozása a 3D megjelenítéshez
        self.city_canvas = ctk.CTkCanvas(
            self.main_frame,
            background="#1A1A1A",
            highlightthickness=0
        )
        self.city_canvas.pack(fill="both", expand=True)
        
        # Égbolt háttér gradiens létrehozása
        self.sky_gradient = None
        
        # Egér események beállítása
        self.city_canvas.bind("<Button-1>", self._on_mouse_down)
        self.city_canvas.bind("<B1-Motion>", self._on_mouse_drag)
        self.city_canvas.bind("<ButtonRelease-1>", self._on_mouse_up)
        # Egérgörgő eseménykezelők eltávolítva
        
        # Méretváltozás eseménykezelő
        self.main_frame.bind("<Configure>", self._on_resize)
        
        # Irányítópanel létrehozása
        self._create_controls()
        
        # Időjárás és napszak beállítások
        self.day_night_cycle = "nappal"  # "nappal" vagy "éjszaka"
        self.weather = "napos"  # "napos", "felhős", "esős"
    
    def _create_building_models(self):
        """
        Épülettípusok 3D modelljeinek létrehozása
        """
        # Lakóház modell
        self.building_models["lakóház"] = {
            "width": 40,  # Szélesség
            "depth": 40,  # Mélység
            "min_height": 60,  # Minimum magasság
            "max_height": 150,  # Maximum magasság
            "color": BUILDING_COLORS["lakóház"],
            "draw_function": self._draw_residential_building  # Speciális rajzolási funkció
        }
        
        # Kereskedelmi épület modell
        self.building_models["kereskedelmi"] = {
            "width": 50,
            "depth": 60,
            "min_height": 40,
            "max_height": 100,
            "color": BUILDING_COLORS["kereskedelmi"],
            "draw_function": self._draw_commercial_building
        }
        
        # Ipari épület modell
        self.building_models["ipari"] = {
            "width": 80,
            "depth": 70,
            "min_height": 30,
            "max_height": 80,
            "color": BUILDING_COLORS["ipari"],
            "draw_function": self._draw_industrial_building
        }
        
        # Oktatási épület modell
        self.building_models["oktatási"] = {
            "width": 60,
            "depth": 50,
            "min_height": 40,
            "max_height": 70,
            "color": BUILDING_COLORS["oktatási"],
            "draw_function": self._draw_educational_building
        }
        
        # Egészségügyi épület modell
        self.building_models["egészségügyi"] = {
            "width": 70,
            "depth": 60,
            "min_height": 50,
            "max_height": 90,
            "color": BUILDING_COLORS["egészségügyi"],
            "draw_function": self._draw_healthcare_building
        }
        
        # Kulturális épület modell
        self.building_models["kulturális"] = {
            "width": 65,
            "depth": 65,
            "min_height": 55,
            "max_height": 120,
            "color": BUILDING_COLORS["kulturális"],
            "draw_function": self._draw_cultural_building
        }
        
        # Középület modell
        self.building_models["középület"] = {
            "width": 75,
            "depth": 75,
            "min_height": 70,
            "max_height": 130,
            "color": BUILDING_COLORS["középület"],
            "draw_function": self._draw_public_building
        }
        
    def _create_controls(self):
        """
        Irányítópanel létrehozása
        """
        # Irányítópanel keret
        self.controls_frame = ctk.CTkFrame(self.main_frame)
        self.controls_frame.pack(fill="x", side="bottom", padx=5, pady=5)
        
        # A nagyítás/kicsinyítés csúszka és címke eltávolítva
        
        # Napszak váltó gomb
        self.day_night_btn = ctk.CTkButton(
            self.controls_frame,
            text="Éjszaka",
            command=self._toggle_day_night,
            width=80
        )
        self.day_night_btn.pack(side="right", padx=5, pady=5)
        
        # Forgatás gomb
        self.rotate_btn = ctk.CTkButton(
            self.controls_frame,
            text="Forgatás",
            command=self._toggle_rotation,
            width=80
        )
        self.rotate_btn.pack(side="right", padx=5, pady=5)
        
        # Alaphelyzet gomb
        self.reset_btn = ctk.CTkButton(
            self.controls_frame,
            text="Alaphelyzet",
            command=self._reset_view,
            width=80
        )
        self.reset_btn.pack(side="right", padx=5, pady=5)
        
        # Épület elrendezés újratervezése gomb
        self.relayout_btn = ctk.CTkButton(
            self.controls_frame,
            text="Elrendezés",
            command=self._reset_layout,
            width=80
        )
        self.relayout_btn.pack(side="right", padx=5, pady=5)
    
    def _toggle_day_night(self):
        """
        Nappal/éjszaka váltás
        """
        if self.day_night_cycle == "nappal":
            self.day_night_cycle = "éjszaka"
            self.day_night_btn.configure(text="Nappal")
        else:
            self.day_night_cycle = "nappal"
            self.day_night_btn.configure(text="Éjszaka")
            
        # Biztosítsuk, hogy a canvas teljesen törlésre kerül
        self.city_canvas.delete("all")
        
        # Frissítsük az égbolt gradiensét
        canvas_width = self.city_canvas.winfo_width()
        canvas_height = self.city_canvas.winfo_height()
        self._create_sky_gradient(canvas_width, canvas_height)
        
        # Teljes újrarajzolás a város nézet frissítésével
        self.update_city_view()
    
    def _create_sky_gradient(self, canvas_width, canvas_height):
        """
        Égbolt gradiens létrehozása az aktuális napszaknak megfelelően
        """
        # Új kép létrehozása
        img = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Napszak szerinti színek
        if self.day_night_cycle == "nappal":
            top_color = (135, 206, 235, 255)  # Világoskék
            bottom_color = (255, 255, 255, 255)  # Fehér
        else:
            top_color = (25, 25, 112, 255)  # Sötétkék
            bottom_color = (47, 79, 79, 255)  # Sötétszürke
        
        # Gradiens rajzolása
        for y in range(canvas_height):
            # Kiszámoljuk a színátmenetet a magasság alapján
            r = int(top_color[0] + (bottom_color[0] - top_color[0]) * y / canvas_height)
            g = int(top_color[1] + (bottom_color[1] - top_color[1]) * y / canvas_height)
            b = int(top_color[2] + (bottom_color[2] - top_color[2]) * y / canvas_height)
            a = 255
            
            # Vízszintes vonal rajzolása az adott színnel
            draw.line([(0, y), (canvas_width, y)], fill=(r, g, b, a))
        
        # PIL képet Tkinter képpé alakítjuk
        self.sky_gradient = ImageTk.PhotoImage(img)
        
        return self.sky_gradient
    
    def _on_mouse_down(self, event):
        """
        Egér lenyomás eseménykezelő
        """
        self.is_dragging = True
        self.drag_start_x = event.x
        self.drag_start_y = event.y
        
    def _on_mouse_drag(self, event):
        """
        Egér húzás eseménykezelő - nézet mozgatás
        """
        if self.is_dragging:
            dx = event.x - self.drag_start_x
            dy = event.y - self.drag_start_y
            
            # Nézet eltolása
            self.center_x += dx
            self.center_y += dy
            
            # Új kezdőpont az eltoláshoz
            self.drag_start_x = event.x
            self.drag_start_y = event.y
            
            # Újrarajzolás
            self._redraw_city()
        
    def _on_mouse_up(self, event):
        """
        Egér felengedés eseménykezelő
        """
        self.is_dragging = False
        
    def _toggle_rotation(self):
        """
        Kamera forgatás be/kikapcsolása
        """
        if self.rotation_active:
            self.rotation_active = False
            self.rotate_btn.configure(text="Forgatás")
            if self.rotation_timer:
                self.parent_frame.after_cancel(self.rotation_timer)
                self.rotation_timer = None
        else:
            self.rotation_active = True
            self.rotate_btn.configure(text="Megállít")
            self._start_rotation()
    
    def _start_rotation(self):
        """
        Kamera forgatás indítása
        """
        # Forgatási szög növelése
        self.rotation_angle += 1
        if self.rotation_angle >= 360:
            self.rotation_angle = 0
            
        # Újrarajzolás
        self._redraw_city()
        
        # Újra időzítés, ha még aktív a forgatás
        if self.rotation_active:
            self.rotation_timer = self.parent_frame.after(33, self._start_rotation)
    
    def _reset_view(self):
        """
        Nézet alaphelyzetbe állítása
        """
        # Zoom érték nem változtatható, 1.0 marad
        self.center_x = 0
        self.center_y = 0
        self.rotation_angle = 0
        
        # Forgatás leállítása, ha aktív
        if self.rotation_active:
            self.rotation_active = False
            self.rotate_btn.configure(text="Forgatás")
            if self.rotation_timer:
                self.parent_frame.after_cancel(self.rotation_timer)
                self.rotation_timer = None
                
        self._redraw_city()
    
    def _on_resize(self, event):
        """
        Átméretezés eseménykezelő
        """
        # Csak a méretváltozás befejezése után rajzolunk újra
        if hasattr(self, "_resize_timer"):
            self.city_canvas.after_cancel(self._resize_timer)
            
        self._resize_timer = self.city_canvas.after(200, self._redraw_city)
        
    def _redraw_city(self):
        """
        Város újrarajzolása
        """
        # Töröljük a korábbi rajzot
        self.city_canvas.delete("all")
        
        # Vászon mérete
        canvas_width = self.city_canvas.winfo_width()
        canvas_height = self.city_canvas.winfo_height()
        
        if canvas_width <= 1 or canvas_height <= 1:
            return
            
        # Égbolt gradiens létrehozása és kirajzolása
        sky_gradient = self._create_sky_gradient(canvas_width, canvas_height)
        self.city_canvas.create_image(0, 0, image=sky_gradient, anchor="nw")
        
        # Középpont
        center_x = canvas_width // 2 + self.center_x
        center_y = canvas_height // 2 + self.center_y
        
        # Nap vagy hold rajzolása
        self._draw_sun_or_moon(canvas_width, canvas_height, center_x, center_y)
        
        # Először a talajt rajzoljuk meg
        self._draw_ground(center_x, center_y)
        
        # Utcák rajzolása
        self._draw_streets(center_x, center_y)
        
        # Ha nincs épület, nincs mit rajzolni
        if not self.buildings_3d:
            # Információs üzenet megjelenítése
            self.city_canvas.create_text(
                canvas_width // 2,
                canvas_height // 2,
                text="Nincsenek épületek a városban",
                fill="white",
                font=("Arial", 14)
            )
            return
        
        # Fák helyeinek generálása, ha még nem léteznek
        self._draw_trees_along_streets(center_x, center_y)
        
        # Járművek inicializálása, ha még nincsenek
        vehicle_count = min(14, len(self.buildings_3d) * 2)
        if len(getattr(self, "vehicles", [])) < vehicle_count:
            self._initialize_vehicles(vehicle_count)
        
        # Létrehozunk egy listát az összes kirajzolandó objektumról z-mélység szerint sorba rendezve
        # Ez biztosítja, hogy a távolabbi objektumok kerüljenek alulra, a közelebbiek felülre
        all_objects = []
        
        # Épületek hozzáadása a listához
        for building_id, building in self.buildings_3d.items():
            # Z-mélység számítása (x+y nagyobb érték = távolabb)
            depth = building["x"] + building["y"]
            all_objects.append({
                "type": "building",
                "data": building,
                "depth": depth
            })
        
        # Fák hozzáadása a listához
        if hasattr(self, "tree_locations") and self.tree_locations:
            for tree in self.tree_locations:
                # Z-mélység számítása
                depth = tree["x"] + tree["y"]
                all_objects.append({
                    "type": "tree",
                    "data": tree,
                    "depth": depth
                })
        
        # Járművek hozzáadása a listához
        if hasattr(self, "vehicles") and self.vehicles:
            for vehicle in self.vehicles:
                # Z-mélység számítása
                depth = vehicle["x"] + vehicle["y"]
                all_objects.append({
                    "type": "vehicle",
                    "data": vehicle,
                    "depth": depth
                })
        
        # Objektumok rendezése Z-mélység szerint (távolabbi elöl, közelebbi hátul)
        # Ez az izometrikus nézet miatt van így: a nagyobb x+y érték "távolabb" van
        sorted_objects = sorted(all_objects, key=lambda obj: obj["depth"], reverse=False)
        
        # Objektumok rajzolása a megfelelő sorrendben
        for obj in sorted_objects:
            if obj["type"] == "building":
                self._draw_building(obj["data"], center_x, center_y)
            elif obj["type"] == "tree":
                self._draw_single_tree(obj["data"], center_x, center_y)
            elif obj["type"] == "vehicle":
                self._draw_vehicle(obj["data"], center_x, center_y)
        
        # Fényhatások rajzolása
        if self.day_night_cycle == "éjszaka":
            self._draw_night_lights(center_x, center_y)
        
        # Város neve a képernyő alján
        if hasattr(self.game_engine, 'varos') and self.game_engine.varos:
            city_name = self.game_engine.varos.nev
            population = f"Lakosság: {self.game_engine.varos.lakosok_szama:,} fő"
            satisfaction = f"Elégedettség: {self.game_engine.varos.lakossag_elegedettseg:.1f}%"
            
            # Átlátszó háttér
            name_bg = self.city_canvas.create_rectangle(
                10, canvas_height - 85, 
                270, canvas_height - 10,
                fill="#333333", outline="", stipple="gray50"
            )
            
            # Város neve és adatok
            self.city_canvas.create_text(
                20, canvas_height - 70,
                text=city_name,
                font=("Arial", 16, "bold"),
                fill="white",
                anchor="w"
            )
            
            self.city_canvas.create_text(
                20, canvas_height - 45,
                text=population,
                font=("Arial", 12),
                fill="white",
                anchor="w"
            )
            
            self.city_canvas.create_text(
                20, canvas_height - 25,
                text=satisfaction,
                font=("Arial", 12),
                fill="white",
                anchor="w"
            )
    
    def _draw_ground(self, center_x, center_y):
        """
        Talaj rajzolása világ határral
        """
        # Vászon mérete
        canvas_width = self.city_canvas.winfo_width()
        canvas_height = self.city_canvas.winfo_height()
        
        # Talaj mérete - utcahálózat plusz egy kis margó
        ground_size = 1200 * self.zoom
        
        # Talaj 3D sarokpontjai
        points = []
        for x, y in [
            (-ground_size/2, -ground_size/2),  # Bal alsó
            (ground_size/2, -ground_size/2),   # Jobb alsó
            (ground_size/2, ground_size/2),    # Jobb felső
            (-ground_size/2, ground_size/2)    # Bal felső
        ]:
            points.append(self._project_3d_to_2d(x, y, 0, center_x, center_y))
        
        # Talaj színének beállítása napszak szerint
        if self.day_night_cycle == "nappal":
            ground_color = "#2E4053"  # Sötét aszfalt szín
            ground_outline = "#34495E"
        else:
            ground_color = "#1B2631"  # Éjszakai sötétebb szín
            ground_outline = "#17202A"
        
        # Talaj rajzolása
        self.city_canvas.create_polygon(
            points[0][0], points[0][1],
            points[1][0], points[1][1],
            points[2][0], points[2][1],
            points[3][0], points[3][1],
            fill=ground_color,
            outline=ground_outline
        )
        
        # Világ határa - egy sötétebb szegély a talaj széle körül
        edge_width = 20 * self.zoom
        world_boundary = 1000 * self.zoom / 2  # A város határai
        
        border_points = []
        for x, y in [
            (-world_boundary-edge_width, -world_boundary-edge_width),  # Bal alsó
            (world_boundary+edge_width, -world_boundary-edge_width),   # Jobb alsó
            (world_boundary+edge_width, world_boundary+edge_width),    # Jobb felső
            (-world_boundary-edge_width, world_boundary+edge_width)    # Bal felső
        ]:
            border_points.append(self._project_3d_to_2d(x, y, 0, center_x, center_y))
        
        # Inner points for the border
        inner_points = []
        for x, y in [
            (-world_boundary, -world_boundary),  # Bal alsó
            (world_boundary, -world_boundary),   # Jobb alsó
            (world_boundary, world_boundary),    # Jobb felső
            (-world_boundary, world_boundary)    # Bal felső
        ]:
            inner_points.append(self._project_3d_to_2d(x, y, 0, center_x, center_y))
        
        # Határ vonalak rajzolása
        for i in range(4):
            next_i = (i+1) % 4
            self.city_canvas.create_line(
                self._to_int(inner_points[i][0]), self._to_int(inner_points[i][1]),
                self._to_int(inner_points[next_i][0]), self._to_int(inner_points[next_i][1]),
                fill="#1B2631",  # Sötétebb szín mint a talaj
                width=int(edge_width/2)
            )
    
    def _draw_streets(self, center_x, center_y):
        """
        Utcák rajzolása
        """
        # Vászon mérete
        canvas_width = self.city_canvas.winfo_width()
        canvas_height = self.city_canvas.winfo_height()
        
        # Utcahálózat mérete
        street_size = 1000 * self.zoom
        
        # Utcák száma (sorok és oszlopok)
        streets_count = 7
        
        # Utcák közötti távolság
        street_gap = street_size / (streets_count - 1)
        
        # Utca szélesség
        street_width = int(20 * self.zoom)  # Egész szám szükséges
        
        # Utca színének beállítása napszak szerint
        if self.day_night_cycle == "nappal":
            street_color = "#95A5A6"  # Világos szürke szín
            marker_color = "white"
        else:
            street_color = "#566573"  # Sötétebb szürke éjszaka
            marker_color = "#D5DBDB"  # Halványabb útburkolati jelek
        
        # Vízszintes utcák
        for i in range(streets_count):
            y_pos = -street_size/2 + i * street_gap
            
            # Utca kezdő- és végpontja
            start_point = self._project_3d_to_2d(-street_size/2, y_pos, 1, center_x, center_y)
            end_point = self._project_3d_to_2d(street_size/2, y_pos, 1, center_x, center_y)
            
            # Utca szélessége
            width = max(1, int(street_width / 2))  # Egész szám szükséges
            
            # Utca rajzolása
            self.city_canvas.create_line(
                self._to_int(start_point[0]), self._to_int(start_point[1]),
                self._to_int(end_point[0]), self._to_int(end_point[1]),
                fill=street_color,
                width=width
            )
            
            # Útburkolati jelek
            if i % 2 == 1:  # Csak néhány utcán rajzolunk útburkolati jeleket
                dash_length = int(15 * self.zoom)
                space_length = int(10 * self.zoom)
                
                # Szakaszolt vonal
                self.city_canvas.create_line(
                    self._to_int(start_point[0]), self._to_int(start_point[1]),
                    self._to_int(end_point[0]), self._to_int(end_point[1]),
                    fill=marker_color,
                    width=2,
                    dash=(dash_length, space_length)
                )
        
        # Függőleges utcák
        for i in range(streets_count):
            x_pos = -street_size/2 + i * street_gap
            
            # Utca kezdő- és végpontja
            start_point = self._project_3d_to_2d(x_pos, -street_size/2, 1, center_x, center_y)
            end_point = self._project_3d_to_2d(x_pos, street_size/2, 1, center_x, center_y)
            
            # Utca szélessége
            width = max(1, int(street_width / 2))  # Egész szám szükséges
            
            # Utca rajzolása
            self.city_canvas.create_line(
                self._to_int(start_point[0]), self._to_int(start_point[1]),
                self._to_int(end_point[0]), self._to_int(end_point[1]),
                fill=street_color,
                width=width
            )
            
            # Útburkolati jelek
            if i % 2 == 0:  # Csak néhány utcán rajzolunk útburkolati jeleket
                dash_length = int(15 * self.zoom)
                space_length = int(10 * self.zoom)
                
                # Szakaszolt vonal
                self.city_canvas.create_line(
                    self._to_int(start_point[0]), self._to_int(start_point[1]),
                    self._to_int(end_point[0]), self._to_int(end_point[1]),
                    fill=marker_color,
                    width=2,
                    dash=(dash_length, space_length)
                )
    
    def _draw_decorations(self, center_x, center_y):
        """
        Járművek és egyéb dekorációs elemek rajzolása
        """
        # Csak ha van legalább egy épület, akkor rajzolunk dekorációkat
        if not self.buildings_3d:
            return
        
        # Fák rajzolása
        self._draw_trees_along_streets(center_x, center_y)
        
        # Járművek száma
        vehicle_count = min(14, len(self.buildings_3d) * 2)
        
        # Ha még nincsenek járművek, létrehozzuk őket
        if len(self.vehicles) < vehicle_count:
            self._initialize_vehicles(vehicle_count)
        
        # Járművek rajzolása
        for vehicle in self.vehicles:
            # Pozíció és típus
            x = vehicle["x"]
            y = vehicle["y"]
            is_horizontal = vehicle["horizontal"]
            
            # Autó méretei
            car_length = 20 * self.zoom
            car_width = 10 * self.zoom
            car_height = 8 * self.zoom
            car_color = vehicle["color"]
            
            # Autó pontjai
            points = []
            
            # Autó alap
            if is_horizontal:
                # Vízszintes utcán
                points.append(self._project_3d_to_2d(x - car_length/2, y - car_width/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_length/2, y - car_width/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_length/2, y + car_width/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x - car_length/2, y + car_width/2, 0, center_x, center_y))
                
                # Autó tető
                points.append(self._project_3d_to_2d(x - car_length/3, y - car_width/2, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_length/3, y - car_width/2, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_length/3, y + car_width/2, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x - car_length/3, y + car_width/2, car_height, center_x, center_y))
            else:
                # Függőleges utcán
                points.append(self._project_3d_to_2d(x - car_width/2, y - car_length/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_width/2, y - car_length/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_width/2, y + car_length/2, 0, center_x, center_y))
                points.append(self._project_3d_to_2d(x - car_width/2, y + car_length/2, 0, center_x, center_y))
                
                # Autó tető
                points.append(self._project_3d_to_2d(x - car_width/2, y - car_length/3, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_width/2, y - car_length/3, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x + car_width/2, y + car_length/3, car_height, center_x, center_y))
                points.append(self._project_3d_to_2d(x - car_width/2, y + car_length/3, car_height, center_x, center_y))
            
            # Autó oldalai rajzolása
            # Hátsó
            self.city_canvas.create_polygon(
                self._to_int(points[2][0]), self._to_int(points[2][1]),
                self._to_int(points[3][0]), self._to_int(points[3][1]),
                self._to_int(points[7][0]), self._to_int(points[7][1]),
                self._to_int(points[6][0]), self._to_int(points[6][1]),
                fill=self._darken_color(car_color, 0.7),
                outline="black"
            )
            
            # Bal oldal
            self.city_canvas.create_polygon(
                self._to_int(points[0][0]), self._to_int(points[0][1]),
                self._to_int(points[3][0]), self._to_int(points[3][1]),
                self._to_int(points[7][0]), self._to_int(points[7][1]),
                self._to_int(points[4][0]), self._to_int(points[4][1]),
                fill=self._darken_color(car_color, 0.8),
                outline="black"
            )
            
            # Tető
            self.city_canvas.create_polygon(
                self._to_int(points[4][0]), self._to_int(points[4][1]),
                self._to_int(points[5][0]), self._to_int(points[5][1]),
                self._to_int(points[6][0]), self._to_int(points[6][1]),
                self._to_int(points[7][0]), self._to_int(points[7][1]),
                fill=self._darken_color(car_color, 0.9),
                outline="black"
            )
            
            # Jobb oldal
            self.city_canvas.create_polygon(
                self._to_int(points[1][0]), self._to_int(points[1][1]),
                self._to_int(points[2][0]), self._to_int(points[2][1]),
                self._to_int(points[6][0]), self._to_int(points[6][1]),
                self._to_int(points[5][0]), self._to_int(points[5][1]),
                fill=self._darken_color(car_color, 0.85),
                outline="black"
            )
            
            # Első
            self.city_canvas.create_polygon(
                self._to_int(points[0][0]), self._to_int(points[0][1]),
                self._to_int(points[1][0]), self._to_int(points[1][1]),
                self._to_int(points[5][0]), self._to_int(points[5][1]),
                self._to_int(points[4][0]), self._to_int(points[4][1]),
                fill=car_color,
                outline="black"
            )
            
            # Frissítjük a jármű pozícióját
            self._update_vehicle_position(vehicle)
    
    def _initialize_vehicles(self, count):
        """
        Járművek inicializálása
        """
        # Utcák száma és mérete
        streets_count = 7
        street_size = 1000
        street_gap = street_size / (streets_count - 1)
        world_boundary = street_size / 2
        
        # Jármű színek
        colors = ["#E74C3C", "#3498DB", "#1ABC9C", "#F1C40F", "#9B59B6"]
        
        # Járművek létrehozása
        self.vehicles = []
        for _ in range(count):
            # Véletlen színválasztás
            color = random.choice(colors)
            
            # Véletlenszerűen vagy vízszintes vagy függőleges utca
            is_horizontal = random.choice([True, False])
            
            # Véletlenszerű utca kiválasztása (0 és streets_count-1 között)
            street_idx = random.randint(0, streets_count - 1)
            
            # Véletlenszerű pozíció az utcán belül
            if is_horizontal:
                # Vízszintes utcán - pontosan az utca vonalán
                y = -street_size/2 + street_idx * street_gap  # Pontosan az utca vonalán
                x = random.uniform(-world_boundary, world_boundary)
                speed = random.uniform(1, 3) * (1 if random.random() > 0.5 else -1)
            else:
                # Függőleges utcán - pontosan az utca vonalán
                x = -street_size/2 + street_idx * street_gap  # Pontosan az utca vonalán
                y = random.uniform(-world_boundary, world_boundary)
                speed = random.uniform(1, 3) * (1 if random.random() > 0.5 else -1)
            
            # Jármű adatok tárolása
            self.vehicles.append({
                "x": x,
                "y": y,
                "horizontal": is_horizontal,
                "speed": speed,
                "color": color,
                "street_idx": street_idx  # Megjegyezzük, hogy melyik utcán van
            })
    
    def _update_vehicle_position(self, vehicle):
        """
        Jármű pozíciójának frissítése - FIX hely az utakon
        """
        # Utca mérete és világ határa
        street_size = 1000
        world_boundary = street_size / 2
        
        # Utcák száma
        streets_count = 7
        street_gap = street_size / (streets_count - 1)
        
        # Street index ellenőrzése (minimum 0, maximum streets_count - 1)
        if "street_idx" not in vehicle:
            vehicle["street_idx"] = random.randint(0, streets_count - 1)
        
        street_idx = max(0, min(streets_count - 1, vehicle["street_idx"]))
        
        # Vízszintes vagy függőleges mozgás
        if vehicle["horizontal"]:
            # Vízszintes mozgás - az Y pozíció MINDIG fix az utcán
            vehicle["x"] += vehicle["speed"]
            
            # Ha kilép a képből, visszahelyezzük a másik oldalra
            if vehicle["speed"] > 0 and vehicle["x"] > world_boundary:
                vehicle["x"] = -world_boundary
            elif vehicle["speed"] < 0 and vehicle["x"] < -world_boundary:
                vehicle["x"] = world_boundary
            
            # Y pozíció mindig PONTOSAN az utca vonalán marad
            vehicle["y"] = -street_size/2 + street_idx * street_gap
            
        else:
            # Függőleges mozgás - az X pozíció MINDIG fix az utcán
            vehicle["y"] += vehicle["speed"]
            
            # Ha kilép a képből, visszahelyezzük a másik oldalra
            if vehicle["speed"] > 0 and vehicle["y"] > world_boundary:
                vehicle["y"] = -world_boundary
            elif vehicle["speed"] < 0 and vehicle["y"] < -world_boundary:
                vehicle["y"] = world_boundary
            
            # X pozíció mindig PONTOSAN az utca vonalán marad
            vehicle["x"] = -street_size/2 + street_idx * street_gap
            
        # Mentjük a street_idx-et, hogy ne változzon a következő frissítéskor
        vehicle["street_idx"] = street_idx
    
    def _draw_trees_along_streets(self, center_x, center_y):
        """
        Fák rajzolása az utcák mentén - csak generálja a pozíciókat, ha még nem léteznek
        """
        # Generáljuk a fa helyeket, ha még nem léteznek
        if not hasattr(self, "tree_locations") or not self.tree_locations:
            self._generate_tree_locations()
        
        # NE rajzoljuk ki a fákat egyesével itt, ezeket majd a _redraw_city kezeli
        # a megfelelő z-rendering sorrendben
        
        # Ne rajzoljunk parkot
        # self._draw_central_park(center_x, center_y)
    
    def _draw_sun_or_moon(self, canvas_width, canvas_height, center_x, center_y):
        """
        Nap vagy hold rajzolása az égboltra
        """
        if self.day_night_cycle == "nappal":
            # Nap
            sun_x = canvas_width * 0.8
            sun_y = canvas_height * 0.2
            sun_radius = 30
            
            self.city_canvas.create_oval(
                sun_x - sun_radius, sun_y - sun_radius,
                sun_x + sun_radius, sun_y + sun_radius,
                fill="#FFD700",  # Arany
                outline="#FFA500"  # Narancs
            )
            
            # Napsugarak
            for i in range(12):
                angle = i * 30
                rad = math.radians(angle)
                x1 = sun_x + math.cos(rad) * sun_radius
                y1 = sun_y + math.sin(rad) * sun_radius
                x2 = sun_x + math.cos(rad) * (sun_radius + 15)
                y2 = sun_y + math.sin(rad) * (sun_radius + 15)
                
                self.city_canvas.create_line(
                    x1, y1, x2, y2,
                    fill="#FFD700",
                    width=2
                )
        else:
            # Hold
            moon_x = canvas_width * 0.2
            moon_y = canvas_height * 0.2
            moon_radius = 25
            
            # Hold
            self.city_canvas.create_oval(
                moon_x - moon_radius, moon_y - moon_radius,
                moon_x + moon_radius, moon_y + moon_radius,
                fill="#F5F5F5",  # Fehér
                outline="#DCDCDC"  # Világosszürke
            )
            
            # Kráterek a holdon
            for _ in range(5):
                crater_x = moon_x + random.uniform(-moon_radius * 0.7, moon_radius * 0.7)
                crater_y = moon_y + random.uniform(-moon_radius * 0.7, moon_radius * 0.7)
                crater_radius = random.uniform(2, 5)
                
                self.city_canvas.create_oval(
                    crater_x - crater_radius, crater_y - crater_radius,
                    crater_x + crater_radius, crater_y + crater_radius,
                    fill="#DCDCDC",  # Világosszürke
                    outline=""
                )
            
            # Csillagok
            for _ in range(50):
                star_x = random.randint(0, int(canvas_width))
                star_y = random.randint(0, int(canvas_height * 0.5))
                star_size = random.uniform(1, 3)
                
                # Véletlenszerű fényerő
                brightness = random.uniform(0.7, 1.0)
                color_value = int(255 * brightness)
                star_color = f"#{color_value:02X}{color_value:02X}{color_value:02X}"
                
                self.city_canvas.create_oval(
                    star_x - star_size, star_y - star_size,
                    star_x + star_size, star_y + star_size,
                    fill=star_color,
                    outline=""
                )
    
    def _draw_night_lights(self, center_x, center_y):
        """
        Éjszakai fények rajzolása
        """
        # Épületek ablakfényei
        for building in self.buildings_3d.values():
            x = building["x"]
            y = building["y"]
            width = building["width"]
            depth = building["depth"]
            height = building["height"]
            
            # Épület típusától függő ablakszám
            if building["type"] in ["lakóház", "kereskedelmi", "oktatási", "egészségügyi"]:
                # Több ablak
                rows = 5
                columns = 3
            else:
                # Kevesebb ablak
                rows = 3
                columns = 2
                
            # Ablakok véletlenszerű megvilágítása
            for row in range(rows):
                for col in range(columns):
                    # Csak az ablakok 70%-a van kivilágítva
                    if random.random() > 0.3:
                        # Ablak pozíciója
                        wx = x + width * (col + 1) / (columns + 1) - width / (columns * 2) / 2
                        wy = y - width / (columns * 2) / 4  # Kicsit kilóg az épület síkjából
                        wz = height * (row + 1) / (rows + 1) - height / (rows * 2) / 2
                        
                        # Ablak pontjai
                        w_points = []
                        w_width = width / (columns * 2)
                        w_height = height / (rows * 2)
                        
                        w_points.append(self._project_3d_to_2d(wx, wy, wz, center_x, center_y))
                        w_points.append(self._project_3d_to_2d(wx + w_width, wy, wz, center_x, center_y))
                        w_points.append(self._project_3d_to_2d(wx + w_width, wy, wz + w_height, center_x, center_y))
                        w_points.append(self._project_3d_to_2d(wx, wy, wz + w_height, center_x, center_y))
                        
                        # Fényes ablak rajzolása
                        window_color = "#FFEB3B"  # Sárga fény
                        
                        self.city_canvas.create_polygon(
                            self._to_int(w_points[0][0]), self._to_int(w_points[0][1]),
                            self._to_int(w_points[1][0]), self._to_int(w_points[1][1]),
                            self._to_int(w_points[2][0]), self._to_int(w_points[2][1]),
                            self._to_int(w_points[3][0]), self._to_int(w_points[3][1]),
                            fill=window_color,
                            outline="black"
                        )
        
        # Utcai lámpák a kereszteződésekben
        street_size = 1000 * self.zoom
        streets_count = 7
        street_gap = street_size / (streets_count - 1)
        
        for i in range(streets_count):
            for j in range(streets_count):
                # Kereszteződés pozíciója
                x = -street_size/2 + i * street_gap
                y = -street_size/2 + j * street_gap
                
                # Lámpaoszlop
                base_point = self._project_3d_to_2d(x, y, 0, center_x, center_y)
                top_point = self._project_3d_to_2d(x, y, 30 * self.zoom, center_x, center_y)
                
                self.city_canvas.create_line(
                    self._to_int(base_point[0]), self._to_int(base_point[1]),
                    self._to_int(top_point[0]), self._to_int(top_point[1]),
                    fill="#A0A0A0",
                    width=2
                )
                
                # Lámpa fénye
                light_radius = 8 * self.zoom
                
                self.city_canvas.create_oval(
                    self._to_int(top_point[0] - light_radius), 
                    self._to_int(top_point[1] - light_radius),
                    self._to_int(top_point[0] + light_radius), 
                    self._to_int(top_point[1] + light_radius),
                    fill="#FFFF00",  # Sárga
                    outline="#FFD700"  # Arany
                )
                
                # Fény sugárzása (háromszög alakú fénykúp lefelé)
                light_cone_width = 30 * self.zoom
                light_cone_height = 20 * self.zoom
                
                cone_points = []
                cone_points.append((top_point[0], top_point[1]))
                cone_points.append((top_point[0] - light_cone_width / 2, top_point[1] + light_cone_height))
                cone_points.append((top_point[0] + light_cone_width / 2, top_point[1] + light_cone_height))
                
                self.city_canvas.create_polygon(
                    self._to_int(cone_points[0][0]), self._to_int(cone_points[0][1]),
                    self._to_int(cone_points[1][0]), self._to_int(cone_points[1][1]),
                    self._to_int(cone_points[2][0]), self._to_int(cone_points[2][1]),
                    fill="#FFFF00",
                    stipple="gray25"  # Átlátszó mintázat
                )
    
    def _draw_building(self, building, center_x, center_y):
        """
        Épület rajzolása
        
        :param building: Épület adatok
        :param center_x: X középpont
        :param center_y: Y középpont
        """
        # Épület típusa
        building_type = building["type"]
        
        # Speciális rajzolási funkció keresése
        model = self.building_models.get(building_type, {})
        draw_function = model.get("draw_function")
        
        # Ha van speciális rajzolási funkció az épülettípusnak, használjuk azt
        if draw_function:
            draw_function(building, center_x, center_y)
            return
            
        # Egyébként az alap épületrajzolást használjuk
        self._draw_basic_building(building, center_x, center_y)
        
    def _draw_basic_building(self, building, center_x, center_y):
        """
        Alapvető épület rajzolása
        
        :param building: Épület adatok
        :param center_x: X középpont
        :param center_y: Y középpont
        """
        # Épület pozíció
        x = building["x"]
        y = building["y"]
        z = 0  # Alap magasság (föld)
        
        # Épület méretei
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        
        # Épület színe
        color = building["color"]
        
        # 3D koordináták kiszámítása a kocka 8 sarkához
        # Alappont (bal alsó első sarok)
        points = []
        
        # Föld szintű pontok
        points.append(self._project_3d_to_2d(x, y, z, center_x, center_y))  # Bal alsó első
        points.append(self._project_3d_to_2d(x + width, y, z, center_x, center_y))  # Jobb alsó első
        points.append(self._project_3d_to_2d(x + width, y + depth, z, center_x, center_y))  # Jobb alsó hátsó
        points.append(self._project_3d_to_2d(x, y + depth, z, center_x, center_y))  # Bal alsó hátsó
        
        # Tető szintű pontok
        points.append(self._project_3d_to_2d(x, y, z + height, center_x, center_y))  # Bal felső első
        points.append(self._project_3d_to_2d(x + width, y, z + height, center_x, center_y))  # Jobb felső első
        points.append(self._project_3d_to_2d(x + width, y + depth, z + height, center_x, center_y))  # Jobb felső hátsó
        points.append(self._project_3d_to_2d(x, y + depth, z + height, center_x, center_y))  # Bal felső hátsó
        
        # Látható oldalak rajzolása
        # Először a háttérben lévő oldalak, majd a előtérben lévők
        
        # Hátsó fal
        self.city_canvas.create_polygon(
            points[2][0], points[2][1],
            points[3][0], points[3][1],
            points[7][0], points[7][1],
            points[6][0], points[6][1],
            fill=self._darken_color(color, 0.7),
            outline="black"
        )
        
        # Bal oldali fal
        self.city_canvas.create_polygon(
            points[0][0], points[0][1],
            points[3][0], points[3][1],
            points[7][0], points[7][1],
            points[4][0], points[4][1],
            fill=self._darken_color(color, 0.8),
            outline="black"
        )
        
        # Tető
        self.city_canvas.create_polygon(
            points[4][0], points[4][1],
            points[5][0], points[5][1],
            points[6][0], points[6][1],
            points[7][0], points[7][1],
            fill=self._darken_color(color, 0.9),
            outline="black"
        )
        
        # Jobb oldali fal
        self.city_canvas.create_polygon(
            points[1][0], points[1][1],
            points[2][0], points[2][1],
            points[6][0], points[6][1],
            points[5][0], points[5][1],
            fill=self._darken_color(color, 0.85),
            outline="black"
        )
        
        # Első fal
        self.city_canvas.create_polygon(
            points[0][0], points[0][1],
            points[1][0], points[1][1],
            points[5][0], points[5][1],
            points[4][0], points[4][1],
            fill=color,
            outline="black"
        )
        
        # Épület neve az első fal közepén
        name_x = (points[0][0] + points[1][0] + points[5][0] + points[4][0]) / 4
        name_y = (points[0][1] + points[1][1] + points[5][1] + points[4][1]) / 4
        
        self.city_canvas.create_text(
            name_x, name_y,
            text=building["name"],
            fill="white",
            font=("Arial", int(10 * self.zoom))
        )
    
    def _draw_residential_building(self, building, center_x, center_y):
        """
        Lakóház rajzolása - toronyház stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Alapzat
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height,
            "color": color,
            "name": building["name"]
        }, center_x, center_y)
        
        # Ablakok rajzolása
        self._draw_windows(x, y, z, width, depth, height, center_x, center_y)
    
    def _draw_commercial_building(self, building, center_x, center_y):
        """
        Kereskedelmi épület rajzolása - üzletközpont stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Épület alapformája
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height * 0.7,  # Alacsonyabb alaprész
            "color": color,
            "name": ""  # Nem írjuk ki a nevet
        }, center_x, center_y)
        
        # Felső, kisebb rész
        top_width = width * 0.7
        top_depth = depth * 0.7
        top_x = x + (width - top_width) / 2
        top_y = y + (depth - top_depth) / 2
        
        self._draw_basic_building({
            "x": top_x,
            "y": top_y,
            "width": top_width,
            "depth": top_depth,
            "height": height * 0.3,  # Kisebb magasság
            "color": self._darken_color(color, 1.1),  # Világosabb szín
            "name": building["name"]  # Itt írjuk ki a nevet
        }, center_x, center_y)
        
        # Kirakatüvegek
        self._draw_storefronts(x, y, z, width, depth, height * 0.3, center_x, center_y)
    
    def _draw_industrial_building(self, building, center_x, center_y):
        """
        Ipari épület rajzolása - gyár stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Fő épülettest
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height * 0.6,
            "color": color,
            "name": building["name"]
        }, center_x, center_y)
        
        # Gyárkémény
        chimney_width = width * 0.15
        chimney_depth = depth * 0.15
        chimney_x = x + width * 0.7
        chimney_y = y + depth * 0.3
        chimney_height = height * 1.5
        
        self._draw_basic_building({
            "x": chimney_x,
            "y": chimney_y,
            "width": chimney_width,
            "depth": chimney_depth,
            "height": chimney_height,
            "color": self._darken_color(color, 0.7),
            "name": ""
        }, center_x, center_y)
    
    def _draw_educational_building(self, building, center_x, center_y):
        """
        Oktatási épület rajzolása - iskola stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Fő épület
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height,
            "color": color,
            "name": building["name"]
        }, center_x, center_y)
        
        # Lépcső az épület előtt
        stairs_width = width * 0.4
        stairs_depth = depth * 0.2
        stairs_x = x + (width - stairs_width) / 2
        stairs_y = y - stairs_depth
        stairs_height = height * 0.1
        
        self._draw_basic_building({
            "x": stairs_x,
            "y": stairs_y,
            "width": stairs_width,
            "depth": stairs_depth,
            "height": stairs_height,
            "color": self._darken_color(color, 0.8),
            "name": ""
        }, center_x, center_y)
        
        # Ablakok
        self._draw_windows(x, y, z, width, depth, height, center_x, center_y, rows=3, columns=5)
    
    def _draw_healthcare_building(self, building, center_x, center_y):
        """
        Egészségügyi épület rajzolása - kórház stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Fő épület
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height,
            "color": color,
            "name": building["name"]
        }, center_x, center_y)
        
        # Kórház kereszt a tetőn
        cross_size = min(width, depth) * 0.3
        cross_x = x + width / 2 - cross_size / 2
        cross_y = y + depth / 2 - cross_size / 2
        cross_z = height
        
        # Kereszt vízszintes része
        cross_h = {
            "x": cross_x,
            "y": cross_y + cross_size / 3,
            "width": cross_size,
            "depth": cross_size / 3,
            "height": cross_size / 6,
            "color": "#FFFFFF",  # Fehér
            "name": ""
        }
        self._draw_basic_building(cross_h, center_x, center_y)
        
        # Kereszt függőleges része
        cross_v = {
            "x": cross_x + cross_size / 3,
            "y": cross_y,
            "width": cross_size / 3,
            "depth": cross_size,
            "height": cross_size / 6,
            "color": "#FFFFFF",  # Fehér
            "name": ""
        }
        self._draw_basic_building(cross_v, center_x, center_y)
        
        # Ablakok
        self._draw_windows(x, y, z, width, depth, height, center_x, center_y, rows=4, columns=6)
    
    def _draw_cultural_building(self, building, center_x, center_y):
        """
        Kulturális épület rajzolása - színház vagy múzeum stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Alapépület
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height * 0.7,  # Alacsonyabb alap
            "color": color,
            "name": ""
        }, center_x, center_y)
        
        # Kupola a tetőn
        dome_size = min(width, depth) * 0.6
        dome_x = x + (width - dome_size) / 2
        dome_y = y + (depth - dome_size) / 2
        
        # Kupola alapja (kocka)
        dome_base = {
            "x": dome_x,
            "y": dome_y,
            "width": dome_size,
            "depth": dome_size,
            "height": height * 0.2,
            "color": self._darken_color(color, 1.1),
            "name": building["name"]
        }
        self._draw_basic_building(dome_base, center_x, center_y)
        
        # Kupola teteje (egyszerűsített)
        dome_center_x = dome_x + dome_size / 2
        dome_center_y = dome_y + dome_size / 2
        dome_center_z = height * 0.9
        dome_radius = dome_size / 2
        
        # Kupola pontok
        dome_points = []
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            px = dome_center_x + math.cos(rad) * dome_radius
            py = dome_center_y + math.sin(rad) * dome_radius
            dome_points.append(self._project_3d_to_2d(px, py, dome_center_z, center_x, center_y))
        
        dome_top = self._project_3d_to_2d(dome_center_x, dome_center_y, dome_center_z + dome_radius * 0.5, center_x, center_y)
        
        # Kupola rajzolása
        for i in range(len(dome_points)):
            self.city_canvas.create_polygon(
                dome_points[i][0], dome_points[i][1],
                dome_points[(i+1) % len(dome_points)][0], dome_points[(i+1) % len(dome_points)][1],
                dome_top[0], dome_top[1],
                fill=self._darken_color(color, 0.9 + i * 0.05),
                outline="black"
            )
    
    def _draw_public_building(self, building, center_x, center_y):
        """
        Középület rajzolása - városháza stílusú
        """
        # Épület pozíció és méret
        x = building["x"]
        y = building["y"]
        z = 0
        width = building["width"]
        depth = building["depth"]
        height = building["height"]
        color = building["color"]
        
        # Alap épület
        self._draw_basic_building({
            "x": x,
            "y": y,
            "width": width,
            "depth": depth,
            "height": height * 0.7,
            "color": color,
            "name": building["name"]
        }, center_x, center_y)
        
        # Oszlopok az épület frontján
        column_width = width / 10
        column_count = 5
        column_spacing = (width - column_count * column_width) / (column_count + 1)
        column_height = height * 0.7
        
        for i in range(column_count):
            column_x = x + column_spacing + i * (column_width + column_spacing)
            column_y = y - column_width / 2  # Kicsit kilóg a főépület elé
            
            self._draw_basic_building({
                "x": column_x,
                "y": column_y,
                "width": column_width,
                "depth": column_width,
                "height": column_height,
                "color": "#FFFFFF",  # Fehér oszlopok
                "name": ""
            }, center_x, center_y)
        
        # Torony az épület tetején
        tower_width = width * 0.2
        tower_depth = depth * 0.2
        tower_x = x + (width - tower_width) / 2
        tower_y = y + (depth - tower_depth) / 2
        tower_height = height * 0.5
        
        self._draw_basic_building({
            "x": tower_x,
            "y": tower_y,
            "width": tower_width,
            "depth": tower_depth,
            "height": tower_height,
            "color": self._darken_color(color, 0.9),
            "name": ""
        }, center_x, center_y)
        
    def _draw_windows(self, x, y, z, width, depth, height, center_x, center_y, rows=4, columns=3):
        """
        Ablakok rajzolása egy épületen
        """
        # Ablak mérete
        window_width = width / (columns * 2)
        window_height = height / (rows * 2)
        window_color = "#87CEFA"  # Világoskék, üvegszerű
        
        # Első oldal ablakai
        for row in range(rows):
            for col in range(columns):
                # Ablak pozíciója
                wx = x + width * (col + 1) / (columns + 1) - window_width / 2
                wy = y - window_width / 4  # Kicsit kilóg az épület síkjából
                wz = z + height * (row + 1) / (rows + 1) - window_height / 2
                
                # Ablak pontjai
                w_points = []
                w_points.append(self._project_3d_to_2d(wx, wy, wz, center_x, center_y))
                w_points.append(self._project_3d_to_2d(wx + window_width, wy, wz, center_x, center_y))
                w_points.append(self._project_3d_to_2d(wx + window_width, wy, wz + window_height, center_x, center_y))
                w_points.append(self._project_3d_to_2d(wx, wy, wz + window_height, center_x, center_y))
                
                # Ablak rajzolása
                self.city_canvas.create_polygon(
                    w_points[0][0], w_points[0][1],
                    w_points[1][0], w_points[1][1],
                    w_points[2][0], w_points[2][1],
                    w_points[3][0], w_points[3][1],
                    fill=window_color,
                    outline="black"
                )
    
    def _draw_storefronts(self, x, y, z, width, depth, height, center_x, center_y):
        """
        Kirakatüvegek rajzolása a kereskedelmi épületeken
        """
        # Kirakat mérete
        storefront_height = height * 0.7
        storefront_color = "#B3E5FC"  # Világoskék, üvegszerű
        
        # Első oldal kirakata
        sx1 = x + width * 0.1
        sx2 = x + width * 0.9
        sy = y - 1  # Kicsit kilóg az épület síkjából
        sz1 = z
        sz2 = z + storefront_height
        
        # Kirakat pontjai
        s_points = []
        s_points.append(self._project_3d_to_2d(sx1, sy, sz1, center_x, center_y))
        s_points.append(self._project_3d_to_2d(sx2, sy, sz1, center_x, center_y))
        s_points.append(self._project_3d_to_2d(sx2, sy, sz2, center_x, center_y))
        s_points.append(self._project_3d_to_2d(sx1, sy, sz2, center_x, center_y))
        
        # Kirakat rajzolása
        self.city_canvas.create_polygon(
            s_points[0][0], s_points[0][1],
            s_points[1][0], s_points[1][1],
            s_points[2][0], s_points[2][1],
            s_points[3][0], s_points[3][1],
            fill=storefront_color,
            outline="black"
        )
    
    def _project_3d_to_2d(self, x, y, z, center_x, center_y):
        """
        3D pont vetítése 2D-be, figyelembe véve a forgatást
        """
        # Fix zoom faktor alkalmazása a 3D koordinátákra
        # Mindig 1.0 értéket használunk
        scaled_x = x * self.zoom
        scaled_y = y * self.zoom
        scaled_z = z * self.zoom
        
        # Forgatás alkalmazása
        if self.rotation_angle != 0:
            angle_rad = math.radians(self.rotation_angle)
            old_x = scaled_x
            old_y = scaled_y
            scaled_x = old_x * math.cos(angle_rad) - old_y * math.sin(angle_rad)
            scaled_y = old_x * math.sin(angle_rad) + old_y * math.cos(angle_rad)
        
        # Izometrikus vetítés
        iso_x = (scaled_x - scaled_y) * math.cos(math.radians(30))
        iso_y = (scaled_x + scaled_y) * math.sin(math.radians(30)) - scaled_z
        
        # Eltolás a képernyő középpontjához
        return center_x + iso_x, center_y + iso_y
    
    def _darken_color(self, hex_color, factor=0.7):
        """
        Szín sötétítése egy adott faktorral
        
        :param hex_color: Hexadecimális színkód (#RRGGBB)
        :param factor: Sötétítési faktor (0-1 között)
        :return: Sötétített szín
        """
        # Konvertálás RGB-re
        r = int(hex_color[1:3], 16)
        g = int(hex_color[3:5], 16)
        b = int(hex_color[5:7], 16)
        
        # Sötétítés
        r = int(r * factor)
        g = int(g * factor)
        b = int(b * factor)
        
        # Korlátozzuk az értékeket 0-255 között
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))
        
        # Vissza hexadecimálisra
        return f"#{r:02x}{g:02x}{b:02x}"
    
    # Segédfüggvény float értékek egész számokká alakításához
    def _to_int(self, value):
        """
        Float érték egész számmá konvertálása (tkinter Canvas számára)
        """
        return int(round(value))
        
    def update_city_view(self):
        """
        Város nézet frissítése a játékmotor adatai alapján
        """
        # Épületek lekérése
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            return
            
        # Épületek lekérése
        buildings = list(self.game_engine.varos.epuletek.values())
        
        if not buildings:
            self._redraw_city()
            return
            
        # Először ellenőrizzük, hogy új épületek jöttek-e létre
        new_buildings = False
        for building in buildings:
            building_id = getattr(building, 'azonosito', None)
            if building_id is None or building_id not in self.buildings_3d:
                new_buildings = True
                break
                
        # Ha nincs új épület, csak rajzoljuk újra őket
        if not new_buildings:
            self._redraw_city()
            return
        
        # Város területének mérete (a canvas mérete alapján)
        city_width = self.city_canvas.winfo_width() or 800
        city_height = self.city_canvas.winfo_height() or 600
        
        # Maximum épületek száma a szélességben és magasságban (6x6 = 36 négyzet)
        max_buildings_x = 6
        max_buildings_y = 6
        
        # Rácshálózat mérete
        grid_size_x = city_width / max_buildings_x
        grid_size_y = city_height / max_buildings_y
        
        # Raszter létrehozása az épületek elhelyezéséhez - inicializáljuk üresként
        grid = [[False for _ in range(max_buildings_y)] for _ in range(max_buildings_x)]
        
        # Töröljük a korábbi fix pozíciókat, ha új elrendezést kérünk
        if new_buildings and hasattr(self, 'fixed_buildings_reset') and self.fixed_buildings_reset:
            self.fixed_buildings = {}
            self.fixed_buildings_reset = False
        
        # Először a korábban már elhelyezett épületeket jelöljük a gridon
        for i, building in enumerate(buildings):
            building_id = getattr(building, 'azonosito', i)
            
            # Ha már volt elhelyezve korábban
            if building_id in self.fixed_buildings:
                grid_x, grid_y = self.fixed_buildings[building_id]
                
                # Ha a grid koordináták érvényesek
                if 0 <= grid_x < max_buildings_x and 0 <= grid_y < max_buildings_y:
                    grid[grid_x][grid_y] = True
        
        # Épületek feldolgozása
        for i, building in enumerate(buildings):
            building_id = getattr(building, 'azonosito', i)
            building_type = getattr(building, 'tipus', 'lakóház').lower()
            
            # Épület modell meghatározása
            model = self.building_models.get(building_type, {
                "width": 50,
                "depth": 50,
                "min_height": 40,
                "max_height": 100,
                "color": DEFAULT_BUILDING_COLOR
            })
            
            # Épület pozíció keresése
            if building_id in self.fixed_buildings:
                # Ha már van fix pozíciója, használjuk azt
                grid_x, grid_y = self.fixed_buildings[building_id]
            else:
                # Egyébként keresünk egy szabad helyet - szisztematikusan végigmegyünk a gridon
                placed = False
                for test_y in range(max_buildings_y):
                    for test_x in range(max_buildings_x):
                        if not grid[test_x][test_y]:
                            grid_x, grid_y = test_x, test_y
                            grid[test_x][test_y] = True  # Foglaltnak jelöljük
                            placed = True
                            
                            # Rögzítjük a pozíciót a következő frissítésekhez
                            self.fixed_buildings[building_id] = (grid_x, grid_y)
                            break
                    if placed:
                        break
                
                # Ha nem sikerült elhelyezni (minden hely foglalt), keresünk egy új helyet a már foglaltak között
                if not placed:
                    # Egyszerűen veszünk egy véletlenszerű helyet, ha minden foglalt
                    import random
                    grid_x = random.randint(0, max_buildings_x - 1)
                    grid_y = random.randint(0, max_buildings_y - 1)
                    self.fixed_buildings[building_id] = (grid_x, grid_y)
                    # Megjegyzés: itt már nem jelöljük a gridet, mert újrafelhasználjuk
            
            # Alapterület alapján határozzuk meg a magasságot (nagyobb alapterület = magasabb épület)
            min_height = model["min_height"]
            max_height = model["max_height"]
            alapterulet = getattr(building, 'alapterulet', 100)
            
            # Normalizáljuk az alapterületet 50-500 között
            normalized_area = max(50, min(500, alapterulet))
            
            # Magasság számítás az alapterület alapján
            height_factor = (normalized_area - 50) / 450  # 0-1 közötti érték
            height = min_height + height_factor * (max_height - min_height)
            
            # Épület neve
            building_name = getattr(building, 'nev', f"Épület_{building_id}")
            
            # Színváltoztatás az épület állapota alapján
            allapot = getattr(building, 'allapot', 3)
            # Ha szöveges az állapot, konvertáljuk számmá
            if isinstance(allapot, str):
                from ..config import EPULET_ALLAPOT
                allapot = EPULET_ALLAPOT.get(allapot.lower(), 3)
            
            # Állapot faktor (1-5)
            if isinstance(allapot, (int, float)):
                allapot_factor = max(0.5, min(1.2, allapot / 5 + 0.5))
            else:
                allapot_factor = 1.0
                
            # Alapszín a típus alapján
            color = model["color"]
            
            # Állapot szerint módosítjuk a színt
            if allapot_factor < 0.7:  # Rossz állapot
                # Szürkésebb, sötétebb
                color = self._darken_color(color, 0.7)
            elif allapot_factor > 1.0:  # Kiváló állapot
                # Világosabb, élénkebb szín
                r = int(color[1:3], 16)
                g = int(color[3:5], 16)
                b = int(color[5:7], 16)
                
                # Érték növelése, de max 255
                boost = 30
                r = min(255, r + boost)
                g = min(255, g + boost)
                b = min(255, b + boost)
                
                color = f"#{r:02x}{g:02x}{b:02x}"
            
            # Utcahálózat mérete és utcák közötti távolság
            street_size = 1000 * self.zoom
            streets_count = 7  # Egyezik a _draw_streets metódusban használt értékkel
            street_gap = street_size / (streets_count - 1)
            
            # Kiszámoljuk a Grid (0,0) pozícióját a 3D térben (bal felső sarok)
            grid_origin_x = -street_size / 2 + street_gap
            grid_origin_y = -street_size / 2 + street_gap
            
            # Az épületet a grid cella közepére helyezzük
            x_pos = grid_origin_x + grid_x * street_gap
            y_pos = grid_origin_y + grid_y * street_gap
            
            # Épületadatok tárolása vagy frissítése
            self.buildings_3d[building_id] = {
                "id": building_id,
                "name": building_name,
                "type": building_type,
                "x": x_pos,
                "y": y_pos,
                "width": model["width"],
                "depth": model["depth"],
                "height": height,
                "color": color
            }
        
        # Fák pozíciójának újragenerálása, ha még nem létezik
        if not self.tree_locations:
            self._generate_tree_locations()
        
        # Újrarajzolás
        self._redraw_city()
        
        # Időzített újrarajzolás (animáció)
        self.animation_id = self.city_canvas.after(50, self._animate_vehicles)

    def _animate_vehicles(self):
        """
        Járművek animálása
        """
        # Járművek pozícióinak frissítése
        for vehicle in self.vehicles:
            self._update_vehicle_position(vehicle)
        
        # Újrarajzolás
        self._redraw_city()
        
        # Következő animációs frame ütemezése
        self.animation_id = self.city_canvas.after(50, self._animate_vehicles)

    def _generate_tree_locations(self):
        """
        Fák pozícióinak generálása az utcák mentén
        """
        # Utcák száma és méretei
        streets_count = 7
        street_size = 1000
        street_gap = street_size / (streets_count - 1)
        
        # Világ határa - kicsit kisebb mint az utcahálózat a biztonság kedvéért
        world_boundary = street_size / 2 - 50
        
        # Üres lista a fáknak
        self.tree_locations = []
        
        # Kereszteződések pozíciói - ezeket elkerüljük
        intersections = []
        for i in range(streets_count):
            for j in range(streets_count):
                x = -street_size/2 + i * street_gap
                y = -street_size/2 + j * street_gap
                intersections.append((x, y))
        
        # Utcák pozíciói - ezek körül bizonyos távolságot tartunk
        street_positions = []
        for i in range(streets_count):
            # Vízszintes utcák
            y = -street_size/2 + i * street_gap
            street_positions.append(("h", y))
            
            # Függőleges utcák
            x = -street_size/2 + i * street_gap
            street_positions.append(("v", x))
        
        # ----- UTCÁK MENTI FÁK -----
        # Fix offset az utcától
        offset_min = 40
        offset_max = 55
        
        # Fák elhelyezése az utcák mentén sűrűbben
        for street_type, street_pos in street_positions:
            # Több pont az utcák mentén
            points_count = 14  # Növeljük a fák sűrűségét
            
            if street_type == "h":  # Vízszintes utca
                for j in range(points_count):
                    # Biztosan a határon belül maradunk, de véletlenszerűbb pozícióval
                    x_pos = -world_boundary + j * (2 * world_boundary / (points_count - 1))
                    x_pos += random.uniform(-20, 20)  # Véletlenszerűség hozzáadása
                    
                    # Elkerüljük a kereszteződéseket
                    too_close = False
                    for ix, iy in intersections:
                        if abs(x_pos - ix) < 60 and abs(street_pos - iy) < 60:  # Csökkentett távolság
                            too_close = True
                            break
                    
                    if too_close:
                        continue
                    
                    # Véletlenszerű offset alkalmazása
                    offset = random.uniform(offset_min, offset_max)
                    
                    # Fa az utca egyik oldalán
                    if random.random() < 0.9:  # 90% eséllyel helyezünk el fát
                        if abs(x_pos) < world_boundary and abs(street_pos + offset) < world_boundary:
                            self._add_tree_with_variations(x_pos, street_pos + offset)
                    
                    # Fa az utca másik oldalán
                    if random.random() < 0.9:  # 90% eséllyel helyezünk el fát
                        if abs(x_pos) < world_boundary and abs(street_pos - offset) < world_boundary:
                            self._add_tree_with_variations(x_pos, street_pos - offset)
            
            else:  # Függőleges utca
                for j in range(points_count):
                    # Biztosan a határon belül maradunk, véletlenszerűbb pozícióval
                    y_pos = -world_boundary + j * (2 * world_boundary / (points_count - 1))
                    y_pos += random.uniform(-20, 20)  # Véletlenszerűség hozzáadása
                    
                    # Elkerüljük a kereszteződéseket
                    too_close = False
                    for ix, iy in intersections:
                        if abs(street_pos - ix) < 60 and abs(y_pos - iy) < 60:  # Csökkentett távolság
                            too_close = True
                            break
                    
                    if too_close:
                        continue
                    
                    # Véletlenszerű offset alkalmazása
                    offset = random.uniform(offset_min, offset_max)
                    
                    # Fa az utca egyik oldalán
                    if random.random() < 0.7:  # 70% eséllyel helyezünk el fát - ritkítás
                        if abs(street_pos + offset) < world_boundary and abs(y_pos) < world_boundary:
                            self._add_tree_with_variations(street_pos + offset, y_pos)
                    
                    # Fa az utca másik oldalán
                    if random.random() < 0.7:  # 70% eséllyel helyezünk el fát - ritkítás
                        if abs(street_pos - offset) < world_boundary and abs(y_pos) < world_boundary:
                            self._add_tree_with_variations(street_pos - offset, y_pos)
        
        # Kiszűrjük az épületekkel ütköző fákat és határon kívüli fákat
        self.tree_locations = [tree for tree in self.tree_locations 
                              if not self._tree_conflicts_with_building(tree) and
                              abs(tree["x"]) < world_boundary and
                              abs(tree["y"]) < world_boundary]
    
    def _add_tree_with_variations(self, x, y):
        """
        Fa hozzáadása változatos kinézettel
        
        :param x: X pozíció
        :param y: Y pozíció
        """
        # Véletlenszerű fajtípus kiválasztása (1-5)
        tree_type = random.randint(1, 5)
        
        # Fa alapértelmezett beállításai
        tree = {
            "x": x,
            "y": y,
            "size": random.uniform(0.7, 1.3),  # Változatosabb méretek
            "type": tree_type
        }
        
        # Különböző típusú fák eltérő színekkel
        if tree_type == 1:  # Tölgy-szerű fa
            tree["color"] = random.choice(["#2E6930", "#1D4D25", "#357a38"])
            tree["trunk_color"] = "#5D4037"
            tree["shape"] = "round"
        elif tree_type == 2:  # Fenyő-szerű fa
            tree["color"] = random.choice(["#1B4F2E", "#0B5345", "#145A32"])
            tree["trunk_color"] = "#6D4C41"
            tree["shape"] = "pine"
        elif tree_type == 3:  # Őszi fa
            tree["color"] = random.choice(["#D68910", "#CA6F1E", "#E67E22", "#BA4A00"])
            tree["trunk_color"] = "#6D4C41"
            tree["shape"] = "round"
        elif tree_type == 4:  # Nyírfa-szerű
            tree["color"] = random.choice(["#7CB342", "#8BC34A", "#AED581"])
            tree["trunk_color"] = "#D7CCC8"
            tree["shape"] = "oval"
        else:  # Juhar-szerű fa
            tree["color"] = random.choice(["#558B2F", "#33691E", "#689F38"])
            tree["trunk_color"] = "#5D4037"
            tree["shape"] = "wide"
            
        # Véletlenszerű enyhén eltérő színárnyalat hozzáadása
        if random.random() < 0.3:  # 30% esély a színvariációra
            r = int(tree["color"][1:3], 16)
            g = int(tree["color"][3:5], 16)
            b = int(tree["color"][5:7], 16)
            
            # Enyhe színváltoztatás
            r = max(0, min(255, r + random.randint(-15, 15)))
            g = max(0, min(255, g + random.randint(-15, 15)))
            b = max(0, min(255, b + random.randint(-15, 15)))
            
            tree["color"] = f"#{r:02x}{g:02x}{b:02x}"
        
        # Előre generáljuk a törzs elhajlását, hogy ne remegjen újrarajzoláskor
        if tree_type in [1, 3, 5] and random.random() < 0.4:
            tree["has_curved_trunk"] = True
            tree["trunk_offset_x"] = random.uniform(-3, 3)
            tree["trunk_offset_y"] = random.uniform(-3, 3)
        else:
            tree["has_curved_trunk"] = False
        
        self.tree_locations.append(tree)

    def _tree_conflicts_with_building(self, tree):
        """
        Ellenőrzi, hogy egy fa ütközik-e valamelyik épülettel
        
        :param tree: Fa adatok
        :return: True, ha ütközés van, False, ha nincs
        """
        tree_x, tree_y = tree["x"], tree["y"]
        min_distance = 40  # Minimum távolság épület és fa között
        
        # Épületek ellenőrzése
        for building in self.buildings_3d.values():
            bx = building["x"]
            by = building["y"]
            bw = building["width"]
            bd = building["depth"]
            
            # Ha a fa túl közel van egy épülethez, ütközés van
            if (abs(bx - tree_x) < bw/2 + min_distance) and (abs(by - tree_y) < bd/2 + min_distance):
                return True
        
        return False

    def _draw_single_tree(self, tree, center_x, center_y):
        """
        Egy fa rajzolása
        
        :param tree: Fa adatok
        :param center_x: Vászon középpontja X
        :param center_y: Vászon középpontja Y
        """
        x_pos = tree["x"]
        y_pos = tree["y"]
        tree_size = tree["size"]
        crown_color = tree["color"]
        trunk_color = tree.get("trunk_color", "#8B4513")  # Fatörzs színe
        tree_shape = tree.get("shape", "round")  # Fa alakja
        tree_type = tree.get("type", 1)  # Fa típusa
        
        # Fatörzs
        base_point = self._project_3d_to_2d(x_pos, y_pos, 0, center_x, center_y)
        trunk_height = 20 * self.zoom * tree_size
        trunk_width = int(5 * self.zoom * tree_size)
        trunk_top = self._project_3d_to_2d(x_pos, y_pos, trunk_height, center_x, center_y)
        
        # Törzsrajzolás a fa adataiban tárolt görbeség-információ alapján
        if tree.get("has_curved_trunk", False):
            # A korábban tárolt elhajlás értékeket használjuk
            mid_height = trunk_height * 0.6
            offset_x = tree["trunk_offset_x"] * self.zoom * tree_size
            offset_y = tree["trunk_offset_y"] * self.zoom * tree_size
            mid_point = self._project_3d_to_2d(x_pos + offset_x, y_pos + offset_y, mid_height, center_x, center_y)
            
            # Görbe törzs két vonallal
            self.city_canvas.create_line(
                self._to_int(base_point[0]), self._to_int(base_point[1]),
                self._to_int(mid_point[0]), self._to_int(mid_point[1]),
                fill=trunk_color,
                width=trunk_width
            )
            self.city_canvas.create_line(
                self._to_int(mid_point[0]), self._to_int(mid_point[1]),
                self._to_int(trunk_top[0]), self._to_int(trunk_top[1]),
                fill=trunk_color,
                width=int(trunk_width * 0.8)  # Keskenyedik felfelé
            )
        else:
            # Egyenes törzs
            self.city_canvas.create_line(
                self._to_int(base_point[0]), self._to_int(base_point[1]),
                self._to_int(trunk_top[0]), self._to_int(trunk_top[1]),
                fill=trunk_color,
                width=trunk_width
            )
        
        # Fakorona típus szerint
        if tree_shape == "pine":  # Fenyőfa
            # Fenyőfa háromszögei
            layers = 3
            crown_width = 25 * self.zoom * tree_size
            layer_height = 15 * self.zoom * tree_size
            
            for layer in range(layers):
                layer_y = trunk_height + layer * layer_height
                layer_width = crown_width * (1 - layer * 0.25)
                
                # Háromszög csúcsai
                top_point = self._project_3d_to_2d(x_pos, y_pos, layer_y + layer_height, center_x, center_y)
                left_point = self._project_3d_to_2d(x_pos - layer_width/2, y_pos, layer_y, center_x, center_y)
                right_point = self._project_3d_to_2d(x_pos + layer_width/2, y_pos, layer_y, center_x, center_y)
                
                # Háromszög árnyalása
                shade_factor = 0.9 - layer * 0.1
                layer_color = self._darken_color(crown_color, shade_factor)
                
                self.city_canvas.create_polygon(
                    self._to_int(top_point[0]), self._to_int(top_point[1]),
                    self._to_int(left_point[0]), self._to_int(left_point[1]),
                    self._to_int(right_point[0]), self._to_int(right_point[1]),
                    fill=layer_color,
                    outline=""
                )
                
        elif tree_shape == "oval":  # Ovális alakú korona
            crown_width = 18 * self.zoom * tree_size
            crown_height = 35 * self.zoom * tree_size
            crown_center = self._project_3d_to_2d(x_pos, y_pos, trunk_height + crown_height/2, center_x, center_y)
            
            self.city_canvas.create_oval(
                self._to_int(crown_center[0] - crown_width), 
                self._to_int(crown_center[1] - crown_height/1.6),
                self._to_int(crown_center[0] + crown_width), 
                self._to_int(crown_center[1] + crown_height/1.8),
                fill=crown_color,
                outline=""
            )
            
        elif tree_shape == "wide":  # Széles lombozatú fa
            crown_radius = int(20 * self.zoom * tree_size)
            crown_height = 30 * self.zoom * tree_size
            crown_center = self._project_3d_to_2d(x_pos, y_pos, trunk_height + crown_height/2, center_x, center_y)
            
            # Alsó korona (szélesebb)
            self.city_canvas.create_oval(
                self._to_int(crown_center[0] - crown_radius*1.3), 
                self._to_int(crown_center[1] - crown_radius*0.5),
                self._to_int(crown_center[0] + crown_radius*1.3), 
                self._to_int(crown_center[1] + crown_radius*0.8),
                fill=crown_color,
                outline=""
            )
            
            # Felső korona
            self.city_canvas.create_oval(
                self._to_int(crown_center[0] - crown_radius), 
                self._to_int(crown_center[1] - crown_radius*1.5),
                self._to_int(crown_center[0] + crown_radius), 
                self._to_int(crown_center[1] - crown_radius*0.3),
                fill=self._darken_color(crown_color, 1.1),  # Kicsit világosabb
                outline=""
            )
            
        else:  # Alapértelmezett kerek korona
            # Több rétegű lombkorona
            crown_layers = 2
            crown_radius = int(16 * self.zoom * tree_size)
            
            for layer in range(crown_layers):
                layer_height = trunk_height + 15 * self.zoom * tree_size * (layer + 0.5)
                layer_radius = crown_radius * (1.0 - layer * 0.2)  # Felfelé csökkenő sugár
                
                layer_center = self._project_3d_to_2d(x_pos, y_pos, layer_height, center_x, center_y)
                
                # Alsó réteg sötétebb, felső világosabb
                layer_color = crown_color
                if layer == 0:
                    layer_color = self._darken_color(crown_color, 0.9)
                else:
                    layer_color = self._darken_color(crown_color, 1.1)  # Világosítás
                
                # Ovális alakú lombkorona
                self.city_canvas.create_oval(
                    self._to_int(layer_center[0] - layer_radius), 
                    self._to_int(layer_center[1] - layer_radius * 1.1),
                    self._to_int(layer_center[0] + layer_radius), 
                    self._to_int(layer_center[1] + layer_radius * 0.9),
                    fill=layer_color,
                    outline=""
                )
        
        # Eltávolítottuk a fényfolt effekteket, amelyek vibráló pontokat okoztak
    
    def _draw_vehicle(self, vehicle, center_x, center_y):
        """
        Egy jármű rajzolása
        
        :param vehicle: Jármű adatok
        :param center_x: Vászon középpontja X
        :param center_y: Vászon középpontja Y
        """
        # Pozíció és típus
        x = vehicle["x"]
        y = vehicle["y"]
        is_horizontal = vehicle["horizontal"]
        
        # Autó méretei
        car_length = 20 * self.zoom
        car_width = 10 * self.zoom
        car_height = 8 * self.zoom
        car_color = vehicle["color"]
        
        # Autó pontjai
        points = []
        
        # Autó alap
        if is_horizontal:
            # Vízszintes utcán
            points.append(self._project_3d_to_2d(x - car_length/2, y - car_width/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_length/2, y - car_width/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_length/2, y + car_width/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x - car_length/2, y + car_width/2, 0, center_x, center_y))
            
            # Autó tető
            points.append(self._project_3d_to_2d(x - car_length/3, y - car_width/2, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_length/3, y - car_width/2, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_length/3, y + car_width/2, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x - car_length/3, y + car_width/2, car_height, center_x, center_y))
        else:
            # Függőleges utcán
            points.append(self._project_3d_to_2d(x - car_width/2, y - car_length/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_width/2, y - car_length/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_width/2, y + car_length/2, 0, center_x, center_y))
            points.append(self._project_3d_to_2d(x - car_width/2, y + car_length/2, 0, center_x, center_y))
            
            # Autó tető
            points.append(self._project_3d_to_2d(x - car_width/2, y - car_length/3, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_width/2, y - car_length/3, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x + car_width/2, y + car_length/3, car_height, center_x, center_y))
            points.append(self._project_3d_to_2d(x - car_width/2, y + car_length/3, car_height, center_x, center_y))
        
        # Autó oldalai rajzolása
        # Hátsó
        self.city_canvas.create_polygon(
            self._to_int(points[2][0]), self._to_int(points[2][1]),
            self._to_int(points[3][0]), self._to_int(points[3][1]),
            self._to_int(points[7][0]), self._to_int(points[7][1]),
            self._to_int(points[6][0]), self._to_int(points[6][1]),
            fill=self._darken_color(car_color, 0.7),
            outline="black"
        )
        
        # Bal oldal
        self.city_canvas.create_polygon(
            self._to_int(points[0][0]), self._to_int(points[0][1]),
            self._to_int(points[3][0]), self._to_int(points[3][1]),
            self._to_int(points[7][0]), self._to_int(points[7][1]),
            self._to_int(points[4][0]), self._to_int(points[4][1]),
            fill=self._darken_color(car_color, 0.8),
            outline="black"
        )
        
        # Tető
        self.city_canvas.create_polygon(
            self._to_int(points[4][0]), self._to_int(points[4][1]),
            self._to_int(points[5][0]), self._to_int(points[5][1]),
            self._to_int(points[6][0]), self._to_int(points[6][1]),
            self._to_int(points[7][0]), self._to_int(points[7][1]),
            fill=self._darken_color(car_color, 0.9),
            outline="black"
        )
        
        # Jobb oldal
        self.city_canvas.create_polygon(
            self._to_int(points[1][0]), self._to_int(points[1][1]),
            self._to_int(points[2][0]), self._to_int(points[2][1]),
            self._to_int(points[6][0]), self._to_int(points[6][1]),
            self._to_int(points[5][0]), self._to_int(points[5][1]),
            fill=self._darken_color(car_color, 0.85),
            outline="black"
        )
        
        # Első
        self.city_canvas.create_polygon(
            self._to_int(points[0][0]), self._to_int(points[0][1]),
            self._to_int(points[1][0]), self._to_int(points[1][1]),
            self._to_int(points[5][0]), self._to_int(points[5][1]),
            self._to_int(points[4][0]), self._to_int(points[4][1]),
            fill=car_color,
            outline="black"
        )
    
    def _reset_layout(self):
        """
        Épületek elrendezésének újragenerálása
        """
        # Jelöljük, hogy újra kell generálni az elrendezést
        self.fixed_buildings_reset = True
        # Töröljük a korábbi elrendezést
        self.fixed_buildings = {}
        # Frissítjük a várost
        self.update_city_view()