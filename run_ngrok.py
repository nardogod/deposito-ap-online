#!/usr/bin/env python
"""
Script para iniciar o ngrok e configurar a URL do webhook para o Mercado Pago
Modo de uso:
    python run_ngrok.py
"""

import os
import json
import time
import signal
import subprocess
import requests
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Porta do servidor Django
DJANGO_PORT = 8000

def start_ngrok(port):
    """Inicia o túnel ngrok e retorna a URL pública"""
    ngrok_process = subprocess.Popen(['ngrok', 'http', str(port)], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE)
    
    # Esperamos um pouco para o ngrok iniciar
    time.sleep(3)
    
    try:
        # Obtém a URL pública do ngrok a partir da API local
        response = requests.get('http://localhost:4040/api/tunnels')
        data = response.json()
        
        if not data['tunnels']:
            print("Erro: Nenhum túnel encontrado.")
            ngrok_process.kill()
            return None, None
        
        # Procurar pelo túnel HTTPS
        https_url = None
        for tunnel in data['tunnels']:
            if tunnel['proto'] == 'https':
                https_url = tunnel['public_url']
                break
        
        if not https_url:
            print("Erro: Túnel HTTPS não encontrado.")
            ngrok_process.kill()
            return None, None
        
        print(f"Túnel HTTPS criado: {https_url}")
        return https_url, ngrok_process
        
    except Exception as e:
        print(f"Erro ao obter URL do ngrok: {str(e)}")
        ngrok_process.kill()
        return None, None

def update_env_file(env_path, ngrok_url):
    """Atualiza o arquivo .env com a URL do ngrok"""
    try:
        # Criar o arquivo .env se não existir
        if not os.path.exists(env_path):
            with open(env_path, 'w') as f:
                f.write(f"NGROK_URL={ngrok_url}\n")
            print(f"Arquivo .env criado com NGROK_URL={ngrok_url}")
            return True
        
        # Ler o arquivo existente
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        # Verificar se NGROK_URL já existe e atualizá-lo
        ngrok_found = False
        for i, line in enumerate(lines):
            if line.startswith('NGROK_URL='):
                lines[i] = f"NGROK_URL={ngrok_url}\n"
                ngrok_found = True
                break
        
        # Adicionar NGROK_URL se não existir
        if not ngrok_found:
            lines.append(f"NGROK_URL={ngrok_url}\n")
        
        # Gravar o arquivo atualizado
        with open(env_path, 'w') as f:
            f.writelines(lines)
            
        print(f"Arquivo .env atualizado com NGROK_URL={ngrok_url}")
        return True
        
    except Exception as e:
        print(f"Erro ao atualizar arquivo .env: {str(e)}")
        return False

def configure_mercadopago_webhook(ngrok_url):
    """Configura o webhook do Mercado Pago com a URL do ngrok"""
    try:
        # Obter o token de acesso do Mercado Pago
        mercadopago_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        if not mercadopago_token:
            print("Erro: MERCADOPAGO_ACCESS_TOKEN não encontrado no arquivo .env")
            return False
        
        # URL completa do webhook
        webhook_url = f"{ngrok_url}/api/payments/webhook/"
        
        # Configurar o webhook no Mercado Pago
        url = "https://api.mercadopago.com/v1/webhooks"
        headers = {
            "Authorization": f"Bearer {mercadopago_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "url": webhook_url,
            "description": "Webhook para notificações de pagamento",
            "topic": "payment"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code in (200, 201):
            print(f"Webhook configurado com sucesso! URL: {webhook_url}")
            webhook_id = response.json().get('id')
            print(f"ID do webhook: {webhook_id}")
            return True
        else:
            print(f"Erro ao configurar webhook: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"Erro ao configurar webhook do Mercado Pago: {str(e)}")
        return False

def handle_exit(ngrok_process):
    """Função para lidar com a saída do script e matar o processo do ngrok"""
    if ngrok_process:
        print("Encerrando o túnel ngrok...")
        ngrok_process.kill()
    print("Script finalizado.")

def main():
    """Função principal"""
    print("Iniciando o túnel ngrok...")
    ngrok_url, ngrok_process = start_ngrok(DJANGO_PORT)
    
    if not ngrok_url:
        print("Falha ao iniciar o ngrok. Verifique se o ngrok está instalado e disponível no PATH.")
        return
    
    # Configurar o tratamento de sinais para garantir limpeza ao sair
    def signal_handler(sig, frame):
        print("Sinal de interrupção recebido.")
        handle_exit(ngrok_process)
        exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Atualizar o arquivo .env
    if not update_env_file(env_path, ngrok_url):
        handle_exit(ngrok_process)
        return
    
    # Configurar o webhook do Mercado Pago
    if not configure_mercadopago_webhook(ngrok_url):
        print("Aviso: Não foi possível configurar automaticamente o webhook do Mercado Pago.")
        print(f"Você pode configurá-lo manualmente na interface do Mercado Pago, usando a URL: {ngrok_url}/api/payments/webhook/")
    
    print("Túnel ngrok está rodando. Pressione Ctrl+C para encerrar.")
    
    try:
        # Manter o script rodando até Ctrl+C
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        handle_exit(ngrok_process)

if __name__ == "__main__":
    main()