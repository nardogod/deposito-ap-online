// frontend/src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import Button from '../components/common/Button';
import OrderDetail from '../components/orders/OrderDetail';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageTitle = styled.h1`
  margin-bottom: 2rem;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  align-self: start;
`;

const OrdersCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ProfileName = styled.h2`
  margin-bottom: 1rem;
`;

const ProfileInfo = styled.div`
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  
  span {
    font-weight: bold;
  }
`;

const OrdersTitle = styled.h2`
  margin-bottom: 1rem;
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const EmptyOrdersMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
`;

const OrdersFilter = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
  }
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? '#0a81ab' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid ${props => props.active ? '#0a81ab' : '#ddd'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.active ? '#086f8e' : '#e9ecef'};
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

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Definir statusFilters
  const statusFilters = {
    all: 'Todos',
    active: 'Em Andamento',
    completed: 'Concluídos',
    cancelled: 'Cancelados'
  };
  
  // Mapear filter para status reais para a API
  const getStatusesForFilter = (filter) => {
    switch(filter) {
      case 'active':
        return ['CREATED', 'PAID', 'PROCESSING', 'SHIPPED'];
      case 'completed':
        return ['DELIVERED'];
      case 'cancelled':
        return ['CANCELLED'];
      default:
        return [];
    }
  };
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      let queryParams = `?page=${page}`;
      
      // Adicionar filtro de status se não for 'all'
      const statusFilters = getStatusesForFilter(filter);
      if (statusFilters.length > 0) {
        statusFilters.forEach(status => {
          queryParams += `&status=${status}`;
        });
      }
      
      const response = await api.get(`/orders/history/${queryParams}`);
      
      // Se a API retornar paginação
      if (response.data.results) {
        setOrders(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assumindo 10 itens por página
      } else {
        // Caso a API não tenha paginação
        setOrders(response.data);
        setTotalPages(1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setError('Não foi possível carregar seus pedidos. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [isAuthenticated, navigate, filter, page]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <Container>
      <PageTitle>Minha Conta</PageTitle>
      
      <ProfileGrid>
        <ProfileCard>
          <ProfileName>{user.first_name} {user.last_name}</ProfileName>
          <ProfileInfo>
            <InfoItem><span>Usuário:</span> {user.username}</InfoItem>
            <InfoItem><span>Email:</span> {user.email}</InfoItem>
            <InfoItem><span>Telefone:</span> {user.phone || 'Não informado'}</InfoItem>
            <InfoItem><span>Endereço:</span> {user.address || 'Não informado'}</InfoItem>
            <InfoItem><span>Apartamento:</span> {user.apartment || 'Não informado'}</InfoItem>
            <InfoItem><span>Edifício:</span> {user.building || 'Não informado'}</InfoItem>
          </ProfileInfo>
          <Button secondary fullWidth as={Link} to="/profile/edit">
            Editar Perfil
          </Button>
        </ProfileCard>
        
        <OrdersCard>
          <OrdersTitle>Meus Pedidos</OrdersTitle>
          
          <OrdersFilter>
            {Object.entries(statusFilters).map(([key, label]) => (
              <FilterButton 
                key={key}
                active={filter === key}
                onClick={() => {
                  setFilter(key);
                  setPage(1); // Resetar para a primeira página ao mudar o filtro
                }}
              >
                {label}
              </FilterButton>
            ))}
          </OrdersFilter>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {loading ? (
            <LoadingIndicator>Carregando pedidos...</LoadingIndicator>
          ) : orders.length > 0 ? (
            <>
              <OrdersList>
                {orders.map(order => (
                  <OrderDetail 
                    key={order.id} 
                    order={order} 
                    onRefresh={fetchOrders}
                  />
                ))}
              </OrdersList>
              
              {totalPages > 1 && (
                <Pagination>
                  <PaginationButton 
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </PaginationButton>
                  
                  {[...Array(totalPages).keys()].map(num => (
                    <PaginationButton 
                      key={num + 1}
                      active={page === num + 1}
                      onClick={() => setPage(num + 1)}
                    >
                      {num + 1}
                    </PaginationButton>
                  ))}
                  
                  <PaginationButton 
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Próxima
                  </PaginationButton>
                </Pagination>
              )}
            </>
          ) : (
            <EmptyOrdersMessage>
              <p>Você ainda não realizou nenhum pedido.</p>
              <Button primary as={Link} to="/products" style={{ marginTop: '1rem' }}>
                Ver Produtos
              </Button>
            </EmptyOrdersMessage>
          )}
        </OrdersCard>
      </ProfileGrid>
    </Container>
  );
};

export default ProfilePage;