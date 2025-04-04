// frontend/src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
const ProtectedRoute = ({ children }) => {
  // Verificar se o usuário está autenticado
  // Isso depende de como você gerencia a autenticação na sua aplicação
  // Aqui está um exemplo usando localStorage
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // Se não estiver autenticado, redirecionar para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver autenticado, renderizar os filhos (o componente protegido)
  return children;
};

export default ProtectedRoute;