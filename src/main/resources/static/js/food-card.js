/**
 * 美食卡片组件 - 可复用模块
 * 提供美食卡片渲染、详情弹窗、评论功能
 */

const FoodCardComponent = (function() {
    let currentFoodId = null;
    let currentUserId = null;
    let currentUserRole = 0;
    let apiBaseUrl = '/api';
    let currentCommentSort = 'latest';

    function init(options = {}) {
        apiBaseUrl = options.apiBaseUrl || '/api';
        currentUserId = options.userId || null;
        currentUserRole = options.userRole || 0;
        currentFoodId = null;
        currentCommentSort = 'latest';
    }

    /**
     * 生成头像SVG
     */
    function generateAvatarSVG(name, color = '#ff6b35') {
        const initial = name ? name.charAt(0).toUpperCase() : '匿';
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${encodeURIComponent(color)}' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='60' font-size='40' fill='white' text-anchor='middle'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
    }

    function getAvatarUrl(userAvatar, userName, color = '#ff6b35') {
        if (userAvatar) {
            return userAvatar;
        }
        return generateAvatarSVG(userName, color);
    }

    // 详情页线性图标（SVG，替换原 emoji）
    const DETAIL_ICONS = {
        ingredients: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M6 12a6 6 0 0 1 12 0"/><path d="M9 7v1.5"/><path d="M12 6v1.5"/><path d="M15 7v1.5"/></svg>`,
        method: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="6"/><path d="M15 12h6"/><path d="M21 12v-2"/></svg>`,
        history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
        location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
    };

    /**
     * 时间格式化 - 智能显示
     */
    function getTimeAgo(time) {
        if (!time) return '';
        const now = new Date();
        const createTime = new Date(time);
        const diffMs = now - createTime;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return '刚刚';
        if (diffMinutes < 60) return diffMinutes + '分钟前';
        if (diffHours < 24) return diffHours + '小时前';
        if (diffDays < 7) return diffDays + '天前';
        return formatDate(time);
    }

    /**
     * 日期格式化
     */
    function formatDate(time) {
        if (!time) return '';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * HTML转义
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 关键词高亮
     */
    function highlightKeyword(text, keyword) {
        if (!keyword || !text) return escapeHtml(text);
        const escapedText = escapeHtml(text);
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return escapedText.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    /**
     * 渲染网格卡片（图一风格）
     * @param {Object} food - 美食数据
     * @param {string} keyword - 搜索关键词（可选）
     * @param {boolean} isOwnProfile - 是否为自己的主页
     * @returns {string} HTML字符串
     */
    function renderFoodGridCard(food, keyword = '', isOwnProfile = false) {
        const name = keyword
            ? highlightKeyword(food.name, keyword)
            : escapeHtml(food.name);
        const description = keyword
            ? highlightKeyword(food.description || '暂无描述', keyword)
            : escapeHtml(food.description || '暂无描述');

        return `
            <div class="food-grid-card" data-food-id="${food.id}">
                <div class="food-grid-image-wrapper" onclick="FoodCardComponent.showDetail(${food.id})">
                    ${food.imageUrl
                        ? `<img src="${food.imageUrl}" class="food-grid-image" alt="${escapeHtml(food.name)}">`
                        : `<div class="food-grid-placeholder">🍜</div>`
                    }
                </div>
                ${isOwnProfile ? `<button class="delete-food-btn" onclick="FoodCardComponent.deleteFood(${food.id}, event)" title="删除">🗑️</button>` : ''}
                <div class="food-grid-info" onclick="FoodCardComponent.showDetail(${food.id})">
                    <div class="food-grid-name" title="${escapeHtml(food.name)}">${name}</div>
                    <div class="food-grid-description">${description}</div>
                    <div class="food-grid-meta">
                        <div class="food-grid-author" title="${escapeHtml(food.userName || '匿名用户')}" onclick="FoodCardComponent.goToUserProfile(${food.userId}, event)" style="cursor:pointer;">
                            ${escapeHtml(food.userName || '匿名用户')}
                        </div>
                        <div class="food-grid-stats">${food.taste || ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染美食卡片列表（网格模式 - 图一风格）
     * @param {Array} foods - 美食数据数组
     * @param {string} keyword - 搜索关键词（可选）
     * @param {boolean} isOwnProfile - 是否为自己的主页
     * @returns {string} HTML字符串
     */
    function renderFoodGridList(foods, keyword = '', isOwnProfile = false) {
        if (!foods || foods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">😔</div>
                    <div class="empty-state-text">暂无美食数据</div>
                </div>
            `;
        }
        return foods.map(food => renderFoodGridCard(food, keyword, isOwnProfile)).join('');
    }

    /**
     * 渲染美食详情卡片（图二风格 - 城市美食页专用）
     * @param {Object} food - 美食数据
     * @param {string} keyword - 搜索关键词（可选）
     * @returns {string} HTML字符串
     */
    function renderFoodDetailCard(food, keyword = '') {
        const name = keyword
            ? highlightKeyword(food.name, keyword)
            : escapeHtml(food.name);
        const description = keyword
            ? highlightKeyword(food.description || '暂无描述', keyword)
            : escapeHtml(food.description || '暂无描述');
        const taste = food.taste ? food.taste.replace(/\\/g, ',') : '';
        const truncatedDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;

        return `
            <div class="food-detail-card" data-food-id="${food.id}" onclick="FoodCardComponent.showDetail(${food.id})">
                <div class="food-detail-image-wrapper">
                    ${food.imageUrl
                        ? `<img src="${food.imageUrl}" class="food-detail-image" alt="${escapeHtml(food.name)}">`
                        : `<div class="food-detail-placeholder">🍜</div>`
                    }
                </div>
                <div class="food-detail-content">
                    <div class="food-detail-name" title="${escapeHtml(food.name)}">${name}</div>
                    <div class="food-detail-desc">${truncatedDesc}</div>
                    <div class="food-detail-footer">
                        <span class="food-detail-author">${escapeHtml(food.userName || 'FlavorNav')}</span>
                        <span class="food-detail-taste">${taste}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染美食详情卡片列表（图二风格）
     * @param {Array} foods - 美食数据数组
     * @param {string} keyword - 搜索关键词（可选）
     * @returns {string} HTML字符串
     */
    function renderFoodDetailCardList(foods, keyword = '') {
        if (!foods || foods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <div class="empty-state-text">暂无美食数据</div>
                </div>
            `;
        }
        return foods.map(food => renderFoodDetailCard(food, keyword)).join('');
    }

    /**
     * 渲染美食卡片（B站帖子风格 - 图二风格）
     * @param {Object} food - 美食数据
     * @param {string} keyword - 搜索关键词（可选）
     * @returns {string} HTML字符串
     */
    function renderFoodCard(food, keyword = '') {
        const timeAgo = getTimeAgo(food.createTime);
        const description = keyword
            ? highlightKeyword(food.description || '暂无描述', keyword)
            : escapeHtml(food.description || '暂无描述');
        const name = keyword
            ? highlightKeyword(food.name, keyword)
            : escapeHtml(food.name);
        const avatarUrl = getAvatarUrl(food.userAvatar, food.userName);

        return `
            <div class="bili-post-card" onclick="FoodCardComponent.showDetail(${food.id})">
                <div class="bili-post-header">
                    <div class="bili-user-info" onclick="FoodCardComponent.goToUserProfile(${food.userId}, event)" style="cursor:pointer;">
                        <div class="bili-avatar">
                            <img src="${avatarUrl}" alt="avatar">
                        </div>
                        <div class="bili-user-meta">
                            <div class="bili-username">${escapeHtml(food.userName || '匿名用户')}</div>
                            <div class="bili-time">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="bili-post-action">
                        <span class="post-region-tag"><span class="region-pin">${DETAIL_ICONS.location}</span>${escapeHtml(food.regionName || '未知地区')}</span>
                    </div>
                </div>

                <div class="bili-post-content">
                    <div class="post-text">${description}</div>
                    ${food.imageUrl ? `<div class="post-image-wrapper"><img src="${food.imageUrl}" class="post-main-image" alt="${escapeHtml(food.name)}"></div>` : ''}

                    <div class="post-tags">
                        <span class="tag-item"># ${name}</span>
                        ${food.taste ? `<span class="tag-item"># ${escapeHtml(food.taste)}</span>` : ''}
                        ${food.regionName ? `<span class="tag-item"># ${escapeHtml(food.regionName)}美食</span>` : ''}
                    </div>
                </div>

                <div class="bili-post-stats">
                    <div class="stat-item like-btn" onclick="event.stopPropagation(); FoodCardComponent.toggleLike(${food.id}, this)">
                        <span class="stat-icon" data-icon="like"></span>
                        <span class="stat-text">${food.likeCount && food.likeCount > 0 ? food.likeCount : ''}</span>
                    </div>
                    <div class="stat-item comment-stat" onclick="FoodCardComponent.focusComment()">
                        <span class="stat-icon" data-icon="comment"></span>
                        <span class="stat-text" id="commentCountStat">0</span>
                    </div>
                    <div class="stat-item favorite-btn" onclick="event.stopPropagation(); FoodCardComponent.toggleFavorite(${food.id}, this)" data-food-id="${food.id}">
                        <span class="stat-icon" data-icon="favorite"></span>
                        <span class="stat-text">收藏</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染美食卡片列表（B站帖子模式）
     * @param {Array} foods - 美食数据数组
     * @param {string} keyword - 搜索关键词（可选）
     * @returns {string} HTML字符串
     */
    function renderFoodCardList(foods, keyword = '') {
        if (!foods || foods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">😔</div>
                    <div class="empty-state-text">暂无美食数据</div>
                </div>
            `;
        }
        return foods.map(food => renderFoodCard(food, keyword)).join('');
    }

    /**
     * 显示美食详情弹窗
     * @param {number} foodId - 美食ID
     * @param {string} keyword - 搜索关键词（可选）
     */
    async function showDetail(foodId, keyword = '') {
        currentFoodId = foodId;

        try {
            const response = await fetch(`${apiBaseUrl}/foods/${foodId}`);
            const result = await response.json();

            if (currentFoodId !== foodId) {
                console.log('跳过过期的美食详情加载:', foodId, '当前正在查看:', currentFoodId);
                return;
            }

            if (result.code === 200 && result.data) {
                const food = result.data;
                const timeAgo = getTimeAgo(food.createTime);
                const avatarUrl = getAvatarUrl(food.userAvatar, food.userName);

                const name = keyword
                    ? highlightKeyword(food.name, keyword)
                    : escapeHtml(food.name);
                const description = keyword
                    ? highlightKeyword(food.description || '暂无描述', keyword)
                    : escapeHtml(food.description || '暂无描述');
                const ingredients = keyword
                    ? highlightKeyword(food.ingredients || '暂无信息', keyword)
                    : escapeHtml(food.ingredients || '暂无信息');
                const cookingMethod = keyword
                    ? highlightKeyword(food.cookingMethod || '暂无信息', keyword)
                    : escapeHtml(food.cookingMethod || '暂无信息');
                const history = keyword
                    ? highlightKeyword(food.history || '暂无信息', keyword)
                    : escapeHtml(food.history || '暂无信息');

                const ingredientsRow = food.ingredients ? `
                    <div class="detail-row">
                        <div class="detail-label"><span class="detail-icon">${DETAIL_ICONS.ingredients}</span>主要食材</div>
                        <div class="detail-value">${ingredients}</div>
                    </div>
                ` : '';

                const cookingMethodRow = food.cookingMethod ? `
                    <div class="detail-row">
                        <div class="detail-label"><span class="detail-icon">${DETAIL_ICONS.method}</span>制作方法</div>
                        <div class="detail-value">${cookingMethod}</div>
                    </div>
                ` : '';

                const historyRow = food.history ? `
                    <div class="detail-row">
                        <div class="detail-label"><span class="detail-icon">${DETAIL_ICONS.history}</span>历史渊源</div>
                        <div class="detail-value">${history}</div>
                    </div>
                ` : '';

                const detailBody = document.getElementById('detailBody');
                if (detailBody) {
                    const foodContext = `${food.name}（${food.regionName || '未知地区'}）`;
                    const aiQuestion = encodeURIComponent(
                        `请详细介绍这道美食：${foodContext}。`
                    );

                    detailBody.innerHTML = `
                        <div class="bili-post-card">
                            <div class="bili-post-header">
                                <div class="bili-user-info" onclick="FoodCardComponent.goToUserProfile(${food.userId}, event)" style="cursor:pointer;">
                                    <div class="bili-avatar">
                                        <img src="${avatarUrl}" alt="avatar">
                                    </div>
                                    <div class="bili-user-meta">
                                        <div class="bili-username">${escapeHtml(food.userName || '匿名用户')}</div>
                                        <div class="bili-time">${timeAgo}</div>
                                    </div>
                                </div>
                                <div class="bili-post-action">
                                    <a href="/pages/auth/ai-chat.html?q=${aiQuestion}" class="ask-ai-btn-inline" onclick="event.stopPropagation();">
                                        <img src="/images/ai-assistant.png" alt="AI" class="ask-ai-icon-inline">
                                        <span class="ask-ai-text-inline">问AI</span>
                                    </a>
                                    <span class="post-region-tag"><span class="region-pin">${DETAIL_ICONS.location}</span>${escapeHtml(food.regionName || '未知地区')}</span>
                                </div>
                            </div>

                            <div class="bili-post-content">
                                <div class="post-text">${description}</div>
                                ${food.imageUrl ? `<div class="post-image-wrapper"><img src="${food.imageUrl}" class="post-main-image" alt="${escapeHtml(food.name)}"></div>` : ''}

                                <div class="post-tags">
                                    ${food.type ? `<span class="tag-item tag-type"># ${escapeHtml(food.type)}</span>` : ''}
                                    <span class="tag-item"># ${name}</span>
                                    ${food.taste ? `<span class="tag-item"># ${escapeHtml(food.taste)}</span>` : ''}
                                    ${food.regionName ? `<span class="tag-item"># ${escapeHtml(food.regionName)}美食</span>` : ''}
                                </div>
                            </div>

                            <div class="bili-post-footer">
                                <div class="post-detail-box">
                                    ${ingredientsRow}
                                    ${cookingMethodRow}
                                    ${historyRow}
                                </div>
                            </div>

                            <div class="bili-post-stats">
                                    <div class="stat-item like-btn" onclick="event.stopPropagation(); FoodCardComponent.toggleLike(${food.id}, this)">
                                           <span class="stat-icon" data-icon="like"></span>
                                              <span class="stat-text">${food.likeCount && food.likeCount > 0 ? food.likeCount : ''}</span>
                                                       </div>
                                                           <div class="stat-item comment-stat" onclick="FoodCardComponent.focusComment()">
                                                                <span class="stat-icon" data-icon="comment"></span>
                                                                <span class="stat-text" id="commentCountStat">0</span>
                                                            </div>
                                                            <div class="stat-item favorite-btn" onclick="event.stopPropagation(); FoodCardComponent.toggleFavorite(${food.id}, this)" data-food-id="${food.id}">
                                                                <span class="stat-icon" data-icon="favorite"></span>
                                                                <span class="stat-text">收藏</span>
                                                            </div>
                                                        </div>
                        </div>
                    `;
                }

                await loadComments(foodId);

                if (currentUserId) {
                    await checkFavoriteStatus(foodId);
                }

                const detailModal = document.getElementById('detailModal');
                if (detailModal) {
                    detailModal.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('加载美食详情失败:', error);
            alert('加载失败，请稍后重试');
        }
    }

    /**
     * 加载评论
     */
    async function loadComments(foodId) {
        try {
            const countRes = await fetch(`${apiBaseUrl}/comments/food/${foodId}/count`);
            const countResult = await countRes.json();
            if (countResult.code === 200) {
                const countElement = document.getElementById('commentCount');
                if (countElement) countElement.textContent = countResult.data;
                const statElement = document.getElementById('commentCountStat');
                if (statElement) statElement.textContent = countResult.data;
            }

            const res = await fetch(`${apiBaseUrl}/comments/food/${foodId}`);
            const result = await res.json();

            const listContainer = document.getElementById('commentList');
            if (!listContainer) return;

            if (result.code === 200 && result.data && result.data.length > 0) {
                let comments = result.data;

                const topComments = comments.filter(c => c.parentId === 0 || c.parentId == null);
                const replies = comments.filter(c => c.parentId > 0);

                if (currentCommentSort === 'hot') {
                    topComments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                } else {
                    topComments.sort((a, b) => {
                        const timeA = new Date(a.createTime).getTime();
                        const timeB = new Date(b.createTime).getTime();
                        return timeB - timeA;
                    });
                }

                let html = '';
                topComments.forEach(c => {
                    const cReplies = replies.filter(r => r.parentId === c.id);
                    const likeCount = c.likeCount || 0;
                    const replyCount = c.replyCount || 0;
                    const commentAvatarUrl = getAvatarUrl(c.userAvatar, c.userName, '#4ecdc4');

                    const isOwner = currentUserId && c.userId === currentUserId;
                    const isAdmin = currentUserRole === 1;
                    const canDelete = isOwner || isAdmin;

                    let repliesHtml = '';
                    cReplies.forEach(r => {
                        const replyAvatarUrl = getAvatarUrl(r.userAvatar, r.userName, '#4ecdc4');
                        const isReplyOwner = currentUserId && r.userId === currentUserId;
                        const canDeleteReply = isReplyOwner || isAdmin;

                        repliesHtml += `
                            <div class="comment-reply-item">
                                <div class="reply-avatar" onclick="FoodCardComponent.goToUserProfile(${r.userId}, event)" style="cursor:pointer;">
                                    <img src="${replyAvatarUrl}" alt="avatar">
                                </div>
                                <div class="reply-content-wrapper">
                                    <span class="reply-user" onclick="FoodCardComponent.goToUserProfile(${r.userId}, event)" style="cursor:pointer;">${escapeHtml(r.userName)}:</span>
                                    <span>${escapeHtml(r.content)}</span>
                                    ${canDeleteReply ? `<button class="comment-delete-btn" onclick="FoodCardComponent.deleteComment(${r.id}, ${foodId}, event)">删除</button>` : ''}
                                </div>
                            </div>
                        `;
                    });

                    html += `
                        <div class="comment-item" data-comment-id="${c.id}">
                            <div class="comment-avatar" onclick="FoodCardComponent.goToUserProfile(${c.userId}, event)" style="cursor:pointer;">
                                <img src="${commentAvatarUrl}" alt="avatar">
                            </div>
                            <div class="comment-content">
                                <div class="comment-user-row">
                                    <span class="comment-username" onclick="FoodCardComponent.goToUserProfile(${c.userId}, event)" style="cursor:pointer;">${escapeHtml(c.userName)}</span>
                                    <span class="comment-time">${formatDate(c.createTime)}</span>
                                    ${canDelete ? `<button class="comment-delete-btn" onclick="FoodCardComponent.deleteComment(${c.id}, ${foodId}, event)">删除</button>` : ''}
                                </div>
                                <div class="comment-text">${escapeHtml(c.content)}</div>
                                <div class="comment-actions-bar">
                                    <button class="comment-action-btn" onclick="FoodCardComponent.toggleCommentLike(${c.id}, this)">
                                        <span class="action-icon" data-icon="like-small"></span>
                                        <span class="action-text">${likeCount > 0 ? likeCount : '点赞'}</span>
                                    </button>
                                    <button class="comment-action-btn" onclick="FoodCardComponent.toggleReplyInput(${c.id})">
                                        <span class="action-icon" data-icon="comment-small"></span>
                                        <span class="action-text">${replyCount > 0 ? replyCount + '条回复' : '回复'}</span>
                                    </button>
                                </div>
                                <div class="reply-input-box" id="reply-box-${c.id}">
                                    <textarea placeholder="回复 ${escapeHtml(c.userName)}..." rows="2" id="reply-text-${c.id}"></textarea>
                                    <div class="reply-input-actions">
                                        <button class="reply-cancel-btn" onclick="FoodCardComponent.toggleReplyInput(${c.id})">取消</button>
                                        <button class="reply-submit-btn" onclick="FoodCardComponent.submitReply(${c.id}, ${foodId})">发送</button>
                                    </div>
                                </div>
                                ${cReplies.length > 0 ? `<div class="comment-replies">${repliesHtml}</div>` : ''}
                            </div>
                        </div>
                    `;
                });
                listContainer.innerHTML = html;

            } else {
                listContainer.innerHTML = `
                    <div class="comment-empty-state">
                        <div class="comment-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                        <p>暂无评论，来说两句吧</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    }

    /**
     * 提交评论
     */
    async function submitComment() {
        if (!currentUserId) {
            alert('请先登录后再评论');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const commentInput = document.getElementById('commentInput');
        if (!commentInput) return;

        const content = commentInput.value.trim();
        if (!content) {
            alert('评论内容不能为空');
            return;
        }

        if (!currentFoodId) {
            alert('请先选择美食');
            return;
        }

        try {
            const response = await fetch(apiBaseUrl + '/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    foodId: currentFoodId,
                    content: content
                })
            });

            const result = await response.json();

            if (result.code === 200) {
                commentInput.value = '';
                await loadComments(currentFoodId);
            } else {
                alert(result.message || '评论失败');
            }
        } catch (error) {
            console.error('评论失败:', error);
            alert('评论失败，请稍后重试');
        }
    }

    /**
     * 切换点赞状态
     */
    async function toggleLike(foodId, element) {
        if (!currentUserId) {
            alert('请先登录后再点赞');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const response = await fetch(apiBaseUrl + `/foods/${foodId}/like`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200) {
                const likeCountElement = element.querySelector('.stat-text');
                const likeIconElement = element.querySelector('.stat-icon');
                if (likeCountElement) {
                    likeCountElement.textContent = result.data > 0 ? result.data : '';
                }
                if (likeIconElement) {
                    if (result.data > 0) {
                        element.classList.add('liked');
                        likeIconElement.setAttribute('data-icon', 'like-active');
                    } else {
                        element.classList.remove('liked');
                        likeIconElement.setAttribute('data-icon', 'like');
                    }
                }
            } else {
                alert(result.message || '操作失败');
            }
        } catch (error) {
            console.error('点赞失败:', error);
            alert('操作失败，请稍后重试');
        }
    }

    /**
     * 切换收藏状态
     */
    async function toggleFavorite(foodId, element) {
        if (!currentUserId) {
            alert('请先登录后再收藏');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/favorite/toggle?userId=${currentUserId}&foodId=${foodId}`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200) {
                const isFavorited = result.data;
                const favoriteText = element.querySelector('.stat-text');
                const favoriteIcon = element.querySelector('.stat-icon');
                if (favoriteText) {
                    favoriteText.textContent = isFavorited ? '已收藏' : '收藏';
                }
                if (favoriteIcon) {
                    favoriteIcon.setAttribute('data-icon', isFavorited ? 'favorite-active' : 'favorite');
                }
                if (isFavorited) {
                    element.classList.add('favorited');
                } else {
                    element.classList.remove('favorited');
                }
            } else {
                alert(result.message || '操作失败');
            }
        } catch (error) {
            console.error('收藏失败:', error);
            alert('操作失败，请稍后重试');
        }
    }

    /**
     * 检查收藏状态
     */
    async function checkFavoriteStatus(foodId) {
        if (!currentUserId) return;

        try {
            const response = await fetch(`${apiBaseUrl}/favorite/check?userId=${currentUserId}&foodId=${foodId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200 && result.data) {
                const favoriteBtns = document.querySelectorAll(`.favorite-btn[data-food-id="${foodId}"]`);
                favoriteBtns.forEach(btn => {
                    btn.classList.add('favorited');
                    const iconSpan = btn.querySelector('.stat-icon');
                    const textSpan = btn.querySelector('.stat-text');
                    if (iconSpan) iconSpan.setAttribute('data-icon', 'favorite-active');
                    if (textSpan) textSpan.textContent = '已收藏';
                });
            }
        } catch (error) {
            console.error('检查收藏状态失败:', error);
        }
    }

    /**
     * 显示提示消息
     */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    /**
     * 聚焦评论框
     */
    function focusComment() {
        const input = document.getElementById('commentInput');
        if (input) input.focus();
    }

    /**
     * 分享功能
     */
    function sharePost() {
        alert('分享功能开发中...');
    }

    /**
     * 关闭详情弹窗
     */
    function closeDetail() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.style.display = 'none';
        }
        currentFoodId = null;
    }

    /**
     * 处理弹窗背景点击
     */
    function handleModalClick(event) {
        if (event.target.id === 'detailModal') {
            closeDetail();
        }
    }

    /**
     * 跳转到用户主页
     */
    function goToUserProfile(userId, event) {
        if (event) event.stopPropagation();
        window.location.href = `/pages/auth/profile.html?userId=${userId}`;
    }

    /**
     * 删除美食帖子
     */
    async function deleteFood(foodId, event) {
        if (event) event.stopPropagation();

        if (!confirm('确定要删除这条美食帖子吗？此操作不可撤销。')) {
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/foods/${foodId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200) {
                showToast('删除成功');
                // 从DOM中移除卡片
                const card = document.querySelector(`.food-grid-card[data-food-id="${foodId}"]`);
                if (card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.remove();
                        // 检查是否还有卡片
                        const remainingCards = document.querySelectorAll('.food-grid-card');
                        if (remainingCards.length === 0) {
                            const grid = document.getElementById('foodGrid');
                            if (grid) {
                                grid.innerHTML = `
                                    <div class="empty-state">
                                        <div class="empty-state-icon">🍜</div>
                                        <div class="empty-state-text">暂无美食</div>
                                    </div>
                                `;
                            }
                        }
                    }, 300);
                }
            } else {
                alert(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除美食失败:', error);
            alert('删除失败，请稍后重试');
        }
    }

    /**
     * 删除评论
     */
    async function deleteComment(commentId, foodId, event) {
        if (event) event.stopPropagation();

        if (!currentUserId) {
            alert('请先登录后再操作');
            return;
        }

        if (!confirm('确定要删除这条评论吗？')) {
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200) {
                await loadComments(foodId);
            } else {
                alert(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除评论失败:', error);
            alert('删除失败，请稍后重试');
        }
    }

    /**
     * 跳转到AI页面询问关于当前美食的问题
     */
    function askAIAboutFood(foodInfoStr) {
        const foodInfo = decodeURIComponent(foodInfoStr);
        window.location.href = `/pages/auth/ai-chat.html?foodInfo=${encodeURIComponent(foodInfo)}`;
    }

    /**
     * 排序评论
     */
    function sortComments(sortType) {
        currentCommentSort = sortType;

        const sortItems = document.querySelectorAll('.sort-item');
        sortItems.forEach(item => {
            item.classList.remove('active');
        });

        if (sortType === 'latest') {
            sortItems[0]?.classList.add('active');
        } else if (sortType === 'hot') {
            sortItems[1]?.classList.add('active');
        }

        if (currentFoodId) {
            loadComments(currentFoodId);
        }
    }

    /**
     * 切换评论点赞
     */
    async function toggleCommentLike(commentId, element) {
        if (!currentUserId) {
            alert('请先登录后再操作');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/comments/${commentId}/like`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.code === 200) {
                const likeCount = result.data || 0;
                const actionText = element.querySelector('.action-text');
                const actionIcon = element.querySelector('.action-icon');
                if (actionText) {
                    actionText.textContent = likeCount > 0 ? likeCount : '点赞';
                }
                if (actionIcon) {
                    if (likeCount > 0) {
                        element.classList.add('liked');
                        actionIcon.setAttribute('data-icon', 'like-small-active');
                    } else {
                        element.classList.remove('liked');
                        actionIcon.setAttribute('data-icon', 'like-small');
                    }
                }
            } else {
                alert(result.message || '操作失败');
            }
        } catch (error) {
            console.error('点赞评论失败:', error);
            alert('操作失败，请稍后重试');
        }
    }

    /**
     * 切换回复输入框
     */
    function toggleReplyInput(commentId) {
        const replyBox = document.getElementById(`reply-box-${commentId}`);
        if (replyBox) {
            const isVisible = replyBox.style.display === 'block';
            replyBox.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                const textarea = document.getElementById(`reply-text-${commentId}`);
                if (textarea) textarea.focus();
            }
        }
    }

    /**
     * 提交回复
     */
    async function submitReply(parentCommentId, foodId) {
        if (!currentUserId) {
            alert('请先登录后再回复');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const textarea = document.getElementById(`reply-text-${parentCommentId}`);
        if (!textarea) return;

        const content = textarea.value.trim();
        if (!content) {
            alert('回复内容不能为空');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    foodId: foodId,
                    content: content,
                    parentId: parentCommentId
                })
            });

            const result = await response.json();

            if (result.code === 200) {
                textarea.value = '';
                toggleReplyInput(parentCommentId);
                await loadComments(foodId);
            } else {
                alert(result.message || '回复失败');
            }
        } catch (error) {
            console.error('回复失败:', error);
            alert('回复失败，请稍后重试');
        }
    }

    // 暴露公共API
    return {
        init,
        renderFoodGridList,
        renderFoodCard,
        showDetail,
        closeDetail,
        submitComment,
        toggleLike,
        toggleFavorite,
        focusComment,
        loadComments,
        goToUserProfile,
        handleModalClick,
        deleteFood,
        toggleCommentLike,
        toggleReplyInput,
        submitReply,
        askAIAboutFood,
        deleteComment,
        sortComments
    };
})();
