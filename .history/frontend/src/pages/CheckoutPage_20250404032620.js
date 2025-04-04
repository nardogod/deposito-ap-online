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
          product: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_full_name: shippingData.fullName,
        shipping_address: shippingData.address,
        shipping_city: shippingData.city,
        shipping_state: shippingData.state,
        shipping_postal_code: shippingData.postalCode,
        shipping_country: shippingData.country,
        total_amount: typeof cartTotal === 'number' ? cartTotal : parseFloat(cartTotal || 0),
        // Não precisamos enviar o desconto, pois será aplicado ao criar a preferência