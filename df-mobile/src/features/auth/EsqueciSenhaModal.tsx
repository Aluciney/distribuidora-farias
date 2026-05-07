import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react-native';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { authService } from '@/features/auth/auth.service';
import { toast } from '@/store/toast.store';
import { apenasDigitos, maskCNPJ } from '@/lib/format';

type Etapa = 'solicitar' | 'redefinir';

interface EsqueciSenhaModalProps {
  aberto: boolean;
  onFechar: () => void;
  cnpjInicial?: string;
}

export function EsqueciSenhaModal({
  aberto,
  onFechar,
  cnpjInicial = '',
}: EsqueciSenhaModalProps) {
  const [etapa, setEtapa] = useState<Etapa>('solicitar');
  const [cnpj, setCnpj] = useState(cnpjInicial);
  const [destinatario, setDestinatario] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setEtapa('solicitar');
      setCnpj(cnpjInicial);
      setDestinatario(null);
      setCodigo('');
      setSenhaNova('');
      setConfirmar('');
      setErro(null);
      setCarregando(false);
    }
  }, [aberto, cnpjInicial]);

  async function solicitar() {
    setErro(null);
    if (apenasDigitos(cnpj).length !== 14) {
      setErro('Informe um CNPJ válido (14 dígitos).');
      return;
    }
    setCarregando(true);
    try {
      const res = await authService.esqueciSenha({ cnpj });
      setDestinatario(res.destinatario);
      setEtapa('redefinir');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar o código.';
      setErro(msg);
      toast.erro('Falha ao solicitar recuperação', msg);
    } finally {
      setCarregando(false);
    }
  }

  async function redefinir() {
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
    setCarregando(true);
    try {
      await authService.redefinirSenha({ cnpj, codigo, senhaNova });
      toast.sucesso(
        'Senha redefinida',
        'Você já pode entrar com a nova senha.',
      );
      onFechar();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível redefinir a senha.';
      setErro(msg);
    } finally {
      setCarregando(false);
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
          : destinatario
            ? `Enviamos um código para ${destinatario}. Ele expira em 15 minutos.`
            : 'Confira o email cadastrado e digite o código recebido.'
      }
      rodape={
        etapa === 'solicitar' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onPress={onFechar}
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onPress={solicitar}
              loading={carregando}
              iconeEsquerda={<Mail size={14} color="#0f172a" />}
            >
              Enviar código
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setEtapa('solicitar')}
              disabled={carregando}
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onPress={redefinir}
              loading={carregando}
              iconeEsquerda={<KeyRound size={14} color="#0f172a" />}
            >
              Redefinir
            </Button>
          </>
        )
      }
    >
      {etapa === 'solicitar' ? (
        <FormField label="CNPJ" obrigatorio erro={erro ?? undefined}>
          <Input
            value={maskCNPJ(cnpj)}
            onChangeText={(v) => setCnpj(maskCNPJ(v))}
            placeholder="00.000.000/0000-00"
            keyboardType="numeric"
            autoCapitalize="none"
            invalido={Boolean(erro)}
          />
        </FormField>
      ) : (
        <View className="gap-4">
          <View className="flex-row items-start gap-2 rounded-lg border border-sky-900/60 bg-sky-950/30 p-3">
            <ShieldCheck size={14} color="#7dd3fc" />
            <Text className="flex-1 text-xs text-sky-200">
              Confira sua caixa de entrada (e a pasta de spam). O código tem 6
              dígitos e é válido por 15 minutos.
            </Text>
          </View>

          <FormField
            label="Código recebido"
            obrigatorio
            erro={erro ?? undefined}
          >
            <Input
              value={codigo}
              onChangeText={(v) =>
                setCodigo(apenasDigitos(v).slice(0, 6))
              }
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              invalido={Boolean(erro)}
            />
          </FormField>

          <FormField label="Nova senha" obrigatorio>
            <Input
              value={senhaNova}
              onChangeText={setSenhaNova}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar senha" obrigatorio>
            <Input
              value={confirmar}
              onChangeText={setConfirmar}
              placeholder="Repita a nova senha"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
          </FormField>
        </View>
      )}
    </Modal>
  );
}
