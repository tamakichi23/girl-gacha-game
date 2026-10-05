import { defineConfig } from 'vite';

export default defineConfig({
  // The project is served from /<repository-name>/ on GitHub Pages.
  base: process.env.GITHUB_PAGES === 'true' ? '/girl-gacha-game/' : '/',
});
