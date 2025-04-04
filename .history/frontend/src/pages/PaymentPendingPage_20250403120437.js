// frontend/src/pages/PaymentPendingPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
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

const PendingIcon = styled.div`
  color: #ffc107;
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin-bottom: 1rem;
  color: #ffc107;
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

const ReasonList = styled.ul`
  text-align: left;
  margin: 1.5rem auto;
  max-width: 500px;
  padding-left: 1.5rem;
`;

const ReasonItem = styled.li`
  margin-bottom: 0.5rem;
`;

const PaymentPendingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pegar o ID da preferência da URL
  const preferenceId = searchParams.get('preference_id');
  
  useEffect(() => {
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
        
        // Atualizar o status do pedido para 'pendente'
        await api.put(`/api/orders/${response.data.id}/`, {
          payment_status: 'PENDING'
        });
        
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError('Não foi possível carregar os detalhes do seu pedido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [preferenceId]);
  
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
      <PendingIcon>⏳</PendingIcon>
      <Title>Pagamento em análise</Title>
      <Message>
        Seu pagamento está sendo processado e será confirmado em breve.
        Você receberá uma notificação assim que o status for atualizado.
      </Message>
      
      {orderDetails && (
        <OrderDetailsContainer>
          <OrderDetailsTitle>Detalhes do Pedido</OrderDetailsTitle>
          <OrderInfoItem><strong>Número do Pedido:</strong> {orderDetails.id}</OrderInfoItem>
          <OrderInfoItem><strong>Data:</strong> {new Date(orderDetails.created_at).toLocaleString()}</OrderInfoItem>
          <OrderInfoItem><strong>Total:</strong> R$ {orderDetails.total_amount?.toFixed(2)}</OrderInfoItem>
          <OrderInfoItem><strong>Status do Pagamento:</strong> Pendente</OrderInfoItem>
        </OrderDetailsContainer>
      )}
      
      <div style={{ margin: '2rem 0 1rem' }}>
        <OrderDetailsTitle>O que acontece agora?</OrderDetailsTitle>
        <ReasonList>
          <ReasonItem>Seu pagamento está sendo processado pelo Mercado Pago</ReasonItem>
          <ReasonItem>Se você escolheu boleto ou Pix, complete o pagamento para finalizar</ReasonItem>
          <ReasonItem>O prazo para confirmação varia de acordo com o método escolhido</ReasonItem>
          <ReasonItem>Você será notificado quando seu pagamento for confirmado</ReasonItem>
        </ReasonList>
      </div>
      
      <div>
        <Button onClick={() => navigate('/profile')}>Ver Meus Pedidos</Button>
        <SecondaryButton onClick={() => navigate('/')}>Voltar para a Loja</SecondaryButton>
      </div>
    </Container>
  );
};

export default PaymentPendingPage;