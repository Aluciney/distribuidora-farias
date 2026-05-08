import { useEffect, useState } from 'react';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import {
  useEsqueciSenha,
  useRedefinirSenha,
} from '@/features/auth/hooks/useSenha';

type Tipo = 'ADMIN' | 'USUARIO_CLIENTE';

interface EsqueciSenhaModalProps {
  aberto: boolean;
  onFechar: () => void;
  /** Pré-seleciona o tipo conforme a aba aberta no LoginPage. */
  tipoInicial?: Tipo;
  /** Pré-preenche o email digitado no LoginPage. */
  emailInicial?: string;
  /** Disparado após sucesso da redefinição — útil para fechar o modal. */
  onSucesso?: () => void;
}

type Etapa = 'solicitar' | 'redefinir';

function apenasDigitos(v: string): string {
  return v.replace(/\D/g, '');
}

export function EsqueciSenhaModal({
  aberto,
  onFechar,
  tipoInicial = 'USUARIO_CLIENTE',
  emailInicial = '',
  onSucesso,
}: EsqueciSenhaModalProps) {
  const [etapa, setEtapa] = useState<Etapa>('solicitar');
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [email, setEmail] = useState(emailInicial);
  const [destinatarioMascarado, setDestinatarioMascarado] = useState<
    string | null
  >(null);
  const [codigo, setCodigo] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const esqueci = useEsqueciSenha();
  const redefinir = useRedefinirSenha();

  useEffect(() => {
    if (aberto) {
      setEtapa('solicitar');
      setTipo(tipoInicial);
      setEmail(emailInicial);
      setDestinatarioMascarado(null);
      setCodigo('');
      setSenhaNova('');
      setConfirmar('');
      setErro(null);
    }
  }, [aberto, tipoInicial, emailInicial]);

  async function solicitar() {
    setErro(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErro('Informe um email válido.');
      return;
    }
    try {
      const res = await esqueci.mutateAsync({
        tipo,
        email: email.trim().toLowerCase(),
      });
      setDestinatarioMascarado(res.destinatario);
      setEtapa('redefinir');
    } catch {
      // o hook já dispara toast de erro
    }
  }

  async function redefinirAgora() {
    setErro(null);
    if (apenasDigitos(codigo).length !== 6) {
      setErro('O código deve ter 6 dígitos.');
      return;
    }
    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    try {
      await redefinir.mutateAsync({
        tipo,
        email: email.trim().toLowerCase(),
        codigo: apenasDigitos(codigo),
        senhaNova,
      });
      onSucesso?.();
      onFechar();
    } catch {
      // o hook já dispara toast de erro
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={etapa === 'solicitar' ? 'Recuperar senha' : 'Redefinir senha'}
      descricao={
        etapa === 'solicitar'
          ? 'Vamos enviar um código de 6 dígitos para o email cadastrado.'
          : destinatarioMascarado
            ? `Enviamos um código para ${destinatarioMascarado}. Ele expira em 15 minutos.`
            : 'Confira o email e digite o código recebido. Ele expira em 15 minutos.'
      }
      tamanho="md"
      rodape={
        etapa === 'solicitar' ? (
          <>
            <Button variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button onClick={solicitar} loading={esqueci.isPending}>
              <Mail className="h-4 w-4" />
              Enviar código
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setEtapa('solicitar')}>
              Voltar
            </Button>
            <Button onClick={redefinirAgora} loading={redefinir.isPending}>
              <KeyRound className="h-4 w-4" />
              Redefinir senha
            </Button>
          </>
        )
      }
    >
      {etapa === 'solicitar' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {(['USUARIO_CLIENTE', 'ADMIN'] as Tipo[]).map((t) => {
              const ativo = tipo === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    ativo
                      ? t === 'ADMIN'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-sky-500/10 text-sky-300'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  {t === 'ADMIN' ? 'Sou da equipe' : 'Sou cliente'}
                </button>
              );
            })}
          </div>

          <FormField
            label="Email"
            htmlFor="esqueci-email"
            obrigatorio
            erro={erro ?? undefined}
          >
            <Input
              id="esqueci-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              type="email"
              inputMode="email"
              autoComplete="email"
              invalido={Boolean(erro)}
            />
          </FormField>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-sky-900/60 bg-sky-950/30 p-3 text-xs text-sky-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              Confira sua caixa de entrada (e a pasta de spam). O código tem 6
              dígitos e é válido por 15 minutos.
            </span>
          </div>

          <FormField
            label="Código recebido"
            htmlFor="codigo"
            obrigatorio
            erro={erro ?? undefined}
          >
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(apenasDigitos(e.target.value).slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="tracking-widest text-center font-mono text-lg"
              invalido={Boolean(erro)}
            />
          </FormField>

          <FormField label="Nova senha" htmlFor="senhaNova" obrigatorio>
            <Input
              id="senhaNova"
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar senha" htmlFor="confirmar" obrigatorio>
            <Input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
}
