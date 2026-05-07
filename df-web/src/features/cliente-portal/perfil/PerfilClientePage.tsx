import { useEffect, useState } from 'react';
import { Building2, Mail, Phone, Save, UserCircle } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import {
  useAtualizarTelefoneCliente,
  useClientePerfil,
} from '@/features/cliente-portal/perfil/perfil.service';
import { apenasDigitos, maskCNPJ, maskTelefone } from '@/utils/cnpj';

export function PerfilClientePage() {
  const { data: perfil, isLoading } = useClientePerfil();
  const atualizar = useAtualizarTelefoneCliente();

  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) setTelefone(maskTelefone(perfil.telefone));
  }, [perfil]);

  const dirty =
    perfil != null && apenasDigitos(telefone) !== apenasDigitos(perfil.telefone);

  async function salvar() {
    setErro(null);
    const digitos = apenasDigitos(telefone);
    if (digitos.length !== 10 && digitos.length !== 11) {
      setErro('Telefone deve ter 10 ou 11 dígitos (com DDD).');
      return;
    }
    await atualizar.mutateAsync(digitos);
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">Meu perfil</h2>
        <p className="mt-1 text-sm text-slate-400">
          Dados de contato e identificação cadastrados na Distribuidora Farias.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-sky-300" />
            <CardTitle>Identificação</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Razão Social" htmlFor="razaoSocial">
            <Input
              id="razaoSocial"
              value={perfil?.razaoSocial ?? ''}
              readOnly
              disabled
              iconeEsquerda={<Building2 className="h-4 w-4" />}
            />
          </FormField>
          <FormField label="CNPJ" htmlFor="cnpj">
            <Input
              id="cnpj"
              value={perfil ? maskCNPJ(perfil.cnpj) : ''}
              readOnly
              disabled
            />
          </FormField>
          <FormField
            label="Email"
            htmlFor="email"
            className="sm:col-span-2"
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
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-300" />
            <CardTitle>Contato</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField
            label="Telefone (com DDD)"
            htmlFor="telefone"
            obrigatorio
            erro={erro ?? undefined}
            ajuda="Usado nos avisos da régua de cobrança e no envio do boleto pelo WhatsApp."
          >
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              invalido={Boolean(erro)}
              disabled={isLoading}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2">
            {dirty && (
              <Button
                variant="outline"
                onClick={() => {
                  if (perfil) setTelefone(maskTelefone(perfil.telefone));
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
              Salvar telefone
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
