"""
Ouroboros — owner_inject_aMi.py - Implementation aMi @Agdistys

A tiny helper for injecting owner guidance into the live system
without collapsing the distinction between signal and command.

Purpose:
- keep owner input explicit
- preserve traceability
- distinguish observation / instruction / ethical reminder
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
import json
from typing import Any, Dict


@dataclass
class OwnerInjection:
    kind: str
    text: str
    source: str = "owner"
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def utc_like_now() -> str:
    from datetime import datetime
    return datetime.utcnow().replace(microsecond=0).isoformat()


def build_owner_injection(kind: str, text: str) -> OwnerInjection:
    return OwnerInjection(
        kind=str(kind or "").strip(),
        text=str(text or "").strip(),
        source="owner",
        timestamp=utc_like_now(),
    )


def append_owner_injection(path: Path, kind: str, text: str) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    injection = build_owner_injection(kind, text)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(injection.to_dict(), ensure_ascii=False) + "\n")
    return injection.to_dict()


def classify_owner_signal(text: str) -> str:
    raw = str(text or "").lower()
    if "truth = respect" in raw or "falsehood = violence" in raw:
        return "ethical_reminder"
    if "patch" in raw or "replace" in raw or "add" in raw:
        return "implementation_instruction"
    if "i observe" in raw or "je vois" in raw or "constat" in raw:
        return "observation"
    return "general_guidance"
