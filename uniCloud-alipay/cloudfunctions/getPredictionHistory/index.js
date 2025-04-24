'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
    const { page = 1, pageSize = 10 } = event;
    
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
        
        console.log('获取到 openid:', openid);
        
        // 查询记录总数
        const countResult = await db.collection('prediction_records')
            .where({
                openid: openid
            })
            .count();
            
        const total = countResult.total;
        
        // 查询记录列表
        const records = await db.collection('prediction_records')
            .where({
                openid: openid
            })
            .orderBy('createTime', 'desc')
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .get();
            
        return {
            code: 0,
            data: {
                records: records.data,
                total,
                page,
                pageSize
            }
        };
        
    } catch (error) {
        console.error('获取预测历史失败:', error);
        return {
            code: -1,
            message: error.message || '获取预测历史失败'
        };
    }
}; 
