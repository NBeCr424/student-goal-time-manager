# 外部 App 日程导入 API 对接文档 v1

更新时间：2026-03-19
版本：v1

## 1. 概览
本接口用于把第三方 App 的日程导入到本系统。

特点：
- 单向导入（外部 App -> 当前系统）
- 幂等（同一条 externalId 重复推送不会重复新增）
- 令牌隔离（每个用户可创建多个集成令牌）

## 2. 认证方式
### 2.1 外部导入接口认证
- Header: `Authorization: Bearer <integration_token>`
- 令牌格式示例：`itg_xxxxxxxxxxxxxxxxxx`

### 2.2 令牌管理接口认证
- Header: `Authorization: Bearer <supabase_access_token>`
- 用于当前站内“我的 > 外部应用联动”页面管理令牌

## 3. 接口清单
### 3.1 导入日程（对外）
- 方法：`POST`
- 路径：`/api/integrations/schedule/import`
- Content-Type：`application/json`

请求体：
```json
{
  "source": "other_app",
  "items": [
    {
      "externalId": "evt_1001",
      "title": "高数复习",
      "startAt": "2026-03-20T19:00:00+08:00",
      "endAt": "2026-03-20T20:30:00+08:00",
      "allDay": false,
      "note": "做第3章习题",
      "location": "图书馆"
    }
  ]
}
```

成功响应：
```json
{
  "ok": true,
  "source": "other_app",
  "imported": 1,
  "updated": 0,
  "skipped": 0,
  "totalAccepted": 1
}
```

### 3.2 读取令牌列表（站内）
- 方法：`GET`
- 路径：`/api/integrations/tokens`

### 3.3 创建令牌（站内）
- 方法：`POST`
- 路径：`/api/integrations/tokens`

请求体：
```json
{
  "name": "飞书日历同步"
}
```

成功响应：
```json
{
  "ok": true,
  "token": "itg_xxx",
  "item": {
    "id": "uuid",
    "name": "飞书日历同步",
    "tokenHint": "a1b2c3",
    "isActive": true,
    "createdAt": "2026-03-19T15:30:00.000Z",
    "updatedAt": "2026-03-19T15:30:00.000Z",
    "lastUsedAt": null,
    "revokedAt": null
  }
}
```

### 3.4 停用令牌（站内）
- 方法：`POST`
- 路径：`/api/integrations/tokens/{tokenId}/revoke`

## 4. 字段说明
### 4.1 导入请求顶层字段
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| source | string | 否 | 来源系统标识，默认 `external_app`，会自动规范化 |
| items | array | 是 | 日程数组，1~200 条 |

### 4.2 items 内字段
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| externalId | string | 是 | 外部系统事件唯一标识 |
| title | string | 是 | 事件标题 |
| startAt | string (ISO8601) | 否 | 开始时间，建议带时区 |
| endAt | string (ISO8601) | 否 | 结束时间，建议带时区 |
| allDay | boolean | 否 | 是否全天，默认 false |
| note | string | 否 | 备注 |
| location | string | 否 | 地点 |

## 5. 幂等与去重规则
- 去重键：`user_id + source + external_id`
- 同一事件再次导入：
  - 不会重复新增
  - 会更新已有任务和导入记录
- `externalId` 在一次请求体内重复时，仅保留最后一条

## 6. 导入后的落地规则
- 写入当前用户的 `tasks` 表（云端）
- 任务 `source=imported`
- 计划类型默认 `today_other`
- `allDay=false` 且 `startAt/endAt` 可解析时，会落入排程字段（startTime/endTime）

## 7. 错误码
### 7.1 导入接口错误
| HTTP | message 示例 | 触发条件 |
|---|---|---|
| 400 | 请求体不是合法 JSON。 | body 非 JSON |
| 400 | items 不能为空。 | 缺少或空数组 |
| 400 | 单次最多导入 200 条。 | 数量超限 |
| 400 | 没有可导入的有效日程。 | 全部字段无效 |
| 401 | 缺少集成令牌。 | 无 Authorization |
| 401 | 集成令牌无效。 | token 不存在/错误 |
| 403 | 该集成令牌已停用。 | token 被 revoke |
| 500 | 读取已存在任务失败：... | 数据库读取失败 |
| 500 | 写入任务失败：... | 数据库写失败 |
| 500 | 写入导入日志失败：... | 数据库写失败 |
| 503 | 服务端 Supabase 未配置... | 缺少服务端配置 |

### 7.2 令牌管理接口常见错误
| HTTP | message 示例 | 触发条件 |
|---|---|---|
| 401 | 缺少登录令牌。 | 未传用户 access token |
| 401 | 登录状态已失效，请重新登录。 | 用户 token 过期 |
| 404 | 未找到可操作的令牌... | tokenId 不存在/非本人 |
| 503 | 服务端 Supabase 未配置... | 缺少服务端配置 |

## 8. 调用示例（cURL）
### 8.1 外部 App 导入
```bash
curl -X POST 'https://your-domain.com/api/integrations/schedule/import' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer itg_xxx' \
  -d '{
    "source":"other_app",
    "items":[
      {
        "externalId":"evt_1001",
        "title":"高数复习",
        "startAt":"2026-03-20T19:00:00+08:00",
        "endAt":"2026-03-20T20:30:00+08:00",
        "allDay":false,
        "note":"做第3章习题"
      }
    ]
  }'
```

### 8.2 站内创建令牌
```bash
curl -X POST 'https://your-domain.com/api/integrations/tokens' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <supabase_access_token>' \
  -d '{"name":"飞书日历同步"}'
```

## 9. 接入建议
- 建议外部系统以分钟级别增量推送
- 必须保证 `externalId` 在 source 内稳定不变
- 遇到 `401/403` 时，应提示管理员更换令牌
- 建议上游保留失败重试（指数退避）

## 10. Postman
- 集合文件：`docs/integrations/postman/student-schedule-import-v1.postman_collection.json`
- 导入后配置变量：
  - `baseUrl`
  - `integrationToken`
  - `userAccessToken`
  - `tokenId`（可由“创建令牌”请求自动写入）
