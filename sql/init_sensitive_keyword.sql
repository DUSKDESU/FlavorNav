-- =============================================================
-- 寻味华夏 FlavorNav - 敏感词关键词表初始化脚本
-- 用途：美食帖子关键词自动审核功能（POST /api/admin/foods/auto-audit）
-- 执行方式：mysql -u root -p flavor_nav < init_sensitive_keyword.sql
-- =============================================================

SET NAMES utf8mb4;

USE `flavor_nav`;

-- 建表（重复执行安全）
CREATE TABLE IF NOT EXISTS `sensitive_keyword` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `keyword`     VARCHAR(100) NOT NULL                COMMENT '关键词内容',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_keyword` (`keyword`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '敏感词关键词表';

-- 插入默认关键词（INSERT IGNORE 避免重复执行报错）
INSERT IGNORE INTO `sensitive_keyword` (`keyword`) VALUES
-- 赌博类
('赌博'), ('博彩'), ('赌场'), ('六合彩'), ('彩票'), ('赌球'), ('网赌'), ('赌局'), ('押注'), ('百家乐'), ('时时彩'), ('老虎机'),
-- 色情类
('色情'), ('淫秽'), ('黄色'), ('裸聊'), ('卖淫'), ('嫖娼'), ('援交'), ('裸照'), ('约炮'), ('成人视频'), ('色情网站'), ('色情直播'),
-- 诈骗/金融类
('诈骗'), ('传销'), ('洗钱'), ('假币'), ('高利贷'), ('套路贷'), ('非法集资'), ('刷单'), ('兼职刷单'), ('代开发票'), ('信用卡套现'), ('办证'), ('倒卖'), ('代购刷单'),
-- 毒品类
('毒品'), ('吸毒'), ('大麻'), ('冰毒'), ('海洛因'), ('摇头丸'), ('K粉'), ('吗啡'), ('可卡因'), ('制毒'), ('贩毒'), ('毒品交易'),
-- 危险品/暴力类
('枪支'), ('弹药'), ('爆炸物'), ('管制刀具'), ('炸药'), ('雷管'), ('军火'), ('枪支买卖'),
-- 违法/走私类
('走私'), ('违禁'), ('偷渡'), ('代孕'), ('买卖器官'), ('非法拘禁'), ('酒驾'), ('假药'), ('假烟'), ('假酒'), ('催情'), ('迷药'), ('邪教'),
-- 其他
('恐怖主义'), ('黑客'), ('木马'), ('病毒'), ('盗号');