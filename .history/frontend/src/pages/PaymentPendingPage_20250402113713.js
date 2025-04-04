import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
  
  &:hover {
    background-color: #086F8E;
  }
`;

const PaymentPendingPage = () => {
  const navigate = useNavigate();
  
  return (
    <Container>
      <PendingIcon>⏱️</PendingIcon>
      <Title>Pagamento em Processamento</Title>
      <Message>
        Seu pagamento está sendo processado. 
        Isso pode levar algum tempo, dependendo do método de pagamento escolhido.
        Assim que confirmado, você receberá um e-mail com os detalhes.
      </Message>
      <Button onClick={() => navigate('/orders')}>Ver Meus Pedidos</Button>
    </Container>
  );
};

export default PaymentPendingPage;