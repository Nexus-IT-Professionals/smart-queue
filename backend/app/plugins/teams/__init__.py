"""Microsoft Teams Workflows notification plugin."""

from app.plugins.teams.config import TeamsSettings
from app.plugins.teams.plugin import TeamsPlugin

__all__ = ["TeamsPlugin", "TeamsSettings"]
