// src/pages/ProductDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import api from '../services/api';
import { addToCart, clearCartError } from '../features/cart/cartSlice';
import Button from '../components/common/Button';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ProductContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  margin-bottom: 0.5rem;
`;

const Price = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: #0a81ab;
  margin-bottom: 1rem;
`;

const Description = styled.div`
  margin-bottom: 1.5rem;
`;

const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const QuantityLabel = styled.label`
  margin-right: 1rem;
`;

const QuantityInput = styled.input`
  width: 60px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border-radius: 4px;
`;

const StockInfo = styled.div`
  margin-bottom: 1rem;
  font-weight: ${props => props.lowStock ? 'bold' : 'normal'};
  color: ${props => props.lowStock ? '#dc3545' : 'inherit'};
`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { error, isLoading: cartLoading } = useSelector((state) => state.cart);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [localError, setLocalError] = useState(null);

  // Limpar erros do carrinho ao montar o componente
  useEffect(() => {
    dispatch(clearCartError());
    return () => dispatch(clearCartError()); // Limpar ao desmontar também
  }, [dispatch]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Verificação para garantir que id não é undefined
        if (!id || id === 'undefined') {
          console.error('ID do produto é undefined ou inválido');
          setFetchError('ID do produto inválido');
          setLoading(false);
          return;
        }

        console.log('Buscando produto com id/slug:', id);
        const response = await api.get(`/products/${id}/`);
        console.log('Produto obtido:', response.data);
        setProduct(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
        setFetchError('Produto não encontrado');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLocalError(null);

    if (!product || !product.id) {
      setLocalError('Informações do produto não disponíveis');
      return;
    }

    // Validação rigorosa do estoque
    if (quantity > product.stock) {
      setLocalError(`Não é possível adicionar ${quantity} unidades. Apenas ${product.stock} unidades disponíveis em estoque.`);
      setQuantity(product.stock); // Ajustar automaticamente para o máximo disponível
      return;
    }

    try {
      console.log('Tentando adicionar ao carrinho - ID:', product.id, 'Quantidade:', quantity, 'Estoque:', product.stock);
      
      const result = await dispatch(addToCart({ 
        productId: product.id, 
        quantity 
      })).unwrap();
      
      console.log('Resultado da adição ao carrinho:', result);
      
      navigate('/cart');
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err);
      setLocalError(err?.detail || 'Erro ao adicionar ao carrinho. Tente novamente.');
    }
  };

  // Função para formatar preços com segurança
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    return typeof price === 'number' 
      ? price.toFixed(2) 
      : parseFloat(price).toFixed(2);
  };

  if (loading) return <Container><p>Carregando...</p></Container>;
  if (fetchError) return <Container><p>{fetchError}</p></Container>;
  if (!product) return <Container><p>Produto não encontrado</p></Container>;

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <Container>
      <ProductContainer>
        <div>
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0].image} alt={product.name} style={{ maxWidth: '100%', borderRadius: '4px' }} />
          ) : (
            <div style={{ background: '#f0f0f0', height: '300px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>Imagem não disponível</p>
            </div>
          )}
        </div>
        <ProductInfo>
          <Title>{product.name}</Title>
          <Price>
            R$ {formatPrice(product.price)}
          </Price>
          <Description>{product.description}</Description>
          
          <StockInfo lowStock={isLowStock}>
            {isOutOfStock ? (
              <span>Produto indisponível</span>
            ) : isLowStock ? (
              <span>Apenas {product.stock} unidades em estoque!</span>
            ) : (
              <span>Em estoque: {product.stock} unidades</span>
            )}
          </StockInfo>
          
          <p>Disponibilidade: {product.availability}</p>
          {product.is_emergency && (
            <p style={{ color: '#dc3545', fontWeight: 'bold', marginTop: '0.5rem' }}>
              Produto para emergências
            </p>
          )}
          
          {(error || localError) && (
            <ErrorMessage>
              {localError || (error && error.detail)}
            </ErrorMessage>
          )}
          
          <QuantityContainer>
            <QuantityLabel htmlFor="quantity">Quantidade:</QuantityLabel>
            <QuantityInput
              id="quantity"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                let newQuantity = parseInt(e.target.value);
                // Garantir que a quantidade não é maior que o estoque
                if (isNaN(newQuantity) || newQuantity < 1) {
                  newQuantity = 1;
                } else if (newQuantity > product.stock) {
                  newQuantity = product.stock;
                }
                setQuantity(newQuantity);
              }}
              disabled={isOutOfStock}
            />
          </QuantityContainer>
          
          <Button 
            primary 
            onClick={handleAddToCart}
            disabled={isOutOfStock || quantity > product.stock || cartLoading}
          >
            {cartLoading ? 'Adicionando...' : 
             isOutOfStock ? 'Produto Indisponível' : 
             'Adicionar ao Carrinho'}
          </Button>
        </ProductInfo>
      </ProductContainer>
    </Container>
  );
};

export default ProductDetailPage;