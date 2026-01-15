/**
 * API使用示例
 * 展示如何通过HTTP API使用解析服务
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// 示例HTML
const sampleHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>API解析示例</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>这是一个通过API解析的示例。</p>
</body>
</html>
`;

// API客户端类
class ApiClient {
  constructor(baseURL, apiKey = null) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey })
      }
    });
  }

  /**
   * 解析HTML
   */
  async parseHTML(html, options = {}) {
    try {
      const response = await this.client.post('/parse', {
        html,
        options
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 从URL解析
   */
  async parseURL(url, options = {}) {
    try {
      const response = await this.client.post('/parse-url', {
        url,
        options
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 代理请求
   */
  async proxy(url) {
    try {
      const response = await this.client.get('/proxy', {
        params: { url }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 批量解析
   */
  async parseBatch(htmls, options = {}) {
    try {
      const response = await this.client.post('/parse-batch', {
        htmls,
        options
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const response = await axios.get(this.baseURL.replace('/api', '/health'));
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

// 使用示例
async function example() {
  console.log('=== API使用示例 ===\n');

  // 创建API客户端
  const client = new ApiClient(API_BASE_URL);

  // 健康检查
  console.log('1. 健康检查...');
  try {
    const health = await client.healthCheck();
    console.log('服务状态:', health.status);
  } catch (error) {
    console.error('健康检查失败:', error.message);
    console.log('请确保服务器正在运行: npm start');
    return;
  }

  // 解析HTML
  console.log('\n2. 解析HTML...');
  try {
    const result = await client.parseHTML(sampleHTML, {
      includeImages: true,
      strictMode: false
    });

    if (result.success) {
      console.log('解析成功！');
      console.log('标题:', result.data.metadata.title);
      console.log('统计信息:', result.data.stats);
    } else {
      console.error('解析失败:', result.error);
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
  }

  // 批量解析
  console.log('\n3. 批量解析...');
  try {
    const batchResult = await client.parseBatch([sampleHTML, sampleHTML]);
    console.log(`批量解析完成，成功${batchResult.successful}/${batchResult.total}个`);
  } catch (error) {
    console.error('批量解析失败:', error.message);
  }

  // 获取统计信息
  console.log('\n4. 获取统计信息...');
  try {
    const stats = await client.getStats();
    console.log('服务器统计:', stats);
  } catch (error) {
    console.error('获取统计信息失败:', error.message);
  }

  // 从URL解析（需要有效的URL）
  // console.log('\n5. 从URL解析...');
  // try {
  //   const urlResult = await client.parseURL('https://example.com');
  //   if (urlResult.success) {
  //     console.log('URL解析成功！');
  //   }
  // } catch (error) {
  //   console.error('URL解析失败:', error.message);
  // }
}

// 运行示例
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { ApiClient, example };

