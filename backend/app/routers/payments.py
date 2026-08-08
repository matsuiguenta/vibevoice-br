"""
Router de Pagamentos — Mercado Pago Integration
Checkout transparente e Pix para compra de créditos e assinaturas
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from loguru import logger

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/payments", tags=["Pagamentos"])

# Tabela de Pacotes de Créditos
CREDIT_PACKAGES = {
  "pkg_starter": {"name": "Pacote Starter", "credits": 300, "price_brl": 49.00},
  "pkg_basic": {"name": "Pacote Basic", "credits": 1000, "price_brl": 149.00},
  "pkg_plus": {"name": "Pacote Plus", "credits": 4000, "price_brl": 499.00},
}


class CreatePreferenceRequest(BaseModel):
  package_id: str


@router.get("/packages")
async def list_packages():
  """Lista pacotes de créditos disponíveis para compra."""
  return {"packages": CREDIT_PACKAGES}


@router.post("/create-preference")
async def create_payment_preference(
    req: CreatePreferenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
  """Cria uma preferência de pagamento no Mercado Pago."""
  package = CREDIT_PACKAGES.get(req.package_id)
  if not package:
    raise HTTPException(status_code=400, detail="Pacote inválido")

  if not settings.MERCADOPAGO_ACCESS_TOKEN:
    # Se o token não estiver configurado, simula ambiente de teste
    logger.warning("MERCADOPAGO_ACCESS_TOKEN não configurado — Modo mock de checkout")
    external_ref = f"usr_{current_user.id}_pkg_{req.package_id}_{uuid.uuid4().hex[:8]}"
    return {
        "init_point": f"/checkout/mock?ref={external_ref}&amount={package['price_brl']}",
        "preference_id": f"pref_mock_{uuid.uuid4().hex[:12]}",
        "external_reference": external_ref,
        "is_mock": True,
    }

  try:
    import mercadopago

    sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)

    external_ref = (
        f"usr_{current_user.id}_pkg_{req.package_id}_{uuid.uuid4().hex[:8]}"
    )

    preference_data = {
        "items": [{
            "id": req.package_id,
            "title": f"VibeVoice BR — {package['name']} ({package['credits']} créditos)",
            "quantity": 1,
            "currency_id": "BRL",
            "unit_price": package["price_brl"],
        }],
        "payer": {
            "email": current_user.email,
            "name": current_user.name,
        },
        "back_urls": {
            "success": f"{settings.ALLOWED_ORIGINS.split(',')[0]}/checkout/sucesso",
            "failure": f"{settings.ALLOWED_ORIGINS.split(',')[0]}/checkout/falha",
            "pending": f"{settings.ALLOWED_ORIGINS.split(',')[0]}/checkout/pendente",
        },
        "auto_return": "approved",
        "external_reference": external_ref,
        "notification_url": settings.MERCADOPAGO_WEBHOOK_URL,
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    return {
        "init_point": preference.get("init_point"),
        "sandbox_init_point": preference.get("sandbox_init_point"),
        "preference_id": preference.get("id"),
        "external_reference": external_ref,
        "is_mock": False,
    }
  except Exception as e:
    logger.error(f"Erro ao criar preferência MP: {e}")
    raise HTTPException(
        status_code=500, detail="Erro ao conectar ao gateway de pagamento"
    )


@router.post("/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
  """Webhook para receber notificações instantâneas de pagamento (IPN) do Mercado Pago."""
  try:
    payload = await request.json()
    logger.info(f"📩 Mercado Pago Webhook recebido: {payload}")

    action = payload.get("action")
    data_id = payload.get("data", {}).get("id")

    if action in ["payment.created", "payment.updated"] and data_id:
      if settings.MERCADOPAGO_ACCESS_TOKEN:
        import mercadopago

        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        payment_info = sdk.payment().get(data_id)
        payment = payment_info.get("response", {})

        status = payment.get("status")
        external_ref = payment.get("external_reference", "")

        if status == "approved" and external_ref.startswith("usr_"):
          # Formato ref: usr_{user_id}_pkg_{package_id}_{uuid}
          parts = external_ref.split("_")
          user_id = int(parts[1])
          package_id = f"pkg_{parts[3]}"

          package = CREDIT_PACKAGES.get(package_id)
          if package:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
              user.credits += package["credits"]
              user.plan = package_id.replace("pkg_", "")
              db.commit()
              logger.info(
                  f"✅ {package['credits']} créditos adicionados ao usuário"
                  f" #{user_id}"
              )

    return {"status": "ok"}
  except Exception as e:
    logger.error(f"Erro ao processar webhook MP: {e}")
    return {"status": "error", "message": str(e)}
