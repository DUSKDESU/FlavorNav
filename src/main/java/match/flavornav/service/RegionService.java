package match.flavornav.service;
import match.flavornav.entity.Region;
import match.flavornav.mapper.RegionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class RegionService {                   //暂未使用的方法是后续开发可能用到的

    @Autowired
    private RegionMapper regionMapper;

    public List<Region> getAllRegions()
    {
        return regionMapper.findAll();
    }

    public Region getRegionById(Long id)
    {
        return regionMapper.findById(id);
    }

    public Region getRegionByCode(String code)
    {
        return regionMapper.findByCode(code);
    }

    public List<Region> getRegionsByLevel(Integer level)
    {
        return regionMapper.findByLevel(level);
    }

    public List<Region> getChildrenRegionsByCode(String parentCode)
    {
        return regionMapper.findByParentCode(parentCode);

    }
}

