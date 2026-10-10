"""Small in-process plugin registry and event dispatcher."""

from app.plugins.core.dispatcher import EventDispatcher
from app.plugins.core.events import ApplicationEvent
from app.plugins.core.registry import PluginRegistry

__all__ = ["ApplicationEvent", "EventDispatcher", "PluginRegistry"]
