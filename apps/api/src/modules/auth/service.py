"""
Axorks OS — Auth Service

Registration, login (JWT), token refresh, password reset, 2FA.
"""

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from src.core.security import (
    create_access_token,
    create_refresh_token,
    generate_totp_secret,
    get_totp_uri,
    hash_password,
    verify_password,
    verify_totp,
)
from src.modules.auth.models import RefreshToken
from src.modules.auth.schemas import RegisterRequest
from src.modules.users.models import User

settings = get_settings()


class AuthService:
    """Authentication service for all auth flows."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Registration ─────────────────────────────────────

    async def register(self, data: RegisterRequest) -> User:
        """Register a new user with email and password."""
        # Check for existing email
        existing = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictError("An account with this email already exists")

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    # ── Login ────────────────────────────────────────────

    async def login(self, email: str, password: str) -> dict:
        """
        Authenticate with email/password.
        Returns access token, refresh token, and user data.
        """
        user = await self._get_user_by_email(email)
        if not user or not user.password_hash:
            raise UnauthorizedError("Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        # Block suspended / inactive accounts from authenticating
        if (getattr(user, "status", "active") or "active") != "active":
            raise UnauthorizedError("Account is suspended or inactive")

        # Check if 2FA is required
        if user.two_factor_enabled:
            return {
                "requires_2fa": True,
                "user_id": str(user.id),
            }

        return await self._generate_tokens(user)

    async def verify_2fa_login(self, user_id: UUID, code: str) -> dict:
        """Complete login with 2FA verification."""
        user = await self._get_user_by_id(user_id)
        if not user.two_factor_secret:
            raise UnauthorizedError("2FA not configured")

        if not verify_totp(user.two_factor_secret, code):
            raise UnauthorizedError("Invalid 2FA code")

        return await self._generate_tokens(user)

    # ── Token Refresh ────────────────────────────────────

    async def refresh_tokens(self, refresh_token_str: str) -> dict:
        """Rotate refresh token and issue new access token."""
        token_hash = self._hash_token(refresh_token_str)

        query = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
        result = await self.db.execute(query)
        token_record = result.scalar_one_or_none()

        if not token_record:
            raise UnauthorizedError("Invalid refresh token")

        if token_record.expires_at < datetime.now(UTC):
            raise UnauthorizedError("Refresh token expired")

        # Revoke old token
        token_record.revoked_at = datetime.now(UTC)

        # Get user and generate new tokens
        user = await self._get_user_by_id(token_record.user_id)
        return await self._generate_tokens(user)

    # ── Logout ───────────────────────────────────────────

    async def logout(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)

    # ── Password Reset ───────────────────────────────────

    async def forgot_password(self, email: str) -> None:
        """Initiate password reset. Always returns success (no email enumeration)."""
        user = await self._get_user_by_email(email)
        if user:
            # In production: send email via Resend
            # For now: log the reset token
            import logging
            reset_token = create_refresh_token(user.id)
            logging.info(f"Password reset token for {email}: {reset_token}")

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using a valid reset token."""
        from src.core.security import verify_refresh_token as verify_token
        from jose import JWTError

        try:
            payload = verify_token(token)
        except JWTError:
            raise UnauthorizedError("Invalid or expired reset token")

        user = await self._get_user_by_id(UUID(payload["sub"]))
        user.password_hash = hash_password(new_password)
        await self.db.flush()

        # Revoke all existing refresh tokens
        await self.logout(user.id)

    # ── 2FA ──────────────────────────────────────────────

    async def enable_2fa(self, user_id: UUID) -> dict:
        """Generate TOTP secret and QR URI for 2FA setup."""
        user = await self._get_user_by_id(user_id)
        secret = generate_totp_secret()
        qr_uri = get_totp_uri(secret, user.email)

        # Store secret temporarily (verified on confirm)
        user.two_factor_secret = secret
        await self.db.flush()

        return {"secret": secret, "qr_uri": qr_uri}

    async def confirm_2fa(self, user_id: UUID, code: str) -> bool:
        """Confirm and activate 2FA with a valid TOTP code."""
        user = await self._get_user_by_id(user_id)
        if not user.two_factor_secret:
            raise UnauthorizedError("2FA setup not initiated")

        if not verify_totp(user.two_factor_secret, code):
            raise UnauthorizedError("Invalid 2FA code")

        user.two_factor_enabled = True
        await self.db.flush()
        return True

    async def disable_2fa(self, user_id: UUID, code: str) -> bool:
        """Disable 2FA after verifying a valid code."""
        user = await self._get_user_by_id(user_id)
        if not user.two_factor_secret:
            return True

        if not verify_totp(user.two_factor_secret, code):
            raise UnauthorizedError("Invalid 2FA code")

        user.two_factor_enabled = False
        user.two_factor_secret = None
        await self.db.flush()
        return True

    # ── Private Helpers ──────────────────────────────────

    async def _get_user_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email, User.deleted_at.is_(None))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: UUID) -> User:
        query = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User")
        return user

    async def _generate_tokens(self, user: User) -> dict:
        """Generate access + refresh token pair, store refresh token."""
        # Get org context for JWT claims
        from src.modules.organizations.models import OrganizationMember
        org_query = select(OrganizationMember).where(
            OrganizationMember.user_id == user.id
        ).limit(1)
        org_result = await self.db.execute(org_query)
        org_member = org_result.scalar_one_or_none()

        org_id = org_member.organization_id if org_member else None
        roles = [org_member.role] if org_member else []
        workspace_id = None

        if org_id:
            from src.modules.workspaces.models import Workspace
            ws_query = select(Workspace).where(
                Workspace.organization_id == org_id,
                Workspace.is_default.is_(True),
                Workspace.deleted_at.is_(None),
            ).limit(1)
            ws_result = await self.db.execute(ws_query)
            workspace = ws_result.scalar_one_or_none()
            if workspace:
                workspace_id = workspace.id

        access_token = create_access_token(
            user_id=user.id,
            org_id=org_id,
            workspace_id=workspace_id,
            roles=roles,
        )
        refresh_token_str = create_refresh_token(user_id=user.id)

        # Store refresh token hash
        token_record = RefreshToken(
            user_id=user.id,
            token_hash=self._hash_token(refresh_token_str),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
        )
        self.db.add(token_record)
        await self.db.flush()

        # Update last login
        user.last_login_at = datetime.now(UTC)
        await self.db.flush()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar_url": user.avatar_url,
            },
        }

    @staticmethod
    def _hash_token(token: str) -> str:
        """Hash a token for secure storage."""
        return hashlib.sha256(token.encode()).hexdigest()
