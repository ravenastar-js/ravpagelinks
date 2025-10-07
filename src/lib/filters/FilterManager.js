const DomainFilter = require('./DomainFilter');
const RegexFilter = require('./RegexFilter');
const FileHandler = require('../utils/FileHandler');
const path = require('path');

/**
 * 🎛️ Gerenciador de filtros para URLs
 * @class
 */
class FilterManager {
    /**
     * 🏗️ Construtor do FilterManager
     * @constructor
     */
    constructor() {
        this.filters = new Map();
        this.customFilters = new Map();
        this.loadDefaultFilters();
    }

    /**
     * 📦 Carrega filtros padrão
     */
    loadDefaultFilters() {
        this.filters.set('domain', DomainFilter.filter);
        this.filters.set('regex', RegexFilter.filter);
        this.filters.set('file', this.fileFilter.bind(this));
    }

    /**
     * 🎯 Aplica filtros às URLs
     * @param {string[]} urls - 📋 Array de URLs para filtrar
     * @param {Object} filterConfig - ⚙️ Configuração do filtro
     * @param {string} filterConfig.type - 🎯 Tipo de filtro
     * @param {string} filterConfig.value - 📝 Valor do filtro
     * @returns {string[]} 📋 URLs filtradas
     * @throws {Error} ❌ Tipo de filtro não suportado
     */
    applyFilters(urls, filterConfig) {
        if (!filterConfig || !filterConfig.type) {
            return urls;
        }

        const filterFn = this.filters.get(filterConfig.type) ||
            this.customFilters.get(filterConfig.type);

        if (!filterFn) {
            throw new Error(`Tipo de filtro não suportado: ${filterConfig.type}`);
        }

        return urls.filter(url => filterFn(url, filterConfig.value));
    }

    /**
     * 📁 Filtro baseado em arquivo
     * @param {string} url - 🌐 URL para verificar
     * @param {string} filePath - 📁 Caminho do arquivo de filtros
     * @returns {boolean} ✅ True se a URL passar no filtro
     */
    fileFilter(url, filePath) {
        try {
            const filters = FileHandler.loadFiltersFromFile(filePath);

            if (filters.length === 0) {
                return true;
            }

            return filters.some(filter => {
                if (DomainFilter.filter(url, filter)) {
                    return true;
                }

                if (RegexFilter.filter(url, filter)) {
                    return true;
                }

                if (url.includes(filter)) {
                    return true;
                }

                return false;
            });
        } catch (error) {
            console.warn(`Erro ao carregar filtros: ${error.message}. Permitindo todas as URLs.`);
            return true;
        }
    }

    /**
     * ➕ Adiciona filtro personalizado
     * @param {string} name - 🏷️ Nome do filtro
     * @param {Function} filterFn - 🔧 Função de filtro
     */
    addCustomFilter(name, filterFn) {
        this.customFilters.set(name, filterFn);
    }

    /**
     * 📂 Carrega filtros de arquivo
     * @param {string} filePath - 📁 Caminho do arquivo
     * @param {string} type - 🎯 Tipo de filtro
     * @returns {string[]} 📋 Lista de filtros carregados
     */
    loadFiltersFromFile(filePath, type = 'auto') {
        const filters = FileHandler.loadFiltersFromFile(filePath);

        this.addCustomFilter(`file_${type}`, (url) => {
            if (filters.length === 0) {
                return true;
            }

            return filters.some(filter => {
                if (type === 'domain') {
                    return DomainFilter.filter(url, filter);
                } else if (type === 'regex') {
                    return RegexFilter.filter(url, filter);
                } else {
                    return DomainFilter.filter(url, filter) ||
                        RegexFilter.filter(url, filter) ||
                        url.includes(filter);
                }
            });
        });

        return filters;
    }

    /**
     * 📋 Lista tipos de filtro disponíveis
     * @returns {string[]} 📋 Tipos de filtro disponíveis
     */
    getAvailableFilterTypes() {
        return Array.from(this.filters.keys());
    }

    /**
     * 🔍 Filtro por substring
     * @param {string} url - 🌐 URL para verificar
     * @param {string} substring - 📝 Substring para buscar
     * @returns {boolean} ✅ True se a URL contém a substring
     * @static
     */
    static substringFilter(url, substring) {
        return url.includes(substring);
    }
}

module.exports = FilterManager;