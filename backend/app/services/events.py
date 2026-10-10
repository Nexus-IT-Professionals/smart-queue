"""Post-commit event publication hook for future transactional application services."""

from app.plugins.core.events import ApplicationEvent
from app.plugins.core.dispatcher import EventDispatcher


def publish_after_commit(dispatcher: EventDispatcher, event: ApplicationEvent) -> bool:
    """Enqueue a safe notification event; never wait for an external integration."""
    return dispatcher.publish(event)
