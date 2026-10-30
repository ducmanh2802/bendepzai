import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';
import {collectPrecacheUrls, injectPrecacheManifest} from './scripts/sw-precache.mjs';

/**
 * T02C — replaces `__PRECACHE_MANIFEST__` inside dist/sw.js with the real
 * list of same-origin URLs (every JS/CSS chunk, fonts, icons) so the service
 * worker precaches the whole build output, including lazy chunks.
 *
 * T11B — the injection moved from `closeBundle` to `writeBundle` (guarded):
 * `closeBundle` is invoked twice by the bundler and runs BEFORE the chunks are
 * emitted, so it either threw "placeholder missing" on the second call or
 * produced a manifest without `/assets/*`. `writeBundle` sees the finished
 * build (public copy + every chunk), so the precache list is complete.
 */
function swPrecachePlugin() {
  let injected = false;
  return {
    name: 't02c-sw-precache',
    apply: undefined,
    writeBundle(_options: any) {
      if (injected) return;
      const outDir = path.resolve(_options?.dir ?? 'dist');
      const urls = collectPrecacheUrls(outDir);
      injectPrecacheManifest(path.join(outDir, 'sw.js'), urls);
      injected = true;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), swPrecachePlugin()],
    resolve: {
      alias: {
        // import.meta.dirname keeps this config ESM-native (no __dirname shim),
        // which is what Vite's native config loader expects.
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // T02C — keep react/react-dom out of the first-load entry chunk so
          // the main chunk budget (≤ 600 kB, goal ≤ 450 kB) survives the
          // ~1.300-question content expansion in T10–T14.
          // T11B — the Toán lesson bank (413 questions across 20 topics) lives
          // in its own `math-bank` chunk: the entry chunk stays ~550 kB while
          // the whole subject ships in one extra chunk.
          // T12B — the English lesson bank (Kid's Box-style units 1–12 in
          // `src/data/english/` + `englishCurriculum.ts`) gets the same
          // treatment so the entry chunk stays inside the 600 kB budget.
          // T11C — the Toán lesson bank (0–100 content in `src/data/math/`
          // + `src/data/mathCurriculum`) lives in its own `math-bank` chunk
          // so the entry chunk stays within budget after wiring the new units.
          // (Rolldown only accepts the function form of manualChunks.)
          manualChunks: (id: string) => {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/three')) {
              return 'three-vendor';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('/src/data/math/') || id.includes('/src/data/mathCurriculum')) {
              return 'math-bank';
            }
            if (id.includes('/src/data/english/') || id.includes('/src/data/englishCurriculum')) {
              return 'english-bank';
            }
            return undefined;
          },
        },
      },
    },
    test: {
      // The competition near-duplicate scan is O(n^2) over the bank; under
      // parallel worker startup it can exceed the 5s default. Give it headroom.
      testTimeout: 20000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env variable.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR == true to save CPU for agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
