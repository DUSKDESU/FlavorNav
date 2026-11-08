package match.flavornav.mapper;

import match.flavornav.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {

    User findById(@Param("id") Long id);// 根据id查询用户

    User findByUsername(@Param("username") String username);// 根据用户名查询用户

    User findByEmail(@Param("email") String email);// 根据邮箱查询用户


    List<User> findAll();// 查询所有用户

    int insert(User user);// 添加用户,注册用

    int update(User user);// 更新用户信息

    int updateFollowingCount(@Param("userId") Long userId, @Param("increment") int increment);// 更新关注数

    int updateFollowerCount(@Param("userId") Long userId, @Param("increment") int increment);// 更新粉丝数


    int updateSignature(@Param("userId") Long userId, @Param("signature") String signature);// 更新个性签名

    int updateLikeCount(@Param("userId") Long userId, @Param("increment") int increment);// 更新点赞数


    int updatePassword(@Param("id") Long id, @Param("password") String password);// 更新密码

    int deleteById(@Param("id") Long id);// 删除用户
}
