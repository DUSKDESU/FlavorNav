const API_BASE = '/api';
let mapChart = null;
let currentLevel = 'china';
let currentProvince = null;
let currentCity = null;
let currentUserLocation = null;
let isLoggedIn = false;
let currentUserId = null;
let currentUserRole = 0;
let currentUserData = null;

async function checkLogin() {
    try {
        const response = await fetch(API_BASE + '/user/check', {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.code === 200 && result.data) {
            isLoggedIn = true;
            currentUserId = result.data.id;
            currentUserRole = result.data.role || 0;
            currentUserData = result.data;
            return true;
        }
        return false;
    } catch (error) {
        console.error('登录检查失败:', error);
        isLoggedIn = false;
        currentUserId = null;
        currentUserRole = 0;
        currentUserData = null;
        return false;
    }
}

function generateAvatarSVG(name, color = '#ff6b35') {
    const initial = name ? name.charAt(0).toUpperCase() : '匿';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${encodeURIComponent(color)}' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='60' font-size='40' fill='white' text-anchor='middle'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
}

function goToProfile() {
    if (!isLoggedIn) {
        alert('请先登录后再访问个人主页');
        window.location.href = '/pages/auth/login.html';
        return;
    }
    window.location.href = '/pages/auth/profile.html';
}

function handleUserAction() {
    if (isLoggedIn) {
        goToProfile();
    } else {
        window.location.href = '/pages/auth/login.html';
    }
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
        currentUserData = null;
        updateUserActionArea();
        alert('已退出登录');
    }).catch(error => {
        console.error('退出失败:', error);
    });
}

function updateUserActionArea() {
    const userActionArea = document.getElementById('userActionArea');
    const navUserInfo = document.getElementById('navUserInfo');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUsername = document.getElementById('navUsername');

    if (!userActionArea || !navUserInfo || !navUserAvatar || !navUsername) return;

    const isMobile = window.innerWidth <= 768;

    if (isLoggedIn && currentUserData) {
        const avatarUrl = currentUserData.avatar || generateAvatarSVG(currentUserData.username);
        navUserAvatar.src = avatarUrl;
        navUsername.textContent = currentUserData.username;

        if (isMobile) {
            navUserInfo.classList.add('show');
            navUserInfo.style.cursor = 'pointer';
            navUserInfo.onclick = goToProfile;
            userActionArea.innerHTML = '<button class="nav-logout-btn" onclick="logout()">退出</button>';
        } else {
            navUserInfo.style.display = 'flex';
            navUserInfo.style.cursor = 'pointer';
            navUserInfo.onclick = goToProfile;
            userActionArea.innerHTML = '<button class="nav-logout-btn" onclick="logout()">退出登录</button>';
        }
    } else {
        navUserInfo.style.display = 'none';
        navUserInfo.classList.remove('show');
        userActionArea.innerHTML = '<button class="nav-login-btn" onclick="handleUserAction()">登录/注册</button>';
    }
}

function updateDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;

    const now = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    dateElement.textContent =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 星期${weekdays[now.getDay()]}`;
}

function showLoading() {
    document.getElementById('loading-mask').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-mask').style.display = 'none';
}

async function initMap() {
    showLoading();

    try {
        await checkLogin();

        updateUserActionArea();

        FoodCardComponent.init({
            apiBaseUrl: API_BASE,
            userId: currentUserId,
            userRole: currentUserRole
        });

        if (typeof echarts === 'undefined') {
            console.error('ECharts 未加载');
            alert('图表库加载失败，请刷新页面');
            hideLoading();
            return;
        }

        mapChart = echarts.init(document.getElementById('map'));
        updateDate();

        const chinaJson = await fetch('/json/china.json').then(res => {
            if (!res.ok) throw new Error('地图数据加载失败');
            return res.json();
        });

        echarts.registerMap('china', chinaJson);
        await showChinaMap();
        loadProvinceSelector();
        await loadRecommendFoods();

        window.addEventListener('resize', () => mapChart.resize());
        mapChart.on('click', handleMapClick);
    } catch (error) {
        console.error('地图初始化失败:', error);
        alert('地图初始化失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadProvinceSelector() {
    try {
        const response = await fetch(API_BASE + '/regions?level=1');
        const result = await response.json();
        if (result.code === 200) {
            const selector = document.getElementById('provinceSelector');
            selector.innerHTML = '';
            result.data.forEach(province => {
                const shortName = province.name.replace(/(省|自治区|市|特别行政区|维吾尔|壮族|回族)/g, '');
                const btn = document.createElement('button');
                btn.className = 'province-btn';
                btn.dataset.code = province.code;
                btn.dataset.id = province.id;
                const badge = document.createElement('span');
                badge.className = 'province-badge';
                badge.textContent = shortName.charAt(0);
                const label = document.createElement('span');
                label.className = 'province-label';
                label.textContent = shortName;
                btn.appendChild(badge);
                btn.appendChild(label);
                btn.onclick = () => loadProvinceMap(province);
                selector.appendChild(btn);
            });
        }
    } catch (error) {
        console.error('省份列表加载失败:', error);
    }
}

async function loadProvinceMap(province) {
    document.querySelectorAll('.province-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.code === province.code);
    });

    showLoading();
    try {
        const [mapDataRes, geoJson] = await Promise.all([
            fetch(API_BASE + '/regions/' + province.code + '/map-data').then(r => r.json()),
            fetch(`/json/${province.code}.json`).then(r => r.json()).catch(() => null)
        ]);

        if (!geoJson) {
            alert('该省份地图数据未找到');
            hideLoading();
            return;
        }

        echarts.registerMap(province.code, geoJson);

        let cities = [];
        if (mapDataRes.code === 200 && mapDataRes.data?.children) {
            cities = mapDataRes.data.children.map(c => ({
                name: c.name,
                value: c.id,
                code: c.code,
                level: c.level
            }));
        }

        const hint = cities.some(c => c.level === 3) ? '点击查看该区县美食' : '点击进入下一层';
        renderMap(province.code, province.name + ' 美食地图', cities, hint);
        currentLevel = 'province';
        currentProvince = province;
        currentCity = null;
        updateBackBtn();
    } catch (error) {
        console.error('加载省份地图失败:', error);
        alert('加载失败，请重试');
    } finally {
        hideLoading();
    }
}

async function loadCityMap(city) {
    showLoading();
    try {
        const [mapDataRes, geoJson] = await Promise.all([
            fetch(API_BASE + '/regions/' + city.code + '/map-data').then(r => r.json()),
            fetch(`/json/${city.code}.json`).then(r => r.json()).catch(() => null)
        ]);

        const children = (mapDataRes.code === 200 && mapDataRes.data?.children) ? mapDataRes.data.children : [];

        // 不设区的地级市（如东莞、中山）无县级子数据，直接进入美食页
        if (children.length === 0 || !geoJson) {
            window.location.href = `/pages/auth/city-food.html?regionId=${city.id}&cityName=${encodeURIComponent(city.name)}`;
            return;
        }

        echarts.registerMap(city.code, geoJson);
        const counties = children.map(c => ({
            name: c.name,
            value: c.id,
            code: c.code,
            level: c.level
        }));
        renderMap(city.code, currentProvince.name + ' · ' + city.name, counties, '点击查看该区县美食');
        currentLevel = 'city';
        currentCity = city;
        updateBackBtn();
    } catch (error) {
        console.error('加载城市地图失败:', error);
        alert('加载失败，请重试');
    } finally {
        hideLoading();
    }
}

function renderMap(mapName, title, data = [], hintText = '点击进入下一层') {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return params.name + '<br/><small style="color:#d35400; font-weight:bold;">' + hintText + '</small>';
            }
        },
        series: [{
            type: 'map',
            map: mapName,
            roam: true,
            zoom: 1.5,
            scaleLimit: {
                min: 0.8,
                max: 4
            },
            label: {
                show: true,
                fontSize: 10,
                color: '#555',
                fontFamily: 'Microsoft YaHei'
            },
            emphasis: {
                label: { color: '#fff', fontWeight: 'bold' },
                itemStyle: { areaColor: '#ff8c00', shadowBlur: 15, shadowColor: 'rgba(255, 140, 0, 0.5)' }
            },
            itemStyle: {
                areaColor: '#ffe0c2',
                borderColor: '#fff',
                borderWidth: 0.8
            },
            data: data
        }]
    };

    mapChart.setOption(option, true);

    mapChart.on('georoam', function (params) {
        if (params.zoom !== null && params.zoom !== undefined) {
            const currentZoom = mapChart.getOption().series[0].zoom || 1.2;
            if (currentZoom < 1.0) {
                mapChart.setOption({
                    series: [{
                        label: { show: false }
                    }]
                });
            } else {
                mapChart.setOption({
                    series: [{
                        label: { show: true }
                    }]
                });
            }
        }
    });

    document.getElementById('mapTitle').textContent = title;
}

async function showChinaMap() {
    showLoading();
    currentLevel = 'china';
    currentProvince = null;
    currentCity = null;
    document.querySelectorAll('.province-btn').forEach(btn => btn.classList.remove('active'));
    updateBackBtn();

    try {
        const [regionsRes, chinaJson] = await Promise.all([
            fetch(API_BASE + '/regions?level=1').then(r => r.json()),
            fetch('/json/china.json').then(r => r.json())
        ]);

        echarts.registerMap('china', chinaJson);

        let provinces = [];
        if (regionsRes.code === 200) {
            provinces = regionsRes.data.map(p => ({
                name: p.name,
                value: p.id,
                code: p.code
            }));
        }

        renderMap('china', '中国美食地图', provinces);
    } catch (error) {
        console.error('加载全国地图失败:', error);
        alert('加载失败，请刷新页面');
    } finally {
        hideLoading();
    }
}

function handleMapClick(params) {
    if (!params.data || !params.data.code) {
        console.warn('点击事件未获取到区域数据:', params);
        return;
    }

    if (currentLevel === 'china') {
        const provinceCode = params.data.code;
        const provinceName = params.name;
        const provinceId = params.data.value;

        if (provinceCode === '710000') {
            window.location.href = `/pages/auth/city-food.html?regionId=${provinceId}&cityName=${encodeURIComponent(provinceName)}`;
            return;
        }

        const province = { code: provinceCode, name: provinceName, id: provinceId };
        loadProvinceMap(province);
    } else if (currentLevel === 'province') {
        if (params.data.level === 3) {
            // 直辖市/省直辖县级行政区：下一级已是区县，直接进入美食页
            window.location.href = `/pages/auth/city-food.html?regionId=${params.data.value}&cityName=${encodeURIComponent(params.name)}`;
        } else {
            loadCityMap({ code: params.data.code, name: params.name, id: params.data.value });
        }
    } else if (currentLevel === 'city') {
        window.location.href = `/pages/auth/city-food.html?regionId=${params.data.value}&cityName=${encodeURIComponent(params.name)}`;
    }
}

function updateBackBtn() {
    const btn = document.getElementById('backBtn');
    if (!btn) return;
    if (currentLevel === 'province') {
        btn.textContent = '← 返回全国';
        btn.classList.add('show');
    } else if (currentLevel === 'city') {
        btn.textContent = '← 返回 ' + (currentProvince ? currentProvince.name : '');
        btn.classList.add('show');
    } else {
        btn.classList.remove('show');
    }
}

function goBackMap() {
    if (currentLevel === 'city' && currentProvince) {
        loadProvinceMap(currentProvince);
    } else {
        showChinaMap();
    }
}

function openFoodModal(regionName, regionCode, regionId) {
    currentCity = { name: regionName, code: regionCode, id: regionId, regionId: regionId };
    let displayRegion = currentLevel === 'china' || !currentProvince ? regionName : currentProvince.name + ' - ' + regionName;
    document.getElementById('regionName').value = displayRegion;
    document.getElementById('foodModal').dataset.regionName = regionName;
    document.getElementById('foodModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('foodModal').style.display = 'none';
    ['foodName', 'foodDescription', 'foodIngredients', 'foodCookingMethod', 'foodHistory'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUploadArea').classList.remove('has-image');
    document.getElementById('foodImage').value = '';
}

function handleModalClick(event) {
    if (event.target === document.getElementById('foodModal')) closeModal();
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('imageUploadArea');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadArea.classList.add('has-image');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function submitFood() {
    const foodName = document.getElementById('foodName').value.trim();
    if (!foodName) { alert('请输入美食名称'); return; }
    if (!currentCity.regionId) { alert('地区信息获取失败'); return; }

    try {
        const formData = new FormData();
        formData.append('name', foodName);
        formData.append('description', document.getElementById('foodDescription').value.trim());
        formData.append('regionId', currentCity.regionId);
        formData.append('regionName', document.getElementById('foodModal').dataset.regionName || currentCity.name);
        formData.append('ingredients', document.getElementById('foodIngredients').value.trim());
        formData.append('cookingMethod', document.getElementById('foodCookingMethod').value.trim());
        formData.append('history', document.getElementById('foodHistory').value.trim());

        const imageFile = document.getElementById('foodImage').files[0];
        if (imageFile) formData.append('file', imageFile);

        const response = await fetch(API_BASE + '/foods', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const result = await response.json();

        if (result.code === 200) {
            alert('美食添加成功！待审核通过后显示。');
            closeModal();
        } else {
            alert('添加失败：' + result.message);
        }
    } catch (error) {
        console.error('提交美食失败:', error);
        alert('提交失败，请稍后重试');
    }
}

async function getUserLocation() {
    // 优先使用浏览器精确定位（坐标），失败再回退 IP 定位
    const coordsLocation = await getLocationByCoords();
    if (coordsLocation) return coordsLocation;
    return await getLocationByIP();
}

function getLocationByCoords() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const response = await fetch(API_BASE + '/ai/location/coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ latitude: latitude, longitude: longitude })
                    });
                    const result = await response.json();
                    console.log('坐标定位接口返回:', result);
                    if (result.code === 200 && result.data && result.data !== '未知地区') {
                        currentUserLocation = result.data;
                        resolve(result.data);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.log('坐标定位请求失败:', error);
                    resolve(null);
                }
            },
            (err) => {
                console.log('浏览器定位被拒绝或失败:', err && err.message);
                resolve(null);
            },
            { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false }
        );
    });
}

async function getLocationByIP() {
    try {
        const response = await fetch(API_BASE + '/ai/location/ip', { credentials: 'include' });
        const result = await response.json();
        console.log('IP定位接口返回:', result);
        if (result.code === 200 && result.data && result.data !== '未知地区') {
            currentUserLocation = result.data;
            return result.data;
        }
    } catch (error) {
        console.log('获取用户位置失败:', error);
    }
    return null;
}

async function loadRecommendFoods() {
    const container = document.getElementById('recommendFoodList');
    if (!container) return;

    container.innerHTML = '<div class="recommend-loading">加载中...</div>';

    const location = await getUserLocation();
    console.log('用户定位结果:', location);

    if (location) {
        const titleEl = document.querySelector('.panel-title-text');
        if (titleEl) titleEl.textContent = '猜你喜欢 · ' + location.replace(/\s+/g, ' ');
    }

    try {
        let url = API_BASE + '/foods/popular?limit=20';
        if (location) {
            url += '&location=' + encodeURIComponent(location);
        }
        console.log('请求URL:', url);

        const response = await fetch(url, { credentials: 'include' });
        const result = await response.json();
        console.log('推荐美食数据:', result);

        if (result.code === 200 && result.data && result.data.length > 0) {
            renderRecommendFoods(result.data);
        } else {
            container.innerHTML = '<div class="recommend-empty">暂无推荐美食</div>';
        }
    } catch (error) {
        console.error('加载推荐美食失败:', error);
        container.innerHTML = '<div class="recommend-empty">加载失败</div>';
    }
}

function renderRecommendFoods(foods) {
    const container = document.getElementById('recommendFoodList');
    if (!container) return;

    if (!foods || foods.length === 0) {
        container.innerHTML = '<div class="recommend-empty">暂无推荐美食</div>';
        return;
    }

    container.innerHTML = foods.map((food, i) => {
        const name = escapeHtml(food.name);
        const description = food.description || '暂无描述';
        const truncatedDesc = description.length > 40 ? description.substring(0, 40) + '...' : description;
        const taste = food.taste ? food.taste.replace(/\\/g, ',') : '';

        return `
            <div class="recommend-food-detail-card" onclick="FoodCardComponent.showDetail(${food.id})" style="animation-delay:${i * 70}ms">
                <div class="recommend-food-detail-image-wrapper">
                    ${food.imageUrl
                        ? `<img src="${food.imageUrl}" alt="${name}" loading="lazy" />`
                        : '<div class="recommend-food-detail-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M6 12a6 6 0 0 1 12 0"/><path d="M9 7v1.5"/><path d="M12 6v1.5"/><path d="M15 7v1.5"/></svg></div>'}
                    <div class="recommend-food-detail-img-overlay">
                        <div class="recommend-food-detail-name" title="${name}">${name}</div>
                    </div>
                </div>
                <div class="recommend-food-detail-content">
                    <div class="recommend-food-detail-desc">${escapeHtml(truncatedDesc)}</div>
                    <div class="recommend-food-detail-footer">
                        <span class="recommend-food-detail-author">${escapeHtml(food.userName || 'FlavorNav')}</span>
                        <span class="recommend-food-detail-taste">${taste}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('DOMContentLoaded', initMap);

function goToSearch() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim() : '';
    if (keyword) {
        window.location.href = `/pages/auth/search.html?keyword=${encodeURIComponent(keyword)}`;
    } else {
        window.location.href = '/pages/auth/search.html';
    }
}

function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        goToSearch();
    }
}

function togglePanel(panel) {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const mobileTabs = document.getElementById('mobileTabs');
    const tabBtns = document.querySelectorAll('.mobile-tab-btn');

    if (panel === 'left') {
        leftPanel.classList.toggle('show');
        rightPanel.classList.remove('show');
        tabBtns[0].classList.toggle('active', leftPanel.classList.contains('show'));
        tabBtns[1].classList.remove('active');
    } else if (panel === 'right') {
        rightPanel.classList.toggle('show');
        leftPanel.classList.remove('show');
        tabBtns[1].classList.toggle('active', rightPanel.classList.contains('show'));
        tabBtns[0].classList.remove('active');
    }
}

function closePanel() {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const tabBtns = document.querySelectorAll('.mobile-tab-btn');

    leftPanel.classList.remove('show');
    rightPanel.classList.remove('show');
    tabBtns.forEach(btn => btn.classList.remove('active'));
}

function goToAIChat() {
    window.location.href = '/pages/auth/ai-chat.html';
}

// AI悬浮球拖动功能
function initAIFloatBall() {
    const ball = document.getElementById('aiFloatBall');
    if (!ball) return;

    let isDragging = false;
    let startX, startY, initialX, initialY;
    let hasMoved = false;

    const onStart = (e) => {
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        const rect = ball.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        ball.style.transition = 'none';
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
        }

        let newX = initialX + dx;
        let newY = initialY + dy;

        const maxX = window.innerWidth - ball.offsetWidth;
        const maxY = window.innerHeight - ball.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        ball.style.left = newX + 'px';
        ball.style.top = newY + 'px';
        ball.style.right = 'auto';
        ball.style.bottom = 'auto';
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        ball.style.transition = 'transform 0.2s, box-shadow 0.2s, left 0.3s, top 0.3s';

        if (!hasMoved) {
            return;
        }

        const rect = ball.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const screenCenter = window.innerWidth / 2;

        let targetX;
        if (centerX < screenCenter) {
            targetX = 20;
        } else {
            targetX = window.innerWidth - ball.offsetWidth - 20;
        }

        const targetY = Math.max(80, Math.min(rect.top, window.innerHeight - ball.offsetHeight - 80));

        ball.style.left = targetX + 'px';
        ball.style.top = targetY + 'px';
    };

    ball.addEventListener('touchstart', onStart, { passive: false });
    ball.addEventListener('touchmove', onMove, { passive: false });
    ball.addEventListener('touchend', onEnd);

    ball.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
}

// 页面加载时初始化悬浮球
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIFloatBall);
} else {
    initAIFloatBall();
}
