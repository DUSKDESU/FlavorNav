
package match.flavornav.service;

import lombok.RequiredArgsConstructor;
import match.flavornav.entity.Food;
import match.flavornav.entity.FoodFavorite;
import match.flavornav.mapper.FoodFavoriteMapper;
import match.flavornav.mapper.FoodMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodFavoriteService {
    
    private final FoodFavoriteMapper foodFavoriteMapper;
    private final FoodMapper foodMapper;
    
    @Transactional
    public boolean toggleFavorite(Long userId, Long foodId)
    {
        FoodFavorite existing = foodFavoriteMapper.selectByUserIdAndFoodId(userId, foodId);
        
        if (existing != null)
        {
            foodFavoriteMapper.deleteByUserIdAndFoodId(userId, foodId);
            return false;
        }
        else
        {
            FoodFavorite foodFavorite = new FoodFavorite();
            foodFavorite.setUserId(userId);
            foodFavorite.setFoodId(foodId);
            foodFavoriteMapper.insert(foodFavorite);
            return true;
        }
    }
    
    public boolean isFavorited(Long userId, Long foodId)
    {
        return foodFavoriteMapper.selectByUserIdAndFoodId(userId, foodId) != null;
    }
    
    public List<FoodFavorite> getUserFavoritesWithFood(Long userId)
    {
        List<FoodFavorite> favorites = foodFavoriteMapper.selectByUserId(userId);
        List<FoodFavorite> result = new ArrayList<>();
        
        for (FoodFavorite favorite : favorites)
        {
            Food food = foodMapper.findById(favorite.getFoodId());

            if (food != null)
            {
                favorite.setFood(food);
                result.add(favorite);
            }
        }
        
        return result;
    }
    
    public int getFavoriteCount(Long foodId)
    {
        return foodFavoriteMapper.countByFoodId(foodId);
    }

}

