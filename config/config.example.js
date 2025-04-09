export default {
  // 小程序配置
  appid: process.env.APPID,
  
  // AI API配置
  aiApi: {
    key: process.env.AI_API_KEY,
    url: process.env.AI_API_URL
  },
  
  // 系统配置
  system: {
    env: process.env.NODE_ENV
  }
} 
