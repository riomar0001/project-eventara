import subprocess
import sys

ROOT = __file__.replace("run_tests.py", "")

suites = {
    "unit": "tests/unit/",
    "integration": None,  # TODO: add integration tests
    "e2e": None,          # TODO: add e2e tests
}


def run(path: str) -> int:
    result = subprocess.run(["uv", "run", "pytest", path, "-v"], cwd=ROOT)
    return result.returncode


def main() -> None:
    code = 0
    for name, path in suites.items():
        if path is None:
            print(f"\n[{name}] skipped — no tests yet\n")
            continue
        print(f"\n[{name}]\n")
        code |= run(path)
    sys.exit(code)


main()
