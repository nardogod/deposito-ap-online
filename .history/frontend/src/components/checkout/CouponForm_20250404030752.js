// frontend/src/components/checkout/CouponForm.js
import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../../services/api';

const CouponContainer = styled.div`
  margin-bottom: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

const CouponTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const CouponForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CouponInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  text-transform: uppercase;
`;

const CouponButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: #0a81ab;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: #086f8e;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const CouponError = styled.div`
  color: #dc3545;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const CouponSuccess = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-top: 1rem;
`;

const CouponInfo = styled.div`
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #721c24;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CouponComponent = ({ cartTotal, onApplyCoupon, onRemoveCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError('Por favor, insira um código de cupom.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/coupons/apply/', {
        code: couponCode.trim().toUpperCase(),
        cart_total: cartTotal
      });
      
      // Aplicar o cupom
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discount: response.data.discount,
        discountType: response.data.coupon.discount_type,
        discountValue: response.data.coupon.discount_value,
      });
      
      // Limpar o input
      setCouponCode('');
      
      // Callback para o componente pai
      if (onApplyCoupon) {
        onApplyCoupon(response.data.coupon.code, response.data.discount);
      }
      
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      setError(err.response?.data?.detail || 'Não foi possível aplicar o cupom. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveCoupon = async () => {
    setLoading(true);
    
    try {
      await api.delete('/payments/coupons/remove/');
      
      // Remover o cupom aplicado
      setAppliedCoupon(null);
      
      // Callback para o componente pai
      if (onRemoveCoupon) {
        onRemoveCoupon();
      }
      
    } catch (err) {
      console.error('Erro ao remover cupom:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CouponContainer>
      <CouponTitle>Cupom de Desconto</CouponTitle>
      
      {!appliedCoupon ? (
        <>
          <CouponForm onSubmit={handleSubmit}>
            <CouponInput
              type="text"
              placeholder="Insira seu código de cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={loading}
            />
            <CouponButton type="submit" disabled={loading}>
              {loading ? 'Aplicando...' : 'Aplicar Cupom'}
            </CouponButton>
          </CouponForm>
          
          {error && <CouponError>{error}</CouponError>}
        </>
      ) : (
        <CouponSuccess>
          <CouponInfo>
            Cupom <strong>{appliedCoupon.code}</strong> aplicado: 
            {appliedCoupon.discountType === 'percentage' 
              ? ` ${appliedCoupon.discountValue}% de desconto` 
              : ` R$ ${appliedCoupon.discountValue} de desconto`}
            <div>Economia de R$ {appliedCoupon.discount.toFixed(2)}</div>
          </CouponInfo>
          <RemoveButton onClick={handleRemoveCoupon} disabled={loading}>
            {loading ? 'Removendo...' : 'Remover'}
          </RemoveButton>
        </CouponSuccess>
      )}
    </CouponContainer>
  );
};

export default CouponComponent;