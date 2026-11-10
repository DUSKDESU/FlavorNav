package match.flavornav.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import match.flavornav.config.StorageUrlSerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    private Long id;
    private Long foodId;
    private Long userId;
    private String userName;
    @JsonSerialize(using = StorageUrlSerializer.class)
    private String userAvatar;
    private Long parentId;
    private String content;
    private Integer status;
    private Integer likeCount;
    private Integer dislikeCount;
    private Integer replyCount;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
