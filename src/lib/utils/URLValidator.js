/**
 * 🌐 Validador e resolvedor de URLs
 * @class
 */
class URLValidator {
    /**
     * 🔗 Resolve URL relativa para absoluta
     * @param {string} url - 🌐 URL para resolver
     * @param {string} baseURL - 🌐 URL base para resolução
     * @returns {string|null} 🌐 URL resolvida ou null
     */
    resolveURL(url, baseURL) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return null;
        }

        try {
            url = url.trim();
            url = url.replace(/\s+/g, '');

            if (this.isSpecialURL(url)) {
                return null;
            }

            if (url.startsWith('http://') || url.startsWith('https://')) {
                return this.normalizeURL(url);
            }

            if (url.startsWith('www.')) {
                return this.normalizeURL('https://' + url);
            }

            if (baseURL) {
                try {
                    const base = new URL(baseURL);

                    if (url.startsWith('//')) {
                        return this.normalizeURL(base.protocol + url);
                    }

                    if (url.startsWith('/')) {
                        return this.normalizeURL(base.origin + url);
                    }

                    const resolved = new URL(url, base).href;
                    return this.normalizeURL(resolved);
                } catch (baseError) {
                    if (url.startsWith('/')) {
                        return this.normalizeURL(baseURL.replace(/\/$/, '') + url);
                    } else {
                        return this.normalizeURL(baseURL + '/' + url);
                    }
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 🚫 Verifica se é URL especial
     * @param {string} url - 🌐 URL para verificar
     * @returns {boolean} ✅ True se for URL especial
     */
    isSpecialURL(url) {
        const specialProtocols = [
            'javascript:', 'mailto:', 'tel:', 'sms:', 'data:',
            'file:', 'ftp:', 'blob:', 'about:', 'chrome:',
            'edge:', 'opera:', 'vivaldi:', 'whatsapp:',
            'skype:', 'facetime:', 'itms-apps:', 'itms:',
            'market:', 'intent:', 'bitcoin:', 'ethereum:',
            'magnet:', 'spotify:', 'steam:'
        ];

        const specialStarts = [
            '#', '{{', '{%', '<?', '${', 'javascript:'
        ];

        return specialProtocols.some(protocol =>
            url.toLowerCase().startsWith(protocol)
        ) || specialStarts.some(start =>
            url.startsWith(start)
        ) || url.trim() === '#';
    }

    /**
     * 🧹 Normaliza URL
     * @param {string} url - 🌐 URL para normalizar
     * @returns {string} 🌐 URL normalizada
     */
    normalizeURL(url) {
        try {
            const urlObj = new URL(url);

            urlObj.hash = '';
            urlObj.username = '';
            urlObj.password = '';

            if (urlObj.protocol === 'http:' && urlObj.hostname !== 'localhost') {
                urlObj.protocol = 'https:';
            }

            if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
                (urlObj.protocol === 'http:' && urlObj.port === '80')) {
                urlObj.port = '';
            }

            urlObj.pathname = decodeURIComponent(urlObj.pathname);

            return urlObj.href;
        } catch (error) {
            return url.split('#')[0].replace(/\s/g, '');
        }
    }

    /**
     * 🔍 Extrai URL de código JavaScript
     * @param {string} jsCode - 📜 Código JavaScript
     * @param {string} baseURL - 🌐 URL base para resolução
     * @returns {string[]} 📋 Array de URLs extraídas
     */
    extractURLFromJavaScript(jsCode, baseURL) {
        if (!jsCode || typeof jsCode !== 'string') return [];

        const patterns = [
            /window\.location\s*=\s*['"`]([^'"`]+)['"`]/g,
            /window\.location\.href\s*=\s*['"`]([^'"`]+)['"`]/g,
            /location\.href\s*=\s*['"`]([^'"`]+)['"`]/g,
            /location\.assign\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /location\.replace\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /document\.location\s*=\s*['"`]([^'"`]+)['"`]/g,
            /window\.open\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /\.(?:src|href|action|data)\s*=\s*['"`]([^'"`]+)['"`]/g,
            /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /\.open\s*\(\s*['"`](?:GET|POST|PUT|DELETE)\s*,\s*['"`]([^'"`]+)['"`]/g,
            /axios\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /["'](?:url|src|href|image|link)["']\s*:\s*["']([^"']+)["']/g,
            /(?:href|src|url|action)\s*:\s*`([^`]+)`/g,
            /\/\/\s*(https?:\/\/[^\s]+)/g,
            /\/\*\s*(https?:\/\/[^*]+)\*\//g,
            /['"`](https?:\/\/[^'"`\s)]+)['"`]/g,
            /['"`](\/[^'"`\s)]+)['"`]/g
        ];

        const urls = new Set();

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(jsCode)) !== null) {
                const potentialURL = match[1] || match[0];
                if (potentialURL) {
                    const url = this.resolveURL(potentialURL, baseURL);
                    if (url && this.isValidURL(url)) {
                        urls.add(url);
                    }
                }
            }
        });

        return Array.from(urls);
    }

    /**
     * ✅ Valida URL
     * @param {string} url - 🌐 URL para validar
     * @returns {boolean} ✅ True se a URL for válida
     */
    isValidURL(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            const urlObj = new URL(url);

            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }

            if (!urlObj.hostname || urlObj.hostname.length < 1) {
                return false;
            }

            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 🌐 Extrai domínio da URL
     * @param {string} url - 🌐 URL para extrair domínio
     * @returns {string|null} 🌐 Domínio extraído
     */
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return null;
        }
    }

    /**
     * 🔄 Verifica se duas URLs são do mesmo domínio
     * @param {string} url1 - 🌐 Primeira URL
     * @param {string} url2 - 🌐 Segunda URL
     * @returns {boolean} ✅ True se forem do mesmo domínio
     */
    isSameDomain(url1, url2) {
        const domain1 = this.getDomain(url1);
        const domain2 = this.getDomain(url2);
        return domain1 && domain2 && domain1 === domain2;
    }
}

module.exports = URLValidator;