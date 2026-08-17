# ShopPay Backend Coding Standards

This document describes the architecture and coding patterns that are actually present in the ShopPay backend. Use it when extending this project or when building another project that should resemble it.

The codebase is not fully uniform. Where multiple styles exist, this guide distinguishes the dominant pattern from a current inconsistency. Do not copy known typos or defects merely because they exist in an older file.

## 1. Project Overview

- **Runtime:** Node.js
- **Web framework:** Express
- **Database:** MongoDB through Mongoose
- **Module system:** CommonJS (`require`, `module.exports`, and `exports.<name>`)
- **Architecture:** MVC-style, organized primarily by technical layer
- **API prefix:** `/api/v1`
- **Main request flow:** route → middleware/validator → controller or generic handler → Mongoose model
- **Business logic location:** mainly controllers, validators, and model hooks
- **Service layer:** the local working tree contains an empty `services/` directory, but no service files are tracked; this project does not currently use a service abstraction

## 2. Complete Folder Structure

The current working-tree and runtime-relevant structure is shown below. Empty local directories such as `images/` and `services/` are not tracked by Git and therefore do not exist in a fresh checkout unless recreated:

```text
shoppay/
├── .claude/
│   ├── setting.local.json
│   ├── settings.local.json        # Local, untracked Claude configuration
│   └── worktrees/                 # Generated local worktrees, not application code
├── .vscode/
│   └── settings.json
├── config/
│   └── database.js
├── controllers/
│   ├── addressController.js
│   ├── authController.js
│   ├── brandController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── couponController.js
│   ├── handlersFactory.js
│   ├── orderController.js
│   ├── productController.js
│   ├── reviewController.js
│   ├── subCategoryController.js
│   ├── userController.js
│   └── wishListController.js
├── images/                        # Empty local directory; not tracked by Git
├── middlewares/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── uploadImageMiddleware.js
│   └── validatorMiddleware.js
├── models/
│   ├── brandModel.js
│   ├── cartModel.js
│   ├── categoryModel.js
│   ├── couponModel.js
│   ├── orderModel.js
│   ├── productModel.js
│   ├── reviewModel.js
│   ├── subCategoryModel.js
│   └── userModel.js
├── routes/
│   ├── addressRouter.js
│   ├── authRouter.js
│   ├── brandRoute.js
│   ├── cartRouter.js
│   ├── categoryRoute.js
│   ├── couponRouter.js
│   ├── index.js
│   ├── orderRouter.js
│   ├── productRoute.js
│   ├── reviewRouter.js
│   ├── subCategoryRoute.js
│   ├── userRoute.js
│   └── wishListRouter.js
├── services/                      # Empty local directory; not tracked by Git
├── uploads/                       # Runtime-generated image output
│   ├── brands/
│   ├── categories/
│   ├── products/
│   └── user/
├── utils/
│   ├── dummyData/
│   │   ├── products.json
│   │   └── seeder.js
│   ├── validators/
│   │   ├── addressValidator.js
│   │   ├── authValidator.js
│   │   ├── brandValidator.js
│   │   ├── cartValidator.js
│   │   ├── categoryValidator.js
│   │   ├── couponValidator.js
│   │   ├── productValidator.js
│   │   ├── reviewValidator.js
│   │   ├── subCategoryValidator.js
│   │   ├── userValidator.js
│   │   └── wishListValidator.js
│   ├── apiError.js
│   ├── apiFeatures.js
│   ├── generateOTP.js
│   └── sendEmail.js
├── .eslintrc.json
├── .gitignore
├── API_DOCUMENTATION.md
├── CLAUDE.md
├── README.md
├── config.env                    # Local secret-bearing configuration; do not edit or expose
├── package-lock.json
├── package.json
├── server.js
└── todo.txt
```

Excluded from the expanded tree:

- `.git/` contains Git internals.
- `node_modules/` contains installed dependencies.
- Files inside `uploads/` are generated runtime assets, not source modules.
- `package-lock.json` is generated dependency metadata.
- `config.env` is local and secret-bearing. Never include its values in documentation, logs, or source changes.

## 3. Application Composition

`server.js` is the application entry point. Its established initialization order is:

1. Load `config.env` with `dotenv`.
2. Import and run the MongoDB connection function.
3. Create the Express application.
4. Enable `express.json()`.
5. Expose `uploads/` through Express static middleware.
6. Enable Morgan only in development.
7. Mount all domain routers through `routes/index.js`.
8. Add the unmatched-route handler.
9. Add the global error middleware last.
10. Start the HTTP server.
11. Handle unhandled promise rejections by closing the server and exiting.

Preserve middleware ordering. In particular, the global error middleware must remain after routes, and route-specific validators must run before their controllers.

`routes/index.js` is the central route registry. It mounts domain routers under `/api/v1`:

| Domain         | Base path               |
| -------------- | ----------------------- |
| Authentication | `/api/v1/auth`          |
| Users          | `/api/v1/users`         |
| Categories     | `/api/v1/categories`    |
| Subcategories  | `/api/v1/subcategories` |
| Brands         | `/api/v1/brands`        |
| Products       | `/api/v1/products`      |
| Reviews        | `/api/v1/reviews`       |
| Wishlist       | `/api/v1/wishlist`      |
| Addresses      | `/api/v1/addresses`     |
| Coupons        | `/api/v1/coupons`       |
| Cart           | `/api/v1/cart`          |
| Orders         | `/api/v1/orders`        |

The README and older API documentation contain some stale `/api` examples. The mounted code in `routes/index.js` is authoritative.

## 4. Module Organization

### Domain modules

A normal resource is split across the technical layers:

```text
models/<domain>Model.js
controllers/<domain>Controller.js
routes/<domain>Route.js or routes/<domain>Router.js
utils/validators/<domain>Validator.js
```

For example, the category resource consists of:

```text
models/categoryModel.js
controllers/categoryController.js
routes/categoryRoute.js
utils/validators/categoryValidator.js
```

Not every domain requires every layer. Orders currently have a model, controller, and router but no dedicated validator file. Addresses and wishlist data are stored on `User` rather than in separate Mongoose models.

### Generic CRUD organization

`controllers/handlersFactory.js` exports higher-order CRUD handlers:

- `deleteOne(Model)`
- `updateOne(Model)`
- `createOne(Model)`
- `getOne(Model, populateOpts)`
- `getAll(Model, modelName)`

Use these handlers for straightforward model CRUD when their existing behavior is sufficient. Keep a domain controller as the named public interface, for example:

```js
exports.createCategory = handlersFactory.createOne(Category);
```

Use a custom controller when an operation coordinates multiple models, works with embedded documents, performs domain calculations, or requires a custom response.

### Nested resources

Nested routers use `express.Router({ mergeParams: true })` so child resources can read parent route parameters.

Current nested relationships are:

- Categories mount subcategories.
- Products mount reviews.

A controller middleware function may normalize the nested parameter into the request body before the generic create handler. List middleware may create `req.filterObj` for the generic `getAll` handler.

### Model relationships

The major relationships are:

- `SubCategory.category` references `Category`.
- `Product.category` references `Category`.
- `Product.subcategories` contains `SubCategory` references.
- `Product.brand` references `Brand`.
- `Product` exposes reviews through virtual population.
- `Review.user` and `Review.product` reference `User` and `Product`.
- `User.wishList` contains `Product` references.
- `User.addresses` contains embedded address subdocuments.
- `Cart.user` references `User` and is unique per user.
- Cart items contain a `Product` reference plus quantity, color, and price snapshots.
- Orders contain cart item data and references to users and products.

## 5. Naming Conventions

### Directories

Use lowercase plural nouns for technical-layer directories:

```text
controllers/
middlewares/
models/
routes/
services/
utils/
validators/
```

### JavaScript identifiers

- Use **lower camel case** for functions, methods, variables, request properties, schema instances, and module instances.
  - Examples: `dbConnection`, `mountRoutes`, `calculateCartTotalPrice`, `productSchema`, `priceAfterDiscount`.
- Use **PascalCase** for classes and Mongoose model variables.
  - Examples: `ApiError`, `ApiFeatures`, `Product`, `User`, `Order`.
- Use action-oriented controller names.
  - Generic actions: `getCategories`, `getCategory`, `createCategory`, `updateCategory`, `deleteCategory`.
  - Domain actions: `addProductToCart`, `updateCartItemQuantity`, `applyCoupon`, `createCashOrder`.
- Use descriptive middleware names that state what they do.
  - Examples: `protect`, `allowTo`, `uploadSingleImage`, `resizeCategoryImage`.

### Request and schema fields

Use lower camel case for fields:

```text
imageCover
priceAfterDiscount
ratingsAverage
passwordChangedAt
shippingAddress
cartItems
```

Keep field spelling consistent across schema definitions, validators, controllers, and response consumers.

### API paths

- Resource paths are lowercase and usually plural: `/products`, `/categories`, `/orders`.
- Resource identifiers use `/:id`.
- The existing code also uses action-style camel-case paths such as `/forgotPassword`, `/getMe`, and `/applyCoupon`.
- Follow the neighboring router's style when extending an established domain; do not rename existing public paths as part of unrelated work.

### Existing naming inconsistencies

These are compatibility details, not conventions to reproduce:

- Route files use both `Route.js` and `Router.js` suffixes.
- Wishlist appears as `wishList` in code and `/wishlist` in the API.
- Subcategory naming varies among `SubCategory`, `subCategory`, `subcategory`, and `subcategories` depending on context.
- Existing misspellings such as `verfyResetPasswordOTP`, `avrageRating`, `excludesFields`, and `passwrod` should not be used as templates for new names.

For a new file in an existing area, match adjacent filenames. For a new, independent domain, use one consistent suffix across all files added for that domain.

## 6. File Naming Conventions

Use these dominant patterns:

| Module type           | Pattern                                       | Example                            |
| --------------------- | --------------------------------------------- | ---------------------------------- |
| Mongoose model        | singular lower-camel domain + `Model.js`      | `productModel.js`                  |
| Controller            | singular lower-camel domain + `Controller.js` | `productController.js`             |
| Validator             | singular lower-camel domain + `Validator.js`  | `productValidator.js`              |
| Middleware collection | purpose + `Middleware.js`                     | `authMiddleware.js`                |
| Utility               | lower-camel purpose                           | `apiError.js`, `sendEmail.js`      |
| Route                 | domain + `Route.js` or `Router.js`            | `productRoute.js`, `cartRouter.js` |

Route filename suffixes are mixed in the current repository. Do not claim or assume that one is enforced globally. Match the naming used by related files unless deliberately standardizing the whole route layer in a dedicated change.

Acronym casing is also not completely uniform: `generateOTP.js` exports a function used as `generateOtp`. Prefer readable JavaScript identifier casing while preserving existing import paths.

## 7. Route Responsibilities

Route modules should:

- Create and export an Express router.
- Define HTTP methods and URL paths.
- Import controller actions and validator arrays.
- Arrange middleware in execution order.
- Apply router-wide authentication or authorization when every route shares the same policy.
- Mount nested routers where the resource relationship requires it.
- Keep database and business logic out of route declarations.

For a protected image mutation, the dominant sequence is:

```text
protect
→ allowTo
→ upload middleware
→ resize/process image middleware
→ validator
→ controller
```

The current user update route is an exception: it places validation before upload and resize middleware. Do not infer that this ordering is generally safe for multipart fields; choose the order based on when the validator needs uploaded or normalized data.

For ordinary protected writes, use:

```text
protect
→ allowTo
→ validator
→ controller
```

Public read routes are commonly declared before router-wide protection. Router-wide middleware is used for uniformly protected domains such as addresses, cart, and coupons.

Every middleware in a chain must finish by doing exactly one of the following:

- call `next()`;
- call `next(error)`;
- send a response.

## 8. Controller Responsibilities

Controllers are the primary application layer in this codebase. They are responsible for:

- Reading normalized input from `req.params`, `req.body`, `req.user`, `req.file`, `req.files`, and properties attached by earlier middleware.
- Calling Mongoose models directly.
- Delegating simple CRUD to `handlersFactory`.
- Coordinating multi-model operations.
- Manipulating embedded documents.
- Performing domain calculations and mutations.
- Returning the HTTP response.
- Passing anticipated failures to the global error flow.

Examples of controller-owned workflows include:

- Adding or merging cart items and recalculating cart totals.
- Applying coupon discounts.
- Creating an order from a cart, decrementing stock, and deleting the cart.
- Adding, updating, and removing embedded user addresses.
- Resizing uploaded images with Sharp before persistence.

### Async handlers

Wrap asynchronous Express handlers with `express-async-handler`:

```js
exports.actionName = asyncHandler(async (req, res, next) => {
  // await model operations
});
```

This is the dominant mechanism for forwarding rejected promises to the global error middleware.

### Request mutation

Request properties set by previous middleware are part of the operation contract. Existing examples include:

- `req.user` from authentication.
- `req.filterObj` for generic filtered lists.
- `req.product`, `req.cart`, `req.cartItem`, and `req.coupon` from cart validators.
- `req.body.category`, `req.body.product`, and `req.body.user` from nested-resource middleware.

When adding such a property, set it before the consuming controller and keep the producer and consumer names identical.

### Controller boundaries

Do not introduce a service call merely to imitate an architecture that is not present. Add controller logic consistently with the current design unless a service-layer refactor is an explicit project goal. Conversely, avoid putting business logic directly in route files.

## 9. Service Responsibilities

There is currently **no implemented service layer**. The `services/` directory is empty.

Therefore:

- Do not document services as a required intermediary between controllers and models.
- Do not assume a service module exists for a domain.
- Do not create thin pass-through services for otherwise straightforward Mongoose calls.
- If a future change intentionally introduces services, define that architecture as a separate refactor and apply it consistently rather than mixing it silently into one resource.

Current service-like responsibilities are distributed among:

- Controllers for workflows and business rules.
- Validators for request checks, database-backed checks, normalization, and selected document loading.
- Model hooks and static methods for persistence-related behavior.
- `handlersFactory` for reusable CRUD behavior.
- Utilities for reusable infrastructure helpers.

## 10. Middleware Responsibilities

### Authentication middleware

`middlewares/authMiddleware.js` owns:

- Reading the `Authorization` header.
- Enforcing the `Bearer <token>` format.
- Verifying JWTs.
- Loading the current user document.
- Attaching that document to `req.user`.
- Rejecting tokens for deleted users or users who changed their password after token issuance.
- Checking role-based authorization.

Current authentication edge cases must not be treated as standards: `protect` decodes and dereferences a token before verifying it, so malformed tokens can cause an internal error; its password-change timestamp comparison mixes millisecond dates with whole-second JWT issuance timestamps, so a newly issued token can be rejected within the same second.

### Validation result middleware

`middlewares/validatorMiddleware.js` owns the `express-validator` result check. Field-validation chains place it after their checks so accumulated errors produce an HTTP 400 response before later work runs. In simple validators it is the final item; cart validators may continue afterward with document loaders and business-rule checks.

### Upload middleware

`middlewares/uploadImageMiddleware.js` owns reusable Multer configuration:

- Memory storage.
- Single-image and mixed-field upload factories.
- Image MIME-type rejection.

Domain controllers own Sharp resizing, conversion to JPEG, generated filenames, destination folders, and assigning filenames to `req.body`.

### Error middleware

`middlewares/errorMiddleware.js` is the final Express error handler. It:

- Uses the error's status code when available.
- Produces detailed error output in development.
- Produces a smaller response in production.
- Attempts to normalize selected JWT failures.

The expiration branch currently checks `ExpiredTokenError`, while `jsonwebtoken` reports `TokenExpiredError`; expiration normalization therefore does not work through that branch. Keep the middleware after all routes and unmatched-route handling, but do not reproduce the incorrect error name in new JWT handling.

### Middleware scope

Use router-wide middleware when every endpoint in a router has the same protection. Use route-level middleware when policies differ between read, create, update, and delete operations.

## 11. Validation Approach

Validation is implemented at two complementary levels.

### Request validation

Request validators live in `utils/validators/` and use `express-validator`. A validator module normally exports arrays named after the operation:

```text
create<Category>Validator
update<Category>Validator
delete<Category>Validator
get<Category>Validator
```

The exact operation names follow the domain controller vocabulary.

A validator array should:

1. Validate relevant fields and parameters.
2. Normalize or sanitize values when needed.
3. Perform custom synchronous or asynchronous checks.
4. Run `validatorMiddleware` after all `express-validator` chains.
5. Optionally continue with document-loading or business-rule middleware that depends on syntactically valid input.

Most validator arrays end with `validatorMiddleware`; cart validators demonstrate the extended form by placing loaders and additional checks after it.

Common checks include:

- `.isMongoId()` for route and reference IDs.
- `.notEmpty()` for required input.
- Type and range checks for strings, arrays, numbers, and dates.
- Cross-field checks with `.custom()`.
- Database-backed existence and uniqueness checks.
- Parent/child relationship checks, such as ensuring subcategories belong to a category.

### Validation can normalize input

Existing validators intentionally mutate request data. Examples include:

- Generating `req.body.slug` from a name or title.
- Defaulting a cart quantity to one.
- Converting quantity input to an integer.
- Normalizing optional cart colors.
- Loading documents and attaching them to the request for the controller.

When a validator mutates the request, make that behavior explicit in its name or route placement and ensure the consuming controller relies on the normalized value.

### Schema validation

Mongoose schemas enforce persistence rules including:

- Required fields.
- Minimum and maximum values.
- Enums.
- Unique indexes.
- Compound indexes.
- Reference validation in selected models.

Request validation improves API errors, while schema validation protects persisted data. Do not remove schema constraints because an endpoint already validates its request.

### Current validation boundaries

Validation coverage is not perfectly uniform:

- Validation failures currently return HTTP 400.
- Some validators perform database reads and attach documents to `req`.
- Some update validators require fields rather than treating every field as optional.
- Auth recovery routes and order routes do not all have dedicated validators.
- The generic update factory does not explicitly enable `runValidators`.

Treat these as current implementation details. Do not claim validation is universally complete or that it always returns 422.

## 12. Authentication and Authorization Patterns

### Passwords and tokens

- User passwords are hashed with bcrypt in a Mongoose `pre("save")` hook when creation or an explicit `save()` runs.
- The user model creates JWTs containing `userId`.
- Login compares the submitted password through a user instance method.
- Protected endpoints expect `Authorization: Bearer <token>`.
- Authentication attaches the full Mongoose user document to `req.user`, not only an ID.

Controllers access the authenticated user through values such as:

```js
req.user._id;
req.user.role;
```

### Roles

The user model defines these roles:

```text
user
manager
admin
```

Authorization uses `allowTo` after `protect`. The dominant route usage passes an array:

```js
protect,
allowTo(["admin", "manager"]),
```

Use arrays for new authorization declarations because `allowTo` tests membership with `.includes()` and arrays communicate the intended contract clearly.

### Policy placement

- Public authentication endpoints do not use `protect`.
- Catalog reads are generally public.
- Catalog writes are generally limited to `admin` and `manager`.
- Wishlist, address, and cart routes are limited to normal users.
- User-management routes are generally admin-only after the current-user endpoint.

Check each existing router before adding a route; policies differ by domain.

### Existing authorization inconsistencies

Some current routes pass a string instead of an array, and one review route passes multiple positional role arguments even though `allowTo` accepts one argument. Order routing also restricts access more narrowly than one controller branch suggests. Do not reproduce these call forms in new code. Use one array argument and verify that the router policy makes every intended controller branch reachable.

Password-reset/OTP code also contains incomplete or inconsistent behavior. Preserve public compatibility when fixing it, but do not use the current OTP comparison or unmounted reset action as a model for new authentication flows.

Password-handling and serialization have two important current defects:

- The generic user update uses `findByIdAndUpdate`, which does not run the `pre("save")` password-hashing hook. Because its validator accepts a password, that route can persist plaintext unless hashing is handled explicitly.
- The password field is not configured with `select: false` and has no serialization transform. Authentication responses that return the user document can therefore expose the stored password hash.

Do not reproduce either behavior. Hash passwords through a save path or explicit bcrypt operation, and exclude password data from API responses.

The schema supports `manager`, but the current create/update user validators accept only `user` and `admin`. This means manager is an authorization role that cannot be assigned through those validated operations; treat that mismatch as an implementation gap, not an intentional role policy.

## 13. Error Handling Conventions

### Operational errors

Use `utils/apiError.js` for anticipated operational failures:

```js
return next(new ApiError("Resource not found", 404));
```

`ApiError` carries:

- `message`
- `statusCode`
- derived `status` (`fail` for 4xx, `error` for 5xx)
- `isOperational`

Typical operational cases include:

- Invalid authentication: 401.
- Insufficient permissions: 403.
- Missing resources: 404.
- Invalid input or business-rule failures: 400.

Return immediately when forwarding an error so the handler does not continue.

### Async failures

Use `express-async-handler` instead of local `try/catch` blocks around every async controller. Rejected model operations then flow to the global error middleware.

### Validation failures

`validatorMiddleware` directly returns:

```js
{
  errors: [
    /* express-validator errors */
  ];
}
```

with HTTP 400.

### Environment-specific global errors

Development responses include:

- `status`
- complete `error`
- `message`
- `stack`

Production responses include:

- `status`
- `message`

Do not expose stacks or internal error objects in production responses.

### Current error inconsistencies

A few authentication and user actions send direct `{ message }` errors instead of forwarding `ApiError`. The unknown-route handler also currently uses 400. The project therefore does not have one universally enforced error envelope. For new controller code, prefer `next(new ApiError(...))` unless matching a specific established public response is required.

## 14. Response Format Conventions

There is no single response envelope across every endpoint. The dominant shapes are:

### Single resource

```js
{
  data: document;
}
```

### Resource list

```js
{
  results: number,
  paginationResult: object,
  data: documents
}
```

### Custom mutation or workflow

```js
{
  message: "Human-readable result",
  data: document
}
```

Some custom responses omit either `message` or `data` when it is not relevant.

### Validation error

```js
{
  errors: validationErrors;
}
```

### Operational/global error

Production normally returns:

```js
{
  status: "fail" | "error",
  message: "Human-readable error"
}
```

### Status codes

Use the status codes established in the controllers:

- `200 OK` for successful reads and updates.
- `201 Created` for successful creation.
- `204 No Content` for successful deletion without a response body.
- `400 Bad Request` for validation and invalid business input.
- `401 Unauthorized` for missing or invalid authentication.
- `403 Forbidden` for insufficient authorization.
- `404 Not Found` for missing resources.

A 204 response must not include a meaningful body.

Do not state that every success includes `status: "success"`; the current generic handlers do not use that envelope. Preserve the established response of an endpoint when changing it to avoid accidental API breakage.

## 15. Database Access Pattern

### Direct Mongoose usage

Controllers and validators import Mongoose models directly. There is no repository/data-access abstraction and no active service layer.

Use:

- `handlersFactory` for ordinary CRUD.
- Direct model operations for custom workflows.
- Document methods for changes to an already loaded document.
- Model hooks or static methods for persistence behavior that belongs to the model.

Existing operation styles include:

```js
Model.find();
Model.findById();
Model.findOne();
Model.create();
Model.findByIdAndUpdate();
Model.findByIdAndDelete();
document.save();
```

### Generic query features

`utils/apiFeatures.js` provides a chainable query helper for list endpoints:

```js
new ApiFeatures(Model.find(filter), req.query)
  .filter()
  .sort()
  .limitFields()
  .search(modelName)
  .paginate(countDocuments);
```

It supports:

- Filtering.
- Comparison operators (`gte`, `gt`, `lte`, `lt`).
- Sorting.
- Field projection.
- Keyword search.
- Pagination.

The current pagination default is 50 items. Older documentation that says 10 does not match the implementation. The generic handler calculates pagination metadata from an unfiltered `Model.countDocuments()` before applying nested filters, query filters, or search. As a result, `numberOfPages` and `next` can be inaccurate for filtered, nested, or searched lists. Do not treat the current metadata as a filtered-count guarantee.

### Filtering nested resources

Controllers can assign `req.filterObj` before calling the generic list handler. `getAll` merges that object into the model query. Use this for nested list routes rather than duplicating the full generic query implementation.

### Population and hooks

Models use query middleware and virtuals for repeated relationship behavior:

- Product queries populate category data.
- Product virtuals expose reviews.
- Review queries populate user data.
- Order queries populate user and product data.
- Review writes update aggregate product ratings.
- User saves hash modified passwords.
- Catalog model hooks convert stored image filenames to public URLs in query results.

Keep cross-cutting model behavior near the schema when it must apply consistently to all relevant operations. Keep request-specific behavior in validators or controllers.

### Multi-model workflows

Order and cart operations coordinate multiple writes directly from controllers. The current code does not establish a general transaction convention. Do not claim operations are transactional unless a Mongoose session is explicitly added and used.

## 16. Model Conventions

A model file generally:

1. Imports Mongoose and any model-specific dependency.
2. Defines a lower-camel-case schema variable.
3. Defines fields, validation, references, timestamps, indexes, virtuals, methods, statics, and hooks as needed.
4. Creates a PascalCase model.
5. Exports the model with `module.exports`.

Typical form:

```js
const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
  {
    // fields
  },
  { timestamps: true },
);

module.exports = mongoose.model("Domain", domainSchema);
```

Use references when data belongs to an independent collection and embedded subdocuments when the data is owned and updated with its parent, as demonstrated by user addresses and cart items.

Use indexes for uniqueness rules that must hold at the database level, such as one review per user/product pair and one cart per user.

## 17. Utility and Helper Usage

Utilities hold reusable behavior that is not an Express route/controller and is not tied to one model's persistence lifecycle.

Current utilities include:

- `ApiError`: operational HTTP errors.
- `ApiFeatures`: reusable list-query transformations.
- `generateOTP`: numeric OTP generation.
- `sendEmail`: Nodemailer transport and sending.
- `dummyData/seeder.js`: manual import/delete seed operations.

Utility modules generally export one function or class with `module.exports`.

Before adding a helper:

- Reuse an existing utility if it already owns the behavior.
- Keep domain-specific workflows in the relevant controller rather than creating a generic helper prematurely.
- Keep model lifecycle behavior in model methods/hooks.
- Keep HTTP middleware contracts in `middlewares/` or operation validators.

The seeder can delete database data. Treat it as an explicit manual tool and do not run destructive modes without confirmation.

## 18. Image Upload Pattern

Image-handling endpoints follow this pipeline:

1. Multer receives files into memory.
2. The route's upload middleware restricts accepted MIME types to images.
3. A domain resize middleware uses Sharp.
4. The image is resized and converted to JPEG.
5. A generated filename is written under the appropriate `uploads/<domain>/` directory.
6. The filename is assigned to `req.body` for model persistence.
7. Category, brand, and product model hooks expose public URLs using `BASE_URL`.
8. `server.js` serves `uploads/` statically.

User profile images stop at the stored filename: `userModel.js` has no equivalent image URL hook. Consumers must not assume every image field is serialized as an absolute URL.

Current upload destinations are:

```text
uploads/brands/
uploads/categories/
uploads/products/
uploads/user/
```

Keep generated assets out of source-focused changes. Ensure every upload/resize middleware advances the request with `next()` when there is no applicable file, or forwards an error. Do not copy the current product-resize control-flow edge case where some file combinations may fail to call `next()`.

## 19. Import Ordering

The dominant import organization is:

1. External packages.
2. Blank line.
3. Local models, middleware, utilities, controllers, and validators.

Example:

```js
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");

const Product = require("../models/productModel");
const ApiError = require("../utils/apiError");
```

Within local imports, keep related modules together. The repository does not enforce a consistent order between models, utilities, middleware, and factories.

Import grouping is not perfectly uniform in older route files. Preserve local readability and avoid unrelated import-only churn.

Use relative paths. The project has no configured source alias.

## 20. Exports and Module Style

Use CommonJS throughout:

```js
const dependency = require("dependency");
const localModule = require("../path/to/module");
```

For a module with one exported value:

```js
module.exports = value;
```

For controller or middleware modules with named functions:

```js
exports.actionName = handler;
```

Do not mix ES modules into individual files unless the project is deliberately migrated as a whole.

## 21. Formatting and Coding Style

The dominant style in recently edited files is:

- Two-space indentation.
- Semicolons.
- Double quotes.
- Trailing commas in multiline objects and argument lists.
- `const` by default and `let` only for reassigned bindings.
- Arrow functions for callbacks and middleware factories.
- Destructuring for imported controller actions and selected request data.
- Early returns after errors or completed responses.
- Short comments that explain a non-obvious step rather than restating the code.

Example:

```js
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError("Order not found", 404));
  }

  res.status(200).json({ data: order });
});
```

Older files also use single quotes and slightly different trailing-comma conventions. Quote style is therefore not repository-wide. When making a focused edit, match the surrounding file. When creating a new file, follow the dominant modern style above.

### ESLint configuration

ESLint extends:

- Airbnb.
- Prettier.
- Node recommended rules.

Project rule choices allow console output, parameter reassignment, and dangling underscores. `no-undef` remains an error. Unused Express callback arguments matching common names are ignored by the configured rule.

The repository does not define npm lint, format, or test scripts. Do not invent or report those commands as available. Existing package scripts are `start:dev` and `start:prod`.

## 22. Best Practices Established by the Codebase

When adding or changing code:

1. Keep changes small and focused on the requested domain.
2. Follow the existing route → middleware/validator → controller → model flow.
3. Use generic CRUD handlers when they match the required behavior.
4. Use custom controllers for workflows and calculations.
5. Wrap async Express handlers with `express-async-handler`.
6. Validate route IDs, required input, reference existence, and cross-field relationships before the controller.
7. Place `validatorMiddleware` after all `express-validator` chains and before any loaders that require valid input.
8. Use `ApiError` and `next()` for new anticipated operational failures.
9. Preserve middleware order, especially authentication before authorization and uploads before image processing.
10. Use `req.user` from `protect`; do not trust a client-supplied user ID for ownership.
11. Use an array when calling `allowTo`.
12. Preserve existing public response shapes unless an API change is explicitly requested.
13. Keep schema constraints even when equivalent request validation exists.
14. Use indexes for database-level uniqueness guarantees.
15. Reuse `ApiFeatures` for standard list filtering, search, sorting, field selection, and pagination.
16. Do not introduce repositories or services as though they already exist.
17. Do not expose environment values or edit `config.env` without explicit instruction.
18. Do not modify generated uploads, dependencies, or lockfiles unless the task requires it.
19. Ask before destructive database or filesystem actions, including seeder deletion mode.
20. Match the surrounding file's formatting to avoid unrelated churn.

## 23. Known Inconsistencies Not to Promote into Standards

The following are observed implementation inconsistencies. They must not be described as preferred patterns for future code:

- `Route.js` and `Router.js` filename suffixes are mixed.
- Double and single quotes are mixed.
- Response envelopes vary between generic and custom endpoints.
- Some direct error responses bypass `ApiError`.
- Some authorization calls pass strings or multiple role arguments instead of one role array.
- Review and order authorization policies do not fully match their apparent controller intent.
- Authentication can reject a just-issued token because password-change dates have finer precision than JWT `iat` values.
- Authentication decodes before verification and can throw on malformed token input.
- Production JWT expiration handling checks the wrong error name (`ExpiredTokenError` instead of `TokenExpiredError`).
- Some update validators require fields that other update validators treat as optional.
- Some routes do not have request validators.
- The generic update handler does not explicitly use `runValidators: true`; its user-password path also bypasses the save hook and can persist plaintext.
- Authentication responses can serialize the stored password hash because the schema does not exclude it.
- User validators omit the schema-supported `manager` role.
- User image URLs are not normalized like category, brand, and product image URLs.
- Generic list pagination counts all model documents before filters/search, so filtered metadata can be wrong.
- Product image resize middleware does not advance every possible file combination correctly.
- The password recovery flow contains incomplete or inconsistent OTP/reset behavior.
- The default query sort field contains a spelling mismatch with Mongoose timestamps.
- Older documentation uses a stale API prefix, environment names, pagination default, validation status, and npm commands.
- `services/` is empty despite older documentation describing it as a business-logic layer.
- There is no tracked automated test suite or test script.

When documentation and executable code disagree, verify the current route, controller, model, package script, or configuration consumer. Treat executable code as the source of truth, while recognizing that a visible defect should be fixed rather than copied.

## 24. New Domain Checklist

To add a domain that matches this architecture:

1. Add `models/<domain>Model.js` with schema validation, references, timestamps, indexes, and hooks as needed.
2. Add `utils/validators/<domain>Validator.js` when the domain accepts request data.
3. Add `controllers/<domain>Controller.js`.
4. Delegate simple CRUD actions to `handlersFactory` where appropriate.
5. Implement domain workflows directly in the controller unless an explicit service-layer refactor exists.
6. Add `routes/<domain>Route.js` or `<domain>Router.js`, choosing one style consistently for the new domain.
7. Order protection, authorization, uploads, processing, validation, and controller middleware correctly.
8. Mount the router in `routes/index.js` under `/api/v1`.
9. Use established response shapes and status codes.
10. Confirm references, access roles, nested route behavior, and error handling against adjacent modules.
11. Do not add a service file solely to populate the empty `services/` directory.
12. Verify the implementation manually because no project test command is currently defined.

# Project Requirements

This project uses a separate requirements file (SCHEMA.md).

SCHEMA.md is the source of truth for:

- Business rules
- Database schema
- Relationships
- User roles
- Permissions
- Endpoints
- Feature requirements

If any instruction in this document conflicts with SCHEMA.md, SCHEMA.md always takes precedence.

This document only defines HOW code should be written, not WHAT should be built.s
