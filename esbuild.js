const is_production = process.env.NODE_ENV === "production";

require('esbuild').build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/out.js',
  minify: is_production,
  sourcemap: 'external',
}).catch(() => process.exit(1))