import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    tokens: './src/tokens/index.ts',
    components: './src/components/index.ts',
    auth: './src/auth/index.ts',
    query: './src/query/index.ts',
    endpoints: './src/endpoints/index.ts',
    lib: './src/lib/index.ts',
    types: './src/types/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  minify: false,
  treeshake: true,
});
