# Diagrama de Sequência e Fluxo de Atendimento - nassauTickets

O diagrama abaixo ilustra o ciclo de vida completo de uma senha no laboratório, desde a emissão até à conclusão do atendimento.

## 🔄 Fluxo do Processo

```mermaid
sequenceDiagram
    autonumber
    actor Paciente
    participant Totem as Totem (Frontend)
    participant API as Backend (Node.js)
    participant DB as Banco de Dados (MySQL)
    participant Painel as Painel de Chamadas (TV)
    participant Atendente as Módulo Atendente

    Paciente->>Totem: Seleciona o tipo de atendimento (Geral/Prioritário/Exames)
    Totem->>API: Envia requisição de nova senha
    API->>DB: Insere registo na tabela 'senhas' (Status: EM_FILA)
    DB-->>API: Retorna código gerado (Ex: P001)
    API-->>Totem: Confirma emissão
    Totem-->>Paciente: Imprime / Exibe senha na tela

    Atendente->>API: Clica em "Chamar Próximo"
    API->>DB: Atualiza senha para 'CHAMADA' e regista atendimento
    DB-->>API: Confirma alteração
    API->>Painel: Transmite via WebSocket a nova senha e guichê
    Painel-->>Paciente: Exibe e emite alerta sonoro na sala de espera

    Paciente->>Atendente: Dirige-se ao guichê
    Atendente->>API: Clica em "Concluir Atendimento"
    API->>DB: Atualiza status da senha para 'CONCLUIDA'