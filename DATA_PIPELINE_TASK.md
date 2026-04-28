# Data Pipeline 实现任务

## 参考
Manus 分析文档：https://manus.im/app/d69SkiTPzFC5zogBxHkRxQ

## Data Pipeline 包含以下页面

### 1. Data Intake
- 功能：Excel 文件上传、数据解析、状态追踪
- 需要的 API：
  - POST /api/schedule/upload - 上传文件
  - GET /api/schedule/upload/status/:id - 获取解析状态
  - GET /api/schedule/constraints - 获取约束统计

### 2. ETL & Normalize
- 功能：数据清洗、标准化、异常检测
- 需要的 API：
  - GET /api/etl/validate - 验证数据
  - GET /api/etl/stats - 获取 ETL 统计

### 3. AI Extraction
- 功能：AI 提取审核、人工确认
- 需要的 API：
  - GET /api/extraction/pending - 待审核项
  - POST /api/extraction/confirm - 确认提取结果

### 4. Data Lineage
- 功能：数据血缘追踪
- 需要的 API：
  - GET /api/lineage/:recordId - 获取记录血缘

## 执行步骤
1. 检查 /client/src/pages/ 下是否有这些页面
2. 如果没有，从 GitHub 原版复制
3. 连接页面到后端 API
4. 测试确保功能正常

## 完成后
报告哪些页面实现了，测试结果
