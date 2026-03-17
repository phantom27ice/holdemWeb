import { defineConfig, mergeConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import baseConfig from './vite.config.js'

export default mergeConfig(
  baseConfig,
  defineConfig({
    publicDir: false,
    plugins: [
      viteSingleFile({
        removeViteModuleLoader: true,
      }),
    ],
    build: {
      outDir: 'dist-inline',
      emptyOutDir: true,
      sourcemap: false,
    },
  }),
)
