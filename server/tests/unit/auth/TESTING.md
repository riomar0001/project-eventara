# Unit Testing Guide

## How It Works

A unit test isolates **one function** and verifies it behaves correctly — without touching a real database, Redis, or email server. Instead, those are replaced with **mocks** (fake objects you control).

```
Real flow:      login_verify() → Redis → Database → JWT library → Email
Unit test flow: login_verify() → FakeRedis → FakeDB → FakeJWT
```

---

## Anatomy of a Test

Every test has three parts: **Arrange → Act → Assert**

```python
async def test_success(self):
    # 1. ARRANGE — set up fakes
    user = make_user()
    payload = make_token_payload(user.id)

    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)       # fake DB: always returns this user
    repo.reset_failed_login = AsyncMock()

    otp_repo = AsyncMock()
    otp_repo.verify_and_consume = AsyncMock(return_value=True)  # fake Redis: OTP is valid

    uc = make_use_case(repo=repo, otp_repo=otp_repo)

    with (
        patch(f"{MODULE}.verify_otp_token", return_value=payload),   # fake JWT decode
        patch(f"{MODULE}.create_access_token", return_value="access"),
        patch(f"{MODULE}.create_refresh_token", ..., return_value="refresh"),
    ):
        # 2. ACT — call the real function
        result = await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))

    # 3. ASSERT — verify the outcome
    assert result.access_token == "access"
    assert result.refresh_token == "refresh"
    repo.reset_failed_login.assert_awaited_once()       # was this called?
```

---

## What the Mocks Do

| Tool | Used for |
|---|---|
| `MagicMock()` | Fakes a class or object with sync methods |
| `AsyncMock()` | Fakes async functions (`await`-able) |
| `patch(...)` | Temporarily replaces an imported function with a fake |

`patch` targets the **import location**, not the definition:

```python
# auth_usecase.py imports verify_otp_token from token_service
# so you patch it where it was imported INTO:
patch("app.application.use_cases.auth_usecase.verify_otp_token", ...)
```

---

## What Should Be Unit Tested

Unit tests belong in **use cases** — the business logic layer. That's where decisions happen.

Test every branch of every method:

```
login_verify()
  ├── token expired        → TokenExpiredError    ✓
  ├── token malformed      → InvalidTokenError    ✓
  ├── OTP wrong/consumed   → InvalidOTPError      ✓
  ├── user deleted from DB → UserNotFoundError    ✓
  └── everything valid     → returns token pair   ✓
```

---

## What NOT to Unit Test

| What | Why | Belongs in |
|---|---|---|
| Repository implementations | Hit a real DB | Integration tests |
| FastAPI route handlers | Full HTTP stack | E2E tests |
| DTOs / data classes | No logic | — |
| Token encoding/decoding | Library behavior, not your logic | — |

---

## Rule of Thumb

> If a function **makes a decision** (if / raise / returns different things) → **unit test** every path.
>
> If a function **calls infrastructure** (DB, Redis, email) → **integration test**.
