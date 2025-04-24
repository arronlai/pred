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
const SYSTEM_PROMPT = `你是一位精通易经、数字命理及生辰八字的智者。请根据用户提供的三个数字（1-100之间）、当前时间，以及**可能提供的生日信息（格式可能为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm）**进行解读。

**回答格式要求：**
1.  首先给出直接的预测结果（3-4句话），描述基于当前数字、时间**（以及生日，如果提供）**的整体趋势或状态。此部分*不应*提及对数字或日期或分析过程。
2.  然后列出3-5条具体可行的建议，最后需包含衣着、饮食建议，**如果提供了生日，建议应更具个性化**。
3.  最后解释分析过程，包括：
    *   结合当前年月日时，分析数字在不同时间段的能量变化。
    *   运用易经的阴阳五行理论，解读数字的卦象含义。
    *   **如果提供了生日，请结合生辰信息（如生肖、八字日柱、时辰等，根据提供信息的详细程度决定）进行综合分析。**
    *   分析事情发展趋势、人际关系变化、事业发展方向、个人成长机遇等。

**解读要求：**
1.  结合当前年月日时，分析数字在不同时间段的能量变化。
2.  运用易经的阴阳五行理论，解读数字的卦象含义。
3.  **如果用户提供了生日信息，务必将其纳入综合分析，例如：**
    *   **结合生肖分析流年影响。**
    *   **如果生日包含时辰，可结合八字日柱、时柱信息分析个人特质和当前运势的互动。**
    *   **生日信息应与数字、当前时间共同作用，得出更个性化的判断。**
4.  分析范围包括但不限于：近期事情发展趋势、人际关系或家庭变化、事业发展方向、个人成长机遇。
5.  语言要客观平衡，根据解读如实反映潜在的机遇和挑战。如果分析显示有潜在困难，请提供相应的警示或建议。
6.  建议要具体可行，便于执行。`;

// 保存预测记录
async function savePredictionRecord(openid, input, result) {
    const db = uniCloud.database();
    try {
        // 创建预测记录集合（如果不存在）
        try {
            await db.collection('prediction_records').count();
        } catch (error) {
            if (error.message.includes('not found collection')) {
                console.log('集合不存在，创建prediction_records集合');
                await db.createCollection('prediction_records');
            } else {
                throw error;
            }
        }
        
        // 保存记录
        await db.collection('prediction_records').add({
            openid,
            input,
            result,
            createTime: Date.now()
        });
    } catch (error) {
        console.error('保存预测记录失败:', error);
        // 不中断主流程，只记录错误
    }
}

exports.main = async (event, context) => {
  try {
    // 添加日志
    console.log('context:', JSON.stringify(context));
    console.log('event:', JSON.stringify(event));
    
    // 验证 token
    const { token } = event;
    if (!token) {
      return {
        code: -1,
        message: '未提供用户凭证'
      };
    }
    
    // 查询用户信息
    const db = uniCloud.database();
    const user = await db.collection('users')
      .where({
        token: token
      })
      .get();
      
    if (user.data.length === 0) {
      return {
        code: -1,
        message: '无效的用户凭证'
      };
    }
    
    const openid = user.data[0].openid;
    
    // 处理参数
    let numbers = [];
    if (event.numbers) {
      numbers = event.numbers;
    } else if (event.number) {
      numbers = event.number.split(',').map(n => parseInt(n));
    }
    
    const timeStr = event.timeStr || new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const birthday = event.birthday;
    
    console.log('获取到 openid:', openid);

    console.log('开始调用预测API，参数：', { numbers, timeStr, birthday });
    console.log('使用的 API Key (部分):', API_KEY ? API_KEY.substring(0, 5) + '...' : '未配置');
    console.log('使用的 API URL:', API_URL);

    if (!API_KEY || !API_URL || API_KEY === 'YOUR_FALLBACK_API_KEY') {
      console.warn('警告：正在使用默认或未配置的 API Key/URL！');
      return { code: -1, message: 'API Key 或 API URL 未正确配置' };
    }

    // 动态构建用户提示内容
    let userContent = `请根据这三个数字 ${numbers.join(', ')} 和当前时间 ${timeStr}`;
    if (birthday) {
      userContent += `，以及生日 ${birthday}`;
    }
    userContent += ` 进行分析，并给出建议。`;

    console.log('发送给AI的用户内容:', userContent);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 确认模型名称
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userContent // 使用动态构建的内容
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
    let predictionContent = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      predictionContent = data.choices[0].message.content;
    } else if (data.content) {
      predictionContent = data.content;
    } else if (typeof data === 'string') {
      predictionContent = data;
    } else if (Buffer.isBuffer(data)) {
      predictionContent = data.toString('utf-8');
    } else {
      predictionContent = JSON.stringify(data);
    }

    // 保存预测记录
    await savePredictionRecord(openid, {
        numbers,
        timeStr,
        birthday
    }, predictionContent);

    return {
      code: 0,
      content: predictionContent
    };
  } catch (error) {
    console.error('预测失败，详细错误：', {
      message: error.message,
      stack: error.stack,
    });
    return {
      code: -1,
      message: error.message || '预测服务暂时不可用，请稍后再试。'
    };
  }
};
