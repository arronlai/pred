'use strict';

// 从环境变量获取配置
const API_KEY = process.env.AI_API_KEY;
const API_URL = process.env.AI_API_URL;

// 系统提示词模板
const SYSTEM_PROMPT = `你是一位精通易经和数字命理的智者。请根据用户提供的三个数字（1-100之间）和当前时间进行解读。

回答格式要求：
1. 首先给出预测结果（2-3句话）
2. 然后列出3-5条具体可行的建议
3. 最后解释分析过程，包括：
   - 结合当前年月日时，分析数字在不同时间段的能量变化
   - 运用易经的阴阳五行理论，解读数字的卦象含义
   - 分析事情发展趋势、人际关系变化、事业发展方向、个人成长机遇等

解读要求：
1. 结合当前年月日时，分析数字在不同时间段的能量变化
2. 运用易经的阴阳五行理论，解读数字的卦象含义
3. 分析范围包括但不限于：
   - 事情发展趋势
   - 人际关系变化
   - 事业发展方向
   - 个人成长机遇
4. 语言要温和积极，避免消极暗示
5. 建议要具体可行，便于执行`;

exports.main = async (event, context) => {
  const { numbers, timestamp } = event;
  
  // 参数验证
  if (!numbers || !Array.isArray(numbers) || numbers.length !== 3) {
    return {
      code: 400,
      message: '无效的请求参数'
    };
  }
  
  try {
    // 调用 AI API
    const response = await uniCloud.httpclient.request(
      API_URL,
      {
        method: 'POST',
        data: {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: `请根据这三个数字 ${numbers.join(', ')} 和当前时间 ${timestamp} 进行分析，并给出建议。`
            }
          ]
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    
    return {
      code: 200,
      data: {
        prediction: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    console.error('AI API 调用失败:', error);
    return {
      code: 500,
      message: '预测失败，请稍后重试'
    };
  }
}; 
