const URLExtractor = require('./URLExtractor');
const FilterManager = require('../lib/filters/FilterManager');
const AdvancedLogger = require('../lib/utils/AdvancedLogger');

// 🆕 CARREGAMENTO CONDICIONAL DO PLAYWRIGHT
let PlaywrightCrawler = null;
let playwrightAvailable = false;

try {
    // 🆕 Tenta carregar o Playwright apenas se não for Android
    const fs = require('fs');
    const path = require('path');
    const isAndroid = process.platform === 'android' || fs.existsSync(path.join(__dirname, '..', '..', '.android-platform'));

    if (!isAndroid) {
        PlaywrightCrawler = require('./PlaywrightCrawler');
        playwrightAvailable = true;
    }
} catch (error) {
    console.warn('⚠️ Playwright não disponível:', error.message);
    playwrightAvailable = false;
}

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
        const fs = require('fs');
        const path = require('path');
        const isAndroid = process.platform === 'android' || fs.existsSync(path.join(__dirname, '..', '..', '.android-platform'));

        // 🆕 DETERMINA SE PLAYWRIGHT ESTÁ DISPONÍVEL
        const canUsePlaywright = playwrightAvailable && !isAndroid;
        const defaultUsePlaywright = canUsePlaywright;

        this.options = {
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (compatible; RavPageLinks/1.3.0)',
            verbose: false,
            deepScan: true,
            usePlaywright: defaultUsePlaywright,
            playwrightOptions: {},
            enableLogs: false,
            ...options
        };

        // 🆕 FORÇA DESATIVAÇÃO SE PLAYWRIGHT NÃO ESTIVER DISPONÍVEL
        if (!canUsePlaywright && this.options.usePlaywright) {
            this.options.usePlaywright = false;
            if (this.options.verbose) {
                console.log('🟡 Aviso: Playwright não disponível nesta plataforma');
            }
        }

        this.extractor = new URLExtractor(this.options);

        // 🆕 SÓ CRIA PLAYWRIGHT SE DISPONÍVEL E SOLICITADO
        this.playwrightCrawler = (this.options.usePlaywright && PlaywrightCrawler) ?
            new PlaywrightCrawler({
                ...this.options,
                ...this.options.playwrightOptions
            }) : null;

        this.filterManager = new FilterManager();

        this.logger = this.options.enableLogs ? new AdvancedLogger({
            verbose: this.options.verbose,
            colors: true,
            timestamp: true
        }) : null;

        // 🆕 LOG INFORMATIVO SOBRE RECURSOS DISPONÍVEIS
        if (this.options.verbose) {
            const platformInfo = isAndroid ? '📱 Android' : process.platform;
            const methodInfo = this.playwrightCrawler ?
                '🌐 Playwright disponível' :
                '🏗️ Apenas HTML tradicional';

            const logMsg = this.logger ?
                this.logger.info.bind(this.logger) :
                console.log;
            logMsg(`${platformInfo} - ${methodInfo}`);
        }
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

        // 🆕 VERIFICAÇÃO FINAL DE DISPONIBILIDADE
        const finalUsePlaywright = usePlaywright && this.playwrightCrawler;

        try {
            if (this.logger) {
                this.logger.info(`Iniciando crawling em: ${url}`);
                this.logger.info(finalUsePlaywright ?
                    '🌐 Usando Playwright para renderização JavaScript...' :
                    '🏗️ Usando extração HTML tradicional...');
            } else if (this.options.verbose) {
                console.log(finalUsePlaywright ?
                    '🌐 Usando Playwright para renderização JavaScript...' :
                    '🏗️ Usando extração HTML tradicional...');
            }

            let links;

            if (finalUsePlaywright) {
                links = await this.playwrightCrawler.extractFromURL(url, playwrightOptions);
            } else {
                links = await this.extractor.extractFromURL(url, extractionOptions);
            }

            if (this.logger) {
                this.logger.info(`Encontradas ${links.length} URLs brutas`);
            } else if (this.options.verbose) {
                console.log(`📊 Encontradas ${links.length} URLs brutas`);
            }

            let filteredLinks = links;

            if (filter && filter.type) {
                filteredLinks = this.filterManager.applyFilters(links, filter);
                if (this.logger) {
                    this.logger.info(`${filteredLinks.length} URLs após filtros`);
                } else if (this.options.verbose) {
                    console.log(`🔧 ${filteredLinks.length} URLs após filtros`);
                }
            }

            if (unique) {
                const before = filteredLinks.length;
                filteredLinks = [...new Set(filteredLinks)];
                if (this.logger) {
                    this.logger.info(`${filteredLinks.length} URLs únicas (removidas ${before - filteredLinks.length} duplicatas)`);
                } else if (this.options.verbose) {
                    console.log(`✨ ${filteredLinks.length} URLs únicas (removidas ${before - filteredLinks.length} duplicatas)`);
                }
            }

            return filteredLinks;

        } catch (error) {
            if (this.logger) {
                this.logger.error(`Erro no crawling: ${error.message}`);
            } else {
                console.error(`❌ Erro no crawling: ${error.message}`);
            }

            // 🆕 SÓ TENTA FALLBACK SE PLAYWRIGHT ESTIVER DISPONÍVEL
            if (options.usePlaywright && this.playwrightCrawler) {
                if (this.logger) {
                    this.logger.warn('Tentando fallback para extração HTML tradicional...');
                } else if (this.options.verbose) {
                    console.log('🔄 Tentando fallback para extração HTML tradicional...');
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

    /**
     * 🆕 VERIFICA SE PLAYWRIGHT ESTÁ DISPONÍVEL
     * @returns {boolean} ✅ True se Playwright estiver disponível
     */
    isPlaywrightAvailable() {
        return !!this.playwrightCrawler;
    }

    /**
     * 🆕 OBTÉM INFORMAÇÕES DA PLATAFORMA
     * @returns {Object} 📋 Informações sobre recursos disponíveis
     */
    getPlatformInfo() {
        const fs = require('fs');
        const path = require('path');
        const isAndroid = process.platform === 'android' || fs.existsSync(path.join(__dirname, '..', '..', '.android-platform'));

        return {
            platform: process.platform,
            isAndroid: isAndroid,
            playwrightAvailable: !!this.playwrightCrawler,
            features: this.playwrightCrawler ?
                ['html-extraction', 'javascript-rendering', 'filtering', 'validation'] :
                ['html-extraction', 'filtering', 'validation']
        };
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