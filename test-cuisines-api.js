#!/usr/bin/env node

/**
 * 测试 cuisines API 的脚本
 * 用于诊断生产环境中的问题
 */

const API_BASE = 'https://recipe-easy.com';

async function testCuisinesAPI() {
  console.log('🧪 Testing Cuisines API...\n');
  
  const testCases = [
    { lang: 'en', description: 'English' },
    { lang: 'zh', description: 'Chinese' }
  ];
  
  for (const testCase of testCases) {
    console.log(`📝 Testing ${testCase.description} (lang=${testCase.lang})...`);
    
    try {
      const url = `${API_BASE}/api/cuisines?lang=${testCase.lang}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response:`, JSON.stringify(data, null, 2));
        
        if (data.success && data.results) {
          console.log(`🎯 Found ${data.results.length} cuisines`);
          console.log(`🌍 Language: ${data.language}`);
          
          // 显示前几个菜系
          if (data.results.length > 0) {
            console.log('📋 Sample cuisines:');
            data.results.slice(0, 3).forEach((cuisine, index) => {
              console.log(`   ${index + 1}. ${cuisine.name} (${cuisine.slug})`);
            });
          }
        } else {
          console.log('❌ Invalid response format');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
      }
    } catch (error) {
      console.log(`💥 Network error: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('🏁 Test completed!');
}

// 运行测试
testCuisinesAPI().catch(console.error); 