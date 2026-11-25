# nassauTickets

Sistema de Controle de Atendimento para um **Laboratório de Análises Clínicas**, desenvolvido para gerenciar a emissão de senhas, ordenação dinâmica por prioridade, chamada sonora em painel, atendimento por guichês e relatórios gerenciais e de auditoria.

## Objetivo

Consolidar práticas de desenvolvimento Web com React, organização de projetos de software, versionamento com Git/GitHub (fluxo `dev` → `main`) e documentação técnica aplicada a um cenário real de atendimento laboratorial.

## Arquitetura e Regras de Negócio

O sistema opera com três agentes principais:
- **Agente Cliente (AC):** Interage anonimamente no **Totem** (`/totem`) para emitir senhas e acompanha a chamada no **Painel** (`/painel`).
- **Agente Atendente (AA):** Realiza login no **Terminal do Atendente** (`/atendente`), chama a próxima senha, inicia e encerra atendimentos ou registra não comparecimento. Possui também acesso ao perfil **Gestor** (`/gestor`).
- **Agente Sistema (AS):** Gerencia a fila, aplica a regra de priorização, controla a máquina de estados, sincroniza as telas em tempo real e registra logs de auditoria.

### Tipos de Senha e Priorização
- **SP** — Senha Prioritária (maior prioridade)
- **SE** — Senha para Retirada de Exames (prioridade operacional especial)
- **SG** — Senha Geral (menor prioridade)

A fila segue a alternância `[SP] → [SE | SG] → [SP] → [SE | SG]`, respeitando a ordem cronológica dentro de cada categoria e decidindo automaticamente quando uma das filas estiver vazia. O formato da numeração segue o padrão `YYMMDD-PPSQ` com reinício diário.

### Máquina de Estados
`EMITIDA` → `AGUARDANDO` → `CHAMADA` → `CHAMADA_NOVAMENTE` → `EM_ATENDIMENTO` → `ATENDIDA` (ou `NÃO_COMPARECEU` após duas chamadas sem comparecimento).

### Aspectos Técnicos, LGPD e Disponibilidade
- **Auditoria e Concorrência:** Registro de operador, guichê, 1ª chamada, 2ª chamada ("Última chamada"), início e finalização do atendimento, com sincronização atômica de estado entre abas.
- **LGPD e Acessibilidade:** O cliente utiliza o totem de forma anônima (sem coleta de dados pessoais sensíveis na emissão de senha) e o painel conta com síntese de voz (Web Speech API) para chamadas sonoras.
- **Resiliência:** O frontend mantém estado local persistente (`localStorage`), garantindo continuidade operacional do totem, painel e guichês mesmo em caso de indisponibilidade temporária de rede/backend.

## Tecnologias Utilizadas

- **Frontend:** React 19, Vite, React Router DOM, Tailwind CSS e Lucide React.
- **Justificativa Técnica (Arquitetura):** O React foi adotado pela componentização declarativa e reatividade via hooks (`useState`, `useEffect`, `useMemo`), permitindo sincronizar Totem, Painel, Atendente e Gestor em tempo real. Para a camada de persistência e integração prevista na especificação (Node.js + Express / MySQL 8.0), a aplicação desacopla a camada de serviços (`src/services/store.js`) com fallback local estruturado em JSON.

## Estrutura do Repositório

```text
nassauTickets/
├── backend/
├── docs/
│   ├── branding/
│   ├── mer/
│   ├── mockups/
│   ├── models/
│   │   └── uml/
│   └── requirements/
├── frontend/
├── .gitignore
├── LICENSE
└── README.md
```
## Instalação e Execução

1. Clone o repositório:

```bash
git clone https://github.com/GiovannaLima1/nassauTickets.git
cd nassauTickets
```

2. Acesse a pasta do frontend, instale as dependências e inicie o servidor:

```bash
cd frontend
npm install
npm run dev
```

3. Acesse `http://localhost:5173` no navegador e abra as rotas:
   - `/` — Tela inicial de navegação
   - `/totem` — Totem de autoatendimento (emissão de senhas)
   - `/painel` — Painel público de chamadas com áudio
   - `/atendente` — Login e terminal de operação do guichê
   - `/gestor` — Relatórios diário/mensal, indicadores (TME/TM), auditoria e exportação CSV

## Configuração

- **Horário de Expediente:** Configurado oficialmente das **07h às 17h** (com opção de alternância para modo demonstração 24h diretamente no cabeçalho do Totem para testes fora do horário comercial).
- **Áudio do Painel:** Utiliza a Web Speech API nativa do navegador (`pt-BR`). Caso o navegador bloqueie áudio automático, utilize o botão **Testar voz / Som ativo** no topo do painel.

## Branches e Fluxo de Desenvolvimento

- `main`: Branch principal com a versão estável e integrada do projeto.
- `dev`: Branch de desenvolvimento contínuo onde as funcionalidades e ajustes foram implementados e validados antes do merge para a `main`.

## Membros

| Nome | Matrícula | Papel |
| :--- | :--- | :--- |
| Giovanna Lima | 01830311 | Scrum Master |
| Luma Rodrigues | 01833902 | Testador |