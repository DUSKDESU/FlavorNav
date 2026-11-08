package match.flavornav.service;

import org.springframework.stereotype.Component;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AIRateLimiter {

    private static final long WINDOW_MS = 60_000L;        // 统计窗口 60 秒
    private static final int MAX_REQUESTS = 20;           // 窗口内允许的最大请求次数
    private static final long BASE_COOLDOWN_MS = 30_000L; // 首次超限的基础冷却 30 秒
    private static final long MAX_COOLDOWN_MS = 600_000L; // 冷却上限 10 分钟

    private final Map<String, UserWindow> windows = new ConcurrentHashMap<>();

    /**
     * 尝试获取一次请求许可。
     * @return null 表示放行；否则返回需要提示给用户的文案
     */
    public String tryAcquire(String userId) {
        long now = System.currentTimeMillis();
        UserWindow w = windows.computeIfAbsent(userId, k -> new UserWindow());

        synchronized (w) {
            // 仍在冷却期内却继续请求 -> 加重惩罚，冷却翻倍
            if (now < w.cooldownUntil) {
                w.violations++;
                w.cooldownUntil = now + nextCooldown(w.violations);
                long remain = Math.max(1, (w.cooldownUntil - now) / 1000);
                return "请求过于频繁，请 " + remain + " 秒后再试";
            }

            // 冷却结束，重置违规计数
            if (w.cooldownUntil != 0) {
                w.cooldownUntil = 0;
                w.violations = 0;
            }

            // 清理窗口外的历史请求
            while (!w.timestamps.isEmpty() && now - w.timestamps.peekFirst() > WINDOW_MS) {
                w.timestamps.pollFirst();
            }

            // 窗口内次数已达上限 -> 进入冷却
            if (w.timestamps.size() >= MAX_REQUESTS) {
                w.violations++;
                long cd = nextCooldown(w.violations);
                w.cooldownUntil = now + cd;
                return "请求过于频繁，已触发 " + (cd / 1000) + " 秒冷却";
            }

            w.timestamps.addLast(now);
            return null;
        }
    }

    private long nextCooldown(int violations) {
        // 冷却随违规次数翻倍：30s -> 60s -> 120s ...，封顶 10 分钟
        int shift = Math.min(Math.max(violations - 1, 0), 10);
        long cd = BASE_COOLDOWN_MS * (1L << shift);
        return Math.min(cd, MAX_COOLDOWN_MS);
    }

    private static class UserWindow {
        final Deque<Long> timestamps = new ArrayDeque<>();
        long cooldownUntil = 0;
        int violations = 0;
    }
}