import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/**/*.ts'],
	outDir: 'dist',
	clean: true,
	dts: false,
	format: ['cjs'],
	target: 'node22',
	sourcemap: true,
	loader: {
		'.sql': 'copy',
		'.html': 'copy',
	},
})
