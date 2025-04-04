// frontend/src/components/orders/OrderDetail.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../services/api';
import Button from '../common/Button';

const OrderDetailContainer = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const OrderNumber = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const OrderDate = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  
  ${({ status }) => {
    switch (status) {
      case 'CREATED':
        return 'background-color: #e2e3e5; color: #383d41;';
      case 'PAID':
        return 'background-color: #cce5ff; color: #004085;';
      case 'PROCESSING':
        return 'background-color: #fff3cd; color: #856404;';
      case 'SHIPPED':
        return 'background-color: #d1ecf1; color: #0c5460;';
      case 'DELIVERED':
        return 'background-color: #d4edda; color: #155724;';
      case 'CANCELLED':
        return 'background-color: #f8d7da; color: #721c24;';
      default:
        return 'background-color: #f8f9fa; color: #6c757d;';
    }
  }}
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InfoLabel = styled.div`
  width: 160px;
  font-weight: 500;
  color: #6c757d;
`;

const InfoValue = styled.div`
  flex: 1;
`;

const ItemsContainer = styled.div`
  margin-top: 1.5rem;
`;

const ItemsHeader = styled.h4`
  margin-bottom: 0.75rem;
  font-size: 1rem;
`;

const ItemsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ItemRow = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 500;
`;

const ItemQuantity = styled.div`
  color: #6c757d;
  font-size: 0.9rem;
`;

const ItemPrice = styled.div`
  font-weight: 500;
  text-align: right;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #dee2e6;
  margin-top: 1rem;
  padding-top: 1rem;
  font-weight: 700;
  font-size: 1.1rem;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
`;

const ModalText = styled.p`
  margin-bottom: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  min-height: 100px;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  gap: 1rem;
`;

const OrderDetail = ({ order, onRefresh }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar preço
  const formatPrice = (price) => {
    return typeof price === 'number' 
      ? price.toFixed(2) 
      : parseFloat(price || 0).toFixed(2);
  };

  // Verificar se o pedido pode ser cancelado
  const canBeCancelled = () => {
    const cancellableStatuses = ['CREATED', 'PAID', 'PROCESSING'];
    return cancellableStatuses.includes(order.status);
  };

  // Traduzir status
  const getStatusDisplay = (status) => {
    const statusMap = {
      'CREATED': 'Criado',
      'PAID': 'Pago',
      'PROCESSING': 'Em Processamento',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregue',
      'CANCELLED': 'Cancelado',
    };
    return statusMap[status] || status;
  };

  // Traduzir tipo de entrega
  const getDeliveryTypeDisplay = (type) => {
    const typeMap = {
      'standard': 'Padrão',
      'express': 'Expresso',
      'emergency': 'Emergência',
    };
    return typeMap[type] || type;
  };
  
  // Função para cancelar o pedido
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError('Por favor, informe o motivo do cancelamento.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.post(`/orders/${order.id}/cancel/`, {
        reason: cancelReason
      });
      
      setShowCancelModal(false);
      
      // Atualizar a lista de pedidos
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      setError(err.response?.data?.detail || 'Ocorreu um erro ao tentar cancelar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <OrderDetailContainer>
      <OrderHeader>
        <div>
          <OrderNumber>Pedido #{order.id}</OrderNumber>
          <OrderDate>{formatDate(order.created_at)}</OrderDate>
        </div>
        <StatusBadge status={order.status}>
          {getStatusDisplay(order.status)}
        </StatusBadge>
      </OrderHeader>
      
      <InfoRow>
        <InfoLabel>Status do Pagamento:</InfoLabel>
        <InfoValue>{order.payment_status_display || 'Não informado'}</InfoValue>
      </InfoRow>
      
      <InfoRow>
        <InfoLabel>Entrega:</InfoLabel>
        <InfoValue>{getDeliveryTypeDisplay(order.delivery_type)}</InfoValue>
      </InfoRow>
      
      {order.tracking_number && (
        <InfoRow>
          <InfoLabel>Rastreamento:</InfoLabel>
          <InfoValue>{order.tracking_number}</InfoValue>
        </InfoRow>
      )}
      
      {order.estimated_delivery && (
        <InfoRow>
          <InfoLabel>Previsão de Entrega:</InfoLabel>
          <InfoValue>{formatDate(order.estimated_delivery)}</InfoValue>
        </InfoRow>
      )}
      
      {order.delivery_date && (
        <InfoRow>
          <InfoLabel>Data de Entrega:</InfoLabel>
          <InfoValue>{formatDate(order.delivery_date)}</InfoValue>
        </InfoRow>
      )}
      
      {order.cancellation_reason && (
        <InfoRow>
          <InfoLabel>Motivo do Cancelamento:</InfoLabel>
          <InfoValue>{order.cancellation_reason}</InfoValue>
        </InfoRow>
      )}
      
      <ItemsContainer>
        <ItemsHeader>Itens do Pedido</ItemsHeader>
        <ItemsList>
          {order.items && order.items.map((item) => (
            <ItemRow key={item.id}>
              <ItemInfo>
                <ItemName>{item.product_name}</ItemName>
                <ItemQuantity>{item.quantity} unidade(s) x R$ {formatPrice(item.price)}</ItemQuantity>
              </ItemInfo>
              <ItemPrice>R$ {formatPrice(item.subtotal)}</ItemPrice>
            </ItemRow>
          ))}
        </ItemsList>
      </ItemsContainer>
      
      <TotalRow>
        <div>Total</div>
        <div>R$ {formatPrice(order.total || order.total_amount)}</div>
      </TotalRow>
      
      <ActionButtons>
        {canBeCancelled() && (
          <Button danger onClick={() => setShowCancelModal(true)}>
            Cancelar Pedido
          </Button>
        )}
      </ActionButtons>
      
      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <ModalBackdrop>
          <ModalContent>
            <ModalTitle>Cancelar Pedido</ModalTitle>
            <ModalText>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </ModalText>
            
            <div>
              <label htmlFor="cancelReason">Motivo do cancelamento:</label>
              <TextArea 
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Por favor, informe o motivo do cancelamento..."
              />
            </div>
            
            {error && (
              <div style={{ color: '#dc3545', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            
            <ButtonGroup>
              <Button secondary onClick={() => setShowCancelModal(false)} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button danger onClick={handleCancelOrder} disabled={isSubmitting}>
                {isSubmitting ? 'Processando...' : 'Confirmar Cancelamento'}
              </Button>
            </ButtonGroup>
          </ModalContent>
        </ModalBackdrop>
      )}
    </OrderDetailContainer>
  );
};

export default OrderDetail;