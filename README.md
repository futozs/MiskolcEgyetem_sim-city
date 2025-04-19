# ME Város Projekt

Ez a projekt a Miskolci Egyetem virtuális városát mutatja be egy modern weboldalon, Next.js segítségével. Fedezd fel az épületeket, eseményeket és a város 3D térképét!

## Előkészületek

Győződj meg róla, hogy a [Node.js](https://nodejs.org/) (LTS verzió ajánlott) telepítve van a gépeden.

## Telepítés és Indítás

1.  **Klónozd a repót (ha még nem tetted meg):**
    ```bash
    # Például:
    # git clone https://github.com/futozs/ME-Verseny/edit/next.js-web/
    # cd <repo_mappa>
    ```

2.  **Telepítsd a függőségeket:**
    ```bash
    npm install
    ```
    *Ez letölti az összes szükséges csomagot a projekthez.*

3.  **Indítsd el a fejlesztői szervert:**
    ```bash
    npm run dev
    ```
    *Ezzel elindul egy helyi webszerver. Nyisd meg a böngésződben a [http://localhost:3000](http://localhost:3000) címet.*
    *A kód módosításakor az oldal automatikusan frissül.*

## További Hasznos Parancsok

*   **Produkciós build készítése:**
    ```bash
    npm run build
    ```
    *Optimalizált verziót készít a `.next` mappába.*

*   **Produkciós build futtatása:**
    ```bash
    npm run start
    ```
    *Az előzőleg `npm run build`-del létrehozott verziót indítja el (általában szintén a `http://localhost:3000` címen).*

*   **Kód ellenőrzése (Linting):**
    ```bash
    npm run lint
    ```
    *Ellenőrzi a kódot stilisztikai és potenciális hibákra.*

## Technológia dióhéjban

A projekt [Next.js](https://nextjs.org/) (React keretrendszer) és [TypeScript](https://www.typescriptlang.org/) alapokon nyugszik, [Tailwind CSS](https://tailwindcss.com/) és [NextUI](https://nextui.org/) segítségével a felhasználói felülethez.
