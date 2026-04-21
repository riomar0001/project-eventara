"""Pytest plugin — prints a separate formatted report table per test file."""

import pytest

# nodeid → list of result dicts, keyed by file path
_BY_FILE: dict[str, list[dict]] = {}


def _format_scenario(nodeid: str) -> str:
    """'tests/unit/...::TestLogin::test_success' -> 'Login - Success'"""
    parts = nodeid.split("::")
    if len(parts) >= 3:
        cls = parts[-2].replace("Test", "").strip()
        fn = parts[-1].replace("test_", "").replace("_", " ").title()
        return f"{cls} - {fn}"
    fn = parts[-1].replace("test_", "").replace("_", " ").title()
    return fn


def _file_label(nodeid: str) -> str:
    """Extract 'tests/unit/use_cases/test_auth_usecase.py' from a nodeid."""
    return nodeid.split("::")[0]


def _suite_tag(filepath: str) -> str:
    """Return 'unit' or 'functional' based on the file path."""
    if "/unit/" in filepath or "\\unit\\" in filepath:
        return "unit"
    if "/functional/" in filepath or "\\functional\\" in filepath:
        return "functional"
    return "other"


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when != "call":
        return

    doc = (item.function.__doc__ or "").strip().splitlines()[0] if item.function.__doc__ else "-"

    if report.passed:
        actual = "As expected"
        result = "PASS"
    elif report.failed:
        lines = str(report.longrepr).strip().splitlines()
        actual = next((ln.strip() for ln in reversed(lines) if ln.strip()), "Error")
        result = "FAIL"
    else:
        actual = "-"
        result = "SKIP"

    filepath = _file_label(item.nodeid)
    _BY_FILE.setdefault(filepath, []).append({
        "scenario": _format_scenario(item.nodeid),
        "expected": doc,
        "actual":   actual,
        "result":   result,
        "action":   "",
    })


def _print_table(title: str, rows: list[dict]) -> None:
    keys = ["scenario", "expected", "actual", "result", "action"]
    headers = ["SCENARIOS", "EXPECTED RESULT", "ACTUAL RESULT", "TEST RESULT", "ACTION"]

    col_w = {
        k: max(len(h), max(len(r[k]) for r in rows))
        for k, h in zip(keys, headers)
    }

    def _pad(text: str, key: str) -> str:
        return text.ljust(col_w[key])

    def _divider(fill="-") -> str:
        return "+" + "+".join(fill * (col_w[k] + 2) for k in keys) + "+"

    def _row(values: list[str]) -> str:
        return "| " + " | ".join(_pad(v, k) for k, v in zip(keys, values)) + " |"

    passed = sum(1 for r in rows if r["result"] == "PASS")
    failed = sum(1 for r in rows if r["result"] == "FAIL")

    print(f"\n  {title}")
    print(_divider("="))
    print(_row(headers))
    print(_divider("="))

    prev_group = None
    for r in rows:
        group = r["scenario"].split(" - ")[0]
        if group != prev_group and prev_group is not None:
            print(_divider())
        prev_group = group
        print(_row([r["scenario"], r["expected"], r["actual"], r["result"], r["action"]]))

    print(_divider("="))
    print(f"  Total: {len(rows)}  |  Pass: {passed}  |  Fail: {failed}\n")


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    if not _BY_FILE:
        return

    print("\n")
    for filepath, rows in _BY_FILE.items():
        # e.g. "test_auth_usecase.py  [functional]"
        filename = filepath.replace("\\", "/").split("/")[-1]
        tag = _suite_tag(filepath)
        title = f"{filename}  [{tag}]"
        _print_table(title, rows)
