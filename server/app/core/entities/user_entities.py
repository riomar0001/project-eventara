import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, IPvAnyAddress, model_validator


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"
    DELETED = "deleted"


class AgeGroup(str, Enum):
    CHILD = "child"
    TEEN = "teen"
    ADULT = "adult"
    SENIOR = "senior"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    
class GrantEffect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class RoleAction(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"

class EducationLevel(str, Enum):
    NO_FORMAL_EDUCATION = "no_formal_education"
    ELEMENTARY_LEVEL = "elementary_level"
    ELEMENTARY_GRADUATE = "elementary_graduate"
    JUNIOR_HIGH_SCHOOL_LEVEL = "junior_high_school_level"
    JUNIOR_HIGH_SCHOOL_GRADUATE = "junior_high_school_graduate"
    SENIOR_HIGH_SCHOOL_LEVEL = "senior_high_school_level"
    SENIOR_HIGH_SCHOOL_GRADUATE = "senior_high_school_graduate"
    VOCATIONAL_TRADE_CERTIFICATE = "vocational_trade_certificate"
    COLLEGE_LEVEL_UNDERGRADUATE = "college_level_undergraduate"
    ASSOCIATE_DEGREE = "associate_degree"
    BACHELORS_DEGREE = "bachelors_degree"
    MASTERS_DEGREE = "masters_degree"
    DOCTORATE_DEGREE = "doctorate_degree"


class User(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    email: str
    password: str
    role: str
    status: UserStatus = UserStatus.ACTIVE

    model_config = {
        "from_attributes": True
    }


class UserProfile(BaseModel):
    user_id: uuid.UUID
    alias: str
    first_name: str
    last_name: str
    image_file_id: str | None = None
    age_group: AgeGroup
    gender: Gender
    occupation: str | None = None
    education_level: EducationLevel
    bio: str | None = None
    preferences: dict | None = None

    model_config = {
        "from_attributes": True
    }
    

class UserSecurity(BaseModel):
    user_id: uuid.UUID
    email_verified: bool = False
    email_verified_at: datetime | None = None
    password_change_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None

    model_config = {
        "from_attributes": True
    }


class UserActivity(BaseModel):
    user_id: uuid.UUID
    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None
    login_count: int = 0

    model_config = {
        "from_attributes": True
    }


class Feature(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool = True
    
    model_config = {
        "from_attributes": True
    }

class Role(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    
    model_config = {
        "from_attributes": True
    }
        
class RolePermission(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    role_id: uuid.UUID
    feature_id: uuid.UUID
    action: RoleAction
    effect: GrantEffect

    model_config = {
        "from_attributes": True
    }
         
class UserRole(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    role_id: uuid.UUID
    expires_at: datetime | None = None
    assigned_by: uuid.UUID | None = None
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "from_attributes": True
    }
        
class UserGrant(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    feature_id: uuid.UUID
    role_id: uuid.UUID
    action: RoleAction
    effect: GrantEffect
    reason: str | None = None
    expires_at: datetime | None = None
    granted_by: uuid.UUID | None = None

    model_config = {
        "from_attributes": True
    }
        
class Token(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    token_hash: str

    # Token lifecycle
    is_active: bool = True
    revoked_at: datetime | None = None
    expires_at: datetime
    last_used_at: datetime | None = None


    model_config = {
        "from_attributes": True
    }

    @model_validator(mode="after")
    def check_revoked(self):
        if self.revoked_at and self.is_active:
            raise ValueError("Revoked token cannot be active")
        return self


class LoginHistory(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    ip_address: IPvAnyAddress | None = None
    user_agent: str | None = None
    browser: str | None = None
    os: str | None = None
    device_type: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    successful: bool

    model_config = {
        "from_attributes": True
    }