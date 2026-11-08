
package match.flavornav.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFollow {
    private Long id;
    private Long followerId;
    private Long followingId;
    private LocalDateTime createTime;
}
