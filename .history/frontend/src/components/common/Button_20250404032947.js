// src/components/common/Button.js
import React from 'react';
import styled from 'styled-components';

// Criamos o styled component base
const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  ${(props) => props.primary && `
    background-color: #0a81ab;
    color: white;
    
    &:hover {
      background-color: #0892d0;
    }
  `}

  ${(props) => props.secondary && `
    background-color: #f8f9fa;
    color: #343a40;
    border: 1px solid #dee2e6;
    
    &:hover {
      background-color: #e9ecef;
    }
  `}

  ${(props) => props.danger && `
    background-color: #dc3545;
    color: white;
    
    &:hover {
      background-color: #c82333;
    }
  `}

  ${(props) => props.emergency && `
    background-color: #ff6b6b;
    color: white;
    
    &:hover {
      background-color: #ff5252;
    }
  `}

  ${(props) => props.fullWidth && `
    width: 100%;
  `}
`;

// Componente Button que filtra as props que vão para o DOM
const Button = ({ primary, secondary, danger, emergency, fullWidth, ...props }) => {
  // Criamos um objeto de props para o styled component
  const buttonProps = {
    ...props
  };

  // Só passamos as props booleanas se elas forem true
  if (primary) buttonProps.primary = true;
  if (secondary) buttonProps.secondary = true;
  if (danger) buttonProps.danger = true;
  if (emergency) buttonProps.emergency = true;
  if (fullWidth) buttonProps.fullWidth = true;

  return <StyledButton {...buttonProps} />;
};

export default Button;