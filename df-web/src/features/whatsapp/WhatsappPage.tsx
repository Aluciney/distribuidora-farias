import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogOut,
  MessageSquare,
  QrCode,
  RefreshCw,
  Send,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  useConectarWhatsapp,
  useDesconectarWhatsapp,
  useEnviarMensagemTeste,
  useStatusWhatsapp,
} from '@/features/whatsapp/hooks/useWhatsapp';
import type { StatusWhatsApp } from '@/features/whatsapp/services/whatsapp.service';

const STATUS_LABEL: Record<StatusWhatsApp, string> = {
  desconectado: 'Desconectado',
  aguardando_qr: 'Aguardando leitura do QR',
  conectando: 'Conectando…',
  conectado: 'Conectado',
};

const STATUS_DOT: Record<StatusWhatsApp, string> = {
  desconectado: 'bg-slate-500',
  aguardando_qr: 'bg-amber-400 animate-pulse',
  conectando: 'bg-sky-400 animate-pulse',
  conectado: 'bg-emerald-400',
};

export function WhatsappPage() {
  const status = useStatusWhatsapp();
  const conectar = useConectarWhatsapp();
  const desconectar = useDesconectarWhatsapp();
  const enviarTeste = useEnviarMensagemTeste();

  const [confirmandoDesconexao, setConfirmandoDesconexao] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [mensagem, setMensagem] = useState('Olá! Esta é uma mensagem de teste da DF Distribuidora.');

  const info = status.data;
  const statusAtual: StatusWhatsApp = info?.status ?? 'desconectado';
  const conectado = statusAtual === 'conectado';
  const aguardandoQr = statusAtual === 'aguardando_qr';

  const onEnviarTeste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatario.trim() || !mensagem.trim()) return;
    enviarTeste.mutate({ destinatario: destinatario.trim(), mensagem });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">WhatsApp</h2>
          <p className="mt-1 text-sm text-slate-400">
            Conecte um número do WhatsApp Business para que a régua de cobrança e
            notificações manuais possam disparar mensagens.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => status.refetch()}
            disabled={status.isFetching}
          >
            <RefreshCw className={status.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
          {conectado ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmandoDesconexao(true)}
              loading={desconectar.isPending}
            >
              <LogOut className="h-4 w-4" />
              Desconectar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => conectar.mutate()}
              loading={conectar.isPending}
              disabled={statusAtual === 'conectando'}
            >
              <QrCode className="h-4 w-4" />
              Conectar
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status da conexão</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Atualizado automaticamente.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[statusAtual]}`}
              />
              <span className="text-sm font-medium text-slate-100">
                {STATUS_LABEL[statusAtual]}
              </span>
            </div>

            {info?.usuario && conectado && (
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300">
                  <Smartphone className="h-3.5 w-3.5" />
                  Sessão ativa
                </div>
                <p className="mt-1 text-sm text-slate-100">
                  {info.usuario.nome ?? info.usuario.id}
                </p>
                <p className="text-xs text-slate-500">{info.usuario.id}</p>
              </div>
            )}

            {info?.ultimoErro && !conectado && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{info.ultimoErro}</span>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-400">
              <p className="font-medium text-slate-300">Como funciona</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Clique em <strong>Conectar</strong> para gerar um QR code.</li>
                <li>
                  Abra o WhatsApp no celular: <em>Configurações → Aparelhos
                  conectados → Conectar um aparelho</em>.
                </li>
                <li>Escaneie o QR exibido ao lado.</li>
                <li>
                  A sessão fica salva no servidor — você só precisa repetir se
                  desconectar manualmente ou deslogar pelo celular.
                </li>
              </ol>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>QR code</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Válido por alguns segundos — o servidor renova automaticamente.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex min-h-[280px] items-center justify-center">
              {status.isLoading ? (
                <div className="h-64 w-64 animate-pulse rounded-lg bg-slate-800/40" />
              ) : conectado ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  <p className="text-sm font-medium text-slate-200">
                    WhatsApp conectado
                  </p>
                  <p className="max-w-xs text-xs text-slate-500">
                    Para trocar o número, desconecte primeiro e gere um novo QR
                    code.
                  </p>
                </div>
              ) : aguardandoQr && info?.qrCodeDataUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl bg-white p-3 shadow-lg">
                    <img
                      src={info.qrCodeDataUrl}
                      alt="QR code do WhatsApp"
                      className="h-64 w-64"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Escaneie com o aplicativo do WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <QrCode className="h-12 w-12 text-slate-600" />
                  <p className="text-sm text-slate-400">
                    {statusAtual === 'conectando'
                      ? 'Gerando QR code…'
                      : 'Nenhum QR ativo. Clique em "Conectar" para iniciar.'}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Enviar mensagem de teste</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">
              Útil para validar a conexão antes de habilitar a régua.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {!conectado ? (
            <p className="text-sm text-slate-400">
              Conecte o WhatsApp para enviar mensagens de teste.
            </p>
          ) : (
            <form onSubmit={onEnviarTeste} className="space-y-4">
              <FormField
                label="Destinatário"
                htmlFor="wa-destinatario"
                ajuda="Telefone com DDD. Se não tiver DDI, será assumido +55 (Brasil)."
                obrigatorio
              >
                <Input
                  id="wa-destinatario"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  placeholder="11999999999"
                  iconeEsquerda={<MessageSquare className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Mensagem" htmlFor="wa-mensagem" obrigatorio>
                <Textarea
                  id="wa-mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={4}
                />
              </FormField>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={enviarTeste.isPending}
                  disabled={!destinatario.trim() || !mensagem.trim()}
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        aberto={confirmandoDesconexao}
        titulo="Desconectar WhatsApp"
        mensagem="Tem certeza? A sessão será encerrada e nenhuma mensagem será enviada até você reconectar."
        textoConfirmar="Desconectar"
        carregando={desconectar.isPending}
        onConfirmar={async () => {
          await desconectar.mutateAsync();
          setConfirmandoDesconexao(false);
        }}
        onCancelar={() => setConfirmandoDesconexao(false)}
      />
    </div>
  );
}
