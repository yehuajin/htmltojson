/**
 * 后端使用示例
 * 在Node.js环境中使用
 */

const BackendParser = require('../src/backend/parser/BackendParser');

// 创建解析器实例
const parser = new BackendParser({
  includeImages: true,
  processImages: false, // 是否处理图片（下载、优化等）
  validate: true,
  strictMode: false
});

// 示例HTML
const sampleHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>后端解析示例</title>
    <meta name="description" content="后端解析示例页面">
</head>
<body>
    <div class="content">
        <h1>标题</h1>
        <p>这是一段内容。</p>
        <ul>
            <li>列表项1</li>
            <li>列表项2</li>
        </ul>
    </div>
</body>
</html>
`;

// 使用示例
async function example() {
  console.log('=== 后端解析示例 ===\n');

  // 解析HTML字符串
  console.log('1. 解析HTML字符串...');
  const result1 = await parser.parse(sampleHTML, {
    includeImages: true
  });

  if (result1.success) {
    console.log('解析成功！');
    console.log('标题:', result1.data.metadata.title);
    console.log('总元素数:', result1.data.stats?.totalElements);
    console.log('验证结果:', result1.validation?.valid ? '通过' : '失败');
    if (result1.validation?.warnings?.length > 0) {
      console.log('警告:', result1.validation.warnings);
    }
  } else {
    console.error('解析失败:', result1.error);
  }

  // 使用Cheerio快速解析（轻量级）
  console.log('\n2. 使用Cheerio快速解析...');
  const result2 = parser.parseWithCheerio(sampleHTML);
  if (result2.success) {
    console.log('Cheerio解析成功！');
    console.log('元数据:', result2.data.metadata);
    console.log('图片数量:', result2.data.images?.length || 0);
  }

  // 批量解析
  console.log('\n3. 批量解析...');
  const htmls = [sampleHTML, sampleHTML];
  const results = await parser.parseBatch(htmls);
  console.log(`批量解析完成，共${results.length}个结果，成功${results.filter(r => r.success).length}个`);

  // 从URL解析（需要有效的URL）
  // console.log('\n4. 从URL解析...');
  // try {
  //   const urlResult = await parser.parseUrl('https://example.com');
  //   if (urlResult.success) {
  //     console.log('URL解析成功！');
  //     console.log('标题:', urlResult.data.metadata.title);
  //   }
  // } catch (error) {
  //   console.log('URL解析失败:', error.message);
  // }
}

// 运行示例
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { example };

