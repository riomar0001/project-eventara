**Feature Name:** <Feature Name>

Please generate the complete code for this feature, adhering to the following requirements:

## 1. Controller & Route
- Create the endpoint that parses and validates the incoming request payload.
- Include route-level docstrings compatible with OpenAPI/Swagger documentation.
- Map all exceptions to standard HTTP error responses with clean, user-safe messages.

## 2. Use Case / Service Layer
- Extract core business logic into a dedicated, testable use-case class.
- Include docstrings for each class and function explaining purpose, inputs, outputs, and side effects.

## 3. Concurrency Control
- Strictly prevent race conditions.
- Implement appropriate locking or serialization strategies (database transactions, optimistic/pessimistic locking, atomic operations, or Redis distributed locks) based on the specific use case.
- Document the chosen concurrency control method and why in the use-case docstring.

## 4. Custom Exceptions
- Define specific custom exception classes for anticipated failure modes (e.g., `EmailAlreadyTakenError`, `InvalidDataError`).
- All domain exception messages must be user-safe — never embed raw framework exceptions or internal identifiers.

## 5. Error Handling
- Catch all exceptions at the route layer and map them to standard HTTP responses (400, 404, 409, 500, etc.).
- Domain exceptions should carry static, user-facing messages.
- Include error mapping documentation in the route handler's docstring.
- All error detail follows a **debug-gated** pattern controlled by `settings.DEBUG`:
  - **`DEBUG=True`:** Include the full framework exception message in the response (Pydantic validation `input`/`ctx`/`url` fields, raw `str(exc)` in catch-all blocks, JWT decode details, etc.) so developers can diagnose issues without checking server logs.
  - **`DEBUG=False`:** Use static, user-safe messages only. Catch-all `except Exception` blocks must never interpolate `str(e)` or `str(exc)` into response details. Validation error responses should only include `loc`, `msg`, and `type`. Authentication errors should return a generic `"Not authenticated"` message regardless of the underlying cause.

## 6. Code Quality & Documentation
- Adhere strictly to the DRY principle. Leverage built-in framework features over boilerplate.
- **High-level documentation only:** Provide clear docstrings for modules, classes, and functions (controllers, use cases, repositories). All explanations of business logic, domain rules, and the "why/how" must be confined to these docstrings.
- **Zero inline comments:** Do not write any inline comments, block comments, or narrative explanations inside function bodies. Code should be self-documenting through clean variable and method names.
- **DTO, schema, and exception exclusion:** Do not generate docstrings or comments for DTOs, validation schemas, or exception classes.

## 7. Commit Message Generation
- After generating the code, produce a commit message with:
  - A concise subject line describing the feature
  - A detailed description body
  - At least one bullet point summarizing the key change
  - No author or user info
- Do **not** actually commit the code.
