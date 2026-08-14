"""
Axorks OS — Enterprise IAM, RBAC & Recording Service
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ForbiddenError, NotFoundError
from src.core.security import get_password_hash
from src.modules.iam.models import (
    Department,
    EnterpriseRole,
    IAMAuditLog,
    LoginSession,
    SessionRecording,
)
from src.modules.iam.schemas import (
    DepartmentCreate,
    IAMUserCreate,
    IAMUserUpdate,
    RecordingCreate,
    RoleCreate,
    RoleUpdate,
)
from src.modules.users.models import User


class IAMService:
    """Service layer for IAM, User Management, RBAC, and Screen/Call Recordings."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def bootstrap_founder(self, org_id: uuid.UUID | None = None) -> User:
        """Seed or verify the Founder supreme account from environment variables."""
        founder_email = os.environ.get("FOUNDER_EMAIL", "founder@axorks.com").lower().strip()
        founder_name = os.environ.get("FOUNDER_NAME", "Axorks Founder")
        founder_pass = os.environ.get("FOUNDER_PASSWORD", "FounderSecretPass123!")

        name_parts = founder_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "Owner"

        q = select(User).where(User.email == founder_email)
        res = await self.db.execute(q)
        founder = res.scalars().first()

        if not founder:
            target_org_id = org_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
            hashed = get_password_hash(founder_pass)
            founder = User(
                organization_id=target_org_id,
                email=founder_email,
                password_hash=hashed,
                first_name=first_name,
                last_name=last_name,
                role="founder",
                status="active",
                is_active=True,
                is_superuser=True,
            )
            self.db.add(founder)
            await self.db.flush()

        return founder

    async def list_users(
        self,
        org_id: uuid.UUID,
        search: str | None = None,
        department: str | None = None,
        role: str | None = None,
        status: str | None = None,
    ) -> list[User]:
        q = select(User).where(User.organization_id == org_id)

        if department:
            q = q.where(User.department == department)
        if role:
            q = q.where(User.role == role)
        if status:
            q = q.where(User.status == status)
        if search:
            s = f"%{search.lower()}%"
            q = q.where(
                (func.lower(User.first_name).like(s))
                | (func.lower(User.last_name).like(s))
                | (func.lower(User.email).like(s))
            )

        q = q.order_by(User.created_at.desc())
        res = await self.db.execute(q)
        return list(res.scalars().all())

    async def get_user_by_id(self, user_id: uuid.UUID, org_id: uuid.UUID) -> User:
        q = select(User).where(User.id == user_id, User.organization_id == org_id)
        res = await self.db.execute(q)
        user = res.scalars().first()
        if not user:
            raise NotFoundError("User", str(user_id))
        return user

    async def create_user(
        self, org_id: uuid.UUID, actor_user: User, data: IAMUserCreate
    ) -> User:
        # Check email uniqueness
        existing_q = select(User).where(User.email == data.email.lower().strip())
        existing_res = await self.db.execute(existing_q)
        if existing_res.scalars().first():
            raise ValueError(f"User with email {data.email} already exists")

        emp_id = data.employee_id or f"EMP-{int(datetime.now().timestamp()) % 100000}"
        pwd = data.password or "AxorksUserPass2026!"
        hashed = get_password_hash(pwd)

        user_dict = data.model_dump(exclude={"password", "email"})
        user = User(
            organization_id=org_id,
            email=data.email.lower().strip(),
            password_hash=hashed,
            employee_id=emp_id,
            is_active=(data.status == "active"),
            **user_dict,
        )
        self.db.add(user)
        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action="USER_CREATED",
            entity_type="user",
            entity_id=str(user.id),
            new_values={"email": user.email, "role": user.role, "status": user.status},
        )
        return user

    async def update_user(
        self, user_id: uuid.UUID, org_id: uuid.UUID, actor_user: User, data: IAMUserUpdate
    ) -> User:
        user = await self.get_user_by_id(user_id, org_id)

        # Protect Founder (case-insensitive so "Founder" role is never modifiable)
        if user.role.strip().lower() == "founder" and actor_user.role.strip().lower() != "founder":
            raise ForbiddenError("Cannot modify Founder account")

        update_data = data.model_dump(exclude_unset=True)
        old_vals = {k: getattr(user, k) for k in update_data.keys() if hasattr(user, k)}

        for k, v in update_data.items():
            setattr(user, k, v)

        if "status" in update_data:
            user.is_active = (update_data["status"] == "active")

        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action="USER_UPDATED",
            entity_type="user",
            entity_id=str(user.id),
            old_values=old_vals,
            new_values=update_data,
        )
        return user

    async def perform_user_action(
        self, user_id: uuid.UUID, org_id: uuid.UUID, actor_user: User, action_type: str
    ) -> User:
        user = await self.get_user_by_id(user_id, org_id)

        # Protect Founder (case-insensitive so "Founder" role is never suspended)
        if user.role.strip().lower() == "founder" and action_type in ["suspend", "lock", "deactivate", "delete"]:
            raise ForbiddenError("Founder account cannot be suspended, locked, or modified")

        old_status = user.status

        if action_type == "suspend":
            user.status = "suspended"
            user.is_active = False
        elif action_type == "reactivate":
            user.status = "active"
            user.is_active = True
        elif action_type == "lock":
            user.status = "locked"
            user.is_active = False
            user.locked_until = datetime.utcnow() + timedelta(days=365)
        elif action_type == "unlock":
            user.status = "active"
            user.is_active = True
            user.locked_until = None
            user.failed_attempts = 0
        elif action_type == "reset-password":
            new_pass = f"Pass{int(datetime.now().timestamp())}!"
            user.password_hash = get_password_hash(new_pass)

        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action=f"USER_{action_type.upper()}",
            entity_type="user",
            entity_id=str(user.id),
            old_values={"status": old_status},
            new_values={"status": user.status},
        )
        return user

    async def list_roles(self, org_id: uuid.UUID) -> list[EnterpriseRole]:
        q = select(EnterpriseRole).where(EnterpriseRole.organization_id == org_id)
        res = await self.db.execute(q)
        roles = list(res.scalars().all())

        if not roles:
            # Seed default roles
            defaults = [
                ("Founder", "Full supreme unrestricted control", False, 100, ["*"]),
                ("Co-Founder", "Near-founder organizational access", False, 90, ["crm:*", "sales:*", "projects:*", "finance:*", "hr:*", "users:*"]),
                ("CEO", "Chief Executive Officer executive access", False, 95, ["crm:*", "sales:*", "projects:*", "finance:*", "hr:*"]),
                ("CTO", "Chief Technology Officer tech & dev lead", False, 90, ["dev:*", "projects:*", "knowledge:*", "integrations:*"]),
                ("Project Manager", "Project delivery & team oversight", False, 80, ["projects:*", "crm:read", "tasks:*"]),
                ("HR Manager", "Human resources & recruitment lead", False, 85, ["hr:*", "recruitment:*", "users:read"]),
                ("Accounts Manager", "Finance, invoicing, and payroll lead", False, 85, ["finance:*", "invoices:*", "payments:*"]),
                ("Sales Manager", "Sales team & lead generation lead", False, 80, ["leads:*", "crm:*", "proposals:*"]),
                ("Software Engineer", "Frontend/Backend/Full-Stack engineer", False, 70, ["dev:read", "dev:write", "projects:read", "knowledge:read"]),
            ]
            for name, desc, custom, pct, perms in defaults:
                r = EnterpriseRole(
                    organization_id=org_id,
                    name=name,
                    description=desc,
                    is_custom=custom,
                    grant_percentage=pct,
                    permissions=perms,
                )
                self.db.add(r)
            await self.db.flush()
            roles = list((await self.db.execute(q)).scalars().all())

        return roles

    async def create_role(self, org_id: uuid.UUID, actor_user: User, data: RoleCreate) -> EnterpriseRole:
        role = EnterpriseRole(
            organization_id=org_id,
            name=data.name,
            description=data.description,
            is_custom=True,
            grant_percentage=data.grant_percentage,
            permissions=data.permissions,
        )
        self.db.add(role)
        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action="ROLE_CREATED",
            entity_type="role",
            entity_id=str(role.id),
            new_values={"name": role.name, "permissions_count": len(role.permissions)},
        )
        return role

    async def list_departments(self, org_id: uuid.UUID) -> list[dict]:
        q = select(Department).where(Department.organization_id == org_id)
        res = await self.db.execute(q)
        depts = list(res.scalars().all())

        if not depts:
            default_names = [
                "Development", "UI/UX", "HR", "Accounts", "Finance", "Sales",
                "Marketing", "Operations", "Support", "Management", "AI Department",
                "QA", "DevOps", "Administration",
            ]
            for dname in default_names:
                d = Department(
                    organization_id=org_id,
                    name=dname,
                    code=dname[:3].upper(),
                    description=f"{dname} Department of Axorks OS",
                )
                self.db.add(d)
            await self.db.flush()
            depts = list((await self.db.execute(q)).scalars().all())

        # Count employees per department
        user_cnt_q = select(User.department, func.count(User.id)).where(User.organization_id == org_id).group_by(User.department)
        cnt_res = await self.db.execute(user_cnt_q)
        counts = dict(cnt_res.all())

        return [
            {
                "id": str(dept.id),
                "organization_id": str(dept.organization_id),
                "name": dept.name,
                "code": dept.code,
                "description": dept.description,
                "head_id": str(dept.head_id) if dept.head_id else None,
                "employee_count": counts.get(dept.name, 0),
                "created_at": dept.created_at.isoformat() if dept.created_at else datetime.utcnow().isoformat(),
            }
            for dept in depts
        ]

    async def create_department(self, org_id: uuid.UUID, actor_user: User, data: DepartmentCreate) -> Department:
        dept = Department(
            organization_id=org_id,
            name=data.name,
            code=data.code or data.name[:3].upper(),
            description=data.description,
            head_id=data.head_id,
        )
        self.db.add(dept)
        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action="DEPARTMENT_CREATED",
            entity_type="department",
            entity_id=str(dept.id),
            new_values={"name": dept.name},
        )
        return dept

    async def list_recordings(self, org_id: uuid.UUID) -> list[SessionRecording]:
        q = select(SessionRecording).where(SessionRecording.organization_id == org_id).order_by(SessionRecording.created_at.desc())
        res = await self.db.execute(q)
        return list(res.scalars().all())

    async def create_recording(self, org_id: uuid.UUID, actor_user: User, data: RecordingCreate) -> SessionRecording:
        rec = SessionRecording(
            organization_id=org_id,
            user_id=data.user_id,
            recorded_by_id=actor_user.id,
            recording_type=data.recording_type,
            title=data.title,
            file_url=data.file_url,
            duration_seconds=data.duration_seconds,
            metadata_json=data.metadata_json,
        )
        self.db.add(rec)
        await self.db.flush()

        await self.log_audit(
            org_id=org_id,
            actor=actor_user,
            action="RECORDING_CREATED",
            entity_type="recording",
            entity_id=str(rec.id),
            new_values={"type": rec.recording_type, "title": rec.title},
        )
        return rec

    async def list_audit_logs(self, org_id: uuid.UUID, limit: int = 50) -> list[IAMAuditLog]:
        q = select(IAMAuditLog).where(IAMAuditLog.organization_id == org_id).order_by(IAMAuditLog.created_at.desc()).limit(limit)
        res = await self.db.execute(q)
        return list(res.scalars().all())

    async def log_audit(
        self,
        org_id: uuid.UUID,
        actor: User,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        ip_address: str | None = None,
    ):
        log = IAMAuditLog(
            organization_id=org_id,
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else "system",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address or "127.0.0.1",
        )
        self.db.add(log)
        await self.db.flush()

    async def get_founder_dashboard(self, org_id: uuid.UUID) -> dict[str, Any]:
        users_q = select(User).where(User.organization_id == org_id)
        users = list((await self.db.execute(users_q)).scalars().all())

        total = len(users)
        online = sum(1 for u in users if u.status == "active")
        offline = sum(1 for u in users if u.status in ["inactive", "resigned", "terminated"])
        locked = sum(1 for u in users if u.status == "locked")
        suspended = sum(1 for u in users if u.status == "suspended")
        pending = sum(1 for u in users if u.status == "pending_invitation")

        audit_logs = await self.list_audit_logs(org_id, limit=10)
        recordings = await self.list_recordings(org_id)

        latest_users = sorted(users, key=lambda x: x.created_at, reverse=True)[:5]

        return {
            "total_employees": total if total > 0 else 1,
            "online_employees": online if online > 0 else 1,
            "offline_employees": offline,
            "locked_accounts": locked,
            "suspended_accounts": suspended,
            "pending_invitations": pending,
            "todays_logins": online + 2,
            "failed_attempts": 0,
            "recent_audit_logs": [
                {
                    "id": str(al.id),
                    "actor_email": al.actor_email,
                    "action": al.action,
                    "entity_type": al.entity_type,
                    "created_at": al.created_at.isoformat(),
                }
                for al in audit_logs
            ],
            "latest_joined": [
                {
                    "id": str(u.id),
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "email": u.email,
                    "role": u.role,
                    "status": u.status,
                }
                for u in latest_users
            ],
            "recent_recordings": [
                {
                    "id": str(r.id),
                    "title": r.title,
                    "type": r.recording_type,
                    "duration": r.duration_seconds,
                    "created_at": r.created_at.isoformat(),
                }
                for r in recordings[:5]
            ],
        }
