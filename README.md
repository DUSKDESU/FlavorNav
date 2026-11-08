# 寻味华夏 FlavorNav

一个中国地方美食文化分享与导航平台，面向 2026 中国计算机设计大赛。用户可按省份在 ECharts 地图上浏览各地特色美食，发布美食帖、评论点赞、收藏、关注他人；管理员可对内容进行审核管理。平台内置基于阿里云通义千问（qwen-plus）与高德地图 API 的 AI 助手，支持 IP/坐标定位、当地美食推荐与智能问答。

## 技术栈

| 层面 | 技术 |
| ---- | ---- |
| 后端 | Spring Boot 4.0.5 · Java 17 · MyBatis · MySQL |
| 前端 | 原生 HTML / CSS / JavaScript · ECharts |
| 工具库 | Lombok · Fastjson · httpclient5 · ip2region |
| 外部服务 | 阿里云 DashScope（通义千问 qwen-plus）· 高德地图 API |

## 项目结构

```
src/main/java/match/flavornav/
├── FlavorNavApplication.java     # 启动类
├── config/WebConfig.java         # 跨域 / 静态资源 / 视图跳转配置
├── controller/                   # 控制器（对外接口）
├── service/                      # 业务层
├── mapper/                       # MyBatis 接口
├── entity/                       # 实体类
└── util/                         # 工具类（IP 数据初始化等）

src/main/resources/
├── application.properties        # 配置（数据库 / AI / 高德地图）
├── mapper/*.xml                  # MyBatis SQL 映射
└── static/                       # 前端页面与静态资源
    ├── index.html                # 跳转页
    ├── pages/auth/               # 各功能页面（地图 / 搜索 / 登录 / 后台等）
    ├── css/ · js/ · images/      # 样式、脚本、图片
```

## 快速开始

1. **数据库**：创建 MySQL 数据库 `flavor_nav`，账号 `root` / 密码 `1234`（可在 `application.properties` 中修改），导入对应的表结构。
2. **配置密钥**：在 `application.properties` 中填写 DashScope 与高德地图的 API Key。
3. **启动**：

```bash
mvnw spring-boot:run
```

默认端口 `8081`，启动后访问首页 `http://localhost:8081`。

---

## 通用约定

### 统一响应格式

除文件上传外，所有接口返回统一的 `Result<T>` JSON：

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

- `code = 200`：成功
- `code = 500`：失败，`message` 为错误原因

### 认证方式

基于 `HttpSession`。登录成功后服务端将用户对象写入 Session（有效期 1 小时），后续请求通过 Session 判断登录态。

### 角色与状态

- **用户角色 `role`**：`1` = 普通用户，`2` = 管理员
- **用户状态 `status`**：`0` = 已封禁，`1` = 正常
- **美食状态 `status`**：`0` = 待审核（或已撤销），`1` = 已通过，`2` = 已拒绝
- **评论状态 `status`**：`1` = 正常展示

---

## 接口文档

### 一、美食模块 `/api/foods`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/foods` | 无 | 获取所有已审核（status=1）的美食 |
| GET | `/api/foods/{id}` | `id` 路径参数 | 获取指定 ID 的美食详情 |
| GET | `/api/foods/region/{regionId}` | `regionId` 路径参数 | 获取指定区域的美食列表 |
| GET | `/api/foods/search` | `keyword`（可选）、`regionId`（可选）、`types`（可选，逗号分隔）、`tastes`（可选，逗号分隔） | 按关键字 / 地区 / 类型 / 口味搜索 |
| GET | `/api/foods/user/{userId}` | `userId` 路径参数 | 获取指定用户发布的美食列表 |
| POST | `/api/foods` | `@ModelAttribute Food` + `file`（可选，图片） | 发布美食（需登录，status 置为 0 待审核） |
| PUT | `/api/foods/{id}` | `id` 路径参数 + 可选字段（name、description、ingredients、cookingMethod、history、file） | 修改美食信息 |
| DELETE | `/api/foods/{id}` | `id` 路径参数 | 删除美食 |
| POST | `/api/foods/{id}/like` | `id` 路径参数、`increment`（默认 true） | 点赞 / 取消点赞（需登录） |
| GET | `/api/foods/popular` | `location`（可选）、`limit`（默认 10，最大 20） | 按位置与热度获取推荐美食 |

### 二、用户模块 `/api/user`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/user/login` | JSON：`username`、`password` | 登录，成功后写入 Session |
| GET | `/api/user/logout` | 无 | 退出登录，销毁 Session |
| GET | `/api/user/check` | 无 | 检查当前登录状态 |
| POST | `/api/user/register` | JSON：`User`（username、email、password 等） | 注册，默认 role=1、status=1 |
| GET | `/api/user/{id}` | `id` 路径参数 | 获取指定用户信息 |
| PUT | `/api/user/{id}` | `id` 路径参数 + JSON `User` | 修改用户信息 |
| PUT | `/api/user/{id}/password` | `id` 路径参数 + JSON：`oldPassword`、`newPassword` | 修改密码 |
| GET | `/api/user/current` | 无 | 获取当前登录用户 |
| PUT | `/api/user/signature` | JSON：`signature` | 修改个性签名（需登录） |
| PUT | `/api/user/profile` | 表单：`username`、`signature`、`avatar`（可选，图片） | 修改个人资料（需登录） |
| DELETE | `/api/user/{id}` | `id` 路径参数 | 删除用户 |

### 三、地区模块 `/api/regions`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/regions` | `level`（可选） | 获取所有地区，可按级别过滤 |
| GET | `/api/regions/{id}` | `id` 路径参数 | 获取指定 ID 地区 |
| GET | `/api/regions/code/{code}` | `code` 路径参数 | 按行政编码获取地区 |
| GET | `/api/regions/tree` | 无 | 获取省级地区树（level=1） |
| GET | `/api/regions/{parentId}/children` | `parentId` 路径参数 | 获取指定父级的子级地区 |
| GET | `/api/regions/{regionCode}/map-data` | `regionCode` 路径参数 | 获取地区地图数据（含子级） |

### 四、评论模块 `/api/comments`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/comments/food/{foodId}` | `foodId` 路径参数 | 获取美食的正常评论（status=1） |
| GET | `/api/comments/food/{foodId}/all` | `foodId` 路径参数 | 获取美食的全部评论 |
| GET | `/api/comments/{id}` | `id` 路径参数 | 获取单条评论 |
| GET | `/api/comments/user/{userId}` | `userId` 路径参数 | 获取用户发表的评论 |
| GET | `/api/comments/food/{foodId}/count` | `foodId` 路径参数 | 统计美食的正常评论数 |
| POST | `/api/comments` | JSON `Comment`（foodId、content、parentId 可选） | 发表评论 / 回复（需登录） |
| PUT | `/api/comments/{id}` | `id` 路径参数 + JSON：`content` | 修改评论 |
| DELETE | `/api/comments/{id}` | `id` 路径参数 | 删除评论（本人或管理员） |
| PUT | `/api/comments/{id}/status` | `id` 路径参数 + `status` | 修改评论状态（管理员） |
| POST | `/api/comments/{id}/like` | `id` 路径参数、`increment`（默认 true） | 评论点赞 / 取消点赞（需登录） |

### 五、收藏模块 `/api/favorite`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/favorite/toggle` | `userId`、`foodId` | 收藏 / 取消收藏，返回是否已收藏 |
| GET | `/api/favorite/check` | `userId`、`foodId` | 检查是否已收藏 |
| GET | `/api/favorite/list/{userId}` | `userId` 路径参数 | 获取用户收藏的美食列表（含美食详情） |
| GET | `/api/favorite/count` | `foodId` | 获取美食被收藏次数 |

### 六、关注模块 `/api/follow`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/follow/{followingId}` | `followingId` 路径参数 | 关注用户（需登录） |
| DELETE | `/api/follow/{followingId}` | `followingId` 路径参数 | 取消关注（需登录） |
| GET | `/api/follow/check/{followingId}` | `followingId` 路径参数 | 检查是否已关注（需登录） |
| GET | `/api/follow/info/{userId}` | `userId` 路径参数 | 获取关注状态与粉丝 / 关注数 |
| GET | `/api/follow/followers/{userId}` | `userId` 路径参数 | 获取粉丝列表（含互粉标记） |
| GET | `/api/follow/followings/{userId}` | `userId` 路径参数 | 获取关注列表（含互粉标记） |

### 七、管理模块 `/api/admin`

> 所有接口需管理员登录（`role = 2`），否则返回 `权限不足`。

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/admin/foods/pending` | 无 | 获取待审核美食列表 |
| GET | `/api/admin/foods/all` | 无 | 获取所有美食帖子 |
| PUT | `/api/admin/foods/{id}/approve` | `id` 路径参数 | 审核通过（status=1） |
| PUT | `/api/admin/foods/{id}/reject` | `id` 路径参数 | 审核拒绝（status=2） |
| PUT | `/api/admin/foods/{id}/revoke` | `id` 路径参数 | 撤销（status=0） |
| DELETE | `/api/admin/foods/{id}` | `id` 路径参数 | 删除美食帖子 |
| GET | `/api/admin/users` | 无 | 获取所有用户 |
| PUT | `/api/admin/users/{id}/ban` | `id` 路径参数 | 封禁用户（status=0） |
| PUT | `/api/admin/users/{id}/unban` | `id` 路径参数 | 解封用户（status=1） |
| PUT | `/api/admin/users/{id}/password` | `id` 路径参数 + JSON：`newPassword` | 重置用户密码 |
| PUT | `/api/admin/users/{id}/role` | `id` 路径参数 + JSON：`role`（1 或 2） | 修改用户角色 |
| DELETE | `/api/admin/users/{id}` | `id` 路径参数 | 删除用户 |

### 八、AI 模块 `/api/ai`

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/ai/location` | 无 | 根据请求 IP 获取定位 |
| POST | `/api/ai/location/coords` | JSON：`latitude`、`longitude` | 根据经纬度逆地理编码定位 |
| POST | `/api/ai/location/manual` | JSON：`location` | 手动设置位置（写入 Session） |
| GET | `/api/ai/location/ip` | 无 | 获取 IP 定位（优先读 Session 缓存） |
| POST | `/api/ai/recommend` | JSON：`location` | 推荐当地 3 道特色菜 |
| POST | `/api/ai/chat` | JSON：`message`、`location`（可选）、`history`（可选） | 与 AI 智能问答 |

---

## 配置说明

关键配置位于 `src/main/resources/application.properties`：

| 配置项 | 说明 |
| ------ | ---- |
| `spring.datasource.url` | MySQL 连接地址，默认 `jdbc:mysql://localhost:3306/flavor_nav` |
| `spring.datasource.username` / `password` | 数据库账号密码 |
| `server.port` | 服务端口，默认 `8081` |
| `dashscope.api.key` | 通义千问 API Key |
| `dashscope.api.url` / `model` | 千问接口地址与模型名 |
| `amap.api.key` | 高德地图 API Key（用于 IP / 坐标定位） |