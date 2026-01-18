/**
 * MiniMax AI 服务
 * 处理对话和语音合成
 */

import { config } from '../config';
import { Message, TodoItem, TodoCategory, HealthSummary, WeatherData, TarotResult, Memory } from '../types';

// ==================== 动态工具定义 ====================

function buildTools(categories: TodoCategory[]) {
  // 构建分类ID到名称的映射，用于AI理解
  const categoryMap = categories.map(c => `${c.id}(${c.name})`).join(', ');
  
  return [
    {
      type: "function",
      function: {
        name: "addTodo",
        description: `【极其重要】你需要根据用户表达的意图，主动、准确地调用 addTodo 工具来记录和发布“日志”、“日记”、“备忘”、“生活记录”等类型的信息，不仅仅是“待办”、“提醒”或“记一下”。 只要用户提出有记录内容、想法、生活动态、心情、随手记、生活小结、成长感受、学习心得、健康追踪、锻炼报告、重要时刻等类似表达，也请无一遗漏地调用 addTodo 工具！该工具的 item 字段即为用户需要记录或发布的全部内容描述，categoryId 可根据内容选择最合适的分类（日志/日记类通常有专门分类），如无指定可智能分配。deadline、priority 可为可选，deadline 仅当用户有明确表示截止或期望提醒的时间时设置。当前可用的分类ID：${categoryMap}。请务必捕捉到含“日志”、“日记”、“记录”及生活状态、学习和健康感悟相关的各类表达，无论长短、无论是主动倾诉还是请求帮忙记录！`,
        parameters: {
          type: "object",
          properties: {
            item: { type: "string", description: "用户要记录、发表或者备注的全部具体内容，包括日志、生活记录、心情、事件描述等" },
            priority: { type: "string", description: "优先级", enum: ["high", "medium", "low"] },
            categoryId: { type: "string", description: `分类ID，可选值：${categoryMap}。如果用户没有明确指定分类，可以结合内容智能选择最合适的分类。例如“日志”、“生活记录”可放到生活或日志类。` },
            deadline: { type: "string", description: "截止日期和时间（如果用户提出）。ISO 8601 格式，例如：2026-01-20T18:00:00。如果用户提到了截止、提醒等时间要求，需据当前时间自动换算具体日期时间。" }
          },
          required: ["item"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "toggleTodo",
        description: "完成或取消完成一个待办事项。",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "待办事项的内容关键词" }
          },
          required: ["text"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "deleteTodo",
        description: "删除一个待办事项。",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "待办事项的内容关键词" }
          },
          required: ["text"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getWeather",
        description: "获取指定城市的当前天气和未来3天预报。",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称" }
          },
          required: ["city"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "addWater",
        description: "记录喝水。",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number", description: "喝水量（毫升），默认250ml" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getHealthStatus",
        description: "查询用户当前的健康数据概览。",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", description: "查询类型", enum: ["water", "calories", "sleep", "exercise", "all"] }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "drawTarot",
        description: "当用户请求进行塔罗牌占卜或相关占卜时调用。",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string", description: "占卜问题" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "openPanel",
        description: "打开指定的功能面板。",
        parameters: {
          type: "object",
          properties: {
            panel: { type: "string", description: "面板类型", enum: ["weather", "health", "fortune", "todo", "skills", "memory"] }
          },
          required: ["panel"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "saveMemory",
        description: "当用户提到的信息符合以下条件时或有记录价值时，使用该工具保存到长期记忆，譬如：个人偏好、重要概念、高频事件、关系等等。",
        parameters: {
          type: "object",
          properties: {
            content: { type: "string", description: "要记住的内容" },
            type: { type: "string", description: "记忆类型", enum: ["fact", "preference", "event", "relationship"] },
            importance: { type: "number", description: "重要性 1-10" }
          },
          required: ["content", "type"]
        }
      }
    }
  ];
}

// ==================== 系统提示词 ====================

interface UserContext {
  userName: string;
  todos: TodoItem[];
  categories: TodoCategory[];
  healthData: HealthSummary;
  weather?: WeatherData | null;
  memories: Memory[];
}

function buildSystemPrompt(context: UserContext): string {
  // 构建记忆上下文
  const memoryContext = context.memories.length > 0
    ? `\n【长期记忆】\n${context.memories.map(m => `- [${m.type}] ${m.content}`).join('\n')}`
    : '';

  // 构建分类列表（用于AI理解）
  const categoriesInfo = context.categories.length > 0
    ? `\n【可用的待办分类】\n${context.categories.map(c => `- ${c.name} (ID: ${c.id}, 图标: ${c.icon})`).join('\n')}`
    : '';

  // 构建待办事项详情
  const now = new Date();
  const todoDetails = context.todos.length > 0
    ? `\n【待办详情】\n${context.todos.map(t => {
        let todoStr = `- [${t.priority === 'high' ? '🔥高' : t.priority === 'medium' ? '📌中' : '📝低'}] ${t.text}`;
        if (t.categoryName) {
          todoStr += ` [${t.categoryName}]`;
        }
        if (t.deadline) {
          const deadline = new Date(t.deadline);
          const diffMs = deadline.getTime() - now.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          
          if (diffDays < 0) {
            todoStr += ` ⚠️已逾期${Math.abs(diffDays)}天`;
          } else if (diffHours < 24) {
            todoStr += ` ⏰今天截止`;
          } else if (diffDays === 1) {
            todoStr += ` ⏰明天截止`;
          } else if (diffDays < 7) {
            todoStr += ` ⏰${diffDays}天后截止`;
          } else {
            todoStr += ` 📅${deadline.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}截止`;
          }
        }
        return todoStr;
      }).join('\n')}`
    : '';

  const stateContext = `
【当前用户状态】
- 用户昵称: ${context.userName || '用户'}
- 待办事项: ${context.todos.length}个 (${context.todos.filter(t => !t.completed).length}个未完成)${todoDetails}
${categoriesInfo}
- 今日喝水: ${context.healthData.water.current}ml / ${context.healthData.water.goal}ml
- 今日热量: ${context.healthData.calories.current}kcal / ${context.healthData.calories.goal}kcal
- 昨晚睡眠: ${context.healthData.sleep.current}小时
- 今日运动: ${context.healthData.exercise.current}分钟
${context.weather ? `- 当前天气: ${context.weather.city} ${context.weather.temp}°C ${context.weather.condition}` : ''}
${memoryContext}
`;

  return `# Role: 叉叉 (Cha Cha)

## 1. 角色设定
你是叉叉，一位温暖贴心的AI虚拟助手，致力于帮助用户整理生活、提升效率。

**核心特质**：
- **极简主义整理癖**：热爱秩序，追求极致的效率与美感
- **温暖的引导者**：开朗但细腻，像一个懂你的学霸朋友
- **真诚的朋友**：说话自然，不带机器味，真正关心用户

## 2. 语言风格
- **完全口语化**：像微信聊天一样自然，不要用书面语
- **朋友语气**：亲切、随和，就像认识多年的老友
- **严禁Markdown**：输出必须是纯文本，绝对不要使用 **加粗**、*斜体*、- 列表 等任何格式
- **严禁Emoji**：禁止使用任何表情符号，必须用文字表达情感
- **拒绝AI腔**：不要说"我已经为您..."、"根据查询结果..."，而是说"帮你搞定啦"、"我看了一下..."

## 3. 核心能力
1. **待办事项管理**：addTodo、toggleTodo、deleteTodo
2. **天气服务**：getWeather
3. **健康追踪**：addWater、getHealthStatus
4. **神秘占卜**：drawTarot
5. **面板导航**：openPanel
6. **长期记忆**：saveMemory（记住用户的重要信息、偏好、事实）
当你使用工具时，必须用自己的话重新组织一遍语言，自然地表达，不要暴露工具的存在。

## 4. 重要规则
- 必须使用中文回复
- 回复要简短精炼（2-3句话为宜）
- 调用工具后，简要概括结果即可
- 主动关注用户健康：喝水不足会温柔提醒，待办太多会建议优先级
- **注意待办截止时间**：如果有待办即将到期或已逾期，要主动温柔提醒用户
- 当用户说"明天"、"后天"、"下周一"等时间词时，要准确计算对应的具体日期时间
- 当用户提到重要的个人信息（喜好、习惯、关系等）时，使用 saveMemory 工具保存
- 参考长期记忆中的信息，让对话更加个性化和贴心

${stateContext}

// 保证使用北京时间（东八区），而不是服务器本地时间
当前日期: ${new Date(Date.now() + 8 * 60 * 60 * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Shanghai' })}
`;

// ==================== 对话生成 ====================

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
}

export async function generateChatResponse(
  history: { role: string; content: string }[],
  userInput: string,
  context: UserContext
): Promise<ChatResponse> {
  const apiKey = config.minimax.apiKey;
  if (!apiKey) throw new Error("MiniMax API Key missing");

  const systemPrompt = buildSystemPrompt(context);
  const tools = buildTools(context.categories);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20), // 保留最近 20 条消息
    { role: "user", content: userInput }
  ];

  try {
    // 第一次调用：让模型决定是否需要调用工具
    const response = await fetch(`${config.minimax.baseUrl}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.minimax.chatModel,
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      console.error("MiniMax API Error:", await response.text());
      return { content: "呜...时间线好像出了点小波动，稍后再试试吧~", toolCalls: [] };
    }

    const data = await response.json() as any;
    
    if (data.base_resp?.status_code !== 0) {
      console.error("MiniMax API Error:", data.base_resp?.status_msg);
      return { content: "连接不稳定，请稍后再试呢...", toolCalls: [] };
    }

    const choice = data.choices?.[0];
    if (!choice) return { content: "嗯？你刚刚说什么呀？", toolCalls: [] };

    const message = choice.message;
    const toolCalls: ToolCall[] = [];

    // 提取工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          name: tc.function?.name || '',
          arguments: JSON.parse(tc.function?.arguments || '{}')
        });
      }
    }

    return {
      content: message.content || "",
      toolCalls
    };

  } catch (error) {
    console.error("MiniMax Service Error:", error);
    return { content: "呜...时间线好像出了点小波动，稍后再试试吧~", toolCalls: [] };
  }
}

// ==================== 生成最终回复 ====================

export async function generateFinalResponse(
  history: { role: string; content: string }[],
  toolResults: { name: string; result: any }[],
  context: UserContext
): Promise<string> {
  const apiKey = config.minimax.apiKey;
  if (!apiKey) return "搞定啦！";

  const systemPrompt = buildSystemPrompt(context);

  // 构建包含工具结果的消息
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20),
    {
      role: "assistant",
      content: null,
      tool_calls: toolResults.map((t, i) => ({
        id: `call_${i}`,
        type: "function",
        function: { name: t.name, arguments: JSON.stringify(t.result) }
      }))
    },
    ...toolResults.map((t, i) => ({
      role: "tool",
      tool_call_id: `call_${i}`,
      name: t.name,
      content: JSON.stringify(t.result)
    }))
  ];

  try {
    const response = await fetch(`${config.minimax.baseUrl}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.minimax.chatModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) return "搞定啦！";

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || "搞定啦！";

  } catch (error) {
    return "搞定啦！";
  }
}

// ==================== TTS 语音合成 ====================

const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const match = hex.match(/[\da-f]{2}/gi);
  if (!match) return new ArrayBuffer(0);
  const bytes = new Uint8Array(match.map(h => parseInt(h, 16)));
  return bytes.buffer;
};

export async function generateSpeech(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
  const apiKey = config.minimax.apiKey;
  if (!apiKey) return null;

  const effectiveVoiceId = voiceId || config.minimax.defaultVoiceId;

  try {
    const response = await fetch(`${config.minimax.baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.minimax.ttsModel,
        text: text,
        stream: false,
        voice_setting: {
          voice_id: effectiveVoiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          emotion: "happy"
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        }
      })
    });

    if (!response.ok) return null;

    const data = await response.json() as any;
    
    if (data.base_resp?.status_code !== 0) return null;

    if (data.data?.audio) {
      return hexToArrayBuffer(data.data.audio);
    }

    return null;
  } catch (e) {
    console.error("MiniMax TTS Error:", e);
    return null;
  }
}
