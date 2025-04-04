// frontend/src/pages/PaymentFailurePage.js
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const ReasonList = styled.ul`
  text-align: left;
  margin: 1.5rem auto;
  max-width: 500px;
  padding-left: 1.5rem;
`;

const ReasonItem = styled.li`
  margin-bottom: 0.5rem;
`;

const PaymentFailurePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extrair parâmetros da URL
  const status = searchParams.get('status');
  
  return (
    <Container>
      <ErrorIcon>✕</ErrorIcon>
      <Title>Pagamento não aprovado</Title>
      <Message>
        Não foi possível processar seu pagamento. 
        {status === 'rejected' ? ' O pagamento foi rejeitado.' : ' O pagamento foi cancelado.'}
      </Message>
      
      <ReasonList>
        <ReasonItem>Dados do cartão inválidos ou insuficientes</ReasonItem>
        <ReasonItem>Saldo insuficiente</ReasonItem>
        <ReasonItem>Transação recusada pelo banco emissor</ReasonItem>
        <ReasonItem>O pagamento foi cancelado antes de ser concluído</ReasonItem>
      </ReasonList>
      
      <Message>
        Você pode tentar novamente com outro método de pagamento ou entrar em contato com o seu banco para mais informações.
      </Message>
      
      <div>
        <Button onClick={() => navigate('/checkout')}>Tentar Novamente</Button>
        <SecondaryButton onClick={() => navigate('/')}>Voltar para a Loja</SecondaryButton>
      </div>
    </Container>
  );
};

export default PaymentFailurePage;