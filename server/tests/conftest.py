"""Pytest plugin that prints a formatted test report table after each session."""

import pytest

_RESULTS: list[dict] = []


def _format_scenario(nodeid: str) -> str:
    """'TestLogin::test_wrong_password' → 'Login — Wrong Password'"""
    parts = nodeid.split("::")
    if len(parts) >= 3:
        cls = parts[-2].replace("Test", "").strip()
        fn = parts[-1].replace("test_", "").replace("_", " ").title()
        return f"{cls} - {fn}"
    fn = parts[-1].replace("test_", "").replace("_", " ").title()
    return fn


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
        actual = next((l.strip() for l in reversed(lines) if l.strip()), "Error")
        result = "FAIL"
    else:
        actual = "—"
        result = "SKIP"

    _RESULTS.append({
        "scenario": _format_scenario(item.nodeid),
        "expected": doc,
        "actual": actual,
        "result": result,
        "action": "",
    })


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    if not _RESULTS:
        return

    col_w = {
        "scenario": max(len("SCENARIOS"), max(len(r["scenario"]) for r in _RESULTS)),
        "expected": max(len("EXPECTED RESULT"), max(len(r["expected"]) for r in _RESULTS)),
        "actual":   max(len("ACTUAL RESULT"),   max(len(r["actual"])   for r in _RESULTS)),
        "result":   max(len("TEST RESULT"), max(len(r["result"]) for r in _RESULTS)),
        "action":   max(len("ACTION"), max(len(r["action"]) for r in _RESULTS)),
    }

    keys = list(col_w)

    def _pad(text: str, key: str) -> str:
        return text.ljust(col_w[key])

    def _divider(fill="-") -> str:
        return "+" + "+".join(fill * (col_w[k] + 2) for k in keys) + "+"

    def _row(values: list[str]) -> str:
        return "| " + " | ".join(_pad(v, k) for k, v in zip(keys, values)) + " |"

    passed = sum(1 for r in _RESULTS if r["result"] == "PASS")
    failed = sum(1 for r in _RESULTS if r["result"] == "FAIL")

    print("\n")
    print(_divider("="))
    print(_row(["SCENARIOS", "EXPECTED RESULT", "ACTUAL RESULT", "TEST RESULT", "ACTION"]))
    print(_divider("="))

    prev_group = None
    for r in _RESULTS:
        group = r["scenario"].split(" - ")[0]
        if group != prev_group and prev_group is not None:
            print(_divider())
        prev_group = group
        print(_row([r["scenario"], r["expected"], r["actual"], r["result"], r["action"]]))

    print(_divider("="))
    print(f"\n  Total: {len(_RESULTS)}  |  Pass: {passed}  |  Fail: {failed}\n")
