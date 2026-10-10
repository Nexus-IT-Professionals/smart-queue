"""Construct the configured plugin registry; empty by default."""

from app.plugins.core import EventDispatcher, PluginRegistry
from app.plugins.teams import TeamsPlugin, TeamsSettings


def create_plugin_runtime() -> tuple[PluginRegistry, EventDispatcher]:
    settings = TeamsSettings.from_env(include_local=True)
    registry = PluginRegistry()
    if settings.enabled:
        registry.register(TeamsPlugin(settings))
    return registry, EventDispatcher(registry)
