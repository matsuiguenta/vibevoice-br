"""
Router Auth — Autenticação (registro, login, perfil)
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import (
    verify_password, get_password_hash,
    create_access_token, get_current_user
)
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", status_code=201)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Cadastro de novo usuário."""
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    user = User(
        name=request.name,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        credits=settings.FREE_CREDITS,
        plan="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "credits": user.credits}
    )


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login com email e senha."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Conta desativada")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "credits": user.credits,
            "plan": user.plan,
            "is_admin": user.is_admin,
        }
    )


@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Perfil do usuário autenticado."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "credits": current_user.credits,
        "plan": current_user.plan,
        "is_admin": current_user.is_admin,
        "total_tts_minutes": round(current_user.total_tts_minutes, 2),
        "total_asr_minutes": round(current_user.total_asr_minutes, 2),
        "total_clones": current_user.total_clones,
        "created_at": current_user.created_at,
    }


@router.put("/me")
async def update_profile(
    name: str = None,
    preferred_language: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza dados do perfil."""
    if name:
        current_user.name = name
    if preferred_language:
        current_user.preferred_language = preferred_language
    db.commit()
    return {"message": "Perfil atualizado com sucesso"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alteração de senha."""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 8 caracteres")

    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"message": "Senha alterada com sucesso"}
