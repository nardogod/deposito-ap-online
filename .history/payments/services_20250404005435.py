# payments/services.py
import os
import json
import logging
import mercadopago
from decimal import Decimal
from django.conf import settings
from orders.models import Order
from .models import Payment
from orders.notifications import send_order_status_notification, send_payment_confirmation

# payments/services.py








class MercadoPagoService:
    def __init__(self):
        self.mp = mercadopago.SDK(os.getenv('MERCADOPAGO_ACCESS_TOKEN'))

logger = logging.getLogger(__name__)

class MercadoPagoService:
    def __init__(self):
        # Obter o token das configurações do Django, não diretamente do os.environ
        self.access_token = settings.MERCADOPAGO_ACCESS_TOKEN
        # Verificar se o token é válido
        if not self.access_token or not isinstance(self.access_token, str):
            logger.error(f"Invalid MercadoPago access token: {self.access_token}")
            raise ValueError("MercadoPago access token is not configured properly")
        
        # Inicializar SDK com o token
        self.mp = mercadopago.SDK(self.access_token)
        
    def create_preference(self, order_id):
        """
        Cria uma preferência de pagamento no Mercado Pago para um pedido específico
        """
        try:
            order = Order.objects.select_related('user').prefetch_related('items__product').get(id=order_id)
            
            # Preparar itens para a preferência
            items = []
            for item in order.items.all():
                items.append({
                    "title": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": float(item.price),
                    "currency_id": "BRL",
                    "category_id": "products"
                })
            
            # Obter a URL do ngrok (se estiver configurada como variável de ambiente)
            ngrok_url = os.getenv('NGROK_URL')
            
            # URLs de frontend e backend
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
            
            # Usar ngrok_url se disponível
            if ngrok_url:
                logger.info(f"Usando URL do ngrok para webhooks: {ngrok_url}")
                webhook_url = f"{ngrok_url}/api/payments/webhook/"
                # Para as URLs de retorno, continuamos usando o frontend
                success_url = f"{frontend_url}/payment/success"
                failure_url = f"{frontend_url}/payment/failure"
                pending_url = f"{frontend_url}/payment/pending"
            else:
                logger.info("Usando URLs padrão (sem ngrok)")
                webhook_url = f"{backend_url}/api/payments/webhook/"
                success_url = f"{frontend_url}/payment/success"
                failure_url = f"{frontend_url}/payment/failure"
                pending_url = f"{frontend_url}/payment/pending"
            
            # Configurar preferência
            preference_data = {
                "items": items,
                "external_reference": str(order.id),
                "payer": {
                    "name": order.full_name.split(' ')[0] if order.full_name else order.user.first_name,
                    "surname": order.full_name.split(' ')[-1] if order.full_name else order.user.last_name,
                    "email": order.email or order.user.email,
                    "address": {
                        "street_name": order.address,
                        "zip_code": order.shipping_postal_code
                    }
                },
                "back_urls": {
                    "success": success_url,
                    "failure": failure_url,
                    "pending": pending_url
                },
                "auto_return": "approved",
                "notification_url": webhook_url,
                "statement_descriptor": "Depósito AP Online",
                "binary_mode": False,  # Permite status pendente
            }
            
            logger.info(f"Criando preferência com webhook URL: {webhook_url}")
            
            # Criar preferência no Mercado Pago
            preference_response = self.mp.preference().create(preference_data)
            preference = preference_response["response"]
            
            # Atualizar pedido com o ID da preferência
            order.preference_id = preference["id"]
            order.save(update_fields=['preference_id'])
            
            logger.info(f"Preferência criada com sucesso: {preference['id']}")
            return preference
            
        except Order.DoesNotExist:
            logger.error(f"Pedido {order_id} não encontrado")
            raise ValueError("Pedido não encontrado")
        except Exception as e:
            logger.error(f"Erro ao criar preferência: {str(e)}")
            raise Exception(f"Erro ao criar preferência: {str(e)}")
    
    def process_webhook(self, data):
        """
        Processa um webhook do Mercado Pago
        """
        try:
            logger.info(f"Recebido webhook: {json.dumps(data)}")
            
            # Verificar tipo de notificação
            notification_type = data.get('type')
            if notification_type != 'payment':
                logger.info(f"Notificação ignorada - tipo: {notification_type}")
                return "Notificação não é de pagamento"
            
            # Obter ID do pagamento
            payment_id = data.get('data', {}).get('id')
            if not payment_id:
                logger.error("ID do pagamento não encontrado na notificação")
                raise ValueError("ID do pagamento não encontrado na notificação")
            
            logger.info(f"Processando pagamento ID: {payment_id}")
            
            # Buscar informações do pagamento no Mercado Pago
            payment_info = self.mp.payment().get(payment_id)
            payment_data = payment_info["response"]
            
            logger.info(f"Detalhes do pagamento recebidos: {json.dumps(payment_data)}")
            
            # Obter external_reference (ID do pedido)
            order_id = payment_data.get('external_reference')
            if not order_id:
                logger.error("Referência do pedido não encontrada no pagamento")
                raise ValueError("Referência do pedido não encontrada no pagamento")
            
            logger.info(f"Atualizando pedido ID: {order_id}")
            
            # Buscar o pedido
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                logger.error(f"Pedido {order_id} não encontrado")
                raise ValueError(f"Pedido {order_id} não encontrado")
            
            # Mapear status do pagamento
            payment_status_map = {
                'approved': 'APPROVED',
                'pending': 'PENDING',
                'in_process': 'IN_PROCESS',
                'rejected': 'REJECTED',
                'refunded': 'REFUNDED',
                'cancelled': 'CANCELLED'
            }
            
            mp_status = payment_data.get('status', '').lower()
            payment_status = payment_status_map.get(mp_status, 'UNKNOWN')
            
            logger.info(f"Status do pagamento: {mp_status} -> {payment_status}")
            
            # Atualizar o status do pedido
            order.payment_status = payment_status
            
            # Atualizar o status do pedido com base no status do pagamento
            if payment_status == 'APPROVED':
                order.status = 'PAID'
                logger.info(f"Pedido {order_id} marcado como PAID")
            elif payment_status in ['REJECTED', 'CANCELLED']:
                order.status = 'CANCELLED'
                logger.info(f"Pedido {order_id} marcado como CANCELLED")
            
            # Atualizar informações de pagamento
            order.payment_id = str(payment_id)
            order.payment_method = payment_data.get('payment_method_id', '')
            
            order.save(update_fields=['payment_status', 'status', 'payment_id', 'payment_method'])
            
            # Criar ou atualizar o registro de pagamento
            payment_obj, created = Payment.objects.update_or_create(
                mercado_pago_id=str(payment_id),
                defaults={
                    'order': order,
                    'status': payment_status,
                    'amount': Decimal(str(payment_data.get('transaction_amount', 0))),
                    'payment_method': payment_data.get('payment_method_id', ''),
                    'payment_type': payment_data.get('payment_type_id', ''),
                    'payment_details': payment_data
                }
            )
            
            action = "Criado" if created else "Atualizado"
            logger.info(f"{action} registro de pagamento para pedido {order_id}, pagamento {payment_id}")
            
            return f"Pagamento {payment_id} processado com sucesso"
            
        except Exception as e:
            logger.error(f"Erro ao processar webhook: {str(e)}")
            raise Exception(f"Erro ao processar webhook: {str(e)}")