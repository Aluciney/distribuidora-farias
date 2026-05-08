import {
  Pencil,
  PowerOff,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { Cliente } from '@/types';
import { StatusCliente } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatCNPJ, formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/cn';

interface ClientesTabelaProps {
  clientes: Cliente[];
  onEditar: (cliente: Cliente) => void;
  onAlterarStatus: (cliente: Cliente) => void;
}

const STATUS_TOM: Record<StatusCliente, 'emerald' | 'rose' | 'slate'> = {
  [StatusCliente.ATIVO]: 'emerald',
  [StatusCliente.INATIVO]: 'slate',
  [StatusCliente.BLOQUEADO]: 'rose',
};

const STATUS_LABEL: Record<StatusCliente, string> = {
  [StatusCliente.ATIVO]: 'Ativo',
  [StatusCliente.INATIVO]: 'Inativo',
  [StatusCliente.BLOQUEADO]: 'Bloqueado',
};

export function ClientesTabela({
  clientes,
  onEditar,
  onAlterarStatus,
}: ClientesTabelaProps) {
  return (
    <>
      {/* Tabela em telas médias e maiores */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Filial</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Cidade/UF</th>
              <th className="px-4 py-3 text-right font-medium">Limite</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clientes.map((cliente) => {
              const ativo = cliente.status === StatusCliente.ATIVO;
              return (
                <tr
                  key={cliente.id}
                  className="text-slate-200 transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-100">
                        {cliente.razaoSocial}
                      </span>
                      {cliente.nomeFantasia && (
                        <span className="text-xs text-slate-500">
                          {cliente.nomeFantasia}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {formatCNPJ(cliente.cnpj)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {cliente.endereco.cidade}/{cliente.endereco.uf}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(cliente.limiteCredito)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(cliente.atualizadoEm)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tom={STATUS_TOM[cliente.status]}>
                      {STATUS_LABEL[cliente.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        onClick={() => onEditar(cliente)}
                        aria-label={`Editar ${cliente.razaoSocial}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'rounded-md p-1.5',
                          ativo
                            ? 'text-rose-300 hover:bg-rose-500/10'
                            : 'text-emerald-300 hover:bg-emerald-500/10',
                        )}
                        onClick={() => onAlterarStatus(cliente)}
                        aria-label={
                          ativo
                            ? `Inativar ${cliente.razaoSocial}`
                            : `Reativar ${cliente.razaoSocial}`
                        }
                      >
                        {ativo ? (
                          <PowerOff className="h-4 w-4" />
                        ) : cliente.status === StatusCliente.BLOQUEADO ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards no mobile */}
      <ul className="space-y-2 md:hidden">
        {clientes.map((cliente) => {
          const ativo = cliente.status === StatusCliente.ATIVO;
          return (
            <li
              key={cliente.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">
                    {cliente.razaoSocial}
                  </p>
                  <p className="font-mono text-xs text-slate-500">
                    {formatCNPJ(cliente.cnpj)}
                  </p>
                </div>
                <Badge tom={STATUS_TOM[cliente.status]}>
                  {STATUS_LABEL[cliente.status]}
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Cidade</dt>
                  <dd className="text-slate-300">
                    {cliente.endereco.cidade}/{cliente.endereco.uf}
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="text-slate-500">Limite</dt>
                  <dd className="font-medium text-slate-200">
                    {formatCurrency(cliente.limiteCredito)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  onClick={() => onEditar(cliente)}
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs',
                    ativo
                      ? 'border-rose-700/60 text-rose-300 hover:bg-rose-500/10'
                      : 'border-emerald-700/60 text-emerald-300 hover:bg-emerald-500/10',
                  )}
                  onClick={() => onAlterarStatus(cliente)}
                >
                  {ativo ? (
                    <>
                      <PowerOff className="h-3 w-3" /> Inativar
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Reativar
                    </>
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
