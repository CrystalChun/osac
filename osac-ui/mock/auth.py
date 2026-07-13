"""Authentication simulation: RSA key generation, JWT create/validate, OIDC endpoints."""

from __future__ import annotations

import base64
import hashlib
import html
import secrets
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

ALGORITHM = "RS256"
TOKEN_LIFETIME = 3600
AUTH_CODE_LIFETIME = 300
DEFAULT_KEY_PATH = Path(__file__).parent / ".dev-keys" / "jwt.pem"


@dataclass
class UserConfig:
    password: str
    tenants: list[str]
    roles: list[str]
    groups: list[str]


@dataclass
class _AuthCode:
    username: str
    redirect_uri: str
    code_challenge: str
    expires_at: float


USERS: dict[str, UserConfig] = {
    "admin": UserConfig(
        password="admin",
        tenants=["*"],
        roles=["cloud-provider-admin"],
        groups=["admins"],
    ),
    "adam": UserConfig(
        password="adam",
        tenants=["engineering"],
        roles=["tenant-admin"],
        groups=["engineering"],
    ),
    "ben": UserConfig(
        password="ben",
        tenants=["engineering", "sales"],
        roles=["tenant-user"],
        groups=["engineering", "sales"],
    ),
    "charles": UserConfig(
        password="charles",
        tenants=["sales"],
        roles=["tenant-user"],
        groups=["sales"],
    ),
}

_NO_AUTH_PATHS = {
    "/.well-known/openid-configuration",
    "/.well-known/jwks.json",
    "/auth/authorize",
    "/auth/token",
    "/auth/logout",
    "/api/fulfillment/v1/capabilities",
}

_auth_codes: dict[str, _AuthCode] = {}
_refresh_tokens: dict[str, str] = {}


def _verify_pkce(verifier: str, challenge: str) -> bool:
    digest = hashlib.sha256(verifier.encode()).digest()
    computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return computed == challenge


def _issue_token_response(auth_provider: AuthProvider, username: str) -> dict:
    access_token = auth_provider.create_token(username)
    refresh_token = secrets.token_urlsafe(32)
    _refresh_tokens[refresh_token] = username
    return {
        "access_token": access_token,
        "id_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": TOKEN_LIFETIME,
    }


def _authorize_login_page(
    *,
    client_id: str,
    redirect_uri: str,
    state: str,
    code_challenge: str,
    response_type: str,
    error: str | None = None,
) -> HTMLResponse:
    hidden_fields = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": code_challenge,
        "response_type": response_type,
    }
    hidden_inputs = "".join(
        f'<input type="hidden" name="{html.escape(key)}" value="{html.escape(value)}">'
        for key, value in hidden_fields.items()
    )
    error_html = (
        f'<p style="color:#c9190b">{html.escape(error)}</p>' if error else ""
    )
    user_options = "".join(
        f'<option value="{html.escape(username)}"{" selected" if username == "adam" else ""}>'
        f'{html.escape(username)}</option>'
        for username in USERS
    )
    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OSAC Mock Sign In</title>
</head>
<body>
  <h1>OSAC Mock Sign In</h1>
  <p>Use a mock user such as <code>adam</code> / <code>adam</code>.</p>
  {error_html}
  <form method="post" action="/auth/authorize">
    {hidden_inputs}
    <label>
      Username
      <select name="username">{user_options}</select>
    </label>
    <br><br>
    <label>
      Password
      <input type="password" name="password" required>
    </label>
    <br><br>
    <button type="submit">Sign in</button>
  </form>
</body>
</html>"""
    return HTMLResponse(body)


def register_auth_routes(app: FastAPI, auth_provider: AuthProvider) -> None:
    @app.get("/.well-known/openid-configuration")
    async def openid_config():
        return auth_provider.openid_configuration()

    @app.get("/.well-known/jwks.json")
    async def jwks():
        return auth_provider.jwks()

    @app.get("/auth/authorize")
    async def authorize_get(request: Request):
        params = request.query_params
        redirect_uri = params.get("redirect_uri", "")
        state = params.get("state", "")
        code_challenge = params.get("code_challenge", "")
        if not redirect_uri or not state or not code_challenge:
            return JSONResponse(
                {"error": "invalid_request", "error_description": "Missing OAuth parameters"},
                status_code=400,
            )
        return _authorize_login_page(
            client_id=params.get("client_id", ""),
            redirect_uri=redirect_uri,
            state=state,
            code_challenge=code_challenge,
            response_type=params.get("response_type", "code"),
        )

    @app.post("/auth/authorize")
    async def authorize_post(request: Request):
        form = dict(await request.form())
        redirect_uri = str(form.get("redirect_uri", ""))
        state = str(form.get("state", ""))
        code_challenge = str(form.get("code_challenge", ""))
        username = str(form.get("username", ""))
        password = str(form.get("password", ""))

        if not redirect_uri or not state or not code_challenge:
            return JSONResponse(
                {"error": "invalid_request", "error_description": "Missing OAuth parameters"},
                status_code=400,
            )

        user = USERS.get(username)
        if not user or user.password != password:
            return _authorize_login_page(
                client_id=str(form.get("client_id", "")),
                redirect_uri=redirect_uri,
                state=state,
                code_challenge=code_challenge,
                response_type=str(form.get("response_type", "code")),
                error="Invalid username or password.",
            )

        code = secrets.token_urlsafe(32)
        _auth_codes[code] = _AuthCode(
            username=username,
            redirect_uri=redirect_uri,
            code_challenge=code_challenge,
            expires_at=time.time() + AUTH_CODE_LIFETIME,
        )
        query = urlencode({"code": code, "state": state})
        return RedirectResponse(f"{redirect_uri}?{query}", status_code=302)

    @app.post("/auth/token")
    async def token(request: Request):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
        else:
            body = dict(await request.form())

        grant_type = body.get("grant_type", "password")

        if grant_type == "authorization_code":
            code = body.get("code", "")
            redirect_uri = body.get("redirect_uri", "")
            code_verifier = body.get("code_verifier", "")
            auth_code = _auth_codes.pop(code, None)
            if auth_code is None or auth_code.expires_at < time.time():
                return JSONResponse(
                    {"error": "invalid_grant", "error_description": "Invalid or expired code"},
                    status_code=400,
                )
            if auth_code.redirect_uri != redirect_uri:
                return JSONResponse(
                    {"error": "invalid_grant", "error_description": "Redirect URI mismatch"},
                    status_code=400,
                )
            if not _verify_pkce(code_verifier, auth_code.code_challenge):
                return JSONResponse(
                    {"error": "invalid_grant", "error_description": "Invalid PKCE verifier"},
                    status_code=400,
                )
            return _issue_token_response(auth_provider, auth_code.username)

        if grant_type == "refresh_token":
            refresh_token = body.get("refresh_token", "")
            username = _refresh_tokens.get(refresh_token)
            if not username:
                return JSONResponse(
                    {"error": "invalid_grant", "error_description": "Invalid refresh token"},
                    status_code=400,
                )
            return _issue_token_response(auth_provider, username)

        username = body.get("username", "")
        password = body.get("password", "")
        organization = body.get("organization")

        user = USERS.get(username)
        if not user or user.password != password:
            return JSONResponse(
                {"error": "invalid_grant", "error_description": "Invalid credentials"},
                status_code=401,
            )

        try:
            access_token = auth_provider.create_token(username, organization)
        except ValueError as e:
            return JSONResponse(
                {"error": "invalid_grant", "error_description": str(e)},
                status_code=403,
            )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": TOKEN_LIFETIME,
        }

    @app.post("/auth/logout")
    async def logout(request: Request):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
        else:
            body = dict(await request.form())

        refresh_token = str(body.get("refresh_token", ""))
        if refresh_token:
            _refresh_tokens.pop(refresh_token, None)

        return Response(status_code=204)

    @app.get("/api/fulfillment/v1/capabilities")
    async def capabilities():
        return auth_provider.capabilities()


class AuthProvider:
    def __init__(self, issuer: str, key_path: Path | None = None) -> None:
        self.issuer = issuer
        self._kid = "mock-key-1"
        self._private_key = _load_or_generate_key(key_path or DEFAULT_KEY_PATH)
        self._public_key = self._private_key.public_key()

    def create_token(
        self,
        username: str,
        organization: str | None = None,
    ) -> str:
        user = USERS.get(username)
        if not user:
            raise ValueError(f"Unknown user: {username}")

        if organization is None:
            organization = user.tenants[0] if user.tenants[0] != "*" else ""
        elif "*" not in user.tenants and organization not in user.tenants:
            raise ValueError(
                f"User {username} is not authorized for organization {organization}"
            )

        now = int(time.time())
        payload = {
            "iss": self.issuer,
            "sub": username,
            "iat": now,
            "exp": now + TOKEN_LIFETIME,
            "typ": "Bearer",
            "organization": organization,
            "groups": user.groups,
            "realm_access": {"roles": user.roles},
            "preferred_username": username,
        }
        return jwt.encode(
            payload,
            self._private_key,
            algorithm=ALGORITHM,
            headers={"kid": self._kid},
        )

    def validate_token(self, token: str) -> dict:
        return jwt.decode(
            token,
            self._public_key,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )

    def jwks(self) -> dict:
        pub_numbers = self._public_key.public_numbers()
        n_bytes = pub_numbers.n.to_bytes(
            (pub_numbers.n.bit_length() + 7) // 8, byteorder="big"
        )
        e_bytes = pub_numbers.e.to_bytes(
            (pub_numbers.e.bit_length() + 7) // 8, byteorder="big"
        )
        return {
            "keys": [
                {
                    "kty": "RSA",
                    "use": "sig",
                    "kid": self._kid,
                    "alg": ALGORITHM,
                    "n": base64.urlsafe_b64encode(n_bytes)
                    .rstrip(b"=")
                    .decode(),
                    "e": base64.urlsafe_b64encode(e_bytes)
                    .rstrip(b"=")
                    .decode(),
                }
            ]
        }

    def openid_configuration(self) -> dict:
        return {
            "issuer": self.issuer,
            "authorization_endpoint": f"{self.issuer}/auth/authorize",
            "token_endpoint": f"{self.issuer}/auth/token",
            "end_session_endpoint": f"{self.issuer}/auth/logout",
            "jwks_uri": f"{self.issuer}/.well-known/jwks.json",
            "response_types_supported": ["code", "token"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": [ALGORITHM],
            "grant_types_supported": [
                "authorization_code",
                "password",
                "refresh_token",
                "client_credentials",
            ],
        }

    def capabilities(self) -> dict:
        return {
            "authn": {
                "trusted_token_issuers": [self.issuer],
            }
        }


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, auth_provider: AuthProvider, no_auth: bool = False) -> None:
        super().__init__(app)
        self.auth_provider = auth_provider
        self.no_auth = no_auth

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path in _NO_AUTH_PATHS:
            request.state.tenant = ""
            request.state.user = "anonymous"
            request.state.roles = []
            return await call_next(request)

        if self.no_auth:
            request.state.tenant = "engineering"
            request.state.user = "admin"
            request.state.roles = ["cloud-provider-admin"]
            return await call_next(request)

        # Browser requests (favicon, devtools probes, etc.) hit the mock during login.
        # Only fulfillment/event API routes require a Bearer token.
        if not request.url.path.startswith("/api/"):
            request.state.tenant = ""
            request.state.user = "anonymous"
            request.state.roles = []
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return JSONResponse(
                {"code": 16, "message": "Missing or invalid authorization header", "details": []},
                status_code=401,
            )

        token = auth_header[7:]
        try:
            claims = self.auth_provider.validate_token(token)
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                {"code": 16, "message": "Token expired", "details": []},
                status_code=401,
            )
        except jwt.InvalidTokenError as e:
            return JSONResponse(
                {"code": 16, "message": f"Invalid token: {e}", "details": []},
                status_code=401,
            )

        request.state.user = claims.get("sub", "")
        request.state.tenant = claims.get("organization", "")
        request.state.roles = claims.get("realm_access", {}).get("roles", [])

        if "*" in USERS.get(request.state.user, UserConfig("", [], [], [])).tenants:
            request.state.tenant = "*"

        return await call_next(request)


def _load_or_generate_key(key_path: Path):
    if key_path.is_file():
        return serialization.load_pem_private_key(key_path.read_bytes(), password=None)

    key_path.parent.mkdir(parents=True, exist_ok=True)
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    key_path.write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    return private_key
