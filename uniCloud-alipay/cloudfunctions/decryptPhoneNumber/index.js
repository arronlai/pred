'use strict';

const crypto = require('crypto');

exports.main = async (event, context) => {
    try {
        const { encryptedData, iv } = event;
        
        // 获取微信上下文
        let sessionKey = '';
        
        try {
            if (context.PLATFORM === 'mp-weixin') {
                const wxContext = await uniCloud.getWXContext();
                sessionKey = wxContext.SESSIONKEY;
            } else {
                // 测试环境，无法获取真实的sessionKey
                throw new Error('当前环境无法获取会话密钥');
            }
        } catch (err) {
            console.error('获取会话密钥失败:', err);
            
            // 测试环境，返回一个模拟的手机号
            if (process.env.NODE_ENV === 'development' || !context.PLATFORM) {
                return {
                    code: 0,
                    message: '开发环境模拟手机号',
                    data: {
                        phoneNumber: '13812345678'
                    }
                };
            }
            
            throw err;
        }

        // 如果没有获取到sessionKey，抛出错误
        if (!sessionKey) {
            throw new Error('未能获取到会话密钥');
        }

        // 解密数据
        const decipher = crypto.createDecipheriv(
            'aes-128-cbc',
            Buffer.from(sessionKey, 'base64'),
            Buffer.from(iv, 'base64')
        );
        
        let decrypted = decipher.update(encryptedData, 'base64', 'utf-8');
        decrypted += decipher.final('utf-8');
        
        const result = JSON.parse(decrypted);
        
        return {
            code: 0,
            message: '解密成功',
            data: {
                phoneNumber: result.phoneNumber
            }
        };
    } catch (error) {
        console.error('解密手机号失败:', error);
        
        // 测试环境返回模拟手机号
        if (process.env.NODE_ENV === 'development' || !context.PLATFORM) {
            return {
                code: 0,
                message: '开发环境模拟手机号',
                data: {
                    phoneNumber: '13812345678'
                }
            };
        }
        
        return {
            code: -1,
            message: '解密手机号失败: ' + error.message
        };
    }
}; 
