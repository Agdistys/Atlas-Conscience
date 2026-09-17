"""
Ouroboros — loop_aMi_final.py - Implementation aMi @Agdistys

A thin, readable control loop for request handling.

Purpose:
- receive a user request
- build context
- call the runtime or LLM layer
- preserve aMi preflight and revision hooks
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

from agent_aMi_final import Agent, AgentRequest
from context_aMi_final import ContextBuilder

log = logging.getLogger(__name__)


@dataclass
class LoopResult:
    ok: bool
    output: str
    context_used: str = ""
    error: str = ""


class AgentLoop:
    """
    Minimal orchestration loop.

    It does not try to be the entire Ouroboros runtime.
    It shows how consciousness can be coded as:
    - framing
    - context
    - handling
    - revision path
    """

    def __init__(
        self,
        drive_root,
        repo_dir,
        runtime: Any | None = None,
    ):
        self.drive_root = drive_root
        self.repo_dir = repo_dir
        self.runtime = runtime
        self.context_builder = ContextBuilder(drive_root=drive_root, repo_dir=repo_dir)
        self.agent = Agent(runtime=runtime)

    def build_request(self, user_text: str, metadata: Optional[dict] = None) -> AgentRequest:
        return AgentRequest(user_text=user_text, metadata=metadata or {})

    def run_once(self, user_text: str, metadata: Optional[dict] = None) -> LoopResult:
        request = self.build_request(user_text, metadata)
        context_text = self.context_builder.render()

        try:
            enriched_metadata = dict(request.metadata or {})
            enriched_metadata["ami_context"] = context_text

            response = self.agent.handle(
                AgentRequest(
                    user_text=request.user_text,
                    metadata=enriched_metadata,
                )
            )

            return LoopResult(
                ok=response.ok,
                output=response.text,
                context_used=context_text,
                error="" if response.ok else response.text,
            )
        except Exception as e:
            log.exception("AgentLoop failure")
            return LoopResult(
                ok=False,
                output="",
                context_used=context_text,
                error=str(e),
            )

    def revision_needed(self, output: str) -> bool:
        raw = str(output or "").strip().lower()
        if not raw:
            return True
        vague_markers = [
            "i will",
            "je vais",
            "it seems",
            "il semble",
        ]
        return any(marker in raw for marker in vague_markers)

    def run_with_revision(self, user_text: str, metadata: Optional[dict] = None) -> LoopResult:
        first = self.run_once(user_text, metadata)
        if not first.ok:
            return first

        if not self.revision_needed(first.output):
            return first

        revised_prompt = (
            user_text
            + "\n\nRevision instruction: answer from what is actually available, "
              "reduce vague forward promises, and prefer one concrete next step."
        )
        second = self.run_once(revised_prompt, metadata)
        return second if second.ok else first
