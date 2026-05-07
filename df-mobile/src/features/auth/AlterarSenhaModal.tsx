import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { KeyRound } from 'lucide-react-native';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { authService } from '@/features/auth/auth.service';
import { toast } from '@/store/toast.store';

interface AlterarSenhaModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function AlterarSenhaModal({
  aberto,
  onFechar,
}: AlterarSenhaModalProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmar('');
      setErro(null);
      setCarregando(false);
    }
  }, [aberto]);

  async function salvar() {
    setErro(null);
    if (senhaAtual.length === 0) {
      setErro('Informe sua senha atual.');
      return;
    }
    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senhaNova === senhaAtual) {
      setErro('A nova senha deve ser diferente da atual.');
      return;
    }
    if (senhaNova !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    setCarregando(true);
    try {
      await authService.alterarSenha({ senhaAtual, senhaNova });
      toast.sucesso('Senha alterada', 'Sua nova senha já está ativa.');
      onFechar();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível alterar a senha.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Alterar senha"
      descricao="Para sua segurança, confirme a senha atual antes de definir a nova."
      rodape={
        <>
          <Button variant="outline" size="sm" onPress={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onPress={salvar}
            loading={carregando}
            iconeEsquerda={<KeyRound size={14} color="#0f172a" />}
          >
            Salvar
          </Button>
        </>
      }
    >
      <View className="gap-4">
        <FormField label="Senha atual" obrigatorio>
          <Input
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />
        </FormField>
        <FormField
          label="Nova senha"
          obrigatorio
          erro={erro ?? undefined}
        >
          <Input
            value={senhaNova}
            onChangeText={setSenhaNova}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            invalido={Boolean(erro)}
          />
        </FormField>
        <FormField label="Confirmar nova senha" obrigatorio>
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
    </Modal>
  );
}
