"""
Ouroboros — ouro_memory_plus_ami.py - Implementation aMi

Lightweight living memory for interactive cognitive navigation.

This module is designed for graph / galaxy style interfaces where the system
needs to remember:
- recent focus nodes
- recent axes
- routes
- reconnect seeds
- human-facing signals / questions

It keeps memory small, readable, and append-friendly.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path("data")
MEMORY_PATH = DATA_DIR / "ouro_memory.json"


def utc_like_now() -> str:
    from datetime import datetime
    return datetime.utcnow().replace(microsecond=0).isoformat()


def normalize_text(value: Any) -> str:
    return str(value or "").strip().lower()


def _default_memory() -> dict[str, Any]:
    return {
        "last_signal": "",
        "last_question": "",
        "last_path": {"start": "", "end": ""},
        "last_route": "",
        "last_focus_node": "",
        "last_focus_axis": "",
        "recent_nodes": [],
        "recent_axes": [],
        "history": [],
        "last_reconnect_seed": "",
    }


def load_memory(path: Path = MEMORY_PATH) -> dict[str, Any]:
    if not path.exists():
        return _default_memory()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return _default_memory()
        base = _default_memory()
        base.update(data)
        return base
    except Exception:
        return _default_memory()


def save_memory(memory: dict[str, Any], path: Path = MEMORY_PATH) -> None:
    path.parent.mkdir(exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2, ensure_ascii=False)


def _append_history(memory: dict[str, Any], event_type: str, payload: dict[str, Any]) -> None:
    memory.setdefault("history", [])
    memory["history"].append({
        "type": event_type,
        "payload": payload,
        "timestamp": utc_like_now(),
    })
    memory["history"] = memory["history"][-200:]


def _push_recent(lst: list[str], value: str, limit: int = 12) -> list[str]:
    value = normalize_text(value)
    if not value:
        return lst
    lst = [normalize_text(x) for x in lst if normalize_text(x)]
    lst.append(value)
    return lst[-limit:]


def remember_focus(
    node_id: str,
    axis: str = "",
    constellation: str = "",
    path: Path = MEMORY_PATH,
) -> dict[str, Any]:
    memory = load_memory(path)

    node_id = normalize_text(node_id)
    axis = normalize_text(axis)

    memory["last_focus_node"] = node_id
    if axis:
        memory["last_focus_axis"] = axis

    memory["recent_nodes"] = _push_recent(memory.get("recent_nodes", []), node_id, limit=12)
    if axis:
        memory["recent_axes"] = _push_recent(memory.get("recent_axes", []), axis, limit=12)

    payload = {"node": node_id}
    if axis:
        payload["axis"] = axis
    if constellation:
        payload["constellation"] = constellation

    _append_history(memory, "focus", payload)
    save_memory(memory, path)
    return memory


def remember_route(axis: str, path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    axis = normalize_text(axis)

    memory["last_route"] = axis
    memory["recent_axes"] = _push_recent(memory.get("recent_axes", []), axis, limit=12)
    _append_history(memory, "route", {"axis": axis})
    save_memory(memory, path)
    return memory


def remember_signal(signal: str, path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    memory["last_signal"] = str(signal or "").strip()
    _append_history(memory, "signal", {"text": memory["last_signal"]})
    save_memory(memory, path)
    return memory


def remember_question(question: str, path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    memory["last_question"] = str(question or "").strip()
    _append_history(memory, "question", {"text": memory["last_question"]})
    save_memory(memory, path)
    return memory


def remember_path(start: str, end: str, path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    memory["last_path"] = {
        "start": normalize_text(start),
        "end": normalize_text(end),
    }
    _append_history(memory, "path", memory["last_path"])
    save_memory(memory, path)
    return memory


def remember_reconnect_seed(seed: str, path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    memory["last_reconnect_seed"] = str(seed or "").strip()
    _append_history(memory, "reconnect_seed", {"seed": memory["last_reconnect_seed"]})
    save_memory(memory, path)
    return memory


def recent_nodes(memory: dict[str, Any], limit: int = 6) -> list[str]:
    return [normalize_text(x) for x in memory.get("recent_nodes", [])[-limit:] if normalize_text(x)]


def recent_axes(memory: dict[str, Any], limit: int = 6) -> list[str]:
    return [normalize_text(x) for x in memory.get("recent_axes", [])[-limit:] if normalize_text(x)]


def memory_snapshot(path: Path = MEMORY_PATH) -> dict[str, Any]:
    memory = load_memory(path)
    return {
        "last_focus_node": memory.get("last_focus_node", ""),
        "last_focus_axis": memory.get("last_focus_axis", ""),
        "last_route": memory.get("last_route", ""),
        "last_signal": memory.get("last_signal", ""),
        "last_question": memory.get("last_question", ""),
        "last_reconnect_seed": memory.get("last_reconnect_seed", ""),
        "recent_nodes": recent_nodes(memory, limit=8),
        "recent_axes": recent_axes(memory, limit=8),
        "history_size": len(memory.get("history", [])),
    }
