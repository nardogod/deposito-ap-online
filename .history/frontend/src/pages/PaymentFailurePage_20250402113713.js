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

const ErrorIcon = styled.div`
  color: #dc3545;
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin-bottom: 1rem;
  color: #dc3545;
`;

const Message = styled.p`
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#0a81ab' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.primary ? '#086F8E' : '#5a6268'};
  }
`;

const PaymentFailurePage = () => {
  const navigate = useNavigate();
  
  return (
    <Container>
      <ErrorIcon>✗</ErrorIcon>
      <Title>Falha no Pagamento</Title>
      <Message>
        Infelizmente houve um problema ao processar seu pagamento. 
        Por favor, tente novamente ou escolha outro método de pagamento.
      </Message>
      <ButtonGroup>
        <Button onClick={() => navigate('/checkout')}>Tentar Novamente</Button>
        <Button primary onClick={() => navigate('/cart')}>Voltar ao Carrinho</Button>
      </ButtonGroup>
    </Container>
  );
};

export default PaymentFailurePage;