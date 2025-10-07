/**
 * 🔍 Filtro de URLs por expressão regular
 * @class
 */
class RegexFilter {
    /**
     * 🎯 Filtra URLs por expressão regular
     * @param {string} url - 🌐 URL para verificar
     * @param {string} pattern - 📝 Padrão regex ou string
     * @returns {boolean} ✅ True se a URL corresponde ao padrão
     * @static
     */
    static filter(url, pattern) {
        try {
            const regex = new RegExp(pattern, 'i');
            return regex.test(url);
        } catch (error) {
            return url.includes(pattern);
        }
    }
}

module.exports = RegexFilter;