# Malibru Frontend

Portal em React, Vite e Tailwind. O código executável permanece em app/; os comandos da raiz encaminham para esse pacote.

## Desenvolvimento

Use Node 22.12 ou superior na linha 22 (a versão principal está em .nvmrc).

1. Execute npm ci --prefix app para instalar exatamente as versões do lockfile.
2. Copie app/.env.example para app/.env e ajuste API_PROXY_TARGET para o backend.
3. Execute npm run dev na raiz. A aplicação abre em http://localhost:5173.
4. Execute npm run check antes de enviar alterações.

## Comandos

- npm run dev: desenvolvimento com proxy /api.
- npm test: testes automatizados usando o runner nativo do Node.
- npm run lint: diagnóstico completo do ESLint, incluindo pendências anteriores.
- npm run lint:check: reprova qualquer diagnóstico fora da baseline explícita.
- npm run build: gera app/dist com páginas carregadas sob demanda.
- npm run check: lint incremental, testes e build, na mesma ordem usada pela CI.
- npm run preview: inspeciona o build localmente na porta 4173; não é servidor de produção nem fornece proxy para a API.

## Estrutura

- app/src/app: composição da aplicação, rotas e layouts.
- app/src/features: auth, support, reports, users, inventory, licenses, hr, home, companies e notifications. Cada módulo reúne suas páginas, componentes, serviços e regras.
- app/src/shared: componentes reutilizáveis, UI, cliente HTTP e funções comuns.
- app/tests: testes de regras, cliente HTTP e limites entre camadas.
- app/scripts: ferramentas de validação.
- deploy: configuração do servidor de produção.
- .github/workflows: pipeline de validação para push e pull request.

Leia [a organização e os motivos das mudanças](docs/ARQUITETURA.md) e [as instruções de publicação](docs/DEPLOY.md).

## CI, CD e rollback

Workflows validam pull requests, publicam imagens no GHCR a partir da `main` e permitem deploy/rollback por SSH. O deploy no servidor exige `DEPLOY_ENABLED=true` e os secrets do Environment `production`.

Consulte [configuração, rollback e recuperação de incidentes](docs/CI-CD-ROLLBACK.md).
