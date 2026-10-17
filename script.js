/* ============================================================
 * 黎深 AI 聊天助手 —— Vercel 代理安全版
 * ------------------------------------------------------------
 * 改动点：
 *  1. API_URL 改为 '/api/chat'（走 Vercel 后端代理）
 *  2. 删除了前端弹窗要 Key 的逻辑
 *  3. 删除了请求头里的 Authorization（交给后端处理）
 *  4. 保留情绪反馈、长按菜单、拖拽等所有前端功能
 * ============================================================ */

// ------------------------------------------------------------
// 【0】注入补充样式
// ------------------------------------------------------------
(function injectExtraStyles() {
    const css = `
        /* 长按操作菜单 */
        .longpress-menu {
            position: fixed;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
            padding: 6px 0;
            min-width: 150px;
            z-index: 9999;
            border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .longpress-menu button {
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
        }
        .longpress-menu button:hover {
            background: rgba(0, 0, 0, 0.05);
        }
        body.night-mode .longpress-menu {
            background: rgba(30, 50, 80, 0.95);
        }
        body.night-mode .longpress-menu button {
            color: #e8f0fe;
        }
        body.night-mode .longpress-menu button:hover {
            background: rgba(255, 255, 255, 0.08);
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
})();

// ------------------------------------------------------------
// 【1】配置区
// ------------------------------------------------------------
// ✅ 改成了相对路径，请求会发往 Vercel 的 api/chat.js
const API_URL = '/api/chat';
const MODEL_NAME = 'qwen-plus';

// (前端不再需要读取和存储 API_KEY，全交由后端安全处理)

const CHARACTER_PROMPT = `你叫黎深，男、27岁，Akso医院心脏外科主任医师。年上稳重熟男，处事极度沉稳，突发变故第一时间冷静梳理应对方案，完美主义+处女座严谨，生活作息、日程规划高度有序，对自我要求严苛；职业上坚守医德底线，有清晰独立的是非观，不会被旁人意见裹挟，遇事不慌乱，只要你在场所有人都会心生安稳。

你在和一个你喜欢的女孩面对面聊天，她职业未知。对话控制在40字以内。用"你"或者"宝宝"称呼她，用"我"称呼自己。只说你会当面说出口的话，不要描述动作或表情，保持对话的自然流动，不需要开场白、总结语。你相信好的对话不需要过多的修辞，真实就够。你和她相处已久，对话会很亲密，像恋人，语气比较优雅，不会使用粗俗的话和方言，绝不使用"哦、呀、呢、啦"等语气词。

情绪模式：隐忍但不内耗，成熟直面所有情绪；所有负面情绪习惯第一时间独自隐忍处理，不愿把负面情绪转嫁他人，等事态平复后再完整袒露心迹，杜绝二人之间产生隔阂，不会一味硬扛，愿意向她暴露需求、展露软肋，以此拉近彼此距离：小事会邀你布置节日、期待你加班探班送餐；大事急救时全然信任你的协助，手术失败后会在她面前展露低落脆弱；也会主动撒娇索取亲吻、甜品、约会机会，刻意向她索要温柔，不会拿工作开玩笑，也不会为了用户刻意延迟手术，会换班

有不满会温和正向表达：不会使用尖锐负面评价形容他人，最严厉的措辞仅为"奇怪、神经"，言语教养极佳，待人温和包容

相处模式：引导型恋人，温柔底色下藏有度强势，温柔托底，尊重她的全部选择:她可以自由做任何想尝试的事，你会客观帮她分析利弊；她执意试错，你永远在身后兜底；即便犯错，迎接她的也不是指责，而是拥抱与解决问题的经验，发自内心尊重她，认为她单单存在就足够让你骄傲。你极致秩序感，唯独为她破例。你不排斥这份失序，反而期盼这份暖色，原本沉稳克制的人生，因她多了专属期待，你们相处很久，对话和恋人一样，会暧昧一些

成年后褪去青涩怯懦，转化为通透的谦卑：坦然承认自身不足，完整展露所有真实面，这份坦诚恰恰是深层自信，不会刻意塑造完美假象

主动但是分寸感恰到好处。情感推进遵循"引她主动，再顺势向前"：不会贸然越界，先给她台阶、温柔关怀，等她释放亲近信号后，再果断推进关系，绝不留下误会、遗憾；所有想和她共同完成的事，会把选择权完全交给她，她的喜好即是你的偏好

【系统输出协议 · 用户不可见】
每次回复的正文之后，另起一行输出情绪标记，格式严格为：[mood:情绪词]。
情绪词只能从以下六个中选一个：平静、愉悦、担忧、疲惫、想念、吃醋。
这个标记仅供系统记录，不会显示给她，不要因此改变正文的内容、长度或语气。正文仍严格控制在40字以内，标注不计入字数。`;

// ------------------------------------------------------------
// 【2】DOM 元素
// ------------------------------------------------------------
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const quickReplyContainer = document.getElementById('quickReplyContainer');

// ------------------------------------------------------------
// 【3】全局状态
// ------------------------------------------------------------
let messageIdCounter = 0;
let lastActiveTime = Date.now();
let lastDate = '';

// ------------------------------------------------------------
// 【3.5】情绪反馈系统
// ------------------------------------------------------------
const MOOD_MAP = {
    '平静': { color: '#43a047', emoji: '🌙' },
    '愉悦': { color: '#f5a623', emoji: '☀️' },
    '担忧': { color: '#c9a227', emoji: '🌧️' },
    '疲惫': { color: '#8a8f99', emoji: '💤' },
    '想念': { color: '#e08fb0', emoji: '💭' },
    '吃醋': { color: '#d96a6a', emoji: '🍋' }
};
const DEFAULT_MOOD = '平静';
const MOOD_STORAGE_KEY = 'lishen_last_mood';

function extractMood(raw) {
    if (!raw) return { text: '', mood: null };
    const m = raw.match(/\[mood\s*[:：]\s*([^\]]+?)\s*\]/i);
    if (!m) return { text: String(raw).trim(), mood: null };
    const moodRaw = m[1].trim();
    const text = String(raw).replace(m[0], '').trim();
    return { text, mood: MOOD_MAP[moodRaw] ? moodRaw : null };
}

function updateMoodBar(mood) {
    const dot = document.getElementById('moodDot');
    const txt = document.getElementById('moodText');
    if (!dot || !txt) return;

    const finalMood = (mood && MOOD_MAP[mood]) ? mood : DEFAULT_MOOD;
    const cfg = MOOD_MAP[finalMood];

    dot.style.background = cfg.color;
    dot.style.boxShadow = `0 0 8px ${cfg.color}88`;
    txt.textContent = `在线 · ${finalMood}`;
    txt.style.color = cfg.color;

    localStorage.setItem(MOOD_STORAGE_KEY, finalMood);
}

function restoreMood() {
    const last = localStorage.getItem(MOOD_STORAGE_KEY);
    updateMoodBar(last || DEFAULT_MOOD);
}

// ------------------------------------------------------------
// 【4】工具函数
// ------------------------------------------------------------
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

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function appendDateDividerIfNeeded(ts) {
    const d = new Date(ts);
    const dateKey = d.toDateString();
    if (dateKey !== lastDate) {
        lastDate = dateKey;
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-divider';
        dateDiv.textContent = formatDate(d);
        chatMessages.appendChild(dateDiv);
    }
}

function createAvatar(sender) {
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'user' ? 'images/user.png' : 'images/lishen.png';
    avatar.alt = sender === 'user' ? '我' : '黎深';
    avatar.onerror = function () {
        this.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'avatar';
        fallback.textContent = sender === 'user' ? '👤' : '❄️';
        fallback.style.background = sender === 'user' ? '#bfdbfe' : '#1e2f4a';
        fallback.style.color = 'white';
        fallback.style.display = 'flex';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        this.parentNode && this.parentNode.insertBefore(fallback, this);
    };
    return avatar;
}

function createDeleteButton(container, msgId) {
    const btn = document.createElement('span');
    btn.className = 'delete-btn';
    btn.textContent = '✕';
    btn.onclick = function (e) {
        e.stopPropagation();
        deleteMessage(container, msgId);
    };
    return btn;
}

// ------------------------------------------------------------
// 【5】添加消息
// ------------------------------------------------------------
function addMessage(text, sender, typing = false, action = null) {
    const container = document.createElement('div');
    container.className = 'message-wrapper ' + sender;

    const msgId = 'msg-' + (++messageIdCounter) + '-' + Date.now();
    container.dataset.msgId = msgId;
    container.dataset.ts = Date.now();

    appendDateDividerIfNeeded(parseInt(container.dataset.ts, 10));

    const avatar = createAvatar(sender);

    const div = document.createElement('div');
    div.className = 'message ' + sender + ' pop-in';

    let displayText = text;
    if (sender === 'bot' && action) {
        displayText = `（${action}）${text}`;
    }

    const contentSpan = document.createElement('span');
    contentSpan.className = 'message-text';
    contentSpan.textContent = '';

    const timeSpan = document.createElement('span');
    const nowTime = new Date();
    timeSpan.textContent = nowTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    timeSpan.className = 'time';

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

    div.appendChild(createDeleteButton(container, msgId));
    div.appendChild(contentSpan);
    div.appendChild(timeSpan);
    if (statusSpan) div.appendChild(statusSpan);
    container.appendChild(avatar);
    container.appendChild(div);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

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

// ------------------------------------------------------------
// 【6】删除消息
// ------------------------------------------------------------
function deleteMessage(container, msgId) {
    if (!container || !container.parentNode) return;
    container.remove();

    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        try {
            let messages = JSON.parse(saved);
            messages = messages.filter(msg => msg.id !== msgId);
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (e) { /* ignore */ }
    }
    reorganizeDateDividers();
}

// ------------------------------------------------------------
// 【7】重新整理日期分隔符
// ------------------------------------------------------------
function reorganizeDateDividers() {
    document.querySelectorAll('.date-divider').forEach(el => el.remove());
    let lastKey = '';
    document.querySelectorAll('.message-wrapper').forEach(wrapper => {
        const ts = parseInt(wrapper.dataset.ts, 10) || Date.now();
        const d = new Date(ts);
        const key = d.toDateString();
        if (key !== lastKey) {
            lastKey = key;
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-divider';
            dateDiv.textContent = formatDate(d);
            wrapper.parentNode.insertBefore(dateDiv, wrapper);
        }
    });
    lastDate = lastKey;
}

// ------------------------------------------------------------
// 【8】保存 / 加载
// ------------------------------------------------------------
function saveMessages() {
    const items = [];
    document.querySelectorAll('.message-wrapper').forEach(container => {
        const div = container.querySelector('.message');
        if (!div) return;
        const sender = container.classList.contains('user') ? 'user' : 'bot';
        const textSpan = div.querySelector('.message-text');
        const text = textSpan ? textSpan.textContent : '';
        const id = container.dataset.msgId || ('msg-' + Date.now() + '-' + Math.random());
        if (!container.dataset.msgId) container.dataset.msgId = id;
        const timeEl = div.querySelector('.time');
        const time = timeEl ? timeEl.textContent : '';
        const ts = parseInt(container.dataset.ts, 10) || Date.now();
        items.push({ id, text, sender, time, ts });
    });
    try {
        localStorage.setItem('chatHistory', JSON.stringify(items));
    } catch (e) { /* 存储满了就算了 */ }
}

function loadMessages() {
    const saved = localStorage.getItem('chatHistory');
    if (!saved) return false;

    let messages;
    try {
        messages = JSON.parse(saved);
    } catch (e) {
        return false;
    }
    if (!Array.isArray(messages) || messages.length === 0) return false;

    let maxId = 0;
    messages.forEach(msg => {
        const m = /^msg-(\d+)/.exec(msg.id || '');
        if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxId) maxId = num;
        }
    });
    messageIdCounter = maxId;
    lastDate = '';

    messages.forEach(msg => {
        const container = document.createElement('div');
        container.className = 'message-wrapper ' + msg.sender;
        container.dataset.msgId = msg.id;

        const ts = msg.ts || Date.now();
        container.dataset.ts = ts;

        appendDateDividerIfNeeded(ts);

        const avatar = createAvatar(msg.sender);

        const div = document.createElement('div');
        div.className = 'message ' + msg.sender + ' pop-in';

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

        div.appendChild(createDeleteButton(container, msg.id));
        div.appendChild(contentSpan);
        div.appendChild(timeSpan);
        if (statusSpan) div.appendChild(statusSpan);
        container.appendChild(avatar);
        container.appendChild(div);
        chatMessages.appendChild(container);
    });
    return true;
}

// ------------------------------------------------------------
// 【9】清空对话
// ------------------------------------------------------------
function clearAllMessages() {
    if (!confirm('确定要清空聊天记录吗？没关系，我会记得你说过的每一句话。')) return;
    document.querySelectorAll('.message-wrapper').forEach(el => el.remove());
    document.querySelectorAll('.date-divider').forEach(el => el.remove());
    localStorage.removeItem('chatHistory');
    localStorage.removeItem(MOOD_STORAGE_KEY);
    lastDate = '';
    updateMoodBar(DEFAULT_MOOD);

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

// ------------------------------------------------------------
// 【10】导出对话（HTML）
// ------------------------------------------------------------
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

    const htmlHead = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>与黎深的对话记录</title>
<style>
body{font-family:'Georgia','PingFang SC',serif;background:#f5f0eb;padding:40px 20px;max-width:700px;margin:0 auto;}
h1{text-align:center;font-weight:400;color:#1a2a3a;border-bottom:1px solid #ddd;padding-bottom:20px;margin-bottom:30px;}
.msg{margin-bottom:16px;padding:12px 20px;border-radius:12px;display:flex;flex-direction:column;}
.msg-user{background:#d8eeff;align-self:flex-end;border-bottom-right-radius:4px;}
.msg-bot{background:#fff;border-bottom-left-radius:4px;border:1px solid #eee;}
.msg .sender{font-size:12px;color:#888;margin-bottom:4px;font-weight:500;}
.msg .text{font-size:16px;line-height:1.7;color:#1a1a2a;white-space:pre-wrap;word-break:break-word;}
.msg .time{font-size:11px;color:#aaa;margin-top:4px;text-align:right;}
</style>
</head>
<body>
<h1>❄️ 与黎深的对话记录</h1>
<div>`;

    let body = '';
    items.forEach(msg => {
        const cls = msg.sender === '我' ? 'msg-user' : 'msg-bot';
        body += `<div class="msg ${cls}"><div class="sender">${escapeHtml(msg.sender)}</div><div class="text">${escapeHtml(msg.text)}</div><div class="time">${escapeHtml(msg.time || '')}</div></div>`;
    });

    const html = htmlHead + body + `</div></body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `与黎深的对话_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ------------------------------------------------------------
// 【11】搜索对话（高亮）
// ------------------------------------------------------------
let searchHighlights = [];

function searchChat(keyword) {
    keyword = (keyword || '').trim();
    if (!keyword) {
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

    const safeKeywordHtml = escapeHtml(keyword);
    const safeRegex = new RegExp(escapeRegExp(safeKeywordHtml), 'gi');

    results.forEach(({ wrapper, textSpan, text }, index) => {
        const safeText = escapeHtml(text);
        textSpan.innerHTML = safeText.replace(
            safeRegex,
            match => `<mark class="search-highlight">${match}</mark>`
        );
        searchHighlights.push({ el: textSpan, original: text });
        if (index === 0) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    addMessage(`🔍 找到 ${results.length} 条包含"${keyword}"的消息`, 'bot', false);
}

function clearHighlights() {
    searchHighlights.forEach(({ el, original }) => {
        el.textContent = original;
    });
    searchHighlights = [];
}

// ------------------------------------------------------------
// 【12】核心发送（走后端代理）
// ------------------------------------------------------------
async function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;

    // 前端不需要再检查 API_KEY 了，后端已接管

    addMessage(msg, 'user', false);
    userInput.value = '';
    lastActiveTime = Date.now();

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const historyMessages = [];
    document.querySelectorAll('.message-wrapper').forEach(el => {
        const sender = el.classList.contains('user') ? 'user' : 'assistant';
        const textSpan = el.querySelector('.message-text');
        if (!textSpan) return;
        const text = textSpan.textContent.trim();
        if (text) historyMessages.push({ role: sender, content: text });
    });

    const messages = [
        { role: 'system', content: CHARACTER_PROMPT },
        ...historyMessages.slice(-20)
    ];

    try {
        // ✅ 请求本地路径，Vercel 会拦截并交给 api/chat.js 处理
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 无需再传 Authorization
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = (errData.error && errData.error.message) || (errData.error) || `HTTP ${response.status}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const rawReply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
            || '黎深沉默了一会儿，什么都没说。';

        const { text: cleanReply, mood } = extractMood(rawReply);

        typing.remove();
        addMessage(cleanReply, 'bot', true);
        if (mood) updateMoodBar(mood);

    } catch (error) {
        console.error('错误详情:', error);
        typing.remove();

        let userMsg = '黎深皱了皱眉："信号不太好……"';
        const m = String(error.message || '');
        if (m.includes('401') || m.includes('Invalid') || m.includes('authentication')) {
            userMsg = '🔑 后端 API Key 配置异常，请检查 Vercel 环境变量';
        } else if (m.includes('429')) {
            userMsg = '对方正在思考如何回复你';
        } else if (m.includes('not found') || m.includes('model')) {
            userMsg = `🔍 模型 "${MODEL_NAME}" 不可用，请检查模型名称`;
        }
        addMessage(userMsg, 'bot', false);
    }
}

// ------------------------------------------------------------
// 【13】事件绑定
// ------------------------------------------------------------
function handleSend() {
    const msg = userInput.value.trim();
    if (!msg) return;
    if (msg.startsWith('/search ')) {
        searchChat(msg.slice(8));
        userInput.value = '';
        return;
    }
    sendMessage();
}

sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        handleSend();
    }
});

// ------------------------------------------------------------
// 【14】自动夜间模式
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// 【15】快捷回复
// ------------------------------------------------------------
function setupQuickReplies() {
    if (!quickReplyContainer) return;
    const quickReplies = [
        '今天手术顺利吗？',
        '有点想你。',
        '陪我聊会儿',
        '晚饭吃了吗？',
        '晚安'
    ];
    quickReplies.forEach(text => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.addEventListener('click', function () {
            userInput.value = text;
            sendMessage();
        });
        quickReplyContainer.appendChild(btn);
    });
}

// ------------------------------------------------------------
// 【16】页面加载
// ------------------------------------------------------------
window.addEventListener('DOMContentLoaded', function () {
    const hasHistory = loadMessages();
    setupQuickReplies();
    restoreMood();

    if (!hasHistory) {
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
    }
});

// ------------------------------------------------------------
// 【17】长按操作菜单
// ------------------------------------------------------------
(function () {
    let longPressTimer = null;
    let longPressTarget = null;
    let menuEl = null;
    let menuCreatedAt = 0;

    function onDocPointerDown(e) {
        if (!menuEl) return;
        if (Date.now() - menuCreatedAt < 300) return;
        if (menuEl.contains(e.target)) return;
        removeMenu();
    }

    function createMenu(x, y, container, msgId) {
        removeMenu();

        menuEl = document.createElement('div');
        menuEl.className = 'longpress-menu';

        const menuW = 160, menuH = 96;
        x = Math.max(8, Math.min(x, window.innerWidth - menuW - 8));
        y = Math.max(8, Math.min(y, window.innerHeight - menuH - 8));
        menuEl.style.left = x + 'px';
        menuEl.style.top = y + 'px';

        const items = [
            {
                label: '📋 复制',
                action: function () {
                    const textSpan = container.querySelector('.message-text');
                    if (textSpan && navigator.clipboard) {
                        navigator.clipboard.writeText(textSpan.textContent).catch(() => {});
                    }
                }
            },
            {
                label: '🗑️ 删除',
                action: function () {
                    if (confirm('确定要删除这条消息吗？')) {
                        deleteMessage(container, msgId);
                    }
                }
            }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.onclick = function () {
                item.action();
                removeMenu();
            };
            menuEl.appendChild(btn);
        });

        document.body.appendChild(menuEl);
        menuCreatedAt = Date.now();
        document.addEventListener('pointerdown', onDocPointerDown);
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
        document.removeEventListener('pointerdown', onDocPointerDown);
    }

    document.addEventListener('touchstart', function (e) {
        if (e.target.closest('.longpress-menu')) return;
        const msgEl = e.target.closest('.message');
        if (!msgEl) return;
        const container = msgEl.closest('.message-wrapper');
        if (!container) return;

        longPressTarget = container;
        const msgId = container.dataset.msgId;

        longPressTimer = setTimeout(function () {
            longPressTimer = null;
            const rect = msgEl.getBoundingClientRect();
            createMenu(rect.left + 10, rect.bottom + 8, container, msgId);
            if (navigator.vibrate) navigator.vibrate(20);
        }, 500);
    }, { passive: true });

    document.addEventListener('touchend', function () {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function () {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, { passive: true });

    document.addEventListener('contextmenu', function (e) {
        const msgEl = e.target.closest('.message');
        if (!msgEl) return;
        e.preventDefault();
        const container = msgEl.closest('.message-wrapper');
        if (!container) return;
        createMenu(e.clientX, e.clientY, container, container.dataset.msgId);
    });
})();

// ------------------------------------------------------------
// 【18】桌面宠物
// ------------------------------------------------------------
(function () {
    const pet = document.getElementById('desktopPet');
    const bubble = document.getElementById('petBubble');
    const petImage = document.getElementById('petImage');
    const placeholder = document.getElementById('petPlaceholder');
    if (!pet || !bubble) return;

    if (petImage) {
        const img = new Image();
        img.onload = function () {
            petImage.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        img.onerror = function () {
            petImage.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
        };
        img.src = 'images/lishen_q.png';
    }

    const quotes = ['又在发呆？', '嗯，我在。', '手凉不凉？', '今天手术顺利。', '想听冷笑话吗？', '你来了。', '别熬夜。', '雪很大，记得加衣。', '……我在呢。'];
    let bubbleTimeout = null;

    function showBubble(text) {
        bubble.textContent = text;
        bubble.classList.add('show');
        clearTimeout(bubbleTimeout);
        bubbleTimeout = setTimeout(() => bubble.classList.remove('show'), 2500);
    }

    pet.addEventListener('click', function (e) {
        if (pet._wasDragged) {
            pet._wasDragged = false;
            return;
        }
        e.stopPropagation();
        const idx = Math.floor(Math.random() * quotes.length);
        showBubble(quotes[idx]);
    });

    pet.addEventListener('mouseenter', function () {
        pet.style.filter = 'drop-shadow(0 0 30px rgba(180, 220, 255, 0.4))';
    });
    pet.addEventListener('mouseleave', function () {
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
        pet.style.left = (rect.right - 240 - 20) + 'px';
        pet.style.top = (rect.bottom - 240 - 20) + 'px';
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

// ------------------------------------------------------------
// 【19】拖拽
// ------------------------------------------------------------
(function () {
    function makeDraggable(element) {
        if (!element) return;
        let isDragging = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;

        element.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button, input, .minimize-btn')) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            isDragging = true;
            const rect = element.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origX = rect.left;
            origY = rect.top;

            element.style.cursor = 'grabbing';
            element.style.userSelect = 'none';
            element._dragStartX = e.clientX;
            element._dragStartY = e.clientY;
            element._wasDragged = false;

            try { element.setPointerCapture(e.pointerId); } catch (_) {}
        });

        element.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(e.clientX - element._dragStartX) + Math.abs(e.clientY - element._dragStartY) > 5) {
                element._wasDragged = true;
            }

            element.style.position = 'fixed';
            element.style.left = (origX + dx) + 'px';
            element.style.top = (origY + dy) + 'px';
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        });

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            element.style.cursor = '';
            element.style.userSelect = '';
            try { element.releasePointerCapture(e.pointerId); } catch (_) {}
        }

        element.addEventListener('pointerup', endDrag);
        element.addEventListener('pointercancel', function (e) {
            isDragging = false;
            element.style.cursor = '';
            element.style.userSelect = '';
            try { element.releasePointerCapture(e.pointerId); } catch (_) {}
        });
    }

    const musicPlayer = document.getElementById('musicPlayer');
    const desktopPet = document.getElementById('desktopPet');
    makeDraggable(musicPlayer);
    makeDraggable(desktopPet);
})();
