import redis
from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.config import settings

_redis = redis.from_url(settings.redis_url)
RATE_LIMIT = 60  # requests per minute per IP


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        key = f"rate:{request.client.host}"
        count = _redis.incr(key)
        if count == 1:
            _redis.expire(key, 60)
        if count > RATE_LIMIT:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        return await call_next(request)
