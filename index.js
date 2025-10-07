const { RavPageLinks } = require('./src/core/Crawler');
const { extractLinksFromHTML, extractLinksFromURL } = require('./src/core/Crawler');

/**
 * 📦 Módulo principal do RavPageLinks
 * @module RavPageLinks
 */

// 🚀 Exportações principais
module.exports = {
  RavPageLinks,
  extractLinksFromHTML,
  extractLinksFromURL
};

// 🎛️ Exportações de filtros
module.exports.filters = {
  DomainFilter: require('./src/lib/filters/DomainFilter'),
  RegexFilter: require('./src/lib/filters/RegexFilter'),
  FilterManager: require('./src/lib/filters/FilterManager')
};

// 🛠️ Exportações de utilitários
module.exports.utils = {
  FileHandler: require('./src/lib/utils/FileHandler'),
  URLValidator: require('./src/lib/utils/URLValidator'),
  Logger: require('./src/lib/utils/Logger')
};