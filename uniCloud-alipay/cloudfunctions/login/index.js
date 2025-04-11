'use strict';

const db = uniCloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
	const { code, userInfo } = event;
	
	try {
		// 获取微信openid
		const wxContext = await uniCloud.getWXContext();
		const { OPENID } = wxContext;
		
		if (!OPENID) {
			return {
				code: -1,
				message: '获取用户标识失败'
			}
		}
		
		// 查询用户是否存在
		let user = await usersCollection.where({
			openid: OPENID
		}).get();
		
		if (user.data.length === 0) {
			// 新用户，创建用户记录
			user = await usersCollection.add({
				openid: OPENID,
				nickName: userInfo.nickName,
				avatarUrl: userInfo.avatarUrl,
				gender: userInfo.gender,
				createTime: Date.now(),
				lastLoginTime: Date.now()
			});
		} else {
			// 更新用户信息
			await usersCollection.doc(user.data[0]._id).update({
				nickName: userInfo.nickName,
				avatarUrl: userInfo.avatarUrl,
				gender: userInfo.gender,
				lastLoginTime: Date.now()
			});
		}
		
		// 生成token
		const token = uniCloud.getToken({
			openid: OPENID
		});
		
		return {
			code: 0,
			message: '登录成功',
			data: {
				token,
				userInfo: {
					openid: OPENID,
					nickName: userInfo.nickName,
					avatarUrl: userInfo.avatarUrl,
					gender: userInfo.gender
				}
			}
		}
		
	} catch (error) {
		console.error('登录失败：', error);
		return {
			code: -1,
			message: '登录失败'
		}
	}
}; 
