# Raízes do Nordeste - API Back-end

API REST do Projeto Multidisciplinar da trilha Back-end para a rede fictícia **Raízes do Nordeste**.

O MVP cobre autenticação por JWT, autorização por perfis, consulta de cardápio, controle de estoque por unidade, criação de pedidos multicanal, pagamento mock, atualização de status e auditoria de ações sensíveis.

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT
- Swagger/OpenAPI
- Vitest
- Biome
- Husky
- lint-staged

## Requisitos

- Node.js 24+
- pnpm 11.7+
- Docker e Docker Compose

## Configuração

1. Instale as dependências:

```sh
pnpm install
```

2. Copie o arquivo de ambiente:

```sh
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Suba o PostgreSQL:

```sh
docker compose up -d
```

4. Gere o Prisma Client, execute as migrations e carregue o seed:

```sh
pnpm prisma:generate
pnpm db:setup
```

5. Inicie a API:

```sh
pnpm start:dev
```

## URLs locais

- API: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

## Scripts

Principais comandos do projeto:

```sh
pnpm start
pnpm start:dev
pnpm check
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm build
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:migrate:deploy
pnpm prisma:studio
pnpm prisma:seed
pnpm db:setup
pnpm db:reset
```

O comando `pnpm check` executa a verificação do Biome no repositório. O comando `pnpm lint` executa apenas as regras de lint do Biome.

## Hooks de Git

O projeto usa Husky e lint-staged.

- `pre-commit`: executa `pnpm run precommit`, que roda `lint-staged` nos arquivos staged.
- `pre-push`: executa `pnpm run prepush`, que roda `check`, `lint`, `typecheck`, `test` e `build`.

Depois de clonar o projeto e instalar as dependências, o script `prepare` configura os hooks:

```sh
pnpm install
```

## Usuários do seed

O seed cria dados locais de teste. Todos os usuários abaixo usam a senha `Senha@123`.

| Perfil    | E-mail                   |
| --------- | ------------------------ |
| ADMIN     | `admin@raizes.local`     |
| GERENTE   | `gerente@raizes.local`   |
| ATENDENTE | `atendente@raizes.local` |
| COZINHA   | `cozinha@raizes.local`   |
| CLIENTE   | `cliente@raizes.local`   |

Também são criados:

| Tipo    | Identificador                          | Descrição                |
| ------- | -------------------------------------- | ------------------------ |
| Unidade | `11111111-1111-4111-8111-111111111111` | Raízes Recife Centro     |
| Produto | `22222222-2222-4222-8222-222222222222` | Cuscuz com queijo coalho |

Esses dados são apenas para desenvolvimento local e evidências executáveis. Não use dados reais na coleção Postman ou em testes manuais.

## Swagger/OpenAPI

A documentação Swagger fica disponível em `http://localhost:3000/docs` com a API em execução.

As rotas protegidas usam autenticação Bearer. Para testar no Swagger:

1. Faça login em `POST /auth/login`.
2. Copie o campo `accessToken` retornado.
3. Clique em **Authorize**.
4. Informe o token no esquema Bearer.

## Endpoints implementados

### Auth

- `POST /auth/registrar`: registra usuário e retorna token JWT.
- `POST /auth/login`: autentica usuário por e-mail e senha.
- `GET /auth/me`: retorna o usuário autenticado.

### Usuários

- `GET /usuarios`: lista usuários com paginação. Requer JWT e perfil `ADMIN`.

### Unidades

- `GET /unidades`: lista unidades com paginação. Requer JWT.
- `GET /unidades/:unidadeId/produtos`: lista produtos ativos com estoque disponível na unidade. Requer JWT.

### Produtos

- `GET /produtos`: lista produtos do cardápio geral com paginação. Requer JWT.

### Estoques

- `GET /estoques`: lista saldos de estoque por unidade e produto. Requer JWT e perfil `ADMIN` ou `GERENTE`.
- `POST /estoques/movimentacoes`: cria movimentação de estoque e atualiza o saldo. Requer JWT e perfil `ADMIN` ou `GERENTE`.

### Pedidos

- `POST /pedidos`: cria pedido para o usuário autenticado.
- `GET /pedidos`: lista pedidos com paginação e filtro opcional por `canalPedido`.
- `GET /pedidos/:id`: consulta pedido detalhado.
- `PATCH /pedidos/:id/status`: atualiza status operacional do pedido. Requer perfil `ADMIN`, `GERENTE` ou `COZINHA`.
- `POST /pedidos/:id/cancelar`: cancela pedido quando permitido.
- `POST /pedidos/:id/pagamentos/mock`: simula pagamento aprovado ou recusado.

### Auditorias

- `GET /auditorias`: lista auditorias com paginação e filtros opcionais por `acao`, `entidade` e `usuarioId`. Requer JWT e perfil `ADMIN`.

## Paginação

As listagens usam `page` e `limit`:

```txt
GET /pedidos?page=1&limit=10
```

Formato de resposta:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

## Coleção Postman

A coleção reproduzível fica em `docs/postman/raizes-do-nordeste.postman_collection.json`.

Ela usa as variáveis:

- `baseUrl`: URL local da API, por padrão `http://localhost:3000`.
- `token`: token JWT salvo automaticamente após login.
- `adminToken`: token JWT salvo automaticamente após login de administrador.
- `pedidoId`: ID salvo automaticamente após criação de pedido.
- `pedidoRecusadoId`: ID salvo automaticamente para o cenário de pagamento recusado.

Antes de rodar a coleção, execute `pnpm db:setup` para garantir os dados do seed.

## Segurança e dados sensíveis

A API não retorna `senhaHash` nas responses públicas. O arquivo `.env.example` contém apenas valores locais de exemplo; defina valores próprios no `.env` antes de uso fora de desenvolvimento.
