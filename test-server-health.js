const https = require('https');

const HOST = 'studyscribe.zingyzong.com';
const PORT = 443;

console.log(`🔍 Testing server health at ${HOST}:${PORT}`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 10000,
  headers: {
    'User-Agent': 'Health-Check-Test'
  },
  rejectUnauthorized: false // Permitir certificados autofirmados
};

console.log(`📡 Making request to: https://${HOST}:${PORT}/health`);

const req = https.request(options, (res) => {
  console.log(`✅ Response status: ${res.statusCode}`);
  console.log(`📊 Response headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Response body:`, data);
    
    if (res.statusCode === 200) {
      console.log('🎉 Health check PASSED - Server is responding correctly');
      process.exit(0);
    } else {
      console.log('❌ Health check FAILED - Server returned non-200 status');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Request failed: ${error.message}`);
  console.log('💡 Possible issues:');
  console.log('   - Server is not running');
  console.log('   - Network connectivity issues');
  console.log('   - Firewall blocking the connection');
  console.log('   - DNS resolution problems');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timeout - Server is not responding');
  req.destroy();
  process.exit(1);
});

req.end();
