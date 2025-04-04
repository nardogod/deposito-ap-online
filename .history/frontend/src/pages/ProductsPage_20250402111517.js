import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { fetchProducts, fetchProductsByCategory } from '../features/products/productsSlice';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin-bottom: 1.5rem;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const ProductCard = styled(Link)`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ProductName = styled.h3`
  margin-bottom: 0.5rem;
`;

const ProductPrice = styled.p`
  font-weight: bold;
  color: #0a81ab;
  margin-bottom: 0.5rem;
`;

const ProductsPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const { products, categories, isLoading } = useSelector((state) => state.products);

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchProductsByCategory(categoryId));
    } else {
      dispatch(fetchProducts());
    }
  }, [dispatch, categoryId]);

  const category = categoryId
    ? categories.find((category) => category.id === parseInt(categoryId))
    : null;

  return (
    <Container>
      <Title>{category ? `Produtos - ${category.name}` : 'Todos os Produtos'}</Title>
      
      {isLoading ? (
        <p>Carregando produtos...</p>
      ) : (
        <ProductGrid>
          {products.map((product) => {
            // Verificação para garantir que o produto tem um slug válido
            if (!product.id && !product.slug) {
              console.error('Produto sem ID ou slug:', product);
              return null;
            }
            
            // Usar o ID se o slug não estiver disponível
            const productIdentifier = product.slug || product.id;
            
            // Verificação adicional para log
            console.log(`Renderizando produto: ID=${product.id}, Slug=${product.slug}, Nome=${product.name}`);
            
            return (
              <ProductCard key={product.id} to={`/products/${productIdentifier}`}>
                <ProductName>{product.name}</ProductName>
                <ProductPrice>
                  R$ {product.price 
                    ? (typeof product.price === 'number' 
                        ? product.price.toFixed(2) 
                        : parseFloat(product.price).toFixed(2))
                    : '0.00'}
                </ProductPrice>
                <p>{product.description && product.description.substring(0, 100)}...</p>
              </ProductCard>
            );
          })}
        </ProductGrid>
      )}
      
      {!isLoading && products.length === 0 && (
        <p>Nenhum produto encontrado.</p>
      )}
    </Container>
  );
};

export default ProductsPage;