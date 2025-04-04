// src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import Button from '../components/common/Button';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const OrdersCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ProfileName = styled.h2`
  margin-bottom: 1rem;
`;

const ProfileInfo = styled.div`
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  
  span {
    font-weight: bold;
  }
`;

const OrdersTitle = styled.h2`
  margin-bottom: 1rem;
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const OrderNumber = styled.h3`
  margin: 0;
`;

const OrderDate = styled.span`
  color: #666;
`;

const OrderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const OrderStatus = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  
  ${({ status }) => {
    switch (status) {
      case 'pending_payment':
        return `background-color: #ffeeba; color: #856404;`;
      case 'payment_confirmed':
        return `background-color: #b8daff; color: #004085;`;
      case 'preparing':
        return `background-color: #c3e6cb; color: #155724;`;
      case 'shipped':
        return `background-color: #d4edda; color: #155724;`;
      case 'delivered':
        return `background-color: #d4edda; color: #155724;`;
      case 'cancelled':
        return `background-color: #f5c6cb; color: #721c24;`;
      case 'refunded':
        return `background-color: #f5c6cb; color: #721c24;`;
      default:
        return `background-color: #e2e3e5; color: #383d41;`;
    }
  }}
`;

const OrderItems = styled.div`
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const EmptyOrdersMessage = styled.p`
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/history/');
        console.log('Pedidos recebidos:', response.data);
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // Função para formatar preços com segurança
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    return typeof price === 'number' 
      ? price.toFixed(2) 
      : parseFloat(price).toFixed(2);
  };
  
  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending_payment': 'Aguardando Pagamento',
      'payment_confirmed': 'Pagamento Confirmado',
      'preparing': 'Em Preparação',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
    };
    return statusMap[status] || status;
  };
  
  return (
    <Container>
      <h1>Minha Conta</h1>
      
      <ProfileGrid>
        <ProfileCard>
          <ProfileName>{user.first_name} {user.last_name}</ProfileName>
          <ProfileInfo>
            <InfoItem><span>Usuário:</span> {user.username}</InfoItem>
            <InfoItem><span>Email:</span> {user.email}</InfoItem>
            <InfoItem><span>Telefone:</span> {user.phone || 'Não informado'}</InfoItem>
            <InfoItem><span>Endereço:</span> {user.address || 'Não informado'}</InfoItem>
            <InfoItem><span>Apartamento:</span> {user.apartment || 'Não informado'}</InfoItem>
            <InfoItem><span>Edifício:</span> {user.building || 'Não informado'}</InfoItem>
          </ProfileInfo>
          <Button secondary fullWidth as={Link} to="/profile/edit">
            Editar Perfil
          </Button>
        </ProfileCard>
        
        <OrdersCard>
          <OrdersTitle>Meus Pedidos</OrdersTitle>
          
          {loading ? (
            <p>Carregando pedidos...</p>
          ) : orders.length > 0 ? (
            <OrdersList>
              {orders.map(order => (
                <OrderCard key={order.id}>
                  <OrderHeader>
                    <OrderNumber>Pedido #{order.id}</OrderNumber>
                    <OrderDate>{new Date(order.created_at).toLocaleDateString()}</OrderDate>
                  </OrderHeader>
                  <OrderInfo>
                    <div>
                      <span>Total: </span>
                      <strong>R$ {formatPrice(order.total)}</strong>
                    </div>
                    <OrderStatus status={order.status}>
                      {getStatusDisplay(order.status)}
                    </OrderStatus>
                  </OrderInfo>
                  <div>
                    <span>Entrega: </span>
                    {order.delivery_date} ({order.delivery_time_slot})
                  </div>
                  <OrderItems>
                    <strong>Itens:</strong> {order.items.map(item => `${item.quantity}x ${item.product_name}`).join(', ')}
                  </OrderItems>
                </OrderCard>
              ))}
            </OrdersList>
          ) : (
            <EmptyOrdersMessage>
              Você ainda não realizou nenhum pedido.
            </EmptyOrdersMessage>
          )}
        </OrdersCard>
      </ProfileGrid>
    </Container>
  );
};

export default ProfilePage;