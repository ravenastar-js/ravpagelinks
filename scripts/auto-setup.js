const { execSync, spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 🛠️ Auto Setup Automático para RavPageLinks
 * Executado automaticamente durante npm install
 */

class AutoSetup {
    constructor() {
        this.isSilent = process.argv.includes('--silent');
        this.platform = os.platform();
        this.isAndroid = this.platform === 'android';
        this.isWindows = this.platform === 'win32';
        this.isGlobal = this.checkGlobalInstall();
        
        // 🆕 Lê dependências diretamente do package.json
        this.dependencies = this.readDependenciesFromPackageJSON();
    }

    /**
     * 📦 Lê dependências do package.json
     */
    readDependenciesFromPackageJSON() {
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            
            if (!fs.existsSync(packagePath)) {
                throw new Error('package.json não encontrado');
            }

            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const dependencies = {
                core: [],
                optional: []
            };

            // 🆕 Processa dependências regulares
            if (packageData.dependencies) {
                for (const [pkg, version] of Object.entries(packageData.dependencies)) {
                    dependencies.core.push(`${pkg}@${version}`);
                }
            }

            // 🆕 Processa dependências opcionais
            if (packageData.optionalDependencies && !this.isAndroid) {
                for (const [pkg, version] of Object.entries(packageData.optionalDependencies)) {
                    dependencies.optional.push(`${pkg}@${version}`);
                }
            }

            if (!this.isSilent) {
                console.log('📦 Dependências detectadas:');
                console.log(`   - Core: ${dependencies.core.length} pacotes`);
                console.log(`   - Optional: ${dependencies.optional.length} pacotes`);
            }

            return dependencies;

        } catch (error) {
            if (!this.isSilent) {
                console.error('❌ Erro ao ler package.json:', error.message);
            }
            
            // 🆕 Fallback para dependências padrão
            return {
                core: [
                    "axios@^1.6.0",
                    "boxen@^8.0.1", 
                    "chalk@^4.1.2",
                    "figlet@^1.9.3",
                    "jsdom@^23.2.0",
                    "moment@^2.29.4",
                    "yargs@^17.7.2"
                ],
                optional: this.isAndroid ? [] : ["playwright@^1.40.0"]
            };
        }
    }

    /**
     * 🔍 Verifica se é instalação global
     */
    checkGlobalInstall() {
        try {
            const globalPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
            const currentPath = __dirname;
            return currentPath.includes(globalPath);
        } catch (error) {
            return false;
        }
    }

    /**
     * 🎨 Logger silencioso ou normal
     */
    log(message, type = 'info') {
        if (this.isSilent) return;

        const colors = {
            info: '\x1b[36m%s\x1b[0m',
            success: '\x1b[32m%s\x1b[0m',
            warning: '\x1b[33m%s\x1b[0m',
            error: '\x1b[31m%s\x1b[0m'
        };

        const icons = {
            info: '🔵',
            success: '🟢', 
            warning: '🟡',
            error: '🔴'
        };

        console.log(colors[type], `${icons[type]} ${message}`);
    }

    /**
     * 🔧 Executa comando silenciosamente
     */
    runCommand(command, description = '') {
        try {
            if (description && !this.isSilent) {
                this.log(description, 'info');
            }

            const result = spawnSync(command, { 
                shell: true,
                stdio: this.isSilent ? 'pipe' : 'inherit',
                timeout: 300000
            });

            return result.status === 0;
        } catch (error) {
            if (!this.isSilent) {
                this.log(`Erro no comando: ${error.message}`, 'warning');
            }
            return false;
        }
    }

    /**
     * 🚀 Instala browsers do Playwright em background
     */
    installPlaywrightBrowsers() {
        if (this.isAndroid) return true;

        this.log('📥 Baixando navegadores do Playwright...', 'info');
        
        try {
            const playwrightProcess = spawn('npx', ['playwright', 'install', 'chromium'], {
                stdio: this.isSilent ? 'pipe' : 'inherit',
                detached: true,
                shell: true
            });

            playwrightProcess.unref();

            if (!this.isSilent) {
                this.log('Navegadores do Playwright sendo baixados em background...', 'info');
                this.log('Isso pode levar alguns minutos na primeira vez...', 'warning');
            }

            return true;
        } catch (error) {
            if (!this.isSilent) {
                this.log('Não foi possível instalar navegadores do Playwright automaticamente', 'warning');
                this.log('Execute manualmente: npx playwright install', 'info');
            }
            return false;
        }
    }

    /**
     * 🔍 Verifica se os browsers do Playwright estão instalados
     */
    arePlaywrightBrowsersInstalled() {
        if (this.isAndroid) return false;

        try {
            const playwrightCore = require('playwright-core');
            
            const browsers = ['chromium', 'firefox', 'webkit'];
            for (const browserType of browsers) {
                try {
                    const browser = playwrightCore[browserType];
                    const executablePath = browser.executablePath();
                    if (executablePath && fs.existsSync(executablePath)) {
                        return true;
                    }
                } catch (e) {
                    // Browser não disponível, continua verificando
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 📦 Instala dependências automaticamente
     */
    async installDependencies() {
        if (this.isSilent) {
            // Modo silencioso - instala tudo sem output
            try {
                // 🆕 Instala dependências core em lote
                if (this.dependencies.core.length > 0) {
                    const coreDeps = this.dependencies.core.join(' ');
                    execSync(`npm install ${coreDeps} --no-audit --no-fund --loglevel=error`, { 
                        stdio: 'pipe',
                        timeout: 120000
                    });
                }

                // 🆕 Instala dependências opcionais
                if (this.dependencies.optional.length > 0 && !this.isAndroid) {
                    try {
                        const optionalDeps = this.dependencies.optional.join(' ');
                        execSync(`npm install ${optionalDeps} --save-optional --no-audit --no-fund --loglevel=error`, {
                            stdio: 'pipe',
                            timeout: 180000
                        });
                        
                        // Inicia instalação dos browsers em background
                        this.installPlaywrightBrowsers();
                    } catch (playwrightError) {
                        // Ignora erros do Playwright em modo silencioso
                    }
                }
                
                return true;
            } catch (error) {
                return false;
            }
        } else {
            // Modo normal com feedback
            this.log('Instalando dependências principais...', 'info');
            
            // 🆕 Instala dependências core em lote
            if (this.dependencies.core.length > 0) {
                const coreDeps = this.dependencies.core.join(' ');
                const success = this.runCommand(`npm install ${coreDeps}`, 'Instalando dependências core');
                if (!success) {
                    this.log('Falha ao instalar algumas dependências core', 'warning');
                }
            }

            // 🆕 Instala dependências opcionais
            if (this.dependencies.optional.length > 0 && !this.isAndroid) {
                this.log('Configurando dependências opcionais...', 'info');
                
                for (const dep of this.dependencies.optional) {
                    const success = this.runCommand(
                        `npm install ${dep} --save-optional`,
                        `Instalando ${dep}`
                    );
                    
                    if (success && dep.includes('playwright')) {
                        // Verifica se os browsers já estão instalados
                        if (!this.arePlaywrightBrowsersInstalled()) {
                            this.log('Navegadores do Playwright não encontrados...', 'warning');
                            this.installPlaywrightBrowsers();
                        } else {
                            this.log('Navegadores do Playwright já instalados', 'success');
                        }
                    }
                }
            } else if (this.isAndroid) {
                this.log('Android detectado - Pulando dependências opcionais', 'info');
            }

            return true;
        }
    }

    /**
     * 🛡️ Cria fallback automático para quando browsers não estiverem disponíveis
     */
    createPlaywrightFallback() {
        if (this.isAndroid) return;

        const fallbackContent = `
/**
 * 🛡️ Fallback automático para Playwright
 * Executado quando os browsers não estão disponíveis
 */

const fs = require('fs');
const path = require('path');

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
`;

        const fallbackPath = path.join(__dirname, '..', 'src', 'core', 'PlaywrightFallback.js');
        if (!fs.existsSync(fallbackPath)) {
            fs.writeFileSync(fallbackPath, fallbackContent, 'utf8');
        }
    }

    /**
     * 🏗️ Cria estrutura de diretórios necessária
     */
    createDirectoryStructure() {
        const directories = ['logs', 'results'];
        
        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 📝 Cria arquivo de filtros padrão se não existir
     */
    createDefaultFilterFile() {
        const filterFile = 'filtros.txt';
        
        if (!fs.existsSync(filterFile)) {
            const defaultContent = `# 🎯 Arquivo de Filtros do RavPageLinks
# Adicione um filtro por linha

# Exemplos:
# google.com          - Filtra por domínio
# /admin              - Filtra por caminho  
# ^https://.*\\.com$   - Filtro regex
# api                 - Filtro por substring

# Seus filtros abaixo:
`;
            fs.writeFileSync(filterFile, defaultContent, 'utf8');
            
            if (!this.isSilent) {
                this.log('Arquivo de filtros padrão criado: filtros.txt', 'success');
            }
        }
    }

    /**
     * 🔍 Verifica se todas as dependências estão instaladas
     */
    verifyDependencies() {
        // 🆕 Usa a lista do package.json para verificação
        const requiredModules = this.dependencies.core.map(dep => 
            dep.split('@')[0].replace(/^[^@]+@/, '')
        );

        let allOk = true;

        requiredModules.forEach(module => {
            try {
                require(module);
            } catch (error) {
                allOk = false;
                if (!this.isSilent) {
                    this.log(`Dependência faltando: ${module}`, 'error');
                }
            }
        });

        return allOk;
    }

    /**
     * 📊 Exibe resumo da configuração
     */
    showSummary() {
        if (this.isSilent) return;

        this.log('📊 Resumo da configuração:', 'info');
        this.log(`   - Plataforma: ${this.platform}`, 'info');
        this.log(`   - Android: ${this.isAndroid ? 'Sim' : 'Não'}`, 'info');
        this.log(`   - Instalação: ${this.isGlobal ? 'Global' : 'Local'}`, 'info');
        this.log(`   - Dependências core: ${this.dependencies.core.length}`, 'info');
        this.log(`   - Dependências opcionais: ${this.dependencies.optional.length}`, 'info');
        
        if (!this.isAndroid) {
            if (this.arePlaywrightBrowsersInstalled()) {
                this.log('   - Playwright: ✅ Navegadores instalados', 'success');
            } else {
                this.log('   - Playwright: ⚠️ Navegadores sendo baixados', 'warning');
            }
        }
    }

    /**
     * 🚀 Executa o setup completo
     */
    async run() {
        try {
            if (!this.isSilent) {
                console.log('\n' + '='.repeat(50));
                this.log('🚀 CONFIGURANDO RAVPAGELINKS', 'success');
                console.log('='.repeat(50));
            }

            // 🆕 Mostra resumo inicial
            this.showSummary();

            // 1. Instala dependências
            const installSuccess = await this.installDependencies();
            if (!installSuccess && !this.isSilent) {
                this.log('Algumas dependências podem não ter sido instaladas', 'warning');
            }

            // 2. Cria fallback para Playwright
            this.createPlaywrightFallback();

            // 3. Cria estrutura de diretórios
            this.createDirectoryStructure();

            // 4. Cria arquivo de filtros padrão
            this.createDefaultFilterFile();

            // 5. Verifica instalação
            const depsOk = this.verifyDependencies();

            if (!this.isSilent) {
                if (depsOk) {
                    this.log('✅ Configuração concluída com sucesso!', 'success');
                    this.log('💡 Use: ravpagelinks https://exemplo.com', 'info');
                    
                    if (!this.isAndroid) {
                        if (this.arePlaywrightBrowsersInstalled()) {
                            this.log('🌐 Playwright disponível para renderização JS', 'success');
                        } else {
                            this.log('⚠️  Navegadores do Playwright sendo baixados em background...', 'warning');
                            this.log('💡 Execute manualmente se necessário: npx playwright install', 'info');
                        }
                    }
                    
                    console.log('='.repeat(50) + '\n');
                } else {
                    this.log('⚠️  Algumas dependências podem precisar de instalação manual', 'warning');
                    this.log('💡 Execute: npm install', 'info');
                }
            }

            // 6. Cria flag de setup completo
            fs.writeFileSync(path.join(__dirname, '.setup-complete'), 'true');

        } catch (error) {
            if (!this.isSilent) {
                this.log(`Erro durante setup: ${error.message}`, 'error');
            }
        }
    }
}

// 🚀 Execução automática
const setup = new AutoSetup();

// Verifica se já foi executado recentemente (evita loops)
const setupCompleteFile = path.join(__dirname, '.setup-complete');
if (!fs.existsSync(setupCompleteFile)) {
    setup.run().catch(() => {
        if (!setup.isSilent) {
            console.error('❌ Setup automático falhou');
        }
    });
} else if (!setup.isSilent) {
    setup.log('RavPageLinks já configurado!', 'success');
}