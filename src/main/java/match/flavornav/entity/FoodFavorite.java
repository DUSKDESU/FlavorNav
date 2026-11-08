
package match.flavornav.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FoodFavorite {
    private Long id;
    private Long userId;
    private Long foodId;
    private LocalDateTime createTime;
    private Food food;
}

