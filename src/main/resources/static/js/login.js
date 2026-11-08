const API_BASE = '/api';

// 显示注册表单
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';

    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');

    clearMessages();
}

// 显示登录表单
function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';

    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');

    clearMessages();
}

// 清除错误信息
function clearMessages() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    clearMessages();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(API_BASE + '/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.code === 200) {
            alert('登录成功！');
            window.location.href = '/pages/auth/main/map.html';
        } else {
            showError('loginError', result.message || '登录失败');
        }
    } catch (error) {
        showError('loginError', '网络错误，请稍后重试');
    }
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault();
    clearMessages();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (password.length < 6) {
        showError('registerError', '密码长度至少为6位');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.code === 200) {
            showSuccess('registerSuccess', '注册成功！即将跳转到登录页面...');
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            showError('registerError', result.message || '注册失败');
        }
    } catch (error) {
        showError('registerError', '网络错误，请稍后重试');
    }
}

// 显示错误信息
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// 显示成功信息
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// 检查是否已登录
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
});
