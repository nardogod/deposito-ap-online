import os

def generate_tree(directory, output_file='tree_structure.txt', ignore_dirs=None, ignore_files=None):
    """
    Percorre todas as pastas do projeto e gera uma representação de árvore
    da estrutura de diretórios, salvando-a em um arquivo de texto.
    
    Args:
        directory (str): Diretório raiz para iniciar a varredura
        output_file (str): Nome do arquivo onde a estrutura será salva
        ignore_dirs (list): Lista de diretórios para ignorar
        ignore_files (list): Lista de arquivos para ignorar
    """
    if ignore_dirs is None:
        ignore_dirs = ['.git', '__pycache__', 'venv', 'env', '.venv', 'node_modules', '.history', 'READ_CHAT']
    
    if ignore_files is None:
        ignore_files = ['.gitignore', '.DS_Store']
    
    print(f"Gerando estrutura de diretórios para: {os.path.abspath(directory)}")
    print(f"O resultado será salvo em: {os.path.abspath(output_file)}")
    
    def walk_directory(dir_path, prefix='', is_last_item=True, result_lines=None):
        if result_lines is None:
            result_lines = []
        
        # Obtém a lista de todos os itens no diretório atual
        items = sorted([item for item in os.listdir(dir_path) 
                        if os.path.isdir(os.path.join(dir_path, item)) or not item.startswith('.')])
        
        # Filtra itens a serem ignorados
        items = [item for item in items 
                if (not os.path.isdir(os.path.join(dir_path, item)) or item not in ignore_dirs) and 
                   (not os.path.isfile(os.path.join(dir_path, item)) or item not in ignore_files)]
        
        # Se não tiver itens, retorna as linhas atuais
        if not items:
            return result_lines
        
        # Para cada item no diretório atual
        for i, item in enumerate(items):
            # Verifica se é o último item
            is_last = i == len(items) - 1
            item_path = os.path.join(dir_path, item)
            
            # Define os caracteres para a estrutura da árvore
            if is_last:
                line_prefix = prefix + "└── "
                next_prefix = prefix + "    "
            else:
                line_prefix = prefix + "├── "
                next_prefix = prefix + "│   "
            
            # Adiciona o item atual à lista de linhas
            result_lines.append(f"{line_prefix}{item}")
            
            # Se for um diretório, processa recursivamente
            if os.path.isdir(item_path):
                walk_directory(item_path, next_prefix, is_last, result_lines)
        
        return result_lines

    # Gera a estrutura do diretório
    tree_lines = walk_directory(directory)
    
    # Salva a estrutura em um arquivo
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(tree_lines))
    
    print(f"Estrutura gerada com sucesso e salva em {output_file}")
    print("Você pode abrir este arquivo e copiar seu conteúdo para o chat.")
    
    # Exibe uma prévia da estrutura no console
    print("\nPrévia da estrutura gerada:")
    print("-" * 50)
    for line in tree_lines[:min(15, len(tree_lines))]:
        print(line)
    if len(tree_lines) > 15:
        print("... (mais itens no arquivo)")
    print("-" * 50)

if __name__ == "__main__":
    # Diretório atual como padrão
    current_dir = os.getcwd()
    
    print("Gerador de Estrutura de Diretórios")
    print("-" * 50)
    
    # Permite que o usuário especifique um diretório diferente
    user_dir = input(f"Digite o caminho do diretório (ou pressione Enter para usar o diretório atual: {current_dir}): ")
    directory = user_dir if user_dir.strip() else current_dir
    
    # Permite que o usuário especifique o arquivo de saída
    output_file = input("Digite o nome do arquivo de saída (ou pressione Enter para usar 'tree_structure.txt'): ")
    output_file = output_file if output_file.strip() else 'tree_structure.txt'
    
    # Gera a estrutura
    generate_tree(directory, output_file)