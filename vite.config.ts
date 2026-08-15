import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// A defineConfig a vitest/config-ból jön, nem a vite-ból: csak ez a
// változat ismeri a `test` blokkot, a vite sajátja típushibát adna rá.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // A jsdom felállítása ~20 másodperc, a tesztek zöme viszont tiszta
    // logika és nem kér böngészőt. A komponens-tesztek egyenként kérnek
    // jsdom-ot egy "@vitest-environment jsdom" docblock-kal.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
