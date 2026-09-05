/* Bundles the app into one self-contained HTML file that runs from file:// —
   no install, no dev server, no network except the webfonts. Regenerate with
   `npm run standalone` after changing the component. */
import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const OUT = "run-the-universe.html";

const result = await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",                                   // file:// blocks ES modules
  target: ["chrome100", "safari15", "firefox100"],
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".jsx": "jsx" },
  write: false,
  legalComments: "none",
});

const js = result.outputFiles[0].text;

writeFileSync(
  OUT,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>How long to run the universe</title>
  </head>
  <body style="margin: 0">
    <div id="root"></div>
    <script>${js}</script>
  </body>
</html>
`
);

console.log(`${OUT} — ${(js.length / 1024).toFixed(0)} KB of inlined JS`);
