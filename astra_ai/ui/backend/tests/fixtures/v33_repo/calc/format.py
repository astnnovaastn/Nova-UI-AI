"""Formatting for results."""
from .core import add


def show(value):
    return f"= {value}"


def show_sum(a, b):
    return show(add(a, b))
