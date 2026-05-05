import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	setupFiles: ['<rootDir>/tests/setup.ts'],
	testTimeout: 30_000,
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.routes.ts', '!src/server.ts'],
}

export default config
