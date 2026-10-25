from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, VerificationStatus, PickupStatus, WasteEventType

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CITIZEN
    address: Optional[str] = None
    service_area: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    role: UserRole
    verification_status: VerificationStatus
    econect_badge_id: Optional[str]
    address: Optional[str]
    service_area: Optional[str]

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserValidationRequest(BaseModel):
    email: EmailStr
    phone: str

class UserValidationResponse(BaseModel):
    is_valid: bool
    exists: bool
    message: str
    user: Optional[UserResponse] = None
    normalized_phone: str
    verification_status: Optional[str] = None
    econect_badge_id: Optional[str] = None
    can_login: bool = False

class OTPRequest(BaseModel):
    email: EmailStr
    phone: str

class OTPResponse(BaseModel):
    message: str
    email: str
    phone: str
    demo_otp: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    phone: str
    otp: str

class NavigationAction(BaseModel):
    target: str
    label: str
    description: Optional[str] = None

class AIChatRequest(BaseModel):
    message: str
    current_role: Optional[str] = None
    lang: Optional[str] = "en"

class AIChatResponse(BaseModel):
    reply: str
    navigation_actions: List[NavigationAction] = []
    suggested_prompts: List[str] = []

class CategoryOut(BaseModel):
    id: str
    code: str
    name: str
    is_hazardous: bool
    safety_guidance: Optional[str]
    rate_per_kg: float
    currency: str = "INR"

class PickupCreate(BaseModel):
    category_code: str
    estimated_weight_kg: float = Field(..., gt=0, le=5000)
    pickup_address: str = Field(..., min_length=5)
    condition_note: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WeighRequest(BaseModel):
    actual_weight_kg: float = Field(..., gt=0, le=5000)

class CancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)

class PriceUpdateRequest(BaseModel):
    category_code: str
    rate_per_kg: float = Field(..., ge=0)
    source_note: str = "Updated by Administrator"

class WasteEventOut(BaseModel):
    id: str
    event_type: WasteEventType
    location_note: Optional[str]
    quantity_kg: Optional[float]
    notes: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class ClassificationResponse(BaseModel):
    predicted_category_code: str
    predicted_category_name: str
    confidence: float
    alternatives: List[dict]
    model_name: str
    is_demo_fallback: bool
    notice: str
