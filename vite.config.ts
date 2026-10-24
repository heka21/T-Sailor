import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'

const mdxPlugin = mdx({ remarkPlugins: [remarkGfm] })

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdxPlugin,
      // Leave `.mdx?raw` imports (the search index reads lesson text) as plain strings.
      transform(code, id) {
        return id.includes('?raw') ? null : mdxPlugin.transform!.call(this, code, id)
      },
    },
    react({ include: /\.(mdx|tsx?|jsx?)$/ }),
    tailwindcss(),
  ],
  // One bundle is fine for a LAN-served study app (~250 kB gzipped).
  build: { chunkSizeWarningLimit: 1200 },
  // `pnpm dev:api` serves accounts & progress; in Docker nginx does this proxying.
  server: { proxy: { '/api': 'http://localhost:8091' } },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
