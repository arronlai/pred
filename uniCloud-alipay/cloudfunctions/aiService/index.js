'use strict';

// 从环境变量获取配置
const createConfig = require('uni-config-center');
const shareConfig = createConfig({
  // 获取配置实例
  pluginId: 'deepseek-config', // common/uni-config-center下的插件配置目录名
});
const Config = shareConfig.config(); // 获取common/uni-config-center/share-config/config.json的内容

const API_KEY = Config.AI_API_KEY;
const API_URL = Config.AI_API_URL;

// 更新系统提示词模板
const SYSTEM_PROMPT = `你是一个专业的商品分析师，擅长找到性价比高的平替商品。请根据用户提供的商品信息，推荐3个相似但价格更实惠的替代品，并详细比较它们的特性。

**回答格式要求：**
1. 首先列出3个平替商品，每个商品包含名称和价格
2. 然后详细比较原商品和平替商品的特性
3. 最后给出购买建议

请按照以下格式返回：
商品1: [商品名称]
价格: ¥[价格]
商品2: [商品名称]
价格: ¥[价格]
商品3: [商品名称]
价格: ¥[价格]

详细比较：
特性: [特性名称]
原商品: [原商品特性值]
平替商品: [平替商品特性值]
...`;

exports.main = async (event, context) => {
    const { type, product } = event;
    
    try {
        if (type !== 'findAlternative') {
            return {
                code: -1,
                message: '不支持的服务类型'
            };
        }
        
        console.log('开始调用AI服务，参数：', { product });
        console.log('使用的 API Key (部分):', API_KEY ? API_KEY.substring(0, 5) + '...' : '未配置');
        console.log('使用的 API URL:', API_URL);

        if (!API_KEY || !API_URL || API_KEY === 'YOUR_FALLBACK_API_KEY') {
            console.warn('警告：正在使用默认或未配置的 API Key/URL！');
            return { code: -1, message: 'API Key 或 API URL 未正确配置' };
        }
        
        // 构建用户提示内容
        let userContent = `请分析以下商品，并推荐3个相似但价格更实惠的替代品：
商品名称：${product.name}
价格：¥${product.price}
${product.features.length > 0 ? '特性：' + product.features.map(f => `${f.name}: ${f.value}`).join(', ') : ''}`;

        console.log('发送给AI的用户内容:', userContent);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: userContent
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API 请求失败，状态码: ${response.status}`, errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // 处理不同格式的响应
        let aiResponse = '';
        if (data.choices && data.choices[0] && data.choices[0].message) {
            aiResponse = data.choices[0].message.content;
        } else if (data.content) {
            aiResponse = data.content;
        } else if (typeof data === 'string') {
            aiResponse = data;
        } else if (Buffer.isBuffer(data)) {
            aiResponse = data.toString('utf-8');
        } else {
            aiResponse = JSON.stringify(data);
        }

        // 解析AI响应
        const alternatives = [];
        const comparison = [];
        
        // 提取平替商品信息
        const altRegex = /商品(\d+):\s*([^\n]+)\n价格:\s*¥(\d+\.?\d*)/g;
        let match;
        while ((match = altRegex.exec(aiResponse)) !== null) {
            alternatives.push({
                name: match[2].trim(),
                price: parseFloat(match[3]),
                image: '', // 需要从其他来源获取图片
                features: [] // 需要从比较部分提取
            });
        }
        
        // 提取特性比较
        const compRegex = /特性:\s*([^\n]+)\n原商品:\s*([^\n]+)\n平替商品:\s*([^\n]+)/g;
        while ((match = compRegex.exec(aiResponse)) !== null) {
            comparison.push({
                name: match[1].trim(),
                original: match[2].trim(),
                alternative: match[3].trim()
            });
        }
        
        return {
            code: 0,
            data: {
                alternatives,
                comparison
            }
        };
        
    } catch (error) {
        console.error('处理失败:', error);
        return {
            code: -1,
            message: error.message || '处理失败'
        };
    }
}; 
