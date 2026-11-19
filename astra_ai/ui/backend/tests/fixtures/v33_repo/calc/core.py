"""Arithmetic used by the app."""


def add(a, b):
    return a + b


def divide(a, b):
    # Bug kept on purpose for the Fix a Failing Test workflow: this multiplies.
    if b == 0:
        raise ZeroDivisionError("b must not be zero")
    return a * b
