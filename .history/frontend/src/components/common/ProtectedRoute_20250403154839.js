// frontend/src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
const ProtectedRoute = ({ children }) => {
  // Usar o estado de autenticação do Redux
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  
  // Se estiver carregando, pode mostrar um indicador de carregamento
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }
  
  // Se não estiver autenticado, redirecionar para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver autenticado, renderizar os filhos (o componente protegido)
  return children;
};

export default ProtectedRoute;