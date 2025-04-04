// frontend/src/pages/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../features/cart/cartSlice';
import api from '../services/api';
import styled from 'styled-components';
import CouponComponent from '../components/checkout/CouponForm';
import Button from '../components/common/Button';

const CheckoutPage = () => {
  const cart = useSelector(state => state.cart.items);
  const cartTotal = useSelector(state => state.cart.total);
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
    country: 'Brasil'
  });
  
  // Estado para cupom de desconto
  const [couponCode, setCouponCode] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [totalWithDiscount, setTotalWithDiscount] = useState(0);
  
  // Atualizar o total com desconto quando o carrinho ou desconto mudar
  useEffect(() => {
    const numericCartTotal = typeof cartTotal === 'number' ? cartTotal : parseFloat(cartTotal || 0);
    setTotalWithDiscount(Math.max(0, numericCartTotal - discount));
  }, [cartTotal, discount]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({ ...prev, [name]: value }));
  };
  
  // Funções para gerenciar cupons
  const handleApplyCoupon = (code, discountAmount) => {
    setCouponCode(code);
    setDiscount(discountAmount);
  };
  
  const handleRemoveCoupon = () => {
    setCouponCode(null);
    setDiscount(0);
  };
  
  // Função para formatar preços com segurança
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    return typeof price === 'number' 
      ? price.toFixed(2) 
      : parseFloat(price || 0).toFixed(2);
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
      
      // Criar pedido
      const orderData = {
        items: cart.map(item => ({
          product: item.product?.id || item.id,
          quantity: item.quantity,
          price: item.product?.price || item.price
        })),
        shipping_full_name: shippingData.fullName,
        shipping_address: shippingData.address,
        shipping_city: shippingData.city,
        shipping_state: shippingData.state,
        shipping_postal_code: shippingData.postalCode,
        shipping_country: shippingData.country,
        total_amount: typeof cartTotal === 'number' ? cartTotal : parseFloat(cartTotal || 0),
      };
      
      // Criando o pedido no backend
      console.log('Enviando dados do pedido:', orderData);
      const orderResponse = await api.post('/orders/', orderData);
      const createdOrder = orderResponse.data;
      console.log('Pedido criado:', createdOrder);
      
      // Criar preferência de pagamento com o Mercado Pago
      const paymentData = {
        order_id: createdOrder.id
      };
      
      if (couponCode) {
        paymentData.coupon_code = couponCode;
      }
      
      const response = await api.post('/payments/create/', paymentData);
      
      console.log('Preferência de pagamento criada:', response.data);
      
      // Redirecionar para o Mercado Pago
      window.location.href = response.data.init_point;
      
      // Limpar o carrinho
      dispatch(clearCart());
      
    } catch (err) {
      console.error('Erro ao processar checkout:', err);
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
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors w-full mt-4"
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
                      R$ {formatPrice((item.product?.price || item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Componente de Cupom */}
              <CouponComponent 
                cartTotal={cartTotal}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
              />
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>R$ {formatPrice(cartTotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-lg text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ {formatPrice(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>R$ {formatPrice(totalWithDiscount)}</span>
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