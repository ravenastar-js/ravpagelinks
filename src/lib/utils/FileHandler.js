const fs = require('fs');
const path = require('path');

/**
 * 📁 Manipulador de arquivos para URLs e filtros
 * @class
 */
class FileHandler {
    /**
     * 💾 Salva URLs em arquivo
     * @param {string[]} urls - 📋 Array de URLs para salvar
     * @param {string} filePath - 📁 Caminho do arquivo de saída
     * @static
     */
    static saveURLsToFile(urls, filePath) {
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const content = urls.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
    }

    /**
     * 📂 Carrega filtros de arquivo
     * @param {string} filePath - 📁 Caminho do arquivo de filtros
     * @returns {string[]} 📋 Array de filtros carregados
     * @static
     */
    static loadFiltersFromFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                const defaultPath = path.join(__dirname, '../../filters', filePath);
                if (fs.existsSync(defaultPath)) {
                    filePath = defaultPath;
                } else {
                    return [];
                }
            }

            const content = fs.readFileSync(filePath, 'utf8');
            return content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
        } catch (error) {
            console.warn(`Erro ao carregar arquivo de filtros: ${error.message}`);
            return [];
        }
    }

    /**
     * 📄 Cria arquivo de filtro vazio
     * @param {string} filePath - 📁 Caminho do arquivo
     * @static
     */
    static createEmptyFilterFile(filePath) {
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const defaultContent = `# 🎯 Arquivo de Filtros do RavPageLinks
# Adicione um filtro por linha
# Exemplos:
# google.com          - Filtra por domínio
# /admin              - Filtra por caminho
# ^https://.*\\.com$   - Filtro regex
# api                 - Filtro por substring

# Seus filtros abaixo:
`;

        fs.writeFileSync(filePath, defaultContent, 'utf8');
    }

    /**
     * 📋 Lista arquivos de filtros disponíveis
     * @returns {string[]} 📋 Array de nomes de arquivos de filtro
     * @static
     */
    static listFilterFiles() {
        const filtersDir = path.join(__dirname, '../../filters');
        const currentDir = process.cwd();

        const files = [];

        if (fs.existsSync(currentDir)) {
            const currentFiles = fs.readdirSync(currentDir)
                .filter(file => file.endsWith('.txt'))
                .map(file => path.basename(file, '.txt'));
            files.push(...currentFiles);
        }

        if (fs.existsSync(filtersDir)) {
            const defaultFiles = fs.readdirSync(filtersDir)
                .filter(file => file.endsWith('.txt'))
                .map(file => path.basename(file, '.txt'));
            files.push(...defaultFiles);
        }

        return [...new Set(files)];
    }

    /**
     * 📂 Cria estrutura de diretórios para múltiplas páginas
     * @param {string} domain - 🌐 Domínio do site
     * @param {string} outputDir - 📁 Diretório base de saída
     * @returns {string} 📁 Caminho do diretório do domínio
     * @static
     */
    static createDomainDirectory(domain, outputDir = 'results') {
        const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
        const domainDir = path.join(outputDir, safeDomain);

        if (!fs.existsSync(domainDir)) {
            fs.mkdirSync(domainDir, { recursive: true });
        }

        return domainDir;
    }

    /**
     * 📄 Gera nome de arquivo seguro para página
     * @param {string} url - 🌐 URL da página
     * @returns {string} 📁 Nome de arquivo seguro
     * @static
     */
    static generatePageFilename(url) {
        try {
            const urlObj = new URL(url);
            const pageName = urlObj.pathname.split('/').filter(Boolean).join('_') || 'index';
            return `links_${pageName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50)}.txt`;
        } catch (error) {
            return 'links_unknown.txt';
        }
    }
}

module.exports = FileHandler;