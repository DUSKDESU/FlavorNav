# 寻味华夏 FlavorNav

> 一个基于地理位置的中华美食导航与推荐系统：根据用户当前位置（IP 定位 / 坐标定位 / 手动选择地区），智能推荐当地特色美食，并提供 AI 聊天、美食搜索、收藏、评论等能力。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 后端框架 | Spring Boot 4.0.5 |
| 语言 | Java 17 |
| 构建工具 | Maven 3.6+ |
| ORM | MyBatis |
| 数据库 | MySQL 8.0 |
| 地图服务 | 高德地图 API（逆地理编码 / IP 定位 / 行政区划） |
| AI 服务 | DeepSeek（AI 聊天 + 美食自动审核） |
| 图片存储 | 阿里云 OSS（公共读，数据库只保存 object key） |
| 前端 | 静态页面（Thymeleaf 视图转发 + static 资源） |

## 目录结构

```
src/main/java/match/flavornav/
├── config/        # Spring 配置类（Web 配置、拦截器等）
├── controller/    # 控制器层（REST 接口）
├── entity/        # 实体类
├── mapper/        # MyBatis Mapper 接口
├── service/       # 业务逻辑层
└── FlavorNavApplication.java   # 启动入口

src/main/resources/
├── static/        # 前端静态页面
├── mapper/        # MyBatis XML 映射
├── db/            # 数据库初始化脚本（schema.sql + data.sql，启动时自动执行）
└── application.properties.example  # 配置模板（需复制为 application.properties）
```

> 图片统一存放在阿里云 OSS，本地不再保留 `uploads/` 目录。

## 环境要求

- **JDK 17 或更高版本**
- **Maven 3.6+**（或使用自带 Maven Wrapper）
- **MySQL 8.0**

## 部署步骤

### 1. 拉取代码

```bash
git clone https://github.com/DUSKDESU/FlavorNav.git
cd FlavorNav
```

### 2. 配置数据库连接与 API Key

仓库中**不含**真实配置（出于安全考虑，`application.properties` 已被 .gitignore 忽略），需要从模板复制一份：

```bash
# Windows (PowerShell)
copy src\main\resources\application.properties.example src\main\resources\application.properties

# macOS / Linux
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

然后编辑 `src/main/resources/application.properties`，填入自己的值：

```properties
# 数据库连接（createDatabaseIfNotExist=true：库不存在时自动创建）
spring.datasource.url=jdbc:mysql://localhost:3306/flavor_nav?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=你的数据库密码

# 高德地图开放平台申请的 Key（用于定位与推荐）
amap.api.key=你的高德Key

# DeepSeek 平台申请的 Key（用于 AI 聊天与自动审核）
deepseek.api.key=你的DeepSeekKey

# 阿里云 OSS（图片与头像存储，bucket 需为「公共读」）
oss.endpoint=oss-cn-xxx.aliyuncs.com
oss.bucket=你的bucket
oss.access-key-id=你的AccessKeyId
oss.access-key-secret=你的AccessKeySecret
oss.key-prefix=flavornav/
```

### 3. 启动应用

> 不需要手动导入数据库：首次启动时会自动建库、建表并灌入演示数据；已有数据时自动跳过（幂等）。

**方式一：Maven 直接运行（开发常用）**

```bash
mvn spring-boot:run
```

**方式二：打包后运行**

```bash
mvn clean package -DskipTests
java -jar target/FlavorNav-0.0.1-SNAPSHOT.jar
```

**方式三：IDEA 运行**

用 IntelliJ IDEA 打开项目根目录，等待 Maven 依赖下载完成后，直接运行 `src/main/java/match/flavornav/FlavorNavApplication.java` 的 `main` 方法。

### 4. 访问系统

启动成功后，浏览器打开：

```
http://localhost:8081/
```

## 默认账号

演示数据内置以下账号，**密码统一为 `123456`**：

| 账号 | 角色 | 说明 |
| --- | --- | --- |
| `miroku` | 管理员 | 可进入管理后台（审核、用户管理、帖子管理） |
| 热爱生活的小烟、吃货阿蛮、深夜食堂常客 等 10 个 | 普通用户 | 模拟发帖、评论、收藏、关注 |

> ⚠️ 这些是**演示账号**，仅用于本地开发和答辩演示。部署到公网前请修改密码或删除演示数据。

## 配置项说明

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `server.port` | `8081` | 服务端口 |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/flavor_nav?...` | 数据库连接地址，建议带 `createDatabaseIfNotExist=true` 与 `characterEncoding=UTF-8` |
| `spring.datasource.username` | `root` | 数据库账号（需要建库/建表权限） |
| `spring.datasource.password` | 无 | 数据库密码（必填） |
| `spring.sql.init.mode` | `always` | 启动时执行初始化脚本；MySQL 必须显式设为 `always` |
| `spring.sql.init.schema-locations` | `classpath:db/schema.sql` | 建表脚本（`CREATE TABLE IF NOT EXISTS`） |
| `spring.sql.init.data-locations` | `classpath:db/data.sql` | 数据脚本（`INSERT IGNORE`） |
| `spring.sql.init.encoding` | `UTF-8` | 脚本编码 |
| `oss.endpoint` | 无 | OSS 地域节点，如 `oss-cn-guangzhou.aliyuncs.com` |
| `oss.bucket` | 无 | 存储桶名称（需为公共读） |
| `oss.access-key-id` / `oss.access-key-secret` | 无 | RAM 子账号的 AccessKey |
| `oss.key-prefix` | `flavornav/` | 对象 key 前缀，便于区分其他文件 |
| `oss.public-domain` | 留空 | 访问域名，留空则用 `https://{bucket}.{endpoint}` |
| `amap.api.key` | 无 | 高德地图开放平台 Key（必填，定位与推荐依赖） |
| `deepseek.api.key` | 无 | DeepSeek 平台 Key（AI 聊天 / 审核依赖） |
| `deepseek.api.url` | `https://api.deepseek.com/chat/completions` | DeepSeek 接口地址 |
| `deepseek.model` | `deepseek-chat` | DeepSeek 模型名称 |
| `audit.sensitive-keywords` | 留空 | 美食自动审核的敏感词（逗号分隔，留空走代码默认值） |

## 常见问题

**Q1：启动报数据库连接失败**

- 确认 MySQL 已启动，且端口为 3306；
- 确认 `application.properties` 中的账号密码正确；
- 若使用了 `createDatabaseIfNotExist=true`，账号需要有 **CREATE 权限**，否则先手动建库：
  ```sql
  CREATE DATABASE flavor_nav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

**Q2：端口 8081 被占用**

修改 `application.properties` 中的 `server.port` 为其他端口即可。

**Q3：定位 / 推荐功能不生效**

- 缺少 `amap.api.key`，或 Key 未开通「IP 定位 / 逆地理编码」等权限；
- 本地通过 `localhost` 访问时，IP 可能识别为 `0:0:0:0:0:0:0:1`（IPv6 回环），属正常现象，手动选择地区或使用坐标定位即可正常推荐。

**Q4：AI 聊天 / 审核不生效**

- 缺少 `deepseek.api.key`，或 Key 余额不足 / 无权限；
- 未配置 Key 时，用户发帖会进入「待审核」，可在管理后台用「关键词自动审核」批量通过。

**Q5：图片/头像显示不出来**

- 检查 `oss.endpoint`、`oss.bucket`、`oss.access-key-id`、`oss.access-key-secret` 是否填写正确；
- 确认 bucket 是**公共读**，否则前端拿到的 URL 会 403；
- 数据里的图片是 object key，换 bucket 后旧图片会失效（需要重新上传）。
- 未配置 OSS 时应用仍可正常启动（降级模式），只是不能上传/删除图片；**内置演示数据的图片是绝对地址，不配置 OSS 也能显示**。

**Q6：每次启动都会执行初始化脚本吗？**

会。`spring.sql.init.mode=always` 下每次启动都会执行，但脚本是幂等的（`CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE`），已有数据不会重复插入，耗时约 1 秒。若不需要可改成 `mode=never`。

## 说明

- 出于安全考虑，含真实密钥的 `application.properties` 不会提交到仓库，请勿在公开仓库提交真实密钥。
- 数据库初始化脚本位于 `src/main/resources/db/`：`schema.sql` 负责建表（`IF NOT EXISTS`），`data.sql` 负责灌数据（`INSERT IGNORE`），修改表结构或种子数据后重新导出即可。
- 仓库内置了演示数据（100 条美食帖子、10 个模拟用户、若干评论/收藏/关注），图片存放于 OSS；重新生成数据用的 `mock-data/` 脚手架不随仓库分发。
- `mock-data/`、`dump.sql`、`backup_before_clean.sql` 以及构建产物 `target/`、`out/` 均被 .gitignore 忽略。
