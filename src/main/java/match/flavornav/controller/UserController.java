package match.flavornav.controller;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.entity.UserProfileVO;
import match.flavornav.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")//登录
    public Result<User> login(@RequestBody Map<String, String> credentials, HttpSession session)
    {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");
            User user = userService.login(username, password);
            
            // 登录成功，保存用户到 Session
            session.setAttribute("user", user);
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

            if (avatar != null && !avatar.isEmpty())
            {
                String avatarPath = saveAvatar(avatar);
                user.setAvatar(avatarPath);
            }

            User updatedUser = userService.updateUser(user);
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

    private String saveAvatar(MultipartFile file) throws IOException
    {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/avatars");

        if (!Files.exists(uploadPath))
        {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/avatars/" + fileName;
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

