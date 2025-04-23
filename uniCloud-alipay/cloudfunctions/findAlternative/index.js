'use strict';

const db = uniCloud.database();

// 判断是否为URL
function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// 从URL中提取商品信息
async function extractProductInfo(url) {
  try {
    // 这里需要根据不同的电商平台实现不同的解析逻辑
    // 以淘宝为例
    if (true) {
      const response = await fetch(url);
      console.log('res', response);
      const data = await response.json();
      console.log('data', data);
      
      // 使用正则表达式提取商品信息
      const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
      const priceMatch = response.data.match(/"price":"(\d+\.?\d*)"/);
      const imageMatch = response.data.match(/"pic_url":"(.*?)"/);

      // 提取商品特性
      const features = [];
      const featureRegex = /"props":\[(.*?)\]/;
      const featureMatch = response.data.match(featureRegex);
      if (featureMatch) {
        const props = featureMatch[1].split(',');
        props.forEach((prop) => {
          const [name, value] = prop.split(':');
          if (name && value) {
            features.push({
              name: name.trim().replace(/"/g, ''),
              value: value.trim().replace(/"/g, ''),
            });
          }
        });
      }

      return {
        name: titleMatch ? titleMatch[1] : '未知商品',
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        image: imageMatch ? imageMatch[1] : '',
        features,
      };
    }
    // 可以添加其他电商平台的解析逻辑
    return null;
  } catch (error) {
    console.error('解析商品信息失败:', error);
    return null;
  }
}

// 使用AI查找平替商品
async function findAlternativeProducts(productInfo) {
  try {
    // 调用AI服务查找平替商品
    const result = await uniCloud.callFunction({
      name: 'aiService',
      data: {
        type: 'findAlternative',
        product: productInfo,
      },
    });

    if (result.result && result.result.code === 0) {
      return result.result.data;
    }
    return null;
  } catch (error) {
    console.error('查找平替商品失败:', error);
    return null;
  }
}

exports.main = async (event, context) => {
  const { product } = event;

  try {
    let productInfo;

    // 判断输入是URL还是商品名称
    if (isUrl(product)) {
      // 从URL提取商品信息
      productInfo = await extractProductInfo(product);
      if (!productInfo) {
        return {
          code: -1,
          message: '无法解析商品链接，请检查链接是否正确',
        };
      }
    } else {
      // 使用商品名称搜索
      productInfo = {
        name: product,
        price: 0, // 需要从搜索结果中获取
        image: '', // 需要从搜索结果中获取
        features: [], // 需要从搜索结果中获取
      };
    }

    // 查找平替商品
    const alternatives = await findAlternativeProducts(productInfo);
    if (!alternatives) {
      return {
        code: -1,
        message: '查找平替商品失败',
      };
    }

    return {
      code: 0,
      data: {
        original: {
          name: productInfo.name,
          price: productInfo.price,
          image: productInfo.image,
        },
        alternatives: alternatives.alternatives.map((alt) => ({
          name: alt.name,
          price: alt.price,
          image: alt.image,
          savings: productInfo.price - alt.price,
        })),
        comparison: alternatives.comparison,
      },
    };
  } catch (error) {
    console.error('处理失败:', error);
    return {
      code: -1,
      message: error.message || '处理失败',
    };
  }
};
