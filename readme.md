# Experiments

This is a playground for web tech, specifically for HTML, CSS, and JS.

## Creating

I have several janky bash scripts that handle setting up

`npm run new` - runs an interactive prompt that sets up a new template and data JSON file

`npm run deploy` - builds and deploys to `gh-pages` branch via a git worktree

## Templating

Each experiment is a Vite entrypoint, allowing me to `npm install` whatever I need, then Vite-magic handles the rest.

Vite also slurps up all the `data.json` files and builds a single JSON that I use to populate the index page. Less maintenance, one place to update and add content.
