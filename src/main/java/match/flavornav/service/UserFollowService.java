
package match.flavornav.service;

import match.flavornav.entity.User;
import match.flavornav.entity.UserFollow;
import match.flavornav.mapper.UserFollowMapper;
import match.flavornav.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class UserFollowService {

    @Autowired
    private UserFollowMapper userFollowMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 关注用户
     */
    public boolean followUser(Long followerId, Long followingId)
    {

        if (followerId.equals(followingId))
        {
            throw new RuntimeException("不能关注自己");

        }

        // 检查是否已关注
        UserFollow existFollow = userFollowMapper.findByFollowerAndFollowing(followerId, followingId);
        if (existFollow != null)
        {
            throw new RuntimeException("已经关注过该用户");

        }

        // 检查被关注用户是否存在
        User followingUser = userMapper.findById(followingId);
        if (followingUser == null)
        {
            throw new RuntimeException("用户不存在");

        }

        // 插入关注记录
        UserFollow userFollow = new UserFollow();
        userFollow.setFollowerId(followerId);
        userFollow.setFollowingId(followingId);
        userFollowMapper.insert(userFollow);

        // 更新关注数和粉丝数
        userMapper.updateFollowingCount(followerId, 1);
        userMapper.updateFollowerCount(followingId, 1);

        return true;
    }

    /**
     * 取消关注
     */
    public boolean unfollowUser(Long followerId, Long followingId)
    {
        UserFollow existFollow = userFollowMapper.findByFollowerAndFollowing(followerId, followingId);

        if (existFollow == null)
        {
            throw new RuntimeException("未关注该用户");

        }

        // 删除关注记录
        userFollowMapper.deleteByFollowerAndFollowing(followerId, followingId);

        // 更新关注数和粉丝数
        userMapper.updateFollowingCount(followerId, -1);
        userMapper.updateFollowerCount(followingId, -1);

        return true;
    }

    /**
     * 检查是否已关注
     */
    public boolean isFollowing(Long followerId, Long followingId)
    {
        return userFollowMapper.findByFollowerAndFollowing(followerId, followingId) != null;

    }

    /**
     * 获取用户的粉丝列表
     */
    public List<UserFollow> getFollowers(Long userId)
    {
        return userFollowMapper.findByFollowingId(userId);
    }

    /**
     * 获取用户的关注列表
     */
    public List<UserFollow> getFollowings(Long userId)
    {
        return userFollowMapper.findByFollowerId(userId);
    }

    /**
     * 获取用户的粉丝数量
     */
    public int getFollowerCount(Long userId)
    {
        return userFollowMapper.countFollowers(userId);
    }

    /**
     * 获取用户的关注数量
     */
    public int getFollowingCount(Long userId)
    {
        return userFollowMapper.countFollowings(userId);
    }

    /**
     * 获取用户关注状态信息
     */
    public Map<String, Object> getFollowInfo(Long currentUserId, Long targetUserId)
    {
        Map<String, Object> result = new HashMap<>();

        if (currentUserId != null && !currentUserId.equals(targetUserId))
        {
            result.put("isFollowing", isFollowing(currentUserId, targetUserId));

        }
        else
        {
            result.put("isFollowing", false);

        }

        result.put("followerCount", getFollowerCount(targetUserId));
        result.put("followingCount", getFollowingCount(targetUserId));

        return result;
    }
}
