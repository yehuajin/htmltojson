/**
 * 冰蓝特定解析器
 * 专门用于解析冰蓝网站的特殊结构和内容
 */

const CONSTANTS = require('../../shared/constants/iceblue.constants');

class IceblueSpecificParser {
  constructor(options = {}) {
    this.options = {
      extractNavigation: options.extractNavigation !== false,
      extractHeaders: options.extractHeaders !== false,
      extractFooters: options.extractFooters !== false,
      extractSidebars: options.extractSidebars !== false,
      extractArticles: options.extractArticles !== false,
      ...options
    };
  }

  /**
   * 解析文档结构
   * @param {Document|Element} document - DOM文档或元素
   * @returns {Object} 结构化数据
   */
  parse(document) {
    const result = {
      structure: {},
      metadata: this.extractMetadata(document),
      navigation: null,
      header: null,
      footer: null,
      sidebar: null,
      articles: [],
      mainContent: null
    };

    if (this.options.extractHeaders) {
      result.header = this.extractHeader(document);
    }

    if (this.options.extractFooters) {
      result.footer = this.extractFooter(document);
    }

    if (this.options.extractNavigation) {
      result.navigation = this.extractNavigation(document);
    }

    if (this.options.extractSidebars) {
      result.sidebar = this.extractSidebar(document);
    }

    if (this.options.extractArticles) {
      result.articles = this.extractArticles(document);
    }

    result.mainContent = this.extractMainContent(document);

    return result;
  }

  /**
   * 提取元数据
   * @param {Document} document - DOM文档
   * @returns {Object} 元数据对象
   */
  extractMetadata(document) {
    const metadata = {
      title: this.getTitle(document),
      description: this.getMetaContent(document, 'description'),
      keywords: this.getKeywords(document),
      author: this.getMetaContent(document, 'author'),
      viewport: this.getMetaContent(document, 'viewport'),
      charset: this.getCharset(document),
      url: this.getCanonicalUrl(document)
    };

    // 提取Open Graph标签
    metadata.openGraph = this.extractOpenGraph(document);

    // 提取Twitter Card标签
    metadata.twitterCard = this.extractTwitterCard(document);

    return metadata;
  }

  /**
   * 获取页面标题
   * @param {Document} document - DOM文档
   * @returns {string} 标题
   */
  getTitle(document) {
    const titleElement = document.querySelector('title');
    return titleElement ? titleElement.textContent.trim() : '';
  }

  /**
   * 获取Meta标签内容
   * @param {Document} document - DOM文档
   * @param {string} name - Meta名称
   * @returns {string} Meta内容
   */
  getMetaContent(document, name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.getAttribute('content') || '' : '';
  }

  /**
   * 获取关键词
   * @param {Document} document - DOM文档
   * @returns {Array<string>} 关键词数组
   */
  getKeywords(document) {
    const keywords = this.getMetaContent(document, 'keywords');
    return keywords ? keywords.split(',').map(k => k.trim()) : [];
  }

  /**
   * 获取字符集
   * @param {Document} document - DOM文档
   * @returns {string} 字符集
   */
  getCharset(document) {
    const charset = document.querySelector('meta[charset]');
    return charset ? charset.getAttribute('charset') : 'utf-8';
  }

  /**
   * 获取规范URL
   * @param {Document} document - DOM文档
   * @returns {string} URL
   */
  getCanonicalUrl(document) {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical ? canonical.getAttribute('href') : '';
  }

  /**
   * 提取Open Graph标签
   * @param {Document} document - DOM文档
   * @returns {Object} Open Graph数据
   */
  extractOpenGraph(document) {
    const og = {};
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    
    ogTags.forEach(tag => {
      const property = tag.getAttribute('property').replace('og:', '');
      const content = tag.getAttribute('content');
      if (content) {
        og[property] = content;
      }
    });

    return og;
  }

  /**
   * 提取Twitter Card标签
   * @param {Document} document - DOM文档
   * @returns {Object} Twitter Card数据
   */
  extractTwitterCard(document) {
    const twitter = {};
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    
    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name').replace('twitter:', '');
      const content = tag.getAttribute('content');
      if (content) {
        twitter[name] = content;
      }
    });

    return twitter;
  }

  /**
   * 提取导航
   * @param {Document} document - DOM文档
   * @returns {Object|null} 导航数据
   */
  extractNavigation(document) {
    const navSelectors = CONSTANTS.ICEBLUE_SELECTORS.NAVIGATION.split(', ');
    let navElement = null;

    for (const selector of navSelectors) {
      navElement = document.querySelector(selector);
      if (navElement) break;
    }

    if (!navElement) return null;

    return this.extractNavigationLinks(navElement);
  }

  /**
   * 提取导航链接
   * @param {Element} navElement - 导航元素
   * @returns {Object} 导航数据
   */
  extractNavigationLinks(navElement) {
    const links = [];
    const linkElements = navElement.querySelectorAll('a');

    linkElements.forEach(link => {
      links.push({
        href: link.getAttribute('href') || '',
        text: link.textContent.trim(),
        target: link.getAttribute('target') || '',
        rel: link.getAttribute('rel') || ''
      });
    });

    return {
      links,
      html: navElement.innerHTML
    };
  }

  /**
   * 提取头部
   * @param {Document} document - DOM文档
   * @returns {Object|null} 头部数据
   */
  extractHeader(document) {
    const headerSelectors = CONSTANTS.ICEBLUE_SELECTORS.HEADER.split(', ');
    let headerElement = null;

    for (const selector of headerSelectors) {
      headerElement = document.querySelector(selector);
      if (headerElement) break;
    }

    return headerElement ? {
      html: headerElement.innerHTML,
      text: headerElement.textContent.trim()
    } : null;
  }

  /**
   * 提取底部
   * @param {Document} document - DOM文档
   * @returns {Object|null} 底部数据
   */
  extractFooter(document) {
    const footerSelectors = CONSTANTS.ICEBLUE_SELECTORS.FOOTER.split(', ');
    let footerElement = null;

    for (const selector of footerSelectors) {
      footerElement = document.querySelector(selector);
      if (footerElement) break;
    }

    return footerElement ? {
      html: footerElement.innerHTML,
      text: footerElement.textContent.trim()
    } : null;
  }

  /**
   * 提取侧边栏
   * @param {Document} document - DOM文档
   * @returns {Object|null} 侧边栏数据
   */
  extractSidebar(document) {
    const sidebarSelectors = CONSTANTS.ICEBLUE_SELECTORS.SIDEBAR.split(', ');
    let sidebarElement = null;

    for (const selector of sidebarSelectors) {
      sidebarElement = document.querySelector(selector);
      if (sidebarElement) break;
    }

    return sidebarElement ? {
      html: sidebarElement.innerHTML,
      text: sidebarElement.textContent.trim()
    } : null;
  }

  /**
   * 提取文章
   * @param {Document} document - DOM文档
   * @returns {Array<Object>} 文章数组
   */
  extractArticles(document) {
    const articleSelectors = CONSTANTS.ICEBLUE_SELECTORS.ARTICLE.split(', ');
    const articles = [];

    for (const selector of articleSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        articles.push({
          html: element.innerHTML,
          text: element.textContent.trim(),
          title: this.extractArticleTitle(element),
          metadata: this.extractArticleMetadata(element)
        });
      });
    }

    return articles;
  }

  /**
   * 提取文章标题
   * @param {Element} articleElement - 文章元素
   * @returns {string} 标题
   */
  extractArticleTitle(articleElement) {
    const titleElement = articleElement.querySelector('h1, h2, h3, .title, [class*="title"]');
    return titleElement ? titleElement.textContent.trim() : '';
  }

  /**
   * 提取文章元数据
   * @param {Element} articleElement - 文章元素
   * @returns {Object} 元数据
   */
  extractArticleMetadata(articleElement) {
    const metadata = {
      author: '',
      date: '',
      category: ''
    };

    // 尝试提取作者
    const authorElement = articleElement.querySelector('[class*="author"], [rel="author"]');
    if (authorElement) {
      metadata.author = authorElement.textContent.trim();
    }

    // 尝试提取日期
    const dateElement = articleElement.querySelector('time, [class*="date"], [datetime]');
    if (dateElement) {
      metadata.date = dateElement.getAttribute('datetime') || dateElement.textContent.trim();
    }

    // 尝试提取分类
    const categoryElement = articleElement.querySelector('[class*="category"], [class*="tag"]');
    if (categoryElement) {
      metadata.category = categoryElement.textContent.trim();
    }

    return metadata;
  }

  /**
   * 提取主要内容
   * @param {Document} document - DOM文档
   * @returns {Object|null} 主要内容数据
   */
  extractMainContent(document) {
    const mainSelectors = CONSTANTS.ICEBLUE_SELECTORS.MAIN_CONTENT.split(', ');
    let mainElement = null;

    for (const selector of mainSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) break;
    }

    // 如果没有找到main元素，尝试查找内容包装器
    if (!mainElement) {
      const contentSelectors = CONSTANTS.ICEBLUE_SELECTORS.CONTENT_WRAPPER.split(', ');
      for (const selector of contentSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement) break;
      }
    }

    // 最后尝试使用body
    if (!mainElement) {
      mainElement = document.body;
    }

    return mainElement ? {
      html: mainElement.innerHTML,
      text: mainElement.textContent.trim()
    } : null;
  }
}

module.exports = IceblueSpecificParser;

