# Wynn Roster 后端任务 - Elon 执行

## 目标
在 ~/.openclaw/workspace/wynn-roster/ 目录下构建 Express 后端，连接 SQL Server 数据库，实现规则引擎。

## 数据库连接
- Server: 8.130.98.152,2433
- Database: wynnai
- User: SA
- Password: AT65gcfdjp

## 数据库表和字段

### req_rdo_leave_table (RDO 请假)
| 字段 | 说明 |
|------|------|
| Payroll | 员工工号 |
| ai_result | JSON日期数组，如 ["2026-04-07"] |
| Period | 日期范围，如 "06/04/2026 - 06/04/2026" |
| Status | 状态 (Approved 等) |

### couple_special_request (特殊请求)
| 字段 | 说明 |
|------|------|
| EmpNo | 员工工号 |
| ai_type | allow 或 refuse |
| ai_value | JSON班次数组，如 ["LM", "ED"] |
| Until | 有效期截止日期 |

### wm_wp_ev_es_employee (EV/ES 夜班员工)
| 字段 | 说明 |
|------|------|
| EmployeeID | 员工工号 |
| Name | 姓名 |

**注意：这个表里的所有员工都是 EVES 员工，不需要额外的 IsEVES 字段**

### AI_Shift_Scheduling_Result_Table (排班结果)
| 字段 | 说明 |
|------|------|
| EmployeeNumber | 员工工号 |
| ShiftDate | 排班日期 |
| ShiftValue | 班次值 |
| RDO_Display | RDO显示 |
| IsEVES | EVES标记 |
| SpecialRequestAI | AI特殊请求结果 |

## 规则引擎（责任链模式）

### 优先级
1. **RDO (Priority 1)** - ai_result 或 Period 中的日期阻止排班
2. **SR (Priority 2)** - ai_type=refuse 时禁止指定班次，allow 时只允许指定班次
3. **EVES (Priority 3)** - 表内员工只能在 14:00 后上班（夜班）

### 冲突消解
- 高优先级规则覆盖低优先级
- RDO > SR > EVES

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/health | GET | 健康检查 |
| /api/schedule/upload | POST | Excel 上传解析 |
| /api/schedule/constraints | GET | 获取约束统计 |
| /api/schedule/generate | POST | 触发排班生成 |
| /api/schedule/results | GET | 获取排班结果 |
| /api/schedule/override | PUT | 手动覆盖 |

## 依赖
npm install mssql multer cors xlsx express

## 输出要求
完成后报告：
1. 实现的 API 端点列表
2. 规则引擎如何工作
3. 测试结果（调用 /api/health 和 /api/schedule/constraints）

