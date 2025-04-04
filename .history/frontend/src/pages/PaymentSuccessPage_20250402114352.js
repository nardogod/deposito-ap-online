import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { fetchCart } from '../features/cart/cartSlice'; // Removida a importação de clearCart

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
  
  &:hover {
    background-color: #086F8E;
  }
`;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Ao invés de limpar o carrinho, vamos atualizar o carrinho a partir do servidor
    // O backend já deve ter esvaziado o carrinho quando o pagamento foi confirmado
    dispatch(fetchCart());
  }, [dispatch]);
  
  return (
    <Container>
      <SuccessIcon>✓</SuccessIcon>
      <Title>Pagamento realizado com sucesso!</Title>
      <Message>
        Seu pedido foi confirmado e está sendo processado. 
        Em breve você receberá um e-mail com os detalhes da sua compra.
      </Message>
      <Button onClick={() => navigate('/orders')}>Ver Meus Pedidos</Button>
    </Container>
  );
};

export default PaymentSuccessPage;