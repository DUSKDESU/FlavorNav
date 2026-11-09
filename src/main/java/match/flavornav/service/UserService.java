package match.flavornav.service;
import match.flavornav.entity.User;
import match.flavornav.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        if (user.getUsername() == null || user.getUsername().trim().isEmpty())
        {
            throw new RuntimeException("用户名不能为空");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty())
        {
            throw new RuntimeException("密码不能为空");
        }
        if (userMapper.findByUsername(user.getUsername()) != null)
        {
            throw new RuntimeException("用户名已存在");

        }
        if (userMapper.findByEmail(user.getEmail()) != null)
        {

            throw new RuntimeException("邮箱已被注册");

        }
        // 密码加密后再入库，数据库中不再保存明文
        user.setPassword(passwordEncoder.encode(user.getPassword()));
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

        if (password == null || password.isEmpty() || !passwordEncoder.matches(password, user.getPassword()))
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

        if (oldPassword == null || oldPassword.isEmpty()
                || !passwordEncoder.matches(oldPassword, user.getPassword()))
        {
            throw new RuntimeException("原密码错误");

        }
        if (newPassword == null || newPassword.isEmpty())
        {
            throw new RuntimeException("新密码不能为空");

        }
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));
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
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));

    }
}

