"""Entry point: prints a sum and a quotient."""
import sys

from calc.core import divide
from calc.format import show, show_sum


def main(argv=None):
    argv = argv or sys.argv[1:]
    a, b = (int(x) for x in (argv or ["6", "3"]))
    print(show_sum(a, b))
    print(show(divide(a, b)))


if __name__ == "__main__":
    main()
