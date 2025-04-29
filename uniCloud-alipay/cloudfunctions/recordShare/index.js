'use strict';

const db = uniCloud.database();

/**
 * 记录用户分享行为
 */
exports.main = async (event, context) => {
  try {
    // 添加日志
    console.log('recordShare云函数开始执行');
    console.log('context:', JSON.stringify(context));
    console.log('event:', JSON.stringify(event));

    // 验证 token
    const { token } = event;
    if (!token) {
      return {
        code: -1,
        message: '未提供用户凭证',
      };
    }

    // 查询用户信息
    console.log('查询用户信息, token:', token);
    const user = await db
      .collection('users')
      .where({
        token: token,
      })
      .get();

    if (user.data.length === 0) {
      console.log('未找到用户信息');
      return {
        code: -1,
        message: '无效的用户凭证',
      };
    }

    const openid = user.data[0].openid;
    console.log('找到用户openid:', openid);

    // 确保user_shares集合存在
    try {
      console.log('检查user_shares集合是否存在');
      await db.collection('user_shares').count();
      console.log('user_shares集合存在');
    } catch (error) {
      if (error.message.includes('not found collection')) {
        console.log('集合不存在，创建user_shares集合');
        try {
          await db.createCollection('user_shares');
          console.log('user_shares集合创建成功');
        } catch (createError) {
          console.error('创建集合失败:', createError);
          // 继续执行，不中断流程
        }
      } else {
        console.error('检查集合存在性时出错:', error);
        // 继续执行，不中断流程
      }
    }

    // 获取当天的开始时间和结束时间
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    console.log('当天时间范围:', startOfDay, '至', endOfDay);

    // 检查用户今日是否已经分享
    console.log('查询用户今日是否已分享');
    let shareRecord;
    try {
      shareRecord = await db
        .collection('user_shares')
        .where({
          openid: openid,
          shareDate: db.command.gte(startOfDay).and(db.command.lte(endOfDay)),
        })
        .get();
      console.log('查询分享记录成功:', JSON.stringify(shareRecord.data));
    } catch (queryError) {
      console.error('查询分享记录失败:', queryError);
      // 如果查询失败，假设用户未分享
      shareRecord = { data: [] };
    }

    // 打印日志
    console.log('event.checkOnly:', event.checkOnly, '分享记录:', JSON.stringify(shareRecord.data));
    
    // 如果已经有分享记录，则不再添加
    if (shareRecord.data && shareRecord.data.length > 0) {
      // 查询今日已使用次数以更新使用情况
      if (!event.checkOnly) {
        const usedCount = await getUsedCount(db, openid, startOfDay, endOfDay);
        const baseLimit = 1;

        console.log('用户已分享过，返回已分享信息:', usedCount);
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
              remaining: Math.max(0, 2 - usedCount),
            },
          },
        };
      } else {
        console.log('checkOnly模式，返回已分享信息');
        return {
          code: 0,
          message: '您今日已分享过，已获得额外使用次数',
          data: {
            already_shared: true,
          },
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
          already_shared: false,
        },
      };
    }

    // 添加分享记录
    try {
      console.log('添加分享记录开始，用户openid:', openid);
      const addResult = await db.collection('user_shares').add({
        openid,
        shareDate: Date.now(),
        shareType: event.shareType || 'wechat', // 分享类型，默认微信
        shareContent: event.shareContent || 'prediction' // 分享内容，默认预测结果
      });
      console.log('添加分享记录成功，结果:', JSON.stringify(addResult));
    } catch (addError) {
      console.error('添加分享记录失败:', addError);
      // 继续执行，不中断流程
    }

    // 查询今日已使用次数以更新使用情况
    const usedCount = await getUsedCount(db, openid, startOfDay, endOfDay);
    const baseLimit = 1;

    console.log('用户分享成功，返回分享成功信息');
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
          remaining: Math.max(0, 2 - usedCount),
        },
      },
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
    console.log('获取用户使用次数');
    const todayRecords = await db
      .collection('prediction_records')
      .where({
        openid: openid,
        createTime: db.command.gte(startOfDay).and(db.command.lte(endOfDay)),
      })
      .count();

    console.log('用户使用次数查询结果:', JSON.stringify(todayRecords));
    return todayRecords.total || 0;
  } catch (error) {
    console.error('获取使用次数失败:', error);
    return 0;
  }
}
