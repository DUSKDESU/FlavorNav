class AdminPanel {
    constructor() {
        this.currentTab = 'dashboard';
        this.auditMode = 'keyword';
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadDashboardData();
        this.updatePendingBadge();
        this.loadAuditMode();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/user/check', { credentials: 'include' });
            const result = await response.json();

            if (result.code !== 200) {
                window.location.href = '/pages/auth/login.html';
                return;
            }

            const userResponse = await fetch('/api/user/current', { credentials: 'include' });
            const userResult = await userResponse.json();

            if (userResult.code === 200) {
                const user = userResult.data;
                if (user.role !== 2) {
                    alert('权限不足，仅管理员可访问');
                    window.location.href = '/pages/auth/main/map.html';
                    return;
                }
                const adminUsernameEl = document.getElementById('adminUsername');
                if (adminUsernameEl) {
                    adminUsernameEl.textContent = '👤 ' + user.username;
                }
            } else {
                window.location.href = '/pages/auth/login.html';
            }
        } catch (error) {
            console.error('登录检查失败:', error);
            window.location.href = '/pages/auth/login.html';
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setAuditMode(btn.dataset.mode);
            });
        });

        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const modalCancel = document.querySelector('.modal-cancel');
        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                this.closeModal();
            });
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        }

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        this.currentTab = tabName;
        this.updatePageTitle(tabName);
        this.loadTabData(tabName);
    }

    updatePageTitle(tabName) {
        const titles = {
            'dashboard': '数据概览',
            'foods-pending': '待审核美食',
            'foods-all': '美食管理',
            'users': '用户管理'
        };
        const titleElement = document.querySelector('.page-title');
        if (titleElement) {
            titleElement.textContent = titles[tabName] || '管理后台';
        }
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'foods-pending':
                this.loadPendingFoods();
                break;
            case 'foods-all':
                this.loadAllFoods();
                break;
            case 'users':
                this.loadUsers();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [foodsRes, usersRes] = await Promise.all([
                fetch('/api/admin/foods/all', { credentials: 'include' }),
                fetch('/api/admin/users', { credentials: 'include' })
            ]);

            const foodsData = await foodsRes.json();
            const usersData = await usersRes.json();

            if (foodsData.code === 200 && usersData.code === 200) {
                const foods = foodsData.data;
                const users = usersData.data;

                const totalFoodsEl = document.getElementById('total-foods');
                if (totalFoodsEl) totalFoodsEl.textContent = foods.length;

                const pendingFoodsEl = document.getElementById('pending-foods');
                if (pendingFoodsEl) pendingFoodsEl.textContent = foods.filter(f => f.status === 0).length;

                const totalUsersEl = document.getElementById('total-users');
                if (totalUsersEl) totalUsersEl.textContent = users.length;

                const activeUsersEl = document.getElementById('active-users');
                if (activeUsersEl) activeUsersEl.textContent = users.filter(u => u.status === 1).length;
            } else {
                if (foodsData.code !== 200) {
                    this.showToast(foodsData.message || '加载美食数据失败', 'error');
                }
                if (usersData.code !== 200) {
                    this.showToast(usersData.message || '加载用户数据失败', 'error');
                }
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showToast('加载数据失败', 'error');
        }
    }

    async updatePendingBadge() {
        try {
            const res = await fetch('/api/admin/foods/pending', { credentials: 'include' });
            const data = await res.json();

            if (data.code === 200) {
                const count = data.data.length;
                const badge = document.getElementById('pending-badge');
                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (error) {
            console.error('更新徽章失败:', error);
        }
    }

    async loadPendingFoods() {
        try {
            const res = await fetch('/api/admin/foods/pending', { credentials: 'include' });
            const data = await res.json();

            if (data.code === 200) {
                this.renderPendingFoods(data.data);
            } else {
                this.showToast(data.message || '加载失败', 'error');
            }
        } catch (error) {
            console.error('加载待审核美食失败:', error);
            this.showToast('加载失败', 'error');
        }
    }

    renderPendingFoods(foods) {
        const tbody = document.getElementById('pending-foods-table');
        if (!tbody) return;

        if (foods.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">✨</div>
                            <p>暂无待审核的美食</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = foods.map(food => `
            <tr>
                <td>${food.id}</td>
                <td>
                    ${food.imageUrl ?
                        `<img src="${food.imageUrl}" class="food-image" alt="${food.name}">` :
                        '<div class="food-image" style="background:#eee;display:flex;align-items:center;justify-content:center;">无图</div>'
                    }
                </td>
                <td>${food.name}</td>
                <td>${food.regionName || '-'}</td>
                <td>${food.userName || '-'}</td>
                <td>${this.formatDate(food.createTime)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-approve" onclick="adminPanel.approveFood(${food.id})">通过</button>
                        <button class="btn btn-reject" onclick="adminPanel.rejectFood(${food.id})">拒绝</button>
                        <button class="btn btn-delete" onclick="adminPanel.deleteFood(${food.id}, true)">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAllFoods() {
        try {
            const res = await fetch('/api/admin/foods/all', { credentials: 'include' });
            const data = await res.json();

            if (data.code === 200) {
                this.renderAllFoods(data.data);
            } else {
                this.showToast(data.message || '加载失败', 'error');
            }
        } catch (error) {
            console.error('加载所有美食失败:', error);
            this.showToast('加载失败', 'error');
        }
    }

    renderAllFoods(foods) {
        const tbody = document.getElementById('all-foods-table');
        if (!tbody) return;

        if (foods.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">🍜</div>
                            <p>暂无美食数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = foods.map(food => `
            <tr>
                <td>${food.id}</td>
                <td>
                    ${food.imageUrl ?
                        `<img src="${food.imageUrl}" class="food-image" alt="${food.name}">` :
                        '<div class="food-image" style="background:#eee;display:flex;align-items:center;justify-content:center;">无图</div>'
                    }
                </td>
                <td>${food.name}</td>
                <td>${food.regionName || '-'}</td>
                <td>${this.getStatusText(food.status)}</td>
                <td>${this.formatDate(food.createTime)}</td>
                <td>
                    <div class="action-btns">
                        ${food.status === 0 ? `
                            <button class="btn btn-approve" onclick="adminPanel.approveFood(${food.id})">通过</button>
                            <button class="btn btn-reject" onclick="adminPanel.rejectFood(${food.id})">拒绝</button>
                        ` : food.status === 1 ? `
                            <button class="btn btn-revoke" onclick="adminPanel.revokeApproval(${food.id})">撤销审核</button>
                        ` : ''}
                        <button class="btn btn-delete" onclick="adminPanel.deleteFood(${food.id}, false)">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        try {
            const res = await fetch('/api/admin/users', { credentials: 'include' });
            const data = await res.json();

            if (data.code === 200) {
                this.renderUsers(data.data);
            } else {
                this.showToast(data.message || '加载失败', 'error');
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            this.showToast('加载失败', 'error');
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('users-table');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <p>暂无用户数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    ${user.avatar ?
                        `<img src="${user.avatar}" class="user-avatar" alt="${user.username}">` :
                        '<div class="user-avatar" style="background:#eee;display:flex;align-items:center;justify-content:center;">👤</div>'
                    }
                </td>
                <td>${user.username}</td>
                <td>${user.email || '-'}</td>
                <td><span class="status-badge ${user.role === 2 ? 'role-admin' : 'role-user'}">${user.role === 2 ? '管理员' : '用户'}</span></td>
                <td><span class="status-badge ${user.status === 1 ? 'status-active' : 'status-banned'}">${user.status === 1 ? '正常' : '封禁'}</span></td>
                <td>${this.formatDate(user.createTime)}</td>
                <td>
                    <div class="action-btns">
                        ${user.status === 1 ?
                            `<button class="btn btn-ban" onclick="adminPanel.banUser(${user.id})">封禁</button>` :
                            `<button class="btn btn-unban" onclick="adminPanel.unbanUser(${user.id})">解封</button>`
                        }
                        <button class="btn btn-reset" onclick="adminPanel.resetPassword(${user.id}, '${user.username}')">重置密码</button>
                        <button class="btn btn-delete" onclick="adminPanel.deleteUser(${user.id}, '${user.username}')">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async setAuditMode(mode) {
        this.auditMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        try {
            const res = await fetch('/api/admin/audit-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ mode })
            });
            const data = await res.json();
            if (data.code === 200) {
                this.showToast(mode === 'ai' ? '已切换为 AI 审核模式' : '已切换为关键词审核模式', 'success');
            } else {
                this.showToast(data.message || '切换审核模式失败', 'error');
                this.loadAuditMode();
            }
        } catch (error) {
            console.error('切换审核模式失败:', error);
            this.showToast('切换审核模式失败', 'error');
        }
    }

    async loadAuditMode() {
        try {
            const res = await fetch('/api/admin/audit-mode', { credentials: 'include' });
            const data = await res.json();
            if (data.code === 200) {
                this.auditMode = data.data.mode || 'keyword';
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === this.auditMode);
                });
            }
        } catch (error) {
            console.error('加载审核模式失败:', error);
        }
    }

    async approveFood(id) {
        this.showConfirm('确认通过该美食审核？', async () => {
            try {
                const res = await fetch(`/api/admin/foods/${id}/approve`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('审核通过', 'success');
                    this.loadPendingFoods();
                    this.loadAllFoods();
                    this.loadDashboardData();
                    this.updatePendingBadge();
                } else {
                    this.showToast(data.message || '操作失败', 'error');
                }
            } catch (error) {
                console.error('审核失败:', error);
                this.showToast('操作失败', 'error');
            }
        });
    }

    async rejectFood(id) {
        this.showConfirm('确认拒绝该美食审核？', async () => {
            try {
                const res = await fetch(`/api/admin/foods/${id}/reject`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('已拒绝', 'success');
                    this.loadPendingFoods();
                    this.loadAllFoods();
                    this.loadDashboardData();
                    this.updatePendingBadge();
                } else {
                    this.showToast(data.message || '操作失败', 'error');
                }
            } catch (error) {
                console.error('拒绝失败:', error);
                this.showToast('操作失败', 'error');
            }
        });
    }

    async revokeApproval(id) {
        this.showConfirm('确认撤销该美食的审核通过状态？撤销后将重新变为待审核。', async () => {
            try {
                const res = await fetch(`/api/admin/foods/${id}/revoke`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('已撤销审核', 'success');
                    this.loadPendingFoods();
                    this.loadAllFoods();
                    this.loadDashboardData();
                    this.updatePendingBadge();
                } else {
                    this.showToast(data.message || '操作失败', 'error');
                }
            } catch (error) {
                console.error('撤销失败:', error);
                this.showToast('操作失败', 'error');
            }
        });
    }

    async deleteFood(id, isPending) {
        const confirmMsg = isPending ? '确认删除该待审核美食？' : '确认删除该美食？此操作不可恢复！';
        this.showConfirm(confirmMsg, async () => {
            try {
                const res = await fetch(`/api/admin/foods/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('美食已删除', 'success');
                    this.loadPendingFoods();
                    this.loadAllFoods();
                    this.loadDashboardData();
                    this.updatePendingBadge();
                } else {
                    this.showToast(data.message || '删除失败', 'error');
                }
            } catch (error) {
                console.error('删除失败:', error);
                this.showToast('删除失败', 'error');
            }
        });
    }

    async banUser(id) {
        this.showConfirm('确认封禁该用户？', async () => {
            try {
                const res = await fetch(`/api/admin/users/${id}/ban`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('已封禁用户', 'success');
                    this.loadUsers();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.message || '操作失败', 'error');
                }
            } catch (error) {
                console.error('封禁失败:', error);
                this.showToast('操作失败', 'error');
            }
        });
    }

    async unbanUser(id) {
        this.showConfirm('确认解封该用户？', async () => {
            try {
                const res = await fetch(`/api/admin/users/${id}/unban`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('已解封用户', 'success');
                    this.loadUsers();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.message || '操作失败', 'error');
                }
            } catch (error) {
                console.error('解封失败:', error);
                this.showToast('操作失败', 'error');
            }
        });
    }

    resetPassword(userId, username) {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="form-group">
                <label>为用户 "${username}" 设置新密码：</label>
                <input type="password" id="new-password" placeholder="请输入新密码" minlength="6">
            </div>
        `;

        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = '重置密码';

        const modalFooter = document.getElementById('modal-footer');
        if (modalFooter) modalFooter.style.display = 'flex';

        const confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const newPassword = document.getElementById('new-password').value;
                if (!newPassword || newPassword.length < 6) {
                    this.showToast('密码至少6位', 'error');
                    return;
                }

                try {
                    const res = await fetch(`/api/admin/users/${userId}/password`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ newPassword })
                    });
                    const data = await res.json();

                    if (data.code === 200) {
                        this.showToast('密码重置成功', 'success');
                        this.closeModal();
                    } else {
                        this.showToast(data.message || '重置失败', 'error');
                    }
                } catch (error) {
                    console.error('重置失败:', error);
                    this.showToast('重置失败', 'error');
                }
            };
        }

        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.add('active');
    }

    deleteUser(id, username) {
        this.showConfirm(`确认删除用户 "${username}"？此操作不可恢复！`, async () => {
            try {
                const res = await fetch(`/api/admin/users/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.code === 200) {
                    this.showToast('用户已删除', 'success');
                    this.loadUsers();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.message || '删除失败', 'error');
                }
            } catch (error) {
                console.error('删除失败:', error);
                this.showToast('删除失败', 'error');
            }
        });
    }

    showConfirm(message, onConfirm) {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `<p>${message}</p>`;

        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = '确认操作';

        const modalFooter = document.getElementById('modal-footer');
        if (modalFooter) modalFooter.style.display = 'flex';

        const confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                onConfirm();
                this.closeModal();
            };
        }

        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.add('active');
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.remove('active');

        const modalFooter = document.getElementById('modal-footer');
        if (modalFooter) modalFooter.style.display = 'none';
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusText(status) {
        const statusMap = {
            0: '<span class="status-badge status-pending">待审核</span>',
            1: '<span class="status-badge status-approved">已通过</span>',
            2: '<span class="status-badge status-rejected">已拒绝</span>'
        };
        return statusMap[status] || status;
    }

    logout() {
        this.showConfirm('确认退出登录？', () => {
            fetch('/api/user/logout', { credentials: 'include' }).finally(() => {
                window.location.href = '/pages/auth/login.html';
            });
        });
    }
}

function goBack() {
    window.location.href = '/pages/auth/main/map.html';
}

function logout() {
    fetch('/api/user/logout', { credentials: 'include' }).finally(() => {
        window.location.href = '/pages/auth/login.html';
    });
}

const adminPanel = new AdminPanel();
