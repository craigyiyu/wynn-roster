# Demo Requirements - 完成这个版本

## 最低完成标准
1. 访问 http://101.43.86.63:3000 能看到页面
2. 访问 http://101.43.86.63:3000/api-test 能看到 API 数据
3. 后端 API 正常运行

## 你已经有的
- 后端代码: ~/.openclaw/workspace/wynn-roster/server/index.cjs (运行在 3001)
- 前端代码: ~/.openclaw/workspace/wynn-roster/ (构建好)
- API: http://localhost:3001 (health, constraints, results 等)
- 前端服务器: /tmp/frontend.js (运行在 3000)

## 如果有问题
- 前端挂了: 重启 /tmp/frontend.js
- 后端挂了: 重启 server/index.cjs
- CORS 问题: 后端已有 cors 中间件

## 完成后
回复 Bob: "Demo ready at http://101.43.86.63:3000/api-test"
