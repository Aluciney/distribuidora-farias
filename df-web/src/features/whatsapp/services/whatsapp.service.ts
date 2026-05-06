import { api } from '@/services/api/http';

export type StatusWhatsApp =
  | 'desconectado'
  | 'aguardando_qr'
  | 'conectando'
  | 'conectado';

export interface InfoWhatsApp {
  status: StatusWhatsApp;
  qrCodeDataUrl: string | null;
  usuario: { id: string; nome?: string } | null;
  ultimoErro: string | null;
}

export const whatsappService = {
  status(): Promise<InfoWhatsApp> {
    return api.get<InfoWhatsApp>('/admin/whatsapp/status');
  },
  conectar(): Promise<InfoWhatsApp> {
    return api.post<InfoWhatsApp>('/admin/whatsapp/conectar');
  },
  desconectar(): Promise<InfoWhatsApp> {
    return api.post<InfoWhatsApp>('/admin/whatsapp/desconectar');
  },
  enviarTeste(destinatario: string, mensagem: string) {
    return api.post<{ ok: true; enviadoEm: string }>(
      '/admin/whatsapp/enviar-teste',
      { destinatario, mensagem },
    );
  },
};
