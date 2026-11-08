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
└── application.properties.example  # 配置模板（需复制为 application.properties）

sql/
└── flavor_nav.sql # 数据库结构与演示数据（含建库语句）

uploads/           # 用户上传图片（运行时生成，已被 .gitignore 忽略）
```

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
# 数据库连接
spring.datasource.url=jdbc:mysql://localhost:3306/flavor_nav?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=你的数据库密码

# 高德地图开放平台申请的 Key（用于定位与推荐）
amap.api.key=你的高德Key

# DeepSeek 平台申请的 Key（用于 AI 聊天与自动审核）
deepseek.api.key=你的DeepSeekKey
```

### 3. 导入数据库

`sql/flavor_nav.sql` 已包含建库语句与演示数据，直接导入即可：

```bash
mysql -u root -p < sql/flavor_nav.sql
```

导入成功后会自动创建 `flavor_nav` 数据库（表结构 + 地区/美食/用户等演示数据）。

### 4. 启动应用

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

### 5. 访问系统

启动成功后，浏览器打开：

```
http://localhost:8081/
```

## 配置项说明

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `server.port` | `8081` | 服务端口 |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/flavor_nav?...` | 数据库连接地址 |
| `spring.datasource.username` | `root` | 数据库账号 |
| `spring.datasource.password` | 无 | 数据库密码（必填） |
| `amap.api.key` | 无 | 高德地图开放平台 Key（必填，定位与推荐依赖） |
| `deepseek.api.key` | 无 | DeepSeek 平台 Key（AI 聊天 / 审核依赖） |
| `deepseek.api.url` | `https://api.deepseek.com/chat/completions` | DeepSeek 接口地址 |
| `deepseek.model` | `deepseek-chat` | DeepSeek 模型名称 |
| `audit.sensitive-keywords` | 留空 | 美食自动审核的敏感词（逗号分隔，留空走代码默认值） |

## 常见问题

**Q1：启动报数据库连接失败**

- 确认 MySQL 已启动，且端口为 3306；
- 确认已执行第 3 步导入数据库；
- 确认 `application.properties` 中的账号密码正确。

**Q2：端口 8081 被占用**

修改 `application.properties` 中的 `server.port` 为其他端口即可。

**Q3：定位 / 推荐功能不生效**

- 缺少 `amap.api.key`，或 Key 未开通「IP 定位 / 逆地理编码」等权限；
- 本地通过 `localhost` 访问时，IP 可能识别为 `0:0:0:0:0:0:0:1`（IPv6 回环），属正常现象，手动选择地区或使用坐标定位即可正常推荐。

**Q4：AI 聊天 / 审核不生效**

- 缺少 `deepseek.api.key`，或 Key 余额不足 / 无权限。

## 说明

- 出于安全考虑，含真实密钥的 `application.properties` 不会提交到仓库，请勿在公开仓库提交真实密钥。
- `uploads/` 与构建产物 `target/`、`out/` 均被 .gitignore 忽略。
