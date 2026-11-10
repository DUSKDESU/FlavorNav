package match.flavornav.controller;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.entity.UserProfileVO;
import match.flavornav.service.StorageService;
import match.flavornav.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private StorageService storageService;

    @PostMapping("/login")//登录
    public Result<User> login(@RequestBody Map<String, String> credentials, HttpSession session, HttpServletRequest request)
    {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");
            User user = userService.login(username, password);
            
            // 登录成功，保存用户到 Session
            session.setAttribute("user", user);
            // 防会话固定：登录前后必须是不同的 JSESSIONID，否则登录前拿到的 ID 会直接变成"已登录"的身份
            // changeSessionId() 只换 ID、保留会话属性，容器会自动下发新的 Cookie
            request.changeSessionId();
            session.setMaxInactiveInterval(3600); // 1小时过期
            
            return Result.success(user);
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/logout")//退出登录
    public Result<Void> logout(HttpSession session)
    {
        session.invalidate();
        return Result.success();
    }

    @GetMapping("/check")//检查登录
    public Result<User> checkLogin(HttpSession session)
    {
        User user = (User) session.getAttribute("user");
        if (user != null)
        {
            return Result.success(user);
        }
        return Result.error("未登录");
    }

    @PostMapping("/register")// 注册
    public Result<User> register(@RequestBody User user)
    {
        try
        {
            User registeredUser = userService.register(user);
            return Result.success(registeredUser);

        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")//获取指定ID的用户（只返回公开资料，不含邮箱/手机号等隐私字段）
    public Result<UserProfileVO> getUserById(@PathVariable Long id)
    {
        User user = userService.getUserById(id);
        return user != null ? Result.success(UserProfileVO.from(user)) : Result.error("用户不存在");
    }

    @PutMapping("/{id}/password")//修改密码（仅本人；管理员重置走 /api/admin/users/{id}/password）
    public Result<Void> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwords, HttpSession session)
    {
        try {
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null)
            {
                return Result.error("请先登录");
            }
            if (!currentUser.getId().equals(id))
            {
                return Result.error("无权修改他人密码");
            }

            String oldPassword = passwords.get("oldPassword");
            String newPassword = passwords.get("newPassword");
            userService.changePassword(id, oldPassword, newPassword);
            return Result.success();
        }
        catch (Exception e)
        {

            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/current")//获取当前用户
    public Result<User> getCurrentUser(HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");

        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        User user = userService.getUserById(currentUser.getId());
        return Result.success(user);
    }

    @PutMapping("/signature")//修改个性签名
    public Result<Void> updateSignature(@RequestBody Map<String, String> data, HttpSession session)
    {
        User currentUser = (User) session.getAttribute("user");

        if (currentUser == null)
        {
            return Result.error("请先登录");
        }

        userService.updateSignature(currentUser.getId(), data.get("signature"));
        return Result.success();
    }

    @PutMapping("/profile")//修改个人资料
    public Result<User> updateProfile(@RequestParam(value = "username", required = false) String username, @RequestParam(value = "signature", required = false) String signature, @RequestParam(value = "avatar", required = false) MultipartFile avatar, HttpSession session)
    {
        try {
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null)
            {
                return Result.error("请先登录");
            }

            // 检查用户名是否被其他用户使用
            if (username != null && !username.equals(currentUser.getUsername()))
            {
                User existUser = userService.getUserByUsername(username);

                if (existUser != null)
                {
                    return Result.error("该用户名已被使用，请换一个");
                }

            }

            User user = userService.getUserById(currentUser.getId());
            
            if (username != null)
            {
                user.setUsername(username);
            }

            if (signature != null)
            {
                user.setSignature(signature);
            }

            String oldAvatar = user.getAvatar();

            if (avatar != null && !avatar.isEmpty())
            {
                // 上传到 OSS，数据库只保存 object key
                user.setAvatar(storageService.upload(avatar, "avatars"));
            }

            User updatedUser = userService.updateUser(user);

            // 更新成功后再清理旧头像，失败不影响业务
            if (avatar != null && !avatar.isEmpty())
            {
                storageService.deleteQuietly(oldAvatar);
            }

            session.setAttribute("user", updatedUser);
            return Result.success(updatedUser);
        }
        catch (Exception e)
        {
            if (e.getMessage().contains("Duplicate entry") || e.getMessage().contains("username"))
            {
                return Result.error("该用户名已被使用，请换一个");
            }

            return Result.error(e.getMessage());
        }
    }

    // 前端无使用并且有越权修改风险 先关闭接口 后续再做优化（如果能过初赛的话
    // @PutMapping("/{id}")//修改用户
/*    public Result<User> updateUser(@PathVariable Long id, @RequestBody User user)
    {
        try
        {
            user.setId(id);
            User updatedUser = userService.updateUser(user);
            return Result.success(updatedUser);
        }
        catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }*/

    // 前端无使用并且有越权删除的风险
    // @DeleteMapping("/{id}")//删除用户
/*    public Result<Void> deleteUser(@PathVariable Long id)
    {
        try
        {
            userService.deleteUser(id);
            return Result.success();
        } catch (Exception e)
        {
            return Result.error(e.getMessage());
        }
    }*/
}

