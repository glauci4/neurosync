# NeuroSync

Sistema web para gestão de clínicas psicológicas e serviço-escola.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MySQL
- TanStack Query
- React Hook Form
- Zod

## Regras obrigatórias

- Sempre utilizar TanStack Query para consumo de APIs.
- Não utilizar fetch diretamente em componentes.
- Respeitar clinica_id em todas as consultas.
- Respeitar permissões dos perfis.
- Não criar migrations automáticas.
- Quando houver alteração no banco, fornecer SQL manual.
- Atualizar script.sql quando necessário.
- Não quebrar layouts existentes.
- Manter identidade visual lilás do NeuroSync.
- Seguir componentes já existentes antes de criar novos.

## Perfis

### Secretária

Pode acessar:
- Agenda
- Pacientes
- Salas
- Funcionamento
- Relatórios operacionais
- Notificações

Não pode acessar:
- Prontuários

### Psicólogo

Pode acessar:
- Agenda
- Pacientes vinculados
- Prontuários
- Relatórios clínicos
- Notificações

## Banco de Dados

- MySQL
- Sempre respeitar clinica_id
- Nunca remover colunas sem informar SQL
- Nunca criar alterações destrutivas sem solicitar confirmação

## Padrões do Projeto

- TypeScript estrito
- Componentes reutilizáveis
- Tailwind CSS
- Responsividade obrigatória
- Priorizar consistência visual sobre recriações completas