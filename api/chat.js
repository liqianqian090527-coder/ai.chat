export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: '只支持 POST' });
    
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        // 如果 Vercel 没配环境变量，直接拦截并报错
        return res.status(500).json({ error: '缺少 API Key', details: '请去 Vercel Settings -> Environment Variables 添加 DASHSCOPE_API_KEY' });
    }

    try {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        // 如果阿里云报错（比如欠费、模型名字不对）
        if (!response.ok) {
            return res.status(response.status).json({ error: '阿里云接口拒绝', details: data });
        }
        
        // 成功返回
        res.status(200).json(data);
    } catch (error) {
        // 如果 fetch 网络崩溃
        res.status(500).json({ error: 'Vercel 代理网络错误', details: error.message });
    }
}
