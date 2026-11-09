package match.flavornav.config;

import match.flavornav.util.StorageUrlUtil;
import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;

/**
 * 输出 JSON 时把数据库里保存的 OSS object key 拼成完整访问地址。
 * <p>
 * 注意这是 Jackson 3 的 API：基类是 {@code ValueSerializer}（Jackson 2 里叫 JsonSerializer），
 * 上下文参数是 {@code SerializationContext}（Jackson 2 里叫 SerializerProvider）。
 */
public class StorageUrlSerializer extends ValueSerializer<String> {

    @Override
    public void serialize(String value, JsonGenerator gen, SerializationContext ctxt) throws JacksonException {
        String url = StorageUrlUtil.resolve(value);
        if (url == null) {
            gen.writeNull();
        } else {
            gen.writeString(url);
        }
    }
}
