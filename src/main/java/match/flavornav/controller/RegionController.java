package match.flavornav.controller;
import match.flavornav.entity.Result;
import match.flavornav.entity.Region;
import match.flavornav.service.RegionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/regions")
@CrossOrigin(origins = "*")
public class RegionController {

    @Autowired
    private RegionService regionService;

    @GetMapping//获取所有地区
    public Result<List<Region>> getAllRegions(@RequestParam(required = false) Integer level)
    {
        List<Region> regions;
        if (level != null)
        {
            regions = regionService.getRegionsByLevel(level);
        }
        else
        {
            regions = regionService.getAllRegions();
        }

        return Result.success(regions);
    }

    @GetMapping("/{id}")//获取指定ID的地区
    public Result<Region> getRegionById(@PathVariable Long id)
    {
        Region region = regionService.getRegionById(id);
        return region != null ? Result.success(region) : Result.error("地区不存在");
    }

    @GetMapping("/code/{code}")//通过code获取地区
    public Result<Region> getRegionByCode(@PathVariable String code)
    {
        Region region = regionService.getRegionByCode(code);
        return region != null ? Result.success(region) : Result.error("地区不存在");
    }

    @GetMapping("/tree")//获取地区树
    public Result<List<Region>> getRegionTree()
    {
        List<Region> provinces = regionService.getRegionsByLevel(1);
        return Result.success(provinces);
    }

    @GetMapping("/{parentId}/children")//获取指定父级ID的子级地区
    public Result<List<Region>> getChildrenRegions(@PathVariable Long parentId)
    {
        Region parent = regionService.getRegionById(parentId);
        if (parent == null)
        {
            return Result.error("地区不存在");
        }

        List<Region> regions = regionService.getChildrenRegionsByCode(parent.getCode());
        return Result.success(regions);
    }

    @GetMapping("/{regionCode}/map-data")//获取地区地图数据
    public Result<Map<String, Object>> getRegionMapData(@PathVariable String regionCode)
    {
        Region region = regionService.getRegionByCode(regionCode);

        if (region == null)
        {
            return Result.error("地区不存在");
        }
        
        Map<String, Object> mapData = new HashMap<>();
        mapData.put("id", region.getId());
        mapData.put("name", region.getName());
        mapData.put("code", region.getCode());
        mapData.put("level", region.getLevel());
        
        // 使用 parentCode 查询子级区域（因为数据库的 parent_id 存的是 code）
        List<Region> children = regionService.getChildrenRegionsByCode(region.getCode());
        mapData.put("children", children);
        
        return Result.success(mapData);
    }
}

