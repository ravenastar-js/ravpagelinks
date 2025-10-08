#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Verifica se é Android
const isAndroid = process.platform === 'android';

if (isAndroid) {
    console.log('📱 Android detectado - Ajustando para compatibilidade...');
    
    // Cria um arquivo de flag para indicar que é Android
    const androidFlagPath = path.join(__dirname, '..', '.android-platform');
    fs.writeFileSync(androidFlagPath, 'android', 'utf8');
    
    console.log('✅ Configurado para Android com sucesso');
} else {
    console.log('🌐 Plataforma suportada - Playwright disponível');
    
    // Remove flag Android se existir
    const androidFlagPath = path.join(__dirname, '..', '.android-platform');
    if (fs.existsSync(androidFlagPath)) {
        fs.unlinkSync(androidFlagPath);
    }
}