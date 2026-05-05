import { addDays, differenceInCalendarDays, endOfDay, format, parse, startOfDay } from 'date-fns'

export function inicioDoDia(data: Date): Date {
	return startOfDay(data)
}

export function fimDoDia(data: Date): Date {
	return endOfDay(data)
}

export function adicionarDias(data: Date, dias: number): Date {
	return addDays(data, dias)
}

export function diasDeDiferenca(a: Date, b: Date): number {
	return differenceInCalendarDays(a, b)
}

/** Formata uma data como `YYYY-MM-DD` (UTC). */
export function formatarIsoDia(data: Date): string {
	return format(data, 'yyyy-MM-dd')
}

/** Parse de `YYYY-MM` para Date no primeiro dia do mês (UTC). */
export function parseIsoMes(mes: string): Date {
	return parse(`${mes}-01`, 'yyyy-MM-dd', new Date())
}
