import IORedis, { type Redis } from 'ioredis'
import { env } from '../env'

let connection: Redis | null = null

export function getRedisConnection(): Redis {
	if (connection) return connection
	connection = new IORedis({
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
		password: env.REDIS_PASSWORD,
		db: env.REDIS_DB,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	})
	return connection
}

export async function closeRedisConnection(): Promise<void> {
	if (connection) {
		await connection.quit()
		connection = null
	}
}
