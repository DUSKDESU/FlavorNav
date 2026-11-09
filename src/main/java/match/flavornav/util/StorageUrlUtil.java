package match.flavornav.util;

/**
 * OSS 对象 key 与访问地址之间的转换工具。
 * <p>
 * 数据库里只保存 object key（例如 flavornav/foods/2026/11/xxx.jpg），
 * 输出 JSON 时再拼成完整 URL。配置由 {@code StorageService} 在启动时注入一次。
 */
public final class StorageUrlUtil {

    /** OSS 访问域名，例如 https://bucket.oss-cn-shenzhen.aliyuncs.com（不带结尾斜杠） */
    private static volatile String domain = "";

    /** 对象 key 的业务前缀，例如 flavornav/（以斜杠结尾） */
    private static volatile String keyPrefix = "";

    private StorageUrlUtil() {
    }

    public static void configure(String publicDomain, String prefix) {
        domain = trimTrailingSlash(publicDomain);
        keyPrefix = normalizePrefix(prefix);
    }

    public static String keyPrefix() {
        return keyPrefix;
    }

    /**
     * object key -> 完整访问地址。
     * <ul>
     *     <li>空值：原样返回</li>
     *     <li>已是 http(s) 地址：原样返回</li>
     *     <li>不以 OSS key 前缀开头的值（例如历史版本遗留的 /uploads/... 本地路径）：返回 null，
     *         由前端走"暂无图片/默认头像"的兜底逻辑</li>
     *     <li>正常 key：拼成 https://{bucket}.{endpoint}/{key}</li>
     * </ul>
     */
    public static String resolve(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String v = value.trim();
        if (v.startsWith("http://") || v.startsWith("https://")) {
            return v;
        }
        String prefix = keyPrefix;
        if (!prefix.isEmpty() && !v.startsWith(prefix)) {
            // 历史本地路径或非法值，不再拼成无效 URL
            return null;
        }
        while (v.startsWith("/")) {
            v = v.substring(1);
        }
        return domain + "/" + v;
    }

    private static String trimTrailingSlash(String s) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        while (t.endsWith("/")) {
            t = t.substring(0, t.length() - 1);
        }
        return t;
    }

    private static String normalizePrefix(String s) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        while (t.startsWith("/")) {
            t = t.substring(1);
        }
        if (!t.isEmpty() && !t.endsWith("/")) {
            t = t + "/";
        }
        return t;
    }
}
