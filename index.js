// 🆕 Entry point principal com detecção de plataforma
const fs = require('fs');
const path = require('path');

// Verifica se é Android
const isAndroid = process.platform === 'android' || fs.existsSync(path.join(__dirname, '.android-platform'));

if (isAndroid) {
  // 🆕 No Android, exporta apenas os módulos que não usam Playwright
  const { RavPageLinks, extractLinksFromURL, extractLinksFromHTML } = require('./src/core/Crawler');

  module.exports = {
    RavPageLinks,
    extractLinksFromURL,
    extractLinksFromHTML,
    platform: 'android'
  };

  // 🆕 Adiciona método para verificar compatibilidade
  module.exports.getPlatformInfo = () => ({
    platform: process.platform,
    isAndroid: true,
    playwrightAvailable: false,
    features: ['html-extraction', 'filtering', 'validation']
  });

  // 🎛️ Exportações de filtros (sem dependências do Playwright)
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
} else {
  // 🆕 Em outras plataformas, exporta tudo normalmente
  const { RavPageLinks, extractLinksFromURL, extractLinksFromHTML } = require('./src/core/Crawler');

  module.exports = {
    RavPageLinks,
    extractLinksFromURL,
    extractLinksFromHTML,
    platform: process.platform
  };

  module.exports.getPlatformInfo = () => ({
    platform: process.platform,
    isAndroid: false,
    playwrightAvailable: true,
    features: ['html-extraction', 'javascript-rendering', 'filtering', 'validation']
  });

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
    Logger: require('./src/lib/utils/Logger'),
    AdvancedLogger: require('./src/lib/utils/AdvancedLogger')
  };
}

/**
 * 📦 Módulo principal do RavPageLinks
 * @module RavPageLinks
 */