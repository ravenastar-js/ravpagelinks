

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

/**
 * 🧹 Script de limpeza completa para RavPageLinks
 */

class Cleanup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.isWindows = process.platform === 'win32';
    }

    /**
     * 🎨 Logger colorido
     */
    log(message, type = 'info') {
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
     * 🔍 Verifica se é instalação global
     */
    isGlobalInstall() {
        try {
            const globalPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
            return __dirname.includes(globalPath);
        } catch (error) {
            return false;
        }
    }

    /**
     * 🗑️ Remove arquivos e diretórios
     */
    removePath(targetPath, description = '') {
        try {
            const fullPath = path.join(this.projectRoot, targetPath);

            if (!fs.existsSync(fullPath)) {
                if (description) {
                    this.log(`${description} não encontrado`, 'warning');
                }
                return false;
            }

            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                this.log(`✅ Diretório removido: ${targetPath}`, 'success');
            } else {
                fs.unlinkSync(fullPath);
                this.log(`✅ Arquivo removido: ${targetPath}`, 'success');
            }

            return true;
        } catch (error) {
            if (description) {
                this.log(`❌ Erro ao remover ${description}: ${error.message}`, 'error');
            }
            return false;
        }
    }

    /**
     * 📄 Remove arquivos de configuração e setup
     */
    cleanupConfigFiles() {
        this.log('🗑️ Removendo arquivos de configuração...', 'info');

        const filesToRemove = [
            { path: 'scripts/.setup-complete', desc: 'Arquivo de setup' },
            { path: 'setup-config.json', desc: 'Configuração de setup' },
        ];

        filesToRemove.forEach(({ path: filePath, desc }) => {
            this.removePath(filePath, desc);
        });
    }

    /**
     * 📁 Remove diretórios temporários
     */
    cleanupDirectories() {
        this.log('📁 Removendo diretórios temporários...', 'info');

        const dirsToRemove = [
            { path: 'node_modules', desc: 'Dependências Node.js' }
        ];

        dirsToRemove.forEach(({ path: dirPath, desc }) => {
            this.removePath(dirPath, desc);
        });
    }

    /**
     * 📦 Remove arquivos de pacote
     */
    cleanupPackageFiles() {
        this.log('📦 Removendo arquivos de pacote...', 'info');

        const packageFiles = [
            { path: 'package-lock.json', desc: 'Lock do package' },
            { path: 'npm-debug.log', desc: 'Log de debug NPM' },
            { path: 'yarn.lock', desc: 'Lock do Yarn' },
            { path: 'pnpm-lock.yaml', desc: 'Lock do PNPM' }
        ];

        packageFiles.forEach(({ path: filePath, desc }) => {
            this.removePath(filePath, desc);
        });
    }

  /**
 * 🔗 Remove links simbólicos do npm link (versão segura)
 */
cleanupNpmLinks() {
    this.log('🔗 Removendo links do NPM...', 'info');
    
    // Apenas remove links globais, evita unlink local problemático
    try {
        const result = spawnSync('npm', ['list', '-g', 'ravpagelinks'], { 
            encoding: 'utf8',
            shell: true
        });

        if (result.stdout.includes('ravpagelinks')) {
            this.log('📦 Desvinculando pacote global...', 'info');
            spawnSync('npm', ['unlink', '-g', 'ravpagelinks'], {
                stdio: 'inherit',
                shell: true
            });
            this.log('✅ Link global removido', 'success');
        } else {
            this.log('ℹ️ Nenhum link global encontrado', 'info');
        }
    } catch (error) {
        this.log('⚠️ Não foi possível verificar/remover links globais', 'warning');
    }

    this.log('💡 Para limpeza local completa, delete manualmente a pasta node_modules', 'info');
}



    /**
     * 🗜️ Limpa cache do NPM
     */
    cleanupNpmCache() {
        this.log('🗜️ Limpando cache do NPM...', 'info');

        try {
            spawnSync('npm', ['cache', 'clean', '--force'], {
                stdio: 'inherit',
                shell: true
            });
            this.log('✅ Cache do NPM limpo', 'success');
        } catch (error) {
            this.log('⚠️ Não foi possível limpar cache do NPM', 'warning');
        }
    }


    /**
     * 🚀 Executa limpeza completa
     */
    run() {
        console.log('\n' + '='.repeat(60));
        this.log('🧹 INICIANDO LIMPEZA COMPLETA - RAVPAGELINKS', 'info');
        console.log('='.repeat(60));

        this.log(`📁 Diretório: ${this.projectRoot}`, 'info');
        this.log(`🌐 Instalação: ${this.isGlobalInstall() ? 'Global' : 'Local'}`, 'info');

        // Executa todos os processos de limpeza
        this.cleanupNpmLinks();
        this.cleanupConfigFiles();
        this.cleanupDirectories();
        this.cleanupPackageFiles();
        this.cleanupNpmCache();

        console.log('\n' + '='.repeat(60));
        this.log('✅ LIMPEZA CONCLUÍDA!', 'success');
        this.log('💡 Para reinstalar: npm install ravpagelinks', 'info');
        console.log('='.repeat(60) + '\n');
    }
}

// 🚀 Executa a limpeza
try {
    const cleanup = new Cleanup();
    cleanup.run();
} catch (error) {
    console.error('❌ Erro fatal durante limpeza:', error.message);
    process.exit(1);
}