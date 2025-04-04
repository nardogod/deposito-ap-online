// src/components/products/ProductSearch.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../services/api';

const SearchContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #0a81ab;
    box-shadow: 0 0 0 2px rgba(10, 129, 171, 0.2);
  }
`;

const FilterToggle = styled.button`
  background: none;
  border: none;
  color: #0a81ab;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  .icon {
    margin-left: 0.5rem;
    transition: transform 0.3s;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const FiltersContainer = styled.div`
  display: ${props => props.isOpen ? 'grid' : 'none'};
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const RangeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const RangeInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #0a81ab;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #0a81ab;
  color: white;
  
  &:hover {
    background-color: #086f8e;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #f8f9fa;
  color: #343a40;
  border: 1px solid #dee2e6;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const ProductSearch = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'newest',
    is_emergency: searchParams.get('is_emergency') === 'true' || false
  });

  // Buscar categorias quando o componente montar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/products/categories/');
        setCategories(response.data);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };

    fetchCategories();
  }, []);

  // Atualizar filtros quando os parâmetros de URL mudam
  useEffect(() => {
    // Se houver qualquer filtro ativo além da pesquisa, mostrar a seção de filtros
    if (
      searchParams.get('category') || 
      searchParams.get('min_price') || 
      searchParams.get('max_price') || 
      searchParams.get('availability') || 
      searchParams.get('sort') !== 'newest' ||
      searchParams.get('is_emergency') === 'true'
    ) {
      setShowFilters(true);
    }
    
    // Atualizar o estado dos filtros com base nos parâmetros da URL
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      availability: searchParams.get('availability') || '',
      sort: searchParams.get('sort') || 'newest',
      is_emergency: searchParams.get('is_emergency') === 'true' || false
    });
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Criar novo objeto de parâmetros para a URL
    const newParams = new URLSearchParams();
    
    // Adicionar somente os parâmetros que têm valor
    if (filters.search) newParams.set('search', filters.search);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.min_price) newParams.set('min_price', filters.min_price);
    if (filters.max_price) newParams.set('max_price', filters.max_price);
    if (filters.availability) newParams.set('availability', filters.availability);
    if (filters.sort !== 'newest') newParams.set('sort', filters.sort);
    if (filters.is_emergency) newParams.set('is_emergency', 'true');
    
    // Sempre começar na primeira página ao aplicar novos filtros
    newParams.set('page', '1');
    
    // Atualizar a URL com os novos parâmetros
    setSearchParams(newParams);
    
    // Chamar a função de callback para notificar o componente pai
    if (onSearch) {
      onSearch(filters);
    }
  };

  const handleReset = () => {
    // Resetar todos os filtros para os valores padrão
    setFilters({
      search: '',
      category: '',
      min_price: '',
      max_price: '',
      availability: '',
      sort: 'newest',
      is_emergency: false
    });
    
    // Limpar parâmetros da URL e voltar para a primeira página
    setSearchParams({ page: '1' });
    
    // Notificar o componente pai
    if (onSearch) {
      onSearch({});
    }
  };

  return (
    <SearchContainer>
      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          type="text"
          name="search"
          value={filters.search}
          onChange={handleInputChange}
          placeholder="Buscar produtos..."
        />

        <FilterToggle 
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          isOpen={showFilters}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          <span className="icon">▼</span>
        </FilterToggle>

        <FiltersContainer isOpen={showFilters}>
          <FilterGroup>
            <FilterLabel>Categoria</FilterLabel>
            <FilterSelect 
              name="category"
              value={filters.category}
              onChange={handleInputChange}
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Faixa de preço</FilterLabel>
            <RangeContainer>
              <RangeInput
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleInputChange}
                placeholder="Min"
                min="0"
                step="0.01"
              />
              <span>até</span>
              <RangeInput
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleInputChange}
                placeholder="Max"
                min="0"
                step="0.01"
              />
            </RangeContainer>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Disponibilidade</FilterLabel>
            <FilterSelect
              name="availability"
              value={filters.availability}
              onChange={handleInputChange}
            >
              <option value="">Qualquer</option>
              <option value="in_stock">Em estoque</option>
              <option value="out_of_stock">Fora de estoque</option>
              <option value="back_order">Sob encomenda</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Ordenar por</FilterLabel>
            <FilterSelect
              name="sort"
              value={filters.sort}
              onChange={handleInputChange}
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="rating">Melhor avaliados</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Características</FilterLabel>
            <CheckboxGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="is_emergency"
                  checked={filters.is_emergency}
                  onChange={handleInputChange}
                />
                Produtos para emergência
              </CheckboxLabel>
            </CheckboxGroup>
          </FilterGroup>
        </FiltersContainer>

        {showFilters && (
          <ButtonContainer>
            <SecondaryButton type="button" onClick={handleReset}>
              Limpar Filtros
            </SecondaryButton>
            <PrimaryButton type="submit">
              Aplicar Filtros
            </PrimaryButton>
          </ButtonContainer>
        )}
      </SearchForm>
    </SearchContainer>
  );
};

export default ProductSearch;