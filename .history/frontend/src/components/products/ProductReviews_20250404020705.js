// frontend/src/components/products/ProductReviews.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import api from '../../services/api';
import Button from '../common/Button';

const ReviewsContainer = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
`;

const ReviewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ReviewsTitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
`;

const RatingSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AverageRating = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
`;

const ReviewCount = styled.div`
  color: #6c757d;
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ReviewCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ReviewTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
`;

const ReviewRating = styled.div`
  display: flex;
  gap: 4px;
  color: #f8b400;
`;

const ReviewMeta = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const ReviewContent = styled.div`
  line-height: 1.5;
`;

const ReviewForm = styled.form`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const FormTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
`;

const RatingSelector = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.selected ? '#f8b400' : '#ddd'};
  transition: color 0.2s;
  
  &:hover {
    color: #f8b400;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const EmptyReviews = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
`;

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  useEffect(() => {
    fetchReviews();
  }, [productId]);
  
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/products/reviews/product_reviews/?product_id=${productId}`);
      setReviews(response.data);
      
      // Verificar se o usuário já avaliou este produto
      if (isAuthenticated) {
        try {
          const userReviews = await api.get('/products/reviews/my_reviews/');
          const hasReviewed = userReviews.data.some(review => review.product === parseInt(productId));
          setUserHasReviewed(hasReviewed);
        } catch (err) {
          console.error('Erro ao verificar revisões do usuário:', err);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err);
      setError('Não foi possível carregar as avaliações. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleRatingSelect = (rating) => {
    setFormData({
      ...formData,
      rating,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.title.trim()) {
      setFormError('O título da avaliação é obrigatório.');
      return;
    }
    
    if (!formData.comment.trim()) {
      setFormError('O comentário é obrigatório.');
      return;
    }
    
    setSubmitting(true);
    setFormError(null);
    
    try {
      await api.post('/products/reviews/', {
        product: productId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
      });
      
      // Limpar formulário e ocultar
      setFormData({
        rating: 5,
        title: '',
        comment: '',
      });
      setShowForm(false);
      
      // Atualizar a lista de avaliações
      fetchReviews();
      
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      setFormError(
        err.response?.data?.detail || 
        'Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calcular média das avaliações
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  // Renderizar estrelas (preenchidas ou vazias)
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#f8b400' : '#ddd' }}>
          ★
        </span>
      );
    }
    return stars;
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  return (
    <ReviewsContainer>
      <ReviewsHeader>
        <ReviewsTitle>Avaliações do Cliente</ReviewsTitle>
        <RatingSummary>
          <AverageRating>{calculateAverageRating()}</AverageRating>
          <div>{renderStars(calculateAverageRating())}</div>
          <ReviewCount>({reviews.length} avaliações)</ReviewCount>
        </RatingSummary>
      </ReviewsHeader>
      
      {loading ? (
        <LoadingIndicator>Carregando avaliações...</LoadingIndicator>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          {reviews.length > 0 ? (
            <ReviewsList>
              {reviews.map((review) => (
                <ReviewCard key={review.id}>
                  <ReviewHeader>
                    <ReviewTitle>{review.title}</ReviewTitle>
                    <ReviewRating>{renderStars(review.rating)}</ReviewRating>
                  </ReviewHeader>
                  <ReviewMeta>
                    Por {review.username} em {formatDate(review.created_at)}
                  </ReviewMeta>
                  <ReviewContent>{review.comment}</ReviewContent>
                </ReviewCard>
              ))}
            </ReviewsList>
          ) : (
            <EmptyReviews>
              <p>Este produto ainda não possui avaliações.</p>
              {isAuthenticated && !userHasReviewed && !showForm && (
                <p>Seja o primeiro a avaliar este produto!</p>
              )}
            </EmptyReviews>
          )}
          
          {isAuthenticated ? (
            userHasReviewed ? (
              <p>Você já avaliou este produto. Obrigado pelo feedback!</p>
            ) : (
              showForm ? (
                <ReviewForm onSubmit={handleSubmit}>
                  <FormTitle>Escreva sua avaliação</FormTitle>
                  
                  <FormGroup>
                    <Label htmlFor="rating">Sua avaliação *</Label>
                    <RatingSelector>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarButton
                          key={star}
                          type="button"
                          selected={formData.rating >= star}
                          onClick={() => handleRatingSelect(star)}
                        >
                          ★
                        </StarButton>
                      ))}
                    </RatingSelector>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="title">Título da avaliação *</Label>
                    <Input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="comment">Sua opinião *</Label>
                    <Textarea
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  {formError && <ErrorMessage>{formError}</ErrorMessage>}
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button secondary onClick={() => setShowForm(false)} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button primary type="submit" disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                    </Button>
                  </div>
                </ReviewForm>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <Button primary onClick={() => setShowForm(true)}>
                    Avaliar este Produto
                  </Button>
                </div>
              )
            )
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p>Faça login para avaliar este produto.</p>
              <Button primary to="/login" style={{ marginTop: '0.5rem' }}>
                Fazer Login
              </Button>
            </div>
          )}
        </>
      )}
    </ReviewsContainer>
  );
};

export default ProductReviews;