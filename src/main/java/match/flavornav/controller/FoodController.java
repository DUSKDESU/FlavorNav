package match.flavornav.controller;
import lombok.extern.slf4j.Slf4j;
import match.flavornav.entity.Food;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.service.AIService;
import match.flavornav.service.AuditConfigService;
import match.flavornav.service.FoodService;
import match.flavornav.service.RegionService;
import match.flavornav.service.SensitiveKeywordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/foods")
@CrossOrigin(origins = "*")
public class FoodController
{

    @Autowired
    private FoodService foodService;
    @Autowired
    private RegionService regionService;
    @Autowired
    private SensitiveKeywordService sensitiveKeywordService;
    @Autowired
    private AuditConfigService auditConfigService;
    @Autowired
    private AIService aiService;


    private final String uploadDir = "uploads/foods/";

    @GetMapping//获取所有美食
    public Result<List<Food>> getAllFoods()
    {
        List<Food> foods = foodService.getApprovedFoods();
        return Result.success(foods);
    }

    @GetMapping("/{id}")//获取指定id的美食
    public Result<Food> getFoodById(@PathVariable Long id)
    {
        Food food = foodService.getFoodById(id);
        return food != null ? Result.success(food) : Result.error("美食不存在");
    }

    @GetMapping("/region/{regionId}")//获取指定区域的美食
    public Result<List<Food>> getFoodsByRegion(@PathVariable Long regionId)
    {

        List<Food> foods = foodService.getFoodsByRegionId(regionId);
        return Result.success(foods);
    }

    @GetMapping("/search")//搜索美食
    public Result<List<Food>> searchFoods(@RequestParam(required = false) String keyword, @RequestParam(required = false) Long regionId, @RequestParam(required = false) String types, @RequestParam(required = false) String tastes)
    {
        List<Food> foods = foodService.searchFoods(keyword, regionId, types, tastes);
        return Result.success(foods);
    }

    @GetMapping("/user/{userId}")//获取指定用户的美食
    public Result<List<Food>> getFoodsByUserId(@PathVariable Long userId)
    {

        List<Food> foods = foodService.getFoodsByUserId(userId);
        return Result.success(foods);
    }

    @PostMapping//添加美食
    public Result<Food> addFood(@ModelAttribute Food food, @RequestParam(value = "file", required = false) MultipartFile file, jakarta.servlet.http.HttpSession session)
    {
        try {
            // 检查是否登录
             User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                return Result.error("请先登录");
            }
            
            // 自动设置用户信息
            food.setUserId(currentUser.getId());
            food.setUserName(currentUser.getUsername());

            // 自动审核：根据后台设置的审核模式（AI 或 关键词）自动判定
            String auditMode = auditConfigService.getAuditMode();
            if ("ai".equalsIgnoreCase(auditMode)) {
                Map<String, Object> audit = aiService.auditFoodContent(
                        sensitiveKeywordService.buildFullText(food));
                // AI 判定违规或调用失败 -> 保留待人工审核(status=0)；判定正常 -> 通过(status=1)
                boolean pass = audit != null && !Boolean.TRUE.equals(audit.get("violation"));
                food.setStatus(pass ? 1 : 0);
            } else {
                // 关键词审核：未命中则通过；命中则保留待人工审核
                List<String> matched = sensitiveKeywordService.findMatchedKeywords(
                        food, sensitiveKeywordService.findAllKeywords());
                food.setStatus(matched.isEmpty() ? 1 : 0);
            }
            
            // 处理图片
            if (file != null && !file.isEmpty())
            {
                String imagePath = saveImage(file);
                food.setImageUrl(imagePath);
            }

            Food savedFood = foodService.addFood(food);
            return Result.success(savedFood);
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")//修改美食
    public Result<Food> updateFood(@PathVariable Long id, @RequestParam(value = "name", required = false) String name, @RequestParam(value = "description", required = false) String description, @RequestParam(value = "ingredients", required = false) String ingredients, @RequestParam(value = "cookingMethod", required = false) String cookingMethod, @RequestParam(value = "history", required = false) String history, @RequestParam(value = "file", required = false) MultipartFile file)
    {

        try {
            Food food = foodService.getFoodById(id);
            if (food == null)
            {
                return Result.error("美食不存在");
            }

            if (name != null)//
            {
                food.setName(name);
            }

            if (description != null)
            {
                food.setDescription(description);
            }

            if (ingredients != null)
            {
                food.setIngredients(ingredients);
            }

            if (cookingMethod != null)
            {
                food.setCookingMethod(cookingMethod);
            }

            if (history != null)
            {
                food.setHistory(history);
            }

            if (file != null && !file.isEmpty())
            {
                String imageUrl = saveImage(file);
                food.setImageUrl(imageUrl);
            }

            Food updatedFood = foodService.updateFood(food);
            return Result.success(updatedFood);
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")//删除美食
    public Result<Void> deleteFood(@PathVariable Long id)
    {
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

    @PostMapping("/{id}/like")//点赞
    public Result<Integer> toggleLike(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean increment, jakarta.servlet.http.HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");

        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        int newLikeCount = foodService.toggleLike(id, increment);
        return Result.success(newLikeCount);
    }

    @GetMapping("/popular")//获取最热门的美食
    public Result<List<Food>> getPopularFoods(@RequestParam(required = false) String location, @RequestParam(defaultValue = "10") int limit)
    {

        log.info("推荐美食请求 - location: '{}', limit: {}", location, limit);
        List<Food> foods = foodService.getPopularFoods(location, Math.min(limit, 20));

        log.info("返回推荐美食数量: {}", foods.size());
        return Result.success(foods);
    }

    private String saveImage(MultipartFile file) throws IOException
    {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath))
        {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/foods/" + fileName;
    }
}

