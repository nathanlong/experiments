// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import { glob } from "glob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// Create object for every endpoint
const entryPoints = Object.fromEntries(
  glob.sync("src/**/*.html").map((file) => [
    // This remove `src/` as well as the file extension from each
    // file, so e.g. src/nested/foo.js becomes nested/foo
    path.relative(
      "src",
      file.slice(0, file.length - path.extname(file).length),
    ),
    // This expands the relative paths to absolute paths, so e.g.
    // src/nested/foo becomes /project/src/nested/foo.js
    fileURLToPath(new URL(file, import.meta.url)),
  ]),
);

// Combine experiment meta
const postMeta = Object.fromEntries(
  glob.sync("src/**/*.json", { ignore: 'src/public/postData.json'}).map((file) => [
    path.relative(
      "src",
      file.slice(0, file.length - path.extname(file).length),
    ),
    JSON.parse(fs.readFileSync(file, 'utf8'))
  ]),
)

// Write to JSON file, used for index page
fs.writeFile("src/public/postData.json", JSON.stringify(postMeta), "utf8", () => {});

export default defineConfig({
  root: "src",
  base: "/experiments/",
  build: {
    outDir: "../dist/",
    rollupOptions: {
      input: entryPoints,
    },
  },
});
