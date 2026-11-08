package match.flavornav.service;
import match.flavornav.entity.Food;
import match.flavornav.mapper.FoodMapper;
import match.flavornav.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service                                   //暂未使用的方法是后续开发可能用到的
@Transactional
public class FoodService {

    @Autowired
    private FoodMapper foodMapper;

    @Autowired
    private UserMapper userMapper;

    public List<Food> getAllFoods()
    {
        return foodMapper.findAll();
    }

    public Food getFoodById(Long id)
    {
        return foodMapper.findById(id);
    }

    public List<Food> getFoodsByRegionId(Long regionId)
    {
        return foodMapper.findByRegionId(regionId);
    }

    public List<Food> getFoodsByUserId(Long userId)
    {
        return foodMapper.findByUserId(userId);
    }

    public List<Food> getApprovedFoods()
    {
        return foodMapper.findByStatus(1);
    }

    public Food addFood(Food food)
    {
        foodMapper.insert(food);
        return food;

    }

    public Food updateFood(Food food)
    {
        foodMapper.update(food);
        return food;

    }

    public void updateFoodStatus(Long id, Integer status) {

        foodMapper.updateStatus(id, status);
    }

    public void deleteFood(Long id)
    {
        foodMapper.deleteById(id);
    }

    public List<Food> searchFoods(String keyword, Long regionId, String types, String tastes)
    {

        return foodMapper.search(keyword, regionId, types, tastes);
    }

    public List<Food> getPopularFoods(String locationKeyword, int limit)
    {
        String processedKeyword = null;
        if (locationKeyword != null && !locationKeyword.trim().isEmpty())
        {
            String trimmed = locationKeyword.trim();
            if (trimmed.contains(" "))
            {
                String[] parts = trimmed.split("\\s+");

                if (parts.length >= 2)
                {
                    // 取最后一段（最精确：省 市 区 时取区；省 市 时取市）
                    processedKeyword = parts[parts.length - 1];

                }
                else
                {
                    processedKeyword = parts[0];

                }
            }
            else
            {
                processedKeyword = trimmed;

            }
            processedKeyword = processedKeyword.replace("市", "").replace("县", "").replace("区", "");
        }

        return foodMapper.findPopularFoods(processedKeyword, limit);
    }

    public int toggleLike(Long foodId, boolean increment)
    {
        int delta = increment ? 1 : -1;
        foodMapper.updateLikeCount(foodId, delta);
        
        Food food = foodMapper.findById(foodId);
        if (food != null && food.getUserId() != null)
        {
            userMapper.updateLikeCount(food.getUserId(), delta);

        }
        
        return food != null ? food.getLikeCount() : 0;

    }
}
