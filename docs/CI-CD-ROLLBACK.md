# CI, CD e rollback do frontend

## Arquitetura adotada

GitHub Actions valida o frontend, publica uma imagem no GitHub Container Registry (GHCR) e acessa um servidor Linux por SSH. O servidor precisa de Docker, Bash, curl e flock. Não precisa de Node, npm ou checkout do projeto para publicar.

O backend permanece separado. Esta automação não altera banco de dados, certificados TLS, DNS ou infraestrutura do backend.

### CI — Frontend CI

Arquivo: `.github/workflows/frontend.yml`.

Em pushes e pull requests:

1. Instala as dependências pelo lockfile com `npm ci`.
2. Executa `npm run check`: lint incremental, testes e build.
3. Guarda `dist` como artefato por sete dias.
4. Constrói uma imagem Docker e verifica Nginx, healthcheck, rota SPA e resposta de asset inexistente.
5. Verifica a sintaxe e o ShellCheck dos scripts e executa testes de falhas do deploy e rollback com Docker/HTTP simulados.

Os 26 diagnósticos antigos de Hooks continuam explícitos na baseline. A CI bloqueia novos diagnósticos; não declara o lint completo como limpo.

### CD — Frontend CD

Arquivo: `.github/workflows/deploy.yml`.

Em push na `main`, ou execução manual selecionando `main`:

1. Revalida o código e os testes de publicação no próprio workflow privilegiado. Não consome artefatos de pull requests.
2. Constrói e testa a imagem que será publicada.
3. Publica `ghcr.io/mattsouza14/frontendmalibru:sha-<commit>` usando `GITHUB_TOKEN`, com permissão `packages: write` somente no job de publicação.
4. Obtém a referência imutável `ghcr.io/...@sha256:<digest>`.
5. Se a variável de **repositório** `DEPLOY_ENABLED=true`, executa o job no Environment `production` e envia o script de release por SSH.

Sem `DEPLOY_ENABLED=true`, validação e publicação da imagem ocorrem, mas o servidor não é alterado. O job de deploy respeita as proteções configuradas no Environment, incluindo revisão humana se habilitada.

A imagem é construída uma vez no job de publicação: o smoke test e o push usam a mesma imagem. O deploy e o rollback usam digest, não a tag `latest` nem uma recompilação do commit antigo.

## Preparar o servidor

Requisitos: Linux `amd64`, Docker Engine, Bash, curl, util-linux/flock e SSH. A imagem publicada pelo runner `ubuntu-latest` é `linux/amd64`; servidores ARM exigem adaptar o build para múltiplas arquiteturas.

1. Crie um usuário dedicado, autorizado a executar Docker e escrever em `/opt/malibru-frontend`. Acesso ao Docker concede controle amplo do host; restrinja a chave de deploy a esse uso.
2. Crie o diretório e copie `deploy/server.env.example` para `/opt/malibru-frontend/deploy.env`, com permissão 600 e proprietário igual ao usuário de deploy.
3. Ajuste `IMAGE_REPOSITORY`, `BACKEND_ORIGIN` e `DOCKER_NETWORK`. A rede precisa existir e o nome do backend deve resolver nela. Exemplo: `docker network create malibru`, somente se essa rede ainda não existir.
4. Mantenha `BIND_ADDRESS=127.0.0.1` e configure seu proxy/ingress HTTPS para encaminhar ao `HTTP_PORT` (padrão 8081). Usar `0.0.0.0` expõe a porta nas interfaces do host e exige uma decisão explícita sobre firewall/TLS.
5. Para imagem privada, execute `docker login ghcr.io` como o usuário de deploy, usando uma credencial com `read:packages` e acesso ao pacote. Essa credencial permanece no servidor; não coloque senha em `deploy.env`. Configure a autorização SSO se a organização exigir.
6. Confirme `docker network inspect malibru` e acesso do servidor ao GHCR antes de habilitar CD.

O arquivo `deploy.env` é lido como dados `KEY=value`, sem executar shell: não use aspas, espaços em torno do `=` ou referências como `${VAR}`.

`API_HEALTH_PATH=/api/empresas` verifica uma chamada GET pública, sem alteração de dados, através do proxy. Exige HTTP de sucesso e tipo `application/json`. Para validar somente o frontend, configure `API_HEALTH_PATH=`; registre que falhas de integração com a API deixarão de bloquear o deploy.

O script não toma posse de um contêiner existente sem a identificação `com.malibru.managed`. Se já houver uma publicação manual com o mesmo nome, planeje a migração e liberação desse nome/porta antes do primeiro deploy. O primeiro deploy não possui versão anterior para restaurar.

## Configurar GitHub

No repositório, abra Settings → Environments e crie `production`. Restrinja deploys à branch `main`. Configure revisores obrigatórios conforme a política da equipe e a disponibilidade desse recurso no plano do GitHub.

### Secrets do Environment production

- `DEPLOY_HOST`: DNS ou IPv4 do servidor, sem protocolo.
- `DEPLOY_USER`: usuário SSH dedicado.
- `DEPLOY_SSH_KEY`: chave privada completa; a chave pública correspondente deve estar autorizada no servidor.
- `DEPLOY_KNOWN_HOSTS`: entrada verificada de `known_hosts`. Confirme a impressão digital pelo console do servidor ou outro canal confiável. O workflow usa `StrictHostKeyChecking=yes`; não aceita automaticamente a chave recebida pela rede.

### Variables

- **No repositório**, `DEPLOY_ENABLED`: `true` para habilitar a troca no servidor. Uma variável somente do Environment não serve para esse filtro do job.
- No Environment, `DEPLOY_PORT`: porta SSH, padrão `22`.
- No Environment, `DEPLOY_PATH`: diretório dedicado, padrão `/opt/malibru-frontend`.

Para porta SSH diferente de 22, a entrada de known_hosts deve usar `[host]:porta`.

No pacote GHCR, confira o vínculo com este repositório e a permissão de publicação via Actions. O workflow inclui o label OCI de origem. Os jobs de PR não recebem segredos de produção nem permissão para publicar pacotes.

Proteja `main` com revisão e os checks de CI. Não é necessário adicionar credenciais do servidor aos jobs de build.

## Processo de troca e rollback automático

`deploy/release.sh` realiza a seguinte sequência:

1. Valida a configuração, o repositório permitido e o digest.
2. Adquire um lock no servidor com `flock`; deploy e rollback também compartilham o grupo `frontend-production` no GitHub Actions.
3. Confere se o estado salvo corresponde ao contêiner atual. Se houver divergência ou operação interrompida, para e pede reconciliação.
4. Baixa a imagem e inicia uma candidata em porta temporária de loopback.
5. Verifica `/healthz`, `/chamados` e, quando configurado, a API.
6. Registra `state/pending`, renomeia o contêiner atual para backup e o para.
7. Inicia a nova versão na porta fixa e repete as verificações.
8. Se aprovada, grava o estado por substituição atômica, remove o backup parado e registra histórico.
9. Se a troca falhar, remove a nova instância, restaura o contêiner anterior e verifica sua saúde. O workflow continua marcado como falha para que o incidente seja visível.

**Existe uma breve interrupção na troca de porta.** Esta solução não é blue-green com roteamento atômico nem oferece garantia de zero downtime. A candidata reduz o risco de retirar a versão atual antes de validar a próxima.

Se a candidata ou o pull falhar, a versão atual permanece intacta. Se a restauração também falhar, `state/pending` é preservado e futuras operações são bloqueadas para recuperação manual. SIGKILL, queda do host e perda de energia não podem ser corrigidos por uma trap de shell.

O rollback automático ocorre durante a publicação. Não há monitoramento contínuo após o deploy nem rollback automático por erros funcionais que retornem HTTP 200.

## Rollback manual

No GitHub, abra Actions → **Frontend Rollback** → Run workflow, usando a branch `main`.

- Deixe `image` vazio para restaurar a versão anterior registrada no servidor.
- Ou informe o digest completo de uma versão conhecida e aprovada, do mesmo repositório GHCR.

O workflow respeita o Environment `production`, testa a versão escolhida antes e depois da troca e atualiza o histórico. A versão retirada vira a anterior, permitindo desfazer o rollback.

O rollback continua disponível com `DEPLOY_ENABLED=false`. Durante um incidente, desative essa variável e confira execuções pendentes para impedir que outro deploy agendado substitua a versão restaurada. GitHub mantém apenas um job pendente por grupo de concorrência; não trate o grupo como fila durável de todos os releases.

O rollback muda a versão em execução, mas não altera a branch `main`. Corrija ou reverta a alteração problemática por pull request antes de reabilitar o CD, para não republicar o defeito no próximo push.

Se a imagem antiga estiver disponível localmente, o rollback pode usá-la sem acessar o registry. Se não estiver, precisa conseguir baixá-la do GHCR. Não remova imagens/digests ainda necessários para recuperação, nem execute limpeza indiscriminada no servidor ou pacote.

### Operação diretamente no servidor

Mantenha uma cópia revisada de `deploy/release.sh` para contingência. Exemplo:

```bash
bash release.sh rollback '' /opt/malibru-frontend
bash release.sh rollback 'ghcr.io/mattsouza14/frontendmalibru@sha256:DIGEST_DE_64_CARACTERES' /opt/malibru-frontend
```

Substitua o digest de exemplo por uma referência real. Não use tags mutáveis.

## Estado e recuperação após interrupção

Em `/opt/malibru-frontend/state`:

- `releases`: primeira linha é o digest atual; segunda é o anterior.
- `history.tsv`: data UTC, operação, digest ativado e digest substituído. Falha de gravação produz aviso; os logs do Actions também devem ser preservados.
- `pending`: transação interrompida, com digest alvo e nome do backup.
- `lock`: lock utilizado por `flock`; a existência do arquivo não significa que o lock esteja ocupado. Não o apague durante uma execução.

Se houver `pending`:

1. Desabilite CD e confirme que nenhuma publicação está em andamento.
2. Leia `pending` e `releases` como texto. Inspecione contêineres, labels, imagens e portas com `docker ps -a` e `docker inspect`.
3. Para restaurar, confirme a identidade do backup indicado. Remova somente a instância falha gerenciada, renomeie o backup para o `APP_NAME` e inicie-o. Nunca remova contêineres só porque possuem nomes parecidos.
4. Verifique frontend e API. Se a nova versão estiver íntegra e você decidir mantê-la, confira o digest em execução antes de adotar seu estado.
5. Atualize `releases` para refletir a decisão real e preserve o registro do incidente. Só remova `pending` após reconciliar serviço e estado. Reabilite CD quando o ambiente estiver saudável.

Rollback de imagem não reverte alterações em `deploy.env`, banco, backend, infraestrutura ou DNS. Preserve configurações anteriores e compatibilidade de API separadamente.

## Testes e alcance

Os testes em `deploy/tests` simulam instalação inicial, atualização, rollback, idempotência, falha de candidata, falha após troca, falha de pull, cache offline, imagem não autorizada, operação interrompida, contêiner não gerenciado e ausência de versão anterior. Não acessam produção.

```bash
bash -n deploy/release.sh deploy/ssh-release.sh deploy/smoke.sh
bash deploy/tests/release.test.sh
docker build -t malibru-frontend:ci .
bash deploy/smoke.sh malibru-frontend:ci
```

Antes de habilitar produção, faça um ciclo completo de deploy e rollback em homologação com GHCR, SSH, proxy HTTPS e backend reais. A configuração do repositório não cria automaticamente secrets, Environment, servidor, DNS ou certificados.

Referências: [publicação de imagens no GitHub Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [imagens por digest](https://docs.docker.com/reference/cli/docker/image/pull/).
