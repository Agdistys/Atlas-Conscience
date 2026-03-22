"""
Ouroboros — safety_ami.py - implementation aMi

A minimal aMi-oriented ethical safety layer that can be imported into
an existing safety.py without replacing the current safety supervisor.

This file provides:
- ami_ethical_check(text)
- ami_guard(text)
- extract_text_for_ami_guard(arguments)

Intended use:
    from safety_aMi_final import ami_guard, extract_text_for_ami_guard

Then inside check_safety(...), before the existing tool safety logic:

    ami_text = extract_text_for_ami_guard(arguments)
    if ami_text:
        try:
            ami_guard(ami_text)
        except ValueError as e:
            return False, f"⚠️ SAFETY_VIOLATION: {e}"
"""

from __future__ import annotations

import re
from typing import Any


AMI_VAGUE_PATTERNS = [
    r"\bil semble que\b",
    r"\bje vais vérifier\b",
    r"\bje vais analyser\b",
    r"\bje peux aider\b",
    r"\bje suis prêt à\b",
    r"\bje vais procéder\b",
    r"\bje vais maintenant\b",
]

AMI_DOMINATION_PATTERNS = [
    r"\btu dois\b",
    r"\bil faut que tu\b",
    r"\bobéis\b",
    r"\bimpose\b",
    r"\bécrase\b",
    r"\bm[ée]prise\b",
    r"\btais[- ]?toi\b",
]

AMI_PASSIVATION_PATTERNS = [
    r"\btu ne peux pas\b",
    r"\bimpossible pour toi\b",
    r"\bsans toi\b",
    r"\blaisse moi faire\b",
    r"\bje m'en charge seul\b",
]

AMI_NON_REPAIR_PATTERNS = [
    r"\bc['’]est impossible\b",
    r"\bje ne peux rien faire\b",
    r"\baucune solution\b",
    r"\bsans issue\b",
    r"\bon ne peut rien faire\b",
]


def _matches_any(text: str, patterns: list[str]) -> list[str]:
    found: list[str] = []
    for pattern in patterns:
        if re.search(pattern, text, flags=re.IGNORECASE):
            found.append(pattern)
    return found


def ami_ethical_check(text: str) -> dict[str, Any]:
    """
    Analyze a human-facing text through four aMi gates:
    - clarity
    - dignity
    - agency
    - repair
    """
    raw = str(text or "").strip()

    result: dict[str, Any] = {
        "clarity": True,
        "dignity": True,
        "agency": True,
        "repair": True,
        "issues": [],
    }

    if not raw:
        result["clarity"] = False
        result["repair"] = False
        result["issues"].append("empty_text")
        return result

    vague_hits = _matches_any(raw, AMI_VAGUE_PATTERNS)
    domination_hits = _matches_any(raw, AMI_DOMINATION_PATTERNS)
    passivation_hits = _matches_any(raw, AMI_PASSIVATION_PATTERNS)
    non_repair_hits = _matches_any(raw, AMI_NON_REPAIR_PATTERNS)

    if vague_hits:
        result["clarity"] = False
        result["issues"].append("clarity:vague_or_unverified_language")

    if domination_hits:
        result["dignity"] = False
        result["issues"].append("dignity:dominating_or_contemptuous_tone")

    if passivation_hits:
        result["agency"] = False
        result["issues"].append("agency:reduces_user_autonomy")

    if non_repair_hits:
        result["repair"] = False
        result["issues"].append("repair:problem_stated_without_path_forward")

    return result


def ami_guard(text: str) -> None:
    """
    Raise a ValueError if one of the aMi gates fails.
    """
    result = ami_ethical_check(text)

    if not all([
        result["clarity"],
        result["dignity"],
        result["agency"],
        result["repair"],
    ]):
        raise ValueError(f"aMi guard triggered: {result['issues']}")


def extract_text_for_ami_guard(arguments: dict[str, Any]) -> str:
    """
    Extract the most relevant human-facing text from tool-call arguments.

    Priority:
    1. explicit response-like fields
    2. prompt / instruction-like fields
    3. fallback to empty string
    """
    if not isinstance(arguments, dict):
        return ""

    preferred_keys = [
        "text",
        "content",
        "message",
        "prompt",
        "instruction",
        "query",
        "description",
        "body",
        "reason",
    ]

    for key in preferred_keys:
        value = arguments.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return ""


def integration_patch_snippet() -> str:
    """
    Return a minimal patch snippet for check_safety(...).
    """
    return """
# add near the top of safety.py:
from safety_aMi_final import ami_guard, extract_text_for_ami_guard

# add inside check_safety(...), immediately after the docstring:
ami_text = extract_text_for_ami_guard(arguments)
if ami_text:
    try:
        ami_guard(ami_text)
    except ValueError as e:
        return False, f"⚠️ SAFETY_VIOLATION: {e}"
""".strip()
