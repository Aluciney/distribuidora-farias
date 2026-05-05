import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
		PORT: z.coerce.number().default(3333),
		LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

		// Banco — aceita DATABASE_URL direto, ou monta a partir de DB_*.
		DATABASE_URL: z.string().optional(),
		DB_HOST: z.string().optional(),
		DB_PORT: z.coerce.number().optional(),
		DB_USER: z.string().optional(),
		DB_PASS: z.string().optional(),
		DB_NAME: z.string().optional(),

		// Auth
		JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres'),
		JWT_EXPIRES_IN: z.string().default('7d'),
		COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET precisa ter ao menos 16 caracteres'),
		COOKIE_SECURE: z
			.enum(['true', 'false'])
			.default('false')
			.transform((v) => v === 'true'),
		BCRYPT_ROUNDS: z.coerce.number().default(12),

		// CORS
		CORS_ORIGIN: z.string().default('http://localhost:5173'),

		// Régua
		REGUA_CRON: z.string().default('0 9 * * *'),
		REGUA_HABILITADA: z
			.enum(['true', 'false'])
			.default('true')
			.transform((v) => v === 'true'),
	})
	.transform((env) => {
		if (!env.DATABASE_URL && env.DB_HOST && env.DB_USER && env.DB_PASS && env.DB_NAME && env.DB_PORT) {
			env.DATABASE_URL = `postgresql://${env.DB_USER}:${encodeURIComponent(env.DB_PASS)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`
		}
		if (!env.DATABASE_URL) {
			throw new Error('DATABASE_URL ausente (ou então defina DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME).')
		}
		// Propaga para process.env para o Prisma usar.
		process.env.DATABASE_URL = env.DATABASE_URL
		return env
	})

export const env = envSchema.parse(process.env)
