from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # contentSecurityPolicy: false → disabled (do nothing)

        # crossOriginEmbedderPolicy: false → disabled

        # crossOriginOpenerPolicy
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"

        # crossOriginResourcePolicy
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"

        # dnsPrefetchControl
        response.headers["X-DNS-Prefetch-Control"] = "off"

        # frameguard
        response.headers["X-Frame-Options"] = "DENY"

        # hidePoweredBy
        del response.headers["server"]

        # hsts
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # ieNoOpen
        response.headers["X-Download-Options"] = "noopen"

        # noSniff
        response.headers["X-Content-Type-Options"] = "nosniff"

        # originAgentCluster
        response.headers["Origin-Agent-Cluster"] = "?1"

        # permittedCrossDomainPolicies
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # referrerPolicy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # xssFilter (legacy but still added)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        if request.url.path == "/docs":
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self';"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'self';"

        return response


