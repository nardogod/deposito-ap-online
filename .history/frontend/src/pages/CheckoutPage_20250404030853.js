// frontend/src/pages/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../features/cart/cartSlice';
import api from '../services/api';
import styled from 'styled-components';
import CouponComponent from '../components/checkout/CouponForm';


const CheckoutPage = () => {
  const cart = useSelector(state => state.cart.items);
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para dados de envio
  const [shippingData, setShippingData] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Brasil',
    phone: user?.phone || ''
  });
  
  // Log para depuração - exibir estrutura do carrinho
  useEffect(() => {
    console.log("Estrutura do carrinho:", JSON.stringify(cart, null, 2));
  }, [cart]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({ ...prev, [name]: value }));
  };
  
  // Calcula o preço total do carrinho
  const totalPrice = () => {
    return cart.reduce((total, item) => {
      // Certifique-se de que o item.product existe e tem preço
      const price = item.product && item.product.price ? item.product.price : 
                   (item.subtotal / item.quantity);
      return total + (price * item.quantity);
    }, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      
      // Verificar se temos produtos no carrinho
      if (cart.length === 0) {
        setError('Seu carrinho está vazio.');
        setLoading(false);
        return;
      }
      
      // Criar pedido com a estrutura correta
      const orderData = {
        items: cart.map(item => ({
          product: item.product.id,  // ID do produto, não do item
          quantity: item.quantity,
          price: item.product.price  // Preço do produto
        })),
        full_name: shippingData.fullName,
        email: user?.email || '',
        phone: shippingData.phone || user?.phone || '',
        address: shippingData.address,
        shipping_city: shippingData.city,
        shipping_state: shippingData.state,
        shipping_postal_code: shippingData.postalCode,
        shipping_country: shippingData.country,
        total_amount: totalPrice()
      };
      
      // Log para depuração
      console.log('Enviando dados do pedido:', JSON.stringify(orderData, null, 2));
      
      // Criando o pedido no backend
      const orderResponse = await api.post('/orders/', orderData);
      const createdOrder = orderResponse.data;
      console.log('Pedido criado:', createdOrder);
      
      // Criar preferência de pagamento com o Mercado Pago
      const response = await api.post('/payments/create/', { 
        order_id: createdOrder.id
      });
      
      console.log('Preferência de pagamento criada:', response.data);
      
      // Redirecionar para o Mercado Pago
      window.location.href = response.data.init_point;
      
      // Limpar o carrinho
      dispatch(clearCart());
      
    } catch (err) {
      console.error('Erro ao processar checkout:', err);
      
      // Log detalhado do erro
      if (err.response) {
        console.error('Status do erro:', err.response.status);
        console.error('Dados do erro:', err.response.data);
      }
      
      setError('Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Formulário de Envio */}
        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Informações de Envio</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="fullName">Nome Completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={shippingData.fullName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="phone">Telefone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shippingData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="address">Endereço</label>
              <input
                type="text"
                id="address"
                name="address"
                value={shippingData.address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="city">Cidade</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shippingData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="state">Estado</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={shippingData.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="postalCode">CEP</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={shippingData.postalCode}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors w-full"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Finalizar Compra'}
            </button>
          </form>
        </div>
        
        {/* Resumo do Pedido */}
        <div className="w-full md:w-1/2 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
          
          {cart.length === 0 ? (
            <p>Seu carrinho está vazio.</p>
          ) : (
            <>
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.id} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.product?.name || "Produto"}</p>
                      <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      R$ {((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {totalPrice().toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;