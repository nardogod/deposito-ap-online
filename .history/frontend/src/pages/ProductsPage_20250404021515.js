// src/pages/ProductsPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import ProductSearch from '../components/products/ProductSearch';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Title = styled.h1`
  margin-bottom: 1.5rem;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
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
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ProductImageContainer = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  overflow: hidden;
  border-radius: 4px;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const ProductName = styled.h3`
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
`;

const ProductPrice = styled.p`
  font-weight: bold;
  color: #0a81ab;
  margin-bottom: 0.5rem;
  
  .original-price {
    text-decoration: line-through;
    color: #6c757d;
    font-size: 0.9rem;
    margin-right: 0.5rem;
    font-weight: normal;
  }
  
  .discount-price {
    color: #dc3545;
  }
`;

const ProductRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  
  .stars {
    color: #f8b400;
    font-size: 0.9rem;
  }
  
  .count {
    color: #6c757d;
    font-size: 0.8rem;
  }
`;

const ProductDescription = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 1rem;
  flex-grow: 1;
`;

const ProductBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  &.emergency {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  &.out-of-stock {
    background-color: #f8f9fa;
    color: #6c757d;
  }
  
  &.back-order {
    background-color: #fff3cd;
    color: #856404;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? '#0a81ab' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid ${props => props.active ? '#0a81ab' : '#ddd'};
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    background-color: ${props => props.disabled ? null : (props.active ? '#086f8e' : '#e9ecef')};
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 3rem;
`;

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryName, setCategoryName] = useState('');
  
  // Buscar produtos quando os parâmetros de busca mudam
  useEffect(() => {
    fetchProducts();
  }, [searchParams]);
  
  // Função para buscar produtos com filtros
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir string de consulta a partir dos parâmetros de URL
      let queryString = '?';
      
      // Adicionar todos os parâmetros existentes
      for (const [key, value] of searchParams.entries()) {
        if (key === 'page') {
          // Tratar paginação separadamente
          continue;
        }
        queryString += `${key}=${encodeURIComponent(value)}&`;
      }
      
      // Adicionar página atual
      queryString += `page=${currentPage}`;
      
      const response = await api.get(`/products/${queryString}`);
      
      // Se a API retornar paginação
      if (response.data.results !== undefined) {
        setProducts(response.data.results);
        setTotalProducts(response.data.count);
        setTotalPages(Math.ceil(response.data.count / response.data.results.length));
      } else {
        // Se a API não tiver paginação
        setProducts(response.data);
        setTotalProducts(response.data.length);
        setTotalPages(1);
      }
      
      // Obter nome da categoria se um ID de categoria foi especificado
      const categoryId = searchParams.get('category');
      if (categoryId) {
        try {
          const categoryResponse = await api.get(`/products/categories/${categoryId}/`);
          setCategoryName(categoryResponse.data.name);
        } catch (err) {
          console.error('Erro ao buscar categoria:', err);
          setCategoryName('');
        }
      } else {
        setCategoryName('');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Ocorreu um erro ao buscar os produtos. Por favor, tente novamente.');
      setLoading(false);
    }
  };
  
  // Alterar página
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    
    // Atualizar URL com nova página
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', newPage);
    window.history.pushState({}, '', `?${newSearchParams.toString()}`);
    
    // Buscar produtos da nova página
    fetchProducts();
    
    // Rolar para o topo da página
    window.scrollTo(0, 0);
  };
  
  // Função para lidar com a pesquisa
  const handleSearch = (searchFilters) => {
    // Resetar para a primeira página ao aplicar novos filtros
    setCurrentPage(1);
    
    // Os parâmetros da URL já serão atualizados pelo componente ProductSearch
    // A busca será acionada pelo useEffect que observa searchParams
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
    if (!rating) return null;
    
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Arredondar para o 0.5 mais próximo
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<span key={i}>★</span>);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<span key={i}>⯨</span>); // Half star
      } else {
        stars.push(<span key={i}>☆</span>);
      }
    }
    
    return (
      <div className="stars">
        {stars}
      </div>
    );
  };
  
  return (
    <Container>
      <Title>{categoryName ? `Produtos - ${categoryName}` : 'Todos os Produtos'}</Title>
      
      <ProductSearch onSearch={handleSearch} />
      
      {error && (
        <div style={{ color: '#dc3545', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <LoadingIndicator>Carregando produtos...</LoadingIndicator>
      ) : products.length > 0 ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <p>Exibindo {products.length} de {totalProducts} produtos</p>
          </div>
          
          <ProductGrid>
            {products.map((product) => {
              // Verificação para garantir que o produto tem um identificador válido
              if (!product.id && !product.slug) {
                console.error('Produto sem ID ou slug:', product);
                return null;
              }
              
              // Usar o slug para a URL
              const productUrl = `/products/${product.slug}`;
              
              // Calcular desconto percentual se houver preço com desconto
              const discountPercentage = product.discount_price 
                ? Math.round((1 - (product.discount_price / product.price)) * 100) 
                : 0;
              
              return (
                <ProductCard key={product.id} to={productUrl}>
                  <ProductImageContainer>
                    {product.images && product.images.length > 0 ? (
                      <ProductImage 
                        src={product.images[0].image} 
                        alt={product.images[0].alt_text || product.name}
                      />
                    ) : (
                      <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                        Imagem não disponível
                      </div>
                    )}
                  </ProductImageContainer>
                  
                  <ProductName>{product.name}</ProductName>
                  
                  {product.average_rating !== null && (
                    <ProductRating>
                      {renderStars(product.average_rating)}
                      <span className="count">({product.reviews_count})</span>
                    </ProductRating>
                  )}
                  
                  <ProductPrice>
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
                  </ProductPrice>
                  
                  <ProductDescription>
                    {product.description && product.description.length > 100
                      ? `${product.description.substring(0, 100)}...`
                      : product.description}
                  </ProductDescription>
                  
                  <div>
                    {product.is_emergency && (
                      <ProductBadge className="emergency">Emergência</ProductBadge>
                    )}
                    
                    {product.availability === 'out_of_stock' && (
                      <ProductBadge className="out-of-stock">Fora de Estoque</ProductBadge>
                    )}
                    
                    {product.availability === 'back_order' && (
                      <ProductBadge className="back-order">Sob Encomenda</ProductBadge>
                    )}
                  </div>
                </ProductCard>
              );
            })}
          </ProductGrid>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationButton 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </PaginationButton>
              
              {/* Limitar o número de botões de página exibidos */}
              {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                
                // Sempre mostrar a primeira página, a última página e 3 páginas em torno da atual
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationButton 
                      key={pageNum}
                      active={currentPage === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                }
                
                // Adicionar elipses para as quebras
                if (pageNum === 2 && currentPage > 3) {
                  return <span key="ellipsis-start">...</span>;
                }
                
                if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                  return <span key="ellipsis-end">...</span>;
                }
                
                return null;
              })}
              
              <PaginationButton 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </PaginationButton>
            </Pagination>
          )}
        </>
      ) : (
        <NoResults>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar seus filtros ou termos de busca.</p>
        </NoResults>
      )}
    </Container>
  );
};

export default ProductsPage;