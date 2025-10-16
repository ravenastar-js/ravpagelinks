
/**
 * 🛡️ Fallback automático para Playwright
 * Executado quando os browsers não estão disponíveis
 */

const fs = require('fs');

module.exports = class PlaywrightFallback {
    constructor() {
        this.browsersAvailable = this.checkBrowsers();
    }

    checkBrowsers() {
        try {
            const playwrightCore = require('playwright-core');
            const chromiumPath = playwrightCore.chromium.executablePath();
            return fs.existsSync(chromiumPath);
        } catch (error) {
            return false;
        }
    }

    async extractFromURL(url, options = {}) {
        if (!this.browsersAvailable) {
            throw new Error('Playwright browsers não disponíveis. Execute: npx playwright install');
        }

        // Se chegou aqui, os browsers estão disponíveis
        const { PlaywrightCrawler } = require('./PlaywrightCrawler');
        const crawler = new PlaywrightCrawler(options);
        return await crawler.extractFromURL(url, options);
    }

    async close() {
        // Nada para fechar no fallback
    }
};
