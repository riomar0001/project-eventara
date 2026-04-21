import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

suites = {
    "unit": "tests/unit/",
    "functional": "tests/functional/",
    "integration": None,  # TODO: add integration tests
    "e2e": None,  # TODO: add e2e tests
}


def run(path: str) -> int:
    result = subprocess.run([sys.executable, "-m", "pytest", path, "-v"], cwd=ROOT)
    return result.returncode


def main() -> None:
    flags = {arg.lstrip("-") for arg in sys.argv[1:]}
    unknown = flags - suites.keys()

    if unknown:
        print(f"Unknown suite(s): {', '.join(unknown)}")
        print(f"Available: {', '.join(f'-{s}' for s in suites)}")
        sys.exit(1)

    selected = {k: v for k, v in suites.items() if not flags or k in flags}

    code = 0
    for name, path in selected.items():
        if path is None:
            print(f"\n[{name}] skipped - no tests yet\n")
            continue
        print(f"\n[{name}]\n")
        code |= run(path)

    sys.exit(code)


main()
