# orders/notifications.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_order_status_notification(order):
    """
    Envia notificação por e-mail quando o status de um pedido é atualizado
    """
    try:
        subject = f'Atualização do Pedido #{order.id} - {order.get_status_display()}'
        
        # Contexto para o template de e-mail
        context = {
            'order': order,
            'items': order.items.all(),
            'site_url': settings.SITE_URL,
        }
        
        # Renderizar o template HTML do e-mail
        html_message = render_to_string('emails/order_status_update.html', context)
        
        # Renderizar o template de texto simples do e-mail
        plain_message = render_to_string('emails/order_status_update_plain.html', context)
        
        # E-mail destinatário (do cliente)
        recipient_email = order.email or order.user.email
        
        # Enviar o e-mail
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"E-mail de atualização enviado para {recipient_email} - Pedido #{order.id}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail de atualização do pedido #{order.id}: {str(e)}")
        return False


def send_payment_confirmation(order):
    """
    Envia confirmação por e-mail quando um pagamento é aprovado
    """
    try:
        subject = f'Pagamento Confirmado - Pedido #{order.id}'
        
        # Contexto para o template de e-mail
        context = {
            'order': order,
            'items': order.items.all(),
            'site_url': settings.SITE_URL,
        }
        
        # Renderizar o template HTML do e-mail
        html_message = render_to_string('emails/payment_confirmation.html', context)
        
        # Renderizar o template de texto simples do e-mail
        plain_message = render_to_string('emails/payment_confirmation_plain.html', context)
        
        # E-mail destinatário (do cliente)
        recipient_email = order.email or order.user.email
        
        # Enviar o e-mail
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"E-mail de confirmação de pagamento enviado para {recipient_email} - Pedido #{order.id}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail de confirmação de pagamento do pedido #{order.id}: {str(e)}")
        return False