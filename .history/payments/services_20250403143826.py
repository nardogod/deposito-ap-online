# payments/services.py
import os
import json
import mercadopago
from decimal import Decimal
from orders.models import Order
from .models import Payment

class MercadoPagoService:
    def __init__(self):
        self.mp = mercadopago.SDK(os.getenv('MERCADOPAGO_ACCESS_TOKEN'))
        
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
                    "success": f"{os.getenv('SITE_URL', 'http://localhost:3000')}/payment/success",
                    "failure": f"{os.getenv('SITE_URL', 'http://localhost:3000')}/payment/failure",
                    "pending": f"{os.getenv('SITE_URL', 'http://localhost:3000')}/payment/pending"
                },
                "auto_return": "approved",
                "notification_url": f"{os.getenv('SITE_URL', 'http://localhost:8000')}/api/payments/webhook/",
                "statement_descriptor": "Depósito AP Online",
                "binary_mode": False,  # Permite status pendente
            }
            
            # Criar preferência no Mercado Pago
            preference_response = self.mp.preference().create(preference_data)
            preference = preference_response["response"]
            
            # Atualizar pedido com o ID da preferência
            order.preference_id = preference["id"]
            order.save(update_fields=['preference_id'])
            
            return preference
            
        except Order.DoesNotExist:
            raise ValueError("Pedido não encontrado")
        except Exception as e:
            raise Exception(f"Erro ao criar preferência: {str(e)}")
    
    def process_webhook(self, data):
        """
        Processa um webhook do Mercado Pago
        """
        try:
            # Verificar tipo de notificação
            notification_type = data.get('type')
            if notification_type != 'payment':
                return "Notificação não é de pagamento"
            
            # Obter ID do pagamento
            payment_id = data.get('data', {}).get('id')
            if not payment_id:
                raise ValueError("ID do pagamento não encontrado na notificação")
            
            # Buscar informações do pagamento no Mercado Pago
            payment_info = self.mp.payment().get(payment_id)
            payment_data = payment_info["response"]
            
            # Obter external_reference (ID do pedido)
            order_id = payment_data.get('external_reference')
            if not order_id:
                raise ValueError("Referência do pedido não encontrada no pagamento")
            
            # Buscar o pedido
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
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
            
            # Atualizar o status do pedido
            order.payment_status = payment_status
            
            # Atualizar o status do pedido com base no status do pagamento
            if payment_status == 'APPROVED':
                order.status = 'PAID'
            elif payment_status in ['REJECTED', 'CANCELLED']:
                order.status = 'CANCELLED'
            
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
            
            return f"Pagamento {payment_id} processado com sucesso"
            
        except Exception as e:
            raise Exception(f"Erro ao processar webhook: {str(e)}")