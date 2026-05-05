import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
	PORT_DOCKER: z.coerce.number().default(3001),
	PORT: z.coerce.number().default(3001),

	DB_HOST: z.string(),
	DB_USER: z.string(),
	DB_PASS: z.string(),
	DB_NAME: z.string(),
	DB_PORT: z.coerce.number(),

	JWT_SECRET_KEY: z.string(),
	JWT_EXPIRES_IN: z.string(),
})

export const env = envSchema.parse(process.env)
