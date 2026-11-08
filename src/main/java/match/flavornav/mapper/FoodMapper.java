package match.flavornav.mapper;



import match.flavornav.entity.Food;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FoodMapper {

    List<Food> findAll();// 查询所有美食帖子

    Food findById(@Param("id") Long id);// 根据id查询美食帖子


    List<Food> findByRegionId(@Param("regionId") Long regionId);// 根据regionId查询美食帖子

    List<Food> findByUserId(@Param("userId") Long userId);// 根据userId查询美食帖子


    List<Food> findByStatus(@Param("status") Integer status);// 根据审核状态查询美食帖子

    int insert(Food food);// 添加美食帖子

    int update(Food food);// 更新美食帖子


    int updateStatus(@Param("id") Long id, @Param("status") Integer status);// 修改美食帖子审核状态

    int deleteById(@Param("id") Long id);// 删除美食帖子

    List<Food> search(@Param("keyword") String keyword, @Param("regionId") Long regionId, @Param("types") String types, @Param("tastes") String tastes);
        // 搜索美食帖子，根据关键字、地区、类型和口味进行搜索
    List<Food> findPopularFoods(@Param("locationKeyword") String locationKeyword, @Param("limit") int limit);
        // 查找最热门的美食帖子
    int updateLikeCount(@Param("id") Long id, @Param("increment") int increment);
        // 更新美食帖子的点赞数


}

