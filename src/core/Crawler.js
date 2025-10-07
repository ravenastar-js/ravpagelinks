const URLExtractor = require('./URLExtractor');
const PlaywrightCrawler = require('./PlaywrightCrawler');
const FilterManager = require('../lib/filters/FilterManager');
const AdvancedLogger = require('../lib/utils/AdvancedLogger');

/**
 * 🕷️ Classe principal para crawling e extração de URLs
 * @class
 */
class RavPageLinks {
    /**
     * 🏗️ Construtor da classe RavPageLinks
     * @constructor
     * @param {Object} options - Configurações do crawler
     * @param {number} options.timeout - ⏰ Timeout das requisições
     * @param {string} options.userAgent - 👤 User-Agent personalizado
     * @param {boolean} options.verbose - 📢 Modo verboso
     * @param {boolean} options.deepScan - 🔍 Escaneamento profundo
     * @param {boolean} options.usePlaywright - 🌐 Usar Playwright
     * @param {Object} options.playwrightOptions - ⚙️ Opções do Playwright
     * @param {boolean} options.enableLogs - 📝 Habilitar sistema de logs
     */
    constructor(options = {}) {
        this.options = {
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (compatible; RavPageLinks/1.3.0)',
            verbose: false,
            deepScan: true,
            usePlaywright: true,
            playwrightOptions: {},
            enableLogs: false,
            ...options
        };

        this.extractor = new URLExtractor(this.options);
        this.playwrightCrawler = this.options.usePlaywright ? new PlaywrightCrawler({
            ...this.options,
            ...this.options.playwrightOptions,
            verbose: this.options.verbose
        }) : null;
        this.filterManager = new FilterManager();

        this.logger = this.options.enableLogs ? new AdvancedLogger({
            verbose: this.options.verbose,
            colors: true,
            timestamp: true
        }) : null;
    }

    /**
     * 🎯 Realiza o crawling de uma URL e extrai links
     * @async
     * @param {string} url - 🌐 URL para fazer crawling
     * @param {Object} options - ⚙️ Opções de configuração
     * @param {Object} options.filter - 🔍 Filtro a ser aplicado
     * @param {boolean} options.unique - ✨ Remover duplicatas
     * @param {boolean} options.usePlaywright - 🌐 Usar Playwright
     * @param {Object} options.playwrightOptions - ⚙️ Opções do Playwright
     * @returns {Promise<string[]>} 📋 Array de URLs extraídas
     * @throws {Error} ❌ Erro durante o crawling
     */
    async crawl(url, options = {}) {
        const {
            filter = null,
            unique = false,
            usePlaywright = this.options.usePlaywright,
            playwrightOptions = {},
            ...extractionOptions
        } = options;

        try {
            if (this.logger) {
                this.logger.info(`Iniciando crawling em: ${url}`);
            }

            let links;

            if (usePlaywright && this.playwrightCrawler) {
                if (this.logger) {
                    this.logger.info('Usando Playwright para renderização JavaScript...');
                }
                links = await this.playwrightCrawler.extractFromURL(url, playwrightOptions);
            } else {
                if (this.logger) {
                    this.logger.info('Usando extração HTML tradicional...');
                }
                links = await this.extractor.extractFromURL(url, extractionOptions);
            }

            if (this.logger) {
                this.logger.info(`Encontradas ${links.length} URLs brutas`);
            }

            let filteredLinks = links;

            if (filter && filter.type) {
                filteredLinks = this.filterManager.applyFilters(links, filter);
                if (this.logger) {
                    this.logger.info(`${filteredLinks.length} URLs após filtros`);
                }
            }

            if (unique) {
                const before = filteredLinks.length;
                filteredLinks = [...new Set(filteredLinks)];
                if (this.logger) {
                    this.logger.info(`${filteredLinks.length} URLs únicas (removidas ${before - filteredLinks.length} duplicatas)`);
                }
            }

            return filteredLinks;

        } catch (error) {
            if (this.logger) {
                this.logger.error(`Erro no crawling: ${error.message}`);
            }

            if (options.usePlaywright) {
                if (this.logger) {
                    this.logger.warn('Tentando fallback para extração HTML tradicional...');
                }
                return await this.crawl(url, { ...options, usePlaywright: false });
            }

            throw error;
        }
    }

    /**
     * 🔒 Fecha recursos do Playwright
     * @async
     */
    async close() {
        if (this.playwrightCrawler) {
            await this.playwrightCrawler.close();
        }
    }

    /**
     * 📄 Extrai URLs de conteúdo HTML
     * @param {string} html - 📝 Conteúdo HTML para análise
     * @param {string} baseURL - 🌐 URL base para resolver URLs relativas
     * @param {Object} options - ⚙️ Opções de extração
     * @returns {string[]} 📋 Array de URLs extraídas
     */
    extractFromHTML(html, baseURL = '', options = {}) {
        const links = this.extractor.extractFromHTML(html, baseURL, options);

        if (options.filter && options.filter.type) {
            return this.filterManager.applyFilters(links, options.filter);
        }

        return links;
    }

    /**
     * ➕ Adiciona filtro personalizado
     * @param {string} name - 🏷️ Nome do filtro
     * @param {Function} filterFn - 🔧 Função de filtro
     */
    addFilter(name, filterFn) {
        this.filterManager.addCustomFilter(name, filterFn);
    }

    /**
     * 📂 Carrega filtros de arquivo
     * @param {string} filePath - 📁 Caminho do arquivo de filtros
     * @param {string} type - 🎯 Tipo de filtro
     * @returns {boolean} ✅ Sucesso da operação
     */
    loadFiltersFromFile(filePath, type = 'domain') {
        return this.filterManager.loadFiltersFromFile(filePath, type);
    }
}

/**
 * 🚀 Função de conveniência para extrair URLs de uma URL
 * @async
 * @param {string} url - 🌐 URL para extração
 * @param {Object} options - ⚙️ Opções de configuração
 * @returns {Promise<string[]>} 📋 Array de URLs extraídas
 */
async function extractLinksFromURL(url, options = {}) {
    const crawler = new RavPageLinks(options);
    try {
        const links = await crawler.crawl(url, options);
        return links;
    } finally {
        await crawler.close();
    }
}

/**
 * 📝 Função de conveniência para extrair URLs de HTML
 * @param {string} html - 📝 Conteúdo HTML para análise
 * @param {string} baseURL - 🌐 URL base para resolver URLs relativas
 * @param {Object} options - ⚙️ Opções de extração
 * @returns {string[]} 📋 Array de URLs extraídas
 */
function extractLinksFromHTML(html, baseURL = '', options = {}) {
    const crawler = new RavPageLinks(options);
    return crawler.extractFromHTML(html, baseURL, options);
}

module.exports = {
    RavPageLinks,
    extractLinksFromURL,
    extractLinksFromHTML
};