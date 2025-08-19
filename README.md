# Depósito AP Online - Plataforma de E-commerce (Portfólio)


![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ⚠️ Disclaimer: Projeto Descontinuado - Peça de Portfólio

Este projeto foi desenvolvido como um estudo aprofundado e uma **demonstração de habilidades em desenvolvimento full-stack via LLMS**. Ele **não se encontra mais em desenvolvimento ativo** e não deve ser considerado um produto final ou em produção.

O objetivo principal é apresentar as tecnologias com as quais tive contato e as competências que adquiri durante seu ciclo de desenvolvimento. Isso inclui a criação de uma API RESTful robusta com Django, gerenciamento de estado complexo no frontend com React e Redux, integração com serviços de pagamento de terceiros e a estruturação de uma aplicação web completa e modular.

---

## 📖 Sobre o Projeto

O "Depósito AP Online" é um protótipo funcional de uma plataforma de e-commerce projetada para pequenas lojas de conveniência em condomínios. O sistema permite que os moradores comprem produtos essenciais com entrega rápida, incluindo um modo de "emergência" para itens de necessidade imediata.

## ✨ Funcionalidades Implementadas

-   **Autenticação de Usuários:** Sistema completo com registro, login (usando JWT), e gerenciamento de perfil de usuário.

## 🛠️ Stack de Tecnologias

#### Backend
*   **Linguagem:** Python 3
*   **Framework:** Django
*   **API:** Django REST Framework (DRF)
*   **Autenticação:** Simple JWT (JSON Web Tokens)
*   **Banco de Dados:** SQLite (Desenvolvimento), preparado para PostgreSQL (Produção)
*   **Servidor WSGI:** Gunicorn (para deploy)
*   **CORS:** `django-cors-headers`
*   **Filtros de API:** `django-filters`
*   **Variáveis de Ambiente:** `python-dotenv`, `django-environ`

#### Frontend
*   **Linguagem:** JavaScript (ES6+)
*   **Framework/Biblioteca:** React
*   **Gerenciamento de Estado:** Redux Toolkit
*   **Roteamento:** React Router DOM
*   **Requisições HTTP:** Axios
*   **Estilização:** Styled-Components e CSS puro
*   **Build Tool:** Create React App (Webpack, Babel)

#### Ferramentas e DevOps
*   **Controle de Versão:** Git & GitHub
*   **Teste de Webhooks:** Ngrok
*   **Gerenciador de Pacotes:** Pip (Python), NPM (Node.js)

## 🏛️ Arquitetura

-   **Monorepo com separação de responsabilidades:** Código do backend e frontend no mesmo repositório, mas em pastas distintas (`backend/`, `frontend/`), permitindo desenvolvimento e deploy independentes.
-   **API RESTful:** Backend expõe uma API clara e bem definida para ser consumida por qualquer cliente, seguindo os princípios REST.
-   **Single Page Application (SPA):** Frontend construído como uma SPA para uma experiência de usuário fluida e dinâmica, sem recarregamentos de página.

## 🚀 Como Executar o Projeto Localmente

#### Pré-requisitos
-   Python 3.8+
-   Node.js 14+ e NPM
-   Git

#### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/deposito-ap-online.git
cd deposito-ap-online
```

#### 2. Configuração do Backend (em um terminal)
```bash
# Crie e ative um ambiente virtual
python -m venv venv
# No Windows:
.\\venv\\Scripts\\activate
# No Linux/macOS:
# source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Crie um arquivo .env na raiz do projeto e adicione suas chaves
# Ex: MERCADOPAGO_ACCESS_TOKEN=SUA_CHAVE

# Aplique as migrações do banco de dados
python manage.py migrate

# (Opcional) Crie um superusuário para acessar o /admin
python manage.py createsuperuser

# Inicie o servidor
python manage.py runserver
```
O backend estará rodando em `http://localhost:8000`.

#### 3. Configuração do Frontend (em outro terminal)
```bash
# Navegue para a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```
O frontend estará acessível em `http://localhost:3000`.

## 🏁 Status Final e Próximos Passos (se o projeto continuasse)

O projeto foi interrompido em uma fase avançada, com as principais funcionalidades de um e-commerce implementadas e funcionais em ambiente de desenvolvimento. Os próximos passos naturais seriam:

1.  **Deploy:** Publicar o backend (Django) no **Render** e o frontend (React) na **Netlify/Vercel**.
2.  **Testes:** Implementar testes unitários (com PyTest/Jest) e de integração para garantir a estabilidade e a qualidade do código.
3.  **Refatoração:** Unificar componentes de UI (como os múltiplos `Button`) para maior consistência e manutenibilidade.
4.  **UX/UI:** Finalizar o fluxo de confirmação de pagamento no frontend após o retorno do Mercado Pago e refinar a experiência do usuário.
5.  **Cache:** Implementar um sistema de cache mais robusto (como Redis) para otimizar a performance da API em produção.

