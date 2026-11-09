package match.flavornav.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    /**
     * 密码：只允许反序列化（注册/登录时接收），序列化时一律不输出，
     * 避免登录、查询用户、后台用户列表等接口把密码带回前端。
     */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String email;
    private String phone;
    private String hometownRegionCode;
    private String hometownRegionName;
    private String signature;
    private String avatar;
    private Integer followingCount;
    private Integer followerCount;
    private Integer likeCount;
    private Integer role;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
