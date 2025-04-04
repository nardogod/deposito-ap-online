// frontend/src/pages/PaymentSuccessPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { fetchCart } from '../features/cart/cartSlice';
import api from '../services/api';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const SuccessIcon = styled.div`
  color: #28a745;
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin-bottom: 1rem;
  color: #28a745;
`;

const Message = styled.p`
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const Button = styled.button`
  background-color: #0a81ab;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin: 0 0.5rem;
  
  &:hover {
    background-color: #086F8E;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #6c757d;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const OrderDetailsContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: left;
`;

const OrderDetailsTitle = styled.h2`
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const OrderInfoItem = styled.p`
  margin-bottom: 0.5rem;
`;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pegar o ID da preferência da URL
  const preferenceId = searchParams.get('preference_id');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  
  useEffect(() => {
    // Atualizar o carrinho a partir do servidor
    dispatch(fetchCart());
    
    // Buscar detalhes do pedido
    const fetchOrderDetails = async () => {
      try {
        if (!preferenceId) {
          setError('Informações de pagamento não encontradas');
          setLoading(false);
          return;
        }
        
        // Buscar detalhes do pedido pelo ID da preferência
        const response = await api.get(`/api/orders/by-preference/${preferenceId}/`);
        setOrderDetails(response.data);
        
        // Se o status for 'approved', atualizar o status do pedido para 'PAID'
        if (status === 'approved' && paymentId) {
          await api.put(`/api/orders/${response.data.id}/`, {
            status: 'PAID',
            payment_status: 'APPROVED'
          });
        }
        
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError('Não foi possível carregar os detalhes do seu pedido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [dispatch, preferenceId, paymentId, status]);
  
  if (loading) {
    return (
      <Container>
        <Message>Carregando detalhes do seu pedido...</Message>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Title style={{ color: '#dc3545' }}>Ocorreu um erro</Title>
        <Message>{error}</Message>
        <Button onClick={() => navigate('/')}>Voltar para a Página Inicial</Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <SuccessIcon>✓</SuccessIcon>
      <Title>Pagamento realizado com sucesso!</Title>
      <Message>
        Seu pedido foi confirmado e está sendo processado. 
        Em breve você receberá um e-mail com os detalhes da sua compra.
      </Message>
      
      {orderDetails && (
        <OrderDetailsContainer>
          <OrderDetailsTitle>Detalhes do Pedido</OrderDetailsTitle>
          <OrderInfoItem><strong>Número do Pedido:</strong> {orderDetails.id}</OrderInfoItem>
          <OrderInfoItem><strong>Data:</strong> {new Date(orderDetails.created_at).toLocaleString()}</OrderInfoItem>
          <OrderInfoItem><strong>Total:</strong> R$ {orderDetails.total_amount?.toFixed(2)}</OrderInfoItem>
        </OrderDetailsContainer>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <Button onClick={() => navigate('/profile')}>Ver Meus Pedidos</Button>
        <SecondaryButton onClick={() => navigate('/')}>Continuar Comprando</SecondaryButton>
      </div>
    </Container>
  );
};

export default PaymentSuccessPage;