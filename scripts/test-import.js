#!/usr/bin/env node

/**
 * 测试食谱导入功能
 * 
 * 这个脚本会调用导入 API 并显示结果
 * 使用方法：node scripts/test-import.js
 */

const https = require('https');
const http = require('http');

// 配置
const config = {
  // 本地开发环境
  local: {
    protocol: 'http',
    host: 'localhost',
    port: 3000,
    path: '/api/import-recipes'
  },
  // 生产环境（根据实际情况修改）
  production: {
    protocol: 'https',
    host: 'your-domain.com',
    port: 443,
    path: '/api/import-recipes'
  }
};

// 获取环境配置
const env = process.argv[2] || 'local';
const apiConfig = config[env];

if (!apiConfig) {
  console.error('❌ 无效的环境参数。使用: local 或 production');
  process.exit(1);
}

console.log(`🚀 开始测试食谱导入功能 (${env} 环境)`);
console.log(`📡 API 地址: ${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}${apiConfig.path}`);

// 示例食谱数据（简化版，用于测试）
const testRecipes = [
  {
    id: 1,
    title: "Test Mapo Tofu",
    image_url: "/recipe-images/mapo-tofu.png",
    description: "Test recipe for Mapo Tofu",
    tags: ["Chinese", "Spicy"],
    cookTime: 20,
    servings: 4,
    difficulty: "Medium",
    ingredients: ["tofu", "pork", "sauce"],
    steps: ["Step 1", "Step 2", "Step 3"],
    chefTips: ["Tip 1", "Tip 2"]
  },
  {
    id: 2,
    title: "Test Carbonara",
    image_url: "/recipe-images/carbonara.png",
    description: "Test recipe for Carbonara",
    tags: ["Italian", "Pasta"],
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["pasta", "eggs", "cheese"],
    steps: ["Step 1", "Step 2"],
    chefTips: ["Tip 1"]
  }
];

// 发送 POST 请求
function sendRequest() {
  const postData = JSON.stringify({ recipes: testRecipes });
  
  const options = {
    hostname: apiConfig.host,
    port: apiConfig.port,
    path: apiConfig.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const client = apiConfig.protocol === 'https' ? https : http;
  
  const req = client.request(options, (res) => {
    console.log(`📊 响应状态: ${res.statusCode}`);
    console.log(`📋 响应头:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('\n✅ 响应数据:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('\n🎉 导入测试成功！');
          if (result.data) {
            console.log(`📈 导入统计:`);
            console.log(`  - 成功导入: ${result.data.imported} 个食谱`);
            console.log(`  - 创建菜系: ${result.data.cuisines?.length || 0} 个`);
            console.log(`  - 错误数量: ${result.data.errors?.length || 0} 个`);
            
            if (result.data.cuisines && result.data.cuisines.length > 0) {
              console.log(`  - 新菜系: ${result.data.cuisines.join(', ')}`);
            }
            
            if (result.data.errors && result.data.errors.length > 0) {
              console.log(`  - 错误详情:`);
              result.data.errors.forEach(error => console.log(`    * ${error}`));
            }
          }
        } else {
          console.log('\n❌ 导入测试失败');
          console.log(`错误信息: ${result.error}`);
          if (result.details) {
            console.log(`详细信息: ${result.details}`);
          }
        }
      } catch (error) {
        console.error('❌ 解析响应数据失败:', error);
        console.log('原始响应:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ 请求失败:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示:');
      console.log('  1. 确保开发服务器正在运行: npm run dev');
      console.log('  2. 检查端口号是否正确');
      console.log('  3. 如果使用生产环境，请检查域名和端口配置');
    }
  });
  
  req.on('timeout', () => {
    console.error('❌ 请求超时');
    req.destroy();
  });
  
  // 设置超时时间
  req.setTimeout(30000);
  
  // 发送数据
  req.write(postData);
  req.end();
}

// 显示使用说明
function showUsage() {
  console.log('\n📖 使用说明:');
  console.log('  node scripts/test-import.js [环境]');
  console.log('');
  console.log('环境选项:');
  console.log('  local      - 本地开发环境 (默认)');
  console.log('  production - 生产环境');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/test-import.js local');
  console.log('  node scripts/test-import.js production');
}

// 主函数
function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    return;
  }
  
  console.log('⏳ 发送测试请求...\n');
  sendRequest();
}

// 运行脚本
main();
