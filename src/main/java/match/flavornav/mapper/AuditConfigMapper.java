package match.flavornav.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface AuditConfigMapper {

    @Select("SELECT audit_mode FROM audit_config WHERE id = 1")
    String findAuditMode();

    @Update("UPDATE audit_config SET audit_mode = #{mode} WHERE id = 1")
    int updateAuditMode(@Param("mode") String mode);
}