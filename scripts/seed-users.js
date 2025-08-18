#!/usr/bin/env node

/**
 * 为数据库添加测试用户数据
 * 运行命令: node scripts/seed-users.js
 */

const { execSync } = require('child_process');

// 测试用户数据
const testUsers = [
  {
    id: 'admin_user_credits',
    userId: '157b6650-29b8-4613-87d9-ce0997106151', // 管理员用户ID
    credits: 999999,
    totalEarned: 999999,
    totalSpent: 0,
    isAdmin: true,
    description: 'Admin user with unlimited credits'
  },
  {
    id: 'test_user_1',
    userId: 'test-user-001',
    credits: 7,
    totalEarned: 7,
    totalSpent: 0,
    isAdmin: false,
    description: 'Regular test user with initial credits'
  },
  {
    id: 'test_user_2', 
    userId: 'test-user-002',
    credits: 3,
    totalEarned: 8,
    totalSpent: 5,
    isAdmin: false,
    description: 'Test user who has used some credits'
  },
  {
    id: 'test_user_3',
    userId: 'test-user-003',
    credits: 0,
    totalEarned: 7,
    totalSpent: 7,
    isAdmin: false,
    description: 'Test user with no credits left'
  }
];

async function seedUsers() {
  console.log('🌱 开始添加测试用户数据...');

  try {
    for (const user of testUsers) {
      console.log(`\n👤 添加用户: ${user.userId} (${user.isAdmin ? '管理员' : '普通用户'})`);
      
      // 检查用户是否已存在
      try {
        const existingUser = execSync(
          `wrangler d1 execute recipe-easy-db --remote --command="SELECT user_id FROM user_credits WHERE user_id = '${user.userId}';"`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
        
        if (existingUser.includes(user.userId)) {
          console.log(`⚠️  用户 ${user.userId} 已存在，跳过...`);
          continue;
        }
      } catch (error) {
        // 用户不存在，继续添加
      }

      // 插入用户积分记录
      const insertUserCommand = `
        INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
        VALUES ('${user.id}', '${user.userId}', ${user.credits}, ${user.totalEarned}, ${user.totalSpent}, datetime('now'), datetime('now'));
      `.trim();

      execSync(
        `wrangler d1 execute recipe-easy-db --remote --command="${insertUserCommand}"`,
        { encoding: 'utf8', cwd: process.cwd() }
      );

      // 插入初始积分交易记录
      const transactionId = `${user.id}_initial_transaction`;
      const insertTransactionCommand = `
        INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at) 
        VALUES ('${transactionId}', '${user.userId}', 'earn', ${user.totalEarned}, '${user.isAdmin ? 'admin_grant' : 'initial'}', '${user.description}', datetime('now'));
      `.trim();

      execSync(
        `wrangler d1 execute recipe-easy-db --remote --command="${insertTransactionCommand}"`,
        { encoding: 'utf8', cwd: process.cwd() }
      );

      // 如果用户有消费记录，添加消费交易
      if (user.totalSpent > 0) {
        const spendTransactionId = `${user.id}_spend_transaction`;
        const insertSpendCommand = `
          INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at) 
          VALUES ('${spendTransactionId}', '${user.userId}', 'spend', ${user.totalSpent}, 'generation', 'Recipe generation costs', datetime('now'));
        `.trim();

        execSync(
          `wrangler d1 execute recipe-easy-db --remote --command="${insertSpendCommand}"`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
      }

      console.log(`✅ 用户 ${user.userId} 添加成功`);
    }

    // 显示所有用户数据
    console.log('\n📊 当前数据库中的用户数据:');
    const allUsers = execSync(
      'wrangler d1 execute recipe-easy-db --remote --command="SELECT user_id, credits, total_earned, total_spent FROM user_credits ORDER BY created_at;"',
      { encoding: 'utf8', cwd: process.cwd() }
    );
    console.log(allUsers);

    console.log('\n🎉 测试用户数据添加完成！');
    console.log('\n📋 测试用户列表:');
    testUsers.forEach(user => {
      console.log(`- ${user.userId}: ${user.credits}积分 (${user.isAdmin ? '管理员' : '普通用户'})`);
    });

  } catch (error) {
    console.error('❌ 添加测试用户失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
seedUsers();
