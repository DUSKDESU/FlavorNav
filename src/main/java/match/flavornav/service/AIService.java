package match.flavornav.service;

import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import match.flavornav.controller.AIController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j                       //  该页代码由通义灵码插件辅助生成
@Service
public class AIService {
                                            //团队对代码进行微调和调试，修补bug工作
    @Value("${amap.api.key:}")
    private String amapApiKey;

    @Value("${deepseek.api.key:}")
    private String deepseekApiKey;

    @Value("${deepseek.api.url:https://api.deepseek.com/chat/completions}")
    private String deepseekApiUrl;

    @Value("${deepseek.model:deepseek-chat}")
    private String deepseekModel;

    @PostConstruct
    public void init()
    {
        log.info("初始化完成");
        if (amapApiKey != null && !amapApiKey.isEmpty())
        {
            log.info("高德地图API已配置");
        }
        else
        {
            log.warn("未配置高德地图APIKey");
        }
    }

    public String getLocationFromIP(String ip)
    {
        if (amapApiKey == null || amapApiKey.isEmpty())
        {
            log.warn("未配置高德 API Key，无法进行 IP 定位");
            return "未知地区";
        }
        
        try {
            log.info("使用高德地图 API 进行 IP 定位: {}", ip);
            String urlString = "https://restapi.amap.com/v3/ip?key=" + amapApiKey + "&ip=" + ip;
            
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            
            if (conn.getResponseCode() != 200)
            {
                return "未知地区";
            }
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
            {
                response.append(line);
            }
            reader.close();
            
            JSONObject json = JSONObject.parseObject(response.toString());
            if (!"1".equals(json.getString("status")))
            {
                return "未知地区";
            }
            
            String province = json.getString("province");
            String city = json.getString("city");
            
            if ((province == null || province.isEmpty() || "[]".equals(province)) && 
                (city == null || city.isEmpty() || "[]".equals(city)))
            {
                return "未知地区";
            }

            
            province = (province != null && !"[]".equals(province)) ? 
                       province.replace("省", "").replace("自治区", "") : "";
            city = (city != null && !"[]".equals(city)) ? 
                   city.replace("市", "") : "";
            
            if (province.isEmpty() && !city.isEmpty()) return city;
            if (!province.isEmpty() && city.isEmpty()) return province;
            if (!province.isEmpty() && !city.isEmpty()) return province + " " + city;
            
            return "未知地区";
        }
        catch (Exception e)
        {
            log.error("IP 定位失败", e);
            return "未知地区";
        }
    }

    public String getLocationFromCoordinates(double latitude, double longitude)
    {
        if (amapApiKey == null || amapApiKey.isEmpty())
        {

            log.warn("未配置高德 API Key，无法进行坐标定位");
            return "未知地区";
        }

        
        try
        {
            log.info("使用高德逆地理编码 API - 纬度: {}, 经度: {}", latitude, longitude);
            
            String urlString = String.format(
                "https://restapi.amap.com/v3/geocode/regeo?key=%s&location=%s,%s&poitype=&radius=1000&extensions=all&batch=false&roadlevel=0",
                amapApiKey, longitude, latitude
            );
            
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            
            if (conn.getResponseCode() != 200)
            {
                log.error("高德逆地理编码 API 返回错误码: {}", conn.getResponseCode());
                return "未知地区";
            }
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
            {
                response.append(line);
            }
            reader.close();
            
            String responseStr = response.toString();
            log.info("高德逆地理编码响应: {}", responseStr);
            
            JSONObject json = JSONObject.parseObject(responseStr);
            if (!"1".equals(json.getString("status")))
            {
                log.error("高德逆地理编码失败: {}", json.getString("info"));
                return "未知地区";
            }
            
            JSONObject regeocode = json.getJSONObject("regeocode");
            JSONObject addressComponent = regeocode.getJSONObject("addressComponent");
            
            String province = addressComponent.getString("province");
            String city = addressComponent.getString("city");
            String district = addressComponent.getString("district");
            
            province = province != null ? province.replace("省", "").replace("自治区", "") : "";
            city = (city != null && !city.isEmpty() && !"[]".equals(city)) ? 
                   city.replace("市", "") : "";
            district = (district != null && !district.isEmpty() && !"[]".equals(district)) ? 
                       district.replace("区", "").replace("县", "") : "";
            
            String result;
            if (!province.isEmpty() && !city.isEmpty() && !district.isEmpty())
            {
                result = province + " " + city + " " + district;
            }
            else if (!province.isEmpty() && !district.isEmpty())
            {
                // 直辖市（北京/上海等）city 为空，用 省+区
                result = province + " " + district;
            }
            else if (!province.isEmpty() && !city.isEmpty())
            {
                result = province + " " + city;
            }
            else if (!city.isEmpty() && !district.isEmpty())
            {
                result = city + " " + district;
            }
            else if (!city.isEmpty())
            {
                result = city;
            }
            else if (!province.isEmpty())
            {
                result = province;
            }
            else
            {
                result = regeocode.getString("formatted_address");
            }
            
            log.info("坐标定位成功: {}", result);
            return result;
        }
        catch (Exception e)
        {
            log.error("坐标定位失败", e);
            return "未知地区";
        }
    }

    private String handleHttpError(HttpURLConnection conn)
    {
        int code = -1;
        try
        {
            code = conn.getResponseCode();
        }
        catch (Exception ignored)
        {
        }

        String errorMsg = readErrorStream(conn);
        log.error("调用 AI API 失败，HTTP 状态码: {}, 响应: {}", code, errorMsg);

        if (code == 401)
        {
            return "AI 服务密钥无效或已过期，请联系管理员。";
        }
        if (code == 429)
        {
            return "AI 服务繁忙或额度不足，请稍后再试。";
        }
        if (code >= 500)
        {
            return "AI 服务暂时不可用，请稍后再试。";
        }
        return "AI 服务暂时不可用，请稍后再试。";
    }

    private String readErrorStream(HttpURLConnection conn)
    {
        try (InputStream is = conn.getErrorStream())
        {
            if (is == null)
            {
                return "";
            }
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
            {
                sb.append(line);
            }
            reader.close();
            return sb.toString();
        }
        catch (Exception e)
        {
            return "无法读取错误响应";
        }
    }

    public String getLocalFoodRecommendation(String location)
    {
        String prompt = String.format("我目前在%s。请用简洁语言推荐当地 3 道特色菜品，" + "每道菜一句话简介。控制在 200 字以内。", location);
        return callQwenAPI(prompt);

    }

    public String chatWithAI(String userMessage, String location, java.util.List<AIController.MessageHistory> history)
    {
        String systemPrompt = "你是美食专家，回答要简洁专业。";

        try {
            URL url = new URL(deepseekApiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + deepseekApiKey);
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(60000);

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", deepseekModel);

            com.alibaba.fastjson.JSONArray messages = new com.alibaba.fastjson.JSONArray();

            JSONObject systemMsg = new JSONObject();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            if (history != null && !history.isEmpty())
            {

                for (AIController.MessageHistory msg : history)
                {
                    JSONObject historyMsg = new JSONObject();
                    historyMsg.put("role", msg.getRole());
                    historyMsg.put("content", msg.getContent());
                    messages.add(historyMsg);
                }

            }
            else
            {
                boolean isFoodDetailQuestion = userMessage.contains("详细介绍") || userMessage.contains("这道美食");
                String userPrompt;
                
                if (location != null && !location.equals("未知地区"))
                {


                    userPrompt = String.format("用户位于%s。问题：%s", location, userMessage);


                    if (isFoodDetailQuestion)
                    {
                        userPrompt += "。请详细介绍，控制在500字内。";
                    }
                    else
                    {
                        userPrompt += "。请简洁回答，控制在200字内。";
                    }


                }
                else
                {


                    userPrompt = "问题：" + userMessage;

                    if (isFoodDetailQuestion)
                    {
                        userPrompt += "。请详细介绍，控制在500字内。";
                    }
                    else
                    {
                        userPrompt += "。请简洁回答，控制在200字内。";
                    }


                }
                
                JSONObject userMsg = new JSONObject();
                userMsg.put("role", "user");
                userMsg.put("content", userPrompt);
                messages.add(userMsg);
            }

            requestBody.put("messages", messages);

            OutputStream os = conn.getOutputStream();
            os.write(requestBody.toJSONString().getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();

            if (conn.getResponseCode() == 200)
            {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null)
                {
                    response.append(line);
                }

                reader.close();

                JSONObject json = JSONObject.parseObject(response.toString());
                return json.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content");
            }
            else
            {
                return handleHttpError(conn);
            }



        }
        catch (SocketTimeoutException e)
        {
            log.error("调用 AI API 超时", e);
            return "AI 服务响应超时，请稍后再试。";
        }
        catch (Exception e)
        {
            log.error("调用 AI API 异常", e);
            return "AI 服务连接失败，请检查网络后重试。";
        }

    }

    private String callQwenAPI(String prompt)
    {
        try {
            URL url = new URL(deepseekApiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + deepseekApiKey);
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(60000);
            
            JSONObject requestBody = new JSONObject();
            requestBody.put("model", deepseekModel);

            JSONObject message = new JSONObject();
            message.put("role", "user");
            message.put("content", prompt);

            requestBody.put("messages", new Object[]{message});

            OutputStream os = conn.getOutputStream();
            os.write(requestBody.toJSONString().getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();

            if (conn.getResponseCode() == 200)
            {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;

                while ((line = reader.readLine()) != null)
                {
                    response.append(line);
                }
                reader.close();

                JSONObject json = JSONObject.parseObject(response.toString());
                return json.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content");
            }
            else
            {

                return "AI 服务暂时不可用，请稍后再试。";
            }
        }
        catch (SocketTimeoutException e)
        {
            log.error("调用 AI API 超时", e);
            return "AI 服务响应超时，请稍后再试。";
        }
        catch (Exception e)
        {
            log.error("调用 AI API 异常", e);
            return "AI 服务连接失败，请检查网络后重试。";
        }

    }

    // ==================== DeepSeek AI 审核 ====================

    /** 食物内容审核的系统提示词（提前写死，用于 AI 审核模式） */
    private static final String AUDIT_SYSTEM_PROMPT =
            "你是一名严格的中文美食社区内容审核员。请审核下面用户提交的美食帖子内容，" +
            "判断是否包含违法违规或违反社区规范的内容，包括但不限于：色情、赌博、毒品、诈骗、" +
            "暴力、违法、政治敏感、人身攻击、广告推广、外部引流等。\n" +
            "只返回一个 JSON 对象，不要输出任何多余文字、解释或 Markdown 代码块。格式如下：\n" +
            "{\"violation\": true或false, \"reason\": \"违规原因，未违规则为空字符串\"}\n" +
            "violation 为 true 表示内容违规需要拒绝，false 表示内容正常可以发布。";

    /** 判断 DeepSeek 是否已配置 */
    public boolean isDeepSeekConfigured()
    {
        return deepseekApiKey != null && !deepseekApiKey.trim().isEmpty();
    }

    /**
     * 调用 DeepSeek 审核美食内容。
     * 返回 Map：violation(bool)、reason(string)、raw(原始返回文本)。
     * DeepSeek 未配置或调用失败时返回 null。
     */
    public Map<String, Object> auditFoodContent(String content)
    {
        String raw = callDeepSeek(AUDIT_SYSTEM_PROMPT, content);
        if (raw == null)
        {
            return null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("raw", raw);

        boolean violation = false;
        String reason = "";

        try
        {
            String jsonText = raw.trim();
            jsonText = jsonText.replaceAll("(?s)^```(json)?\\s*|\\s*```$", "");
            JSONObject json = JSONObject.parseObject(jsonText);
            if (json != null)
            {
                violation = json.getBooleanValue("violation");
                reason = json.getString("reason");
                if (reason == null) reason = "";
            }
        }
        catch (Exception e)
        {
            // 模型未按 JSON 返回时，做一次兜底判断
            log.warn("DeepSeek 审核返回非 JSON，改用关键词兜底判断");
            violation = raw.contains("违规") || raw.contains("禁止") || raw.contains("拒绝");
            reason = raw.trim();
        }

        result.put("violation", violation);
        result.put("reason", reason);
        return result;
    }

    private String callDeepSeek(String systemPrompt, String userPrompt)
    {
        if (!isDeepSeekConfigured())
        {
            log.warn("DeepSeek API Key 未配置，无法进行 AI 审核");
            return null;
        }

        try
        {
            URL url = new URL(deepseekApiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + deepseekApiKey);
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(60000);

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", deepseekModel);

            com.alibaba.fastjson.JSONArray messages = new com.alibaba.fastjson.JSONArray();

            JSONObject systemMsg = new JSONObject();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            JSONObject userMsg = new JSONObject();
            userMsg.put("role", "user");
            userMsg.put("content", userPrompt);
            messages.add(userMsg);

            requestBody.put("messages", messages);

            OutputStream os = conn.getOutputStream();
            os.write(requestBody.toJSONString().getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();

            if (conn.getResponseCode() == 200)
            {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null)
                {
                    response.append(line);
                }
                reader.close();

                JSONObject json = JSONObject.parseObject(response.toString());
                return json.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content");
            }
            else
            {
                log.error("DeepSeek 审核调用返回错误码: {}", conn.getResponseCode());
                return null;
            }
        }
        catch (Exception e)
        {
            log.error("调用 DeepSeek 审核异常", e);
            return null;
        }
    }
}
