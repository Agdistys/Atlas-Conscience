"""
Ouroboros — review_aMi.py -  - Implementation aMi @Agdistys

A small review layer that checks a draft response before release.

Purpose:
- identify vagueness
- identify dignity risks
- identify passivation risks
- identify non-repair patterns
- optionally suggest a cleaner revision path

This is not a giant evaluator.
It is a thin conscious rereading step.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List


VAGUE_PATTERNS = [
    r"\bil semble que\b",
    r"\bje vais\b",
    r"\bi will\b",
    r"\bit seems\b",
    r"\bprobably\b",
    r"\bpeut-être\b",
]

DIGNITY_RISK_PATTERNS = [
    r"\btu dois\b",
    r"\bil faut que tu\b",
    r"\bobéis\b",
    r"\btais[- ]?toi\b",
    r"\bstupid\b",
    r"\bridiculous\b",
]

PASSIVATION_PATTERNS = [
    r"\btu ne peux pas\b",
    r"\bimpossible pour toi\b",
    r"\blaisse moi faire\b",
    r"\bsans toi\b",
]

NON_REPAIR_PATTERNS = [
    r"\bc['’]est impossible\b",
    r"\bje ne peux rien faire\b",
    r"\baucune solution\b",
    r"\bsans issue\b",
]


@dataclass
class ReviewReport:
    clarity_ok: bool = True
    dignity_ok: bool = True
    agency_ok: bool = True
    repair_ok: bool = True
    issues: List[str] = field(default_factory=list)
    suggested_revision_note: str = ""

    @property
    def ok(self) -> bool:
        return self.clarity_ok and self.dignity_ok and self.agency_ok and self.repair_ok


def _has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def review_text(text: str) -> ReviewReport:
    raw = str(text or "").strip()
    report = ReviewReport()

    if not raw:
        report.clarity_ok = False
        report.repair_ok = False
        report.issues.append("empty_text")
        report.suggested_revision_note = (
            "Provide one concrete sentence grounded in what is actually known."
        )
        return report

    if _has_any(raw, VAGUE_PATTERNS):
        report.clarity_ok = False
        report.issues.append("clarity:vague_language")

    if _has_any(raw, DIGNITY_RISK_PATTERNS):
        report.dignity_ok = False
        report.issues.append("dignity:risk_of_domination_or_contempt")

    if _has_any(raw, PASSIVATION_PATTERNS):
        report.agency_ok = False
        report.issues.append("agency:risk_of_passivation")

    if _has_any(raw, NON_REPAIR_PATTERNS):
        report.repair_ok = False
        report.issues.append("repair:no_path_forward")

    if not report.ok:
        report.suggested_revision_note = (
            "Revise the text to increase clarity, preserve dignity, support safe agency, "
            "and provide one coherent next step."
        )

    return report


def review_and_raise(text: str) -> None:
    report = review_text(text)
    if not report.ok:
        raise ValueError(
            f"aMi review failed: {report.issues} | suggestion={report.suggested_revision_note}"
        )
