import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cobrancasService,
  type BaixaManualPayload,
  type FiltrosFaturas,
  type NovaCobrancaPayload,
  type PagamentoCartaoPayload,
} from '@/features/cobrancas/services/cobrancas.mock';
import type { Fatura, UUID } from '@/types';
import { toast } from '@/store/toast.store';

const KEY_BASE = ['cobrancas'] as const;

export function useFaturas(filtros: FiltrosFaturas) {
  return useQuery({
    queryKey: [...KEY_BASE, 'lista', filtros],
    queryFn: () => cobrancasService.listar(filtros),
  });
}

export function useFatura(id: UUID | undefined) {
  return useQuery({
    queryKey: [...KEY_BASE, 'detalhe', id],
    queryFn: () => cobrancasService.obter(id!),
    enabled: Boolean(id),
  });
}

export function useCriarCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NovaCobrancaPayload) =>
      cobrancasService.criar(payload),
    onSuccess: (fatura: Fatura) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Cobrança gerada',
        `${fatura.numero} criada com Boleto e PIX prontos para pagamento.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao gerar cobrança', err.message);
    },
  });
}

export function useBaixarManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: UUID; payload: BaixaManualPayload }) =>
      cobrancasService.baixarManual(id, payload),
    onSuccess: (fatura: Fatura) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Baixa registrada',
        `${fatura.numero} marcada como paga.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao dar baixa', err.message);
    },
  });
}

export function usePagarComCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: UUID; payload: PagamentoCartaoPayload }) =>
      cobrancasService.pagarComCartao(id, payload),
    onSuccess: (fatura: Fatura) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      const ult = fatura.pagamento?.cartao?.ultimosDigitos ?? '';
      toast.sucesso(
        'Pagamento aprovado',
        `${fatura.numero} foi paga com cartão final ${ult}.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Pagamento recusado', err.message);
    },
  });
}

export function useBaixarPdfBoleto() {
  return useMutation({
    mutationFn: async (id: UUID) => {
      const { blob, nomeArquivo } = await cobrancasService.baixarPdf(id);
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        // Libera o object URL no próximo tick para garantir que o
        // navegador já leu o blob antes do revoke.
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    },
    onError: (err: Error) => {
      toast.erro('Falha ao baixar PDF', err.message);
    },
  });
}

export function useEnviarBoletoWhatsapp() {
  return useMutation({
    mutationFn: (id: UUID) => cobrancasService.enviarBoletoWhatsapp(id),
    onSuccess: () => {
      toast.sucesso(
        'Boleto enviado',
        'O cliente receberá o PDF e a mensagem no WhatsApp.',
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao enviar pelo WhatsApp', err.message);
    },
  });
}

export function useCancelarFatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: UUID; motivo: string }) =>
      cobrancasService.cancelarFatura(id, motivo),
    onSuccess: (fatura: Fatura) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Fatura cancelada',
        `${fatura.numero} cancelada conforme padrão Febraban.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao cancelar', err.message);
    },
  });
}
