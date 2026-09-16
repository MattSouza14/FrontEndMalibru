# Publicação

Para a automação completa com GitHub Actions, GHCR, SSH e rollback, consulte [CI, CD e rollback](CI-CD-ROLLBACK.md). Os procedimentos abaixo continuam disponíveis para publicação manual.

## Arquivos estáticos

Execute npm ci --prefix app e npm run build. Publique o conteúdo de app/dist num servidor HTTP. Configure fallback de rotas para index.html e encaminhe /api ao backend; o proxy do Vite existe somente no desenvolvimento. Não use vite preview como servidor de produção.

## Docker e Nginx

Na raiz: docker build -t malibru-frontend .

Exemplo em uma rede Docker já existente chamada malibru, com o backend acessível como backend:8080:

docker run --rm --name malibru-frontend --network malibru -p 8081:80 -e BACKEND_ORIGIN=http://backend:8080 malibru-frontend

BACKEND_ORIGIN deve ser uma origem HTTP/HTTPS, sem caminho e sem barra final. É configuração do servidor, aplicada na inicialização do contêiner; não exige recompilar o JavaScript. O nome backend precisa ser resolvível na rede do contêiner. localhost dentro do contêiner aponta para o próprio contêiner.

O Dockerfile tem dois estágios: Node instala com npm ci e gera o build; somente os arquivos estáticos seguem para Nginx. Arquivos .env e node_modules locais ficam fora do contexto. A imagem não publica nem inicia o backend.

## Comportamento do servidor

- Rotas como /chamados e /profile servem index.html, permitindo abrir URLs diretamente.
- /assets usa cache longo para arquivos com hash; arquivos ausentes retornam 404.
- index.html exige revalidação, reduzindo referências desatualizadas após um deploy.
- /api é encaminhado ao backend mantendo o caminho e sem cache de respostas.
- Upload aceita até 26 MiB no proxy; alinhe os limites do Spring para o total permitido de 25 MiB de imagens e overhead multipart.
- /healthz verifica somente o servidor estático, não a disponibilidade do backend.

Em produção, termine TLS no servidor/ingress adequado e configure encaminhamento de protocolo conforme a cadeia de proxies confiáveis. Confirme cookies Secure/HttpOnly, domínio e origem permitida no backend. O exemplo Nginx escuta HTTP na porta interna 80 e não provisiona certificados.

## Validação antes de publicar

Execute npm run check e valide a imagem em homologação. Confira login, renovação da sessão, abertura direta de rotas, anexos e atendimento de chamados usando o backend do ambiente. Não execute testes de escrita contra produção.
