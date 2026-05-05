import bcrypt from 'bcrypt'
import { env } from '../../env'

export async function hashearSenha(senhaPlana: string): Promise<string> {
	return bcrypt.hash(senhaPlana, env.BCRYPT_ROUNDS)
}

export async function validarSenha(senhaPlana: string, hash: string): Promise<boolean> {
	return bcrypt.compare(senhaPlana, hash)
}
