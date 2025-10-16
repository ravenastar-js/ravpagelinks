const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * 📝 Logger avançado com cores, arquivos e formatação visual
 * @class
 */
class AdvancedLogger {
    /**
     * 🏗️ Construtor do AdvancedLogger
     * @constructor
     * @param {Object} options - ⚙️ Configurações do logger
     * @param {boolean} options.verbose - 📢 Modo verboso
     * @param {boolean} options.logToFile - 📁 Log em arquivo
     * @param {string} options.logDir - 📂 Diretório de logs
     * @param {boolean} options.colors - 🎨 Cores no console
     * @param {boolean} options.timestamp - ⏰ Timestamp nas mensagens
     */
    constructor(options = {}) {
        this.options = {
            verbose: false,
            logToFile: false,
            logDir: 'logs',
            colors: true,
            timestamp: true,
            ...options
        };

        this.logFile = null;
        this.sessionId = moment().format('YYYYMMDD_HHmmss');

        if (this.options.logToFile) {
            this.setupLogFile();
        }
    }

    /**
     * 📁 Configura arquivo de log
     */
    setupLogFile() {
        if (!this.options.logToFile) {
            return;
        }

        const logDir = path.resolve(process.cwd(), this.options.logDir);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logFile = path.join(logDir, `ravpagelinks_${this.sessionId}.log`);

        this.writeToFile(`🚀 SESSÃO RAVPAGELINKS INICIADA - ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
        this.writeToFile(`📁 Arquivo de log: ${this.logFile}`);
        this.writeToFile('='.repeat(80));
    }

    /**
     * ✍️ Escreve no arquivo de log
     * @param {string} message - 📝 Mensagem para registrar
     */
    writeToFile(message) {
        if (this.logFile && this.options.logToFile) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            const logMessage = `[${timestamp}] ${message.replace(/\x1b\[[0-9;]*m/g, '')}\n`;

            fs.appendFileSync(this.logFile, logMessage, 'utf8');
        }
    }

    /**
     * 🎨 Formata mensagem com timestamp
     * @param {string} message - 📝 Mensagem para formatar
     * @param {string} type - 🏷️ Tipo da mensagem
     * @returns {string} 📝 Mensagem formatada
     */
    formatMessage(message, type = 'info') {
        const timestamp = this.options.timestamp ? chalk.gray(`[${moment().format('HH:mm:ss')}] `) : '';

        if (!this.options.colors) {
            return `${timestamp}${message}`;
        }

        const icons = {
            info: '🔵',
            success: '🟢',
            error: '🔴',
            warn: '🟡',
            debug: '🟣',
            start: '🚀',
            complete: '✅',
            file: '📁',
            link: '🔗',
            time: '⏱️',
            filter: '🔧',
            stats: '📊'
        };

        const colors = {
            info: chalk.cyanBright,
            success: chalk.greenBright,
            error: chalk.redBright,
            warn: chalk.yellowBright,
            debug: chalk.hex('#ff9fcfff'),
            start: chalk.cyanBright.bold,
            complete: chalk.greenBright.bold,
            file: chalk.cyanBright,
            link: chalk.cyanBright,
            time: chalk.yellowBright,
            filter: chalk.hex('#ff9fcfff'),
            stats: chalk.cyanBright.bold
        };


        const icon = icons[type] || '🟣';
        const color = colors[type] || chalk.white;

        return `${timestamp}${icon} ${color(message)}`;
    }

    /**
     * 💡 Log de informação
     * @param {string} message - 📝 Mensagem informativa
     */
    info(message) {
        const formatted = this.formatMessage(message, 'info');
        console.log(formatted);
        this.writeToFile(`INFO: ${message}`);
    }

    /**
     * ✅ Log de sucesso
     * @param {string} message - 📝 Mensagem de sucesso
     */
    success(message) {
        const formatted = this.formatMessage(message, 'success');
        console.log(formatted);
        this.writeToFile(`SUCESSO: ${message}`);
    }

    /**
     * ❌ Log de erro
     * @param {string} message - 📝 Mensagem de erro
     */
    error(message) {
        const formatted = this.formatMessage(message, 'error');
        console.error(formatted);
        this.writeToFile(`ERRO: ${message}`);
    }

    /**
     * ⚠️ Log de aviso
     * @param {string} message - 📝 Mensagem de aviso
     */
    warn(message) {
        const formatted = this.formatMessage(message, 'warn');
        console.log(formatted);
        this.writeToFile(`AVISO: ${message}`);
    }

    /**
     * 🔍 Log de debug
     * @param {string} message - 📝 Mensagem de debug
     */
    debug(message) {
        const formatted = this.formatMessage(message, 'debug');
        console.log(formatted);
        this.writeToFile(`DEBUG: ${message}`);
    }

    /**
     * 🚀 Log de início
     * @param {string} message - 📝 Mensagem de início
     */
    start(message) {
        const formatted = this.formatMessage(message, 'start');
        console.log(formatted);
        this.writeToFile(`INÍCIO: ${message}`);
    }

    /**
     * 🏁 Log de conclusão
     * @param {string} message - 📝 Mensagem de conclusão
     */
    complete(message) {
        const formatted = this.formatMessage(message, 'complete');
        console.log(formatted);
        this.writeToFile(`CONCLUÍDO: ${message}`);
    }

    /**
     * 📁 Log de arquivo
     * @param {string} message - 📝 Mensagem relacionada a arquivos
     */
    file(message) {
        const formatted = this.formatMessage(message, 'file');
        console.log(formatted);
        this.writeToFile(`ARQUIVO: ${message}`);
    }

    /**
     * 🔗 Log de link
     * @param {string} message - 📝 Mensagem relacionada a links
     */
    link(message) {
        const formatted = this.formatMessage(message, 'link');
        console.log(formatted);
        this.writeToFile(`LINK: ${message}`);
    }

    /**
     * ⏱️ Log de tempo
     * @param {string} message - 📝 Mensagem relacionada a tempo
     */
    time(message) {
        const formatted = this.formatMessage(message, 'time');
        console.log(formatted);
        this.writeToFile(`TEMPO: ${message}`);
    }

    /**
     * 🔧 Log de filtro
     * @param {string} message - 📝 Mensagem relacionada a filtros
     */
    filter(message) {
        const formatted = this.formatMessage(message, 'filter');
        console.log(formatted);
        this.writeToFile(`FILTRO: ${message}`);
    }

    /**
     * 📊 Log de estatísticas
     * @param {string} message - 📝 Mensagem de estatísticas
     */
    stats(message) {
        const formatted = this.formatMessage(message, 'stats');
        console.log(formatted);
        this.writeToFile(`ESTATÍSTICAS: ${message}`);
    }

    /**
     * 📏 Cria separador visual
     * @param {string} char - 📝 Caractere do separador
     * @param {number} length - 📏 Comprimento do separador
     */
    separator(char = '─', length = 60) {
        const separator = char.repeat(length);
        const formatted = this.formatMessage(separator, 'debug');
        console.log(formatted);
        this.writeToFile(separator);
    }

    /**
     * 📦 Log de objeto
     * @param {Object} obj - 📦 Objeto para log
     * @param {string} title - 🏷️ Título do objeto
     */
    object(obj, title = 'Objeto') {
        if (this.options.verbose) {
            this.debug(`${title}:`);
            console.dir(obj, { depth: 3, colors: this.options.colors });
            this.writeToFile(`${title}: ${JSON.stringify(obj, null, 2)}`);
        }
    }

    /**
     * 🏁 Finaliza sessão de log
     */
    endSession() {
        if (this.logFile && this.options.logToFile) {
            this.writeToFile('='.repeat(80));
            this.writeToFile(`🏁 SESSÃO RAVPAGELINKS FINALIZADA - ${moment().format('YYYY-MM-DD HH:mm:ss')}`);

            const logPathMessage = `Log completo salvo em: ${this.logFile}`;
            const formatted = this.formatMessage(logPathMessage, 'file');
            console.log(formatted);
        }
    }

    /**
     * 📍 Obtém caminho do arquivo de log
     * @returns {string} 📁 Caminho do arquivo de log
     */
    getLogFilePath() {
        return this.logFile;
    }
}

module.exports = AdvancedLogger;