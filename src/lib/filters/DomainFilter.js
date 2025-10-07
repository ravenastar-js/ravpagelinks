/**
 * 🌐 Filtro de URLs por domínio
 * @class
 */
class DomainFilter {
    /**
     * 🎯 Filtra URLs por domínio
     * @param {string} url - URL para verificar
     * @param {string} domain - Domínio alvo para filtro
     * @returns {boolean} True se a URL corresponde ao domínio
     * @static
     */
    static filter(url, domain) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // 🔍 Filtro exato
            if (hostname === domain) {
                return true;
            }

            // 🏷️ Subdomínios
            if (hostname.endsWith('.' + domain)) {
                return true;
            }

            // 🌐 Domínio com www
            if (hostname === 'www.' + domain) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }
}

module.exports = DomainFilter;