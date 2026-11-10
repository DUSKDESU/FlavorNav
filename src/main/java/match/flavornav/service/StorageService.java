package match.flavornav.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import match.flavornav.util.StorageUrlUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 图片存储：阿里云 OSS（公共读）。
 * <p>
 * 约定：数据库只保存 object key，前端需要的完整地址由 {@link StorageUrlUtil} 在输出 JSON 时拼接。
 */
@Slf4j
@Service
public class StorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif");

    private static final DateTimeFormatter YEAR_MONTH = DateTimeFormatter.ofPattern("yyyy/MM");

    @Value("${oss.endpoint}")
    private String endpoint;

    @Value("${oss.bucket}")
    private String bucket;

    @Value("${oss.access-key-id}")
    private String accessKeyId;

    @Value("${oss.access-key-secret}")
    private String accessKeySecret;

    @Value("${oss.key-prefix:flavornav/}")
    private String keyPrefix;

    @Value("${oss.public-domain:}")
    private String publicDomain;

    private OSS ossClient;

    @PostConstruct
    void init() {
        if (isBlank(endpoint) || isBlank(bucket) || isBlank(accessKeyId) || isBlank(accessKeySecret)) {
            // 降级启动：没有 OSS 凭证也允许应用运行，只是不能上传/删除图片
            StorageUrlUtil.configure("", keyPrefix);
            log.warn("OSS 未配置，图片上传/删除不可用；其余功能正常（演示数据中的图片是绝对地址，仍可显示）");
            return;
        }

        String domain = isBlank(publicDomain)
                ? "https://" + bucket + "." + endpoint
                : publicDomain;

        StorageUrlUtil.configure(domain, keyPrefix);
        ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
        log.info("OSS 初始化完成 endpoint={} bucket={} domain={}", endpoint, bucket, domain);
    }

    @PreDestroy
    void destroy() {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    /**
     * 上传图片，返回 object key（直接存入数据库）。
     *
     * @param file 上传的文件
     * @param dir  业务目录，例如 foods / avatars
     */
    public String upload(MultipartFile file, String dir) {
        if (ossClient == null) {
            throw new RuntimeException("图片服务未配置，请先在 application.properties 中填写 OSS 信息");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("只支持 jpg/jpeg/png/webp/gif 格式的图片");
        }

        String key = StorageUrlUtil.keyPrefix() + dir + "/"
                + LocalDate.now().format(YEAR_MONTH) + "/"
                + UUID.randomUUID().toString().replace("-", "") + "." + extension;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(CONTENT_TYPES.get(extension));

        try (InputStream in = file.getInputStream()) {
            ossClient.putObject(bucket, key, in, metadata);
        } catch (Exception e) {
            log.error("OSS 上传失败 bucket={} key={}", bucket, key, e);
            throw new RuntimeException("图片上传失败，请稍后重试");
        }

        log.info("OSS 上传成功 key={}", key);
        return key;
    }

    /** 删除对象：只处理本应用 key 前缀的值，失败只记日志，不影响主流程 */
    public void deleteQuietly(String key) {
        if (ossClient == null) {
            return;   // 未配置 OSS 时直接跳过
        }
        if (key == null || key.isBlank()) {
            return;
        }
        String prefix = StorageUrlUtil.keyPrefix();
        if (prefix.isEmpty() || !key.startsWith(prefix)) {
            log.warn("跳过删除非本应用前缀的对象 key={}", key);
            return;
        }
        try {
            ossClient.deleteObject(bucket, key);
            log.info("OSS 删除成功 key={}", key);
        } catch (Exception e) {
            log.warn("删除 OSS 对象失败 key={}", key, e);
        }
    }

    private String extensionOf(String originalFilename) {
        if (originalFilename == null) {
            return null;
        }
        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0 || dot == originalFilename.length() - 1) {
            return null;
        }
        return originalFilename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
