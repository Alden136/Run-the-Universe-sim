# Run the Universe

A single React component that runs the whole 13.787-billion-year backlog at a
speed you pick, prints every checkpoint as it goes, and then keeps going past
today — out to the last black hole and whatever is left after that.

`RunTheUniverse.jsx` is self-contained: all styling is inline, the only
dependency is React itself.

## Just open it

`run-the-universe.html` is the whole app in one file — React and all — with
nothing to install. Download it and double-click, or drag it into a Chrome tab.
It works offline; the only thing it fetches is the webfonts, and it falls back
to system monospace without them.

That file is generated. If you change `RunTheUniverse.jsx`, rebuild it:

```bash
npm install
npm run standalone
```

## Running it with a dev server

Only worth it if you want hot reload while editing. Requires
[Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL it prints (http://localhost:5173). Add `-- --open` to have it
open the browser for you.

```bash
npm run build     # production bundle into dist/
npm run preview   # serve that bundle
```

## On your phone

Easiest: put `run-the-universe.html` somewhere the phone can get at it — AirDrop
it, email it, drop it in a cloud drive — and open it there.

To reach the dev server instead, note that it binds to localhost only, so
nothing else on your network can see it. Start it with the host flag:

```bash
npm run dev:host
```

Vite then prints a second line — `Network: http://192.168.x.x:5173/`. Type that
address into the phone's browser. The phone and the computer have to be on the
same Wi-Fi, and the first time you do this your OS may ask you to let Node
accept incoming connections.

This is a separate script rather than the default because `--host` exposes the
dev server to every device on the network.

Off your network, build it and put `dist/` on any static host — it is plain
files, no server needed.

The layout is responsive down to 320px: below 600px the sheet goes single
column, the checkpoint log switches to a two-line row, and the thermometer
stacks its reading above the gauge. Sound is off until you press the button,
which is also what unlocks audio on iOS.

## Dropping it into an existing app

The component has no imports beyond React, so it travels alone:

```jsx
import RunTheUniverse from "./RunTheUniverse.jsx";
```

It pulls its typefaces from Google Fonts via a CSS `@import` and falls back to
system monospace if that is blocked. Sound is Web Audio, built on first press
and off until you enable it.

## The thermometer

The run reads out the temperature of the universe at the moment it is
simulating, from the Planck wall down to the coldest temperature this universe
will ever hold.

`t(a)` is tabulated once by integrating the Friedmann equation over a log grid
(radiation + matter + Λ) and then inverted; below the table `a ∝ √t`, above it
`a ∝ e^{H_Λ t}`. Photons stretch with space, so `T ∝ 1/a` — corrected by
`g_s(T)^(−1/3)` for the entropy each annihilating species dumps back into them.
At the cold end, expansion never reaches zero: the de Sitter horizon glows at
2.2×10⁻³⁰ K, and the microwave background falls below that around 1.2 trillion
years from now.

Pinned to 2.7255 K today, it lands on the textbook values in between —
1.07×10¹⁰ K at one second, z+1 = 3443 at matter–radiation equality, 2935 K at
recombination, z+1 = 19 when the first stars light.
