'use strict';

// 从环境变量获取配置
const API_KEY = process.env.AI_API_KEY || 'sk-QiHOEptpQQzgbm7p0a5bDfAeE95d4d4697901eB9245622F0';
const API_URL = process.env.AI_API_URL || 'https://aiproxy.hzh.sealos.run/v1/chat/completions';

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
   - 近期事情发展趋势
   - 人际关系或家庭变化
   - 事业发展方向
   - 个人成长机遇
4. 语言要温和积极，避免过于消极暗示
5. 建议要具体可行，便于执行`;

exports.main = async (event, context) => {
	const { numbers, timeStr } = event;
	
	try {
		console.log('开始调用预测API，参数：', { numbers, timeStr });
		
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
						content: `请根据这三个数字 ${numbers.join(', ')} 和当前时间 ${timeStr} 进行分析，并给出建议。`
					}
				]
			})
		});

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

		return {
			code: 0,
			content: predictionContent
		};
	} catch (error) {
		console.error('预测失败，详细错误：', {
			message: error.message,
			stack: error.stack,
			response: error.response ? {
				status: error.response.status,
				data: error.response.data
			} : null
		});
		throw error;
	}
}; 
