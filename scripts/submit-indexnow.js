#!/usr/bin/env node

/**
 * 手动提交主要页面到 IndexNow
 * 使用方法: node scripts/submit-indexnow.js
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com';

async function submitToIndexNow() {
  try {
    console.log('🚀 Submitting main pages to IndexNow...');
    
    const response = await fetch(`${SITE_URL}/api/indexnow`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data.message);
    } else {
      const error = await response.json();
      console.error('❌ Error:', error.error);
    }
  } catch (error) {
    console.error('❌ Failed to submit to IndexNow:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  submitToIndexNow();
}

module.exports = { submitToIndexNow };
