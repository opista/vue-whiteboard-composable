import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import dts from 'vite-plugin-dts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    ...(command === 'build'
      ? [dts({ outDir: 'dist', tsconfigPath: './tsconfig.app.json', rollupTypes: true })]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ...(command === 'build' && {
    publicDir: false,
    build: {
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'VueWhiteboardComposable',
        formats: ['es', 'cjs', 'umd'],
        fileName: (format) =>
          format === 'es' ? 'index.js' : format === 'cjs' ? 'index.cjs' : 'index.umd.js',
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: { vue: 'Vue' },
        },
      },
    },
  }),
}))
