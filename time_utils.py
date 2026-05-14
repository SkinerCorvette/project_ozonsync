"""Единая точка фиксации времени в приложении.

В базе данных MySQL поле DATETIME не хранит сведения о часовом поясе, поэтому
сохраняем локальное время приложения без tzinfo. По умолчанию используется
часовой пояс Самарской области: Europe/Samara (UTC+4).
"""

import datetime
import os

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None

APP_TIMEZONE_NAME = os.getenv('APP_TIMEZONE', 'Europe/Samara')


def app_now() -> datetime.datetime:
    """Возвращает текущее локальное время приложения без tzinfo для DATETIME."""
    if ZoneInfo is not None:
        try:
            return datetime.datetime.now(ZoneInfo(APP_TIMEZONE_NAME)).replace(tzinfo=None)
        except Exception:
            pass
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=4)).replace(tzinfo=None)
