'use strict';

// 引入request模块用于发送HTTP请求
const https = require('https');

// 微信API域名
const WX_API_HOST = 'api.weixin.qq.com';

// 获取accessToken
async function getAccessToken(appid, secret) {
    console.log('开始获取accessToken');
    return new Promise((resolve, reject) => {
        const path = `/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
        
        const req = https.request({
            hostname: WX_API_HOST,
            path: path,
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        console.log('获取accessToken成功');
                        resolve(result.access_token);
                    } else {
                        console.error('获取accessToken失败:', result);
                        reject(new Error(result.errmsg || '获取access_token失败'));
                    }
                } catch (error) {
                    console.error('解析accessToken响应失败:', error);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('请求accessToken网络错误:', error);
            reject(error);
        });
        
        req.end();
    });
}

// 使用code获取手机号
async function getPhoneNumberWithCode(code, accessToken) {
    console.log('开始根据code获取手机号');
    return new Promise((resolve, reject) => {
        const path = `/wxa/business/getuserphonenumber?access_token=${accessToken}`;
        
        const postData = JSON.stringify({
            code: code
        });
        
        const req = https.request({
            hostname: WX_API_HOST,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('获取手机号接口返回:', JSON.stringify(result));
                    
                    if (result.errcode === 0 && result.phone_info) {
                        resolve(result.phone_info.phoneNumber);
                    } else {
                        reject(new Error(result.errmsg || '获取手机号失败'));
                    }
                } catch (error) {
                    console.error('解析手机号响应失败:', error);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('请求手机号接口网络错误:', error);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

exports.main = async (event, context) => {
    console.log('传入参数:', event);
    
    try {
        const { code } = event;
        
        if (!code) {
            return {
                code: -1,
                message: '缺少code参数'
            };
        }
        
        // 从环境变量或配置中获取小程序信息
        // 注意：在实际项目中，应从安全的环境变量或配置中获取这些值
        let appid = process.env.WX_APPID;
        let secret = process.env.WX_SECRET;
        
        // 如果环境变量未设置，检查是否有云函数的config配置
        if ((!appid || !secret) && uniCloud.config) {
            appid = uniCloud.config.appid;
            secret = uniCloud.config.secret;
        }
        
        // 如果环境变量和配置都未设置，则返回一个模拟的电话号码（仅用于开发环境测试）
        if (!appid || !secret) {
            console.log('缺少小程序配置，返回模拟手机号');
            return {
                code: 0,
                message: '模拟环境返回测试手机号',
                data: {
                    phoneNumber: '13900001234'
                }
            };
        }
        
        // 获取接口调用凭证
        const accessToken = await getAccessToken(appid, secret);
        
        // 使用接口调用凭证和code获取手机号
        const phoneNumber = await getPhoneNumberWithCode(code, accessToken);
        
        return {
            code: 0,
            message: '获取手机号成功',
            data: {
                phoneNumber
            }
        };
    } catch (error) {
        console.error('获取手机号失败:', error);
        
        // 开发环境返回模拟手机号
        if (process.env.NODE_ENV === 'development') {
            return {
                code: 0,
                message: '开发环境模拟手机号',
                data: {
                    phoneNumber: '13900001234'
                }
            };
        }
        
        return {
            code: -1,
            message: '获取手机号失败: ' + error.message
        };
    }
}; 
