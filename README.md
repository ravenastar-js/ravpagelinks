<div align="center">

<a href="https://www.npmjs.com/package/ravpagelinks" target="_blank"><img src="https://img.shields.io/badge/-ravpagelinks-c40404?style=flat-square&labelColor=c40404&logo=npm&logoColor=white&link=https://www.npmjs.com/package/ravpagelinks" height="40" /></a>  
 <a href="https://www.npmjs.com/package/ravpagelinks" target="_blank"><img alt="NPM Version" src="https://img.shields.io/npm/v/ravpagelinks?style=flat-square&logo=npm&labelColor=c40404&color=c40404" height="40" ></a>



---



# 🚀 RavPageLinks  
### 🕷️ Ferramenta básica de Enumeração de URLs em Páginas Web

[![⭐ Stars](https://img.shields.io/github/stars/ravenastar-js/ravpagelinks?style=for-the-badge&label=%E2%AD%90%20Stars&color=2d7445&logo=star&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks/stargazers)
[![🔱 Forks](https://img.shields.io/github/forks/ravenastar-js/ravpagelinks?style=for-the-badge&label=%F0%9F%94%B1%20Forks&color=2d7445&logo=git&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks/network/members)
[![👁️ Watchers](https://img.shields.io/github/watchers/ravenastar-js/ravpagelinks?style=for-the-badge&label=%F0%9F%91%81%EF%B8%8F%20Watchers&color=2d7445&logo=eye&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks/watchers)
[![📄 License](https://img.shields.io/github/license/ravenastar-js/ravpagelinks?style=for-the-badge&label=%F0%9F%93%84%20License&color=2d7445&logo=book&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks/blob/main/LICENSE)
[![🕒 Last Commit](https://img.shields.io/github/last-commit/ravenastar-js/ravpagelinks?style=for-the-badge&label=%F0%9F%95%92%20Last%20Commit&color=2d7445&logo=clock&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks/commits/all)
[![📦 Repo Size](https://img.shields.io/github/repo-size/ravenastar-js/ravpagelinks?style=for-the-badge&label=%F0%9F%93%A6%20Repo%20Size&color=2d7445&logo=database&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/ravpagelinks)


*Biblioteca NPM + CLI para extração de URL automática*



![RavPageLinks](media/ravpagelinks.png)

<div align="center">
BANNER INSPIRADO EM
<br>
<a href="https://store.steampowered.com/app/1507580/Enigma_do_Medo" >
  <img src="https://i.imgur.com/Gbyx94i.png" width="180">
</a>
</div>


---

</div>

## 📞 Suporte 

Se precisar de ajuda ou quiser falar com a equipe, entre no nosso servidor de suporte:

[![Servidor de Suporte](https://img.shields.io/badge/Servidor%20de%20Suporte-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/FncVNprdgP)

---


## 📋 Índice
- [🎯 Visão Geral](#-visão-geral)
- [📦 Instalação Rápida](#-instalação-rápida)
- [🛠️ Como Usar](#️-como-usar)
- [🎛️ Opções da CLI](#️-opções-da-cli)
- [🔧 Filtros Avançados](#-filtros-avançados)
- [📊 Métodos de Extração](#-métodos-de-extração)
- [🚀 Exemplos Práticos](#-exemplos-práticos)
- [🔍 Estrutura Técnica](#-estrutura-técnica)
- [🐛 Solução de Problemas](#-solução-de-problemas)


## 🎯 Visão Geral

O **RavPageLinks** é uma ferramenta básica de enumeração de URLs que combina extração HTML tradicional com renderização completa de JavaScript usando Playwright.

### ✨ Características Principais
- 🌐 **Extração Híbrida**: HTML tradicional + renderização JavaScript
- 🎯 **Filtros Inteligentes**: Domínio, regex e arquivos personalizados
- 📊 **Logs Detalhados**: Console colorido + arquivos de log
- 🚀 **Performance Otimizada**: Timeouts configuráveis e fallbacks
- 🔒 **Validação Robusta**: URLs validadas e normalizadas

## 📦 Instalação Rápida

<details>
<summary>📥 Como instalar o NodeJS?</summary>

- [COMO INSTALAR NODE JS NO WINDOWS?](https://youtu.be/-jft_9PlffQ)
</details>

```bash
# Instalar globalmente
npm i -g ravpagelinks          # ✅ Recomendado
npm install -g ravpagelinks    # ✅ Completo

# Ou usar diretamente com npx
npx ravpagelinks https://secguide.pages.dev/ferramentas

# Instalar navegadores do Playwright
npx ravpagelinks --dw-nav
```

## 🗑️ DESINSTALAR GLOBALMENTE

```bash
npm un -g ravpagelinks         # ✅ Recomendado  
npm uninstall -g ravpagelinks  # ✅ Completo
npm remove -g ravpagelinks     # ✅ Alternativo
```

## 🛠️ Como Usar

### Uso Básico
```bash
# Extração básica
ravpagelinks https://secguide.pages.dev/ferramentas

# Com logging detalhado
ravpagelinks https://secguide.pages.dev/ferramentas -v

# Salvar em diretório específico
ravpagelinks https://secguide.pages.dev/ferramentas -o resultados
```

### Estrutura de Saída
```
📁 resultados/
└── 📁 exemplo_com/
    ├── 📄 links_home.txt
    ├── 📄 links_sobre.txt
    └── 📄 links_contato.txt
```

## 🎛️ Opções da CLI

| Opção | Atalho | Descrição | Padrão |
|-------|---------|-----------|---------|
| `--output` | `-o` | 📁 Diretório de saída | `results` |
| `--filter` | `-f` | 🔍 Filtro por domínio/regex | - |
| `--filter-file` | - | 📄 Arquivo de filtros | `filtros.txt` |
| `--filter-type` | - | 🎯 Tipo de filtro | `file` |
| `--unique` | `-u` | ✨ Remover duplicatas | `false` |
| `--verbose` | `-v` | 📢 Log detalhado | `false` |
| `--timeout` | - | ⏰ Timeout (ms) | `30000` |
| `--no-playwright` | - | 🚫 Desativar Playwright | `false` |
| `--headless` | - | 🌙 Navegador headless | `true` |
| `--wait-time` | - | ⏳ Espera JS (ms) | `5000` |
| `--scroll` | - | 📜 Rolagem automática | `false` |
| `--browser` | - | 🌐 Navegador | `chromium` |

## 🔧 Filtros Avançados

### 📄 Arquivo de Filtros (`filtros.txt`)
```
# 🎯 Arquivo de Filtros de RavPageLinks
# Formato: um filtro por linha

# Domínios
google.com
github.com

# Caminhos
/admin
/api/v1

# Regex
^https://.*\\.com$
/api/[a-z]+/v[0-9]

# Substrings
login
dashboard
```

### Tipos de Filtro
1. **🏷️ Domínio**: Filtra por nome de domínio
2. **🔍 Regex**: Filtro por expressão regular  
3. **📄 Arquivo**: Múltiplos filtros em arquivo
4. **🔤 Substring**: Busca textual simples

## 📊 Métodos de Extração

### 1. 🏗️ Extração HTML Tradicional
- **Velocidade**: ⭐⭐⭐⭐⭐
- **JavaScript**: ❌ Não renderiza
- **Uso**: `--no-playwright`

### 2. 🌐 Playwright com Renderização
- **Velocidade**: ⭐⭐⭐
- **JavaScript**: ✅ Renderiza completo
- **Recursos**: Scroll, wait...

### 🔄 Fallback Automático
Se o Playwright falhar, automaticamente usa extração HTML tradicional.

## 🚀 Exemplos Práticos

### 1. Reconhecimento Básico
```bash
ravpagelinks https://secguide.pages.dev/ferramentas -v -o recon
```

### 2. Filtro por Domínio
```bash
ravpagelinks https://secguide.pages.dev/ferramentas -f secguide.pages.dev --unique
```

### 3. Extração com JavaScript
```bash
ravpagelinks https://secguide.pages.dev/ferramentas --scroll --wait-time 10000
```

### 4. Filtros Complexos
```bash
ravpagelinks https://secguide.pages.dev/ferramentas --filter-file meus_filtros.txt --filter-type regex
```

### 5. Performance Crítica
```bash
ravpagelinks https://secguide.pages.dev/ferramentas --no-playwright --timeout 15000
```

## 🔍 Estrutura Técnica

### 🏗️ Arquitetura do Sistema
```
📁 ravpagelinks/
├── 📦 package.json
├── 📖 README.md
├── 🏠 index.js
├── ⚡ bin/
│   └── 🖥️ cli.js
├── 📄 filtros.txt
└── 📁 src/
    ├── 🎯 core/
    │   ├── 🕷️ Crawler.js
    │   ├── 🌐 URLExtractor.js
    │   └── 🚀 PlaywrightCrawler.js
    └── 🛠️ lib/
        ├── 🎛️ filters/
        │   ├── 🌐 DomainFilter.js
        │   ├── 🔍 RegexFilter.js
        │   └── ⚙️ FilterManager.js
        └── 🔧 utils/
            ├── 📁 FileHandler.js
            ├── ✅ URLValidator.js
            └── 📝 AdvancedLogger.js
```

### 🔄 Fluxo de Processamento
1. **📥 Entrada**: URL + opções
2. **🌐 Crawling**: HTML ou Playwright
3. **🔍 Extração**: URLs do conteúdo
4. **🎯 Filtragem**: Aplicação de filtros
5. **💾 Saída**: Arquivos organizados

## 🐛 Solução de Problemas

### ❌ Erros Comuns

1. **Playwright não inicializa**
   - Verifique: `npx playwright install`
   - Alternative: Use `--no-playwright`

2. **Timeout em sites lentos**
   - Aumente: `--timeout 60000`
   - Ajuste: `--wait-time 10000`

3. **Muitas URLs duplicadas**
   - Use: `--unique` ou `-u`

4. **Filtros não funcionando**
   - Verifique sintaxe do `filtros.txt`
   - Use `--verbose` para debug

### 🔧 Dicas de Performance

- **Sites estáticos**: Use `--no-playwright`
- **SPA/React**: Use `--scroll --wait-time 10000`  
- **Grandes sites**: Aumente `--timeout`
- **Debug**: Use `--verbose` e cheque logs

### 📊 Otimização de Resultados

1. **Combine filtros** no arquivo `filtros.txt`
2. **Use `--unique`** para limpar duplicatas
3. **Ajuste timeouts** conforme a rede
4. **Experimente métodos** de extração diferentes

### 🛠️ Desenvolvimento
```bash
# Clonar e desenvolver
git clone https://github.com/ravenastar-js/ravpagelinks.git
cd ravpagelinks
npm install
npm run dev
```

---

<div align="center">

## Feito com 💚 por [RavenaStar](https://linktr.ee/ravenastar)

[⬆ Voltar ao topo](#-ravpagelinks)

</div>
