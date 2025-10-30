#!/usr/bin/env node

/**
 * 环境配置检查脚本
 * 检查所有必需的环境变量和配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查环境配置...\n');

let hasErrors = false;

// 检查文件是否存在
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - 未找到文件: ${filePath}`);
    hasErrors = true;
    return false;
  }
}

// 检查环境变量
function checkEnvVar(envContent, varName, description) {
  const regex = new RegExp(`^${varName}=.+`, 'm');
  if (regex.test(envContent)) {
    const value = envContent.match(regex)[0].split('=')[1];
    if (value && value !== 'your_' && !value.includes('_here')) {
      console.log(`✅ ${description}`);
      return true;
    }
  }
  console.log(`❌ ${description} - 未配置或使用占位符`);
  hasErrors = true;
  return false;
}

console.log('📋 检查必需文件:\n');

// 检查前端文件
checkFileExists(
  path.join(__dirname, 'frontend', 'package.json'),
  '前端 package.json'
);
checkFileExists(
  path.join(__dirname, 'frontend', '.env.local'),
  '前端环境变量文件 (.env.local)'
);

// 检查 Supabase 文件
checkFileExists(
  path.join(__dirname, 'supabase', 'schema.sql'),
  '数据库 Schema'
);
checkFileExists(
  path.join(__dirname, 'supabase', 'functions', 'generate-trip', 'index.ts'),
  'Edge Function: generate-trip'
);
checkFileExists(
  path.join(__dirname, 'supabase', 'functions', 'record-expense-voice', 'index.ts'),
  'Edge Function: record-expense-voice'
);

console.log('\n📋 检查环境变量:\n');

// 读取 .env.local
const envPath = path.join(__dirname, 'frontend', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  checkEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL');
  checkEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key');
  checkEnvVar(envContent, 'NEXT_PUBLIC_AMAP_KEY', '高德地图 JS API Key');
}

console.log('\n📋 检查 Node 依赖:\n');

const nodeModulesPath = path.join(__dirname, 'frontend', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ Node modules 已安装');
} else {
  console.log('❌ Node modules 未安装 - 请运行: cd frontend && npm install');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50) + '\n');

if (hasErrors) {
  console.log('❌ 发现配置问题，请根据上述提示修复\n');
  console.log('📖 详细配置指南: SUPABASE_GUIDE.md\n');
  process.exit(1);
} else {
  console.log('✅ 所有检查通过！可以启动应用\n');
  console.log('🚀 运行以下命令启动应用:');
  console.log('   ./start.sh');
  console.log('   或');
  console.log('   cd frontend && npm run dev\n');
  process.exit(0);
}

