
package match.flavornav.mapper;

import match.flavornav.entity.UserFollow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserFollowMapper {

    int insert(UserFollow userFollow);//添加关注记录

    int deleteByFollowerAndFollowing(@Param("followerId") Long followerId, @Param("followingId") Long followingId);
    //删除关注记录

    UserFollow findByFollowerAndFollowing(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    /**
     * 查询用户的粉丝列表
     */
    List<UserFollow> findByFollowingId(@Param("followingId") Long followingId);

    /**
     * 查询用户的关注列表
     */
    List<UserFollow> findByFollowerId(@Param("followerId") Long followerId);

    /**
     * 统计用户的粉丝数量
     */
    int countFollowers(@Param("followingId") Long followingId);

    /**
     * 统计用户的关注数量
     */
    int countFollowings(@Param("followerId") Long followerId);
}
