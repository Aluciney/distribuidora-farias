import { apenasDigitosCnpj, validarCnpj } from '../../src/shared/utils/cnpj'

describe('CNPJ', () => {
	it('aceita CNPJs válidos', () => {
		expect(validarCnpj('11.444.777/0001-61')).toBe(true)
		expect(validarCnpj('00360305000104')).toBe(true)
	})

	it('rejeita CNPJs inválidos', () => {
		expect(validarCnpj('11111111111111')).toBe(false)
		expect(validarCnpj('1234')).toBe(false)
		expect(validarCnpj('11.444.777/0001-62')).toBe(false)
	})

	it('apenasDigitosCnpj remove formatação', () => {
		expect(apenasDigitosCnpj('11.444.777/0001-61')).toBe('11444777000161')
	})
})
