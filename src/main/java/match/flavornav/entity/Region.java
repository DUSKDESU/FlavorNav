package match.flavornav.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Region {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private Integer level;
    private String path;
}
