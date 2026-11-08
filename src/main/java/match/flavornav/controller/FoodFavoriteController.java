package match.flavornav.controller;
import lombok.RequiredArgsConstructor;
import match.flavornav.entity.Result;
import match.flavornav.service.FoodFavoriteService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor

public class FoodFavoriteController
{
    
    private final FoodFavoriteService foodFavoriteService;
    
    @PostMapping("/toggle")//添加或取消收藏
    public Result<?> toggleFavorite(@RequestParam Long userId, @RequestParam Long foodId)
    {
        boolean isFavorited = foodFavoriteService.toggleFavorite(userId, foodId);
        return Result.success(isFavorited);
    }
    
    @GetMapping("/check")//检查是否已收藏
    public Result<?> checkFavorite(@RequestParam Long userId, @RequestParam Long foodId)
    {
        boolean isFavorited = foodFavoriteService.isFavorited(userId, foodId);
        return Result.success(isFavorited);
    }
    
    @GetMapping("/list/{userId}")//获取用户收藏的美食
    public Result<?> getUserFavorites(@PathVariable Long userId)
    {
        return Result.success(foodFavoriteService.getUserFavoritesWithFood(userId));
    }
    
    @GetMapping("/count")//获取收藏数量
    public Result<?> getFavoriteCount(@RequestParam Long foodId)
    {
        return Result.success(foodFavoriteService.getFavoriteCount(foodId));
    }
}
