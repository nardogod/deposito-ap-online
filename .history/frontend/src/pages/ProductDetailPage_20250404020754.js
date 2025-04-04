// src/pages/ProductDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import api from '../services/api';
import { addToCart, clearCartError } from '../features/cart/cartSlice';
import Button from '../components/common/Button';
import ProductReviews from '../components/products/ProductReviews';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const BreadcrumbNav = styled.nav`
  margin-bottom: 1.5rem;
  
  a {
    color: #0a81ab;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  span {
    color: #6c757d;
    margin: 0 0.5rem;
  }
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

const RatingPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  .stars {
    color: #f8b400;
  }
  
  .count {
    color: #6c757d;
    font-size: 0.9rem;
  }
`;

const Price = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: #0a81ab;
  margin-bottom: 1rem;
  
  .original-price {
    text-decoration: line-through;
    color: #6c757d;
    font-size: 1.1rem;
    margin-right: 0.5rem;
  }
  
  .discount-price {
    color: #dc3545;
  }
`;

const Description = styled.div`
  margin-bottom: 1.5rem;
  line-height: 1.6;
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

const ProductAttributes = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

const AttributeTitle = styled.h3`
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const AttributeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const AttributeItem = styled.div`
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  
  .label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: #6c757d;
  }
`;

const ImageGallery = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MainImage = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    object-fit: cover;
  }
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Thumbnail = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.active ? '#0a81ab' : 'transparent'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
  const [activeImage, setActiveImage] = useState(0);

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
  
  // Renderizar estrelas (preenchidas ou vazias)
  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Arredondar para o 0.5 mais próximo
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<span key={i}>★</span>);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<span key={i}>⯨</span>); // Half star (Unicode character)
      } else {
        stars.push(<span key={i}>☆</span>);
      }
    }
    
    return stars;
  };

  if (loading) return <Container><p>Carregando...</p></Container>;
  if (fetchError) return <Container><p>{fetchError}</p></Container>;
  if (!product) return <Container><p>Produto não encontrado</p></Container>;

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock <= 0;
  
  // Determinar a imagem principal
  const mainImage = product.images && product.images.length > 0 
    ? product.images[activeImage].image 
    : null;
  
  // Calcular desconto percentual se houver preço com desconto
  const discountPercentage = product.discount_price 
    ? Math.round((1 - (product.discount_price / product.price)) * 100) 
    : 0;

  return (
    <Container>
      <BreadcrumbNav>
        <a href="/">Início</a>
        <span>/</span>
        <a href="/products">Produtos</a>
        {product.category && (
          <>
            <span>/</span>
            <a href={`/products?category=${product.category}`}>{product.category_name}</a>
          </>
        )}
        <span>/</span>
        {product.name}
      </BreadcrumbNav>
      
      <ProductContainer>
        <ImageGallery>
          <MainImage>
            {mainImage ? (
              <img src={mainImage} alt={product.name} />
            ) : (
              <div style={{ background: '#f0f0f0', height: '300px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Imagem não disponível</p>
              </div>
            )}
          </MainImage>
          
          {product.images && product.images.length > 1 && (
            <ThumbnailsContainer>
              {product.images.map((image, index) => (
                <Thumbnail 
                  key={index} 
                  active={activeImage === index}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image.image} alt={image.alt_text || `${product.name} - Imagem ${index + 1}`} />
                </Thumbnail>
              ))}
            </ThumbnailsContainer>
          )}
        </ImageGallery>
        
        <ProductInfo>
          <Title>{product.name}</Title>
          
          {product.average_rating !== null && (
            <RatingPreview>
              <div className="stars">{renderStars(product.average_rating)}</div>
              <div className="count">({product.reviews_count} avaliações)</div>
            </RatingPreview>
          )}
          
          <Price>
            {product.discount_price ? (
              <>
                <span className="original-price">R$ {formatPrice(product.price)}</span>
                <span className="discount-price">
                  R$ {formatPrice(product.discount_price)}
                  {discountPercentage > 0 && ` (-${discountPercentage}%)`}
                </span>
              </>
            ) : (
              `R$ ${formatPrice(product.price)}`
            )}
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
          
          <p>Disponibilidade: {product.availability === 'in_stock' ? 'Em estoque' : 
                              product.availability === 'out_of_stock' ? 'Fora de estoque' : 
                              'Sob encomenda'}</p>
          
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
          
          <ProductAttributes>
            <AttributeTitle>Especificações</AttributeTitle>
            <AttributeList>
              <AttributeItem>
                <div className="label">SKU</div>
                <div className="value">{product.sku}</div>
              </AttributeItem>
              
              <AttributeItem>
                <div className="label">Categoria</div>
                <div className="value">{product.category_name}</div>
              </AttributeItem>
              
              {product.weight && (
                <AttributeItem>
                  <div className="label">Peso</div>
                  <div className="value">{product.weight} kg</div>
                </AttributeItem>
              )}
              
              {product.dimensions && (
                <AttributeItem>
                  <div className="label">Dimensões</div>
                  <div className="value">{product.dimensions}</div>
                </AttributeItem>
              )}
            </AttributeList>
          </ProductAttributes>
        </ProductInfo>
      </ProductContainer>
      
      {/* Componente de avaliações */}
      <ProductReviews productId={product.id} />
    </Container>
  );
};

export default ProductDetailPage;