
const API_BASE = '/api';
const MAX_HISTORY = 10;
let isLoggedIn = false;
let currentUserId = null;
let currentUserRole = 0;

FoodCardComponent.init({
    apiBaseUrl: API_BASE,
    userId: currentUserId
});

window.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
    loadSearchHistory();
    loadProvinces();

    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword');

    if (keyword) {
        document.getElementById('searchInput').value = keyword;
        searchFoods();
    } else {
        document.getElementById('searchInput').focus();
    }
});

async function checkLoginStatus() {
    try {
        const response = await fetch(API_BASE + '/user/check', { credentials: 'include' });
        const result = await response.json();
        if (result.code === 200) {
            isLoggedIn = true;
            currentUserId = result.data.id;
            currentUserRole = result.data.role || 0;
            FoodCardComponent.init({
                apiBaseUrl: API_BASE,
                userId: currentUserId,
                userRole: currentUserRole
            });
            updateUserActionArea();
        } else {
            isLoggedIn = false;
            currentUserId = null;
            currentUserRole = 0;
            FoodCardComponent.init({
                apiBaseUrl: API_BASE,
                userId: null,
                userRole: 0
            });
            updateUserActionArea();
        }
    } catch (error) {
        console.error('登录检查失败:', error);
        isLoggedIn = false;
        currentUserId = null;
        currentUserRole = 0;
        FoodCardComponent.init({
            apiBaseUrl: API_BASE,
            userId: null,
            userRole: 0
        });
        updateUserActionArea();
    }
}

function updateUserActionArea() {
    const userActionArea = document.getElementById('userActionArea');
    if (!userActionArea) return;

    if (isLoggedIn) {
        userActionArea.innerHTML = `
            <div class="nav-user" onclick="goToProfile()">👤 个人主页</div>
            <div class="nav-user" onclick="logout()">退出</div>
        `;
    } else {
        userActionArea.innerHTML = `
            <div class="nav-user" onclick="handleUserAction()">👤 登录/注册</div>
        `;
    }
}

function handleUserAction() {
    if (isLoggedIn) {
        goToProfile();
    } else {
        window.location.href = '/pages/auth/login.html';
    }
}

function goToProfile() {
    if (!isLoggedIn) {
        alert('请先登录后再访问个人主页');
        window.location.href = '/pages/auth/login.html';
        return;
    }
    window.location.href = '/pages/auth/profile.html';
}

function logout() {
    if (!isLoggedIn) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    fetch(API_BASE + '/user/logout', {
        credentials: 'include'
    }).then(() => {
        isLoggedIn = false;
        currentUserId = null;
        updateUserActionArea();
        alert('已退出登录');
    }).catch(error => {
        console.error('退出失败:', error);
    });
}

function toggleFilterPanel() {
    const panel = document.getElementById('filterPanel');
    const btn = document.querySelector('.filter-btn');
    panel.classList.toggle('active');
    btn.classList.toggle('active');
}

function resetFilter() {
    document.querySelectorAll('input[name="filterType"]:checked').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="filterTaste"]:checked').forEach(cb => cb.checked = false);
    document.getElementById('provinceSelect').value = '';
    document.getElementById('citySelect').innerHTML = '<option value="">选择城市</option>';
    document.getElementById('citySelect').value = '';
    searchFoods();
}

function getFilterParams() {
    const types = [];
    document.querySelectorAll('input[name="filterType"]:checked').forEach(cb => types.push(cb.value));

    const tastes = [];
    document.querySelectorAll('input[name="filterTaste"]:checked').forEach(cb => tastes.push(cb.value));

    const cityId = document.getElementById('citySelect').value;
    const provinceId = document.getElementById('provinceSelect').value;
    const regionId = cityId || provinceId || '';

    return {
        types: types.join(','),
        tastes: tastes.join(','),
        regionId: regionId
    };
}

function loadSearchHistory() {
    const history = getSearchHistory();
    const historyTags = document.getElementById('historyTags');

    if (history.length === 0) {
        historyTags.innerHTML = '<span class="history-empty">暂无搜索记录</span>';
    } else {
        historyTags.innerHTML = history.map(keyword =>
            `<span class="tag" onclick="quickSearch('${keyword}')">${keyword}</span>`
        ).join('');
    }
}

function getSearchHistory() {
    const historyStr = sessionStorage.getItem('searchHistory');
    return historyStr ? JSON.parse(historyStr) : [];
}

function saveSearchHistory(keyword) {
    let history = getSearchHistory();

    history = history.filter(item => item !== keyword);

    history.unshift(keyword);

    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }

    sessionStorage.setItem('searchHistory', JSON.stringify(history));
    loadSearchHistory();
}

function clearHistory() {
    sessionStorage.removeItem('searchHistory');
    loadSearchHistory();
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        searchFoods();
    }
}

function quickSearch(keyword) {
    document.getElementById('searchInput').value = keyword;
    searchFoods();
}

async function loadProvinces() {
    try {
        const res = await fetch(API_BASE + '/regions?level=1');
        const result = await res.json();
        if (result.code === 200) {
            const select = document.getElementById('provinceSelect');
            select.innerHTML = '<option value="">选择省份</option>';
            result.data.forEach(province => {
                const opt = document.createElement('option');
                opt.value = province.id;
                opt.textContent = province.name;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('加载省份失败:', error);
    }
}

async function loadCities() {
    const provinceId = document.getElementById('provinceSelect').value;
    const citySelect = document.getElementById('citySelect');

    if (!provinceId) {
        citySelect.innerHTML = '<option value="">选择城市</option>';
        return;
    }

    try {
        const res = await fetch(API_BASE + '/regions/' + provinceId + '/children');
        const result = await res.json();
        if (result.code === 200 && result.data && result.data.length > 0) {
            citySelect.innerHTML = '<option value="">选择城市</option>';
            result.data.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city.id;
                opt.textContent = city.name;
                citySelect.appendChild(opt);
            });
        } else {
            citySelect.innerHTML = '<option value="">暂无城市数据</option>';
        }
    } catch (error) {
        console.error('加载城市失败:', error);
        citySelect.innerHTML = '<option value="">加载失败</option>';
    }
}

async function searchFoods() {
    const keyword = document.getElementById('searchInput').value.trim();

    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }

    saveSearchHistory(keyword);

    const { types, tastes, regionId } = getFilterParams();

    try {
        let url = API_BASE + '/foods/search?keyword=' + encodeURIComponent(keyword);
        if (types) url += '&types=' + encodeURIComponent(types);
        if (tastes) url += '&tastes=' + encodeURIComponent(tastes);
        if (regionId) url += '&regionId=' + regionId;

        const response = await fetch(url);
        const result = await response.json();

        const foodList = document.getElementById('foodList');
        const resultInfo = document.getElementById('resultInfo');

        if (result.code === 200 && result.data && result.data.length > 0) {
            const filterText = [];
            if (types) filterText.push('分类: ' + types);
            if (tastes) filterText.push('味道: ' + tastes);
            if (regionId) filterText.push('地区: ' + (document.getElementById('citySelect').selectedOptions[0]?.text || document.getElementById('provinceSelect').selectedOptions[0]?.text));

            const filterDesc = filterText.length > 0 ? ' | ' + filterText.join(', ') : '';
            resultInfo.textContent = '找到 ' + result.data.length + ' 个相关美食' + filterDesc;

            foodList.innerHTML = FoodCardComponent.renderFoodGridList(result.data, keyword);
        } else {
            resultInfo.textContent = '';
            foodList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😔</div>
                    <div class="empty-state-text">未找到相关美食</div>
                    <div class="empty-state-hint">试试其他关键词或调整筛选条件</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('搜索失败:', error);
        document.getElementById('foodList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">搜索失败，请稍后重试</div>
            </div>
        `;
    }
}

function goBack() {
    window.history.back();
}

function handleDetailModalClick(event) {
    if (event.target.id === 'detailModal') {
        FoodCardComponent.closeDetail();
    }
}
