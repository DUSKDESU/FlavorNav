package match.flavornav.entity;

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
