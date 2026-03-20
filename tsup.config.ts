import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: false,
  clean: true,
  dts: true,
  entry: ['squid-tracer.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  platform: 'node',
  sourcemap: true,
  target: 'node20',
})
