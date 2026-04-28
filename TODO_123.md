# Wynn Roster 完善任务

## 当前状态
- 规则引擎已加载 RDO/SR/EVES/Demand
- /generate 只是加载规则，没有真正生成
- 没有冲突展示
- Demand 验证未真正应用

## 需要完成的三个功能

### 1. 实际排班生成算法
在 /api/schedule/generate 中实现：
- 读取 AI_Shift_Scheduling_Result_Table 的现有数据
- 对每条记录应用规则验证（RDO/SR/EVES/Demand）
- 标记违规的记录（IsChanged=1, ChangeDetail）
- 更新数据库中的记录
- 返回生成结果统计

### 2. 冲突解决 UI
在 ScheduleBuilder 页面：
- 高亮显示违规的排班记录（红色/黄色背景）
- 显示违规原因（ChangeDetail）
- 添加"解决冲突"按钮
- 点击后调用 /api/schedule/override

### 3. Demand 验证逻辑
在规则引擎中：
- validate() 已接收 position 参数
- 对每个班次/职位/日期组合，统计已分配人数
- 如果 assigned < required，标记为 soft violation（不阻止但警告）
- 在结果中展示 Demand 覆盖情况

## 数据库
- Server: 8.130.98.152,2433
- Database: wynnai
- Tables: AI_Shift_Scheduling_Result_Table

## API 端点
- GET /api/schedule/results - 获取结果
- PUT /api/schedule/override - 手动覆盖

## 完成后
报告：实现了哪些功能，测试结果

## Manus 最新版本缺失功能
参考: https://wynnrostor-2xrpn8ah.manus.space

### Data Pipeline Section (必须实现)
Manus 版本有完整的数据流程页面，包含：
- DataIntake: Excel 上传 + 解析状态
- ETL & Normalization: 数据清洗
- AI Extraction Review: AI 提取审核
- RosterGenerationFlow: 排班生成流程

检查 /client/src/pages/ 下是否有这些页面，如果没有需要创建：
- ETLNormalization.tsx
- AIExtractionReview.tsx
- RosterGenerationFlow.tsx
- DemandSkills.tsx
- RotationView.tsx

如果缺失，从 GitHub 原版复制并连接后端 API。

