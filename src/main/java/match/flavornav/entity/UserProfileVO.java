package match.flavornav.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import match.flavornav.util.StorageUrlUtil;

import java.time.LocalDateTime;

/**
 * 用户公开资料（他人主页可见的字段）。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class UserProfileVO {

    private Long id;
    private String username;
    private String avatar;
    private String signature;
    private String hometownRegionName;
    private Integer followingCount;
    private Integer followerCount;
    private Integer likeCount;
    private LocalDateTime createTime;

    /** 从完整实体裁剪出公开字段，未赋值的字段保持 null。 */
    public static UserProfileVO from(User user) {
        if (user == null) {
            return null;
        }
        UserProfileVO vo = new UserProfileVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setAvatar(StorageUrlUtil.resolve(user.getAvatar()));
        vo.setSignature(user.getSignature());
        vo.setHometownRegionName(user.getHometownRegionName());
        vo.setFollowingCount(user.getFollowingCount());
        vo.setFollowerCount(user.getFollowerCount());
        vo.setLikeCount(user.getLikeCount());
        vo.setCreateTime(user.getCreateTime());
        return vo;
    }
}
