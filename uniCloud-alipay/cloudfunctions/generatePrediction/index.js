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
1. 使用固定的分隔符来区分不同部分：
   - 预测结果部分使用 "===预测结果===" 作为分隔符
   - 具体建议部分使用 "===具体建议===" 作为分隔符
   - 分析过程部分使用 "===分析过程===" 作为分隔符

2. 每个部分的具体格式：
   - 预测结果：直接给出3-4句话的预测，描述整体趋势或状态
   - 具体建议：列出3-5条建议，每条建议前加序号（如1. 2. 3.），最后两条必须是衣着和饮食建议
   - 分析过程：分为四个子部分，每个子部分使用小标题（如"数字能量分析"、"易经卦象解读"等）

**解读要求：**
1. 结合当前年月日时，分析数字在不同时间段的能量变化
2. 运用易经的阴阳五行理论，解读数字的卦象含义
3. 如果用户提供了生日信息，务必将其纳入综合分析
4. 分析范围包括但不限于：近期事情发展趋势、人际关系或家庭变化、事业发展方向、个人成长机遇
5. 语言要客观平衡，根据解读如实反映潜在的机遇和挑战
6. 建议要具体可行，便于执行

**示例格式：**
===预测结果===
当前的能量状态显示出一种内在的平衡与稳定...

===具体建议===
1. 耐心与细致：在处理事务时...
2. 沟通与理解：在人际关系中...
3. 灵活应对：面对挑战时...
4. 衣着建议：选择柔和的色调...
5. 饮食建议：多食用富含纤维的食物...

===分析过程===
1. 数字能量分析：
   - 数字5：代表变化与自由...
   - 数字4：代表稳定与秩序...
   - 数字2：代表合作与平衡...

2. 易经卦象解读：
   - 数字5对应易经中的"巽卦"...
   - 数字4对应易经中的"艮卦"...
   - 数字2对应易经中的"坎卦"...

3. 时间与数字的互动：
   - 当前时间处于春季...

4. 发展趋势分析：
   - 近期事情发展趋势：整体趋势是...
   - 人际关系或家庭变化：需要更多的...
   - 事业发展方向：在变化中...
   - 个人成长机遇：通过耐心...`;

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
    
    // 检查用户今日使用次数
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    
    // 查询用户今日已使用次数
    const todayRecords = await db.collection('prediction_records')
      .where({
        openid: openid,
        createTime: db.command.gte(startOfDay).and(db.command.lte(endOfDay))
      })
      .count();
    
    const usedCount = todayRecords.total || 0;
    const baseLimit = 1; // 基础每日限制次数
    
    // 获取用户是否通过分享获得额外次数
    let hasShared = false;
    try {
      const userShareRecord = await db.collection('user_shares')
        .where({
          openid: openid,
          shareDate: db.command.gte(startOfDay).and(db.command.lte(endOfDay))
        })
        .count();
      
      hasShared = (userShareRecord.total || 0) > 0;
    } catch (error) {
      // 如果集合不存在，创建集合
      if (error.message.includes('not found collection')) {
        console.log('集合不存在，创建user_shares集合');
        await db.createCollection('user_shares');
      }
    }
    
    const totalLimit = hasShared ? 2 : 1; // 分享后总次数为2，否则为1
    
    // 检查是否超出每日限制
    if (usedCount >= totalLimit) {
      // 已达到使用上限
      let message = '';
      
      if (hasShared || usedCount > 1) {
        // 已分享或已使用多次，提示明天再来
        message = '您今日的使用次数已达上限，明天再来试试吧！';
      } else {
        // 未分享且刚好用完基础次数，提示分享获取更多
        message = '您的基础次数已用完，分享小程序可获取更多使用次数！';
      }
      
      return {
        code: -2,
        message: message,
        data: {
          used_count: usedCount,
          base_limit: baseLimit,
          shared: hasShared,
          total_limit: totalLimit,
          remaining: 0
        }
      };
    }
    
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
      content: predictionContent,
      usage: {
        used_count: usedCount + 1,
        base_limit: baseLimit,
        shared: hasShared,
        total_limit: totalLimit,
        remaining: totalLimit - (usedCount + 1)
      }
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
