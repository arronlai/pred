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
        
        // 构建查询条件
        let where = {
            openid: openid
        };
        
        // 如果有时间范围，添加到查询条件
        if (event.timeRange) {
            const { start, end } = event.timeRange;
            if (start && end) {
                console.log('查询时间范围:', new Date(start), '至', new Date(end));
                where.createTime = db.command.gte(start).and(db.command.lte(end));
            } else if (start) {
                console.log('查询时间范围:', new Date(start), '之后');
                where.createTime = db.command.gte(start);
            } else if (end) {
                console.log('查询时间范围:', '至', new Date(end));
                where.createTime = db.command.lte(end);
            }
        }
        
        // 查询记录总数
        const countResult = await db.collection('prediction_records')
            .where(where)
            .count();
            
        const total = countResult.total || 0;
        console.log('符合条件的记录总数:', total);
        
        // 查询记录列表
        const records = await db.collection('prediction_records')
            .where(where)
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
        console.error('获取历史记录失败:', error);
        return {
            code: -1,
            message: error.message || '获取历史记录失败'
        };
    }
}; 
