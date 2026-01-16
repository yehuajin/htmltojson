/**
 * 前端应用主逻辑
 */

const API_BASE_URL = window.location.origin + '/api';

// DOM元素
const elements = {
    // 标签页
    htmlTab: document.getElementById('html-tab'),
    urlTab: document.getElementById('url-tab'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    // 输入
    htmlInput: document.getElementById('html-input'),
    urlInput: document.getElementById('url-input'),
    
    // 按钮
    parseHtmlBtn: document.getElementById('parse-html-btn'),
    parseUrlBtn: document.getElementById('parse-url-btn'),
    clearHtmlBtn: document.getElementById('clear-html-btn'),
    clearUrlBtn: document.getElementById('clear-url-btn'),
    sampleHtmlBtn: document.getElementById('sample-html-btn'),
    
    // 选项
    includeImages: document.getElementById('include-images'),
    includeScripts: document.getElementById('include-scripts'),
    includeStyles: document.getElementById('include-styles'),
    strictMode: document.getElementById('strict-mode'),
    textOnly: document.getElementById('text-only'),
    parseModeServer: document.getElementById('parse-mode-server'),
    parseModeClient: document.getElementById('parse-mode-client'),
    
    // 进度
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    
    // 结果
    resultSection: document.getElementById('result-section'),
    formatSelect: document.getElementById('format-select'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn'),
    expandBtn: document.getElementById('expand-btn'),
    resultTabs: document.querySelectorAll('.result-tab'),
    formattedPanel: document.getElementById('formatted-panel'),
    rawPanel: document.getElementById('raw-panel'),
    statsPanel: document.getElementById('stats-panel'),
    imagesPanel: document.getElementById('images-panel'),
    linksPanel: document.getElementById('links-panel'),
    formattedResult: document.getElementById('formatted-result').querySelector('code'),
    rawResult: document.getElementById('raw-result'),
    statsContent: document.getElementById('stats-content'),
    imagesContent: document.getElementById('images-content'),
    linksContent: document.getElementById('links-content'),
    resultDetails: document.getElementById('result-details'),
    
    // 错误
    errorMessage: document.getElementById('error-message')
};

// 当前解析结果
let currentResult = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadSampleHTML();
});

// 初始化事件监听
function initEventListeners() {
    // 标签页切换
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 解析按钮
    elements.parseHtmlBtn.addEventListener('click', parseHTML);
    elements.parseUrlBtn.addEventListener('click', parseURL);
    
    // 清空按钮
    elements.clearHtmlBtn.addEventListener('click', () => {
        elements.htmlInput.value = '';
        elements.htmlInput.focus();
    });
    elements.clearUrlBtn.addEventListener('click', () => {
        elements.urlInput.value = '';
        elements.urlInput.focus();
    });
    
    // 示例按钮
    elements.sampleHtmlBtn.addEventListener('click', loadSampleHTML);
    
    // 结果标签页
    elements.resultTabs.forEach(tab => {
        tab.addEventListener('click', () => switchResultTab(tab.dataset.resultTab));
    });
    
    // 格式选择
    elements.formatSelect.addEventListener('change', updateFormattedResult);
    
    // 操作按钮
    elements.copyBtn.addEventListener('click', copyResult);
    elements.downloadBtn.addEventListener('click', downloadResult);
    elements.expandBtn.addEventListener('click', toggleExpand);
    
    // Enter键快捷解析
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            parseURL();
        }
    });
}

// 切换标签页
function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    elements.htmlTab.classList.toggle('active', tabName === 'html');
    elements.urlTab.classList.toggle('active', tabName === 'url');
}

// 切换结果标签页
function switchResultTab(tabName) {
    elements.resultTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.resultTab === tabName);
    });
    
    elements.formattedPanel.classList.toggle('active', tabName === 'formatted');
    elements.rawPanel.classList.toggle('active', tabName === 'raw');
    elements.statsPanel.classList.toggle('active', tabName === 'stats');
    elements.imagesPanel.classList.toggle('active', tabName === 'images');
    elements.linksPanel.classList.toggle('active', tabName === 'links');
}

// 加载示例HTML
function loadSampleHTML() {
    const sampleHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例页面</title>
    <meta name="description" content="这是一个示例HTML页面">
</head>
<body>
    <header>
        <h1>欢迎使用冰蓝HTML解析器</h1>
        <nav>
            <a href="/home">首页</a>
            <a href="/about">关于</a>
            <a href="/contact">联系</a>
        </nav>
    </header>
    <main>
        <article>
            <h2>文章标题</h2>
            <p>这是一段示例文本内容。解析器会将HTML转换为结构化的JSON数据。</p>
            <img src="https://via.placeholder.com/300" alt="示例图片">
            <ul>
                <li>列表项 1</li>
                <li>列表项 2</li>
                <li>列表项 3</li>
            </ul>
        </article>
    </main>
    <footer>
        <p>© 2024 示例网站</p>
    </footer>
</body>
</html>`;
    
    elements.htmlInput.value = sampleHTML;
    switchTab('html');
}

// 解析HTML
async function parseHTML() {
    const html = elements.htmlInput.value.trim();
    
    if (!html) {
        showError('请输入HTML内容');
        return;
    }
    
    const options = getParseOptions();
    
    try {
        showProgress(0, '正在解析HTML...');
        setButtonsDisabled(true);
        hideError();
        
        const response = await fetch(`${API_BASE_URL}/parse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ html, options })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentResult = result;
            showProgress(100, '解析完成！');
            setTimeout(() => {
                hideProgress();
                displayResult(result);
            }, 500);
        } else {
            showError(result.error || '解析失败');
            hideProgress();
        }
    } catch (error) {
        showError(`解析错误: ${error.message}`);
        hideProgress();
    } finally {
        setButtonsDisabled(false);
    }
}

// 解析URL
async function parseURL() {
    const url = elements.urlInput.value.trim();
    
    if (!url) {
        showError('请输入URL地址');
        return;
    }
    
    // 验证URL格式
    try {
        new URL(url);
    } catch {
        showError('无效的URL格式');
        return;
    }
    
    const options = getParseOptions();
    const parseMode = elements.parseModeClient.checked ? 'client' : 'server';
    
    try {
        showProgress(0, parseMode === 'client' ? '正在从客户端获取页面内容...' : '正在从服务端获取页面内容...');
        setButtonsDisabled(true);
        hideError();
        
        let result;
        
        if (parseMode === 'client') {
            // 客户端解析：直接在浏览器中fetch和解析
            result = await parseURLClient(url, options);
        } else {
            // 服务端解析：通过API请求
            const response = await fetch(`${API_BASE_URL}/parse-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, options })
            });
            
            result = await response.json();
        }
        
        if (result.success) {
            currentResult = result;
            showProgress(100, '解析完成！');
            setTimeout(() => {
                hideProgress();
                displayResult(result);
            }, 500);
        } else {
            // 显示详细的错误信息
            let errorMessage = result.error || '解析失败';
            if (result.errorCode === 'NETWORK_ERROR' || result.errorCode === 'CORS_ERROR') {
                errorMessage = `网络错误: ${errorMessage}`;
                if (result.details && result.details.code) {
                    errorMessage += ` (${result.details.code})`;
                }
                // CORS错误提示
                if (result.errorCode === 'CORS_ERROR') {
                    errorMessage += ' - 建议使用服务端解析模式';
                }
            } else if (result.errorCode === 'HTTP_ERROR') {
                errorMessage = `HTTP错误: ${errorMessage}`;
                if (result.details && result.details.status) {
                    errorMessage += ` (状态码: ${result.details.status})`;
                }
            }
            showError(errorMessage);
            hideProgress();
        }
    } catch (error) {
        showError(`解析错误: ${error.message}`);
        hideProgress();
    } finally {
        setButtonsDisabled(false);
    }
}

/**
 * 客户端解析URL
 * 直接在浏览器中fetch和解析HTML
 * @param {string} url - URL地址
 * @param {Object} options - 解析选项
 * @returns {Promise<Object>} 解析结果
 */
async function parseURLClient(url, options = {}) {
    try {
        showProgress(30, '正在获取页面内容...');
        
        // 使用fetch获取HTML
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors', // 允许CORS，但如果服务器不允许，会失败
            credentials: 'omit',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        showProgress(60, '正在解析HTML...');
        const html = await response.text();
        
        // 创建DOM解析器
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 使用前端解析器解析
        showProgress(80, '正在处理结果...');
        const parseResult = await parseHTMLClient(doc, options);
        
        return {
            success: true,
            data: parseResult,
            url: url,
            duration: Date.now() - (window.parseStartTime || Date.now())
        };
        
    } catch (error) {
        // 处理CORS错误
        if (error.message.includes('CORS') || error.message.includes('network') || 
            error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return {
                success: false,
                error: `CORS策略阻止了请求: ${error.message}`,
                errorCode: 'CORS_ERROR',
                details: {
                    code: error.name,
                    message: error.message,
                    suggestion: '该URL可能不允许跨域访问，请使用服务端解析模式'
                }
            };
        }
        
        return {
            success: false,
            error: error.message,
            errorCode: 'NETWORK_ERROR',
            details: {
                code: error.name,
                message: error.message
            }
        };
    }
}

/**
 * 客户端解析HTML（使用浏览器DOM API）
 * @param {Document} doc - DOM文档对象
 * @param {Object} options - 解析选项
 * @returns {Promise<Object>} 解析结果
 */
async function parseHTMLClient(doc, options = {}) {
    // 提取元数据
    const metadata = {
        title: doc.querySelector('title')?.textContent.trim() || '',
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || [],
        url: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    };
    
    // 提取图片
    const images = [];
    if (options.includeImages !== false) {
        doc.querySelectorAll('img').forEach(img => {
            images.push({
                src: img.getAttribute('src') || img.getAttribute('data-src') || '',
                alt: img.getAttribute('alt') || '',
                width: img.getAttribute('width') ? parseInt(img.getAttribute('width')) : null,
                height: img.getAttribute('height') ? parseInt(img.getAttribute('height')) : null,
                title: img.getAttribute('title') || ''
            });
        });
    }
    
    // 提取链接
    const links = [];
    doc.querySelectorAll('a').forEach(link => {
        links.push({
            href: link.getAttribute('href') || '',
            text: link.textContent.trim(),
            target: link.getAttribute('target') || '',
            rel: link.getAttribute('rel') || '',
            title: link.getAttribute('title') || ''
        });
    });
    
    // 获取主要内容
    const mainContent = doc.querySelector('main') || 
                        doc.querySelector('[role="main"]') || 
                        doc.querySelector('.main') || 
                        doc.body;
    
    // 构建结果
    return {
        metadata: metadata,
        structure: {
            root: {
                type: 'element',
                tag: 'html',
                attributes: {},
                children: [
                    {
                        type: 'element',
                        tag: 'body',
                        attributes: {},
                        children: Array.from(mainContent.childNodes).map(node => convertNode(node))
                    }
                ]
            },
            mainContent: {
                html: mainContent.innerHTML,
                text: mainContent.textContent.trim()
            }
        },
        images: images,
        links: links,
        stats: {
            totalElements: doc.querySelectorAll('*').length,
            totalTextLength: doc.body.textContent.length,
            depth: calculateDepth(doc.body)
        }
    };
}

/**
 * 转换DOM节点为对象
 * @param {Node} node - DOM节点
 * @returns {Object} 节点对象
 */
function convertNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        return text ? {
            type: 'text',
            text: text
        } : null;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = {
            type: 'element',
            tag: node.tagName.toLowerCase(),
            attributes: {},
            children: []
        };
        
        // 提取属性
        if (node.attributes) {
            Array.from(node.attributes).forEach(attr => {
                element.attributes[attr.name] = attr.value;
            });
        }
        
        // 处理子节点
        if (node.childNodes && node.childNodes.length > 0) {
            node.childNodes.forEach(child => {
                const converted = convertNode(child);
                if (converted) {
                    element.children.push(converted);
                }
            });
        }
        
        return element;
    }
    
    return null;
}

/**
 * 计算DOM深度
 * @param {Node} node - DOM节点
 * @returns {number} 深度
 */
function calculateDepth(node) {
    if (!node.childNodes || node.childNodes.length === 0) {
        return 0;
    }
    
    let maxDepth = 0;
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            maxDepth = Math.max(maxDepth, calculateDepth(child) + 1);
        }
    });
    
    return maxDepth;
}

// 获取解析选项
function getParseOptions() {
    return {
        includeImages: elements.includeImages.checked,
        includeScripts: elements.includeScripts.checked,
        includeStyles: elements.includeStyles.checked,
        strictMode: elements.strictMode.checked,
        textOnly: elements.textOnly.checked
    };
}

// 显示进度
function showProgress(percentage, text) {
    elements.progressContainer.style.display = 'block';
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
}

// 隐藏进度
function hideProgress() {
    elements.progressContainer.style.display = 'none';
}

// 显示错误
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'flex';
    elements.resultSection.style.display = 'none';
}

// 隐藏错误
function hideError() {
    elements.errorMessage.style.display = 'none';
}

// 设置按钮禁用状态
function setButtonsDisabled(disabled) {
    elements.parseHtmlBtn.disabled = disabled;
    elements.parseUrlBtn.disabled = disabled;
    elements.parseHtmlBtn.textContent = disabled ? '解析中...' : '🚀 解析HTML';
    elements.parseUrlBtn.textContent = disabled ? '解析中...' : '🌐 解析URL';
}

// 显示结果
function displayResult(result) {
    currentResult = result;
    elements.resultSection.style.display = 'block';
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 更新格式化结果
    updateFormattedResult();
    
    // 将解析结果转换为完整的HTML页面
    const content = renderCompleteHTML(result);
    // 更新原始数据
    elements.rawResult.innerHTML = content;
    
    // 更新统计信息
    updateStats(result);
    
    // 更新详细信息
    updateDetails(result);
    
    // 更新图片列表
    updateImages(result);
    
    // 更新链接列表
    updateLinks(result);
    
    // 切换到格式化标签页
    switchResultTab('formatted');
}

// 更新格式化结果
function updateFormattedResult() {
    if (!currentResult || !currentResult.data) return;
    
    const format = elements.formatSelect.value;
    let formatted = '';
    
    try {
        switch (format) {
            case 'json':
                formatted = JSON.stringify(currentResult.data, null, 2);
                break;
            case 'text':
                formatted = extractText(currentResult.data);
                break;
            case 'html':
                formatted = formatAsHTML(currentResult.data);
                break;
            case 'xml':
                formatted = formatAsXML(currentResult.data);
                break;
            default:
                formatted = JSON.stringify(currentResult.data, null, 2);
        }
        
        elements.formattedResult.textContent = formatted;
    } catch (error) {
        elements.formattedResult.textContent = `格式化错误: ${error.message}`;
    }
}

// 提取文本
function extractText(data) {
    if (!data.structure || !data.structure.root) return '';
    
    const extract = (node) => {
        if (node.type === 'text') {
            return node.text || '';
        }
        if (node.type === 'element' && node.children) {
            return node.children.map(extract).filter(Boolean).join(' ');
        }
        return '';
    };
    
    return extract(data.structure.root);
}

// 格式化为HTML
function formatAsHTML(data) {
    if (!data.structure || !data.structure.root) return '';
    
    const formatNode = (node) => {
        if (node.type === 'text') {
            return escapeHTML(node.text || '');
        }
        if (node.type === 'element') {
            const tag = node.tag || 'div';
            const attrs = formatAttributes(node.attributes || {});
            const children = (node.children || []).map(formatNode).join('');
            return `<${tag}${attrs}>${children}</${tag}>`;
        }
        return '';
    };
    
    return formatNode(data.structure.root);
}

// 格式化为XML
function formatAsXML(data) {
    return formatAsHTML(data).replace(/<(\w+)([^>]*)>/g, '<$1$2>');
}

// 格式化属性
function formatAttributes(attrs) {
    if (!attrs || Object.keys(attrs).length === 0) return '';
    return ' ' + Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeHTML(String(value))}"`)
        .join(' ');
}

// 转义HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 将解析结果渲染为完整的HTML页面
 * 包括样式、图片、表格等所有内容
 * @param {Object} result - 解析结果对象
 * @returns {string} 完整的HTML字符串
 */
function renderCompleteHTML(result) {
    if (!result || !result.data) {
        return '<p>暂无数据</p>';
    }

    const data = result.data;
    let html = '';

    // 1. 构建HTML头部（DOCTYPE, html, head）
    html += '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n';
    
    // 添加meta标签
    if (data.metadata) {
        html += `  <meta charset="UTF-8">\n`;
        html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        
        if (data.metadata.title) {
            html += `  <title>${escapeHTML(data.metadata.title)}</title>\n`;
        }
        
        if (data.metadata.description) {
            html += `  <meta name="description" content="${escapeHTML(data.metadata.description)}">\n`;
        }
        
        if (data.metadata.keywords && data.metadata.keywords.length > 0) {
            html += `  <meta name="keywords" content="${escapeHTML(data.metadata.keywords.join(', '))}">\n`;
        }
    }

    // 2. 添加基础样式
    html += `  <style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        color: #222;
    }
    
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1.1em; }
    h5 { font-size: 1em; }
    h6 { font-size: 0.9em; }
    
    p {
        margin-bottom: 1em;
    }
    
    img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 15px 0;
        border-radius: 4px;
    }
    
    a {
        color: #2563eb;
        text-decoration: none;
    }
    
    a:hover {
        text-decoration: underline;
    }
    
    ul, ol {
        margin: 1em 0;
        padding-left: 2em;
    }
    
    li {
        margin-bottom: 0.5em;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        background: #fff;
    }
    
    table th,
    table td {
        padding: 12px;
        border: 1px solid #e5e7eb;
        text-align: left;
    }
    
    table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
    }
    
    table tr:nth-child(even) {
        background: #f9fafb;
    }
    
    blockquote {
        margin: 1em 0;
        padding: 10px 20px;
        border-left: 4px solid #2563eb;
        background: #f9fafb;
        color: #666;
    }
    
    code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
    }
    
    pre {
        background: #1e293b;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 1em 0;
    }
    
    pre code {
        background: transparent;
        padding: 0;
        color: inherit;
    }
    
    header {
        background: #f9fafb;
        padding: 20px;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 20px;
    }
    
    nav {
        margin: 15px 0;
    }
    
    nav a {
        margin-right: 15px;
    }
    
    footer {
        margin-top: 40px;
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 0.9em;
    }
    
    .container {
        max-width: 100%;
    }
    
    article {
        margin: 20px 0;
    }
    
    section {
        margin: 20px 0;
    }
    </style>\n`;

    // 3. 关闭head标签，开始body
    html += '</head>\n<body>\n';

    // 4. 添加header（如果有）
    if (data.structure && data.structure.header) {
        if (data.structure.header.html) {
            html += '  <header>\n    ' + data.structure.header.html.replace(/\n/g, '\n    ') + '\n  </header>\n';
        }
    }

    // 5. 添加导航（如果有）
    if (data.structure && data.structure.navigation) {
        if (data.structure.navigation.html) {
            html += '  <nav>\n    ' + data.structure.navigation.html.replace(/\n/g, '\n    ') + '\n  </nav>\n';
        }
    }

    // 6. 渲染主要内容（从root节点重建HTML）
    if (data.structure && data.structure.root) {
        const bodyContent = renderNodeToHTML(data.structure.root);
        
        // 如果有mainContent，优先使用
        if (data.structure.mainContent && data.structure.mainContent.html) {
            html += '  <main>\n    ' + data.structure.mainContent.html.replace(/\n/g, '\n    ') + '\n  </main>\n';
        } else {
            // 否则使用root节点内容
            // 提取body标签内的内容，如果没有body则使用整个内容
            if (bodyContent.includes('<body>')) {
                const bodyMatch = bodyContent.match(/<body[^>]*>(.*?)<\/body>/is);
                if (bodyMatch) {
                    html += '  <main>\n    ' + bodyMatch[1].replace(/\n/g, '\n    ') + '\n  </main>\n';
                } else {
                    html += '  <main>\n    ' + bodyContent.replace(/\n/g, '\n    ') + '\n  </main>\n';
                }
            } else {
                html += '  <main>\n    ' + bodyContent.replace(/\n/g, '\n    ') + '\n  </main>\n';
            }
        }
    }

    // 7. 添加文章列表（如果有）
    if (data.structure && data.structure.articles && data.structure.articles.length > 0) {
        data.structure.articles.forEach(article => {
            if (article.html) {
                html += '  <article>\n    ' + article.html.replace(/\n/g, '\n    ') + '\n  </article>\n';
            }
        });
    }

    // 8. 添加footer（如果有）
    if (data.structure && data.structure.footer) {
        if (data.structure.footer.html) {
            html += '  <footer>\n    ' + data.structure.footer.html.replace(/\n/g, '\n    ') + '\n  </footer>\n';
        }
    }

    // 9. 关闭body和html标签
    html += '</body>\n</html>';

    return html;
}

/**
 * 将节点对象递归渲染为HTML字符串
 * @param {Object} node - 节点对象
 * @returns {string} HTML字符串
 */
function renderNodeToHTML(node) {
    if (!node) return '';

    // 文本节点
    if (node.type === 'text') {
        return escapeHTML(node.text || '');
    }

    // 注释节点
    if (node.type === 'comment') {
        return `<!-- ${escapeHTML(node.text || '')} -->`;
    }

    // 元素节点
    if (node.type === 'element') {
        const tag = node.tag || 'div';
        const attributes = node.attributes || {};
        const children = node.children || [];

        // 格式化属性
        let attrsStr = '';
        for (const [key, value] of Object.entries(attributes)) {
            if (value !== null && value !== undefined) {
                attrsStr += ` ${key}="${escapeHTML(String(value))}"`;
            }
        }

        // 处理自闭合标签
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        if (selfClosingTags.includes(tag.toLowerCase())) {
            return `<${tag}${attrsStr} />`;
        }

        // 递归处理子节点
        const childrenHTML = children.map(child => renderNodeToHTML(child)).join('');

        return `<${tag}${attrsStr}>${childrenHTML}</${tag}>`;
    }

    return '';
}

// 更新统计信息
function updateStats(result) {
    if (!result.data || !result.data.stats) {
        elements.statsContent.innerHTML = '<p>暂无统计信息</p>';
        return;
    }
    
    const stats = result.data.stats;
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-label">总元素数</div>
            <div class="stat-value">${stats.totalElements || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">文本长度</div>
            <div class="stat-value">${(stats.totalTextLength || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">文档深度</div>
            <div class="stat-value">${stats.depth || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">解析耗时</div>
            <div class="stat-value">${(result.duration || 0).toFixed(0)}ms</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">图片数量</div>
            <div class="stat-value">${(result.data.images || []).length}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">链接数量</div>
            <div class="stat-value">${(result.data.links || []).length}</div>
        </div>
    `;
    
    elements.statsContent.innerHTML = statsHTML;
}

// 更新详细信息
function updateDetails(result) {
    if (!result.data) return;
    
    const details = [];
    
    if (result.data.metadata) {
        const meta = result.data.metadata;
        if (meta.title) details.push({ label: '标题', value: meta.title });
        if (meta.description) details.push({ label: '描述', value: meta.description });
        if (meta.url) details.push({ label: 'URL', value: meta.url });
    }
    
    if (details.length === 0) {
        elements.resultDetails.innerHTML = '';
        return;
    }
    
    const detailsHTML = details.map(detail => `
        <div class="detail-item">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `).join('');
    
    elements.resultDetails.innerHTML = `<h3>详细信息</h3>${detailsHTML}`;
}

// 更新图片列表
function updateImages(result) {
    if (!result.data || !result.data.images || result.data.images.length === 0) {
        elements.imagesContent.innerHTML = '<div class="empty-state">没有找到图片</div>';
        return;
    }
    
    const images = result.data.images;
    const imagesHTML = `
        <div class="images-grid">
            ${images.map((img, index) => `
                <div class="image-card">
                    <div class="image-preview">
                        <img 
                            src="${escapeHTML(img.src || '')}" 
                            alt="${escapeHTML(img.alt || '')}"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                            loading="lazy"
                        >
                        <div class="image-placeholder" style="display: none;">
                            <span>🖼️</span>
                            <span>图片加载失败</span>
                        </div>
                    </div>
                    <div class="image-info">
                        <div class="image-title">图片 #${index + 1}</div>
                        <div class="image-detail">
                            <strong>地址:</strong> 
                            <a href="${escapeHTML(img.src || '')}" target="_blank" rel="noopener noreferrer">
                                ${truncateText(img.src || '', 50)}
                            </a>
                        </div>
                        ${img.alt ? `<div class="image-detail"><strong>替代文本:</strong> ${escapeHTML(img.alt)}</div>` : ''}
                        ${img.width && img.height ? `<div class="image-detail"><strong>尺寸:</strong> ${img.width} × ${img.height}px</div>` : ''}
                        ${img.title ? `<div class="image-detail"><strong>标题:</strong> ${escapeHTML(img.title)}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    elements.imagesContent.innerHTML = imagesHTML;
}

// 更新链接列表
function updateLinks(result) {
    if (!result.data || !result.data.links || result.data.links.length === 0) {
        elements.linksContent.innerHTML = '<div class="empty-state">没有找到链接</div>';
        return;
    }
    
    const links = result.data.links;
    
    // 按域名分组
    const groupedLinks = {};
    links.forEach(link => {
        try {
            const url = new URL(link.href, window.location.origin);
            const domain = url.hostname;
            if (!groupedLinks[domain]) {
                groupedLinks[domain] = [];
            }
            groupedLinks[domain].push(link);
        } catch {
            const domain = '其他';
            if (!groupedLinks[domain]) {
                groupedLinks[domain] = [];
            }
            groupedLinks[domain].push(link);
        }
    });
    
    const linksHTML = `
        <div class="links-container">
            ${Object.entries(groupedLinks).map(([domain, domainLinks]) => `
                <div class="link-group">
                    <div class="link-group-header">
                        <h3>${escapeHTML(domain)}</h3>
                        <span class="link-count">${domainLinks.length} 个链接</span>
                    </div>
                    <div class="link-list">
                        ${domainLinks.map(link => `
                            <div class="link-item">
                                <a href="${escapeHTML(link.href)}" 
                                   target="${link.target || '_blank'}" 
                                   rel="${link.rel || 'noopener noreferrer'}"
                                   class="link-url">
                                    ${escapeHTML(link.text || link.href)}
                                </a>
                                ${link.title ? `<span class="link-title" title="${escapeHTML(link.title)}">${escapeHTML(link.title)}</span>` : ''}
                                ${link.target ? `<span class="link-target">${link.target === '_blank' ? '🔗 新窗口' : '🔗 当前窗口'}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    elements.linksContent.innerHTML = linksHTML;
}

// 截断文本
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return escapeHTML(text);
    return escapeHTML(text.substring(0, maxLength)) + '...';
}

// 复制结果
async function copyResult() {
    const activeTab = document.querySelector('.result-tab.active');
    const tabName = activeTab.dataset.resultTab;
    
    let text = '';
    if (tabName === 'formatted') {
        text = elements.formattedResult.textContent;
    } else if (tabName === 'raw') {
        // 对于raw面板，如果是HTML内容，复制innerHTML或提取文本
        if (elements.rawResult.innerHTML && elements.rawResult.innerHTML.trim()) {
            // 提取纯文本或HTML源码
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = elements.rawResult.innerHTML;
            text = tempDiv.textContent || tempDiv.innerText || elements.rawResult.innerHTML;
        } else {
            text = elements.rawResult.textContent || '';
        }
    } else if (tabName === 'images') {
        // 复制图片信息为JSON
        if (currentResult && currentResult.data && currentResult.data.images) {
            text = JSON.stringify(currentResult.data.images, null, 2);
        }
    } else if (tabName === 'links') {
        // 复制链接信息为JSON
        if (currentResult && currentResult.data && currentResult.data.links) {
            text = JSON.stringify(currentResult.data.links, null, 2);
        }
    }
    
    if (!text) {
        showToast('没有可复制的内容');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
    } catch (error) {
        showToast('复制失败: ' + error.message);
    }
}

// 下载结果
function downloadResult() {
    const activeTab = document.querySelector('.result-tab.active');
    const tabName = activeTab.dataset.resultTab;
    const format = elements.formatSelect.value;
    
    let content = '';
    let filename = '';
    
    if (tabName === 'formatted') {
        content = elements.formattedResult.textContent;
        filename = `parsed-result.${format}`;
    } else {
        content = elements.rawResult.textContent;
        filename = 'parsed-result.json';
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('下载成功');
}

// 展开/折叠
function toggleExpand() {
    const pre = elements.formattedResult.parentElement;
    if (pre.style.maxHeight && pre.style.maxHeight !== 'none') {
        pre.style.maxHeight = 'none';
        elements.expandBtn.textContent = '⬆️';
    } else {
        pre.style.maxHeight = '600px';
        elements.expandBtn.textContent = '⬇️';
    }
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

