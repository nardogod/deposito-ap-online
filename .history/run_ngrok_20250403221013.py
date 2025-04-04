from pyngrok import ngrok
import os
import subprocess
import time

# Iniciar o túnel ngrok para a porta 8000 (onde o Django estará rodando)
public_url = ngrok.connect(8000)
print(f"\n\n=== URL do ngrok: {public_url} ===\n")
print(f"Defina a variável de ambiente NGROK_URL={public_url}")
print("\nPressione Ctrl+C para encerrar o túnel\n")

# Manter o túnel ativo até que o usuário pressione Ctrl+C
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nEncerrando o túnel ngrok...")
    ngrok.kill()