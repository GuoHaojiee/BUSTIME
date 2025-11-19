/**
 * 简单的服务器测试脚本
 * 用于验证基本功能是否正常
 */

const http = require('http');

console.log('🧪 开始测试服务器...\n');

// 测试健康检查
function testHealth() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 健康检查通过');
          console.log('响应:', JSON.parse(data));
          resolve(true);
        } else {
          console.log('❌ 健康检查失败');
          reject(new Error(`状态码: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      console.log('❌ 无法连接到服务器');
      console.log('错误:', err.message);
      console.log('\n请确保服务器正在运行：npm run dev');
      reject(err);
    });
  });
}

// 运行测试
testHealth()
  .then(() => {
    console.log('\n✨ 服务器运行正常！');
    console.log('\n可以使用的 API 端点：');
    console.log('- GET  /health');
    console.log('- GET  /api/search?q=关键词');
    console.log('- GET  /api/stop/:stopId');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
