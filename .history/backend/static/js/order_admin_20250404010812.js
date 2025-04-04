// static/js/order_admin.js
(function($) {
    // Função para atualizar o status do pedido via AJAX
    window.updateOrderStatus = function(orderId, newStatus) {
        if (!orderId || !newStatus) {
            return;
        }
        
        // Confirmar a ação com o usuário
        const statusLabels = {
            'PROCESSING': 'Em Processamento',
            'SHIPPED': 'Enviado',
            'DELIVERED': 'Entregue',
            'CANCELLED': 'Cancelado'
        };
        
        const confirmMessage = `Tem certeza que deseja mudar o status para "${statusLabels[newStatus]}"?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Se for cancelamento, solicitar motivo
        let cancellationReason = '';
        if (newStatus === 'CANCELLED') {
            cancellationReason = prompt('Por favor, informe o motivo do cancelamento:');
            if (cancellationReason === null) {  // Usuário clicou em Cancelar no prompt
                return;
            }
        }
        
        // Se for envio, solicitar número de rastreamento e data estimada
        let trackingNumber = '';
        let estimatedDelivery = '';
        if (newStatus === 'SHIPPED') {
            trackingNumber = prompt('Número de rastreamento (opcional):');
            if (trackingNumber === null) {  // Usuário clicou em Cancelar no prompt
                return;
            }
            
            estimatedDelivery = prompt('Data estimada de entrega (AAAA-MM-DD):');
            if (estimatedDelivery === null) {  // Usuário clicou em Cancelar no prompt
                return;
            }
        }
        
        // Obter o token CSRF
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Preparar os dados para envio
        const data = {
            status: newStatus
        };
        
        if (cancellationReason) {
            data.cancellation_reason = cancellationReason;
        }
        
        if (trackingNumber) {
            data.tracking_number = trackingNumber;
        }
        
        if (estimatedDelivery) {
            data.estimated_delivery = estimatedDelivery;
        }
        
        // Enviar requisição AJAX
        $.ajax({
            url: `/api/orders/${orderId}/`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-CSRFToken', csrfToken);
            },
            success: function(response) {
                // Recarregar a página para mostrar as alterações
                window.location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Erro ao atualizar status:', error);
                let errorMessage = 'Ocorreu um erro ao atualizar o status do pedido.';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.detail) {
                        errorMessage = response.detail;
                    }
                } catch (e) {
                    // Ignorar erro de parsing
                }
                
                alert(errorMessage);
            }
        });
    };
    
    // Quando a página carregar, adicionar estilo aos botões de ação
    $(document).ready(function() {
        // Estilizar os contêineres de botões
        $('.button-container').each(function() {
            $(this).css({
                'display': 'flex',
                'gap': '5px',
                'flex-wrap': 'wrap'
            });
        });
    });
    
})(django.jQuery);