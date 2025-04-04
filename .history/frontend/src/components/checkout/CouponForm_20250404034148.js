// src/components/checkout/CouponForm.js
import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';

const CouponForm = ({ cartTotal, onApplyCoupon, onRemoveCoupon }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Validar o cupom na API
      const response = await api.post('/payments/coupons/validate/', { 
        code: code.trim(),
        cart_total: cartTotal
      });

      // Se o cupom for válido, aplicá-lo
      if (response.data.coupon) {
        // Verificar valor mínimo de compra
        if (cartTotal < response.data.min_purchase) {
          setError(`O valor mínimo para este cupom é R$ ${response.data.min_purchase.toFixed(2)}`);
          setLoading(false);
          return;
        }

        // Aplicar o cupom no backend
        const applyResponse = await api.post('/payments/coupons/apply/', { 
          code: code.trim(),
          cart_total: cartTotal
        });

        // Salvar detalhes do cupom aplicado
        setAppliedCoupon(applyResponse.data.coupon);
        setDiscount(applyResponse.data.discount);
        
        // Notificar o componente pai
        onApplyCoupon(code.trim(), applyResponse.data.discount);
        
        // Limpar o campo de código
        setCode('');
      }
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      setError(err.response?.data?.detail || 'Erro ao aplicar cupom. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Remover o cupom no backend
      await api.delete('/payments/coupons/remove/');
      
      // Limpar estado local
      setAppliedCoupon(null);
      setDiscount(0);
      
      // Notificar o componente pai
      onRemoveCoupon();
    } catch (err) {
      console.error('Erro ao remover cupom:', err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="text-lg font-semibold mb-2">Cupom de Desconto</h3>
      
      {appliedCoupon ? (
        <div className="bg-green-50 p-3 rounded mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{appliedCoupon.code}</p>
              <p className="text-sm text-green-600">Desconto aplicado: R$ {discount.toFixed(2)}</p>
            </div>
            <button 
              onClick={handleRemove}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2 mb-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código do cupom"
            className="flex-grow p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Aplicando...' : 'Aplicar'}
          </button>
        </form>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mb-2">{error}</p>
      )}
    </div>
  );
};

export default CouponForm;