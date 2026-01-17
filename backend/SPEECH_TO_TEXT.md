# 语音识别集成指南 - 阶跃星辰

## 当前状态
- ✅ 前端录音功能已实现（使用 MediaRecorder API）
- ✅ 后端 API 接口已创建 (`/api/speech-to-text`)
- ✅ 已集成阶跃星辰语音识别服务

## 阶跃星辰语音识别集成（已完成）

我们已经集成了[阶跃星辰的语音转写 API](https://platform.stepfun.com/docs/zh/api-reference/audio/transcriptions)，使用 `step-asr` 模型。

### 配置步骤

1. **注册并获取 API Key**
   - 访问 https://platform.stepfun.com/
   - 注册账号并登录
   - 进入"开发者中心"获取 API Key

2. **安装依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**

在 `backend/.env` 文件中添加：
```env
STEPFUN_API_KEY=your_stepfun_api_key_here
```

4. **重启后端服务**
```bash
npm run dev
```

### 特点

- ✅ 支持中英文及多种方言
- ✅ 高准确率与低延迟
- ✅ 适用于语音转写、会议记录等场景
- ✅ 支持多种音频格式（webm、wav、mp3、flac、opus）

### API 使用

后端已自动处理音频格式转换，前端录制的 webm 格式会直接发送到阶跃星辰 API 进行识别。

### 备选方案

### 方案1: 讯飞语音识别（推荐）⭐

**优点：** 准确率高，支持实时识别，文档完善

**步骤：**

1. 注册账号：https://www.xfyun.cn/
2. 创建应用，获取 APPID、APISecret、APIKey
3. 安装依赖：
```bash
cd backend
npm install ws crypto
```

4. 更新 `backend/src/routes/stt.ts`：

```typescript
import express from 'express';
import crypto from 'crypto';
import WebSocket from 'ws';
import { auth } from '../middleware/auth';

const router = express.Router();

// 讯飞配置
const XFYUN_CONFIG = {
  APPID: '你的APPID',
  APISecret: '你的APISecret',
  APIKey: '你的APIKey',
};

router.post('/speech-to-text', auth, async (req, res) => {
  try {
    // TODO: 实现讯飞语音识别
    // 参考文档: https://www.xfyun.cn/doc/asr/voicedictation/API.html
    
    res.json({
      success: true,
      text: '识别结果'
    });
  } catch (error: any) {
    console.error('[STT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败'
    });
  }
});

export default router;
```

### 方案2: 百度语音识别

**优点：** 免费额度大，简单易用

**步骤：**

1. 注册账号：https://ai.baidu.com/tech/speech
2. 创建应用，获取 API Key 和 Secret Key
3. 安装依赖：
```bash
cd backend
npm install axios form-data
```

4. 更新 `backend/src/routes/stt.ts`：

```typescript
import express from 'express';
import axios from 'axios';
import { auth } from '../middleware/auth';

const router = express.Router();

// 百度配置
const BAIDU_CONFIG = {
  API_KEY: '你的API_KEY',
  SECRET_KEY: '你的SECRET_KEY',
};

// 获取access_token
async function getAccessToken() {
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_CONFIG.API_KEY}&client_secret=${BAIDU_CONFIG.SECRET_KEY}`;
  const response = await axios.get(url);
  return response.data.access_token;
}

router.post('/speech-to-text', auth, async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    
    // TODO: 调用百度语音识别 API
    // 参考文档: https://ai.baidu.com/ai-doc/SPEECH/Vk38lxily
    
    res.json({
      success: true,
      text: '识别结果'
    });
  } catch (error: any) {
    console.error('[STT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败'
    });
  }
});

export default router;
```

### 方案3: 腾讯云语音识别

**步骤：**

1. 注册账号：https://cloud.tencent.com/product/asr
2. 获取 SecretId 和 SecretKey
3. 安装 SDK：
```bash
cd backend
npm install tencentcloud-sdk-nodejs
```

## 测试

当前使用 mock 数据，点击录音按钮会返回测试文本 "你好，这是测试文本"

集成真实 API 后，即可正常使用语音识别功能。

## 前端变化

前端已切换为基于后端 API 的录音方案：
- 使用 MediaRecorder API 录制音频
- 将音频文件发送到后端 `/api/speech-to-text`
- 后端调用语音识别服务并返回文字
- 前端将文字填入输入框

## 环境变量配置

建议在 `backend/.env` 中配置 API 密钥：

```env
# 讯飞语音识别
XFYUN_APPID=你的APPID
XFYUN_API_SECRET=你的APISecret
XFYUN_API_KEY=你的APIKey

# 或 百度语音识别
BAIDU_API_KEY=你的API_KEY
BAIDU_SECRET_KEY=你的SECRET_KEY
```

然后在代码中使用 `process.env.XFYUN_APPID` 等方式读取。
