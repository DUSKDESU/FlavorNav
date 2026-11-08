package match.flavornav.service;

import match.flavornav.entity.Food;
import match.flavornav.mapper.SensitiveKeywordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SensitiveKeywordService {

    @Autowired
    private SensitiveKeywordMapper sensitiveKeywordMapper;

    /** 从数据库读取全部关键词 */
    public List<String> findAllKeywords() {
        return sensitiveKeywordMapper.findAllKeywords();
    }

    /** 拼接帖子全部文本字段，供 AI 审核等使用 */
    public String buildFullText(Food food) {
        StringBuilder sb = new StringBuilder();
        appendText(sb, food.getName());
        appendText(sb, food.getDescription());
        appendText(sb, food.getIngredients());
        appendText(sb, food.getCookingMethod());
        appendText(sb, food.getHistory());
        appendText(sb, food.getType());
        appendText(sb, food.getTaste());
        return sb.toString();
    }

    /** 检测帖子文本命中的关键词（不区分大小写），扫描全部文本字段 */
    public List<String> findMatchedKeywords(Food food, List<String> keywords) {
        String text = buildFullText(food).toLowerCase();

        List<String> matched = new ArrayList<>();
        for (String keyword : keywords) {
            if (keyword != null && !keyword.isEmpty() && text.contains(keyword.toLowerCase())) {
                matched.add(keyword);
            }
        }
        return matched;
    }

    private void appendText(StringBuilder sb, String value) {
        if (value != null && !value.isEmpty()) {
            if (sb.length() > 0) {
                sb.append(" ");
            }
            sb.append(value);
        }
    }
}