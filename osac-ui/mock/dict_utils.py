"""Shared dict merge and nested-path helpers."""

from __future__ import annotations

import copy
from typing import Any


def deep_merge(base: dict, override: dict) -> None:
    for key, value in override.items():
        if key == "id":
            continue
        if (
            isinstance(value, dict)
            and isinstance(base.get(key), dict)
            and key not in {"labels", "annotations"}
        ):
            deep_merge(base[key], value)
        else:
            base[key] = copy.deepcopy(value)


def set_nested(obj: dict, path: str, value: Any) -> None:
    parts = path.split(".")
    node = obj
    for part in parts[:-1]:
        node = node.setdefault(part, {})
    node[parts[-1]] = value


def get_nested(obj: dict, path: str) -> Any:
    parts = path.split(".")
    node = obj
    for part in parts:
        if not isinstance(node, dict):
            return None
        node = node.get(part)
    return node
