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
const isAndroid = process.platform === 'android';

/**
 * 🎯 Exibe banner visual da aplicação
 */
function showBanner() {
    const fs = require('fs');
    const path = require('path');
    const isAndroid = process.platform === 'android' || fs.existsSync(path.join(__dirname, '..', '.android-platform'));

    const fontConfig = isAndroid ? {
        font: 'Small',
        horizontalLayout: 'fitted',
        verticalLayout: 'fitted'
    } : {
        font: 'Small Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    };

    console.log(
        chalk.greenBright(
            figlet.textSync('RavPageLinks', fontConfig)
        )
    );

    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'greenBright'
    };

    const welcomeText = chalk.white.bold('🚀 Ferramenta de Enumeração de URLs\n\n') +
        chalk.white('📝 Extrai URLs de páginas web com renderização JavaScript\n') +
        chalk.white('🔧 Múltiplos métodos de extração e filtros\n') +
        chalk.white('📊 Logs opcionais e relatórios detalhados');

    console.log(boxen(welcomeText, boxenOptions));

    if (isAndroid) {
        console.log(chalk.yellow('📱 Aviso: Executando em Android - Playwright desativado automaticamente'));
    }
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
    .option('enable-logs', {
        type: 'boolean',
        description: '📝 Habilita sistema de logs em arquivo',
        default: false
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
        description: isAndroid ?
            '🚫 Playwright já desativado no Android' :
            '🚫 Desabilita Playwright',
        default: isAndroid
    })
    .option('headless', {
        type: 'boolean',
        description: isAndroid ?
            '🌙 Não disponível no Android' :
            '🌙 Executa navegador em modo headless',
        default: true,
        hidden: isAndroid
    })
    .option('wait-time', {
        type: 'number',
        description: isAndroid ?
            '⏳ Não aplicável no Android' :
            '⏳ Tempo de espera para carregamento JavaScript em ms',
        default: 5000,
        hidden: isAndroid
    })
    .option('scroll', {
        type: 'boolean',
        description: isAndroid ?
            '📜 Não disponível no Android' :
            '📜 Rola a página para carregar conteúdo lazy',
        hidden: isAndroid
    })
    .option('browser', {
        type: 'string',
        choices: ['chromium', 'firefox', 'webkit'],
        description: isAndroid ?
            '🌐 Não disponível no Android' :
            '🌐 Navegador a ser usado pelo Playwright',
        default: 'chromium',
        hidden: isAndroid
    })
    .option('deep-js-scan', {
        type: 'boolean',
        description: '🔍 Varredura profunda em JavaScript e eventos',
        default: true
    })
    .option('log-dir', {
        type: 'string',
        description: '📂 Diretório para arquivos de log',
        default: 'logs'
    })
    .example([
        ['$0 https://exemplo.com', 'Extração básica de URLs'],
        ['$0 https://exemplo.com -o resultados -v', 'Salva em diretório com logging detalhado'],
        ['$0 https://exemplo.com -f exemplo.com --unique', 'Filtra por domínio e remove duplicatas'],
        ['$0 https://exemplo.com --enable-logs', 'Habilita sistema de logs em arquivo']
    ])
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .argv;

const shouldEnableLogs = argv.enableLogs || argv.verbose;
const logger = shouldEnableLogs ? new AdvancedLogger({
    verbose: argv.verbose,
    logToFile: argv.enableLogs,
    logDir: argv.logDir,
    colors: true,
    timestamp: true
}) : null;

/**
 * 🚀 Função principal que executa o processo de extração de URLs
 * @async
 */
async function main() {
    let crawler;

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
            console.error(chalk.red('❌ URL é obrigatória'));
            process.exit(1);
        }

        try {
            new URL(url);
        } catch (error) {
            console.error(chalk.red(`❌ URL inválida: ${url}`));
            process.exit(1);
        }

        if (logger) {
            logger.start(`Iniciando enumeração de URLs: ${chalk.cyan(url)}`);
            logger.file(`Diretório de saída: ${chalk.blue(outputDir)}`);
            logger.time(`Timeout: ${chalk.yellow(timeout + 'ms')}`);

            if (isAndroid) {
                logger.info('📱 Android detectado - Modo HTML tradicional');
            }
        } else {
            console.log(chalk.white.bold('🚀 Iniciando enumeração de URLs:'), chalk.cyan(url));
        }

        let filterConfig = {};

        if (filterFile) {
            filterConfig.type = 'file';
            filterConfig.value = filterFile;
            if (logger) {
                logger.filter(`Usando arquivo de filtro: ${chalk.magenta(filterFile)}`);
            } else {
                console.log(chalk.white.bold('🔧 Usando arquivo de filtro:'), chalk.magentaBright(filterFile));
            }

            if (!fs.existsSync(filterFile)) {
                const warnMsg = `Arquivo de filtro não encontrado: ${filterFile}`;
                if (logger) {
                    logger.warn(warnMsg);
                    logger.blueBright(`Criando arquivo de exemplo: ${chalk.blue(filterFile)}`);
                } else {
                    console.log(chalk.yellow('⚠️ ' + warnMsg));
                    console.log(chalk.blueBright('📄 Criando arquivo de exemplo:'), filterFile);
                }
                FileHandler.createEmptyFilterFile(filterFile);
            }
        } else if (filterPattern) {
            if (filterType === 'domain') {
                filterConfig.type = 'domain';
                filterConfig.value = filterPattern;
                if (logger) {
                    logger.filter(`Filtro de domínio: ${chalk.magenta(filterPattern)}`);
                }
            } else if (filterType === 'regex') {
                filterConfig.type = 'regex';
                filterConfig.value = filterPattern;
                if (logger) {
                    logger.filter(`Filtro regex: ${chalk.magenta(filterPattern)}`);
                }
            } else {
                if (filterPattern.includes('*') || filterPattern.startsWith('^')) {
                    filterConfig.type = 'regex';
                    filterConfig.value = filterPattern;
                    if (logger) {
                        logger.filter(`Filtro regex detectado automaticamente: ${chalk.magenta(filterPattern)}`);
                    }
                } else {
                    filterConfig.type = 'domain';
                    filterConfig.value = filterPattern;
                    if (logger) {
                        logger.filter(`Filtro de domínio detectado automaticamente: ${chalk.magenta(filterPattern)}`);
                    }
                }
            }
        }

        if (unique) {
            const uniqueMsg = `Remoção de duplicatas: ${chalk.green('Habilitada')}`;
            if (logger) {
                logger.info(uniqueMsg);
            } else {
                console.log(chalk.green('✨ ' + uniqueMsg));
            }
        }
        const finalUsePlaywright = !isAndroid && !argv.noPlaywright;

        crawler = new RavPageLinks({
            timeout,
            userAgent,
            verbose: argv.verbose,
            usePlaywright: finalUsePlaywright,
            enableLogs: argv.enableLogs,
            playwrightOptions: {
                headless: argv.headless,
                waitForTimeout: argv.waitTime,
                browserType: argv.browser
            }
        });

        const methodMsg = isAndroid ?
            'Método de extração: HTML tradicional (Android)' :
            `Método de extração: ${finalUsePlaywright ? 'Playwright (renderização JavaScript)' : 'HTML tradicional'}`;

        if (logger) {
            logger.info(methodMsg);
        } else {
            console.log(chalk.cyan(isAndroid ? '📱 ' : '🌐 ') + methodMsg);
        }

        if (!argv.noPlaywright && logger) {
            logger.debug(`Navegador: ${argv.browser}, Headless: ${argv.headless}, Tempo de espera: ${argv.waitTime}ms`);
        }

        const startTime = Date.now();

        const links = await crawler.crawl(url, {
            filter: filterConfig,
            unique: unique,
            usePlaywright: finalUsePlaywright,
            deepJsScan: argv.deepJsScan,
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
            const dirMsg = `Diretório criado: ${chalk.yellowBright(domainDir)}`;
            if (logger) {
                logger.file(dirMsg);
            } else {
                console.log(chalk.yellowBright('📁 ' + dirMsg));
            }
        }

        FileHandler.saveURLsToFile(links, outputFile);

        if (logger) {
            logger.separator();
            logger.stats('ESTATÍSTICAS DE EXTRAÇÃO');
            logger.stats(`Total de URLs encontradas: ${chalk.cyan(links.length)}`);
            logger.stats(`Tempo de execução: ${chalk.yellow(duration + 'ms')}`);
            logger.stats(`Domínio analisado: ${chalk.green(domain)}`);
            logger.stats(`Página processada: ${chalk.blue(urlObj.pathname || '/')}`);
            logger.stats(`Arquivo de saída: ${chalk.blue(outputFile)}`);

            if (isAndroid) {
                logger.stats(`Plataforma: ${chalk.yellow('Android - HTML Tradicional')}`);
            }

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
        } else {
            console.log(chalk.greenBright('✅ Enumeração de URLs concluída com sucesso!'));
            console.log(chalk.white.bold('📊 Estatísticas:'));
            console.log(`   • URLs encontradas: ${chalk.cyan(links.length)}`);
            console.log(`   • Tempo de execução: ${chalk.yellow(duration + 'ms')}`);
            console.log(`   • Arquivo salvo: ${chalk.cyan(outputFile)}`);
            if (isAndroid) {
                console.log(`   • Plataforma: ${chalk.yellow('Android')}`);
            }
            if (filterConfig.type) {
                console.log(`   • Filtro aplicado: ${chalk.magenta(filterConfig.type)}`);
            }
        }

    } catch (error) {
        const errorMsg = `Falha na execução: ${error.message}`;
        if (logger) {
            logger.error(errorMsg);
            if (argv.verbose) {
                logger.debug(error.stack);
            }
            logger.endSession();
        } else {
            console.error(chalk.red('❌ ' + errorMsg));
            if (argv.verbose) {
                console.error(chalk.gray(error.stack));
            }
        }
        process.exit(1);
    } finally {
        if (crawler) {
            try {
                await crawler.close();
            } catch (closeError) {
                if (logger) {
                    logger.debug(`Erro ao fechar crawler: ${closeError.message}`);
                }
            }
        }

        process.exit(0);
    }
}

/**
 * 🛑 Manipula interrupção por Ctrl+C
 */
process.on('SIGINT', () => {
    const interruptMsg = 'Processo interrompido pelo usuário';
    if (logger) {
        logger.error(interruptMsg);
        logger.endSession();
    } else {
        console.log(chalk.yellow('⚠️ ' + interruptMsg));
    }
    process.exit(0);
});

main();