import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['**/*.ts', '!node_modules', '!dist'],
	outDir: 'dist',
	clean: true,
	dts: true,
	format: ['cjs'],
	loader: {
		'.sql': 'copy',
		'.html': 'copy',
	},
})
