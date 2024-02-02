// vite.config.js
import { defineConfig } from "vite";
import { splitVendorChunkPlugin } from 'vite'
import { glob } from "glob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// Create object for every endpoint for Rollup
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

// Build array of posts for index page automation
const postArray = glob
  .sync("src/**/*.json", { ignore: "src/public/postData.json" })
  .map((file) => JSON.parse(fs.readFileSync(file, "utf8")));

// Sort by date, requires everything to have a date
const sortedPosts = [...postArray].sort(function(a,b){
  return new Date(b.date) - new Date(a.date);
});

// Write posts to JSON
fs.writeFile(
  "src/public/postData.json",
  JSON.stringify(sortedPosts),
  "utf8",
  () => {},
);

export default defineConfig({
  root: "src",
  base: "/experiments/",
  build: {
    outDir: "../dist/",
    rollupOptions: {
      input: entryPoints,
    },
  },
  plugins: [splitVendorChunkPlugin()],
});
