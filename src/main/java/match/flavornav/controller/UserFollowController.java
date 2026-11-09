package match.flavornav.controller;
import jakarta.servlet.http.HttpSession;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.entity.UserFollow;
import match.flavornav.service.UserFollowService;
import match.flavornav.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/follow")
@CrossOrigin(origins = "*")
public class UserFollowController
{

    @Autowired
    private UserFollowService userFollowService;

    @Autowired
    private UserService userService;


    @PostMapping("/{followingId}")//关注
    public Result<Void> followUser(@PathVariable Long followingId, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");

        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        try
        {
            userFollowService.followUser(currentUser.getId(), followingId);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }


    @DeleteMapping("/{followingId}")//取消关注
    public Result<Void> unfollowUser(@PathVariable Long followingId, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");

        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        try {
            userFollowService.unfollowUser(currentUser.getId(), followingId);
            return Result.success();
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/check/{followingId}")//检查是否已关注
    public Result<Boolean> checkFollow(@PathVariable Long followingId, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        boolean isFollowing = userFollowService.isFollowing(currentUser.getId(), followingId);
        return Result.success(isFollowing);
    }


    @GetMapping("/info/{userId}")//获取关注信息
    public Result<Map<String, Object>> getFollowInfo(@PathVariable Long userId, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");
        Long currentUserId = currentUser != null ? currentUser.getId() : null;

        Map<String, Object> followInfo = userFollowService.getFollowInfo(currentUserId, userId);
        return Result.success(followInfo);
    }

    @GetMapping("/followers/{userId}")//获取粉丝信息
    public Result<List<Map<String, Object>>> getFollowers(@PathVariable Long userId, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        
        List<UserFollow> followers = userFollowService.getFollowers(userId);
        
        List<Map<String, Object>> result = followers.stream().map(follow ->
        {
            User user = userService.getUserById(follow.getFollowerId());
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("avatar", match.flavornav.util.StorageUrlUtil.resolve(user.getAvatar()));
            userInfo.put("signature", user.getSignature());
            
            // 检查是否互粉
            boolean isMutual = currentUserId != null && 
                userFollowService.isFollowing(currentUserId, follow.getFollowerId());
            userInfo.put("isMutual", isMutual);
            
            return userInfo;
        }).collect(Collectors.toList());
        
        return Result.success(result);
    }

    @GetMapping("/followings/{userId}")//获取关注信息
    public Result<List<Map<String, Object>>> getFollowings(@PathVariable Long userId, HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        
        List<UserFollow> followings = userFollowService.getFollowings(userId);
        
        List<Map<String, Object>> result = followings.stream().map(follow -> {
            User user = userService.getUserById(follow.getFollowingId());
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("avatar", match.flavornav.util.StorageUrlUtil.resolve(user.getAvatar()));
            userInfo.put("signature", user.getSignature());
            
            // 检查是否互粉
            boolean isMutual = currentUserId != null && 
                userFollowService.isFollowing(currentUserId, follow.getFollowingId());
            userInfo.put("isMutual", isMutual);
            
            return userInfo;
        }).collect(Collectors.toList());
        
        return Result.success(result);
    }
}
