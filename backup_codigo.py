import os
import pyperclip
import time
import json
import subprocess
from pathlib import Path
from pynput import keyboard
from pynput.keyboard import Key, KeyCode
import threading
import sys
import signal

# Variáveis para controlar estados
ctrl_pressionado = False
ultima_tecla = None
ultimo_arquivo = None
running = True
hook_id = None
keyboard_listener = None

# Configuração de segurança
TECLA_ESCAPE = Key.esc  # Tecla para interromper o programa em caso de emergência

def obter_nome_arquivo_backup(caminho_original):
    """Gera o nome do arquivo de backup a partir do arquivo original com timestamp."""
    diretorio = os.path.dirname(caminho_original)
    nome_arquivo = os.path.basename(caminho_original)
    nome_base, extensao = os.path.splitext(nome_arquivo)
    
    # Adicionar timestamp para evitar sobrescrever backups anteriores
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    
    # Verificar se devemos usar modo com histórico (múltiplos backups) ou substituir
    MODO_HISTORICO = False  # Defina como True para manter múltiplos backups
    
    if MODO_HISTORICO:
        # Cria um arquivo de backup com timestamp para manter histórico
        arquivo_backup = os.path.join(diretorio, f"{nome_base}_{timestamp}.txt")
    else:
        # Cria o arquivo de backup com extensão .txt no mesmo diretório (substitui)
        arquivo_backup = os.path.join(diretorio, nome_base + '.txt')
    
    print(f"[DEBUG] Nome do arquivo de backup gerado: {arquivo_backup}")
    return arquivo_backup

def salvar_backup(texto, arquivo_backup):
    """Salva o conteúdo do backup no arquivo especificado com verificação detalhada."""
    print(f"[DEBUG] Tentando salvar backup em: {arquivo_backup}")
    print(f"[DEBUG] Tamanho do conteúdo a ser salvo: {len(texto)} caracteres")
    
    # Verificar se o diretório existe
    diretorio = os.path.dirname(arquivo_backup)
    print(f"[DEBUG] Diretório do backup: {diretorio}")
    
    if not os.path.exists(diretorio):
        print(f"[DEBUG] Diretório não existe, tentando criar: {diretorio}")
        try:
            os.makedirs(diretorio, exist_ok=True)
        except Exception as e:
            print(f"[ERRO] Não foi possível criar o diretório: {e}")
            return False
    
    # Tentar salvar o arquivo
    try:
        with open(arquivo_backup, 'w', encoding='utf-8') as f:
            f.write(texto)
        
        # Verificar se o arquivo foi realmente criado
        if os.path.exists(arquivo_backup):
            tamanho = os.path.getsize(arquivo_backup)
            print(f"[SUCESSO] Backup salvo em: {arquivo_backup} (Tamanho: {tamanho} bytes)")
            return True
        else:
            print(f"[ERRO] O arquivo de backup não foi encontrado após a gravação!")
            return False
    except Exception as e:
        print(f"[ERRO] Falha ao salvar backup: {e}")
        return False

def obter_arquivo_vscode_atual():
    """Tenta obter o arquivo atual aberto no VSCode de maneira segura e com verificações adicionais"""
    try:
        print("[DEBUG] Tentando identificar arquivo atual no VS Code...")
        
        # No Windows
        if os.name == 'nt':
            try:
                import win32gui
                window = win32gui.GetForegroundWindow()
                title = win32gui.GetWindowText(window)
                print(f"[DEBUG] Título da janela em foco: '{title}'")
                
                # VS Code mostra o nome do arquivo no título da janela
                if " - Visual Studio Code" in title:
                    file_part = title.split(" - Visual Studio Code")[0]
                    print(f"[DEBUG] Possível arquivo: '{file_part}'")
                    
                    # Se o título tiver um caminho completo ou nome de arquivo
                    if os.path.exists(file_part):
                        print(f"[DEBUG] Arquivo confirmado: '{file_part}'")
                        return file_part
                    else:
                        print(f"[DEBUG] Caminho não existe: '{file_part}'")
                        
                        # Tentar procurar em diretórios comuns
                        diretorio_atual = os.getcwd()
                        print(f"[DEBUG] Procurando no diretório atual: {diretorio_atual}")
                        caminho_possivel = os.path.join(diretorio_atual, file_part)
                        
                        if os.path.exists(caminho_possivel):
                            print(f"[DEBUG] Arquivo encontrado no diretório atual: {caminho_possivel}")
                            return caminho_possivel
            except Exception as e:
                print(f"[ERRO] Falha ao acessar informações da janela: {e}")
                
            # Método alternativo para VS Code: verificar arquivos recentes
            try:
                # Verificar na pasta do usuário
                arquivo_recente = None
                home_dir = os.path.expanduser("~")
                vscode_dir = os.path.join(home_dir, "AppData", "Roaming", "Code", "User")
                
                if os.path.exists(vscode_dir):
                    print(f"[DEBUG] Verificando diretório do VS Code: {vscode_dir}")
                    # Código adicional para verificar arquivos recentes do VS Code
            except Exception as e:
                print(f"[ERRO] Falha ao verificar arquivos recentes: {e}")
    except Exception as e:
        print(f"[ERRO] Falha geral ao tentar detectar arquivo VSCode: {e}")
    
    print("[DEBUG] Não foi possível identificar o arquivo atual")
    return None

def emergency_stop():
    """Função de parada de emergência"""
    global running, hook_id, keyboard_listener
    
    running = False
    print("\n!!! PARADA DE EMERGÊNCIA ATIVADA !!!")
    print("Encerrando todos os hooks e listeners...")
    
    # Remover o hook do Windows se estiver ativo
    if hook_id and os.name == 'nt':
        try:
            import ctypes
            user32 = ctypes.WinDLL('user32', use_last_error=True)
            user32.UnhookWindowsHookEx(hook_id)
            print("Hook do Windows removido")
        except:
            pass
    
    # Parar o listener do pynput se estiver ativo
    if keyboard_listener:
        try:
            keyboard_listener.stop()
            print("Listener de teclado parado")
        except:
            pass
    
    # Forçar a saída do programa
    os._exit(0)  # Saída forçada para garantir que o programa pare

def signal_handler(sig, frame):
    """Manipulador de sinais para capturar Ctrl+C"""
    print("\nCtrl+C detectado. Encerrando graciosamente...")
    emergency_stop()

# Registrar o handler de sinal para Ctrl+C
signal.signal(signal.SIGINT, signal_handler)

def on_press(tecla):
    global ctrl_pressionado, ultima_tecla, ultimo_arquivo, running
    
    # Verificar se é a tecla de escape (parada de emergência)
    if tecla == TECLA_ESCAPE:
        print("\n[EMERGÊNCIA] Tecla de escape detectada. Ativando parada de emergência...")
        emergency_stop()
        return False  # Parar o listener
    
    # Verificar se Ctrl está pressionado
    if tecla == Key.ctrl_l or tecla == Key.ctrl_r:
        ctrl_pressionado = True
        return
    
    # Se Ctrl está pressionado, verificar outras teclas
    if ctrl_pressionado:
        try:
            # Detectar Ctrl+A
            if hasattr(tecla, 'char') and tecla.char == 'a':
                print("[EVENTO] Ctrl+A detectado!")
                ultima_tecla = 'a'
                
                # Tenta obter o arquivo atual no VS Code com timeout
                def get_file_with_timeout():
                    global ultimo_arquivo
                    ultimo_arquivo = obter_arquivo_vscode_atual()
                    if ultimo_arquivo:
                        print(f"[INFO] Arquivo detectado e armazenado para backup: {ultimo_arquivo}")
                    else:
                        print("[AVISO] Não foi possível determinar o arquivo atual")
                
                # Usar thread com timeout para não travar a execução
                file_thread = threading.Thread(target=get_file_with_timeout)
                file_thread.daemon = True  # Daemon para não bloquear a saída
                file_thread.start()
                file_thread.join(timeout=0.5)  # Timeout de 0.5 segundos
                
            # Detectar Ctrl+V após Ctrl+A
            elif hasattr(tecla, 'char') and tecla.char == 'v' and ultima_tecla == 'a':
                print("[EVENTO] Ctrl+V após Ctrl+A detectado! Iniciando processo de backup...")
                
                # Verificar/garantir que temos um arquivo válido
                if ultimo_arquivo is None:
                    print("[ERRO] Nenhum arquivo identificado para backup!")
                    ultima_tecla = None
                    return
                
                if not os.path.exists(ultimo_arquivo):
                    print(f"[ERRO] Arquivo identificado não existe: {ultimo_arquivo}")
                    ultima_tecla = None
                    return
                
                print(f"[INFO] Preparando backup do arquivo: {ultimo_arquivo}")
                
                # Backup protegido com timeout
                def backup_with_timeout():
                    try:
                        print(f"[DEBUG] Lendo conteúdo de: {ultimo_arquivo}")
                        with open(ultimo_arquivo, 'r', encoding='utf-8') as f:
                            conteudo_atual = f.read()
                        
                        print(f"[DEBUG] Conteúdo lido, tamanho: {len(conteudo_atual)} caracteres")
                        arquivo_backup = obter_nome_arquivo_backup(ultimo_arquivo)
                        
                        if salvar_backup(conteudo_atual, arquivo_backup):
                            print("[SUCESSO] Processo de backup concluído com sucesso!")
                        else:
                            print("[FALHA] Processo de backup não foi concluído corretamente")
                    except Exception as e:
                        print(f"[ERRO] Exceção durante processo de backup: {e}")
                        # Tentar abordagem alternativa
                        try:
                            print("[RECUPERAÇÃO] Tentando método alternativo de backup...")
                            import shutil
                            backup_alternativo = ultimo_arquivo + ".bak"
                            shutil.copy2(ultimo_arquivo, backup_alternativo)
                            print(f"[RECUPERAÇÃO] Backup alternativo criado: {backup_alternativo}")
                        except Exception as e2:
                            print(f"[ERRO CRÍTICO] Falha na recuperação: {e2}")
                
                # Usar thread com timeout para não travar a execução
                backup_thread = threading.Thread(target=backup_with_timeout)
                backup_thread.daemon = True
                backup_thread.start()
                print("[INFO] Thread de backup iniciada")
                backup_thread.join(timeout=2.0)  # Timeout maior (2 segundos)
                
                if backup_thread.is_alive():
                    print("[AVISO] O processo de backup está demorando mais que o esperado!")
                
                ultima_tecla = None  # Resetar após detectar a sequência
        except AttributeError as e:
            print(f"[ERRO] Problema ao processar tecla: {e}")
        except Exception as e:
            print(f"[ERRO INESPERADO] {e}")

def on_release(tecla):
    global ctrl_pressionado
    
    if tecla == Key.ctrl_l or tecla == Key.ctrl_r:
        ctrl_pressionado = False

def iniciar_listener_seguro():
    """Inicia o listener de teclado com proteções de segurança."""
    global keyboard_listener
    
    print("\n--- INSTRUÇÕES DE SEGURANÇA ---")
    print("1. Pressione ESC a qualquer momento para interromper o programa em caso de problemas")
    print("2. Pressione Ctrl+C no terminal para interromper o programa")
    print("--- ------------------------ ---\n")
    
    # Iniciar o listener de teclado em um thread separado
    keyboard_listener = keyboard.Listener(on_press=on_press, on_release=on_release)
    keyboard_listener.daemon = True  # Thread daemon para não bloquear a saída
    keyboard_listener.start()
    
    # Criar um timer que verifica periodicamente se o programa deve continuar
    def safety_check():
        while running:
            time.sleep(5)  # Verificar a cada 5 segundos
            print("Monitoramento ativo... (Pressione ESC para interromper)")
    
    # Iniciar o timer de segurança
    safety_thread = threading.Thread(target=safety_check)
    safety_thread.daemon = True
    safety_thread.start()
    
    # Loop principal com capacidade de interrupção
    try:
        while running:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nInterrupção detectada. Encerrando...")
        emergency_stop()

def criar_arquivo_teste():
    """Cria um arquivo de teste para verificar se o sistema de backup está funcionando"""
    try:
        diretorio_atual = os.getcwd()
        arquivo_teste = os.path.join(diretorio_atual, "teste_backup.py")
        
        print(f"\n[TESTE] Criando arquivo de teste: {arquivo_teste}")
        
        with open(arquivo_teste, 'w', encoding='utf-8') as f:
            f.write("# Este é um arquivo de teste para o sistema de backup\n\n")
            f.write("def funcao_teste():\n")
            f.write("    print('Teste de backup funcionando!')\n\n")
            f.write("# Fim do arquivo de teste\n")
        
        print(f"[TESTE] Arquivo de teste criado com sucesso: {arquivo_teste}")
        print("[TESTE] Você pode abrir este arquivo no VS Code e testar o backup com Ctrl+A seguido de Ctrl+V")
        return arquivo_teste
    except Exception as e:
        print(f"[TESTE] Erro ao criar arquivo de teste: {e}")
        return None

def verificar_permissoes():
    """Verifica se o script tem permissões adequadas para criar e modificar arquivos"""
    try:
        print("[VERIFICAÇÃO] Testando permissões de escrita...")
        
        # Verificar diretório atual
        diretorio_atual = os.getcwd()
        arquivo_teste = os.path.join(diretorio_atual, "permissao_teste.tmp")
        
        # Tentar criar arquivo
        with open(arquivo_teste, 'w') as f:
            f.write("teste de permissão")
        
        # Tentar ler arquivo
        with open(arquivo_teste, 'r') as f:
            conteudo = f.read()
        
        # Limpar
        os.remove(arquivo_teste)
        
        print("[VERIFICAÇÃO] Permissões de escrita OK")
        return True
    except Exception as e:
        print(f"[VERIFICAÇÃO] PROBLEMA DE PERMISSÕES: {e}")
        print("[VERIFICAÇÃO] O script pode não ter permissões para criar arquivos de backup!")
        return False

def main():
    print("\n========== BACKUP AUTOMÁTICO DE CÓDIGO ==========")
    print("Versão: 2.0 (Debug) - Monitoramento SEGURO para VS Code")
    print("==================================================\n")
    
    print("[INFO] Iniciando verificações do sistema...")
    verificar_permissoes()
    
    # Criar arquivo de teste opcional
    resposta_teste = input("\nDeseja criar um arquivo de teste para verificar o funcionamento? (s/n): ").lower() == 's'
    if resposta_teste:
        arquivo_teste = criar_arquivo_teste()
        if arquivo_teste:
            print(f"[DICA] Abra o arquivo {arquivo_teste} no VS Code")
            print("[DICA] Pressione Ctrl+A e depois Ctrl+V para testar o backup")
    
    print("\n[SEGURANÇA] Este script foi modificado para evitar travamentos do teclado")
    print("[SEGURANÇA] Pressione ESC a qualquer momento para interromper o programa")
    print("[SEGURANÇA] Pressione Ctrl+C no terminal para encerrar normalmente")
    
    print("\n[INICIANDO] Monitoramento de Ctrl+A e Ctrl+V ativado...")
    
    # Usar apenas o método seguro baseado em pynput
    iniciar_listener_seguro()

if __name__ == "__main__":
    main()