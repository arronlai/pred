'use strict';

const db = uniCloud.database();

/**
 * 记录用户分享行为
 */
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
        
        // 检查user_shares集合是否存在
        try {
            await db.collection('user_shares').count();
        } catch (error) {
            if (error.message.includes('not found collection')) {
                console.log('集合不存在，创建user_shares集合');
                await db.createCollection('user_shares');
            } else {
                throw error;
            }
        }
        
        // 获取当天的开始时间和结束时间
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
        
        // 检查用户今日是否已经分享
        const shareRecord = await db.collection('user_shares')
            .where({
                openid: openid,
                shareDate: db.command.gte(startOfDay).and(db.command.lte(endOfDay))
            })
            .get();
        
        // 如果已经有分享记录，则不再添加
        if (shareRecord.data.length > 0) {
            // 查询今日已使用次数以更新使用情况
            if (!event.checkOnly) {
                const usedCount = await getUsedCount(db, openid, startOfDay, endOfDay);
                const baseLimit = 1;
                
                return {
                    code: 0,
                    message: '您今日已分享过，已获得额外使用次数',
                    data: {
                        already_shared: true,
                        usage: {
                            used_count: usedCount,
                            base_limit: baseLimit,
                            shared: true,
                            total_limit: 2,
                            remaining: Math.max(0, 2 - usedCount)
                        }
                    }
                };
            } else {
                return {
                    code: 0,
                    message: '您今日已分享过，已获得额外使用次数',
                    data: {
                        already_shared: true
                    }
                };
            }
        }
        
        // 如果只是检查分享状态，到这里就可以返回了
        if (event.checkOnly) {
            console.log('只是检查分享状态，返回未分享');
            return {
                code: 0,
                message: '您今日还未分享',
                data: {
                    already_shared: false
                }
            };
        }
        
        // 添加分享记录
        await db.collection('user_shares').add({
            openid,
            shareDate: Date.now(),
            shareType: event.shareType || 'wechat', // 分享类型，默认微信
            shareContent: event.shareContent || 'prediction' // 分享内容，默认预测结果
        });
        
        // 查询今日已使用次数以更新使用情况
        const usedCount = await getUsedCount(db, openid, startOfDay, endOfDay);
        const baseLimit = 1;
        
        return {
            code: 0,
            message: '分享成功，已获得额外使用次数',
            data: {
                already_shared: true,
                usage: {
                    used_count: usedCount,
                    base_limit: baseLimit,
                    shared: true,
                    total_limit: 2,
                    remaining: Math.max(0, 2 - usedCount)
                }
            }
        };
        
    } catch (error) {
        console.error('记录分享失败:', error);
        return {
            code: -1,
            message: error.message || '记录分享失败'
        };
    }
};

// 获取用户当日已使用次数的辅助函数
async function getUsedCount(db, openid, startOfDay, endOfDay) {
    try {
        const todayRecords = await db.collection('prediction_records')
            .where({
                openid: openid,
                createTime: db.command.gte(startOfDay).and(db.command.lte(endOfDay))
            })
            .count();
        
        return todayRecords.total || 0;
    } catch (error) {
        console.error('获取使用次数失败:', error);
        return 0;
    }
} 
