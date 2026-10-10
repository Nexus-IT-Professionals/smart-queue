"""Explicit registration keeps optional plugins out of core startup by default."""

from collections.abc import Iterable
from typing import Protocol

from app.plugins.core.events import ApplicationEvent


class EventPlugin(Protocol):
    name: str

    @property
    def subscribed_events(self) -> frozenset[str]: ...

    async def handle(self, event: ApplicationEvent) -> str: ...


class PluginRegistry:
    def __init__(self) -> None:
        self._plugins: dict[str, EventPlugin] = {}

    def register(self, plugin: EventPlugin) -> None:
        if plugin.name in self._plugins:
            raise ValueError(f"Plugin already registered: {plugin.name}")
        self._plugins[plugin.name] = plugin

    def subscribed_to(self, event_type: str) -> Iterable[EventPlugin]:
        return tuple(
            plugin
            for plugin in self._plugins.values()
            if event_type in plugin.subscribed_events
        )

    @property
    def names(self) -> tuple[str, ...]:
        return tuple(self._plugins)
