# Requisitos do Sistema - nassauTickets

## 1. Requisitos Funcionais (RF)
- **RF01 - Emissão de Senhas:** O Agente Cliente (AC) deverá emitir senhas por meio do totem de forma anônima[cite: 3, 6, 8, 14].
- **RF02 - Tipos de Senha:** O sistema deve suportar três tipos de senha: Senha Prioritária (SP), Senha Geral (SG) e Senha para Retirada de Exames (SE)[cite: 4, 6, 12].
- **RF03 - Padrão de Numeração:** As senhas devem seguir o formato YYMMDD-PPSQ (Ano, Mês, Dia, Tipo e Sequência diária)[cite: 6, 12].
- **RF04 - Chamada de Senhas:** O Agente Atendente (AA) deverá acionar a chamada do próximo atendimento respeitando as regras de prioridade[cite: 4, 5, 6, 12, 13].
- **RF05 - Painel de Chamadas:** O painel público deve exibir as últimas 5 senhas chamadas e o respetivo guichê[cite: 5, 6, 13].
- **RF06 - Relatórios Gerenciais:** O gestor terá acesso a relatórios diários e mensais com quantitativos e auditoria[cite: 6, 7, 13].

## 2. Regras de Negócio (RN)
- **RN01 - Regra de Prioridade:** A alternância de atendimento deve seguir estritamente o fluxo: [SP] -> [SE|SG] -> [SP] -> [SE|SG][cite: 5, 12].
- **RN02 - Abandono de Senha:** Se o cliente não comparecer após duas chamadas, a senha é considerada abandonada[cite: 6, 12].
- **RN03 - Horário de Expediente:** O funcionamento ocorre das 7h às 17h. As senhas restantes no fim do expediente devem ser descartadas[cite: 5, 12].