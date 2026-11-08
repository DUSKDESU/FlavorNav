package match.flavornav.mapper;
import match.flavornav.entity.Region;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper

    public interface RegionMapper {

        List<Region> findAll();//查询所有地区

        Region findById(@Param("id") Long id);//通过id查询地区

        Region findByCode(@Param("code") String code);//通过code查询地区

        List<Region> findByLevel(@Param("level") Integer level);//通过level查询地区

        List<Region> findByParentCode(@Param("parentCode") String parentCode);//通过parentCode查询地区
    }

