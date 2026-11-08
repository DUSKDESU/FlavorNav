
const API_BASE = '/api';
let currentUserId = null;
let profileUserId = null;
let isOwnProfile = false;
let isFollowing = false;
let currentUserRole = null;

// HTML 转义工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 生成头像SVG
function generateAvatarSVG(name, color = '#ff6b35') {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${encodeURIComponent(color)}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="50" font-family="Arial,sans-serif">${initial}</text></svg>`;
}

// 空状态线性图标（SVG，与顶部 Tab 图标风格一致）
const EMPTY_ICONS = {
    food: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M6 12a6 6 0 0 1 12 0"/><path d="M10 6v4"/><path d="M14 6v4"/></svg>`,
    favorite: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    followers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    following: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
};

// 页面加载
window.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await checkLogin();
    if (!loggedIn) {
        return;
    }
    await loadProfileData();

    // 在获取到 currentUserId 后再初始化 FoodCardComponent
    if (currentUserId) {
        FoodCardComponent.init({
            apiBaseUrl: API_BASE,
            userId: currentUserId,
            userRole: currentUserRole
        });
    }
});

// 检查登录
async function checkLogin() {
    try {
        const response = await fetch(API_BASE + '/user/check', {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.code !== 200) {
            alert('请先登录后再访问个人主页');
            window.location.href = '/pages/auth/login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('登录检查失败:', error);
        alert('请先登录后再访问个人主页');
        window.location.href = '/pages/auth/login.html';
        return false;
    }
}

// 加载个人主页数据
async function loadProfileData() {
    try {
        // 获取当前用户信息
        const userResponse = await fetch(API_BASE + '/user/current', {
            credentials: 'include'
        });
        const userResult = await userResponse.json();

        if (userResult.code === 200) {
            const user = userResult.data;
            currentUserId = user.id;
            currentUserRole = user.role;

            // 检查URL参数，判断是查看自己的主页还是别人的主页
            const urlParams = new URLSearchParams(window.location.search);
            profileUserId = urlParams.get('userId') || currentUserId;
            isOwnProfile = profileUserId == currentUserId;

            // 加载被查看用户的信息
            const profileUserResponse = await fetch(API_BASE + '/user/' + profileUserId);
            const profileUserResult = await profileUserResponse.json();

            if (profileUserResult.code === 200) {
                const profileUser = profileUserResult.data;
                renderUserProfile(profileUser);
                await loadUserFoods(profileUser.id);
                await loadFollowInfo(profileUser.id);
            }
        }
    } catch (error) {
        console.error('加载个人主页失败:', error);
        alert('加载失败，请稍后重试');
    }
}

// 渲染用户资料
function renderUserProfile(user) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('userAvatar').src = user.avatar || generateAvatarSVG(user.username);
    document.getElementById('userSignature').textContent = user.signature || '这个人很懒，什么都没写~';
    document.getElementById('followingCount').textContent = user.followingCount || 0;
    document.getElementById('followerCount').textContent = user.followerCount || 0;
    document.getElementById('likeCount').textContent = user.likeCount || 0;

    if (isOwnProfile) {
        document.getElementById('editProfileBtn').style.display = 'inline-block';
        document.getElementById('followBtn').style.display = 'none';
        document.querySelector('[data-tab="favorites"]').style.display = 'block';

        // 显示管理员入口（仅 role=2 的管理员）
        if (currentUserRole === 2) {
            document.getElementById('adminEntryBtn').style.display = 'inline-flex';
        } else {
            document.getElementById('adminEntryBtn').style.display = 'none';
        }
    } else {
        document.getElementById('editProfileBtn').style.display = 'none';
        document.getElementById('followBtn').style.display = 'inline-block';
        document.getElementById('adminEntryBtn').style.display = 'none';
        document.querySelector('[data-tab="favorites"]').style.display = 'none';
    }
}

// 跳转到管理系统
function goToAdminSystem() {
    window.location.href = '/pages/auth/admin.html';
}

// 加载用户美食
async function loadUserFoods(userId, sortType = 'latest') {
    try {
        const response = await fetch(API_BASE + '/foods/user/' + userId);
        const result = await response.json();

        const foodGrid = document.getElementById('foodGrid');

        if (result.code === 200 && result.data && result.data.length > 0) {
            let foods = result.data;

            // 排序逻辑
            if (sortType === 'popular') {
                foods.sort((a, b) => {
                    const countA = a.likeCount || 0;
                    const countB = b.likeCount || 0;
                    return countB - countA; // 降序排列
                });
            }
            // latest 默认就是按 createTime 排序，后端已处理

            foodGrid.innerHTML = FoodCardComponent.renderFoodGridList(foods, '', isOwnProfile);
        } else {
            foodGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${EMPTY_ICONS.food}</div>
                    <div class="empty-state-text">暂无美食</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载美食失败:', error);
    }
}

// 加载用户收藏
async function loadUserFavorites(userId) {
    try {
        const response = await fetch(API_BASE + '/favorite/list/' + userId, {
            credentials: 'include'
        });
        const result = await response.json();

        const favoriteGrid = document.getElementById('favoriteGrid');

        if (result.code === 200 && result.data && result.data.length > 0) {
            const favoriteFoods = result.data.map(item => item.food).filter(food => food !== null);

            if (favoriteFoods.length > 0) {
                favoriteGrid.innerHTML = FoodCardComponent.renderFoodGridList(favoriteFoods);
            } else {
                favoriteGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">${EMPTY_ICONS.favorite}</div>
                        <div class="empty-state-text">暂无收藏</div>
                    </div>
                `;
            }
        } else {
            favoriteGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${EMPTY_ICONS.favorite}</div>
                    <div class="empty-state-text">暂无收藏</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载收藏失败:', error);
        document.getElementById('favoriteGrid').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${EMPTY_ICONS.error}</div>
                <div class="empty-state-text">加载失败</div>
            </div>
        `;
    }
}

// 加载关注信息
async function loadFollowInfo(userId) {
    try {
        const response = await fetch(API_BASE + '/follow/info/' + userId, {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.code === 200) {
            const info = result.data;
            document.getElementById('followingCount').textContent = info.followingCount || 0;
            document.getElementById('followerCount').textContent = info.followerCount || 0;
            isFollowing = info.isFollowing || false;
            const followBtn = document.getElementById('followBtn');
            if (isFollowing) {
                followBtn.classList.add('following');
                followBtn.querySelector('.follow-text').textContent = '已关注';
            } else {
                followBtn.classList.remove('following');
                followBtn.querySelector('.follow-text').textContent = '+ 关注';
            }
        }
    } catch (error) {
        console.error('加载关注信息失败:', error);
    }
}

// 切换标签
function switchTab(tabName) {
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.getElementById('foodsSection').style.display = tabName === 'foods' ? 'block' : 'none';
    document.getElementById('favoritesSection').style.display = tabName === 'favorites' ? 'block' : 'none';
    document.getElementById('followersSection').style.display = tabName === 'followers' ? 'block' : 'none';
    document.getElementById('followingsSection').style.display = tabName === 'followings' ? 'block' : 'none';

    if (tabName === 'foods') {
        loadUserFoods(profileUserId);
    } else if (tabName === 'favorites' && isOwnProfile) {
        loadUserFavorites(profileUserId);
    }
}

// 显示粉丝列表
async function showFollowers() {
    switchTab('followers');

    const followersList = document.getElementById('followersList');

    try {
        const response = await fetch(API_BASE + '/follow/followers/' + profileUserId);
        const result = await response.json();

        console.log('粉丝列表API响应:', result);

        if (result.code === 200 && result.data && result.data.length > 0) {
            document.getElementById('followersCount').textContent = result.data.length;
            followersList.innerHTML = renderUserCards(result.data, 'follower');
        } else {
            followersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${EMPTY_ICONS.followers}</div>
                    <div class="empty-state-text">暂无粉丝</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载粉丝列表失败:', error);
        followersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${EMPTY_ICONS.error}</div>
                <div class="empty-state-text">加载失败</div>
            </div>
        `;
    }
}

// 显示关注列表
async function showFollowings() {
    switchTab('followings');

    const followingsList = document.getElementById('followingsList');

    try {
        const response = await fetch(API_BASE + '/follow/followings/' + profileUserId);
        const result = await response.json();

        if (result.code === 200 && result.data && result.data.length > 0) {
            document.getElementById('followingsCount').textContent = result.data.length;
            followingsList.innerHTML = renderUserCards(result.data, 'following');
        } else {
            followingsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${EMPTY_ICONS.following}</div>
                    <div class="empty-state-text">暂无关注</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载关注列表失败:', error);
        followingsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${EMPTY_ICONS.error}</div>
                <div class="empty-state-text">加载失败</div>
            </div>
        `;
    }
}

// 渲染用户卡片列表
function renderUserCards(users, listType) {
    return users.map(user => {
        const isMutual = listType === 'follower' && user.isMutual;
        const isFollowing = listType === 'following' || isMutual;
        const isOwnProfile = user.id == currentUserId;

        return `
            <div class="user-card">
                <div class="user-card-avatar" onclick="goToUserProfile(${user.id}, event)">
                    <img src="${user.avatar || generateAvatarSVG(user.username)}" alt="avatar">
                </div>
                <div class="user-card-info" onclick="goToUserProfile(${user.id}, event)">
                    <div class="user-card-username" style="cursor:pointer;">${escapeHtml(user.username)}</div>
                    <div class="user-card-signature">${escapeHtml(user.signature || '这个人很懒，什么都没写~')}</div>
                </div>
                <div class="user-card-actions">
                    ${isOwnProfile ? '' : `
                        <button class="follow-action-btn ${isFollowing ? 'following' : ''}"
                                onclick="${isFollowing ? 'unfollowUser(' + user.id + ', event)' : 'followUser(' + user.id + ', event)'}">
                            ${isMutual ? '已互粉' : (isFollowing ? '已关注' : '回关')}
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// 关注用户
async function followUser(userId, event) {
    if (event) event.stopPropagation();

    try {
        const response = await fetch(API_BASE + '/follow/' + userId, {
            method: 'POST',
            credentials: 'include'
        });

        const result = await response.json();
        if (result.code === 200) {
            // 刷新当前列表
            if (document.getElementById('followersSection').style.display !== 'none') {
                await showFollowers();
            } else {
                await showFollowings();
            }
        } else {
            alert(result.message || '操作失败');
        }
    } catch (error) {
        console.error('关注失败:', error);
        alert('操作失败，请稍后重试');
    }
}

// 取消关注
async function unfollowUser(userId, event) {
    if (event) event.stopPropagation();

    try {
        const response = await fetch(API_BASE + '/follow/' + userId, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();
        if (result.code === 200) {
            // 刷新当前列表
            if (document.getElementById('followersSection').style.display !== 'none') {
                await showFollowers();
            } else {
                await showFollowings();
            }
        } else {
            alert(result.message || '操作失败');
        }
    } catch (error) {
        console.error('取消关注失败:', error);
        alert('操作失败，请稍后重试');
    }
}

// 跳转到用户主页
function goToUserProfile(userId, event) {
    if (event) event.stopPropagation();
    window.location.href = `/pages/auth/profile.html?userId=${userId}`;
}

// 切换签名编辑
function toggleSignatureEdit() {
    const editBox = document.getElementById('signatureEditBox');
    const signature = document.getElementById('userSignature');
    const input = document.getElementById('signatureInput');

    if (editBox.style.display === 'none') {
        input.value = signature.textContent;
        editBox.style.display = 'block';
        document.getElementById('charCount').textContent = input.value.length;
    } else {
        editBox.style.display = 'none';
    }
}

// 保存签名
async function saveSignature() {
    const signature = document.getElementById('signatureInput').value.trim();

    try {
        const response = await fetch(API_BASE + '/user/signature', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ signature: signature })
        });

        const result = await response.json();

        if (result.code === 200) {
            document.getElementById('userSignature').textContent = signature || '这个人很懒，什么都没写~';
            toggleSignatureEdit();
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        console.error('保存签名失败:', error);
        alert('保存失败');
    }
}

// 格式化日期
function formatDate(time) {
    if (!time) return '';
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 查看用户详情
function viewUserProfile(userId) {
    if (userId === currentUserId) return;
    // 跳转到其他用户主页
    window.location.href = `/pages/auth/profile.html?userId=${userId}`;
}

// 显示美食详情
function showFoodDetail(foodId) {
    // 使用 food-card 组件显示详情
    if (window.FoodCardComponent) {
        FoodCardComponent.showDetail(foodId);
    }
}

// 排序美食
function sortFoods(sortType) {
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadUserFoods(profileUserId, sortType);
}

// 关闭弹窗
function closeModal() {
    document.getElementById('userListModal').style.display = 'none';
}

function handleModalClick(event) {
    if (event.target.id === 'userListModal') {
        closeModal();
    }
}

// 切换关注/取消关注
async function toggleFollow() {
    const followBtn = document.getElementById('followBtn');

    try {
        if (isFollowing) {
            // 取消关注
            const response = await fetch(API_BASE + '/follow/' + profileUserId, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();
            if (result.code === 200) {
                isFollowing = false;
                followBtn.classList.remove('following');
                followBtn.querySelector('.follow-text').textContent = '+ 关注';
                // 更新粉丝数
                const followerCountEl = document.getElementById('followerCount');
                followerCountEl.textContent = Math.max(0, parseInt(followerCountEl.textContent) - 1);
            } else {
                alert(result.message || '操作失败');
            }
        } else {
            // 关注
            const response = await fetch(API_BASE + '/follow/' + profileUserId, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();
            if (result.code === 200) {
                isFollowing = true;
                followBtn.classList.add('following');
                followBtn.querySelector('.follow-text').textContent = '已关注';
                // 更新粉丝数
                const followerCountEl = document.getElementById('followerCount');
                followerCountEl.textContent = parseInt(followerCountEl.textContent) + 1;
            } else {
                alert(result.message || '操作失败');
            }
        }
    } catch (error) {
        console.error('关注操作失败:', error);
        alert('操作失败，请稍后重试');
    }
}

// 退出登录
async function logout() {
    await fetch(API_BASE + '/user/logout', { credentials: 'include' });
    window.location.href = '/pages/auth/login.html';
}

// 返回上一页
function goBack() {
    window.history.back();
}

// 字符计数
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('signatureInput');
    if (textarea) {
        textarea.addEventListener('input', () => {
            document.getElementById('charCount').textContent = textarea.value.length;
        });
    }
});

// 打开编辑资料弹窗
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    document.getElementById('usernameInput').value = document.getElementById('username').textContent;
    document.getElementById('signatureInput').value = document.getElementById('userSignature').textContent === '这个人很懒，什么都没写~' ? '' : document.getElementById('userSignature').textContent;
    document.getElementById('avatarPreview').src = document.getElementById('userAvatar').src;
    document.getElementById('charCount').textContent = document.getElementById('signatureInput').value.length;
    modal.style.display = 'flex';
}

// 关闭编辑资料弹窗
function closeEditProfileModal(event) {
    if (event && event.target.id !== 'editProfileModal') return;
    document.getElementById('editProfileModal').style.display = 'none';
}

// 预览头像
function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 保存个人资料
async function saveProfile() {
    const username = document.getElementById('usernameInput').value.trim();
    const signature = document.getElementById('signatureInput').value.trim();
    const avatarFile = document.getElementById('avatarInput').files[0];

    if (!username) {
        alert('请输入用户名');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('signature', signature || '');
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        const response = await fetch(API_BASE + '/user/profile', {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (result.code === 200) {
            // 更新页面显示
            document.getElementById('username').textContent = username;
            document.getElementById('userSignature').textContent = signature || '这个人很懒，什么都没写~';
            if (result.data && result.data.avatar) {
                document.getElementById('userAvatar').src = result.data.avatar;
            }
            closeEditProfileModal();
            alert('资料更新成功');
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        console.error('保存个人资料失败:', error);
        alert('保存失败，请稍后重试');
    }
}
