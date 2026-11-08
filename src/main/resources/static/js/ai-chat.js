const API_BASE = '/api';
let currentLocation = '未知地区';
let isLoading = false;
let currentUserAvatar = null;
let isLoggedIn = false;
let chatHistory = [];

async function init() {
    await checkLoginStatus();
    await checkUserAvatar();
    await getLocation();
    setupLocationEdit();
}

async function checkLoginStatus() {
    try {
        const response = await fetch(API_BASE + '/user/check', { credentials: 'include' });
        const result = await response.json();
        if (result.code === 200 && result.data) {
            isLoggedIn = true;
            console.log('AI聊天 - 用户已登录');
        } else {
            isLoggedIn = false;
            disableChatForGuest();
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        isLoggedIn = false;
        disableChatForGuest();
    }
}

function disableChatForGuest() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    const chatContainer = document.getElementById('chatContainer');

    if (input) input.disabled = true;
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
    }

    if (chatContainer) {
        chatContainer.innerHTML = `
            <div class="guest-login-prompt" style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;"></div>
                <h3 style="color: #333; margin-bottom: 12px;">需要登录后才能使用 AI 助手</h3>
                <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">登录后即可咨询美食推荐、菜谱制作、饮食文化等问题</p>
                <a href="/pages/auth/login.html" style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%); color: white; padding: 10px 32px; border-radius: 20px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); transition: all 0.3s;">前往登录</a>
            </div>
        `;
    }

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
}

async function checkUserAvatar() {
    try {
        const response = await fetch(API_BASE + '/user/check', { credentials: 'include' });
        const result = await response.json();
        if (result.code === 200 && result.data) {
            const userData = result.data;
            currentUserAvatar = userData.avatar || null;
            console.log('用户头像获取成功:', currentUserAvatar);
        } else {
            console.log('用户未登录，使用默认头像');
        }
    } catch (error) {
        console.error('获取用户头像失败:', error);
        currentUserAvatar = null;
    }
}

async function getLocation() {
    document.getElementById('locationText').textContent = ' 正在获取位置...';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                console.log('获取到坐标:', latitude, longitude);

                try {
                    const response = await fetch(API_BASE + '/ai/location/coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });

                    const result = await response.json();

                    if (result.code === 200 && result.data && result.data !== '未知地区') {
                        currentLocation = result.data;
                        updateLocationDisplay(currentLocation, 'GPS定位');
                    } else {
                        await fallbackToIPLocation();
                    }
                } catch (error) {
                    console.warn('坐标定位失败，降级使用 IP 定位:', error);
                    await fallbackToIPLocation();
                }
            },
            async (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    console.warn('用户拒绝了定位授权，改用 IP 定位（精度较粗）');
                } else if (error.code === error.TIMEOUT) {
                    console.warn('定位超时，改用 IP 定位');
                } else {
                    console.warn('无法获取 GPS 位置，使用 IP 定位:', error.message);
                }
                await fallbackToIPLocation();
            },
            // enableHighAccuracy=false：优先用 WiFi/基站快速定位，速度快、不易超时，精度足够
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
        );
    } else {
        console.warn('浏览器不支持地理定位，使用 IP 定位');
        await fallbackToIPLocation();
    }
}

async function fallbackToIPLocation() {
    try {
        const response = await fetch(API_BASE + '/ai/location');
        const result = await response.json();

        if (result.code === 200 && result.data && result.data !== '未知地区') {
            currentLocation = result.data;
            updateLocationDisplay(currentLocation, 'IP定位·约');
        } else {
            updateLocationDisplay('未设置位置', null);
        }
    } catch (error) {
        console.error('获取位置失败:', error);
        updateLocationDisplay('未设置位置', null);
    }
}

function updateLocationDisplay(location, method) {
    const locationText = document.getElementById('locationText');
    const locationInfo = document.getElementById('locationInfo');

    if (location && location !== '未知地区') {
        locationText.textContent = ' 当前位置：' + location;
        if (method) {
            locationText.textContent += ' (' + method + ')';
        }
        locationInfo.style.borderColor = 'rgba(46, 139, 87, 0.6)';
        locationInfo.style.background = 'rgba(46, 139, 87, 0.25)';
    } else {
        locationText.textContent = ' 未设置位置';
        locationInfo.style.borderColor = 'rgba(255, 152, 0, 0.6)';
        locationInfo.style.background = 'rgba(255, 152, 0, 0.2)';
    }
}

function setupLocationEdit() {
    const locationInfo = document.getElementById('locationInfo');
    locationInfo.style.cursor = 'pointer';
    locationInfo.title = '点击修改位置';

    locationInfo.addEventListener('click', showLocationEditor);
}

function showLocationEditor() {
    const existing = document.getElementById('locationEditor');
    if (existing) existing.remove();

    const editor = document.createElement('div');
    editor.id = 'locationEditor';
    editor.innerHTML = `
        <div class="location-editor-overlay" onclick="closeLocationEditor(event)">
            <div class="location-editor-box" onclick="event.stopPropagation()">
                <div class="editor-header">
                    <h3> 设置您的位置</h3>
                    <button class="close-btn" onclick="closeLocationEditor()">&times;</button>
                </div>
                <div class="editor-body">
                    <div class="input-group">
                        <label>当前显示位置：</label>
                        <div class="current-location">${currentLocation}</div>
                    </div>
                    <div class="input-group">
                        <label>修改为：</label>
                        <input type="text" id="locationInput" placeholder="例如：广东 清远" value="${currentLocation === '未知地区' ? '' : currentLocation}">
                    </div>
                    <div class="quick-locations">
                        <button onclick="setQuickLocation('广东 清远')">清远</button>
                        <button onclick="setQuickLocation('广东 广州')">广州</button>
                        <button onclick="setQuickLocation('广东 深圳')">深圳</button>
                        <button onclick="setQuickLocation('广东 佛山')">佛山</button>
                        <button onclick="setQuickLocation('广东 东莞')">东莞</button>
                    </div>
                </div>
                <div class="editor-footer">
                    <button class="btn-cancel" onclick="closeLocationEditor()">取消</button>
                    <button class="btn-confirm" onclick="confirmLocation()">确认</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(editor);

    setTimeout(() => {
        const input = document.getElementById('locationInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

function closeLocationEditor(event) {
    if (event && event.target !== event.currentTarget) return;
    const editor = document.getElementById('locationEditor');
    if (editor) editor.remove();
}

function setQuickLocation(location) {
    const input = document.getElementById('locationInput');
    if (input) {
        input.value = location;
        input.focus();
    }
}

async function confirmLocation() {
    const input = document.getElementById('locationInput');
    if (!input) return;

    const location = input.value.trim();
    if (!location) {
        input.style.borderColor = '#f44336';
        input.placeholder = '请输入位置信息';
        return;
    }

    try {
        const response = await fetch(API_BASE + '/ai/location/manual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: location })
        });

        const result = await response.json();

        if (result.code === 200) {
            currentLocation = location;
            updateLocationDisplay(currentLocation, '手动设置');
            closeLocationEditor();

            addMessage('ai', ` 位置已更新为：${currentLocation}。现在可以为您推荐当地美食了！`);
        }
    } catch (error) {
        console.error('设置位置失败:', error);
        alert('设置失败，请重试');
    }
}

function quickRecommend() {
    if (currentLocation === '未知地区' || !currentLocation) {
        addMessage('user', '请为我推荐当地美食');
        addMessage('ai', ' 请先点击顶部位置信息设置您当前的位置，我将为您推荐当地特色美食！');
        showLocationEditor();
        return;
    }
    addMessage('user', '推荐当地美食');
    sendToAI('请为我推荐' + currentLocation + '的特色美食');
}

function quickAsk(question) {
    addMessage('user', question);
    sendToAI(question);
}

async function sendMessage() {
    if (!isLoggedIn) {
        alert('请先登录后再使用 AI 助手');
        window.location.href = '/pages/auth/login.html';
        return;
    }

    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || isLoading) return;

    if (message.length > 500) {
        alert('输入内容过长，请控制在 500 字以内');
        return;
    }

    addMessage('user', message);
    input.value = '';

    await sendToAI(message);
}

async function sendToAI(message) {
    if (!isLoggedIn) {
        alert('请先登录后再使用 AI 助手');
        window.location.href = '/pages/auth/login.html';
        return;
    }

    isLoading = true;
    const loadingMsg = addMessage('ai', '思考中...', true);

    chatHistory.push({ role: 'user', content: message });

    try {
        const response = await fetch(API_BASE + '/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                location: currentLocation,
                history: chatHistory.slice(-6)
            })
        });

        const result = await response.json();

        if (loadingMsg.parentNode) {
            loadingMsg.parentNode.removeChild(loadingMsg);
        }

        if (result.code === 200) {
            addMessage('ai', result.data);
            chatHistory.push({ role: 'assistant', content: result.data });
        } else {
            addMessage('ai', result.message || '抱歉，AI 服务暂时不可用，请稍后重试。');
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        if (loadingMsg.parentNode) {
            loadingMsg.parentNode.removeChild(loadingMsg);
        }
        addMessage('ai', '网络错误，请检查连接后重试。');
    } finally {
        isLoading = false;
    }
}

function renderMarkdown(text) {
    if (!text) return '';

    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');

    return html;
}

function getUserAvatarUrl() {
    if (currentUserAvatar) {
        return currentUserAvatar;
    }
    return generateDefaultAvatar();
}

function generateDefaultAvatar() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect fill="#666" width="100" height="100" rx="50"/>
            <text x="50" y="60" font-size="40" fill="white" text-anchor="middle">👤</text>
        </svg>
    `;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function addMessage(type, content, isLoading = false) {
    const chatContainer = document.getElementById('chatContainer');

    const welcomeMsg = chatContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${type === 'user' ? 'user-message' : 'ai-message'}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';

    if (type === 'ai') {
        avatarDiv.innerHTML = '<img src="/images/ai-assistant.png" alt="AI助手" class="avatar-image">';
    } else {
        avatarDiv.innerHTML = `<img src="${getUserAvatarUrl()}" alt="用户" class="avatar-image">`;
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    if (isLoading) {
        bubbleDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    } else if (type === 'ai') {
        bubbleDiv.innerHTML = renderMarkdown(content);
    } else {
        bubbleDiv.textContent = content;
    }

    messageRow.appendChild(avatarDiv);
    messageRow.appendChild(bubbleDiv);
    chatContainer.appendChild(messageRow);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageRow;
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', async () => {
    await init();

    // Check for incoming food question from URL
    const urlParams = new URLSearchParams(window.location.search);
    const foodQuestion = urlParams.get('q');

    if (foodQuestion) {
        // Clear URL params to prevent re-asking on refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        // Wait a moment for UI to be ready, then auto-ask
        setTimeout(() => {
            sendToAI(foodQuestion);
        }, 500);
    }
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
