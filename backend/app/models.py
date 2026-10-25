import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

def gen_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    COLLECTOR = "COLLECTOR"
    CENTRE = "CENTRE"
    RECYCLER = "RECYCLER"
    ADMIN = "ADMIN"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class PickupStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    ON_THE_WAY = "ON_THE_WAY"
    ARRIVED = "ARRIVED"
    WEIGHED = "WEIGHED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class WasteEventType(str, enum.Enum):
    CREATED = "CREATED"
    COLLECTED = "COLLECTED"
    WEIGHED = "WEIGHED"
    SORTED = "SORTED"
    TRANSFERRED = "TRANSFERRED"
    RECEIVED_AT_CENTRE = "RECEIVED_AT_CENTRE"
    SENT_TO_RECYCLER = "SENT_TO_RECYCLER"
    RECEIVED_BY_RECYCLER = "RECEIVED_BY_RECYCLER"
    PROCESSING_CONFIRMED = "PROCESSING_CONFIRMED"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CITIZEN)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    econect_badge_id = Column(String(50), unique=True, nullable=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    service_area = Column(String(120), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class MaterialCategory(Base):
    __tablename__ = "material_categories"
    id = Column(String, primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    is_hazardous = Column(Boolean, default=False)
    safety_guidance = Column(Text, nullable=True)
    active = Column(Boolean, default=True)

class PriceRate(Base):
    __tablename__ = "price_rates"
    id = Column(String, primary_key=True, default=gen_uuid)
    category_id = Column(String, ForeignKey("material_categories.id"), nullable=False, index=True)
    rate_per_kg = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    region = Column(String(100), default="ALL")
    source_note = Column(String(255), default="Illustrative SIH Demo Seed Rate")
    active = Column(Boolean, default=True)
    valid_from = Column(DateTime(timezone=True), default=utcnow)
    category = relationship("MaterialCategory")

class WasteRecord(Base):
    __tablename__ = "waste_records"
    id = Column(String, primary_key=True, default=gen_uuid)
    tracking_code = Column(String(40), unique=True, index=True, nullable=False)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    category_id = Column(String, ForeignKey("material_categories.id"), nullable=False)
    current_holder_id = Column(String, ForeignKey("users.id"), nullable=False)
    estimated_weight_kg = Column(Float, nullable=False)
    actual_weight_kg = Column(Float, nullable=True)
    condition_note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    category = relationship("MaterialCategory")
    events = relationship("WasteEvent", back_populates="waste_record", order_by="WasteEvent.timestamp")

class WasteEvent(Base):
    __tablename__ = "waste_events"
    id = Column(String, primary_key=True, default=gen_uuid)
    waste_record_id = Column(String, ForeignKey("waste_records.id"), nullable=False, index=True)
    event_type = Column(SQLEnum(WasteEventType), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    location_note = Column(String(255), nullable=True)
    quantity_kg = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    waste_record = relationship("WasteRecord", back_populates="events")

class PickupRequest(Base):
    __tablename__ = "pickup_requests"
    id = Column(String, primary_key=True, default=gen_uuid)
    waste_record_id = Column(String, ForeignKey("waste_records.id"), nullable=False, unique=True)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    collector_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    category_id = Column(String, ForeignKey("material_categories.id"), nullable=False)
    pickup_address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    estimated_weight_kg = Column(Float, nullable=False)
    actual_weight_kg = Column(Float, nullable=True)
    locked_rate_per_kg = Column(Float, nullable=False)
    estimated_value_inr = Column(Float, nullable=False)
    final_value_inr = Column(Float, nullable=True)
    status = Column(SQLEnum(PickupStatus), default=PickupStatus.REQUESTED, index=True)
    cancellation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    waste_record = relationship("WasteRecord")
    category = relationship("MaterialCategory")
    citizen = relationship("User", foreign_keys=[citizen_id])
    collector = relationship("User", foreign_keys=[collector_id])

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=gen_uuid)
    pickup_id = Column(String, ForeignKey("pickup_requests.id"), unique=True, nullable=False)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    collector_id = Column(String, ForeignKey("users.id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    rate_per_kg_snapshot = Column(Float, nullable=False)
    total_amount_inr = Column(Float, nullable=False)
    payment_mode_note = Column(String(100), default="Direct Offline Settlement (Recorded on ECONECT)")
    created_at = Column(DateTime(timezone=True), default=utcnow)

class CentreInventory(Base):
    __tablename__ = "centre_inventory"
    id = Column(String, primary_key=True, default=gen_uuid)
    centre_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(String, ForeignKey("material_categories.id"), nullable=False)
    available_weight_kg = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    category = relationship("MaterialCategory")

class RecyclerTransaction(Base):
    __tablename__ = "recycler_transactions"
    id = Column(String, primary_key=True, default=gen_uuid)
    waste_record_id = Column(String, ForeignKey("waste_records.id"), nullable=False)
    sender_centre_id = Column(String, ForeignKey("users.id"), nullable=False)
    recycler_id = Column(String, ForeignKey("users.id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    indicative_rate_per_kg = Column(Float, nullable=False)
    status = Column(String(40), default="DISPATCHED")
    created_at = Column(DateTime(timezone=True), default=utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String(120), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
