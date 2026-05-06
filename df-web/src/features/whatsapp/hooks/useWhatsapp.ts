import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  whatsappService,
  type InfoWhatsApp,
} from '@/features/whatsapp/services/whatsapp.service';
import { toast } from '@/store/toast.store';

const KEY = ['whatsapp', 'status'] as const;

/**
 * Faz polling do status. O intervalo é mais agressivo quando estamos
 * aguardando o QR code (precisa atualizar para "conectado" rápido após o scan)
 * e mais relaxado quando já está conectado.
 */
export function useStatusWhatsapp() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => whatsappService.status(),
    refetchInterval: (query) => {
      const data = query.state.data as InfoWhatsApp | undefined;
      if (!data) return 3_000;
      if (data.status === 'aguardando_qr' || data.status === 'conectando') return 2_000;
      return 10_000;
    },
    refetchOnWindowFocus: true,
  });
}

export function useConectarWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.conectar(),
    onSuccess: (info) => {
      qc.setQueryData(KEY, info);
      qc.invalidateQueries({ queryKey: KEY });
      toast.info(
        'Conectando ao WhatsApp',
        info.status === 'conectado'
          ? 'Sessão restaurada.'
          : 'Aguarde o QR code aparecer.',
      );
    },
    onError: (err: Error) =>
      toast.erro('Falha ao conectar', err.message),
  });
}

export function useDesconectarWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.desconectar(),
    onSuccess: (info) => {
      qc.setQueryData(KEY, info);
      qc.invalidateQueries({ queryKey: KEY });
      toast.sucesso('WhatsApp desconectado', 'A sessão foi encerrada.');
    },
    onError: (err: Error) =>
      toast.erro('Falha ao desconectar', err.message),
  });
}

export function useEnviarMensagemTeste() {
  return useMutation({
    mutationFn: ({ destinatario, mensagem }: { destinatario: string; mensagem: string }) =>
      whatsappService.enviarTeste(destinatario, mensagem),
    onSuccess: () =>
      toast.sucesso('Mensagem enviada', 'O destinatário deve receber em instantes.'),
    onError: (err: Error) => toast.erro('Falha ao enviar', err.message),
  });
}
