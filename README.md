# ME Város Projekt

## A projektről

Ez a projekt a Miskolci Egyetem virtuális városát mutatja be. A weboldal modern Next.js keretrendszerre épül, és különböző interaktív funkciókat kínál, mint például épületek megtekintése, események kezelése, városi statisztikák és 3D városi térkép.

## Technológiai stack

- **Frontend keretrendszer**: [Next.js 15](https://nextjs.org/)
- **UI könyvtárak**: 
  - [NextUI](https://nextui.org/)
  - [Tremor](https://www.tremor.so/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **3D megjelenítés**: 
  - [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
  - [Drei](https://github.com/pmndrs/drei)
- **Adatmegjelenítés**:
  - [Nivo](https://nivo.rocks/) grafikonok
  - [D3.js](https://d3js.org/)
- **State management**:
  - [Zustand](https://github.com/pmndrs/zustand)
  - [Tanstack Query](https://tanstack.com/query/latest)
  - [SWR](https://swr.vercel.app/)
- **Nyelv**: [TypeScript](https://www.typescriptlang.org/)

## Telepítés

A projekt futtatásához Node.js környezet szükséges. Telepítsd a függőségeket:

```bash
npm install
```

## Fejlesztői szerver indítása

A fejlesztői szerver indításához futtasd:

```bash
npm run dev
```

A fejlesztői szerver [http://localhost:3000](http://localhost:3000) címen érhető el. A weboldal automatikusan frissül, amikor módosítod a forrásfájlokat.

## Projekt összeállítása (build)

Produkciós verzió előállításához:

```bash
npm run build
```

A build futtatása után a `.next` mappában találhatók a generált fájlok.

## Produkciós verzió indítása

Az előzőleg elkészített build futtatásához:

```bash
npm run start
```

A szerver [http://localhost:3000](http://localhost:3000) címen lesz elérhető.

## Exportálás statikus oldalként (opcionális)

Ha a projektet statikus oldalként szeretnéd exportálni (amennyiben nem használsz szerver oldali funkciókat), módosítsd a `next.config.js` fájlt:

```js
module.exports = {
  output: 'export',
  // ... egyéb beállítások
}
```

Majd futtasd:

```bash
npm run build
```

A statikus fájlok az `out` mappában lesznek megtalálhatók.

## Projekt szerkezet

- `src/app/` - Next.js App Router oldalak és útvonalak
- `src/components/` - Újrafelhasználható komponensek
- `src/lib/` - Segédfüggvények és utility kódok
- `src/store/` - Zustand state management
- `public/` - Statikus fájlok (képek, ikonok, stb.)

## Linter futtatása

A kód ellenőrzéséhez:

```bash
npm run lint
```

## Fejlesztési tippek

- Az oldal fő belépési pontja: `src/app/page.tsx`
- A UI testreszabásához módosítsd a `tailwind.config.js` fájlt
- A globális stílusok a `src/globals.css` fájlban találhatók
