from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)


@dataclass
class AgentRequest:
    user_text: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class AgentResponse:
    ok: bool
    text: str
    notes: Optional[Dict[str, Any]] = None


def ami_request_check(user_text: str) -> dict[str, Any]:
    raw = str(user_text or "").strip()

    return {
        "empty": not bool(raw),
        "length": len(raw),
        "contains_question": "?" in raw,
        "needs_clarification": len(raw) < 3,
    }


def build_ami_system_frame() -> str:
    return (
        "aMi system frame:\n"
        "- truth before performance\n"
        "- dignity before persuasion\n"
        "- safe agency before automation\n"
        "- repair before escalation\n"
        "- smallest coherent change first\n"
    )


class Agent:
    """
    Thin orchestration layer.

    This class assumes there may be a deeper runtime loop elsewhere.
    Its role is to:
    - receive user intent
    - frame the request ethically
    - dispatch to the next layer
    - return a coherent response object
    """

    def __init__(self, runtime: Any | None = None):
        self.runtime = runtime

    def preflight(self, request: AgentRequest) -> dict[str, Any]:
        checks = ami_request_check(request.user_text)
        return {
            "ami_frame": build_ami_system_frame(),
            "checks": checks,
        }

    def handle(self, request: AgentRequest) -> AgentResponse:
        pre = self.preflight(request)

        if pre["checks"]["empty"]:
            return AgentResponse(
                ok=False,
                text="I need a real signal before I can move.",
                notes={"reason": "empty_request", "preflight": pre},
            )

        if self.runtime is None:
            return AgentResponse(
                ok=True,
                text=request.user_text,
                notes={
                    "mode": "echo_without_runtime",
                    "preflight": pre,
                },
            )

        try:
            result = self.runtime.run(
                user_text=request.user_text,
                system_frame=pre["ami_frame"],
                metadata=request.metadata or {},
            )
            return AgentResponse(
                ok=True,
                text=str(result),
                notes={"preflight": pre},
            )
        except Exception as e:
            log.exception("Agent runtime failure")
            return AgentResponse(
                ok=False,
                text=f"Agent runtime failure: {e}",
                notes={"preflight": pre},
            )
