"""Best-effort dispatch. Integration errors are isolated from callers."""

import asyncio
from collections import deque

from app.plugins.core.events import ApplicationEvent
from app.plugins.core.registry import PluginRegistry


class EventDispatcher:
    def __init__(self, registry: PluginRegistry, dedupe_limit: int = 2048) -> None:
        self.registry = registry
        self._seen: set[str] = set()
        self._seen_order: deque[str] = deque(maxlen=dedupe_limit)
        self._tasks: set[asyncio.Task[None]] = set()

    def publish(self, event: ApplicationEvent) -> bool:
        """Queue delivery and return immediately. True means accepted for dispatch."""
        if not self._remember(event.event_id):
            return False
        task = asyncio.create_task(self._dispatch(event))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return True

    async def dispatch(self, event: ApplicationEvent) -> None:
        """Await one event for controlled callers/tests; plugin failures are swallowed."""
        if not self._remember(event.event_id):
            return
        await self._dispatch(event)

    def _remember(self, event_id: str) -> bool:
        if event_id in self._seen:
            return False
        if self._seen_order.maxlen is not None and len(self._seen_order) == self._seen_order.maxlen:
            self._seen.discard(self._seen_order[0])
        self._seen_order.append(event_id)
        self._seen.add(event_id)
        return True

    async def drain(self) -> None:
        """Wait for already queued deliveries, primarily at shutdown and in tests."""
        while self._tasks:
            await asyncio.gather(*tuple(self._tasks), return_exceptions=True)

    async def _dispatch(self, event: ApplicationEvent) -> None:
        for plugin in self.registry.subscribed_to(event.event_type):
            try:
                await plugin.handle(event)
            except Exception:
                # Plugin adapters must record sanitized failure status themselves.
                # Never let a notification error unwind the scheduling operation.
                continue
