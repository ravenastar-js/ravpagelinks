const chalk = require('chalk');

/**
 * 📝 Logger simples com cores e emojis
 * @class
 */
class Logger {
    /**
     * 🏗️ Construtor do Logger
     * @constructor
     * @param {boolean} verbose - 📢 Habilita logs verbosos
     */
    constructor(verbose = false) {
        this.verbose = verbose;
    }

    /**
     * 💡 Log de informação
     * @param {string} message - 📝 Mensagem informativa
     */
    info(message) {
        if (this.verbose) {
            console.log(chalk.cyan('ℹ️ ') + chalk.gray(message));
        }
    }

    /**
     * ✅ Log de sucesso
     * @param {string} message - 📝 Mensagem de sucesso
     */
    success(message) {
        console.log(chalk.green('✅ ') + message);
    }

    /**
     * ❌ Log de erro
     * @param {string} message - 📝 Mensagem de erro
     */
    error(message) {
        console.log(chalk.red('❌ ') + message);
    }

    /**
     * ⚠️ Log de aviso
     * @param {string} message - 📝 Mensagem de aviso
     */
    warn(message) {
        console.log(chalk.yellow('⚠️ ') + message);
    }

    /**
     * 🔍 Log de debug
     * @param {string} message - 📝 Mensagem de debug
     */
    debug(message) {
        if (this.verbose) {
            console.log(chalk.magenta('🐛 ') + chalk.gray(message));
        }
    }
}

module.exports = Logger;