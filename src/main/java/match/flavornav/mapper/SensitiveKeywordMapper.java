package match.flavornav.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SensitiveKeywordMapper {

    @Select("SELECT keyword FROM sensitive_keyword ORDER BY id")
    List<String> findAllKeywords();
}