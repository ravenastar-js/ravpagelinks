#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { RavPageLinks } = require('../src/core/Crawler');
const FileHandler = require('../src/lib/utils/FileHandler');
const AdvancedLogger = require('../src/lib/utils/AdvancedLogger');
const chalk = require('chalk');
const boxen = require('boxen').default;
const figlet = require('figlet');
const path = require('path');
const fs = require('fs');

/**
 * 🎯 Exibe banner visual da aplicação
 */
function showBanner() {
    console.log(
        chalk.cyan(
            figlet.textSync('RavPageLinks', {
                font: 'Small Slant',
                horizontalLayout: 'default',
                verticalLayout: 'default'
            })
        )
    );

    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#555555'
    };

    const welcomeText = chalk.white.bold('🚀 Ferramenta de Enumeração de URLs\n') +
        chalk.white('📝 Extrai URLs de páginas web com renderização JavaScript\n') +
        chalk.white('🔧 Múltiplos métodos de extração e filtros\n') +
        chalk.white('📊 Com sistema de Logs');

    console.log(boxen(welcomeText, boxenOptions));
}

const argv = yargs(hideBin(process.argv))
    .usage(`${chalk.cyan.bold('Uso:')} $0 <url> [opções]`)
    .command('$0 <url>', 'Extrai URLs de uma página web', (yargs) => {
        yargs.positional('url', {
            describe: 'URL para fazer crawling e extrair links',
            type: 'string'
        });
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        description: '📁 Diretório de saída para URLs extraídas',
        default: 'results'
    })
    .option('filter', {
        alias: 'f',
        type: 'string',
        description: '🔍 Filtra URLs por padrão ou arquivo de filtro'
    })
    .option('filter-file', {
        type: 'string',
        description: '📄 Usa arquivo de filtro personalizado',
        default: 'filtros.txt'
    })
    .option('filter-type', {
        type: 'string',
        choices: ['domain', 'regex', 'file'],
        description: '🎯 Tipo de filtro a ser aplicado',
        default: 'file'
    })
    .option('unique', {
        alias: 'u',
        type: 'boolean',
        description: '✨ Remove URLs duplicadas'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: '📢 Habilita logging detalhado'
    })
    .option('timeout', {
        type: 'number',
        description: '⏰ Timeout da requisição em milissegundos',
        default: 30000
    })
    .option('user-agent', {
        type: 'string',
        description: '👤 String personalizada de User-Agent'
    })
    .option('no-playwright', {
        type: 'boolean',
        description: '🚫 Desabilita Playwright'
    })
    .option('headless', {
        type: 'boolean',
        description: '🌙 Executa navegador em modo headless',
        default: true
    })
    .option('wait-time', {
        type: 'number',
        description: '⏳ Tempo de espera para carregamento JavaScript em ms',
        default: 5000
    })
    .option('scroll', {
        type: 'boolean',
        description: '📜 Rola a página para carregar conteúdo lazy'
    })
    .option('browser', {
        type: 'string',
        choices: ['chromium', 'firefox', 'webkit'],
        description: '🌐 Navegador a ser usado pelo Playwright',
        default: 'chromium'
    })
    .option('no-logs', {
        type: 'boolean',
        description: '📝 Desabilita logging em arquivo'
    })
    .option('log-dir', {
        type: 'string',
        description: '📂 Diretório para arquivos de log',
        default: 'logs'
    })
    .example([
        ['$0 https://exemplo.com', 'Extração básica de URLs'],
        ['$0 https://exemplo.com -o resultados -v', 'Salva em diretório com logging detalhado'],
        ['$0 https://exemplo.com -f exemplo.com --unique', 'Filtra por domínio e remove duplicatas']
    ])
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .argv;

const logger = new AdvancedLogger({
    verbose: argv.verbose,
    logToFile: !argv.noLogs,
    logDir: argv.logDir,
    colors: true,
    timestamp: true
});

/**
 * 🚀 Função principal que executa o processo de extração de URLs
 * @async
 * @function main
 * @throws {Error} ❌ Se a URL for inválida ou ocorrer erro no crawling
 */
async function main() {
    try {
        showBanner();

        const url = argv.url;
        const outputDir = argv.output;
        const filterPattern = argv.filter;
        const filterFile = argv.filterFile;
        const filterType = argv.filterType;
        const unique = argv.unique || false;
        const timeout = argv.timeout || 30000;
        const userAgent = argv.userAgent;

        if (!url) {
            logger.error('URL é obrigatória');
            process.exit(1);
        }

        try {
            new URL(url);
        } catch (error) {
            logger.error(`URL inválida: ${url}`);
            process.exit(1);
        }

        logger.start(`Iniciando enumeração de URLs: ${chalk.cyan(url)}`);
        logger.file(`Diretório de saída: ${chalk.blue(outputDir)}`);
        logger.time(`Timeout: ${chalk.yellow(timeout + 'ms')}`);

        let filterConfig = {};

        if (filterFile) {
            filterConfig.type = 'file';
            filterConfig.value = filterFile;
            logger.filter(`Usando arquivo de filtro: ${chalk.magenta(filterFile)}`);

            if (!fs.existsSync(filterFile)) {
                logger.warn(`Arquivo de filtro não encontrado: ${filterFile}`);
                logger.info(`Criando arquivo de exemplo: ${chalk.blue(filterFile)}`);
                FileHandler.createEmptyFilterFile(filterFile);
            }
        } else if (filterPattern) {
            if (filterType === 'domain') {
                filterConfig.type = 'domain';
                filterConfig.value = filterPattern;
                logger.filter(`Filtro de domínio: ${chalk.magenta(filterPattern)}`);
            } else if (filterType === 'regex') {
                filterConfig.type = 'regex';
                filterConfig.value = filterPattern;
                logger.filter(`Filtro regex: ${chalk.magenta(filterPattern)}`);
            } else {
                if (filterPattern.includes('*') || filterPattern.startsWith('^')) {
                    filterConfig.type = 'regex';
                    filterConfig.value = filterPattern;
                    logger.filter(`Filtro regex detectado automaticamente: ${chalk.magenta(filterPattern)}`);
                } else {
                    filterConfig.type = 'domain';
                    filterConfig.value = filterPattern;
                    logger.filter(`Filtro de domínio detectado automaticamente: ${chalk.magenta(filterPattern)}`);
                }
            }
        }

        if (unique) {
            logger.info(`Remoção de duplicatas: ${chalk.green('Habilitada')}`);
        }

        const crawler = new RavPageLinks({
            timeout,
            userAgent,
            verbose: argv.verbose,
            usePlaywright: !argv.noPlaywright,
            playwrightOptions: {
                headless: argv.headless,
                waitForTimeout: argv.waitTime,
                browserType: argv.browser
            }
        });

        logger.info(`Método de extração: ${chalk.cyan(!argv.noPlaywright ? 'Playwright (renderização JavaScript)' : 'HTML tradicional')}`);

        if (!argv.noPlaywright) {
            logger.debug(`Navegador: ${argv.browser}, Headless: ${argv.headless}, Tempo de espera: ${argv.waitTime}ms`);
        }

        const startTime = Date.now();

        const links = await crawler.crawl(url, {
            filter: filterConfig,
            unique: unique,
            usePlaywright: !argv.noPlaywright,
            playwrightOptions: {
                scrollToBottom: argv.scroll || false,
                waitForTimeout: argv.waitTime || 5000
            }
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const pageName = urlObj.pathname.split('/').filter(Boolean).join('_') || 'index';
        const safePageName = pageName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);

        const domainDir = path.join(outputDir, domain);
        const outputFile = path.join(domainDir, `links_${safePageName}.txt`);

        if (!fs.existsSync(domainDir)) {
            fs.mkdirSync(domainDir, { recursive: true });
            logger.file(`Diretório criado: ${chalk.blue(domainDir)}`);
        }

        FileHandler.saveURLsToFile(links, outputFile);

        logger.separator();
        logger.stats('ESTATÍSTICAS DE EXTRAÇÃO');
        logger.stats(`Total de URLs encontradas: ${chalk.cyan(links.length)}`);
        logger.stats(`Tempo de execução: ${chalk.yellow(duration + 'ms')}`);
        logger.stats(`Domínio analisado: ${chalk.green(domain)}`);
        logger.stats(`Página processada: ${chalk.blue(urlObj.pathname || '/')}`);
        logger.stats(`Arquivo de saída: ${chalk.blue(outputFile)}`);

        if (filterConfig.type) {
            logger.stats(`Filtro aplicado: ${chalk.magenta(filterConfig.type + ' - ' + filterConfig.value)}`);
        }

        if (links.length > 0 && argv.verbose) {
            logger.separator();
            logger.info(`${chalk.cyan('URLs de exemplo:')}`);
            links.slice(0, 5).forEach((link, index) => {
                logger.link(`${index + 1}. ${link}`);
            });
            if (links.length > 5) {
                logger.info(`... e mais ${links.length - 5} URLs`);
            }
        }

        logger.complete(`Enumeração de URLs concluída com sucesso!`);
        logger.file(`URLs salvas em: ${chalk.blue(outputFile)}`);
        logger.endSession();

    } catch (error) {
        logger.error(`Falha na execução: ${error.message}`);

        if (argv.verbose) {
            logger.debug(error.stack);
        }

        logger.endSession();
        process.exit(1);
    }
}

/**
 * 🛑 Manipula interrupção por Ctrl+C
 * @function SIGINT handler
 */
process.on('SIGINT', () => {
    logger.error('Processo interrompido pelo usuário');
    logger.endSession();
    process.exit(0);
});

main();