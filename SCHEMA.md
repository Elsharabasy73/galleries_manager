# Furniture Gallery Management System

## Project Overview

Build a REST API for a furniture gallery management platform.

The platform manages furniture galleries, gallery owners, employees, products, and customers.

Use clean architecture and industry best practices.

Do NOT implement order/payment logic yet. It will be added later.

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma (or the ORM used in the existing project)
- JWT Authentication
- REST API

---

# General Rules

## Code Quality

- Follow SOLID principles.
- Keep controllers very small.
- Business logic belongs in services.
- Database logic belongs in repositories (if repository pattern exists).
- Never duplicate code.
- Reuse utilities whenever possible.
- Use consistent naming conventions.
- Keep functions small and focused.
- Use async/await only.
- Handle all errors centrally.

---

## Validation

Validation must ONLY exist inside validation middleware.

Controllers must NEVER contain validation logic.

Example:

Correct

Request
→ Validation Middleware
→ Authentication Middleware
→ Authorization Middleware
→ Controller
→ Service

Wrong

Controller

if (!req.body.name) ...

Never do this.

---

## Middlewares

Implement:

- Authentication Middleware
- Authorization Middleware
- Validation Middleware
- Global Error Handler
- Not Found Middleware (404)

---

## Authentication

Use JWT Authentication.

Every protected endpoint must require authentication.

---

## Authorization

Implement role-based authorization.

Roles:

- admin
- gallery_owner
- employee
- craftsman
- user

Only authorized roles can access protected endpoints.

---

# Database

Use PostgreSQL.

Design proper relationships.

Use foreign keys.

Use cascading where appropriate.

Use timestamps.

Every table should contain:

- id
- createdAt
- updatedAt

Use UUIDs if the existing project uses UUIDs.

---

# Roles

## Admin

- Full access to the entire platform.

---

## Gallery Owner

Each owner owns exactly ONE gallery.

After a gallery owner registers:

- Automatically create a gallery.
- Associate the gallery with the owner.

Permissions:

- Update gallery information.
- Create employees.
- Manage employees.
- Manage products.
- View gallery data.

When an employee is created:

- Automatically assign the employee to the owner's gallery.

---

## Employee

Belongs to exactly one gallery.

Permissions:

- Manage gallery products.
- Update their own profile.
- Delete their own account if allowed.

Employees cannot create galleries.

Employees cannot manage other galleries.

---

## Craftsman

Create the model only.

No business logic yet.

No endpoints yet.

---

## User

Regular customer.

Can:

- Browse galleries
- Browse products

Future features:

- Orders
- Favorites
- Reviews

Do not implement these yet.

---

# Resources

## Product

### Private

gallery_owner

employee

Permissions

- Create
- Update
- Delete

### Public

Everyone

Permissions

- Get One
- Get All

---

## Employee

### Gallery Owner

Permissions

- Create
- Get
- Update
- Delete

### Employee

Permissions

- Update own profile
- Delete own account

---

## Gallery

### Gallery Owner

Permissions

- Create
- Update
- Delete

A gallery should be automatically created after owner registration.

---

## Gallery Employee

### Gallery Owner

Permissions

- Create

### Employee

Permissions

- Update
- Delete

---

## Gallery Product

### gallery_owner

- Create
- Update
- Delete

### employee

- Create
- Update
- Delete

---

# Future Modules

Do NOT implement:

- Orders
- Payments
- Reviews
- Favorites
- Notifications

Only prepare the project so they can be added later.

---
# Project Structure

The project must follow a feature-based architecture.

```
prisma/
├── schema.prisma
├── migrations/
└── seed.js

src/
│
├── app.js
├── server.js
│
├── config/
│   ├── prisma.js
│   ├── env.js
│   └── logger.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorization.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   ├── notFound.middleware.js
│   └── upload.middleware.js
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.validation.js
│   │   └── auth.constants.js
│   │
│   ├── users/
│   │   ├── user.routes.js
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.validation.js
│   │   └── user.constants.js
│   │
│   ├── galleries/
│   │   ├── gallery.routes.js
│   │   ├── gallery.controller.js
│   │   ├── gallery.service.js
│   │   ├── gallery.validation.js
│   │   └── gallery.constants.js
│   │
│   ├── employees/
│   │   ├── employee.routes.js
│   │   ├── employee.controller.js
│   │   ├── employee.service.js
│   │   ├── employee.validation.js
│   │   └── employee.constants.js
│   │
│   ├── products/
│   │   ├── product.routes.js
│   │   ├── product.controller.js
│   │   ├── product.service.js
│   │   ├── product.validation.js
│   │   └── product.constants.js
│   │
│   └── craftsmen/
│       ├── craftsman.routes.js
│       ├── craftsman.controller.js
│       ├── craftsman.service.js
│       ├── craftsman.validation.js
│       └── craftsman.constants.js
│
├── routes/
│   └── index.js
│
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

---

# Request Lifecycle

Every request must follow this order:

Request
    │
Validation Middleware
    │
Authentication Middleware
    │
Authorization Middleware
    │
Controller
    │
Service
    │
Prisma
    │
PostgreSQL
    │
Response

---

# Layer Responsibilities

## Validation Middleware

Responsible for:

- Request body validation
- URL parameter validation
- Query parameter validation

Validation must NEVER be repeated inside controllers.

---

## Authentication Middleware

Responsible for:

- Verifying JWT
- Loading the authenticated user
- Attaching the user to `req.user`

---

## Authorization Middleware

Responsible for:

- Checking roles
- Checking permissions
- Returning 403 when unauthorized

---

## Controller

Controllers are responsible only for:

- Reading the request
- Calling exactly one service
- Returning the response
- Forwarding errors

Controllers must NEVER:

- Query Prisma
- Implement business logic
- Validate input
- Hash passwords

---

## Service

Services contain ALL business logic.

Examples:

- Register owner
- Automatically create gallery
- Assign employee to gallery
- Check ownership
- Handle transactions
- Coordinate multiple Prisma operations

Services are the only layer allowed to communicate with Prisma.

---

## Prisma

Prisma is responsible only for data persistence.

Business logic must never be implemented inside Prisma queries.

---

# Coding Style

- Consistent naming.
- Clean code.
- No duplicated logic.
- Proper error messages.
- Reusable validation schemas.
- Reusable middleware.
- Consistent API responses.
- Follow REST conventions.

# Request Lifecycle

Every protected endpoint must follow this flow:

Request
    │
Validation Middleware
    │
Authentication Middleware
    │
Authorization Middleware
    │
Controller
    │
Service
    │
Database (PostgreSQL)
    │
Response

## Responsibilities

### Validation Middleware

- Validate request body
- Validate route parameters
- Validate query parameters
- Return validation errors
- Controllers must never perform validation

### Authentication Middleware

- Verify JWT token
- Attach authenticated user to `req.user`

### Authorization Middleware

- Verify the authenticated user has the required role(s)
- Return 403 Forbidden if unauthorized

### Controller

Controllers should only:

- Receive the request
- Call the appropriate service
- Return the response
- Forward errors to the global error handler

Controllers must NOT:

- Perform validation
- Contain business logic
- Execute database queries

### Service

Services contain all business logic.

Examples:

- Automatically create a gallery after owner registration.
- Assign employees to the owner's gallery.
- Check business rules.
- Coordinate multiple database operations.

### Database

Only perform data access.
Business rules must never live in database queries.