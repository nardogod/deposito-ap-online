// src/pages/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import { fetchCart } from '../features/cart/cartSlice';
import Button from '../components/common/Button';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const Title = styled.h1`
  margin-bottom: 1.5rem;
`;

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const OrderSummary = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  align-self: start;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryTotal = styled(SummaryItem)`
  font-weight: bold;
  font-size: 1.2rem;
  border-top: 2px solid #ddd;
  border-bottom: none;
  padding-top: 1rem;
  margin-top: 1rem;
`;

const TotalAmount = styled.span`
  color: #0a81ab;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 4px;
  white-space: pre-line;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-size: 1.5rem;
  font-weight: bold;
`;

const PaymentMethodsContainer = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

const PaymentMethodTitle = styled.h3`
  margin-bottom: 1rem;
`;

const PaymentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PaymentButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: ${props => props.bgColor || '#0a81ab'};
  
  &:hover {
    background-color: ${props => props.hoverColor || '#086F8E'};
  }
`;

const PaymentIcon = styled.img`
  height: 24px;
  width: auto;
`;

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, isLoading } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    building: '',
    delivery_type: 'day',
    delivery_date: '',
    delivery_time_slot: '',
    notes: '',
  });
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    } else {
      navigate('/login');
    }
  }, [dispatch, isAuthenticated, navigate]);
  
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        full_name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        apartment: user.apartment || '',
        building: user.building || '',
      }));
    }
  }, [user]);

  // Inicializar SDK do Mercado Pago quando necessário
  useEffect(() => {
    if (showPaymentOptions && createdOrder) {
      // Carregar o script do Mercado Pago se ainda não estiver carregado
      if (!window.MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => {
          console.log('Mercado Pago SDK carregado');
        };
      }
    }
  }, [showPaymentOptions, createdOrder]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.full_name.trim()) errors.push("Nome completo é obrigatório");
    if (!formData.email.trim()) errors.push("Email é obrigatório");
    if (!formData.phone.trim()) errors.push("Telefone é obrigatório");
    if (!formData.address.trim()) errors.push("Endereço é obrigatório");
    if (!formData.apartment.trim()) errors.push("Apartamento é obrigatório");
    if (!formData.building.trim()) errors.push("Edifício é obrigatório");
    if (!formData.delivery_date) errors.push("Data de entrega é obrigatória");
    if (!formData.delivery_time_slot) errors.push("Horário de entrega é obrigatório");
    
    return errors;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validar o formulário antes de enviar
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Garantir que os dados estão no formato correto
      const orderData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        apartment: formData.apartment.trim(),
        building: formData.building.trim(),
        delivery_type: formData.delivery_type,
        delivery_date: formData.delivery_date,
        delivery_time_slot: formData.delivery_time_slot,
        notes: formData.notes.trim(),
        total: parseFloat(total) // Garantir que total é um número
      };
      
      // Log detalhado para debug
      console.log('Enviando dados para criação de pedido:', JSON.stringify(orderData, null, 2));
      
      let response;
      
      // Tentar criar o pedido
      try {
        response = await api.post('orders/create/', orderData);
      } catch (firstError) {
        console.error('Primeira tentativa falhou:', firstError);
        // Se a primeira tentativa falhar, tente com a barra inicial
        response = await api.post('/orders/create/', orderData);
      }
      
      console.log('Pedido criado com sucesso:', response.data);
      
      // Armazenar o pedido criado
      setCreatedOrder(response.data);
      
      // Mostrar opções de pagamento
      setShowPaymentOptions(true);
      
    } catch (err) {
      console.error('Erro completo ao finalizar pedido:', err);
      
      let errorMessage = 'Erro ao finalizar pedido. Tente novamente.';
      
      if (err.response) {
        console.error('Status do erro:', err.response.status);
        console.error('Headers da resposta:', err.response.headers);
        console.error('Dados da resposta:', JSON.stringify(err.response.data, null, 2));
        
        // Tenta extrair mensagens de erro detalhadas
        if (typeof err.response.data === 'object') {
          const errorMessages = [];
          
          // Extrai todas as mensagens de erro do objeto de resposta
          for (const [field, messages] of Object.entries(err.response.data)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              errorMessages.push(`${field}: ${messages}`);
            } else if (messages && typeof messages === 'object') {
              errorMessages.push(`${field}: ${JSON.stringify(messages)}`);
            }
          }
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.request) {
        console.error('Requisição enviada mas sem resposta:', err.request);
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet.';
      } else {
        console.error('Erro ao configurar requisição:', err.message);
        errorMessage = 'Ocorreu um erro na aplicação. Tente novamente mais tarde.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCreatePayment = async (paymentMethod) => {
    if (!createdOrder) {
      setError('Erro: Pedido não foi criado corretamente.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // URL corrigida sem o prefixo '/api' duplicado
      const response = await api.post('payments/create/', {
        order_id: createdOrder.id
      });
      
      console.log('Preferência de pagamento criada:', response.data);
      
      // Armazenar a preferência de pagamento
      setPaymentPreference(response.data);
      
      // Redirecionar para o Mercado Pago de acordo com o método de pagamento
      if (paymentMethod === 'mercadopago') {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = response.data.init_point;
      }
      
    } catch (err) {
      console.error('Erro ao criar preferência de pagamento:', err);
      
      let errorMessage = 'Erro ao processar pagamento. Tente novamente.';
      
      if (err.response && err.response.data) {
        errorMessage = err.response.data.detail || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para formatar preços com segurança
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0,00';
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0,00' : numPrice.toFixed(2).replace('.', ',');
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  // Cria as opções de data (próximos 7 dias)
  const dateOptions = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const formattedDate = date.toISOString().split('T')[0];
    const displayDate = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    dateOptions.push({ value: formattedDate, label: displayDate });
  }
  
  // Se estamos no modo de seleção de pagamento
  if (showPaymentOptions && createdOrder) {
    return (
      <Container>
        <Title>Escolher Forma de Pagamento</Title>
        
        <FormContainer>
          <h2>Pedido #{createdOrder.id} - Selecione como deseja pagar</h2>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <PaymentMethodsContainer>
            <PaymentMethodTitle>Formas de Pagamento Disponíveis</PaymentMethodTitle>
            
            <PaymentOptions>
              <PaymentButton 
                bgColor="#009ee3" 
                hoverColor="#007eb5"
                onClick={() => handleCreatePayment('mercadopago')}
                disabled={isSubmitting}
              >
                Pagar com Mercado Pago
              </PaymentButton>
              
              {/* Outros métodos de pagamento podem ser adicionados aqui */}
            </PaymentOptions>
          </PaymentMethodsContainer>
          
          <Button 
            style={{ marginTop: '2rem' }} 
            onClick={() => setShowPaymentOptions(false)}
          >
            Voltar
          </Button>
        </FormContainer>
        
        {isSubmitting && (
          <LoadingOverlay>
            Processando pagamento...
          </LoadingOverlay>
        )}
      </Container>
    );
  }
  
  return (
    <Container>
      <Title>Finalizar Compra</Title>
      
      {isLoading ? (
        <p>Carregando...</p>
      ) : items && items.length > 0 ? (
        <CheckoutGrid>
          <FormContainer>
            <h2>Informações de Entrega</h2>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="apartment">Apartamento</Label>
                <Input
                  type="text"
                  id="apartment"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="building">Edifício</Label>
                <Input
                  type="text"
                  id="building"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="delivery_type">Tipo de Entrega</Label>
                <Select
                  id="delivery_type"
                  name="delivery_type"
                  value={formData.delivery_type}
                  onChange={handleChange}
                  required
                >
                  <option value="day">Entrega Diurna</option>
                  <option value="night">Entrega Noturna</option>
                  <option value="emergency">Emergência (até 2h)</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="delivery_date">Data de Entrega</Label>
                <Select
                  id="delivery_date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione uma data</option>
                  {dateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="delivery_time_slot">Horário de Entrega</Label>
                <Select
                  id="delivery_time_slot"
                  name="delivery_time_slot"
                  value={formData.delivery_time_slot}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione um horário</option>
                  <option value="08:00 - 10:00">08:00 - 10:00</option>
                  <option value="10:00 - 12:00">10:00 - 12:00</option>
                  <option value="14:00 - 16:00">14:00 - 16:00</option>
                  <option value="16:00 - 18:00">16:00 - 18:00</option>
                  <option value="18:00 - 20:00">18:00 - 20:00</option>
                  <option value="20:00 - 22:00">20:00 - 22:00 (Noturna)</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Instruções especiais para entrega..."
                />
              </FormGroup>
              
              <Button 
                primary 
                fullWidth 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processando...' : 'Continuar para Pagamento'}
              </Button>
            </form>
          </FormContainer>
          
          <OrderSummary>
            <h2>Resumo do Pedido</h2>
            
            {items.map(item => (
              <SummaryItem key={item.id}>
                <div>
                  {item.product.name} ({item.quantity}x)
                </div>
                <div>R$ {formatPrice(item.subtotal)}</div>
              </SummaryItem>
            ))}
            
            <SummaryTotal>
              <div>Total</div>
              <TotalAmount>R$ {formatPrice(total)}</TotalAmount>
            </SummaryTotal>
          </OrderSummary>
        </CheckoutGrid>
      ) : (
        <p>Seu carrinho está vazio. Adicione itens antes de finalizar a compra.</p>
      )}
      
      {isSubmitting && (
        <LoadingOverlay>
          Processando seu pedido...
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default CheckoutPage;