# HSJ-MMAIS

link de acesso frontend: 
https://hsj-mmais.vercel.app/

link de acesso backend: 
https://hsj-mmais-production.up.railway.app/api

## Conta de Teste 

**E-mail:** "suporte.mmais@gmail.com"
**Palavra-passe:** "12345"

Repositório base com dois serviços **independentes**:

| Serviço        | Stack               | Descrição        |
| -------------- | ------------------- | ---------------- |
| `service.fe`   | React + Vite (TS)   | Frontend (SPA)   |
| `service.srv`  | NestJS (TS)         | Backend / API    |

Cada serviço gere as suas próprias dependências (`node_modules`), scripts e deploy.

## Estrutura

```
HSJ-MMAIS/
├── service.fe/                  # Frontend — React + Vite
│   ├── src/
│   ├── __tests__/               # Testes (Vitest + Testing Library)
│   ├── database/
│   └── deploy/{dev,pre,prd}/gae/app.yaml
│
└── service.srv/                 # Backend — NestJS
    ├── src/                     # Código + testes unitários (*.spec.ts)
    ├── test/                    # Testes e2e
    ├── database/
    └── deploy/{dev,pre,prd}/gae/app.yaml
```

## Pré-requisitos

- **Node.js 22+** (o deploy GAE usa `nodejs22`)
- **npm**

## Arranque em desenvolvimento

Os dois serviços correm em paralelo (em terminais separados).

### Backend (`service.srv`)

```bash
cd service.srv
cp .env.example .env      # primeira vez
npm install
npm run start:dev         # http://localhost:3000
```

A API é servida sob o prefixo `/api` (ex.: `GET http://localhost:3000/api`).

### Frontend (`service.fe`)

```bash
cd service.fe
cp .env.example .env.local   # primeira vez (opcional)
npm install
npm run dev                  # http://localhost:5173
```

O Vite faz **proxy** de `/api` para o backend (`VITE_API_TARGET`, default `http://localhost:3000`).
Em dev, basta o frontend chamar `fetch('/api/...')` — sem problemas de CORS.

## Variáveis de ambiente

| Serviço       | Ficheiro              | Variáveis                          |
| ------------- | --------------------- | ---------------------------------- |
| `service.srv` | `.env` / `.env.local` | `PORT`, `API_PREFIX`, `APP_ENV`    |
| `service.fe`  | `.env.local`          | `VITE_API_TARGET`                  |

> Ficheiros `.env`/`.env.local` estão no `.gitignore`. Os `.env.example` versionados servem de referência.

## Testes

```bash
# Backend
cd service.srv
npm test            # unitários (Jest)
npm run test:e2e    # end-to-end

# Frontend
cd service.fe
npm test            # Vitest (jsdom + Testing Library)
npm run test:coverage
```

## Build

```bash
cd service.srv && npm run build   # -> dist/  (nest build)
cd service.fe  && npm run build   # -> dist/  (vite build)
```

## Deploy (Google App Engine)

Cada serviço tem um `app.yaml` por ambiente em `deploy/{dev,pre,prd}/gae/`:

- **`service.srv`** — serviço GAE `srv`, runtime `nodejs22`, `entrypoint: npm run start:prod`.
- **`service.fe`** — serviço GAE `default`, SPA estático servido a partir de `dist/`.

Exemplo de deploy (a partir da raiz de cada serviço):

```bash
# Backend — ambiente dev
cd service.srv && gcloud app deploy deploy/dev/gae/app.yaml

# Frontend — ambiente dev
cd service.fe && npm run build && gcloud app deploy deploy/dev/gae/app.yaml
```
