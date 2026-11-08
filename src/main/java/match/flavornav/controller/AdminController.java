package match.flavornav.controller;

import match.flavornav.entity.Food;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.service.AIService;
import match.flavornav.service.AuditConfigService;
import match.flavornav.service.SensitiveKeywordService;
import match.flavornav.service.FoodService;
import match.flavornav.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
                                             //这个文件是管理系统CONTROLLER层，命名要与你模块一致
@RestController
@RequestMapping("/api/admin")

public class AdminController
{

    @Autowired
    private FoodService foodService;
    @Autowired
    private UserService userService;

    @Autowired
    private SensitiveKeywordService sensitiveKeywordService;

    @Autowired
    private AIService aiService;

    @Autowired
    private AuditConfigService auditConfigService;

    @Value("${audit.sensitive-keywords:}")
    private String auditSensitiveKeywords;

    private static final List<String> DEFAULT_SENSITIVE_KEYWORDS = Arrays.asList(
            // 赌博类
            "赌博", "博彩", "赌场", "六合彩", "彩票", "赌球", "网赌", "赌局", "押注", "百家乐", "时时彩", "老虎机",
            // 色情类
            "色情", "淫秽", "黄色", "裸聊", "卖淫", "嫖娼", "援交", "裸照", "约炮", "成人视频", "色情网站", "色情直播",
            // 诈骗/金融类
            "诈骗", "传销", "洗钱", "假币", "高利贷", "套路贷", "非法集资", "刷单", "兼职刷单", "代开发票", "信用卡套现", "办证", "倒卖", "代购刷单",
            // 毒品类
            "毒品", "吸毒", "大麻", "冰毒", "海洛因", "摇头丸", "K粉", "吗啡", "可卡因", "制毒", "贩毒", "毒品交易",
            // 危险品/暴力类
            "枪支", "弹药", "爆炸物", "管制刀具", "炸药", "雷管", "军火", "枪支买卖",
            // 违法/走私类
            "走私", "违禁", "偷渡", "代孕", "买卖器官", "非法拘禁", "酒驾", "假药", "假烟", "假酒", "催情", "迷药", "邪教",
            // 其他
            "恐怖主义", "黑客", "木马", "病毒", "盗号");



    private boolean isAdmin(jakarta.servlet.http.HttpSession session) //判断用户是否为管理员
    {
        User user = (User) session.getAttribute("user");

        return user != null && user.getRole() == 2;
    }

    @GetMapping("/foods/pending")
    public Result<List<Food>> getPendingFoods(jakarta.servlet.http.HttpSession session) //获取待审核美食铁字
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        List<Food> foods = foodService.getAllFoods();

        return Result.success(foods.stream()
                .filter(f -> f.getStatus() == 0)
                .collect(Collectors.toList()));
    }

    @GetMapping("/foods/all")
    public Result<List<Food>> getAllFoods(jakarta.servlet.http.HttpSession session) //获取所有美食帖子
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        return Result.success(foodService.getAllFoods());
    }


    @PutMapping("/foods/{id}/approve")
    public Result<Void> approveFood(@PathVariable Long id, jakarta.servlet.http.HttpSession session) //对美食帖子进行过审操作
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try
        {
            foodService.updateFoodStatus(id, 1);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }

    }

    @PutMapping("/foods/{id}/reject")//拒绝审核的通过
    public Result<Void> rejectFood(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try
        {
            foodService.updateFoodStatus(id, 2);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/foods/{id}/revoke")//撤销该美食帖子的出现
    public Result<Void> revokeApproval(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try
        {
            foodService.updateFoodStatus(id, 0);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }


    @DeleteMapping("/foods/{id}")//删除指定的美食帖子
    public Result<Void> deleteFood(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try
        {
            foodService.deleteFood(id);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }



    @GetMapping("/users")//获取所有用户，包括ID，用户名，密码，邮箱，头像，角色，状态
    public Result<List<User>> getAllUsers(jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");


        return Result.success(userService.getAllUsers());
    }


    @PutMapping("/users/{id}/ban")//对用户进封禁操作
    public Result<Void> banUser(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try {

            User user = userService.getUserById(id);
            if (user == null)
                return Result.error("用户不存在");

            user.setStatus(0);
            userService.updateUser(user);
            return Result.success();

        }
        catch (Exception e)
        {

            return Result.error(e.getMessage());

        }
    }

    @PutMapping("/users/{id}/unban")//对用户解封操作
    public Result<Void> unbanUser(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try {

            User user = userService.getUserById(id);
            if (user == null) return Result.error("用户不存在");

            user.setStatus(1);
            userService.updateUser(user);
            return Result.success();

        } catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/password")//重置用户密码
    public Result<Void> adminResetPassword(@PathVariable Long id, @RequestBody Map<String, String> data, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try {
            String newPassword = data.get("newPassword");

            if (newPassword == null || newPassword.trim().isEmpty())
            {
                return Result.error("新密码不可为空");
            }

            userService.adminResetPassword(id, newPassword);
            return Result.success();

        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/role")//修改用户的省份
    public Result<Void> updateUserRole(@PathVariable Long id, @RequestBody Map<String, Integer> data, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try {
            Integer role = data.get("role");
            if (role == null || (role != 1 && role != 2))
            {
                return Result.error("该身份ID无效");
            }
            User user = userService.getUserById(id);

            if (user == null)
                return Result.error("用户不存在");

            user.setRole(role);
            userService.updateUser(user);
            return Result.success();

        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/users/{id}")//删除指定的用户
    public Result<Void> deleteUser(@PathVariable Long id, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        try
        {
            userService.deleteUser(id);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/foods/auto-audit")//对待审核美食执行关键词自动审核
    public Result<Map<String, Object>> autoAuditFoods(@RequestBody(required = false) Map<String, String> body, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        List<String> keywords = resolveKeywords(body);

        List<Food> pendingFoods = foodService.getAllFoods().stream()
                .filter(f -> f.getStatus() != null && f.getStatus() == 0)
                .collect(Collectors.toList());

        int approved = 0;
        int rejected = 0;
        List<Map<String, Object>> results = new ArrayList<>();

        for (Food food : pendingFoods)
        {
            List<String> matched = sensitiveKeywordService.findMatchedKeywords(food, keywords);
            if (!matched.isEmpty())
            {
                foodService.updateFoodStatus(food.getId(), 2);
                rejected++;
            }
            else
            {
                foodService.updateFoodStatus(food.getId(), 1);
                approved++;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", food.getId());
            item.put("name", food.getName());
            item.put("status", matched.isEmpty() ? 1 : 2);
            item.put("matchedKeywords", matched);
            results.add(item);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", pendingFoods.size());
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("keywords", keywords);
        summary.put("results", results);

        return Result.success(summary);
    }

    @PostMapping("/foods/ai-audit")//对待审核美食执行 AI（DeepSeek）审核
    public Result<Map<String, Object>> aiAuditFoods(jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        if (!aiService.isDeepSeekConfigured())
            return Result.error("DeepSeek API Key 未配置，请在 application.properties 中配置 deepseek.api.key");

        List<Food> pendingFoods = foodService.getAllFoods().stream()
                .filter(f -> f.getStatus() != null && f.getStatus() == 0)
                .collect(Collectors.toList());

        int approved = 0;
        int rejected = 0;
        int skipped = 0;
        List<Map<String, Object>> results = new ArrayList<>();

        for (Food food : pendingFoods)
        {
            String content = buildFoodText(food);
            Map<String, Object> audit = aiService.auditFoodContent(content);

            if (audit == null)
            {
                skipped++;
                Map<String, Object> item = new HashMap<>();
                item.put("id", food.getId());
                item.put("name", food.getName());
                item.put("status", 0);
                item.put("reason", "AI 调用失败，保留待人工审核");
                results.add(item);
                continue;
            }

            boolean violation = Boolean.TRUE.equals(audit.get("violation"));
            String reason = (String) audit.get("reason");

            if (violation)
            {
                foodService.updateFoodStatus(food.getId(), 2);
                rejected++;
            }
            else
            {
                foodService.updateFoodStatus(food.getId(), 1);
                approved++;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", food.getId());
            item.put("name", food.getName());
            item.put("status", violation ? 2 : 1);
            item.put("reason", reason);
            results.add(item);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", pendingFoods.size());
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("skipped", skipped);
        summary.put("results", results);

        return Result.success(summary);
    }

    @GetMapping("/audit-mode")//获取当前审核模式
    public Result<Map<String, Object>> getAuditMode(jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        Map<String, Object> data = new HashMap<>();
        data.put("mode", auditConfigService.getAuditMode());
        return Result.success(data);
    }

    @PostMapping("/audit-mode")//设置审核模式（keyword 或 ai）
    public Result<Void> setAuditMode(@RequestBody Map<String, String> body, jakarta.servlet.http.HttpSession session)
    {
        if (!isAdmin(session))
            return Result.error("权限不足");

        String mode = body == null ? null : body.get("mode");
        if (mode == null || (!"keyword".equals(mode) && !"ai".equals(mode)))
            return Result.error("审核模式无效，仅支持 keyword / ai");

        auditConfigService.setAuditMode(mode);
        return Result.success();
    }

    private String buildFoodText(Food food)
    {
        StringBuilder sb = new StringBuilder();
        appendText(sb, food.getName());
        appendText(sb, food.getDescription());
        appendText(sb, food.getIngredients());
        appendText(sb, food.getCookingMethod());
        appendText(sb, food.getHistory());
        appendText(sb, food.getType());
        appendText(sb, food.getTaste());
        return sb.toString();
    }

    private void appendText(StringBuilder sb, String value)
    {
        if (value != null && !value.isEmpty())
        {
            if (sb.length() > 0)
                sb.append(" ");
            sb.append(value);
        }
    }

    private List<String> resolveKeywords(Map<String, String> body)
    {
        List<String> keywords = new ArrayList<>();

        // 1. 优先使用请求中临时传入的关键词
        String raw = null;
        if (body != null)
        {
            raw = body.get("keywords");
        }
        if (raw != null && !raw.trim().isEmpty())
        {
            for (String k : raw.split("[,，]"))
            {
                String t = k.trim();
                if (!t.isEmpty())
                {
                    keywords.add(t);
                }
            }
            return keywords;
        }

        // 2. 从数据库敏感词表读取
        keywords.addAll(sensitiveKeywordService.findAllKeywords());

        // 3. 表为空时回退到配置文件关键词
        if (keywords.isEmpty() && auditSensitiveKeywords != null && !auditSensitiveKeywords.trim().isEmpty())
        {
            for (String k : auditSensitiveKeywords.split("[,，]"))
            {
                String t = k.trim();
                if (!t.isEmpty())
                {
                    keywords.add(t);
                }
            }
        }

        // 4. 仍为空时使用代码内置默认关键词兜底
        if (keywords.isEmpty())
        {
            keywords.addAll(DEFAULT_SENSITIVE_KEYWORDS);
        }
        return keywords;
    }
}
