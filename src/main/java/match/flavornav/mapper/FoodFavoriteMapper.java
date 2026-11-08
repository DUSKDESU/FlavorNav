
package match.flavornav.mapper;

import match.flavornav.entity.FoodFavorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FoodFavoriteMapper {
    
    int insert(FoodFavorite foodFavorite);//添加收藏


    int deleteByUserIdAndFoodId(@Param("userId") Long userId, @Param("foodId") Long foodId);//取消收藏
    
    FoodFavorite selectByUserIdAndFoodId(@Param("userId") Long userId, @Param("foodId") Long foodId);//查询收藏


    List<FoodFavorite> selectByUserId(Long userId); //查询用户收藏
    
    int countByFoodId(Long foodId);//查询收藏数量
}
