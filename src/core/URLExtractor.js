const axios = require('axios');
const { JSDOM } = require('jsdom');
const URLValidator = require('../lib/utils/URLValidator');

/**
 * 🕸️ Extrator de URLs de conteúdo HTML
 * @class
 */
class URLExtractor {
    /**
     * 🏗️ Construtor do URLExtractor
     * @constructor
     * @param {Object} options - ⚙️ Configurações do extrator
     * @param {number} options.timeout - ⏰ Timeout das requisições
     * @param {string} options.userAgent - 👤 User-Agent
     * @param {boolean} options.followRedirects - 🔀 Seguir redirecionamentos
     * @param {number} options.maxRedirects - 🔄 Máximo de redirecionamentos
     */
    constructor(options = {}) {
        this.options = {
            timeout: 10000,
            userAgent: 'Mozilla/5.0 (compatible; RavPageLinks/1.1.0)',
            followRedirects: true,
            maxRedirects: 5,
            ...options
        };
        this.validator = new URLValidator();
    }

    /**
     * 🎯 Extrai URLs de conteúdo HTML
     * @param {string} html - 📝 Conteúdo HTML para análise
     * @param {string} baseURL - 🌐 URL base para resolver URLs relativas
     * @param {Object} options - ⚙️ Opções de extração
     * @param {boolean} options.includeButtons - 🔘 Incluir botões
     * @param {boolean} options.includeForms - 📋 Incluir formulários
     * @param {boolean} options.includeMeta - 🔮 Incluir meta tags
     * @param {boolean} options.includeScripts - 📜 Incluir scripts
     * @param {boolean} options.includeImages - 🖼️ Incluir imagens
     * @param {boolean} options.includeCSS - 🎨 Incluir CSS
     * @param {boolean} options.includeJSON - 📊 Incluir JSON
     * @param {boolean} options.includeComments - 💬 Incluir comentários
     * @returns {string[]} 📋 Array de URLs extraídas
     */
    extractFromHTML(html, baseURL = '', options = {}) {
        const {
            includeButtons = true,
            includeForms = true,
            includeMeta = true,
            includeScripts = true,
            includeImages = true,
            includeCSS = true,
            includeJSON = true,
            includeComments = true
        } = options;

        try {
            const dom = new JSDOM(html, {
                url: baseURL,
                resources: 'usable',
                runScripts: 'outside-only'
            });

            const document = dom.window.document;
            const urls = new Set();

            this.extractFromHTMLTags(document, baseURL, urls, options);

            if (includeButtons) {
                this.extractFromJavaScriptEvents(document, baseURL, urls);
            }

            if (includeCSS) {
                this.extractFromCSS(document, baseURL, urls);
            }

            if (includeComments) {
                this.extractFromComments(dom, baseURL, urls);
            }

            if (includeJSON) {
                this.extractFromJSONAttributes(document, baseURL, urls);
            }

            if (includeMeta) {
                this.extractFromMetaTags(document, baseURL, urls);
            }

            this.deepTextScan(dom.serialize(), baseURL, urls);

            return Array.from(urls).filter(url => url && this.validator.isValidURL(url));

        } catch (error) {
            return this.extractWithRegex(html, baseURL);
        }
    }

    /**
     * 📎 Extrai URLs de tags HTML
     * @param {Document} document - 📄 Documento DOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     * @param {Object} options - ⚙️ Opções de extração
     */
    extractFromHTMLTags(document, baseURL, urls, options) {
        const tagConfig = [
            { selector: 'a[href]', attr: 'href' },
            { selector: 'link[href]', attr: 'href' },
            { selector: 'area[href]', attr: 'href' },
            { selector: 'base[href]', attr: 'href' },
            { selector: 'script[src]', attr: 'src' },
            { selector: 'img[src]', attr: 'src' },
            { selector: 'img[srcset]', attr: 'srcset' },
            { selector: 'source[src]', attr: 'src' },
            { selector: 'source[srcset]', attr: 'srcset' },
            { selector: 'track[src]', attr: 'src' },
            { selector: 'video[src]', attr: 'src' },
            { selector: 'audio[src]', attr: 'src' },
            { selector: 'iframe[src]', attr: 'src' },
            { selector: 'embed[src]', attr: 'src' },
            { selector: 'object[data]', attr: 'data' },
            { selector: 'form[action]', attr: 'action' },
            { selector: 'meta[content]', attr: 'content' },
            { selector: '[ping]', attr: 'ping' },
            { selector: '[cite]', attr: 'cite' },
            { selector: '[poster]', attr: 'poster' },
            { selector: '[background]', attr: 'background' },
            { selector: '[lowsrc]', attr: 'lowsrc' },
            { selector: '[dynsrc]', attr: 'dynsrc' },
            { selector: '[longdesc]', attr: 'longdesc' },
        ];

        tagConfig.forEach(({ selector, attr }) => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const value = element.getAttribute(attr);
                    if (value) {
                        this.processAttributeValue(value, baseURL, urls, attr, element.tagName);
                    }
                });
            } catch (error) { }
        });

        const styleElements = document.querySelectorAll('[style]');
        styleElements.forEach(element => {
            const style = element.getAttribute('style');
            this.extractFromCSSString(style, baseURL, urls);
        });
    }

    /**
     * 🔧 Processa valor do atributo
     * @param {string} value - 📝 Valor do atributo
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     * @param {string} attr - 🏷️ Nome do atributo
     * @param {string} tagName - 🔖 Nome da tag
     */
    processAttributeValue(value, baseURL, urls, attr, tagName) {
        if (attr === 'srcset') {
            this.extractFromSrcSet(value, baseURL, urls);
        } else if (attr === 'ping') {
            value.split(',').forEach(url => {
                const resolved = this.validator.resolveURL(url.trim(), baseURL);
                if (resolved) urls.add(resolved);
            });
        } else if (attr === 'content' && tagName === 'META') {
            this.processMetaContent(value, baseURL, urls);
        } else {
            const url = this.validator.resolveURL(value, baseURL);
            if (url) {
                urls.add(url);
            }
        }
    }

    /**
     * 🔮 Processa conteúdo de meta tags
     * @param {string} content - 📝 Conteúdo da meta tag
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    processMetaContent(content, baseURL, urls) {
        if (content.match(/^https?:\/\//) || content.match(/^\//)) {
            const url = this.validator.resolveURL(content, baseURL);
            if (url) {
                urls.add(url);
            }
        }
    }

    /**
     * 🖼️ Extrai URLs de srcset
     * @param {string} srcset - 📝 Valor do atributo srcset
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromSrcSet(srcset, baseURL, urls) {
        const descriptors = srcset.split(',');
        descriptors.forEach(descriptor => {
            const parts = descriptor.trim().split(/\s+/);
            if (parts[0]) {
                const url = this.validator.resolveURL(parts[0], baseURL);
                if (url) {
                    urls.add(url);
                }
            }
        });
    }

    /**
     * ⚡ Extrai URLs de eventos JavaScript
     * @param {Document} document - 📄 Documento DOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromJavaScriptEvents(document, baseURL, urls) {
        const events = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onsubmit', 'onchange', 'onfocus', 'onblur', 'onresize',
            'onscroll', 'onkeydown', 'onkeyup', 'onkeypress',
            'ondblclick', 'onmousedown', 'onmouseup', 'onmousemove'
        ];

        events.forEach(event => {
            const elements = document.querySelectorAll(`[${event}]`);
            elements.forEach(element => {
                const handler = element.getAttribute(event);
                if (handler) {
                    const extractedUrls = this.extractAdvancedURLsFromJavaScript(handler, baseURL);
                    extractedUrls.forEach(url => {
                        if (url) urls.add(url);
                    });
                }
            });
        });

        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent) {
                const extractedUrls = this.extractAdvancedURLsFromJavaScript(script.textContent, baseURL);
                extractedUrls.forEach(url => {
                    if (url) urls.add(url);
                });
            }
        });

        this.extractFromDataAttributes(document, baseURL, urls);
    }

    /**
  * 🆕 Extração avançada de URLs em JavaScript
  * @param {string} jsCode - 📜 Código JavaScript
  * @param {string} baseURL - 🌐 URL base
  * @returns {string[]} 📋 Array de URLs extraídas
  */
    extractAdvancedURLsFromJavaScript(jsCode, baseURL) {
        if (!jsCode || typeof jsCode !== 'string') return [];

        const urls = new Set();

        const windowOpenPatterns = [
            /window\.open\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /window\.open\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*[^)]+\)/gi,
            /open\s*\(\s*['"`]([^'"`]+)['"`]/gi
        ];

        const navigationPatterns = [
            /window\.location\s*=\s*['"`]([^'"`]+)['"`]/gi,
            /window\.location\.href\s*=\s*['"`]([^'"`]+)['"`]/gi,
            /location\.href\s*=\s*['"`]([^'"`]+)['"`]/gi,
            /location\.assign\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
            /location\.replace\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
            /document\.location\s*=\s*['"`]([^'"`]+)['"`]/gi
        ];

        const fetchPatterns = [
            /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /\.open\s*\(\s*['"`](?:GET|POST|PUT|DELETE)\s*,\s*['"`]([^'"`]+)['"`]/gi,
            /axios\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /\.get\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi
        ];

        const assignmentPatterns = [
            /\.(?:src|href|action|data|value)\s*=\s*['"`]([^'"`]+)['"`]/gi,
            /setAttribute\s*\(\s*['"`](?:src|href|action)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/gi
        ];

        const templatePatterns = [
            /['"`](https?:\/\/[^'"`\s)]+)['"`]/gi,
            /['"`](\/[^'"`\s)]+)['"`]/gi,
            /['"`](\.\.?\/[^'"`\s)]+)['"`]/gi,
            /`([^`]+)`/g
        ];

        const allPatterns = [
            ...windowOpenPatterns,
            ...navigationPatterns,
            ...fetchPatterns,
            ...assignmentPatterns,
            ...templatePatterns
        ];

        allPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(jsCode)) !== null) {
                const potentialURL = match[1] || match[0];
                if (potentialURL && this.isValidJavaScriptURL(potentialURL)) {
                    const url = this.validator.resolveURL(potentialURL, baseURL);
                    if (url && this.validator.isValidURL(url)) {
                        urls.add(url);
                    }
                }
            }
        });

        const relativePathPattern = /window\.open\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`](?:_blank|_self|_parent|_top)['"`]/gi;
        let relativeMatch;
        while ((relativeMatch = relativePathPattern.exec(jsCode)) !== null) {
            const path = relativeMatch[1];
            if (path && !path.startsWith('http') && !path.startsWith('javascript:')) {
                const url = this.validator.resolveURL(path, baseURL);
                if (url) urls.add(url);
            }
        }

        return Array.from(urls);
    }

    /**
       * 🆕 Valida se é uma URL válida em contexto JavaScript
       * @param {string} url - 🌐 URL para validar
       * @returns {boolean} ✅ True se for válida
       */
    isValidJavaScriptURL(url) {
        if (!url || typeof url !== 'string') return false;

        const invalidPatterns = [
            'javascript:',
            'mailto:',
            'tel:',
            '#',
            'void(0)',
            'void(0);',
            'return false',
            'return true',
            'undefined',
            'null'
        ];

        return !invalidPatterns.some(pattern =>
            url.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
 * 🆕 Extrai URLs de atributos data-*
 * @param {Document} document - 📄 Documento DOM
 * @param {string} baseURL - 🌐 URL base
 * @param {Set} urls - 🗂️ Set para armazenar URLs
 */
    extractFromDataAttributes(document, baseURL, urls) {
        const dataAttributes = [
            'data-href', 'data-url', 'data-src', 'data-link',
            'data-action', 'data-target', 'data-load', 'data-open',
            'data-ajax', 'data-form', 'data-image', 'data-video'
        ];

        dataAttributes.forEach(attr => {
            const elements = document.querySelectorAll(`[${attr}]`);
            elements.forEach(element => {
                const value = element.getAttribute(attr);
                if (value && typeof value === 'string') {
                    if (this.looksLikeURL(value)) {
                        const url = this.validator.resolveURL(value, baseURL);
                        if (url && this.validator.isValidURL(url)) {
                            urls.add(url);
                        }
                    }
                }
            });
        });

        const allDataElements = document.querySelectorAll('[data-]');
        allDataElements.forEach(element => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && attr.value) {
                    const urlMatches = attr.value.match(/(https?:\/\/[^\s"',]+|\/[^\s"',]+)/g) || [];
                    urlMatches.forEach(match => {
                        if (this.looksLikeURL(match)) {
                            const url = this.validator.resolveURL(match, baseURL);
                            if (url) urls.add(url);
                        }
                    });
                }
            });
        });
    }

    /**
     * 🆕 Verifica se uma string parece ser uma URL
     * @param {string} str - 📝 String para verificar
     * @returns {boolean} ✅ True se parecer URL
     */
    looksLikeURL(str) {
        if (!str || typeof str !== 'string') return false;

        const urlIndicators = [
            /^https?:\/\//i,
            /^\/\//,
            /^\/[^\/\s]/,
            /^\.\.?\//,
            /\.[a-z]{2,6}(\/|$)/i,
            /[a-z]+\.[a-z]+/i
        ];

        const nonURLIndicators = [
            /^[{}()\[\]]/,
            /^[0-9]+$/,
            /^[#!?]/,
            /^javascript:/i,
            /^mailto:/i,
            /^(true|false|null|undefined)$/i
        ];

        return urlIndicators.some(indicator => indicator.test(str)) &&
            !nonURLIndicators.some(indicator => indicator.test(str));
    }


    /**
     * 🎨 Extrai URLs de CSS
     * @param {Document} document - 📄 Documento DOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromCSS(document, baseURL, urls) {
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
            if (style.textContent) {
                this.extractFromCSSString(style.textContent, baseURL, urls);
            }
        });

        const styleAttrs = document.querySelectorAll('[style]');
        styleAttrs.forEach(element => {
            const style = element.getAttribute('style');
            this.extractFromCSSString(style, baseURL, urls);
        });

        const linkStyles = document.querySelectorAll('link[rel="stylesheet"][href]');
        linkStyles.forEach(link => {
            const url = this.validator.resolveURL(link.href, baseURL);
            if (url) urls.add(url);
        });
    }

    /**
     * 🎨 Extrai URLs de string CSS
     * @param {string} css - 🎨 Conteúdo CSS
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromCSSString(css, baseURL, urls) {
        const urlRegex = /url\(['"]?([^'"()]*)['"]?\)/gi;
        let match;
        while ((match = urlRegex.exec(css)) !== null) {
            const url = this.validator.resolveURL(match[1], baseURL);
            if (url) urls.add(url);
        }

        const importRegex = /@import\s+(?:url\(['"]?([^'"()]*)['"]?\)|['"]([^'"]*)['"])/gi;
        while ((match = importRegex.exec(css)) !== null) {
            const url = this.validator.resolveURL(match[1] || match[2], baseURL);
            if (url) urls.add(url);
        }
    }

    /**
     * 💬 Extrai URLs de comentários HTML
     * @param {JSDOM} dom - 🌐 Instância do JSDOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromComments(dom, baseURL, urls) {
        const walker = dom.window.document.createTreeWalker(
            dom.window.document,
            dom.window.NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        let node;
        const urlRegex = /https?:\/\/[^\s<>"']+/gi;

        while ((node = walker.nextNode())) {
            const matches = node.textContent.match(urlRegex);
            if (matches) {
                matches.forEach(match => {
                    const url = this.validator.resolveURL(match, baseURL);
                    if (url) urls.add(url);
                });
            }
        }
    }

    /**
     * 📊 Extrai URLs de atributos JSON
     * @param {Document} document - 📄 Documento DOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromJSONAttributes(document, baseURL, urls) {
        const elements = document.querySelectorAll('[data-]');
        elements.forEach(element => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && (attr.value.includes('http') || attr.value.includes('//'))) {
                    const urlRegex = /https?:\/\/[^\s<>"']+/g;
                    const matches = attr.value.match(urlRegex);
                    if (matches) {
                        matches.forEach(match => {
                            const url = this.validator.resolveURL(match, baseURL);
                            if (url) urls.add(url);
                        });
                    }
                }
            });
        });
    }

    /**
     * 🔮 Extrai URLs de meta tags
     * @param {Document} document - 📄 Documento DOM
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    extractFromMetaTags(document, baseURL, urls) {
        const metaTags = document.querySelectorAll('meta[content]');
        metaTags.forEach(meta => {
            const content = meta.getAttribute('content');
            const property = meta.getAttribute('property');
            const name = meta.getAttribute('name');

            const urlMetaProperties = [
                'og:image', 'og:url', 'og:audio', 'og:video',
                'twitter:image', 'twitter:player', 'twitter:site',
                'msapplication-TileImage', 'msapplication-config',
                'thumbnail', 'image', 'url'
            ];

            const isURLMeta = urlMetaProperties.some(prop =>
                property === prop || name === prop
            );

            if (isURLMeta && content) {
                const url = this.validator.resolveURL(content, baseURL);
                if (url) urls.add(url);
            }
        });
    }

    /**
     * 🔍 Busca profunda por URLs no texto
     * @param {string} html - 📝 Conteúdo HTML
     * @param {string} baseURL - 🌐 URL base
     * @param {Set} urls - 🗂️ Set para armazenar URLs
     */
    deepTextScan(html, baseURL, urls) {
        const urlRegex = /(?:https?:\/\/|www\.|\.(com|org|net|io|dev|pages))[^\s<>"']+/gi;
        const matches = html.match(urlRegex);

        if (matches) {
            matches.forEach(match => {
                let url = match;
                if (!url.startsWith('http')) {
                    url = 'https://' + url;
                }

                const resolved = this.validator.resolveURL(url, baseURL);
                if (resolved) urls.add(resolved);
            });
        }

        const relativeRegex = /["']\/(?!\/)[^"'\s>]+["']/gi;
        const relativeMatches = html.match(relativeRegex);
        if (relativeMatches) {
            relativeMatches.forEach(match => {
                const path = match.replace(/["']/g, '');
                const url = this.validator.resolveURL(path, baseURL);
                if (url) urls.add(url);
            });
        }
    }

    /**
     * 🆘 Fallback: extração por regex
     * @param {string} html - 📝 Conteúdo HTML
     * @param {string} baseURL - 🌐 URL base
     * @returns {string[]} 📋 Array de URLs extraídas
     */
    extractWithRegex(html, baseURL) {
        const urls = new Set();

        const mainRegex = /(?:href|src|action|data|cite|poster|background)\s*=\s*["']([^"']+)["']/gi;
        let match;

        while ((match = mainRegex.exec(html)) !== null) {
            const url = this.validator.resolveURL(match[1], baseURL);
            if (url) urls.add(url);
        }

        const cssRegex = /url\(['"]?([^'"()]*)['"]?\)/gi;
        while ((match = cssRegex.exec(html)) !== null) {
            const url = this.validator.resolveURL(match[1], baseURL);
            if (url) urls.add(url);
        }

        const looseRegex = /https?:\/\/[^\s<>"']+/gi;
        const looseMatches = html.match(looseRegex);
        if (looseMatches) {
            looseMatches.forEach(match => {
                const url = this.validator.resolveURL(match, baseURL);
                if (url) urls.add(url);
            });
        }

        return Array.from(urls);
    }

    /**
     * 🌐 Extrai URLs de uma URL remota
     * @async
     * @param {string} url - 🌐 URL para extração
     * @param {Object} options - ⚙️ Opções de extração
     * @returns {Promise<string[]>} 📋 Array de URLs extraídas
     * @throws {Error} ❌ Erro ao acessar a URL
     */
    async extractFromURL(url, options = {}) {
        try {
            const response = await axios.get(url, {
                timeout: this.options.timeout,
                headers: {
                    'User-Agent': this.options.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                maxRedirects: this.options.maxRedirects,
                validateStatus: function (status) {
                    return status < 400;
                }
            });

            const finalURL = response.request?.res?.responseUrl || url;

            return this.extractFromHTML(response.data, finalURL, options);

        } catch (error) {
            throw new Error(`Falha ao acessar ${url}: ${error.message}`);
        }
    }
}

module.exports = URLExtractor;