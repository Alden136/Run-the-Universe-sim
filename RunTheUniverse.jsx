import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ─────────────────────────  CONSTANTS  ───────────────────────── */

const SPY = 31557600;                 // seconds in a Julian year
const AGE = 13.787e9;                 // age of the universe, years
const LOG_SPY = Math.log10(SPY);      // 7.4989
const L_MAX = 1500;                   // far end of the future log, in log10(years from now)

/* Past eras — linear time, real proportions. */
const ERAS = [
  { key: "P", name: "Primordial",  color: "#6D4AE0", end: 1.0e6 },
  { key: "D", name: "First light", color: "#C2478E", end: 4.0e8 },
  { key: "G", name: "Galaxies",    color: "#E08A18", end: 9.2e9 },
  { key: "S", name: "Sun & Earth", color: "#0E8C8C", end: 9.99e9 },
  { key: "L", name: "Life",        color: "#4C9A3F", end: 13.78e9 },
  { key: "U", name: "Us",          color: "#C0362C", end: AGE },
];
ERAS.forEach((e, i) => { e.start = i ? ERAS[i - 1].end : 0; e.span = e.end - e.start; });
const eraFor = (t) => ERAS.find((e) => t < e.end) || ERAS[ERAS.length - 1];

/* Future eras — measured in log10(years from now). */
const F_ERAS = [
  { key: "f1", name: "Long twilight", color: "#B8892A", end: 14 },
  { key: "f2", name: "Degenerate",    color: "#5D7A99", end: 40 },
  { key: "f3", name: "Black hole",    color: "#4A3B8C", end: 106 },
  { key: "f4", name: "Dark",          color: "#2B2740", end: L_MAX },
];
F_ERAS.forEach((e, i) => { e.start = i ? F_ERAS[i - 1].end : 0; });
const fEraFor = (L) => F_ERAS.find((e) => L < e.end) || F_ERAS[F_ERAS.length - 1];

/* the future axis is log-of-log, otherwise everything interesting sits in the first 7% */
const fPos = (L) => Math.log10(Math.max(0, L) + 1) / Math.log10(L_MAX + 1);

/* tier: 3 = bell, 2 = notable, 1 = routine clack */
const PAST = [
  { t: 1.71e-51,  tier: 3, name: "PLANCK TIME",         note: "physics as we know it starts working" },
  { t: 3.2e-44,   tier: 1, name: "FORCES SPLIT",        note: "gravity peels away from everything else" },
  { t: 3.2e-40,   tier: 3, name: "INFLATION ENDS",      note: "space stops doubling every 10⁻³⁶ s" },
  { t: 3.2e-20,   tier: 1, name: "ELECTROWEAK BREAK",   note: "the Higgs field switches on; particles get mass" },
  { t: 3.2e-14,   tier: 2, name: "QUARKS BIND",         note: "protons and neutrons freeze out of the plasma" },
  { t: 3.2e-9,    tier: 1, name: "MATTER WINS",         note: "one extra quark per billion survives annihilation" },
  { t: 3.2e-8,    tier: 1, name: "NEUTRINOS DECOUPLE",  note: "they are still out there, unheard, right now" },
  { t: 3.2e-7,    tier: 1, name: "POSITRONS ANNIHILATE",note: "the last antimatter in the universe burns off" },
  { t: 5.7e-6,    tier: 3, name: "NUCLEOSYNTHESIS",     note: "hydrogen and helium settle into their final ratio" },
  { t: 5.0e4,     tier: 2, name: "MATTER OVERTAKES LIGHT", note: "gravity, not radiation, now runs the show" },
  { t: 3.8e5,     tier: 3, name: "RECOMBINATION",       note: "atoms form, light gets loose, the CMB is released" },
  { t: 1.0e6,     tier: 1, name: "DARK AGES BEGIN",     note: "no stars yet — the longest night there has ever been" },
  { t: 2.0e8,     tier: 3, name: "FIRST STARS",         note: "the cosmic dark ages end" },
  { t: 4.0e8,     tier: 2, name: "FIRST GALAXIES",      note: "clumps of stars find each other" },
  { t: 7.0e8,     tier: 2, name: "FIRST QUASARS",       note: "supermassive black holes light up" },
  { t: 1.0e9,     tier: 1, name: "REIONIZATION",        note: "starlight strips the hydrogen fog back off" },
  { t: 1.5e9,     tier: 3, name: "MILKY WAY FORMS",     note: "the disk you observe from starts assembling" },
  { t: 3.3e9,     tier: 2, name: "COSMIC NOON",         note: "peak star formation; it is never this busy again" },
  { t: 5.0e9,     tier: 1, name: "GLOBULAR CLUSTERS SETTLE", note: "the galaxy's oldest neighborhoods finish forming" },
  { t: 9.2e9,     tier: 3, name: "THE SUN IGNITES",     note: "4.6 billion years ago, in a quiet spiral arm" },
  { t: 9.247e9,   tier: 2, name: "EARTH ACCRETES",      note: "assembled from the leftovers in ~10 million years" },
  { t: 9.29e9,    tier: 2, name: "THEIA IMPACT",        note: "a Mars-sized world hits Earth; the Moon is the debris" },
  { t: 9.39e9,    tier: 1, name: "OCEANS CONDENSE",     note: "the surface cools enough for liquid water to stay" },
  { t: 9.89e9,    tier: 1, name: "HEAVY BOMBARDMENT",   note: "the inner planets get resurfaced by impacts" },
  { t: 9.99e9,    tier: 3, name: "LIFE APPEARS",        note: "earliest chemical traces, 3.8 billion years ago" },
  { t: 10.39e9,   tier: 2, name: "PHOTOSYNTHESIS",      note: "something learns to eat sunlight" },
  { t: 11.39e9,   tier: 3, name: "OXYGEN CRISIS",       note: "cyanobacteria poison the atmosphere with O₂" },
  { t: 11.99e9,   tier: 3, name: "COMPLEX CELLS",       note: "one cell moves into another and stays — mitochondria" },
  { t: 12.59e9,   tier: 1, name: "SEX EVOLVES",         note: "genetic recombination beats cloning" },
  { t: 13.07e9,   tier: 2, name: "SNOWBALL EARTH",      note: "ice reaches the equator, twice" },
  { t: 13.15e9,   tier: 2, name: "ANIMALS",             note: "the Ediacaran biota, soft and strange" },
  { t: 13.246e9,  tier: 3, name: "CAMBRIAN EXPLOSION",  note: "body plans, suddenly and in every direction" },
  { t: 13.317e9,  tier: 1, name: "PLANTS TAKE LAND",    note: "the continents turn green" },
  { t: 13.417e9,  tier: 2, name: "VERTEBRATES CRAWL OUT", note: "fins become limbs, 370 million years ago" },
  { t: 13.487e9,  tier: 1, name: "CARBONIFEROUS FORESTS", note: "the coal you burn is being grown right now" },
  { t: 13.535e9,  tier: 3, name: "THE GREAT DYING",     note: "96% of marine species gone in the Permian extinction" },
  { t: 13.557e9,  tier: 2, name: "DINOSAURS",           note: "230 million years ago" },
  { t: 13.562e9,  tier: 1, name: "FIRST MAMMALS",       note: "small, nocturnal, waiting" },
  { t: 13.637e9,  tier: 1, name: "BIRDS",               note: "dinosaurs work out feathers and flight" },
  { t: 13.657e9,  tier: 1, name: "FLOWERS",             note: "plants start bribing insects" },
  { t: 13.721e9,  tier: 3, name: "CHICXULUB",           note: "bad Tuesday for the dinosaurs" },
  { t: 13.732e9,  tier: 1, name: "PRIMATES DIVERSIFY",  note: "mammals inherit the empty world" },
  { t: 13.780e9,  tier: 2, name: "HOMININS SPLIT",      note: "our line parts ways with the chimpanzees" },
  { t: 13.7837e9, tier: 1, name: "STONE TOOLS",         note: "3.3 million years ago" },
  { t: 13.786e9,  tier: 2, name: "FIRE",                note: "controlled, kept, carried" },
  { t: 13.7867e9, tier: 3, name: "HUMANS",              note: "300,000 years ago — the last 0.002% of the run" },
  { t: 13.786988e9, tier: 2, name: "AGRICULTURE",       note: "12,000 years ago; everything else follows fast" },
  { t: 13.786995e9, tier: 1, name: "WRITING",           note: "the universe starts keeping its own notes" },
  { t: 13.78699994e9, tier: 2, name: "TELESCOPES",      note: "matter arranges itself to look back at the sky" },
  { t: AGE,       tier: 3, name: "TODAY",               note: "you are here. Everything below has not happened yet." },
];

/* L = log10(years from now) */
const FUTURE = [
  { L: 4.11, tier: 1, name: "VEGA TAKES OVER",        note: "Earth's axis wanders; Vega becomes the north star" },
  { L: 4.60, tier: 2, name: "VOYAGER 1 PASSES A STAR", note: "closest approach to Gliese 445, still transmitting nothing" },
  { L: 5.00, tier: 3, name: "BETELGEUSE EXPLODES",    note: "a supernova bright enough to cast shadows at night" },
  { L: 5.70, tier: 1, name: "A KILOMETRE-WIDE IMPACT", note: "statistically overdue by then" },
  { L: 6.00, tier: 2, name: "CONSTELLATIONS DISSOLVE", note: "proper motion pulls every familiar shape apart" },
  { L: 7.00, tier: 1, name: "EAST AFRICA SPLITS OFF", note: "the rift finishes the job; a new ocean opens" },
  { L: 8.40, tier: 2, name: "PANGAEA PROXIMA",        note: "the continents collide into one landmass again" },
  { L: 8.70, tier: 2, name: "PHOTOSYNTHESIS FAILS",   note: "the brightening Sun drives CO₂ below what plants can use" },
  { L: 9.05, tier: 3, name: "THE OCEANS BOIL",        note: "Earth leaves the habitable zone permanently" },
  { L: 9.65, tier: 3, name: "ANDROMEDA ARRIVES",      note: "the galaxies merge; almost no two stars actually collide" },
  { L: 9.88, tier: 3, name: "THE SUN SWELLS",         note: "red giant. Mercury and Venus are swallowed, Earth probably" },
  { L: 9.95, tier: 2, name: "WHITE DWARF",            note: "the exposed core, cooling for the rest of time" },
  { L: 11.0, tier: 2, name: "LOCAL GROUP MERGES",     note: "one elliptical galaxy; no spiral arms anywhere" },
  { L: 12.3, tier: 3, name: "THE SKY GOES DARK",      note: "expansion carries every other galaxy past the horizon" },
  { L: 13.0, tier: 1, name: "RED DWARFS AT MIDLIFE",  note: "the smallest stars are only halfway through" },
  { L: 14.0, tier: 3, name: "THE LAST STAR FORMS",    note: "the gas runs out. The Stelliferous Era is over." },
  { L: 14.3, tier: 2, name: "THE LAST STARLIGHT",     note: "the final red dwarf fades out" },
  { L: 15.0, tier: 2, name: "PLANETS SET LOOSE",      note: "passing stars strip planetary systems apart" },
  { L: 17.0, tier: 1, name: "BLACK DWARFS",           note: "white dwarfs cool to the background temperature" },
  { L: 19.0, tier: 2, name: "GALAXIES EVAPORATE",     note: "most remnants are flung out into intergalactic space" },
  { L: 20.0, tier: 1, name: "ORBITS DECAY",           note: "gravitational waves drag the rest inward" },
  { L: 21.0, tier: 1, name: "REMNANTS SINK",          note: "dead stars spiral down toward the galactic centre" },
  { L: 23.0, tier: 2, name: "THE HALO EMPTIES",       note: "most remnants are gone; the rest are falling in" },
  { L: 30.0, tier: 2, name: "CENTRAL HOLES FEED",     note: "galactic black holes swallow what is left of the galaxy" },
  { L: 34.0, tier: 3, name: "PROTONS DECAY?",         note: "if they do, ordinary matter has an expiry date" },
  { L: 37.0, tier: 2, name: "POSITRONIUM",            note: "electrons and positrons pair into atoms bigger than galaxies" },
  { L: 40.0, tier: 2, name: "MATTER ENDS",            note: "black holes, photons, and stray leptons. That is the inventory." },
  { L: 43.0, tier: 1, name: "THE LAST WARMTH",        note: "proton decay had been heating black dwarfs. It stops." },
  { L: 65.0, tier: 2, name: "SOLIDS FLOW",            note: "over spans this long, quantum tunnelling makes rock behave like liquid" },
  { L: 67.0, tier: 3, name: "STELLAR HOLES EVAPORATE", note: "Hawking radiation finishes off a solar-mass black hole" },
  { L: 85.0, tier: 2, name: "SUPERMASSIVE HOLES BOIL OFF", note: "a million-solar-mass hole reaches its last second" },
  { L: 100,  tier: 3, name: "THE LAST BLACK HOLE",    note: "the largest holes of all finally evaporate" },
  { L: 106,  tier: 2, name: "THE DARK ERA",           note: "cold photons and lone particles, drifting apart forever" },
  { L: 139,  tier: 1, name: "GRAVITY TAKES THE REST", note: "if protons never decayed, virtual black holes get them anyway" },
  { L: 1100, tier: 1, name: "BLACK DWARF SUPERNOVAE", note: "if protons are stable, the last stars go off one by one" },
  { L: 1500, tier: 3, name: "IRON STARS",             note: "everything has tunnelled into iron. The log ends here." },
];

/* Future pacing.
   Driving L by a growth law made the tail rush: the exponent runs away and the last
   forty orders of magnitude go by in a blink. Instead the future is paced checkpoint
   by checkpoint — a steady beat, with a little extra time granted to the segments that
   cover the widest stretch of the bar. */
const fInv = (x) => Math.pow(10, x * Math.log10(L_MAX + 1)) - 1;
const F_L = [0, ...FUTURE.map((m) => m.L)];     // L at p = 0,1,2,...
const F_P = F_L.map(fPos);                      // same anchors in bar space
const F_BEAT = 1.0;                             // pacing units per second at 1×
const F_W = F_L.slice(0, -1).map((_, i) =>
  Math.max(0.5, Math.min(3.2, 0.55 + 0.45 * (F_P[i + 1] - F_P[i]) * FUTURE.length)));

function lFromP(p) {
  if (p >= FUTURE.length) return L_MAX;
  const k = Math.floor(p);
  return fInv(F_P[k] + (F_P[k + 1] - F_P[k]) * (p - k));
}

const PRESETS = [
  { v: 1,           label: "realtime" },
  { v: SPY,         label: "a year per second" },
  { v: AGE / 80,    label: "done in a lifetime" },
  { v: SPY * 1e9,   label: "a billion years per second" },
  { v: AGE * SPY / 86400, label: "done by tomorrow" },
  { v: AGE * SPY,   label: "done in one second" },
];

const ANCHORS = [
  { s: 0.4,          name: "a blink" },
  { s: 210,          name: "one song" },
  { s: 28800,        name: "a workday" },
  { s: 86400,        name: "a day" },
  { s: SPY,          name: "a year" },
  { s: 80 * SPY,     name: "a human life" },
  { s: 5200 * SPY,   name: "all of recorded history" },
  { s: 3e5 * SPY,    name: "the entire human species so far" },
  { s: 66e6 * SPY,   name: "the time since the dinosaurs died" },
  { s: 4.6e9 * SPY,  name: "the age of the Sun" },
  { s: AGE * SPY,    name: "the age of the universe itself" },
];

/* ─────────────────────────  FORMATTING  ───────────────────────── */

const SUP = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻","+":"" };
const sup = (n) => String(n).split("").map((c) => SUP[c] ?? c).join("");

function sci(x, digits = 2) {
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / Math.pow(10, e);
  if (Math.abs(+m.toFixed(digits)) >= 10) { m /= 10; e += 1; }   // 9.95 → 1.0×10ⁿ⁺¹
  return `${m.toFixed(digits)}×10${sup(e)}`;
}

function sigFigs(x) {
  if (x >= 100) return Math.round(x).toLocaleString("en-US");
  if (x >= 10) return x.toFixed(1);
  return x.toFixed(2);
}

const BIG_UNITS = [
  [1e18, "quintillion"], [1e15, "quadrillion"], [1e12, "trillion"],
  [1e9, "billion"], [1e6, "million"], [1e3, "thousand"],
];

function fmtYears(y) {
  if (y <= 0) return "0 years";
  if (y < 1e-3) return `${sci(y)} years`;
  if (y < 1) return `${y.toPrecision(3)} years`;
  for (const [mag, word] of BIG_UNITS) {
    if (y >= mag) {
      const v = y / mag;
      if (v >= 1e6) return `${sci(y)} years`;
      return `${sigFigs(v)} ${word} years`;
    }
  }
  return `${sigFigs(y)} years`;
}

function fmtDuration(s) {
  if (!isFinite(s) || s <= 0) return "—";
  if (s < 1e-6) return `${sci(s)} seconds`;
  if (s < 1e-3) return `${sigFigs(s * 1e6)} microseconds`;
  if (s < 1) return `${sigFigs(s * 1e3)} milliseconds`;
  if (s < 90) return `${sigFigs(s)} seconds`;
  if (s < 5400) return `${sigFigs(s / 60)} minutes`;
  if (s < 172800) return `${sigFigs(s / 3600)} hours`;
  if (s < SPY) return `${sigFigs(s / 86400)} days`;
  return fmtYears(s / SPY);
}

/* durations far past what a double can hold, handled entirely in log space */
function fmtLogDuration(logS) {
  if (logS < 17) return fmtDuration(Math.pow(10, logS));
  const ly = logS - LOG_SPY;
  if (ly < 15) return fmtYears(Math.pow(10, ly));
  return `10${sup(Math.round(ly))} years`;
}

function fmtLogYears(L) {
  if (L < 15) return fmtYears(Math.pow(10, L));
  return `10${sup(Math.round(L))} years`;
}

function shortLogYears(L) {
  if (L < 6) return `${Math.round(Math.pow(10, L)).toLocaleString("en-US")} yr`;
  if (L < 15) {
    const y = Math.pow(10, L);
    for (const [mag, word] of BIG_UNITS) if (y >= mag) return `${sigFigs(y / mag)} ${word.slice(0, 2)} yr`;
  }
  return `10${sup(Math.round(L))} yr`;
}

function fmtOffset(s) {
  if (s < 60) return `+${s.toFixed(3)}s`;
  if (s < 3600) return `+${Math.floor(s / 60)}m${String(Math.floor(s % 60)).padStart(2, "0")}s`;
  return `+${(s / 3600).toFixed(2)}h`;
}

function fmtSimYears(y) {
  if (y <= 0) return "0 yr";
  if (y < 1e-3) return `${sci(y, 1)} yr`;
  if (y < 1000) return `${y.toPrecision(3)} yr`;
  for (const [mag, word] of BIG_UNITS) if (y >= mag) return `${sigFigs(y / mag)} ${word} yr`;
  return `${Math.round(y).toLocaleString("en-US")} yr`;
}

function comparison(wall) {
  if (wall < ANCHORS[0].s) return "Shorter than a blink. You would miss the whole thing.";
  let best = ANCHORS[0];
  for (const a of ANCHORS) if (a.s <= wall) best = a;
  const r = wall / best.s;
  const times = r < 1.15 ? "about" : r >= 1e4 ? `${sci(r, 1)}×` : `${sigFigs(r)}×`;
  return r < 1.15 ? `That is ${times} the length of ${best.name}.` : `That is ${times} ${best.name}.`;
}

function stampFor(wall) {
  if (wall > AGE * SPY) return { text: "EXCEEDS UNIVERSE", color: "#6D4AE0" };
  if (wall > 5e5 * SPY) return { text: "QUEUE LIMIT EXCEEDED", color: "#C0362C" };
  if (wall > 80 * SPY) return { text: "OUTLIVES OPERATOR", color: "#D9720B" };
  if (wall < 60) return { text: "APPROVED", color: "#2E8B57" };
  return null;
}

/* ─────────────────────────  THERMODYNAMICS  ─────────────────────────

   The universe has one temperature at a time, and it only ever falls.
   Everything below comes out of the scale factor: photons stretch with space,
   so T ∝ 1/a. Two corrections matter at the two ends of the run.

   Hot end — entropy dumps. Each time a species annihilates (quarks, then
   muons, then electrons) it pours its entropy into the photons and the cooling
   stalls. The standard fix is T ∝ g_s(T)^(−1/3)/a, normalised to today's 3.94
   degrees of freedom. Without it the first microsecond runs ~3× too hot.

   Cold end — expansion never reaches zero. A universe with a cosmological
   constant has a horizon, and horizons glow: the de Sitter temperature
   ħH_Λ/2πk_B. The microwave background falls below that floor about 10¹² years
   from now, and nothing anywhere is ever colder again.                       */

const H0 = 2.1843e-18;                       // 67.4 km/s/Mpc, in s⁻¹
const OM_M = 0.3149, OM_R = 9.1e-5, OM_L = 1 - OM_M - OM_R;
const T_CMB0 = 2.7255;                       // K, measured today
const H_LAM = H0 * Math.sqrt(OM_L);
const T_DS = (1.054571817e-34 * H_LAM) / (2 * Math.PI * 1.380649e-23);   // ≈ 2.2×10⁻³⁰ K
const T_PLANCK_S = 5.391e-44;                // one Planck time, in seconds
const GS0 = 3.94;                            // g_s today: photons + three neutrinos

/* t(a) = (1/H₀) ∫ a da / √(Ω_r + Ω_m a + Ω_Λ a⁴), tabulated once in log a.
   Simpson over a log grid: the integrand is smooth there, and every era of the
   universe gets the same number of samples. */
const A_LO = -36, A_HI = 6, A_STEP = 0.02;
const [AU, AT] = (() => {
  const f = (u) => {
    const a = Math.pow(10, u);
    return (a * a * Math.LN10) / Math.sqrt(OM_R + OM_M * a + OM_L * a * a * a * a);
  };
  const U = [A_LO], T = [];
  const a0 = Math.pow(10, A_LO);
  let acc = (a0 * a0) / (2 * Math.sqrt(OM_R));      // exact for a ≪ Ω_r/Ω_m
  T.push(Math.log10(acc / H0));
  for (let i = 0, n = Math.round((A_HI - A_LO) / A_STEP); i < n; i++) {
    const u = A_LO + i * A_STEP;
    acc += (A_STEP / 6) * (f(u) + 4 * f(u + A_STEP / 2) + f(u + A_STEP));
    U.push(u + A_STEP);
    T.push(Math.log10(acc / H0));
  }
  return [U, T];
})();

/* log10 of the scale factor at t seconds after the Big Bang. Below the table
   a ∝ √t (radiation); above it a ∝ e^{H_Λ t} (dark energy, forever). */
function logA(tSec) {
  const last = AT.length - 1;
  const lt = Math.log10(Math.max(tSec, 1e-70));
  if (lt <= AT[0]) return AU[0] + 0.5 * (lt - AT[0]);
  if (lt >= AT[last]) return AU[last] + (H_LAM * (tSec - Math.pow(10, AT[last]))) / Math.LN10;
  let lo = 0, hi = last;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (AT[m] <= lt) lo = m; else hi = m; }
  return AU[lo] + ((lt - AT[lo]) / (AT[hi] - AT[lo])) * (AU[hi] - AU[lo]);
}
const LA_TODAY = logA(AGE * SPY);            // pins the model to 2.7255 K today

/* effective entropy degrees of freedom, as a function of temperature */
const GS = [[9,3.94],[9.7,3.94],[10.3,10.75],[12,10.75],[12.2,17.25],
            [12.42,61.75],[13,61.75],[14,75.75],[15,96.25],[15.6,106.75]];
function gStar(T) {
  const n = GS.length - 1;
  const x = Math.log10(T);
  if (!(x > GS[0][0])) return GS[0][1];
  if (x >= GS[n][0]) return GS[n][1];
  for (let i = 1; i <= n; i++) if (x < GS[i][0]) {
    const [x0, g0] = GS[i - 1], [x1, g1] = GS[i];
    return g0 + ((g1 - g0) * (x - x0)) / (x1 - x0);
  }
  return GS[n][1];
}

function tempFromLogA(la) {
  const base = T_CMB0 * Math.pow(10, LA_TODAY - la);
  let T = base;
  for (let i = 0; i < 4; i++) T = base * Math.cbrt(GS0 / gStar(T));   // g_s depends on T
  return Math.sqrt(T * T + T_DS * T_DS);                             // floored by the horizon
}

const tempAtYears = (y) => tempFromLogA(logA(Math.max(T_PLANCK_S, y * SPY)));
/* L = log10(years from now); past L ≈ 12 the floor is all that is left */
const tempAtFuture = (L) => (L > 24 ? T_DS : tempFromLogA(logA(AGE * SPY + Math.pow(10, L + LOG_SPY))));

/* the bar runs from the Planck wall to the de Sitter floor: 62 decades */
const T_TOP = 32.2, T_BOT = Math.log10(T_DS);
const tPos = (T) => Math.max(0, Math.min(1, (T_TOP - Math.log10(T)) / (T_TOP - T_BOT)));

const T_MARKS = [
  { T: 1.417e32, n: "the Planck temperature" },
  { T: 1e27,     n: "the grand unification scale" },
  { T: 1.6e15,   n: "the electroweak plasma" },
  { T: 5.5e12,   n: "the hottest thing ever made on Earth" },
  { T: 1e10,     n: "the furnace that cooked the helium" },
  { T: 1e9,      n: "the core of a supernova" },
  { T: 1.57e7,   n: "the core of the Sun" },
  { T: 5772,     n: "the surface of the Sun" },
  { T: 1811,     n: "molten iron" },
  { T: 373,      n: "boiling water" },
  { T: 288,      n: "a mild afternoon on Earth" },
  { T: 273.15,   n: "melting ice" },
  { T: 77,       n: "liquid nitrogen" },
  { T: 4.2,      n: "liquid helium" },
  { T: 2.7255,   n: "the microwave background today" },
  { T: 1e-10,    n: "the coldest laboratory on Earth" },
];

/* landmarks drawn on the gauge itself */
const T_TICKS = [[1.57e7, "the core of the Sun"], [273.15, "melting ice"]];
const T_DECADES = [1e30, 1e20, 1e10, 1, 1e-10, 1e-20];

const T_STOPS = [[0,"#C25E00"],[0.18,"#D9420B"],[0.36,"#C0362C"],
                 [0.54,"#C2478E"],[0.7,"#6D4AE0"],[0.86,"#4A3B8C"],[1,"#2B2740"]];
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function tempColor(T) {
  const p = tPos(T);
  let i = 1;
  while (i < T_STOPS.length - 1 && p > T_STOPS[i][0]) i++;
  const [p0, c0] = T_STOPS[i - 1], [p1, c1] = T_STOPS[i];
  const f = Math.max(0, Math.min(1, (p - p0) / (p1 - p0)));
  const A = rgbOf(c0), B = rgbOf(c1);
  return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * f)).join(",")})`;
}

function fmtTemp(T) {
  if (!isFinite(T) || T <= 0) return "0 K";
  if (T >= 1e5 || T < 1e-2) return `${sci(T, 2)} K`;
  if (T >= 1000) return `${Math.round(T).toLocaleString("en-US")} K`;
  if (T >= 10) return `${T.toFixed(1)} K`;
  return `${T.toPrecision(4)} K`;
}

function shortTemp(T) {
  if (!isFinite(T) || T <= 0) return "0 K";
  if (T >= 1e5 || T < 1e-2) return `${sci(T, 1)} K`;
  if (T >= 1000) return `${Math.round(T).toLocaleString("en-US")} K`;
  if (T >= 10) return `${T.toFixed(1)} K`;
  return `${T.toPrecision(3)} K`;
}

/* Celsius stops being a useful thought somewhere above a furnace */
function fmtCelsius(T) {
  if (!isFinite(T) || T > 1e4) return null;
  const c = T - 273.15;
  const a = Math.abs(c);
  const d = a >= 1000 ? Math.round(a).toLocaleString("en-US") : a.toFixed(T < 1 ? 2 : 1);
  return `${c < 0 ? "−" : ""}${d} °C`;
}

function tempNote(T) {
  if (!isFinite(T) || T <= 0) return "Nothing left to measure.";
  if (T < T_DS * 1.05) return "The floor. Only the horizon's own glow is left, and it never fades.";
  let best = T_MARKS[0], bd = Infinity;
  for (const m of T_MARKS) {
    const d = Math.abs(Math.log10(T / m.T));
    if (d < bd) { bd = d; best = m; }
  }
  const r = T / best.T;
  if (r > 1 / 1.3 && r < 1.3) return `About ${best.n}.`;
  const x = r > 1 ? r : 1 / r;
  return `${x >= 1e4 ? sci(x, 1) : sigFigs(x)}× ${r > 1 ? "hotter" : "colder"} than ${best.n}.`;
}

/* ─────────────────────────  AUDIO  ───────────────────────── */

function buildAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();

  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const len = Math.floor(ctx.sampleRate * 0.6);
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;

  /* The hum.
     A drone that holds still is just a tone. This one is built to wander:
     three voices, a cutoff, a tremolo and a band of air, each pushed by its
     own slow oscillator. The rates share no common multiple, so the shape
     they add up to takes the better part of an hour to repeat. Nothing here
     is driven from React — it is all scheduled in the graph and left alone. */
  const humG = ctx.createGain(); humG.gain.value = 0;        // on/off
  const humTrem = ctx.createGain(); humTrem.gain.value = 1;  // breathing
  const humF = ctx.createBiquadFilter();
  humF.type = "lowpass"; humF.frequency.value = 240; humF.Q.value = 6;
  humF.connect(humTrem); humTrem.connect(humG); humG.connect(master);

  /* a free-running oscillator wired into one parameter, at some depth */
  const lfo = (rate, depth, target, type = "sine") => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = rate;
    const g = ctx.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(target); o.start();
    return { o, g };
  };

  /* root, a beating near-unison, and a sub an octave down */
  const humVoices = [
    { mul: 1,    lvl: 0.50, type: "sawtooth", rate: 0.047, cents: 7 },
    { mul: 1.02, lvl: 0.45, type: "sawtooth", rate: 0.031, cents: 11 },
    { mul: 0.5,  lvl: 0.32, type: "triangle", rate: 0.019, cents: 5 },
  ].map(({ mul, lvl, type, rate, cents }) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = 46 * mul;
    const g = ctx.createGain(); g.gain.value = lvl;
    o.connect(g); g.connect(humF); o.start();
    lfo(rate, cents, o.detune);            // a few cents of drift, forever
    return { o, mul };
  });

  /* a thin band of moving air, outside the drone's own filter */
  const humAir = ctx.createBufferSource();
  humAir.buffer = noiseBuf; humAir.loop = true;
  const airF = ctx.createBiquadFilter();
  airF.type = "bandpass"; airF.frequency.value = 430; airF.Q.value = 1.1;
  const airG = ctx.createGain(); airG.gain.value = 0.09;
  humAir.connect(airF); airF.connect(airG); airG.connect(humTrem);
  humAir.start();
  lfo(0.013, 260, airF.frequency, "triangle");

  /* two cutoff sweeps and two tremolos, all at unrelated rates */
  const humSweepA = lfo(0.037, 70, humF.frequency);
  const humSweepB = lfo(0.011, 30, humF.frequency, "triangle");
  const humTremA = lfo(0.083, 0.13, humTrem.gain);
  lfo(0.052, 0.07, humTrem.gain, "triangle");
  let humCut = 240;

  const now = () => ctx.currentTime;
  let lastClack = 0;

  const noise = (dur, freq, q, gain, type = "bandpass") => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    const t = now();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  };

  const tone = (freq, dur, gain, type = "sine", delay = 0) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    const t = now() + delay;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  };

  return {
    ctx,
    unlock() { if (ctx.state === "suspended") ctx.resume(); },
    setEnabled(on) {
      const t = now();
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(on ? 0.85 : 0.0001, t, 0.05);
    },
    clack(strength = 1) {
      const t = now();
      if (t - lastClack < 0.035) return;
      lastClack = t;
      noise(0.045, 1800 + Math.random() * 500, 1.4, 0.16 * strength);
      tone(150 + Math.random() * 30, 0.05, 0.08 * strength, "square");
    },
    bell() {
      lastClack = now();
      noise(0.03, 2600, 2, 0.1);
      [2093, 3136, 4186].forEach((f, i) => tone(f, 1.1 - i * 0.25, 0.09 - i * 0.02, "sine"));
    },
    /* future events get a colder, hollower tone than the bell */
    chime() {
      lastClack = now();
      [880, 1174.7, 1760].forEach((f, i) => tone(f, 1.6 - i * 0.3, 0.075 - i * 0.015, "sine", i * 0.02));
      noise(0.6, 900, 0.7, 0.03);
    },
    thud() { noise(0.09, 260, 0.8, 0.3, "lowpass"); tone(74, 0.16, 0.16, "triangle"); },
    tick() { noise(0.02, 3200, 3, 0.05); },
    /* crossing into the future: a downward sweep, the machine changing gear */
    gearshift() {
      const o = ctx.createOscillator(); o.type = "sawtooth";
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 8;
      const g = ctx.createGain();
      const t = now();
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 1.1);
      f.frequency.setValueAtTime(1800, t);
      f.frequency.exponentialRampToValueAtTime(160, t + 1.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t + 1.3);
    },
    /* the end of the log: everything decays away to nothing */
    heatDeath() {
      [130.8, 196, 261.6].forEach((f, i) => tone(f, 4.5, 0.06, "sine", i * 0.5));
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass";
      const g = ctx.createGain();
      const t = now();
      f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(60, t + 5);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + 5.6);
    },
    setHum(on, speed, future) {
      const t = now();
      humG.gain.setTargetAtTime(on ? (future ? 0.083 : 0.102) : 0, t, 0.25);
      if (on && isFinite(speed)) {
        const oct = Math.max(0, Math.min(20, Math.log10(speed))) / 20;
        const base = (future ? 26 : 40) + oct * (future ? 20 : 46);
        humVoices.forEach(({ o, mul }) => o.frequency.setTargetAtTime(base * mul, t, 0.4));
        humCut = (future ? 110 : 180) + oct * (future ? 400 : 900);
        humF.frequency.setTargetAtTime(humCut, t, 0.4);
        /* the sweeps travel with the cutoff, so the wander scales with the gear */
        humSweepA.g.gain.setTargetAtTime(humCut * 0.42, t, 0.6);
        humSweepB.g.gain.setTargetAtTime(humCut * 0.20, t, 0.6);
        /* past the present the drone slows down and breathes deeper */
        humSweepA.o.frequency.setTargetAtTime(future ? 0.021 : 0.037, t, 1);
        humTremA.g.gain.setTargetAtTime(future ? 0.2 : 0.13, t, 1);
      }
    },
    /* a checkpoint makes the machine lean into it */
    humBump(strength = 1) {
      const t = now();
      humTrem.gain.setTargetAtTime(1 + 0.45 * strength, t, 0.05);
      humTrem.gain.setTargetAtTime(1, t + 0.14, 0.45);
      humF.frequency.setTargetAtTime(humCut * (1 + 0.7 * strength), t, 0.06);
      humF.frequency.setTargetAtTime(humCut, t + 0.18, 0.6);
    },
    close() { try { ctx.close(); } catch (e) {} },
  };
}

/* ─────────────────────────  COMPONENT  ───────────────────────── */

const INIT = { sim: 0, L: 0, p: 0, wall: 0, idx: 0, fidx: 0, phase: "past", log: [] };

export default function RunTheUniverse() {
  const [raw, setRaw] = useState("1000000");
  const [run, setRun] = useState(INIT);
  const [going, setGoing] = useState(false);
  const [sound, setSound] = useState(true);

  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const logRef = useRef(null);
  const audioRef = useRef(null);
  const pendingRef = useRef({ tier: 0, future: false });

  const speed = useMemo(() => {
    const v = parseFloat(raw.replace(/[,x×\s]/gi, ""));
    return isFinite(v) && v > 0 ? v : NaN;
  }, [raw]);

  const valid = isFinite(speed);
  const logSpeed = valid ? Math.log10(speed) : 0;
  const wall = valid ? (AGE * SPY) / speed : NaN;
  const stamp = valid ? stampFor(wall) : null;
  const sliderPos = valid ? Math.max(0, Math.min(20, logSpeed)) : 6;
  const future = run.phase === "future";

  /* wall clock to reach a future milestone, in log seconds */
  const logWallFor = (L) => L + LOG_SPY - logSpeed;

  const audio = useCallback(() => {
    if (!audioRef.current) audioRef.current = buildAudio();
    const a = audioRef.current;
    if (a) { a.unlock(); a.setEnabled(sound); }
    return sound ? a : null;
  }, [sound]);

  useEffect(() => () => audioRef.current?.close(), []);
  useEffect(() => { audioRef.current?.setEnabled(sound); }, [sound]);
  useEffect(() => { audioRef.current?.setHum(going && sound, speed, future); }, [going, sound, speed, future]);

  /* run loop: linear years until today, then logarithmic gear */
  useEffect(() => {
    if (!going || !valid) return;
    lastRef.current = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.25, (now - lastRef.current) / 1000);
      lastRef.current = now;
      setRun((s) => {
        if (s.phase === "done") return s;
        let { sim, L, p, idx, fidx, phase, log } = s;
        const w = s.wall + dt;
        const push = (m, isF) => {
          if (log === s.log) log = s.log.slice();
          log.push({ ...m, wall: w, future: isF, temp: isF ? tempAtFuture(m.L) : tempAtYears(m.t) });
          const p = pendingRef.current;
          if (m.tier > p.tier || isF !== p.future) pendingRef.current = { tier: Math.max(p.tier, m.tier), future: isF };
        };

        if (phase === "past") {
          sim = Math.min(AGE, sim + (dt * speed) / SPY);
          while (idx < PAST.length && PAST[idx].t <= sim) push(PAST[idx++], false);
          if (sim >= AGE && idx >= PAST.length) { phase = "future"; pendingRef.current.gear = true; }
        } else {
          const gear = 1 + Math.max(0, logSpeed) / 12;
          const k = Math.min(FUTURE.length - 1, Math.floor(p));
          p = Math.min(FUTURE.length + 0.9, p + (dt * F_BEAT * gear) / F_W[k]);
          L = lFromP(p);
          while (fidx < FUTURE.length && p >= fidx + 1) push(FUTURE[fidx++], true);
          if (fidx >= FUTURE.length && p >= FUTURE.length + 0.9) phase = "done";
        }
        return { sim, L, p, wall: w, idx, fidx, phase, log };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [going, speed, valid, logSpeed]);

  /* one sound per frame, loudest event wins */
  useEffect(() => {
    const p = pendingRef.current;
    if (!p.tier && !p.gear) return;
    pendingRef.current = { tier: 0, future: p.future };
    const a = sound ? audioRef.current : null;
    if (!a) return;
    if (p.gear) { a.gearshift(); a.humBump(1.4); return; }
    if (p.tier >= 3) p.future ? a.chime() : a.bell();
    else a.clack(p.tier === 2 ? 1.3 : 1);
    a.humBump(p.tier >= 3 ? 1 : p.tier === 2 ? 0.5 : 0.28);
  }, [run.log.length, run.phase, sound]);

  useEffect(() => {
    if (run.phase === "done") {
      setGoing(false);
      if (sound) setTimeout(() => audioRef.current?.heatDeath(), 300);
    }
  }, [run.phase, sound]);

  const prevStamp = useRef(null);
  useEffect(() => {
    const txt = stamp?.text ?? null;
    if (txt && txt !== prevStamp.current && audioRef.current && sound) audioRef.current.thud();
    prevStamp.current = txt;
  }, [stamp, sound]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run.log.length]);

  const reset = () => { audio()?.tick(); setGoing(false); setRun(INIT); };

  const last = run.log.length ? run.log[run.log.length - 1] : null;
  const era = future ? fEraFor(run.L) : eraFor(run.sim);
  const frac = future ? fPos(run.L) : run.sim / AGE;
  const bands = future ? F_ERAS : ERAS;
  const grow = (e) => (future ? fPos(e.end) - fPos(e.start) : e.span);
  const done = run.phase === "done";
  const temp = future ? tempAtFuture(run.L) : tempAtYears(run.sim);
  const tempC = fmtCelsius(temp);

  return (
    <div className="rtu-desk">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&display=swap');

.rtu-desk{
  --paper:#F2F4E8; --band:#DDEBD6; --ink:#20261F; --faint:#63715F; --rule:#A9B6A4;
  --violet:#6D4AE0; --magenta:#C2478E; --amber:#E08A18; --teal:#0E8C8C; --green:#4C9A3F; --crimson:#C0362C;
  min-height:100vh; padding:20px 10px 40px; box-sizing:border-box;
  background:#20241E; background-image:radial-gradient(120% 80% at 15% -10%, #3A3F33 0%, #1C201A 65%);
  font-family:'IBM Plex Mono', ui-monospace, Menlo, monospace; color:var(--ink); -webkit-font-smoothing:antialiased;
}
.rtu-desk *{box-sizing:border-box;}
.rtu-sheet{max-width:860px; margin:0 auto; background:var(--paper);
  display:grid; grid-template-columns:22px 1fr 22px; box-shadow:0 18px 44px rgba(0,0,0,.5); overflow:hidden;}
.rtu-spectrum{grid-column:1 / -1; display:flex; height:7px;}
.rtu-spectrum i{flex:1;}
.rtu-sprocket{background-image:radial-gradient(circle at 50% 12px, #20241E 0 4px, transparent 4.6px);
  background-size:100% 24px; background-repeat:repeat-y; border-right:1px dashed var(--rule);}
.rtu-sprocket.r{border-right:none; border-left:1px dashed var(--rule);}
.rtu-body{padding:18px 16px 24px; min-width:0;}

.rtu-card{border:1px solid var(--ink); padding:9px 11px 12px; margin-bottom:20px; background:#fff;}
.rtu-card-top{display:flex; justify-content:space-between; gap:8px 14px; flex-wrap:wrap;
  border-bottom:1px solid var(--ink); padding-bottom:7px; margin-bottom:9px;
  font-family:'IBM Plex Sans Condensed','IBM Plex Mono',sans-serif;
  font-weight:700; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint);}
.rtu-card-top b{color:var(--crimson);}
.rtu-title{font-family:'Archivo Black','Arial Black',sans-serif; font-weight:400;
  font-size:clamp(25px,7.6vw,46px); line-height:.96; letter-spacing:-.02em; text-transform:uppercase; margin:2px 0 10px;}
.rtu-title em{font-style:normal; color:var(--violet);}
.rtu-lede{font-size:13px; line-height:1.55; max-width:52ch; color:#394037; margin:0;}
.rtu-meta{display:grid; grid-template-columns:repeat(auto-fit,minmax(146px,1fr)); gap:4px 16px;
  margin-top:11px; font-size:10.5px; color:var(--faint);}
.rtu-meta b{color:var(--ink); font-weight:500;}

.rtu-eyebrow{font-family:'IBM Plex Sans Condensed','IBM Plex Mono',sans-serif; font-weight:700;
  font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--faint);
  display:flex; align-items:center; gap:9px; margin:0 0 8px;}
.rtu-eyebrow::after{content:""; flex:1; height:1px; background:var(--rule);}

.rtu-inputwrap{position:relative; display:flex;}
.rtu-input{flex:1; min-width:0; width:100%; font:500 21px/1 'IBM Plex Mono',monospace;
  padding:14px 38px 14px 12px; background:#fff; border:2px solid var(--ink); color:var(--ink);
  border-radius:0; -webkit-appearance:none;}
.rtu-input:focus{outline:none; border-color:var(--violet); box-shadow:0 0 0 3px rgba(109,74,224,.18);}
.rtu-x{position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:18px; color:var(--faint); pointer-events:none;}

.rtu-slider{-webkit-appearance:none; appearance:none; width:100%; margin:18px 0 6px; background:transparent;}
.rtu-slider::-webkit-slider-runnable-track{height:10px; border:1px solid var(--ink);
  background:linear-gradient(90deg,var(--violet),var(--magenta),var(--amber),var(--teal),var(--green));}
.rtu-slider::-moz-range-track{height:10px; border:1px solid var(--ink);
  background:linear-gradient(90deg,var(--violet),var(--magenta),var(--amber),var(--teal),var(--green));}
.rtu-slider::-webkit-slider-thumb{-webkit-appearance:none; width:26px; height:26px; margin-top:-9px;
  background:var(--paper); border:2px solid var(--ink); box-shadow:0 2px 0 rgba(0,0,0,.25); cursor:pointer;}
.rtu-slider::-moz-range-thumb{width:24px; height:24px; background:var(--paper);
  border:2px solid var(--ink); box-shadow:0 2px 0 rgba(0,0,0,.25); cursor:pointer;}
.rtu-scale{display:flex; justify-content:space-between; font-size:10px; color:var(--faint);}
.rtu-hint{font-size:11.5px; color:var(--crimson); margin:8px 0 0;}

.rtu-presets{display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:7px; margin-top:14px;}
.rtu-preset{text-align:left; background:#fff; border:1px solid var(--rule); border-left:5px solid var(--ec);
  padding:10px; min-height:52px; font-family:'IBM Plex Mono',monospace; color:var(--ink);
  cursor:pointer; line-height:1.3; transition:background .12s, transform .08s;}
.rtu-preset:hover{background:var(--band);}
.rtu-preset:active{transform:translateY(1px);}
.rtu-preset .n{display:block; font-size:13px; font-weight:600;}
.rtu-preset .l{display:block; font-size:10.5px; color:var(--faint);}

.rtu-result{position:relative; margin:24px 0 6px; padding:16px 0 14px;
  border-top:3px double var(--ink); border-bottom:3px double var(--ink);}
.rtu-big{font-family:'Archivo Black','Arial Black',sans-serif; color:var(--violet);
  font-size:clamp(26px,8.6vw,54px); line-height:1.03; letter-spacing:-.025em; margin:2px 0 10px; overflow-wrap:anywhere;}
.rtu-compare{font-size:13px; line-height:1.5; color:#394037; max-width:46ch; margin:0;}
.rtu-secondary{margin:14px 0 0; padding-top:11px; border-top:1px dashed var(--rule);
  display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:9px 16px;}
.rtu-secondary div{font-size:11px; color:var(--faint); line-height:1.45;}
.rtu-secondary b{display:block; font-size:15px; color:var(--sc2); font-weight:600; margin-top:2px; overflow-wrap:anywhere;}
.rtu-stamp{display:inline-block; margin-top:12px; transform:rotate(-3.5deg);
  font-family:'Archivo Black','Arial Black',sans-serif; font-size:13px; letter-spacing:.05em;
  color:var(--sc); border:3px solid var(--sc); padding:6px 11px; box-shadow:0 0 0 1.5px var(--sc) inset;
  opacity:.9; animation:rtu-slam .22s cubic-bezier(.2,1.4,.5,1) both;}
@keyframes rtu-slam{from{transform:rotate(-3.5deg) scale(2.4); opacity:0;} to{transform:rotate(-3.5deg) scale(1); opacity:.9;}}

.rtu-controls{display:flex; gap:8px; flex-wrap:wrap; margin:20px 0 14px;}
.rtu-btn{flex:1 1 130px; min-height:50px;
  font-family:'IBM Plex Sans Condensed','IBM Plex Mono',sans-serif; font-weight:700; font-size:12.5px;
  letter-spacing:.13em; text-transform:uppercase; padding:12px 14px; cursor:pointer;
  background:var(--ink); color:var(--paper); border:2px solid var(--ink); transition:opacity .12s, transform .08s;}
.rtu-btn:hover{opacity:.85;}
.rtu-btn:active{transform:translateY(1px);}
.rtu-btn.go{background:var(--green); border-color:var(--green);}
.rtu-btn.go[data-going="true"]{background:var(--amber); border-color:var(--amber); color:#20261F;}
.rtu-btn.ghost{background:#fff; color:var(--ink);}
.rtu-btn:disabled{opacity:.32; cursor:not-allowed;}
.rtu-btn.snd{background:#fff; color:var(--faint); border-color:var(--rule);}
.rtu-btn.snd[data-on="true"]{background:var(--violet); border-color:var(--violet); color:#fff;}

.rtu-status{display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; font-size:11.5px; color:var(--faint); margin-bottom:9px;}
.rtu-chip{display:inline-flex; align-items:center; gap:6px; font-weight:600; color:#fff; background:var(--ec);
  padding:4px 9px; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase;}
.rtu-status b{color:var(--ink); font-weight:600;}

.rtu-axis{font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin:0 0 5px;}
.rtu-track{position:relative; display:flex; height:22px; border:1px solid var(--ink); background:#fff;}
.rtu-track > i{display:block; min-width:2px; opacity:.22;}
.rtu-fill{position:absolute; inset:0; display:flex;}
.rtu-fill i{display:block; min-width:2px;}
.rtu-needle{position:absolute; top:-4px; bottom:-4px; width:3px; background:var(--ink); transform:translateX(-1px);}
.rtu-legend{display:flex; flex-wrap:wrap; gap:4px 12px; margin:7px 0 0; font-size:10px; color:var(--faint);}
.rtu-legend span{display:inline-flex; align-items:center; gap:5px; white-space:nowrap;}
.rtu-legend i{width:9px; height:9px; display:inline-block;}
.rtu-pct{font-size:11px; color:var(--faint); margin-top:5px;}

.rtu-thermo{display:grid; grid-template-columns:minmax(180px,1fr) minmax(210px,1.3fr); gap:14px 20px;
  align-items:end; border:1px solid var(--ink); background:#fff; padding:12px 13px 13px; margin-top:14px;}
.rtu-thermo-read{min-width:0;}
.rtu-thermo-k{font-family:'Archivo Black','Arial Black',sans-serif; font-weight:400;
  font-size:clamp(23px,6.4vw,36px); line-height:1; letter-spacing:-.025em;
  color:var(--tc); overflow-wrap:anywhere;}
.rtu-thermo-c{font-size:12px; color:var(--faint); margin-top:6px;}
.rtu-thermo-note{font-size:11.5px; line-height:1.45; color:#394037; margin:8px 0 0; max-width:34ch;}
.rtu-thermo-gauge{min-width:0;}
.rtu-thermo-bar{position:relative; height:16px; border:1px solid var(--ink);
  background:linear-gradient(90deg,#FFF6DC 0%,#FFE39A 6%,#F2B705 14%,#E0620D 26%,#C0362C 38%,
    #C2478E 52%,#6D4AE0 68%,#3B4AA0 84%,#1B1F3B 100%);}
.rtu-thermo-bar i{position:absolute; top:3px; bottom:3px; width:1px; background:rgba(0,0,0,.5);}
.rtu-thermo-bar i.now{top:-2px; bottom:-2px; width:2px; background:#fff; box-shadow:0 0 0 1px rgba(0,0,0,.6);}
.rtu-thermo-needle{position:absolute; top:-5px; bottom:-5px; width:3px;
  background:var(--ink); transform:translateX(-1px);}
.rtu-thermo-scale{position:relative; height:12px; margin-top:5px; font-size:9.5px; color:var(--faint);}
.rtu-thermo-scale span{position:absolute; transform:translateX(-50%); white-space:nowrap;}
.rtu-thermo-cap{font-size:10px; line-height:1.5; color:var(--faint); margin:7px 0 0;}

.rtu-log{border:1px solid var(--ink); background:#fff; max-height:320px; overflow-y:auto;
  -webkit-overflow-scrolling:touch; margin-top:14px;}
.rtu-row{display:grid; gap:2px 10px; padding:7px 10px 8px; border-left:5px solid var(--ec);
  grid-template-columns:66px 92px 78px auto 1fr; grid-template-areas:"off yr tp nm nt";
  align-items:baseline; font-size:11.5px; line-height:1.35; animation:rtu-feed .2s ease-out both;}
.rtu-row:nth-child(even){background:var(--band);}
.rtu-row .off{grid-area:off; color:var(--faint);}
.rtu-row .yr{grid-area:yr; color:var(--faint); text-align:right; white-space:nowrap;}
.rtu-row .tp{grid-area:tp; text-align:right; white-space:nowrap; color:var(--tc); font-weight:500;}
.rtu-row .nm{grid-area:nm; font-weight:600; letter-spacing:.04em; color:var(--ec); white-space:nowrap;}
.rtu-row .nt{grid-area:nt; color:var(--faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.rtu-row .nt .ts{display:none;}
.rtu-row.major .nm{background:var(--ec); color:#fff; padding:1px 5px;}
.rtu-row.now{border-top:3px solid var(--ink); border-bottom:3px solid var(--ink); background:#FFF6E0;}
@keyframes rtu-feed{from{opacity:0; transform:translateY(-8px);} to{opacity:1; transform:none;}}
.rtu-empty{padding:20px 12px; font-size:12px; color:var(--faint); line-height:1.6;}
.rtu-empty b{color:var(--ink);}

.rtu-foot{margin-top:18px; padding-top:12px; border-top:1px solid var(--rule);
  font-size:11px; color:var(--faint); line-height:1.75;}
.rtu-foot b{color:var(--ink); font-weight:500;}
.rtu-foot em{font-style:normal; color:var(--violet); font-weight:600;}

.rtu-desk :focus-visible{outline:3px solid var(--magenta); outline-offset:2px;}

@media (max-width:600px){
  .rtu-desk{padding:12px 0 28px;}
  .rtu-sheet{grid-template-columns:12px 1fr 12px;}
  .rtu-sprocket{background-image:radial-gradient(circle at 50% 12px, #20241E 0 3px, transparent 3.6px);}
  .rtu-body{padding:14px 12px 20px;}
  .rtu-card{padding:8px 10px 10px;}
  .rtu-card-top{font-size:9px; letter-spacing:.1em; gap:4px 10px;}
  .rtu-presets{grid-template-columns:1fr 1fr; gap:6px;}
  .rtu-preset{padding:9px 8px;}
  .rtu-preset .n{font-size:12px;}
  .rtu-preset .l{font-size:9.5px; line-height:1.25;}
  .rtu-btn{flex:1 1 100%;}
  .rtu-thermo{grid-template-columns:1fr; gap:12px; align-items:stretch;}
  .rtu-row{grid-template-columns:auto auto 1fr; grid-template-areas:"off tp nm" "nt nt nt"; padding:8px 10px 9px;}
  .rtu-row .tp{text-align:left;}
  .rtu-row .yr{display:none;}
  .rtu-row .nm{white-space:normal;}
  .rtu-row .nt{white-space:normal; font-size:11px; line-height:1.4;}
  .rtu-row .nt .ts{display:inline; color:var(--ec); font-weight:600;}
  .rtu-log{max-height:58vh;}
  .rtu-legend{font-size:9.5px; gap:3px 9px;}
}
@media (prefers-reduced-motion:reduce){ .rtu-row,.rtu-stamp{animation:none !important;} }
      `}</style>

      <div className="rtu-sheet">
        <div className="rtu-spectrum" aria-hidden="true">
          {[...ERAS, ...F_ERAS].map((e) => <i key={e.key} style={{ background: e.color }} />)}
        </div>
        <div className="rtu-sprocket" aria-hidden="true" />
        <div className="rtu-body">

          <div className="rtu-card">
            <div className="rtu-card-top">
              <span>Job — universe-full-run</span>
              <span>Queue: deep-time</span>
              <span>Nodes: <b>1 (you)</b></span>
            </div>
            <h1 className="rtu-title">How long to run <em>the universe</em></h1>
            <p className="rtu-lede">
              Pick a speed. The 13.787-billion-year backlog gets divided by it — and then the run
              keeps going, past today, out to the last black hole and whatever is left after that.
            </p>
            <div className="rtu-meta">
              <div>Span: <b>Big Bang → 10¹⁵⁰⁰ years</b></div>
              <div>Checkpoints: <b>{PAST.length + FUTURE.length}</b></div>
              <div>Eras: <b>{ERAS.length + F_ERAS.length}</b></div>
            <div>Thermometer: <b>10³¹ → 10⁻³⁰ K</b></div>
            </div>
          </div>

          <p className="rtu-eyebrow">Set the speed</p>
          <div className="rtu-inputwrap">
            <input className="rtu-input" type="text" inputMode="decimal" value={raw}
              onChange={(e) => setRaw(e.target.value)} aria-label="Speed multiplier" />
            <span className="rtu-x">×</span>
          </div>
          <input className="rtu-slider" type="range" min="0" max="20" step="0.01" value={sliderPos}
            onChange={(e) => {
              const v = Math.pow(10, parseFloat(e.target.value));
              setRaw(v >= 1e5 ? v.toPrecision(3) : String(Math.round(v * 100) / 100));
              audio()?.tick();
            }} aria-label="Speed multiplier, logarithmic" />
          <div className="rtu-scale"><span>1×</span><span>10¹⁰×</span><span>10²⁰×</span></div>
          {!valid && <p className="rtu-hint">Enter a number above 0. Scientific notation like 2.5e9 works.</p>}

          <div className="rtu-presets">
            {PRESETS.map((p, i) => (
              <button key={p.label} className="rtu-preset" style={{ "--ec": ERAS[i % ERAS.length].color }}
                onClick={() => { setRaw(p.v >= 1e5 ? p.v.toPrecision(3) : String(p.v)); audio()?.clack(0.8); }}>
                <span className="n">{p.v >= 1e5 ? sci(p.v, 2) : p.v}×</span>
                <span className="l">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="rtu-result">
            <p className="rtu-eyebrow">Wall clock to reach today</p>
            <div className="rtu-big">{valid ? fmtDuration(wall) : "—"}</div>
            <p className="rtu-compare">{valid ? comparison(wall) : "Waiting on a valid speed."}</p>
            {stamp && <div className="rtu-stamp" key={stamp.text} style={{ "--sc": stamp.color }}>{stamp.text}</div>}
            {valid && (
              <div className="rtu-secondary">
                <div style={{ "--sc2": "#B8892A" }}>
                  ...and on to the last star
                  <b>{fmtLogDuration(logWallFor(14))}</b>
                </div>
                <div style={{ "--sc2": "#4A3B8C" }}>
                  ...and the last black hole
                  <b>{fmtLogDuration(logWallFor(100))}</b>
                </div>
                <div style={{ "--sc2": "#2B2740" }}>
                  ...and the end of the log
                  <b>{fmtLogDuration(logWallFor(L_MAX))}</b>
                </div>
              </div>
            )}
          </div>

          <div className="rtu-controls">
            <button className="rtu-btn go" data-going={going} disabled={!valid || done}
              onClick={() => { audio(); setGoing((g) => !g); }}>
              {going ? "Pause run" : run.wall > 0 ? "Resume run" : "Start run"}
            </button>
            <button className="rtu-btn ghost" onClick={reset} disabled={run.wall === 0}>Reset</button>
            <button className="rtu-btn snd" data-on={sound} aria-pressed={sound}
              onClick={() => {
                const next = !sound; setSound(next);
                if (next) {
                  if (!audioRef.current) audioRef.current = buildAudio();
                  audioRef.current?.unlock(); audioRef.current?.setEnabled(true); audioRef.current?.clack(0.9);
                }
              }}>
              {sound ? "◉ Sound on" : "○ Sound off"}
            </button>
          </div>

          <div className="rtu-status">
            <span className="rtu-chip" style={{ "--ec": era.color }}>{era.name}</span>
            {future
              ? <span><b>{fmtLogYears(run.L)}</b> from now</span>
              : <span><b>{fmtSimYears(run.sim)}</b> since the Big Bang</span>}
            {last && <span>Last: <b>{last.name}</b></span>}
          </div>

          <p className="rtu-axis">
            {future ? "Time from now — log scale, 1 yr → 10¹⁵⁰⁰ yr" : "Cosmic time — linear, drawn to true scale"}
          </p>
          <div className="rtu-track">
            {bands.map((e) => <i key={e.key} style={{ flexGrow: grow(e), background: e.color }} />)}
            <div className="rtu-fill" style={{ clipPath: `inset(0 ${100 - frac * 100}% 0 0)` }}>
              {bands.map((e) => <i key={e.key} style={{ flexGrow: grow(e), background: e.color }} />)}
            </div>
            <div className="rtu-needle" style={{ left: `${frac * 100}%` }} />
          </div>
          <p className="rtu-pct">
            {future
              ? `Checkpoint ${Math.min(FUTURE.length, run.fidx)} of ${FUTURE.length} past today — logarithmic gear, one checkpoint at a time`
              : `${(frac * 100).toPrecision(3)}% of cosmic time simulated`}
          </p>
          <div className="rtu-legend">
            {bands.map((e) => <span key={e.key}><i style={{ background: e.color }} />{e.name}</span>)}
          </div>

          <div className="rtu-thermo" style={{ "--tc": tempColor(temp) }}>
            <div className="rtu-thermo-read">
              <p className="rtu-eyebrow">Temperature of the universe</p>
              <div className="rtu-thermo-k">{fmtTemp(temp)}</div>
              {tempC && <div className="rtu-thermo-c">{tempC}</div>}
              <p className="rtu-thermo-note">{tempNote(temp)}</p>
            </div>
            <div className="rtu-thermo-gauge">
              <div className="rtu-thermo-bar">
                {T_TICKS.map(([t, n]) => (
                  <i key={t} style={{ left: `${tPos(t) * 100}%` }} title={`${n} — ${fmtTemp(t)}`} />
                ))}
                <i className="now" style={{ left: `${tPos(T_CMB0) * 100}%` }} title={`today — ${fmtTemp(T_CMB0)}`} />
                <div className="rtu-thermo-needle" style={{ left: `${tPos(temp) * 100}%` }} />
              </div>
              <div className="rtu-thermo-scale" aria-hidden="true">
                {T_DECADES.map((t) => (
                  <span key={t} style={{ left: `${tPos(t) * 100}%` }}>
                    10{sup(Math.round(Math.log10(t)))}
                  </span>
                ))}
              </div>
              <p className="rtu-thermo-cap">
                Log scale, hot to cold — the Planck wall on the left, the white line
                is today, and the right-hand end is the de Sitter floor at {fmtTemp(T_DS)}:
                the coldest temperature this universe will ever hold.
              </p>
            </div>
          </div>

          <div className="rtu-log" ref={logRef}>
            {run.log.length === 0 ? (
              <p className="rtu-empty">
                Nothing has happened yet. Press <b>Start run</b> and the paper starts feeding.
                A clack for routine events, a bell for the ones that changed everything, and
                a colder chime once the log passes today. The thermometer above reads the
                temperature of the universe at each moment, from the Planck wall down.
              </p>
            ) : (
              run.log.map((m, i) => {
                const c = m.future ? fEraFor(m.L).color : eraFor(m.t).color;
                const label = m.future ? `T+${shortLogYears(m.L)}` : fmtSimYears(m.t);
                const isNow = !m.future && m.name === "TODAY";
                return (
                  <div className={`rtu-row${m.tier >= 3 ? " major" : ""}${isNow ? " now" : ""}`}
                       key={i} style={{ "--ec": c }}>
                    <span className="off">{fmtOffset(m.wall)}</span>
                    <span className="yr">{label}</span>
                    <span className="tp" style={{ "--tc": tempColor(m.temp) }}>{shortTemp(m.temp)}</span>
                    <span className="nm">{m.name}</span>
                    <span className="nt"><span className="ts">{label} · </span>{m.note}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="rtu-foot">
            Everything up to <b>TODAY</b> is simulated at your multiplier, in real seconds. Past that,
            no multiplier can help — reaching the last black hole at <em>{sci(AGE * SPY)}×</em> would
            still take {fmtLogDuration(100 + LOG_SPY - Math.log10(AGE * SPY))} — so the machine drops into
            logarithmic gear and walks the remaining {FUTURE.length} checkpoints at a steady beat,
            printing the true wait beside each one. The two longest pauses are real gaps in the
            record: nothing much is known to happen between 10¹³⁹ and 10¹¹⁰⁰ years.
            The thermometer runs on the scale factor — <em>T ∝ g_s^(−1/3)/a</em>, which puts
            recombination at {shortTemp(tempAtYears(3.8e5))} and today at {shortTemp(T_CMB0)}.
            It bottoms out at <em>{fmtTemp(T_DS)}</em>, the glow of the cosmological horizon
            itself: the background falls below that around {fmtLogYears(12.08)} from now and
            nothing in this universe is ever colder again.
          </div>

        </div>
        <div className="rtu-sprocket r" aria-hidden="true" />
      </div>
    </div>
  );
}
