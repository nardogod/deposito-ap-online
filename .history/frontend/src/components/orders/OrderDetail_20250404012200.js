// frontend/src/components/orders/OrderDetail.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../services/api';
import Button from '../common/Button';

const OrderDetailContainer = styled.div`
  background-color: #fff;
  border-radius: 8px;