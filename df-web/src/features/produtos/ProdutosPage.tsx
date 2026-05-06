import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  Eye,
  Lock,
  PackageX,
  Search,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import type { FiltroAtivoProduto } from '@/features/produtos/services/produtos.mock';
import type { Produto } from '@/types';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/cn';

export function ProdutosPage() {
  const [busca, setBusca] = useState('');
  const [ativoFiltro, setAtivoFiltro] = useState<FiltroAtivoProduto>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    setPagina(1);
  }, [busca, ativoFiltro, porPagina]);

  const filtros = useMemo(
    () => ({ busca, ativo: ativoFiltro, pagina, porPagina }),
    [busca, ativoFiltro, pagina, porPagina],
  );
  const { data, isLoading, isError, refetch } = useProdutos(filtros);
  const produtos = data?.itens;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-slate-100">
            Catálogo de Produtos
          </h2>
          <Badge tom="slate">
            <Lock className="mr-1 inline-block h-3 w-3" />
            Somente leitura
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Visualização integrada ao sistema de estoque. Edições devem ser feitas
          no ERP.
        </p>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por descrição ou SKU..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              iconeEsquerda={<Search className="h-4 w-4" />}
              className="lg:w-96"
            />
            <Select
              value={ativoFiltro}
              onChange={(e) =>
                setAtivoFiltro(e.target.value as FiltroAtivoProduto)
              }
              className="w-auto"
            >
              <option value="TODOS">Todos</option>
              <option value="ATIVOS">Apenas ativos</option>
              <option value="INATIVOS">Apenas inativos</option>
            </Select>
          </div>

          {isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar o catálogo de produtos.
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !produtos || produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
              <Boxes className="h-10 w-10 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Nenhum produto encontrado
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ajuste os filtros para visualizar outros itens.
                </p>
              </div>
            </div>
          ) : (
            <ProdutosListagem produtos={produtos} />
          )}
        </CardBody>
        <Pagination
          pagina={pagina}
          porPagina={porPagina}
          total={total}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
        />
      </Card>
    </div>
  );
}

interface ProdutosListagemProps {
  produtos: Produto[];
}

function ProdutosListagem({ produtos }: ProdutosListagemProps) {
  return (
    <>
      {/* Tabela md+ */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 text-right font-medium">Preço</th>
              <th className="px-4 py-3 text-right font-medium">Estoque</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {produtos.map((p) => (
              <tr
                key={p.id}
                className={cn(
                  'text-slate-200 transition-colors hover:bg-slate-800/40',
                  !p.ativo && 'opacity-60',
                )}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {p.sku}
                </td>
                <td className="px-4 py-3 text-slate-100">{p.descricao}</td>
                <td className="px-4 py-3 text-slate-400">{p.unidade}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(p.preco)}
                </td>
                <td className="px-4 py-3 text-right">
                  <EstoqueIndicador estoque={p.estoque} />
                </td>
                <td className="px-4 py-3">
                  <Badge tom={p.ativo ? 'emerald' : 'slate'}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <ul className="space-y-2 md:hidden">
        {produtos.map((p) => (
          <li
            key={p.id}
            className={cn(
              'rounded-lg border border-slate-800 bg-slate-900/40 p-4',
              !p.ativo && 'opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-500">{p.sku}</p>
                <p className="font-medium text-slate-100">{p.descricao}</p>
              </div>
              <Badge tom={p.ativo ? 'emerald' : 'slate'}>
                {p.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-slate-500">Unidade</dt>
                <dd className="text-slate-300">{p.unidade}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Preço</dt>
                <dd className="font-medium text-slate-200">
                  {formatCurrency(p.preco)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Estoque</dt>
                <dd>
                  <EstoqueIndicador estoque={p.estoque} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function EstoqueIndicador({ estoque }: { estoque: number }) {
  if (estoque === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-300">
        <PackageX className="h-3 w-3" />
        Esgotado
      </span>
    );
  }
  if (estoque < 10) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-300">
        <Eye className="h-3 w-3" />
        {estoque} un
      </span>
    );
  }
  return (
    <span className="text-xs text-slate-300">
      {estoque.toLocaleString('pt-BR')} un
    </span>
  );
}
