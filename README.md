# Galleries Manager API

REST API foundation for a furniture gallery management platform.

The current milestone contains infrastructure and the architecture required by
`SCHEMA.md`. Domain database fields and business endpoints will be added only
after their contracts are defined.

## Technology

- Node.js 24+
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

## Image storage

Image uploads are held in Multer memory, validated/converted by Sharp, resized,
and saved as WebP at quality 90 through the storage service. Processed images
target an average size of 60-100 KB, but file size varies with image content and
dimensions; this is not a per-image size limit. Incoming uploads are limited to
200 KB per file. `STORAGE_PROVIDER=local` (the default) stores files under
`storage/uploads/<type>/<folder>/<file>`. Set `STORAGE_PROVIDER=r2` to store the
same object keys in Cloudflare R2; the existing `/storage/uploads/...` image
paths redirect to `R2_PUBLIC_URL`.

For R2, configure `S3_BUCKET_ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`,
`R2_BUCKET_NAME`, and `R2_PUBLIC_URL` in the deployment environment. These names
match Cloudflare's S3 credentials. `R2_PUBLIC_URL` should be the root of a public
R2 bucket or its custom domain. The access key needs object read/write/delete
and bucket-list permissions. Keep credentials private; only the public URL is
sent to image clients. Cloudflare's `ACCOUNT_ID` and `API_TOKEN` aren't used by
the S3-compatible client; the endpoint and access-key pair provide its
connection details.

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
| `JWT_EXPIRES_IN` | No       | Default token lifetime; defaults to `1h`     |

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

## Sending emails

Emails use Resend as the primary provider. If Resend explicitly reports that its
sending quota or limit has been reached, the same rendered message is sent via
Brevo's HTTP API. Other Resend errors are propagated without a retry,
avoiding hidden failures and duplicate sends.

                    sendEmail()
                         │
                         ▼
                  Render once
                         │
                    { html, text }
                         │
                         ▼
              Send with Resend
                   │
           quota/limit exhausted?
              ↙             ↘
           Brevo API       Return error

flowchart TD
A["Auth Service"] -->|"await sendEmail(options, purpose)"| B["sendEmail"]

    B -->|"await"| C["renderEmailTemplate(options, purpose)"]

    C --> D{"purpose"}

    D -->|"email_verification"| E["Validate OTP"]
    D -->|"password_reset"| F["Validate OTP"]

    E --> G["Render Email Verification JSX"]
    F --> H["Render Password Reset JSX"]

    G --> I["{ html, text }"]
    H --> I

    I --> J{"SENDER"}

    J -->|"RESEND (default)"| K["sendEmailWithResend"]
    J -->|"GMAIL (legacy)"| L["sendEmailWithGmail"]

    K --> M["Resend API"]
    L --> N["SMTP / Gmail"]

    M -->|"quota/limit exhausted"| P["Brevo API"]
    M -->|"success"| O["Email sent"]
    P --> O
    N --> O

Configure `RESEND_API_KEY` and set `RESEND_FROM` to the verified sender email
address (the display name is set to `🛋️GALLERI` by the app). For failover, configure
`BREVO_API_KEY` from your Brevo API settings and set `BREVO_FROM` to a sender
address verified in Brevo. Keep `SENDER=RESEND` (or leave it unset) to enable
Resend with Brevo API fallback. `SENDER=BREVO` sends directly through Brevo's
API, while `SENDER=GMAIL` remains available as a legacy option.
