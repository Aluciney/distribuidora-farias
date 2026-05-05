import { detectarBandeira, validarLuhn } from '../../src/shared/utils/cartao'

describe('Cartão', () => {
	it('detecta Visa', () => {
		expect(detectarBandeira('4111111111111111')).toBe('VISA')
	})
	it('detecta Mastercard', () => {
		expect(detectarBandeira('5500000000000004')).toBe('MASTERCARD')
	})
	it('aceita cartão Luhn-válido', () => {
		expect(validarLuhn('4111111111111111')).toBe(true)
	})
	it('rejeita cartão Luhn-inválido', () => {
		expect(validarLuhn('4111111111111112')).toBe(false)
	})
})
