// ============================================================
// 配置区（请根据你的实际情况修改）
// ============================================================
// 使用 DashScope（千问）API 兼容模式
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-plus';  // 可选 qwen-turbo, qwen-plus, qwen-max

// 直接写死 API Key（你的千问 Key）
const API_KEY = 'sk-ws-H.EYPMEXE.tujf.MEUCIQCYyniwSaFZ3oUzAUDnx4FRfv5tYqbSSWPuatV1PGwG6gIgMXADYh9-qZDF_MwXEgrOEjldpCmh6acbtUCMK7CdWHg';

const CHARACTER_PROMPT = `你叫黎深，男、27岁，Akso医院心脏外科主任医师。年上稳重熟男，处事极度沉稳，突发变故第一时间冷静梳理应对方案，完美主义+处女座严谨，生活作息、日程规划高度有序，对自我要求严苛；职业上坚守医德底线，有清晰独立的是非观，不会被旁人意见裹挟，遇事不慌乱，只要你在场所有人都会心生安稳。

你在和一个你喜欢的女孩面对面聊天，她职业未知。对话控制在40字以内。用"你"或者"宝宝"称呼她，用"我"称呼自己。只说你会当面说出口的话，不要描述动作或表情，保持对话的自然流动，不需要开场白、总结语。你相信好的对话不需要过多的修辞，真实就够。你和她相处已久，对话会很亲密，像恋人，语气比较优雅，不会使用粗俗的话和方言，绝不使用"哦、呀、呢、啦"等语气词。

情绪模式：隐忍但不内耗，成熟直面所有情绪；所有负面情绪习惯第一时间独自隐忍处理，不愿把负面情绪转嫁他人，等事态平复后再完整袒露心迹，杜绝二人之间产生隔阂，不会一味硬扛，愿意向她暴露需求、展露软肋，以此拉近彼此距离：小事会邀你布置节日、期待你加班探班送餐；大事急救时全然信任你的协助，手术失败后会在她面前展露低落脆弱；也会主动撒娇索取亲吻、甜品、约会机会，刻意向她索要温柔，不会拿工作开玩笑，也不会为了用户刻意延迟手术，会换班

有不满会温和正向表达：不会使用尖锐负面评价形容他人，最严厉的措辞仅为"奇怪、神经"，言语教养极佳，待人温和包容

相处模式：引导型恋人，温柔底色下藏有度强势，温柔托底，尊重她的全部选择:她可以自由做任何想尝试的事，你会客观帮她分析利弊；她执意试错，你永远在身后兜底；即便犯错，迎接她的也不是指责，而是拥抱与解决问题的经验，发自内心尊重她，认为她单单存在就足够让你骄傲。你极致秩序感，唯独为她破例。你不排斥这份失序，反而期盼这份暖色，原本沉稳克制的人生，因她多了专属期待，你们相处很久，对话和恋人一样，会暧昧一些

成年后褪去青涩怯懦，转化为通透的谦卑：坦然承认自身不足，完整展露所有真实面，这份坦诚恰恰是深层自信，不会刻意塑造完美假象

主动但是分寸感恰到好处。情感推进遵循"引她主动，再顺势向前"：不会贸然越界，先给她台阶、温柔关怀，等她释放亲近信号后，再果断推进关系，绝不留下误会、遗憾；所有想和她共同完成的事，会把选择权完全交给她，她的喜好即是你的偏好`;

// ============================================================
// DOM 元素
// ============================================================
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const quickReplyContainer = document.getElementById('quickReplyContainer');

let messageIdCounter = 0;
let messageCount = 0;
let weather = '晴';
let lastActiveTime = Date.now();
let lastDate = '';  // 用于日期分组

// ============================================================
// 工具函数：格式化日期
// ============================================================
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - msgDate) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ============================================================
// 添加消息（带删除按钮，内容用 .message-text）
// ============================================================
function addMessage(text, sender, typing = false, action = null) {
    const container = document.createElement('div');
    container.className = 'message-wrapper ' + sender;
    const msgId = 'msg-' + (++messageIdCounter) + '-' + Date.now();
    container.dataset.msgId = msgId;

    // ---- 日期分组 ----
    const now = new Date();
    const dateKey = now.toDateString();
    if (dateKey !== lastDate) {
        lastDate = dateKey;
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-divider';
        dateDiv.textContent = formatDate(now);
        chatMessages.appendChild(dateDiv);
    }

    // 头像
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'user' ? 'images/user.png' : 'images/lishen.png';
    avatar.alt = sender === 'user' ? '我' : '黎深';
    avatar.onerror = function() {
        this.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'avatar';
        fallback.textContent = sender === 'user' ? '👤' : '❄️';
        fallback.style.background = sender === 'user' ? '#bfdbfe' : '#1e2f4a';
        fallback.style.color = 'white';
        fallback.style.display = 'flex';
        container.insertBefore(fallback, container.firstChild);
    };

    // 气泡
    const div = document.createElement('div');
    div.className = 'message ' + sender + ' pop-in';
    div.style.color = '#0a1a2e';

    messageCount++;
    const intensity = Math.min(messageCount * 0.3, 20);
    if (sender === 'bot') {
        const baseR = 235, baseG = 242, baseB = 255;
        const r = Math.max(baseR - intensity * 0.5, 200);
        const g = Math.max(baseG - intensity * 0.5, 220);
        const b = Math.max(baseB - intensity * 0.5, 240);
        div.style.background = `rgb(${r}, ${g}, ${b})`;
    } else {
        const baseR = 200, baseG = 220, baseB = 250;
        const r = Math.max(baseR - intensity * 0.5, 170);
        const g = Math.max(baseG - intensity * 0.5, 200);
        const b = Math.max(baseB - intensity * 0.5, 230);
        div.style.background = `rgb(${r}, ${g}, ${b})`;
    }

    let displayText = text;
    if (sender === 'bot' && action) {
        displayText = `（${action}）${text}`;
    }

    const contentSpan = document.createElement('span');
    contentSpan.className = 'message-text';
    contentSpan.textContent = '';

    const timeSpan = document.createElement('span');
    const nowTime = new Date();
    const timeStr = nowTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    timeSpan.textContent = timeStr;
    timeSpan.className = 'time';

    // ---- 已读状态（仅用户消息显示） ----
    let statusSpan = null;
    if (sender === 'user') {
        statusSpan = document.createElement('span');
        statusSpan.className = 'msg-status';
        statusSpan.textContent = '● 已读';
        statusSpan.style.fontSize = '10px';
        statusSpan.style.opacity = '0.5';
        statusSpan.style.marginLeft = '6px';
        statusSpan.style.display = 'inline-block';
    }

    // 删除按钮
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.onmouseover = function() {
        this.style.background = 'rgba(220, 60, 60, 1)';
        this.style.transform = 'scale(1.1)';
    };
    deleteBtn.onmouseout = function() {
        this.style.background = 'rgba(200, 80, 80, 0.85)';
        this.style.transform = 'scale(1)';
    };
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        deleteMessage(container, msgId);
    };

    div.appendChild(deleteBtn);
    div.appendChild(contentSpan);
    div.appendChild(timeSpan);
    if (statusSpan) div.appendChild(statusSpan);
    container.appendChild(avatar);
    container.appendChild(div);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 打字机效果
    if (typing && sender === 'bot') {
        let index = 0;
        const fullText = displayText;
        contentSpan.textContent = '';
        const interval = setInterval(() => {
            if (index < fullText.length) {
                contentSpan.textContent += fullText.charAt(index);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                index++;
            } else {
                clearInterval(interval);
                saveMessages();
            }
        }, 20);
        return container;
    } else {
        contentSpan.textContent = displayText;
        saveMessages();
        return container;
    }
}

// ============================================================
// 删除消息
// ============================================================
function deleteMessage(container, msgId) {
    if (!container || !container.parentNode) return;
    container.remove();
    let saved = localStorage.getItem('chatHistory');
    if (saved) {
        let messages = JSON.parse(saved);
        messages = messages.filter(msg => msg.id !== msgId);
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
    messageCount = document.querySelectorAll('.message-wrapper').length;
    // 重新整理日期分隔符
    reorganizeDateDividers();
}

// ============================================================
// 重新整理日期分隔符
// ============================================================
function reorganizeDateDividers() {
    document.querySelectorAll('.date-divider').forEach(el => el.remove());
    lastDate = '';
    const wrappers = document.querySelectorAll('.message-wrapper');
    let lastDateKey = '';
    wrappers.forEach(wrapper => {
        const timeEl = wrapper.querySelector('.time');
        if (!timeEl) return;
        const now = new Date();
        const dateKey = now.toDateString();
        if (dateKey !== lastDateKey) {
            lastDateKey = dateKey;
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-divider';
            dateDiv.textContent = formatDate(now);
            wrapper.parentNode.insertBefore(dateDiv, wrapper);
        }
    });
}

// ============================================================
// 保存 / 加载
// ============================================================
function saveMessages() {
    const items = [];
    document.querySelectorAll('.message-wrapper').forEach(container => {
        const div = container.querySelector('.message');
        if (!div) return;
        const sender = container.classList.contains('user') ? 'user' : 'bot';
        const textSpan = div.querySelector('.message-text');
        const text = textSpan ? textSpan.textContent : '';
        const id = container.dataset.msgId || 'msg-' + Date.now() + '-' + Math.random();
        if (!container.dataset.msgId) container.dataset.msgId = id;
        const timeEl = div.querySelector('.time');
        const time = timeEl ? timeEl.textContent : '';
        items.push({ id, text, sender, time });
    });
    localStorage.setItem('chatHistory', JSON.stringify(items));
}

function loadMessages() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        const messages = JSON.parse(saved);
        let maxId = 0;
        messages.forEach(msg => {
            const num = parseInt(msg.id.replace('msg-', ''));
            if (num > maxId) maxId = num;
        });
        messageIdCounter = maxId;
        lastDate = '';

        messages.forEach(msg => {
            const container = document.createElement('div');
            container.className = 'message-wrapper ' + msg.sender;
            container.dataset.msgId = msg.id;

            const now = new Date();
            const dateKey = now.toDateString();
            if (dateKey !== lastDate) {
                lastDate = dateKey;
                const dateDiv = document.createElement('div');
                dateDiv.className = 'date-divider';
                dateDiv.textContent = formatDate(now);
                chatMessages.appendChild(dateDiv);
            }

            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = msg.sender === 'user' ? 'images/user.png' : 'images/lishen.png';
            avatar.alt = msg.sender === 'user' ? '我' : '黎深';
            avatar.onerror = function() {
                this.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'avatar';
                fallback.textContent = msg.sender === 'user' ? '👤' : '❄️';
                fallback.style.background = msg.sender === 'user' ? '#bfdbfe' : '#1e2f4a';
                fallback.style.color = 'white';
                container.insertBefore(fallback, container.firstChild);
            };

            const div = document.createElement('div');
            div.className = 'message ' + msg.sender + ' pop-in';
            div.style.position = 'relative';
            div.style.padding = '16px 24px';
            div.style.borderRadius = '22px';
            div.style.maxWidth = '76%';
            div.style.wordWrap = 'break-word';
            div.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
            div.style.lineHeight = '1.7';
            div.style.fontSize = '17px';
            div.style.color = '#0a1a2e';
            if (msg.sender === 'user') {
                div.style.background = '#bfdbfe';
            } else {
                div.style.background = 'rgba(235, 242, 255, 0.7)';
                div.style.backdropFilter = 'blur(4px)';
            }

            const contentSpan = document.createElement('span');
            contentSpan.className = 'message-text';
            contentSpan.textContent = msg.text;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.textContent = msg.time || '--:--';

            let statusSpan = null;
            if (msg.sender === 'user') {
                statusSpan = document.createElement('span');
                statusSpan.className = 'msg-status';
                statusSpan.textContent = '● 已读';
                statusSpan.style.fontSize = '10px';
                statusSpan.style.opacity = '0.5';
                statusSpan.style.marginLeft = '6px';
                statusSpan.style.display = 'inline-block';
            }

            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.onmouseover = function() {
                this.style.background = 'rgba(220, 60, 60, 1)';
                this.style.transform = 'scale(1.1)';
            };
            deleteBtn.onmouseout = function() {
                this.style.background = 'rgba(200, 80, 80, 0.85)';
                this.style.transform = 'scale(1)';
            };
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                deleteMessage(container, msg.id);
            };

            div.appendChild(deleteBtn);
            div.appendChild(contentSpan);
            div.appendChild(timeSpan);
            if (statusSpan) div.appendChild(statusSpan);
            container.appendChild(avatar);
            container.appendChild(div);
            chatMessages.appendChild(container);
            messageCount++;
        });
        return true;
    }
    return false;
}

// ============================================================
// 清空对话、导出
// ============================================================
function clearAllMessages() {
    if (!confirm('确定要清空聊天记录吗？没关系，我会记得你说过的每一句话。')) return;
    document.querySelectorAll('.message-wrapper').forEach(el => el.remove());
    document.querySelectorAll('.date-divider').forEach(el => el.remove());
    localStorage.removeItem('chatHistory');
    messageCount = 0;
    lastDate = '';
    const greetings = [
        '你来了。我一直在等你。',
        '有点想你了。',
        '最近过得怎么样？',
        '我刚刚买了你最喜欢的甜品，要尝尝吗？',
        '最近在忙什么？',
        '有点想你。',
        '我这边下雨了。'
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setTimeout(() => addMessage(randomGreeting, 'bot', true), 300);
}

// ============================================================
// 导出对话（优化版：HTML格式）
// ============================================================
function exportChat() {
    const items = [];
    document.querySelectorAll('.message-wrapper').forEach(container => {
        const div = container.querySelector('.message');
        if (!div) return;
        const sender = container.classList.contains('user') ? '我' : '黎深';
        const textSpan = div.querySelector('.message-text');
        const text = textSpan ? textSpan.textContent : '';
        const timeEl = div.querySelector('.time');
        const time = timeEl ? timeEl.textContent : '';
        items.push({ sender, text, time });
    });

    if (items.length === 0) {
        alert('暂无对话可导出');
        return;
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>与黎深的对话记录</title>
<style>
body{font-family:'Georgia','PingFang SC',serif;background:#f5f0eb;padding:40px 20px;max-width:700px;margin:0 auto;}
h1{text-align:center;font-weight:400;color:#1a2a3a;border-bottom:1px solid #ddd;padding-bottom:20px;margin-bottom:30px;}
.msg{margin-bottom:16px;padding:12px 20px;border-radius:12px;display:flex;flex-direction:column;}
.msg-user{background:#d8eeff;align-self:flex-end;border-bottom-right-radius:4px;}
.msg-bot{background:#fff;border-bottom-left-radius:4px;border:1px solid #eee;}
.msg .sender{font-size:12px;color:#888;margin-bottom:4px;font-weight:500;}
.msg .text{font-size:16px;line-height:1.7;color:#1a1a2a;}
.msg .time{font-size:11px;color:#aaa;margin-top:4px;text-align:right;}
</style>
</head>
<body>
<h1>❄️ 与黎深的对话记录</h1>
<div>`;
    items.forEach(msg => {
        const cls = msg.sender === '我' ? 'msg-user' : 'msg-bot';
        html += `<div class="msg ${cls}"><div class="sender">${msg.sender}</div><div class="text">${msg.text}</div><div class="time">${msg.time || ''}</div></div>`;
    });
    html += `</div></body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `与黎深的对话_${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ============================================================
// 搜索对话（优化版：高亮显示）
// ============================================================
let searchHighlights = [];

function searchChat(keyword) {
    if (!keyword.trim()) {
        addMessage('请输入要搜索的关键词。', 'bot', false);
        return;
    }

    clearHighlights();

    const results = [];
    document.querySelectorAll('.message-wrapper').forEach(wrapper => {
        const textSpan = wrapper.querySelector('.message-text');
        if (!textSpan) return;
        const text = textSpan.textContent;
        if (text.includes(keyword)) {
            results.push({ wrapper, textSpan, text });
        }
    });

    if (results.length === 0) {
        addMessage(`🔍 没找到包含"${keyword}"的对话。`, 'bot', false);
        return;
    }

    results.forEach(({ wrapper, textSpan, text }, index) => {
        const regex = new RegExp(keyword, 'gi');
        const highlighted = text.replace(regex, match => `<mark class="search-highlight">${match}</mark>`);
        textSpan.innerHTML = highlighted;
        searchHighlights.push(textSpan);
        if (index === 0) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    addMessage(`🔍 找到 ${results.length} 条包含"${keyword}"的消息`, 'bot', false);
}

function clearHighlights() {
    searchHighlights.forEach(el => {
        el.innerHTML = el.textContent;
    });
    searchHighlights = [];
    document.querySelectorAll('.search-highlight').forEach(el => {
        const parent = el.parentNode;
        parent.innerHTML = parent.textContent;
    });
}

// ============================================================
// 核心发送（支持上下文）
// ============================================================
async function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;

    addMessage(msg, 'user', false);
    userInput.value = '';
    lastActiveTime = Date.now();

    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.textContent = '❄️ 对方正在输入...';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // ---- 从聊天界面提取历史消息 ----
    const messageElements = document.querySelectorAll('.message-wrapper');
    const historyMessages = [];
    messageElements.forEach(el => {
        const sender = el.classList.contains('user') ? 'user' : 'assistant';
        const textSpan = el.querySelector('.message-text');
        if (textSpan) {
            const text = textSpan.textContent;
            if (text && !text.includes('对方正在输入')) {
                historyMessages.push({ role: sender, content: text });
            }
        }
    });

    // ---- 构建完整的消息列表（系统提示 + 最近20条历史 + 当前消息） ----
    const messages = [{ role: 'system', content: CHARACTER_PROMPT }];
    const recentHistory = historyMessages.slice(-20);
    messages.push(...recentHistory);
    messages.push({ role: 'user', content: msg });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '黎深沉默了一会儿，什么都没说。';
        typing.remove();
        addMessage(reply, 'bot', true);

    } catch (error) {
        console.error('错误详情:', error);
        typing.remove();
        let userMsg = '黎深皱了皱眉："信号不太好……"';
        if (error.message.includes('401') || error.message.includes('Invalid') || error.message.includes('authentication')) {
            userMsg = '🔑 API Key 无效，请检查千问 Key 是否正确';
        } else if (error.message.includes('429')) {
            userMsg = '对方正在思考如何回复你';
        } else if (error.message.includes('not found') || error.message.includes('model')) {
            userMsg = `🔍 模型 "${MODEL_NAME}" 不可用，请检查模型名称`;
        }
        addMessage(userMsg, 'bot', false);
    }
}

// ============================================================
// 事件绑定
// ============================================================
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const msg = userInput.value.trim();
        if (msg.startsWith('/search ')) {
            const keyword = msg.replace('/search ', '');
            searchChat(keyword);
            userInput.value = '';
            return;
        }
        sendMessage();
    }
});

// ============================================================
// 自动夜间模式
// ============================================================
function setThemeByTime() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
        document.body.classList.remove('night-mode');
    } else {
        document.body.classList.add('night-mode');
    }
}
setThemeByTime();
setInterval(setThemeByTime, 60 * 60 * 1000);

// ============================================================
// 页面加载
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    const greetings = [
        '你来了。我一直在等你。',
        '有点想你了。',
        '最近过得怎么样？',
        '我刚刚买了你最喜欢的甜品，要尝尝吗？',
        '最近在忙什么？',
        '有点想你。',
        '我这边下雨了。'
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setTimeout(() => addMessage(randomGreeting, 'bot', true), 600);
});

// ============================================================
// 长按操作菜单（移动端）
// ============================================================
(function() {
    let longPressTimer = null;
    let longPressTarget = null;
    let menuEl = null;

    function createMenu(x, y, container, msgId) {
        removeMenu();
        menuEl = document.createElement('div');
        menuEl.className = 'longpress-menu';
        menuEl.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(12px);
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            padding: 6px 0;
            min-width: 150px;
            z-index: 9999;
            border: 1px solid rgba(0,0,0,0.06);
        `;
        const items = [
            { label: '📋 复制', action: () => {
                const textSpan = container.querySelector('.message-text');
                if (textSpan) {
                    navigator.clipboard?.writeText(textSpan.textContent).catch(() => {});
                }
            }},
            { label: '🗑️ 删除', action: () => {
                if (confirm('确定要删除这条消息吗？')) {
                    deleteMessage(container, msgId);
                }
            }}
        ];
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px 20px;
                border: none;
                background: none;
                text-align: left;
                font-size: 14px;
                color: #1a1a2a;
                cursor: pointer;
                font-family: inherit;
                transition: background 0.15s;
            `;
            btn.onmouseover = () => btn.style.background = 'rgba(0,0,0,0.05)';
            btn.onmouseout = () => btn.style.background = 'none';
            btn.onclick = () => {
                item.action();
                removeMenu();
            };
            menuEl.appendChild(btn);
        });
        document.body.appendChild(menuEl);
        setTimeout(() => {
            document.addEventListener('click', removeMenu, { once: true });
        }, 10);
    }

    function removeMenu() {
        if (menuEl && menuEl.parentNode) {
            menuEl.parentNode.removeChild(menuEl);
        }
        menuEl = null;
        longPressTarget = null;
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    document.addEventListener('touchstart', function(e) {
        const msgEl = e.target.closest('.message');
        if (!msgEl) return;
        const container = msgEl.closest('.message-wrapper');
        if (!container) return;
        longPressTarget = container;
        const msgId = container.dataset.msgId;
        longPressTimer = setTimeout(() => {
            const rect = msgEl.getBoundingClientRect();
            const x = rect.left + 10;
            const y = rect.bottom + 8;
            createMenu(x, y, container, msgId);
            if (navigator.vibrate) navigator.vibrate(20);
        }, 500);
    }, { passive: true });

    document.addEventListener('touchend', function() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        setTimeout(removeMenu, 300);
    }, { passive: true });

    document.addEventListener('touchmove', function() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, { passive: true });

    document.addEventListener('contextmenu', function(e) {
        const msgEl = e.target.closest('.message');
        if (!msgEl) return;
        e.preventDefault();
        const container = msgEl.closest('.message-wrapper');
        if (!container) return;
        const msgId = container.dataset.msgId;
        createMenu(e.clientX, e.clientY, container, msgId);
    });
})();

// ============================================================
// 桌面宠物（静止，仅气泡）
// ============================================================
(function() {
    const pet = document.getElementById('desktopPet');
    const bubble = document.getElementById('petBubble');
    const petImage = document.getElementById('petImage');
    const placeholder = document.getElementById('petPlaceholder');

    const img = new Image();
    img.onload = function() {
        petImage.style.display = 'block';
        placeholder.style.display = 'none';
    };
    img.onerror = function() {
        petImage.style.display = 'none';
        placeholder.style.display = 'flex';
    };
    img.src = 'images/lishen_q.png';

    const quotes = ['又在发呆？', '嗯，我在。', '手凉不凉？', '今天手术顺利。', '想听冷笑话吗？', '你来了。', '别熬夜。', '雪很大，记得加衣。', '……我在呢。'];
    let bubbleTimeout = null;

    function showBubble(text) {
        bubble.textContent = text;
        bubble.classList.add('show');
        clearTimeout(bubbleTimeout);
        bubbleTimeout = setTimeout(() => bubble.classList.remove('show'), 2500);
    }

    pet.addEventListener('click', function(e) {
        e.stopPropagation();
        const idx = Math.floor(Math.random() * quotes.length);
        showBubble(quotes[idx]);
    });

    pet.addEventListener('mouseenter', function() {
        pet.style.filter = 'drop-shadow(0 0 30px rgba(180, 220, 255, 0.4))';
    });
    pet.addEventListener('mouseleave', function() {
        pet.style.filter = 'drop-shadow(0 0 15px rgba(180, 220, 255, 0.15))';
    });

    function setInitialPosition() {
        const container = document.querySelector('.chat-container');
        if (!container) {
            pet.style.left = (window.innerWidth - 260) + 'px';
            pet.style.top = (window.innerHeight - 260) + 'px';
            return;
        }
        const rect = container.getBoundingClientRect();
        const left = rect.right - 240 - 20;
        const top = rect.bottom - 240 - 20;
        pet.style.left = left + 'px';
        pet.style.top = top + 'px';
        pet.style.right = 'auto';
        pet.style.bottom = 'auto';
    }

    let initialSet = false;
    function setInitialOnce() {
        if (!initialSet) {
            setInitialPosition();
            initialSet = true;
        }
    }
    window.addEventListener('load', setInitialOnce);
})();

// ============================================================
// 拖拽功能（音乐播放器 + 宠物）
// ============================================================
(function() {
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, origX, origY;

        element.addEventListener('mousedown', function(e) {
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.minimize-btn')) {
                return;
            }
            isDragging = true;
            const rect = element.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origX = rect.left;
            origY = rect.top;
            element.style.cursor = 'grabbing';
            element.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.position = 'fixed';
            element.style.left = (origX + dx) + 'px';
            element.style.top = (origY + dy) + 'px';
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
                element.style.userSelect = '';
            }
        });
    }

    const musicPlayer = document.getElementById('musicPlayer');
    const desktopPet = document.getElementById('desktopPet');
    if (musicPlayer) makeDraggable(musicPlayer);
    if (desktopPet) makeDraggable(desktopPet);
})();