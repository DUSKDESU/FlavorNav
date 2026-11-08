package match.flavornav.mapper;

import match.flavornav.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;                              //暂未使用的方法是后续开发可能用到的

@Mapper
public interface CommentMapper {

    List<Comment> findByFoodIdAndStatus(@Param("foodId") Long foodId, @Param("status") Integer status);// 根据foodId和status查询

    List<Comment> findByFoodId(@Param("foodId") Long foodId);// 根据foodId查询


    List<Comment> findByUserId(@Param("userId") Long userId);// 根据userId查询


    Comment findById(@Param("id") Long id);// 根据id查询

    int insert(Comment comment);// 插入评论

    int update(Comment comment);//更新评论

    int updateStatus(@Param("id") Long id, @Param("status") Integer status);// 更新评论状态

    int deleteById(@Param("id") Long id);// 删除评论

    int countByFoodId(@Param("foodId") Long foodId);// 统计评论数

    int updateLikeCount(@Param("id") Long id, @Param("increment") int increment);// 更新点赞数

    int updateReplyCount(@Param("id") Long id, @Param("increment") int increment);// 更新回复数

}
