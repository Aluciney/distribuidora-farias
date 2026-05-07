import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useAlterarSenha } from '@/features/auth/hooks/useSenha';

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

  const alterar = useAlterarSenha();

  useEffect(() => {
    if (aberto) {
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmar('');
      setErro(null);
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
    try {
      await alterar.mutateAsync({ senhaAtual, senhaNova });
      onFechar();
    } catch {
      // toast no hook
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Alterar senha"
      descricao="Para sua segurança, confirme a senha atual antes de definir a nova."
      tamanho="md"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={alterar.isPending}>
            <KeyRound className="h-4 w-4" />
            Salvar nova senha
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Senha atual" htmlFor="senhaAtual" obrigatorio>
          <Input
            id="senhaAtual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoComplete="current-password"
          />
        </FormField>

        <FormField
          label="Nova senha"
          htmlFor="senhaNova"
          obrigatorio
          erro={erro ?? undefined}
        >
          <Input
            id="senhaNova"
            type="password"
            value={senhaNova}
            onChange={(e) => setSenhaNova(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            invalido={Boolean(erro)}
          />
        </FormField>

        <FormField label="Confirmar nova senha" htmlFor="confirmar" obrigatorio>
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
    </Modal>
  );
}
