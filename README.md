# Raizes do Nordeste - API Back-end

API Back-end do Projeto Multidisciplinar da trilha Back-end.

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
- pnpm
- Docker e Docker Compose

## Configuracao

1. Instale as dependencias:

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

4. Execute as migrations e o seed:

```sh
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

```sh
pnpm check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Hooks de Git

O projeto usa Husky e lint-staged.

- `pre-commit`: executa `pnpm run precommit`, que roda `lint-staged` nos arquivos staged.
- `pre-push`: executa `pnpm run prepush`, que roda `check`, `lint`, `typecheck`, `test` e `build`.

Depois de clonar o projeto e instalar as dependencias, o script `prepare` configura os hooks:

```sh
pnpm install
```

## Usuarios do seed

Todos usam a senha `Senha@123`.

| Perfil | E-mail |
| --- | --- |
| ADMIN | `admin@raizes.local` |
| GERENTE | `gerente@raizes.local` |
| ATENDENTE | `atendente@raizes.local` |
| COZINHA | `cozinha@raizes.local` |
| CLIENTE | `cliente@raizes.local` |
