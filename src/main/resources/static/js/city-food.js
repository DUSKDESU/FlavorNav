
const API_BASE = '/api';
let currentCityId = null;
let currentCityName = null;
let currentUserId = null;
let isLoggedIn = false;

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', async () => {
    // 从 URL 参数获取城市信息
    const params = new URLSearchParams(window.location.search);
    currentCityId = params.get('regionId');
    currentCityName = params.get('cityName');

    if (!currentCityId) {
        alert('缺少城市信息');
        window.location.href = '/pages/auth/main/map.html';
        return;
    }

    // 设置页面标题
    document.getElementById('cityTitle').textContent = currentCityName + '美食';

    // 可选登录检查 - 不强制跳转
    await checkLoginOptional();

    // 加载美食列表
    await loadFoodList();
});

// 可选登录检查 - 不强制登录，仅获取用户信息
async function checkLoginOptional() {
    try {
        const response = await fetch(API_BASE + '/user/check', {
            credentials: 'include'
        });
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
        } else {
            isLoggedIn = false;
            currentUserId = null;
            currentUserRole = 0;
            FoodCardComponent.init({
                apiBaseUrl: API_BASE,
                userId: null,
                userRole: 0
            });
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        isLoggedIn = false;
        currentUserId = null;
        currentUserRole = 0;
        FoodCardComponent.init({
            apiBaseUrl: API_BASE,
            userId: null,
            userRole: 0
        });
    }
}

// 加载美食列表
async function loadFoodList() {
    try {
        const response = await fetch(API_BASE + '/foods/region/' + currentCityId);
        const result = await response.json();

        const foodList = document.getElementById('foodList');

        if (result.code === 200 && result.data && result.data.length > 0) {
            foodList.innerHTML = FoodCardComponent.renderFoodGridList(result.data);
        } else {
            foodList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">暂无美食帖子，快来添加吧！</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载美食列表失败:', error);
        document.getElementById('foodList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">加载失败，请稍后重试</div>
            </div>
        `;
    }
}

// 显示美食详情
async function showFoodDetail(foodId) {
    // 使用food-card组件显示详情
    await FoodCardComponent.showDetail(foodId);
}

// 打开添加美食弹窗 - 需要登录验证
function openAddModal() {
    if (!isLoggedIn) {
        alert('请先登录后再添加美食');
        window.location.href = '/pages/auth/login.html';
        return;
    }
    document.getElementById('regionName').value = currentCityName;
    document.getElementById('addModal').style.display = 'flex';
}

// 关闭添加弹窗
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    clearForm();
}

// 点击添加弹窗背景关闭
function handleModalClick(event) {
    if (event.target === document.getElementById('addModal')) {
        closeAddModal();
    }
}

// 清空表单
function clearForm() {
    document.getElementById('foodName').value = '';
    document.getElementById('foodDescription').value = '';
    document.getElementById('foodIngredients').value = '';
    document.getElementById('foodCookingMethod').value = '';
    document.getElementById('foodHistory').value = '';
    document.getElementById('customType').value = '';
    document.getElementById('customTaste').value = '';

    document.querySelectorAll('input[name="taste"]:checked').forEach(cb => {
        cb.checked = false;
    });

    document.querySelectorAll('input[name="foodType"]:checked').forEach(rb => {
        rb.checked = false;
    });

    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUploadArea').classList.remove('has-image');
    document.getElementById('foodImage').value = '';
}

// 预览图片
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('imageUploadArea');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadArea.classList.add('has-image');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// 提交美食
async function submitFood() {
    const foodName = document.getElementById('foodName').value.trim();
    const description = document.getElementById('foodDescription').value.trim();
    const ingredients = document.getElementById('foodIngredients').value.trim();
    const cookingMethod = document.getElementById('foodCookingMethod').value.trim();
    const history = document.getElementById('foodHistory').value.trim();

    const selectedType = document.querySelector('input[name="foodType"]:checked');
    const customType = document.getElementById('customType').value.trim();
    let type = customType || (selectedType ? selectedType.value : '');

    const selectedTastes = [];
    document.querySelectorAll('input[name="taste"]:checked').forEach(cb => {
        selectedTastes.push(cb.value);
    });

    const customTaste = document.getElementById('customTaste').value.trim();
    if (customTaste) {
        customTaste.split(/[,，、\s]+/).forEach(t => {
            const trimmed = t.trim();
            if (trimmed && !selectedTastes.includes(trimmed)) {
                selectedTastes.push(trimmed);
            }
        });
    }

    const taste = selectedTastes.join('\\');

    const imageFile = document.getElementById('foodImage').files[0];

    if (!foodName) {
        alert('请输入美食名称');
        return;
    }

    if (!taste) {
        alert('请至少选择或自定义一种味道');
        return;
    }

    if (!type) {
        alert('请选择或自定义一个美食分类');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('name', foodName);
        formData.append('description', description || '');
        formData.append('regionId', currentCityId);
        formData.append('regionName', currentCityName);
        formData.append('ingredients', ingredients || '');
        formData.append('cookingMethod', cookingMethod || '');
        formData.append('history', history || '');
        formData.append('taste', taste || '');
        formData.append('type', type);

        if (imageFile) {
            formData.append('file', imageFile);
        }

        const response = await fetch(API_BASE + '/foods', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (result.code === 200) {
            alert('美食添加成功！待审核通过后显示。');
            closeAddModal();
            await loadFoodList();
        } else {
            alert('添加失败：' + result.message);
        }
    } catch (error) {
        console.error('提交美食失败:', error);
        alert('提交失败，请稍后重试');
    }
}

// 返回地图页
function goBack() {
    window.location.href = '/pages/auth/main/map.html';
}

// 关闭美食详情弹窗
function closeDetailModal() {
    FoodCardComponent.closeDetail();
}

// 点击详情弹窗背景关闭
function handleDetailModalClick(event) {
    if (event.target === document.getElementById('detailModal')) {
        closeDetailModal();
    }
}
