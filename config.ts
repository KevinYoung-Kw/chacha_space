
export const config = {
  // ❌ Gemini 已停用
  gemini: {
    apiKey: '',
    model: '',
    enabled: false,
  },
  minimax: {
    // API Keys
    apiKey: process.env.MINIMAX_API_KEY || 'sk-api-jerx1a3xXINcSU-nmmLE5sK6j7cwu2LvwwsYbk2Kui1bcVerTrr3PcQrhOW6gSsCydxc06VNJGYWAHbb3tmhbZAFr2WEF1jl5wH1YaQcHpcf_9x8ZI-PGrU',
    groupId: process.env.MINIMAX_GROUP_ID || '1932618899182854805',
    
    // 聊天模型（底模）
    chatModel: 'MiniMax-M2.1',
    
    // 语音模型
    ttsModel: 'speech-2.6-hd',
    voiceId: 'female-shaonv',
    
    // API 端点
    baseUrl: 'https://api.minimaxi.com',
  },
  amap: {
    apiKey: process.env.AMAP_KEY || '8afcae406080f279763dae779b6d9b74',
    baseUrl: 'https://restapi.amap.com/v3'
  }
};
