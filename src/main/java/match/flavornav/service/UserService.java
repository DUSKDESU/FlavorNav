package match.flavornav.service;
import match.flavornav.entity.User;
import match.flavornav.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public User getUserById(Long id)
    {
        return userMapper.findById(id);
    }

    public User getUserByUsername(String username)
    {
        return userMapper.findByUsername(username);
    }

    public User register(User user)
    {
        if (userMapper.findByUsername(user.getUsername()) != null)
        {
            throw new RuntimeException("用户名已存在");

        }
        if (userMapper.findByEmail(user.getEmail()) != null)
        {

            throw new RuntimeException("邮箱已被注册");

        }
        user.setPassword(user.getPassword());
        user.setRole(1);
        user.setStatus(1);
        userMapper.insert(user);
        return user;
    }

    public User login(String username, String password)
    {
        User user = userMapper.findByUsername(username);
        if (user == null)
        {
            throw new RuntimeException("用户不存在");

        }

        if (!password.equals(user.getPassword()))
        {
            throw new RuntimeException("密码错误");

        }
        if (user.getStatus() != 1)
        {
            throw new RuntimeException("账号已被禁用");

        }
        return user;
    }

    public User updateUser(User user)
    {
        userMapper.update(user);
        return user;

    }

    public void changePassword(Long userId, String oldPassword, String newPassword)
    {
        User user = userMapper.findById(userId);
        if (user == null)
        {
            throw new RuntimeException("用户不存在");

        }

        if (!oldPassword.equals(user.getPassword()))
        {
            throw new RuntimeException("原密码错误");

        }
        userMapper.updatePassword(userId, newPassword);
    }

    public void deleteUser(Long id)
    {
        userMapper.deleteById(id);
    }

    public void updateSignature(Long userId, String signature)
    {
        userMapper.updateSignature(userId, signature);
    }

    public List<User> getAllUsers()
    {
        return userMapper.findAll();
    }

    public void adminResetPassword(Long userId, String newPassword)
    {
        User user = userMapper.findById(userId);
        if (user == null)
        {


            throw new RuntimeException("用户不存在");
        }
        userMapper.updatePassword(userId, newPassword);

    }
}

