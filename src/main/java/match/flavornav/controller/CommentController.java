
package match.flavornav.controller;

import match.flavornav.entity.Comment;
import match.flavornav.entity.Result;
import match.flavornav.entity.User;
import match.flavornav.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/food/{foodId}")//获取某个食物的评论
    public Result<List<Comment>> getCommentsByFoodId(@PathVariable Long foodId) {
        List<Comment> comments = commentService.getCommentsByFoodId(foodId);
        return Result.success(comments);
    }

    @GetMapping("/food/{foodId}/all")//获取某个食物的评论
    public Result<List<Comment>> getCommentsByFoodIdAll(@PathVariable Long foodId) {
        List<Comment> comments = commentService.getCommentsByFoodIdAll(foodId);
        return Result.success(comments);
    }

    @GetMapping("/{id}")//获取某个评论
    public Result<Comment> getCommentById(@PathVariable Long id) {
        Comment comment = commentService.getCommentById(id);
        return comment != null ? Result.success(comment) : Result.error("评论不存在");
    }

    @GetMapping("/user/{userId}")//获取某个用户的评论
    public Result<List<Comment>> getCommentsByUserId(@PathVariable Long userId) {
        List<Comment> comments = commentService.getCommentsByUserId(userId);
        return Result.success(comments);
    }

    @GetMapping("/food/{foodId}/count")//获取某个食物的评论数
    public Result<Integer> getCommentCount(@PathVariable Long foodId) {
        int count = commentService.getCommentCountByFoodId(foodId);
        return Result.success(count);
    }

    @PostMapping//添加评论
    public Result<Comment> addComment(@RequestBody Comment comment, jakarta.servlet.http.HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return Result.error("请先登录");
        }

        if (comment.getContent() == null || comment.getContent().trim().isEmpty()) {
            return Result.error("评论内容不能为空");
        }

        comment.setUserId(currentUser.getId());
        comment.setUserName(currentUser.getUsername());

        Comment savedComment = commentService.addComment(comment);
        return Result.success(savedComment);
    }

    @PutMapping("/{id}")//修改评论
    public Result<Comment> updateComment(@PathVariable Long id, @RequestBody Comment comment) {
        Comment existComment = commentService.getCommentById(id);
        if (existComment == null) {
            return Result.error("评论不存在");
        }

        if (comment.getContent() != null) {
            existComment.setContent(comment.getContent());
        }

        Comment updatedComment = commentService.updateComment(existComment);
        return Result.success(updatedComment);
    }

    @DeleteMapping("/{id}")//删除评论
    public Result<Void> deleteComment(@PathVariable Long id, jakarta.servlet.http.HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return Result.error("请先登录");
        }

        Comment comment = commentService.getCommentById(id);
        if (comment == null) {
            return Result.error("评论不存在");
        }

        boolean isOwner = comment.getUserId().equals(currentUser.getId());
        boolean isAdmin = Integer.valueOf(2).equals(currentUser.getRole());

        if (!isOwner && !isAdmin) {
            return Result.error("无权限删除该评论");
        }

        try {
            commentService.deleteComment(id);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")//修改评论状态
    public Result<Void> updateCommentStatus(
            @PathVariable Long id,
            @RequestParam Integer status,
            jakarta.servlet.http.HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null || !Integer.valueOf(2).equals(currentUser.getRole())) {
            return Result.error("无权限操作");
        }

        commentService.updateCommentStatus(id, status);
        return Result.success();
    }

    @PostMapping("/{id}/like")//点赞
    public Result<Integer> toggleLike(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean increment,
            jakarta.servlet.http.HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return Result.error("请先登录");
        }

        int newLikeCount = commentService.toggleLike(id, increment);
        return Result.success(newLikeCount);
    }
}

