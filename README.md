# Galleries Manager API

REST API foundation for a furniture gallery management platform.

The current milestone contains infrastructure and the architecture required by
`SCHEMA.md`. Domain database fields and business endpoints will be added only
after their contracts are defined.

## Technology

- Node.js 22+
- Express 5
- PostgreSQL
- Prisma 7
- JWT authentication
- `express-validator`
- Node.js test runner and Supertest

## Setup

```bash
nvm use
npm install
cp .env.example .env
npm run prisma:generate
npm run start:dev
```

Replace all placeholders in `.env` before starting the server. Never commit real
credentials.

The API is mounted at `/api/v1`. The currently available endpoint is:

```http
GET /api/v1/health
```

## Environment variables

| Variable         | Required | Purpose                                      |
| ---------------- | -------- | -------------------------------------------- |
| `NODE_ENV`       | No       | `development`, `test`, or `production`       |
| `PORT`           | No       | HTTP port; defaults to `3000`                |
| `DATABASE_URL`   | Yes      | PostgreSQL connection URL used by Prisma     |
| `JWT_SECRET`     | Yes      | Secret used to sign and verify access tokens |
| `JWT_EXPIRES_IN` | No       | Default token lifetime; defaults to `1d`     |

## Commands

| Command                         | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `npm start`                     | Start the production process             |
| `npm run start:dev`             | Start with Nodemon                       |
| `npm test`                      | Run automated tests                      |
| `npm run lint`                  | Run ESLint                               |
| `npm run format`                | Format project files                     |
| `npm run format:check`          | Verify formatting                        |
| `npm run prisma:validate`       | Validate Prisma configuration and schema |
| `npm run prisma:generate`       | Generate Prisma Client                   |
| `npm run prisma:migrate:dev`    | Create/apply a development migration     |
| `npm run prisma:migrate:deploy` | Apply committed migrations               |

No migration exists because domain model fields have intentionally not been
inferred.

## Request lifecycle

Protected requests follow the order required by `SCHEMA.md`:

```text
validation
→ authentication
→ authorization
→ controller
→ service
→ Prisma / PostgreSQL
```

- Validation exists only in validation middleware.
- Controllers translate HTTP input/output and call services.
- Services contain business logic and are the only feature layer that accesses
  Prisma.
- Generic authorization handles roles; feature services will enforce ownership
  and gallery membership.
- Errors are handled centrally.

## Folder architecture

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.js

src/
├── app.js
├── server.js
├── config/
│   ├── prisma.js
│   ├── env.js
│   └── logger.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorization.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   ├── notFound.middleware.js
│   └── upload.middleware.js
├── modules/
│   ├── auth/
│   ├── users/
│   ├── galleries/
│   ├── employees/
│   ├── products/
│   └── craftsmen/
├── routes/
│   └── index.js
└── shared/
  ├── services/
  ├── constants/
  │   ├── roles.js
  │   └── permissions.js
  └── utils/
    ├── ApiError.js
    ├── ApiResponse.js
    ├── catchAsync.js
    ├── jwt.js
    └── hash.js

storage/
└── uploads/
  ├── users/
  ├── galleries/
  └── products/

test/
├── integration/
└── unit/
```

Each feature directory contains its singularly named routes, controller,
service, validation, and constants files. They are intentionally inert until
their domain contracts are defined. Domain routers are not mounted yet.

## Roles

- `admin`
- `gallery_owner`
- `employee`
- `craftsman`
- `user`

## Deferred scope

Do not implement orders, payments, reviews, favorites, or notifications. The
craftsman module must not expose endpoints or business logic yet; its Prisma
model will be added after its fields are specified.
