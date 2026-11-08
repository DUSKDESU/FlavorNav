package match.flavornav.service;

import match.flavornav.entity.Comment;
import match.flavornav.mapper.CommentMapper;
import match.flavornav.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CommentService {

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private UserMapper userMapper;

    public List<Comment> getCommentsByFoodId(Long foodId)//获取某个食物的评论
    {
        return commentMapper.findByFoodIdAndStatus(foodId, 1);
    }

    public List<Comment> getCommentsByFoodIdAll(Long foodId)
    {
        return commentMapper.findByFoodId(foodId);
    }

    public Comment getCommentById(Long id)
    {
        return commentMapper.findById(id);
    }

    public void deleteComment(Long id)//删除评论
    {
        Comment comment = commentMapper.findById(id);

        if (comment != null)
        {
            if (comment.getParentId() > 0)
            {
                commentMapper.updateReplyCount(comment.getParentId(), -1);
            }

            commentMapper.deleteById(id);
        }
    }

    public List<Comment> getCommentsByUserId(Long userId)//获取某个用户的评论
    {
        return commentMapper.findByUserId(userId);
    }

    public Comment updateComment(Comment comment)
    {
        commentMapper.update(comment);
        return comment;
    }

    public int getCommentCountByFoodId(Long foodId)
    {
        return commentMapper.countByFoodId(foodId);
    }

    public Comment addComment(Comment comment)//添加评论
    {
        comment.setStatus(1);

        if (comment.getLikeCount() == null)
            comment.setLikeCount(0);

        if (comment.getDislikeCount() == null)
            comment.setDislikeCount(0);

        if (comment.getReplyCount() == null)
            comment.setReplyCount(0);

        if (comment.getParentId() == null)
            comment.setParentId(0L);
        
        commentMapper.insert(comment);
        
        // 如果是回复评论，增加父评论的回复数
        if (comment.getParentId() > 0)
        {
            commentMapper.updateReplyCount(comment.getParentId(), 1);
        }
        
        return comment;
    }

    public void updateCommentStatus(Long id, Integer status)
    {
        commentMapper.updateStatus(id, status);
    }

    public int toggleLike(Long commentId, boolean increment)//点赞
    {
        int incrementValue = increment ? 1 : -1;
        commentMapper.updateLikeCount(commentId, incrementValue);

        Comment comment = commentMapper.findById(commentId);
        
        if (comment != null && comment.getUserId() != null)
        {
            userMapper.updateLikeCount(comment.getUserId(), incrementValue);
        }
        
        return comment != null ? comment.getLikeCount() : 0;
    }
}
