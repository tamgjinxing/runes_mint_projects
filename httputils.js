const https = require('https');

function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    // 发送 GET 请求
    const req = https.get(url, (res) => {
      let data = '';

      // 监听数据传输过程
      res.on('data', (chunk) => {
        data += chunk; // 拼接响应数据
      });

      // 监听数据传输结束
      res.on('end', () => {
        resolve(data); // 返回完整的数据
      });
    });

    // 处理请求错误
    req.on('error', (e) => {
      reject(`请求出错: ${e.message}`);
    });
  });
}

module.exports = { makeGetRequest };
