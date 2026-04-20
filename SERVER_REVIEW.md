# Server-Side Code Review: Bad Practices & Inconsistencies

> Reviewed: 2026-04-20 | Scope: All server-side Python files (30+ files)

---

## Summary

The codebase follows a solid clean architecture (DDD with separated layers), but there are **12 categories of inconsistencies** — likely introduced by Codex — that deviate from the established patterns.

| # | Category | Severity | Primary File(s) |
|---|----------|----------|-----------------|
| 1 | Response `success` field missing | **HIGH** | `auth_schema.py`, `venue_schema.py` |
| 2 | Bare `except Exception` without DEBUG check | **MEDIUM** | `venue_route.py` |
| 3 | Pagination structure inconsistency | **LOW** | Multiple schemas |
| 4 | Mixed import style (bulk + specific) | **LOW** | `auth_route.py`, `venue_route.py` |
| 5 | Router alias `onboarding_router` misleading | **MEDIUM** | `router.py` |
| 6 | Inconsistent `message` tone/detail level | **LOW** | Multiple schemas |
| 7 | Dependency ordering in route handlers | **MEDIUM** | `venue_route.py` |
| 8 | Timezone handling split across two patterns | **MEDIUM** | `user_repository.py`, `audit_log_repository.py` |
| 9 | DELETE returns 200+body vs 204 No Content | **MEDIUM** | `venue_route.py` vs `role_route.py` |
| 10 | Duplicate validation in schema AND route | **MEDIUM** | `user_route.py` |
| 11 | Error response keys: `message` vs `detail` | **HIGH** | `main.py` |
| 12 | `_get_client_ip()` duplicated | **MEDIUM** | `auth_route.py`, `audit_helpers.py` |

---

## Issue 1 — Response `success` Field Missing (HIGH)

**Problem:** Some response schemas omit the `success` field that the majority of responses include.

**Missing it:**
- `LoginVerifyResponse` — `auth_schema.py:74–78`
- `RefreshTokenResponse` — `auth_schema.py:94–98`
- `VenueResponse` — `venue_schema.py:23–39`
- `UserGrantResponse` — `role_schema.py:68–79`

**Has it (correct pattern):**
- `LoginInitResponse`, `FeatureListResponse`, `AuditLogResponse`, `GrantFeatureListResponse`

**Fix:** Add `success: bool = True` to all response schemas that are missing it, matching the established wrapper pattern.

---

## Issue 2 — Bare `except Exception` Without DEBUG Check (MEDIUM)

**Problem:** `venue_route.py` catches all exceptions with a generic static message. The correct pattern (from `audit_log_route.py`) checks `settings.DEBUG` and includes exception details for easier debugging.

**Bad (venue_route.py lines 98–99, 171–172, 217–218, 269, 326):**
```python
except Exception:
    raise HTTPException(status_code=500, detail="Failed to create venue")
```

**Correct pattern (audit_log_route.py lines 122–131):**
```python
except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=str(e) if settings.DEBUG else "An unexpected error occurred"
    )
```

**Fix:** Update all bare `except Exception` blocks in `venue_route.py` to follow the `audit_log_route.py` pattern.

---

## Issue 3 — Pagination Structure Inconsistency (LOW)

**Problem:** List endpoints use different pagination shapes with no standard.

- `audit_log_schema.py:32–35` — Uses a `PaginationMeta` object
- `user_account_schema.py:33–39` — Uses `AdminUserAccountPaginationResponse` with a different structure
- `role_schema.py` list endpoints — No pagination info at all

**Fix:** Standardize on a single `PaginationMeta` schema and apply it to all paginated list responses.

---

## Issue 4 — Mixed Import Style (LOW)

**Problem:** `auth_route.py` mixes bulk imports from `__init__.py` with specific module imports on separate lines.

```python
# Lines 71–82 (bulk from __init__)
from app.domain.exceptions import (UserAlreadyExistsError, ...)

# Line 83 (specific module import — inconsistent)
from app.domain.exceptions.user_exceptions import UserNotFoundError
```

**Fix:** Pick one style — bulk from `__init__` is preferred since exceptions are already re-exported there. Remove the redundant specific import.

---

## Issue 5 — Misleading Router Alias `onboarding_router` (MEDIUM)

**Problem:** `router.py:14` imports `user_route.py` under the alias `onboarding_router`, but the route module contains general user profile operations far beyond onboarding.

```python
from app.controller.api.user_route import router as onboarding_router
```

**Fix:** Rename alias to `user_router` in `router.py` to accurately reflect the module scope.

---

## Issue 6 — Inconsistent `message` Field Tone (LOW)

**Problem:** Default message strings vary in grammatical tone across schemas with no clear standard.

| Schema | Message | Tone |
|--------|---------|------|
| `auth_schema.py:26` | "Registration successful. Please verify your email." | Imperative |
| `auth_schema.py:38` | "Email verified successfully." | Passive |
| `auth_schema.py:56` | "OTP sent to your email." | Passive |
| `user_schema.py:59` | "Password changed successfully. All active sessions have been invalidated." | Detailed |

**Fix:** Standardize on passive voice, past tense, single sentence (e.g., "X completed successfully."). Remove supplementary instructions from message fields.

---

## Issue 7 — Dependency Ordering in Route Handlers (MEDIUM)

**Problem:** `venue_route.py` places the use case dependency before the permission check, which is the wrong order. Permission/auth deps should always come first.

**Bad (venue_route.py lines 58–62):**
```python
use_case: VenueUseCase = Depends(get_venue_use_case),
creator_id: uuid.UUID = Depends(get_current_user_id),
_: uuid.UUID = Depends(require_permission("venues", RoleAction.CREATE)),
```

**Correct pattern (role_route.py lines 126–127):**
```python
_: uuid.UUID = Depends(require_permission("roles", RoleAction.READ)),
use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
```

**Fix:** Reorder all `venue_route.py` endpoint dependencies to: auth/permission → user identity → use case.

---

## Issue 8 — Two Timezone Handling Patterns in Repositories (MEDIUM)

**Problem:** Repositories use two different approaches for timezone normalization with no shared utility.

- `user_repository.py:55–61` — Custom `_utcnow_naive()` and `_as_naive_utc()` helper methods
- `audit_log_repository.py:1–14` — Uses `datetime.fromisoformat()` inline

**Fix:** Extract timezone utilities into a shared `app/infrastructure/utils/datetime_utils.py` and import from there in all repositories.

---

## Issue 9 — DELETE Response: 200+Body vs 204 No Content (MEDIUM)

**Problem:** Deletion endpoints disagree on REST semantics.

- `role_route.py:288` — `status_code=204, -> None` ✓ correct REST
- `venue_route.py:177–210` — Returns `DeleteVenueResponse` with `success` field at 200

**Fix:** Align venue DELETE to return `204 No Content` with no body, matching the role route pattern.

---

## Issue 10 — Duplicate Validation in Schema AND Route (MEDIUM)

**Problem:** Alias validation logic exists in both `user_schema.py:22–28` (Pydantic validator) AND `user_route.py:100–106` (inline route handler check).

**Fix:** Remove the duplicate check from the route handler. Schema-level validation is the single source of truth.

---

## Issue 11 — Error Response Key Mismatch: `message` vs `detail` (HIGH)

**Problem:** `main.py` global exception handlers return inconsistent error keys.

```python
# HTTPException handler (line 36–40) → uses "message"
{"success": False, "message": exc.detail}

# Validation error handler (line 43–56) → uses "detail"
{"success": False, "detail": [...]}

# General exception handler (line 59–65) → uses "message"
{"success": False, "message": "..."}
```

**Fix:** Standardize all error responses to use `"message"` for string errors and add an optional `"errors"` array for validation errors — consistent with the majority pattern.

---

## Issue 12 — `_get_client_ip()` Duplicated (MEDIUM)

**Problem:** Identical IP extraction logic exists in two places with slightly different names.

- `auth_route.py:88–100` — `_get_client_ip(request)`
- `audit_helpers.py:94–106` — `get_client_ip(request)`

**Fix:** Keep only `audit_helpers.py` version, import it in `auth_route.py`, delete the local copy.

---

## Suggested Fix Priority

1. **Issue 11** — Error key mismatch breaks client-side error handling uniformly
2. **Issue 1** — Missing `success` breaks response contract for several endpoints
3. **Issue 7** — Wrong dep ordering is a security hygiene risk
4. **Issue 9** — REST semantics violation on DELETE
5. **Issue 12** — Easiest win: remove one duplicated function
6. **Issues 2, 5, 8, 10** — Clean-up items, address in one pass
7. **Issues 3, 4, 6** — Low severity, address last
