require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('==========================');

const requiredVars = [
  'REPLICATE_API_TOKEN',
  'DASHSCOPE_API_KEY',
  'WORKER_URL'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\nConfig Check:');
console.log('============');

const { IMAGE_GEN_CONFIG } = require('./lib/config.ts');

console.log('Replicate Config:', {
  BASE_URL: IMAGE_GEN_CONFIG.REPLICATE.BASE_URL,
  VERSION: IMAGE_GEN_CONFIG.REPLICATE.VERSION,
  MODEL_ID: IMAGE_GEN_CONFIG.REPLICATE.MODEL_ID
});

console.log('Wanx Config:', {
  BASE_URL: IMAGE_GEN_CONFIG.WANX.BASE_URL,
  MODEL: IMAGE_GEN_CONFIG.WANX.MODEL
}); 