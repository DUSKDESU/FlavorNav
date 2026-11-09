package match.flavornav.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.annotation.JsonSerialize;
import match.flavornav.config.StorageUrlSerializer;
import java.time.LocalDateTime;
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Food {
    private Long id;
    private String name;
    private String description;
    private String ingredients;
    private String cookingMethod;
    private String history;
    private Long regionId;
    private String regionName;
    @JsonSerialize(using = StorageUrlSerializer.class)
    private String imageUrl;
    private Long userId;
    private String userName;
    @JsonSerialize(using = StorageUrlSerializer.class)
    private String userAvatar;
    private Integer status;
    private Integer likeCount;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String taste;
    private String type;
}
