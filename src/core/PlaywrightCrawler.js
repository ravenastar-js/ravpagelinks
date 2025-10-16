const playwright = require('playwright');
const URLValidator = require('../lib/utils/URLValidator');
const AdvancedLogger = require('../lib/utils/AdvancedLogger');
const fs = require('fs');
const path = require('path');

/**
 * 🌐 Crawler usando Playwright para renderização JavaScript
 * @class
 */
class PlaywrightCrawler {
    /**
 * 📦 Obtém versão do package.json
 */
    getVersion() {
        try {
            const packagePath = path.join(__dirname, '..', '..', 'package.json');
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.version || '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    /**
     * 🏗️ Construtor do PlaywrightCrawler
     * @constructor
     * @param {Object} options - ⚙️ Configurações do crawler
     * @param {number} options.timeout - ⏰ Timeout das requisições
     * @param {boolean} options.headless - 🌙 Modo headless
     * @param {string} options.waitUntil - ⏳ Condição de espera
     * @param {number} options.waitForTimeout - 🕒 Tempo de espera
     * @param {Object} options.viewport - 📱 Tamanho da viewport
     * @param {string} options.userAgent - 👤 User-Agent
     * @param {string} options.browserType - 🌐 Tipo de navegador
     */
    constructor(options = {}) {
        this.version = this.getVersion();

        this.options = {
            timeout: 30000,
            headless: true,
            waitUntil: 'networkidle',
            waitForTimeout: 5000,
            viewport: { width: 1280, height: 720 },
            userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 RavPageLinks/${this.version}`,
            browserType: 'chromium',
            ...options
        };

        this.validator = new URLValidator();
        this.logger = new AdvancedLogger(this.options.verbose);
        this.browser = null;
        this.context = null;
    }

    /**
     * 🚀 Inicializa o browser Playwright
     * @async
     * @throws {Error} ❌ Falha na inicialização
     */
    async init() {
        try {
            this.logger.debug('Inicializando Playwright...');

            this.browser = await playwright[this.options.browserType].launch({
                headless: this.options.headless,
                timeout: this.options.timeout
            });

            this.context = await this.browser.newContext({
                viewport: this.options.viewport,
                userAgent: this.options.userAgent,
                ignoreHTTPSErrors: true,
                javaScriptEnabled: true
            });

            this.logger.debug('Playwright inicializado com sucesso');

        } catch (error) {
            throw new Error(`Falha ao inicializar Playwright: ${error.message}`);
        }
    }

    /**
     * 🔒 Fecha o browser
     * @async
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.logger.debug('Playwright fechado');
        }
    }

    /**
     * 🎯 Extrai URLs de uma página com renderização JavaScript
     * @async
     * @param {string} url - 🌐 URL para extração
     * @param {Object} options - ⚙️ Opções de configuração
     * @param {string} options.waitForSelector - 🔍 Seletor para esperar
     * @param {number} options.waitForTimeout - ⏳ Tempo de espera
     * @param {string} options.waitUntil - ⏳ Condição de espera
     * @param {Function} options.executeScript - 📜 Script personalizado
     * @param {boolean} options.scrollToBottom - 📜 Rolar até o final
     * @param {number} options.maxScrolls - 🔄 Máximo de scrolls
     * @returns {Promise<string[]>} 📋 Array de URLs extraídas
     * @throws {Error} ❌ Erro durante a extração
     */
    async extractFromURL(url, options = {}) {
        const {
            waitForSelector = null,
            waitForTimeout = this.options.waitForTimeout,
            waitUntil = this.options.waitUntil,
            executeScript = null,
            scrollToBottom = false,
            maxScrolls = 3
        } = options;

        let page = null;

        try {
            if (!this.browser) {
                await this.init();
            }

            if (this.options.verbose) {
                this.logger.info(`Acessando página: ${url}`);
            }
            page = await this.context.newPage();

            if (this.options.verbose) {
                page.on('console', msg => {
                    this.logger.debug(`[Console da Página] ${msg.type()}: ${msg.text()}`);
                });

                page.on('pageerror', error => {
                    this.logger.debug(`[Erro na Página] ${error.message}`);
                });
            }

            page.setDefaultTimeout(this.options.timeout);
            page.setDefaultNavigationTimeout(this.options.timeout);

            await page.goto(url, {
                waitUntil: waitUntil,
                timeout: this.options.timeout
            });

            this.logger.debug(`Página carregada, aguardando estabilização...`);

            if (waitForSelector) {
                this.logger.debug(`Aguardando seletor: ${waitForSelector}`);
                await page.waitForSelector(waitForSelector, { timeout: this.options.timeout });
            }

            if (waitForTimeout > 0) {
                this.logger.debug(`Aguardando ${waitForTimeout}ms para conteúdo dinâmico...`);
                await page.waitForTimeout(waitForTimeout);
            }

            if (scrollToBottom) {
                await this.scrollPage(page, maxScrolls);
            }

            if (executeScript) {
                this.logger.debug('Executando script personalizado...');
                await page.evaluate(executeScript);
            }

            const urls = await this.extractURLsFromPage(page, url);

            this.logger.debug(`Extraídas ${urls.length} URLs do DOM renderizado`);

            return urls;

        } catch (error) {
            this.logger.error(`Erro no Playwright crawler: ${error.message}`);

            if (page) {
                try {
                    const html = await page.content();
                    this.logger.debug(`HTML da página (primeiros 500 chars): ${html.substring(0, 500)}...`);
                } catch (e) {
                    this.logger.debug('Não foi possível obter HTML da página');
                }
            }

            throw error;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * 📜 Faz scroll na página para carregar conteúdo lazy
     * @async
     * @param {Object} page - 📄 Instância da página Playwright
     * @param {number} maxScrolls - 🔄 Número máximo de scrolls
     */
    async scrollPage(page, maxScrolls = 3) {
        this.logger.debug(`Fazendo scroll na página (${maxScrolls} vezes)...`);

        for (let i = 0; i < maxScrolls; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await page.waitForTimeout(1000);

            const isAtBottom = await page.evaluate(() => {
                return window.innerHeight + window.scrollY >= document.body.scrollHeight;
            });

            if (isAtBottom) {
                this.logger.debug(`Scroll ${i + 1}: Chegou ao final da página`);
                break;
            }

            this.logger.debug(`Scroll ${i + 1}: Continuando...`);
        }
    }

    /**
     * 🔍 Extrai URLs da página renderizada
     * @async
     * @param {Object} page - 📄 Instância da página Playwright
     * @param {string} baseURL - 🌐 URL base para resolver URLs relativas
     * @returns {Promise<string[]>} 📋 Array de URLs extraídas
     */
    async extractURLsFromPage(page, baseURL) {
        const urls = new Set();

        const extractedData = await page.evaluate((base) => {
            const results = {
                links: new Set(),
                scripts: new Set(),
                images: new Set(),
                css: new Set(),
                meta: new Set(),
                events: new Set(),
                json: new Set(),
                windowOpen: new Set(),
                dataAttributes: new Set(),
                dynamicContent: new Set()
            };

            const resolveURL = (url, baseUrl) => {
                if (!url || typeof url !== 'string' || url.trim() === '') return null;

                try {
                    if (url.startsWith('javascript:') || url.startsWith('mailto:') ||
                        url.startsWith('tel:') || url.startsWith('#') || url.startsWith('data:')) {
                        return null;
                    }

                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                    }

                    if (baseUrl) {
                        return new URL(url, baseUrl).href;
                    }

                    return url;
                } catch (error) {
                    return null;
                }
            };

            const extractFromEvent = (element, eventName) => {
                try {
                    const handler = element.getAttribute(eventName);
                    if (handler && typeof handler === 'string') {
                        const windowOpenMatch = handler.match(/window\.open\s*\(\s*['"`]([^'"`]+)['"`]/);
                        if (windowOpenMatch && windowOpenMatch[1]) {
                            const url = resolveURL(windowOpenMatch[1], base);
                            if (url) results.windowOpen.add(url);
                        }

                        const urlMatches = handler.match(/(https?:\/\/[^\s"']+|\/[^\s"']+)/g) || [];
                        urlMatches.forEach(match => {
                            const resolved = resolveURL(match, base);
                            if (resolved) results.events.add(resolved);
                        });
                    }
                } catch (e) { }
            };

            const eventAttributes = [
                'onclick', 'onload', 'onerror', 'onmouseover',
                'ondblclick', 'onmousedown', 'onkeypress'
            ];

            eventAttributes.forEach(event => {
                const elements = document.querySelectorAll(`[${event}]`);
                elements.forEach(element => {
                    extractFromEvent(element, event);
                });
            });

            const dataAttrs = [
                'data-href', 'data-url', 'data-src', 'data-link',
                'data-action', 'data-target', 'data-load'
            ];

            dataAttrs.forEach(attr => {
                const elements = document.querySelectorAll(`[${attr}]`);
                elements.forEach(element => {
                    const value = element.getAttribute(attr);
                    if (value) {
                        const url = resolveURL(value, base);
                        if (url) results.dataAttributes.add(url);
                    }
                });
            });

            try {
                const linkElements = [
                    ...document.querySelectorAll('a[href]'),
                    ...document.querySelectorAll('link[href]'),
                    ...document.querySelectorAll('area[href]'),
                    ...document.querySelectorAll('base[href]')
                ];

                linkElements.forEach(el => {
                    const href = el.getAttribute('href') || el.href;
                    if (href) {
                        const url = resolveURL(href, base);
                        if (url) results.links.add(url);
                    }
                });
            } catch (e) { }

            try {
                const resourceElements = [
                    ...document.querySelectorAll('script[src]'),
                    ...document.querySelectorAll('img[src]'),
                    ...document.querySelectorAll('iframe[src]'),
                    ...document.querySelectorAll('embed[src]'),
                    ...document.querySelectorAll('source[src]'),
                    ...document.querySelectorAll('track[src]'),
                    ...document.querySelectorAll('video[src]'),
                    ...document.querySelectorAll('audio[src]'),
                    ...document.querySelectorAll('object[data]')
                ];

                resourceElements.forEach(el => {
                    const src = el.getAttribute('src') || el.getAttribute('data') || el.src;
                    if (src) {
                        const url = resolveURL(src, base);
                        if (url) results.scripts.add(url);
                    }
                });
            } catch (e) { }

            try {
                const srcsetElements = document.querySelectorAll('img[srcset], source[srcset]');
                srcsetElements.forEach(el => {
                    const srcset = el.getAttribute('srcset');
                    if (srcset && typeof srcset === 'string') {
                        srcset.split(',').forEach(part => {
                            const urlPart = part.trim().split(' ')[0];
                            if (urlPart) {
                                const resolved = resolveURL(urlPart, base);
                                if (resolved) results.images.add(resolved);
                            }
                        });
                    }
                });
            } catch (e) { }

            try {
                const forms = document.querySelectorAll('form[action]');
                forms.forEach(form => {
                    const action = form.getAttribute('action');
                    if (action) {
                        const url = resolveURL(action, base);
                        if (url) results.links.add(url);
                    }
                });
            } catch (e) { }

            try {
                const metaTags = document.querySelectorAll('meta[content]');
                metaTags.forEach(meta => {
                    const content = meta.getAttribute('content');
                    if (content && typeof content === 'string') {
                        const property = meta.getAttribute('property');
                        const name = meta.getAttribute('name');

                        const isURLMeta = (property && (property.includes('image') || property.includes('url'))) ||
                            (name && (name.includes('image') || name.includes('url'))) ||
                            content.startsWith('http') || content.startsWith('/');

                        if (isURLMeta) {
                            const url = resolveURL(content, base);
                            if (url) results.meta.add(url);
                        }
                    }
                });
            } catch (e) { }

            try {
                const styleElements = document.querySelectorAll('[style]');
                styleElements.forEach(el => {
                    const style = el.getAttribute('style');
                    if (style && typeof style === 'string') {
                        const urlMatches = style.match(/url\(['"]?([^'"()]*)['"]?\)/g) || [];
                        urlMatches.forEach(match => {
                            const urlMatch = match.match(/url\(['"]?([^'"()]*)['"]?\)/);
                            if (urlMatch && urlMatch[1]) {
                                const url = resolveURL(urlMatch[1], base);
                                if (url) results.css.add(url);
                            }
                        });
                    }
                });
            } catch (e) { }

            try {
                const styleTags = document.querySelectorAll('style');
                styleTags.forEach(style => {
                    const css = style.textContent;
                    if (css && typeof css === 'string') {
                        const urlMatches = css.match(/url\(['"]?([^'"()]*)['"]?\)/g) || [];
                        urlMatches.forEach(match => {
                            const urlMatch = match.match(/url\(['"]?([^'"()]*)['"]?\)/);
                            if (urlMatch && urlMatch[1]) {
                                const url = resolveURL(urlMatch[1], base);
                                if (url) results.css.add(url);
                            }
                        });
                    }
                });
            } catch (e) { }

            try {
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    Array.from(el.attributes).forEach(attr => {
                        if (attr.name.startsWith('data-') && attr.value && typeof attr.value === 'string') {
                            const urlMatches = attr.value.match(/(https?:\/\/[^\s"',]+)/g) || [];
                            urlMatches.forEach(url => {
                                const resolved = resolveURL(url, base);
                                if (resolved) results.json.add(resolved);
                            });
                        }
                    });
                });
            } catch (e) { }

            try {
                const eventAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onsubmit'];
                eventAttributes.forEach(eventName => {
                    const eventElements = document.querySelectorAll(`[${eventName}]`);
                    eventElements.forEach(el => {
                        const handler = el.getAttribute(eventName);
                        if (handler && typeof handler === 'string') {
                            const urlMatches = handler.match(/(https?:\/\/[^\s"']+)/g) || [];
                            urlMatches.forEach(url => {
                                const resolved = resolveURL(url, base);
                                if (resolved) results.events.add(resolved);
                            });
                        }
                    });
                });
            } catch (e) { }

            try {
                const textContent = document.body ? document.body.innerText : '';
                if (textContent && typeof textContent === 'string') {
                    const textUrls = textContent.match(/(https?:\/\/[^\s]+)/g) || [];
                    textUrls.forEach(url => {
                        const resolved = resolveURL(url, base);
                        if (resolved) results.links.add(resolved);
                    });
                }
            } catch (e) { }

            try {
                const customAttrSelectors = [
                    '[data-href]', '[data-url]', '[data-src]', '[data-link]',
                    '[data-image]', '[data-action]'
                ];

                customAttrSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        const urlValue = el.getAttribute(selector.replace(/[\[\]]/g, '')) ||
                            el.getAttribute('data-href') ||
                            el.getAttribute('data-url') ||
                            el.getAttribute('data-src');
                        if (urlValue && typeof urlValue === 'string') {
                            const url = resolveURL(urlValue, base);
                            if (url) results.json.add(url);
                        }
                    });
                });
            } catch (e) { }

            return {
                links: Array.from(results.links),
                scripts: Array.from(results.scripts),
                images: Array.from(results.images),
                css: Array.from(results.css),
                meta: Array.from(results.meta),
                events: Array.from(results.events),
                json: Array.from(results.json),
                windowOpen: Array.from(results.windowOpen),
                dataAttributes: Array.from(results.dataAttributes),
                dynamicContent: Array.from(results.dynamicContent)
            };

        }, baseURL);

        const allURLs = [
            ...extractedData.links,
            ...extractedData.scripts,
            ...extractedData.images,
            ...extractedData.css,
            ...extractedData.meta,
            ...extractedData.events,
            ...extractedData.json,
            ...extractedData.windowOpen,
            ...extractedData.dataAttributes,
            ...extractedData.dynamicContent
        ];

        allURLs.forEach(url => {
            if (url && this.validator.isValidURL(url)) {
                urls.add(url);
            }
        });

        return Array.from(urls);
    }

    /**
     * 📄 Obtém HTML da página renderizada
     * @async
     * @param {Object} page - 📄 Instância da página Playwright
     * @returns {Promise<string>} 📝 HTML da página
     */
    async getRenderedHTML(page) {
        return await page.content();
    }
}

module.exports = PlaywrightCrawler;