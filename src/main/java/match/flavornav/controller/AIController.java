package match.flavornav.controller;

import jakarta.servlet.http.HttpSession;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.service.AIService;
import match.flavornav.service.AIRateLimiter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;

@Slf4j//这个是用来直接调用log.info()、log.error()的
@RestController
@RequestMapping("/api/ai")

public class AIController
{

    @Autowired
    private AIService aiService;

    @Autowired
    private AIRateLimiter aiRateLimiter;

    private static final int MAX_MESSAGE_LENGTH = 500;


    @GetMapping("/location")//获取用户位置信息
    public Result getLocation(HttpServletRequest request)
    {
        String ip = getClientIP(request);
        log.info("获取到的原始 IP: {}", ip);
        
        String location = aiService.getLocationFromIP(ip);
        log.info("IP 定位结果: {}", location);
        
        return Result.success(location);

    }

    @PostMapping("/location/coords")//接收到坐标定位请求
    public Result getLocationFromCoords(@RequestBody LocationRequest request)
    {
        log.info("接收到坐标定位请求 - 纬度: {}, 经度: {}", request.getLatitude(), request.getLongitude());
        
        String location = aiService.getLocationFromCoordinates(request.getLatitude(), request.getLongitude());
        log.info("坐标定位结果: {}", location);
        
        return Result.success(location);
    }

    @PostMapping("/location/manual")//手动设置位置信息
    public Result<?> manualLocation(@RequestBody Map<String, String> body, HttpSession session)
    {
        String location = body.get("location");

        if (location == null || location.trim().isEmpty())
        {
            return Result.error("位置信息不能为空");
        }

        session.setAttribute("userLocation", location.trim());
        return Result.success(location.trim());
    }

    @GetMapping("/location/ip")//获取用户IP定位信息
    public Result<?> getLocationByIP(HttpSession session, HttpServletRequest request)
    {
        String cachedLocation = (String) session.getAttribute("userLocation");

        if (cachedLocation != null && !cachedLocation.isEmpty())
        {
            return Result.success(cachedLocation);
        }

        String ip = getClientIP(request);
        log.info("IP定位请求 - 获取到的 IP: {}", ip);

        String location = aiService.getLocationFromIP(ip);
        log.info("IP定位结果: {}", location);

        if (!"未知地区".equals(location))
        {
            session.setAttribute("userLocation", location);
        }

        return Result.success(location);
    }

    @PostMapping("/recommend")//获取推荐美食帖子
    public Result recommendFood(@RequestBody Map<String, String> body)
    {
        String location = body.get("location");

        if (location == null || location.trim().isEmpty())
        {
            return Result.error("位置信息不能为空");
        }

        String recommendation = aiService.getLocalFoodRecommendation(location);
        return Result.success(recommendation);
    }

    @PostMapping("/chat")//与AI的聊天接口
    public Result chat(@RequestBody ChatRequest request, HttpSession session)
    {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty())
        {
            return Result.error("请输入内容");
        }
        if (request.getMessage().length() > MAX_MESSAGE_LENGTH)
        {
            return Result.error("输入内容过长，请控制在 " + MAX_MESSAGE_LENGTH + " 字以内");
        }

        User user = (User) session.getAttribute("user");
        String userId = user != null ? "user_" + user.getId() : "anonymous";

        String limited = aiRateLimiter.tryAcquire(userId);
        if (limited != null)
        {
            return Result.error(limited);
        }

        String response = aiService.chatWithAI(request.getMessage(), request.getLocation(), request.getHistory());

        return Result.success(response);
    }

    public static class ChatRequest
    {
        private String message;
        private String location;
        private java.util.List<MessageHistory> history;

        // getter 和 setter 方法
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public java.util.List<MessageHistory> getHistory() { return history; }
        public void setHistory(java.util.List<MessageHistory> history) { this.history = history; }

    }

    public static class MessageHistory
    {
        private String role;
        private String content;

        // getter 和 setter 方法
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }


    }

    private String getClientIP(HttpServletRequest request) //这一部分借用千问生成
    {
        String ip = request.getHeader("X-Forwarded-For");//获取代理服务器的IP
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
        {
            ip = request.getHeader("X-Real-IP");
        }

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) //获取真实IP
        {
            ip = request.getHeader("Proxy-Client-IP");
        }

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) //获取代理服务器IP
        {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))//获取代理服务器IP
        {
            ip = request.getRemoteAddr();
        }

        if (ip != null && ip.contains(",")) //获取第一个IP
        {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    public static class LocationRequest
    {
        private double latitude;
        private double longitude;
      // getter 和 setter 方法
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
    }
}
