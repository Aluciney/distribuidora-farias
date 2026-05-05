Atue como um Desenvolvedor Frontend Sênior e Especialista em UI/UX. Sua tarefa é arquitetar e desenvolver a interface de um Sistema de Gestão de Pagamentos para a "Distribuidora Farias". 

# CONTEXTO DO PROJETO
A Distribuidora Farias já possui um sistema de controle de estoque e criação de pedidos. O objetivo deste novo sistema frontend é integrar-se (via API) a esse sistema existente para gerenciar toda a parte financeira gerada por esses pedidos (Boletos, PIX, Cartão de Crédito e Inadimplência).

# STACK TECNOLÓGICA OBRIGATÓRIA
- Build Tool: Vite
- Biblioteca: React
- Linguagem: TypeScript (Tipagem estrita obrigatória)
- Estilização: Tailwind CSS
- Ícones: Lucide React (recomendado)
- Roteamento: React Router DOM
- Gerenciamento de Estado/Cache: React Query (TanStack Query) e Zustand (para estado global, se necessário)
- Formulários: React Hook Form + Zod (para validação)

# DIRETRIZES DE DESIGN E UI/UX
1. **Tema:** O sistema deve ser obrigatoriamente em **Dark Mode** (Tema Escuro) por padrão, utilizando tons de cinza escuro/slate do Tailwind (ex: bg-slate-900 para fundo, bg-slate-800 para cards, textos em slate-200). 
2. **Responsividade:** Mobile-first. Todas as telas (dashboards, tabelas, formulários) devem se adaptar perfeitamente a smartphones, tablets e desktops.
3. **Acessibilidade & UX:** Feedback visual claro para ações (sucesso/erro ao gerar boleto, copiar PIX), modais de confirmação para exclusão e loading states agradáveis (skeletons ou spinners).

# REQUISITOS FUNCIONAIS - MÓDULOS DO SISTEMA

O sistema terá duas áreas logadas distintas (rotas protegidas): Admin e Cliente. Crie as tipagens de TypeScript (`interfaces` / `types`) correspondentes para cada entidade antes de criar os componentes.

## 1. Portal Administrativo (Rotas `/admin/*`)
1.1 **Gestão de Clientes:** Tabela em formato de grid/lista para visualizar, cadastrar, editar e inativar clientes. **Regra de negócio:** O identificador único do cliente é sempre o CNPJ (aplicar máscara e validação).
1.2 **Gestão de Cobranças (Boletos e PIX):** Tela para listar faturas com filtros de status. Funcionalidades: Cadastrar nova cobrança atrelada a um pedido, dar baixa manual, cancelar boletos (padrão Febraban) e gerar PIX estático.
1.3 **Dashboard de Inadimplência:** Painel visual mostrando KPIs e uma lista/tabela de clientes com boletos vencidos ou a vencer nos próximos 7 dias. Usar gráficos simples ou cards de resumo.
1.4 **Dashboard de Fluxo de Caixa:** Painel mostrando entradas do mês atual (pagos vs pendentes) com um filtro de seletor de meses para visualizar histórico.
1.5 **Régua de Cobrança:** Módulo estilo "workflow" ou lista de regras onde o admin pode criar/editar/excluir regras automáticas de notificação (ex: "Enviar email 3 dias antes do vencimento com a mensagem X", "Enviar WhatsApp no dia do vencimento com a mensagem Y").
1.6 **Controle de Usuários (Admin):** CRUD simples para gerenciar quem da equipe financeira tem acesso ao sistema.
1.7 **Catálogo de Produtos (Read-only):** Tela integrada ao sistema de estoque atual apenas para visualizar os produtos e seus valores (somente leitura).

## 2. Portal do Cliente (Rotas `/cliente/*`)
2.1 **Minhas Faturas:** Tabela interativa onde o cliente visualiza seus boletos divididos por abas ou filtros: Abertos, Pagos e Vencidos.
2.2 **Central de Notificações:** Componente de sino/dropdown no header e painel para visualizar alertas de atraso de faturas.
2.3 **Área de Pagamento Rápido:** Ao clicar em uma fatura aberta/vencida, abrir um modal ou página de detalhes onde o cliente pode copiar o "Linha Digitável" do boleto ou o "Copia e Cola" / QR Code do PIX.
2.4 **Pagamento via Cartão de Crédito:** Na mesma tela de detalhes da fatura, opção de "Pagar com Cartão" contendo um formulário seguro (mockado) para inserção de dados do cartão de crédito.
2.5 **Dashboard do Cliente:** Painel inicial mostrando o "Total Gasto" na distribuidora (histórico) e "Total em Aberto".

# O QUE EU ESPERO COMO RESPOSTA NESTE PRIMEIRO MOMENTO:
Como o projeto é grande, não gere todo o código de uma vez. Para esta primeira interação, entregue:

1. **A Arquitetura de Pastas (Folder Structure):** Mostre como você organizaria este projeto Vite + React focado em escalabilidade e separação de conceitos (features, hooks, services, utils, components).
2. **Definição de Tipagens Principais (TypeScript):** Forneça o arquivo `types/index.ts` contendo as interfaces de `Cliente`, `Fatura` (Boleto/PIX/Cartao), `RegraCobranca` e `Pedido`.
3. **Layout Base e Roteamento:** O código do arquivo principal de Rotas configurando a separação estrutural entre `/admin` e `/cliente`, e um componente de `Layout` base para o Dark Theme usando Tailwind.
4. **Implementação de um Componente Crítico:** O código completo e responsivo (com Tailwind Dark Mode) do **Dashboard de Fluxo de Caixa do Admin (1.4)**, utilizando dados mockados para exemplificar visualmente os cards e filtros.

Aguarde meu feedback após esta primeira entrega para prosseguirmos com os próximos módulos.