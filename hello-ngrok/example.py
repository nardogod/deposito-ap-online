# Adaptar o example.py para apontar para seu servidor Django
import ngrok
from django.core.management import call_command

# Iniciar o servidor Django
server_thread = threading.Thread(target=call_command, args=('runserver', '8000'))
server_thread.daemon = True
server_thread.start()

# Conectar o ngrok
public_url = ngrok.connect(8000)
print(f"Ngrok URL: {public_url}")