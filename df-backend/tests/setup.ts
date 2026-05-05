// Carrega .env.test antes de qualquer outra coisa
import { config as dotenv } from 'dotenv'
dotenv({ path: '.env.test' })

process.env.NODE_ENV = 'test'

export {}
