// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';

// Páginas
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EmergencyPage from './pages/EmergencyPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import PaymentPendingPage from './pages/PaymentPendingPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

// Componentes
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// sobre mercado pago


// Componente PrivateRoute simplificado
const PrivateRoute = ({ children }) => {
  // Por enquanto, sempre permitir acesso, sem verificação
  return children;
};

const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Inicialização
  }, [dispatch]);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Rotas de produtos em inglês */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/category/:category" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        
        {/* Redirecionar antigas rotas em português para as novas em inglês */}
        <Route path="/produtos" element={<Navigate replace to="/products" />} />
        <Route path="/produtos/:id" element={<Navigate replace to="/products/:id" />} />
        
        {/* Rota de emergência */}
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/emergencia" element={<Navigate replace to="/emergency" />} />
        
        {/* Rota do carrinho */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/carrinho" element={<Navigate replace to="/cart" />} />
        
        {/* Rotas de autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastro" element={<Navigate replace to="/register" />} />
        
        {/* Rotas protegidas */}
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/finalizar-compra" element={<Navigate replace to="/checkout" />} />
        
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/perfil" element={<Navigate replace to="/profile" />} />
        
        {/* Rotas de pagamento */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/pagamento/sucesso" element={<Navigate replace to="/payment/success" />} />
        
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/pagamento/falha" element={<Navigate replace to="/payment/failure" />} />
        
        <Route path="/payment/pending" element={<PaymentPendingPage />} />
        <Route path="/pagamento/pendente" element={<Navigate replace to="/payment/pending" />} />
        
        {/* Página de confirmação de pedido */}
        <Route path="/order-confirmation/:id" element={<PrivateRoute><OrderConfirmationPage /></PrivateRoute>} />
        <Route path="/confirmacao-pedido/:id" element={<Navigate replace to="/order-confirmation/:id" />} />

        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/payment/pending" element={<PaymentPendingPage />} />
        
        {/* Página 404 para rotas não encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </Router>
  );
};

const App = () => {
  return (
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
};

export default App;