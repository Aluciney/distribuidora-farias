import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import {
  useEnviarBoletoEmail,
  useEnviarBoletoWhatsapp,
} from '@/features/cobrancas/hooks/useCobrancas';
import { useStatusWhatsapp } from '@/features/whatsapp/hooks/useWhatsapp';
import type { Fatura } from '@/types';

interface ReenviarBoletoModalProps {
  /** O pai deve montar/desmontar este componente para resetar os checks. */
  onFechar: () => void;
  fatura: Fatura;
}

export function ReenviarBoletoModal({
  onFechar,
  fatura,
}: ReenviarBoletoModalProps) {
  const { data: whatsappInfo } = useStatusWhatsapp();
  const whatsappConectado = whatsappInfo?.status === 'conectado';
  const enviarWhatsapp = useEnviarBoletoWhatsapp();
  const enviarEmail = useEnviarBoletoEmail();

  const [marcarWhatsapp, setMarcarWhatsapp] = useState(true);
  const [marcarEmail, setMarcarEmail] = useState(true);

  const carregando = enviarWhatsapp.isPending || enviarEmail.isPending;
  const podeEnviar =
    (marcarWhatsapp && whatsappConectado) || marcarEmail;

  async function onConfirmar() {
    if (marcarWhatsapp && whatsappConectado) {
      try {
        await enviarWhatsapp.mutateAsync(fatura.id);
      } catch {
        // toast de erro já é exibido pelo hook
      }
    }
    if (marcarEmail) {
      try {
        await enviarEmail.mutateAsync(fatura.id);
      } catch {
        // toast de erro já é exibido pelo hook
      }
    }
    onFechar();
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={`Reenviar boleto ${fatura.numero}`}
      descricao="Selecione os canais pelos quais deseja reenviar o boleto."
      tamanho="md"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            loading={carregando}
            disabled={!podeEnviar || carregando}
          >
            Reenviar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-200">WhatsApp</p>
              <p className="text-xs text-slate-500">
                {whatsappConectado
                  ? 'PDF + mensagem padrão serão enviados ao telefone da holding responsável.'
                  : 'WhatsApp desconectado — conecte em Configurações › WhatsApp para usar este envio.'}
              </p>
            </div>
          </div>
          <Switch
            disabled={!whatsappConectado}
            checked={marcarWhatsapp && whatsappConectado}
            onChange={(e) => setMarcarWhatsapp(e.target.checked)}
          />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-200">E-mail</p>
              <p className="text-xs text-slate-500">
                PDF anexo será enviado ao e-mail da holding responsável.
              </p>
            </div>
          </div>
          <Switch
            checked={marcarEmail}
            onChange={(e) => setMarcarEmail(e.target.checked)}
          />
        </div>
      </div>
    </Modal>
  );
}
