import { useEffect, useState } from 'react';
import {
  Building2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  Star,
  UserCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { AlterarSenhaModal } from '@/features/auth/components/AlterarSenhaModal';
import {
  useAtualizarContatoCliente,
  useClientePerfil,
  type PerfilFilial,
} from '@/features/cliente-portal/perfil/perfil.service';
import { StatusCliente } from '@/types';
import { apenasDigitos, maskCNPJ, maskTelefone } from '@/utils/cnpj';

const STATUS_TOM = {
  [StatusCliente.ATIVO]: 'emerald',
  [StatusCliente.INATIVO]: 'slate',
  [StatusCliente.BLOQUEADO]: 'rose',
} as const;

const STATUS_LABEL = {
  [StatusCliente.ATIVO]: 'Ativa',
  [StatusCliente.INATIVO]: 'Inativa',
  [StatusCliente.BLOQUEADO]: 'Bloqueada',
} as const;

export function PerfilClientePage() {
  const { data: perfil, isLoading } = useClientePerfil();
  const atualizar = useAtualizarContatoCliente();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [alterarSenhaAberto, setAlterarSenhaAberto] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome);
      setTelefone(maskTelefone(perfil.telefone));
    }
  }, [perfil]);

  const nomeDirty = perfil != null && nome.trim() !== perfil.nome.trim();
  const telDirty =
    perfil != null && apenasDigitos(telefone) !== apenasDigitos(perfil.telefone);
  const dirty = nomeDirty || telDirty;

  async function salvar() {
    setErro(null);
    if (telDirty) {
      const digitos = apenasDigitos(telefone);
      if (digitos.length !== 10 && digitos.length !== 11) {
        setErro('Telefone deve ter 10 ou 11 dígitos (com DDD).');
        return;
      }
    }
    if (nomeDirty && nome.trim().length < 2) {
      setErro('Nome muito curto.');
      return;
    }
    await atualizar.mutateAsync({
      nome: nomeDirty ? nome.trim() : undefined,
      telefone: telDirty ? telefone : undefined,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">Meu perfil</h2>
        <p className="mt-1 text-sm text-slate-400">
          Seus dados de acesso ao portal e a relação de filiais que você
          administra.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-sky-300" />
            <CardTitle>Meus dados</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nome" htmlFor="nome" obrigatorio>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              iconeEsquerda={<UserCircle className="h-4 w-4" />}
              disabled={isLoading}
            />
          </FormField>
          <FormField
            label="Email (login)"
            htmlFor="email"
            ajuda="Para alterar o email, entre em contato com a equipe da DF."
          >
            <Input
              id="email"
              value={perfil?.email ?? ''}
              readOnly
              disabled
              iconeEsquerda={<Mail className="h-4 w-4" />}
            />
          </FormField>
          <FormField
            label="Telefone (com DDD)"
            htmlFor="telefone"
            obrigatorio
            erro={erro ?? undefined}
            ajuda="Usado nos avisos da régua e no envio do boleto pelo WhatsApp."
            className="sm:col-span-2"
          >
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              iconeEsquerda={<Phone className="h-4 w-4" />}
              invalido={Boolean(erro)}
              disabled={isLoading}
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
            <Button
              variant="outline"
              onClick={() => setAlterarSenhaAberto(true)}
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </Button>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (perfil) {
                      setNome(perfil.nome);
                      setTelefone(maskTelefone(perfil.telefone));
                    }
                    setErro(null);
                  }}
                  disabled={atualizar.isPending}
                >
                  Descartar
                </Button>
              )}
              <Button
                onClick={salvar}
                loading={atualizar.isPending}
                disabled={!dirty}
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-300" />
            <CardTitle>
              Minhas filiais
              {perfil && (
                <span className="ml-2 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                  {perfil.filiais.length}
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !perfil || perfil.filiais.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Nenhuma filial vinculada à sua conta.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {perfil.filiais.map((filial) => (
                <FilialItem key={filial.id} filial={filial} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <AlterarSenhaModal
        aberto={alterarSenhaAberto}
        onFechar={() => setAlterarSenhaAberto(false)}
      />
    </div>
  );
}

function FilialItem({ filial }: { filial: PerfilFilial }) {
  const endereco = `${filial.endereco.logradouro}, ${filial.endereco.numero}${filial.endereco.complemento ? ` — ${filial.endereco.complemento}` : ''} · ${filial.endereco.bairro} · ${filial.endereco.cidade}/${filial.endereco.uf}`;
  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-100">
              {filial.nomeFantasia ?? filial.razaoSocial}
            </p>
            <Badge tom={STATUS_TOM[filial.status]}>
              {STATUS_LABEL[filial.status]}
            </Badge>
            {filial.principal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                <Star className="h-3 w-3" />
                Sede
              </span>
            )}
          </div>
          {filial.nomeFantasia && (
            <p className="mt-0.5 text-xs text-slate-500">{filial.razaoSocial}</p>
          )}
          <p className="mt-1 font-mono text-xs text-slate-400">
            {maskCNPJ(filial.cnpj)}
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
            <MapPin className="mt-0.5 h-3 w-3 flex-none" />
            <span>{endereco}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
