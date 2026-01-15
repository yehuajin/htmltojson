/**
 * 前端使用示例
 * 在浏览器或Node.js环境中使用
 */

const IceblueParser = require('../src/frontend');

// 创建解析器实例
const parser = new IceblueParser({
  parser: {
    includeImages: true,
    includeScripts: false,
    strictMode: false
  },
  cache: {
    enabled: true,
    ttl: 3600000 // 1小时
  }
});

// 示例HTML
const sampleHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>示例页面</title>
    <meta name="description" content="这是一个示例页面">
    <meta name="keywords" content="示例,测试,HTML">
</head>
<body>
    <header>
        <h1>欢迎</h1>
        <nav>
            <a href="/home">首页</a>
            <a href="/about">关于</a>
        </nav>
    </header>
    <main>
        <article>
            <h2>文章标题</h2>
            <p>这是一段文本内容。</p>
            <img src="https://example.com/image.jpg" alt="示例图片">
        </article>
    </main>
    <footer>
        <p>© 2024 示例网站</p>
    </footer>
</body>
</html>
`;

// 使用示例
async function example() {
  console.log('=== 前端解析示例 ===\n');

  // 解析HTML
  console.log('1. 解析HTML...');
  const result = await parser.parse(sampleHTML, {
    includeImages: true
  });

  if (result.success) {
    console.log('解析成功！');
    console.log('元数据:', JSON.stringify(result.data.metadata, null, 2));
    console.log('统计信息:', JSON.stringify(result.data.stats, null, 2));
    console.log('图片数量:', result.data.images?.length || 0);
    console.log('链接数量:', result.data.links?.length || 0);
  } else {
    console.error('解析失败:', result.error);
  }

  // 格式化输出
  console.log('\n2. 格式化为JSON...');
  const json = parser.parser.format(result.data, 'json', { indent: 2 });
  console.log(json.substring(0, 200) + '...');

  // 格式化为文本
  console.log('\n3. 格式化为文本...');
  const text = parser.parser.format(result.data, 'text');
  console.log(text.substring(0, 200) + '...');

  // 缓存统计
  console.log('\n4. 缓存统计...');
  const cacheStats = parser.getCacheStats();
  console.log(cacheStats);
}

// 运行示例
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { example };

