# Organização e infraestrutura

## Problema anterior

Páginas, componentes e serviços de domínios diferentes ficavam em pastas globais. Isso exigia procurar arquivos em várias áreas para modificar uma funcionalidade. As rotas importavam todas as páginas imediatamente. O projeto não oferecia comando de testes, pipeline ou configuração de servidor de produção; o lint já tinha diagnósticos pendentes.

## Decisões e motivos

### Código por funcionalidade

Cada domínio fica em src/features/<dominio> com pages, components, services e utils conforme necessário. Exemplo: tickets, SLA, formulário e API dos chamados estão em features/support. Não é necessário criar subpastas vazias ou camadas que ainda não têm uso.

src/app decide como os módulos aparecem na aplicação. src/shared contém somente código que pode ser usado sem importar app ou features. ESLint e testes verificam essa direção. Imports entre funcionalidades são permitidos quando há composição real, como relatórios consumindo os serviços dos módulos; não foi introduzido um catálogo de exports globais que esconda essas dependências.

### Imports e contextos

Todos os imports relativos foram atualizados e têm extensão explícita. Isso permite testar módulos JavaScript diretamente no Node e detectar caminhos inexistentes no Linux da CI. Hooks/contextos compartilhados foram separados dos arquivos de componentes Provider: Fast Refresh pode atualizar os componentes sem misturar exports de naturezas diferentes.

### Carregamento de páginas

As rotas usam React.lazy e Suspense. O código de uma página é solicitado quando ela é acessada. Existe estado de carregamento, e o layout privado tem sua própria fronteira para preservar menu e cabeçalho durante a navegação. ErrorBoundary apresenta recuperação explícita se um componente ou arquivo de página falhar; não captura falhas de eventos ou requisições assíncronas, que continuam tratadas nos fluxos existentes.

O build gera um manifest para inspecionar os arquivos produzidos. O arquivo principal medido nesta reorganização ficou em aproximadamente 272 kB sem compressão (86 kB com gzip). Isso é tamanho de arquivo, não medição de velocidade de navegação nem soma de todos os recursos carregados. Não houve atualização de bibliotecas nesta mudança.

Referências: [React lazy](https://react.dev/reference/react/lazy), [Suspense](https://react.dev/reference/react/Suspense), [build do Vite](https://vite.dev/guide/build).

### Validação automatizada

npm run check executa lint incremental, 11 testes e build. Os novos testes verificam imports, direção das dependências, respostas HTTP vazias/inválidas, upload multipart e compartilhamento de renovação da sessão. Os testes de SLA foram preservados.

A CI instala dependências com npm ci, usa o lockfile, cancela execuções superadas na mesma referência e guarda dist por sete dias. Os workflows separados de CD e rollback estão descritos em [CI, CD e rollback](CI-CD-ROLLBACK.md). Deploys em andamento não são cancelados por uma nova execução.

### Pendências de lint visíveis

Há 26 diagnósticos preexistentes de Hooks registrados em app/lint-baseline.json. npm run lint continua exibindo os problemas e retornando erro. npm run lint:check tolera somente a combinação registrada de arquivo, regra, severidade, linha de código e mensagem; diagnósticos novos reprovam a checagem. As regras permanecem ativadas.

A baseline evita transformar uma reorganização de infraestrutura numa alteração ampla dos ciclos de carregamento das telas. Não equivale a lint limpo. Corrigir esses efeitos é trabalho restante; ao corrigir um diagnóstico, remova sua entrada da baseline. Não regenere ou amplie a baseline para acomodar problemas novos.

### Configuração consistente

.nvmrc indica Node 22; engines registra compatibilidade. .editorconfig padroniza codificação, recuo e finais de linha. A instalação continua centralizada em app/package-lock.json; package.json da raiz contém somente atalhos, sem segundo conjunto de dependências.

Vite lê somente variáveis com prefixo API_ para o proxy e valida HTTP/HTTPS. A porta de desenvolvimento é fixa: falha de forma clara se 5173 estiver ocupada, evitando mudança silenciosa de origem que pode quebrar cookies/CORS. Variáveis VITE_ são públicas e não devem conter segredos.

## Como adicionar uma funcionalidade

1. Coloque páginas e regras no domínio correspondente em features.
2. Use shared apenas quando o código for realmente reutilizado e independente dos domínios.
3. Cadastre a página nas rotas com import dinâmico, preservando as proteções de acesso.
4. Adicione testes para regras e integrações relevantes e execute npm run check.
5. Atualize a documentação se houver configuração nova.

## Limites

Não houve mudança no backend nem nos contratos da API. Os testes locais não substituem homologação com sessão real e banco atualizado. O workflow só é executado no GitHub após o envio. As imagens Docker usam tags de manutenção; uma política de releases que exija bases imutáveis deve fixar e atualizar seus digests.
