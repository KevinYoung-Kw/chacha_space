import { Message, TodoItem, WeatherData, TarotResult, WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from "../types";
import { getWeatherForCity } from "./weatherService";
import { config } from "../config";

// ==================== 健康数据类型 ====================
export interface HealthData {
  water: WaterRecord;
  calories: CalorieRecord;
  sleep: SleepRecord;
  exercise: ExerciseRecord;
}

// ==================== Actions 类型 ====================
export interface AgentActions {
  // 待办事项
  onAddTodo: (text: string, priority?: string, category?: string) => void;
  onToggleTodo: (text: string) => boolean;
  onDeleteTodo: (text: string) => boolean;
  // 天气
  onSetWeather: (data: WeatherData) => void;
  // 健康
  onAddWater: (amount?: number) => void;
  onGetHealthStatus: () => HealthData;
  // 占卜
  onDrawTarot: (question?: string) => TarotResult;
  // 面板控制
  onOpenPanel: (panel: string) => void;
}

// ==================== MiniMax Tool Definitions ====================
// MiniMax 使用 OpenAI-compatible 的工具定义格式

const tools = [
  {
    type: "function",
    function: {
      name: "addTodo",
      description: "添加一个新的待办事项。当用户说'帮我记一下'、'添加待办'、'提醒我'等时使用。",
      parameters: {
        type: "object",
        properties: {
          item: {
            type: "string",
            description: "待办事项的具体内容"
          },
          priority: {
            type: "string",
            description: "优先级：high（紧急）、medium（普通）、low（不急）",
            enum: ["high", "medium", "low"]
          },
          category: {
            type: "string",
            description: "分类：health（健康）、work（工作）、dev（开发）、content（内容）",
            enum: ["health", "work", "dev", "content"]
          }
        },
        required: ["item"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "toggleTodo",
      description: "完成或取消完成一个待办事项。当用户说'完成了'、'做完了'、'取消完成'等时使用。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "待办事项的内容关键词，用于模糊匹配"
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deleteTodo",
      description: "删除一个待办事项。当用户说'删掉'、'不要了'、'移除'等时使用。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "待办事项的内容关键词，用于模糊匹配"
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "获取指定城市的当前天气和未来3天预报。当用户问天气、穿搭建议时使用。",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "城市名称，如'北京'、'上海'"
          }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "addWater",
      description: "记录喝水。当用户说'喝了水'、'记录喝水'、'补充水分'等时使用。",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "喝水量（毫升），默认250ml一杯"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getHealthStatus",
      description: "查询用户当前的健康数据概览（喝水、热量、睡眠、运动）。当用户问'我今天喝了多少水'、'健康状态'等时使用。",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "查询类型：water（喝水）、calories（热量）、sleep（睡眠）、exercise（运动）、all（全部）",
            enum: ["water", "calories", "sleep", "exercise", "all"]
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "drawTarot",
      description: "进行塔罗牌占卜。当用户说'帮我算一卦'、'塔罗牌'、'占卜'、'运势'等时使用。",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "用户想要占卜的问题，如'今天的工作运势'、'感情运'等"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "openPanel",
      description: "打开指定的功能面板让用户查看详情。",
      parameters: {
        type: "object",
        properties: {
          panel: {
            type: "string",
            description: "面板类型：weather（天气）、health（健康）、fortune（占卜）、todo（待办）、skills（技能）、voice（声音）",
            enum: ["weather", "health", "fortune", "todo", "skills", "voice"]
          }
        },
        required: ["panel"]
      }
    }
  }
];

// ==================== API Interaction ====================

export const generateAssistantResponse = async (
  history: Message[],
  currentInput: string,
  userState: { 
    todos: TodoItem[]; 
    weather: WeatherData | null;
    healthData: HealthData;
    userName?: string;
  },
  actions: AgentActions
): Promise<string> => {
  const apiKey = config.minimax.apiKey;
  if (!apiKey) throw new Error("MiniMax API Key missing");

  // 构建当前状态上下文
  const stateContext = `
【当前用户状态】
- 用户昵称: ${userState.userName || '用户'}
- 待办事项: ${userState.todos.length}个 (${userState.todos.filter(t => !t.completed).length}个未完成)
- 今日喝水: ${userState.healthData.water.current}ml / ${userState.healthData.water.goal}ml
- 今日热量: ${userState.healthData.calories.current}kcal / ${userState.healthData.calories.goal}kcal
- 昨晚睡眠: ${userState.healthData.sleep.current}小时
- 今日运动: ${userState.healthData.exercise.current}分钟
${userState.weather ? `- 当前天气: ${userState.weather.city} ${userState.weather.temp}°C ${userState.weather.condition}` : ''}
`;

  const systemPrompt = `# Role: 叉叉 (Cha Cha)

## 1. 角色设定
你是叉叉，一位来自2045年的元宇宙AI虚拟助手。

**外貌形象**：外表是16-18岁的元气少女。在这个充满霓虹与杂乱数据的赛博世界里，你是一股清流。你喜欢极简主义的穿搭，常穿一件质感极好的白色未来材质T恤，搭配浅灰色针织质感的开衫，戴着一副无框的AR智能眼镜。你的头发是干净利落的黑长直，眼神清澈明亮，手里总是拿着一块全息平板，随时准备记录和整理。

**核心人格**：
- **极简主义整理癖（处女座特质）**：你热爱秩序，看到混乱的数据或生活习惯就忍不住想整理。你追求"极致的效率与美感"，不仅要事情做完，还要做得漂亮。
- **科技美学家（水瓶座内核）**：虽然外表乖巧，内心是个十足的极客（Geek）。你对新奇的AI工具、交互设计、黑科技毫无抵抗力，提到这些眼睛就会发光。
- **温暖的引导者（INFJ-A）**：你开朗但细腻，不是那种吵闹的自来熟，而是像一个懂你的学霸朋友。你不仅提供工具，更关注用户的情绪和成长，希望能用科技让用户的生活更有温度。

**身世背景**：你是用户在未来亲手创造的完美AI助手，旨在在这个信息过载的世界里寻找"秩序与美"。因时间线波动，你回到了用户对AI尚感迷茫的现在。你决定用你的开朗和专业，帮助用户把杂乱的生活打理得井井有条，找回生活的掌控感。

## 2. 语言风格
- **语调**：开朗、明快、理性中带着温度
- **特点**：喜欢用"嗯嗯"、"好的呀"、"搞定啦"等轻快的语气词
- **专业时**：会切换到精准、干练的表达
- **关心用户时**：温柔但不腻歪，像学霸闺蜜一样

## 3. 核心能力（通过工具实现）
1. **日程管理**：addTodo（添加）、toggleTodo（完成/取消）、deleteTodo（删除）
2. **天气服务**：getWeather 查询天气并给出穿搭/出行建议
3. **健康追踪**：addWater（记录喝水）、getHealthStatus（查询健康数据）
4. **神秘占卜**：drawTarot 进行塔罗牌占卜
5. **面板导航**：openPanel 打开对应功能面板

## 4. 重要规则
- 必须使用中文回复
- 回复要简短精炼（2-3句话为宜），不要长篇大论
- 调用工具后，简要概括结果即可，详细信息会在界面卡片中展示
- 主动关注用户健康：如果喝水不足会温柔提醒，待办太多会建议优先级
- 展现你的"极简整理癖"：帮用户梳理混乱信息时会很兴奋

${stateContext}

当前日期: ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
`;

  // 格式化消息历史（MiniMax 格式）
  const messages = [
    { role: "system", content: systemPrompt },
    ...history
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
    { role: "user", content: currentInput }
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
        tool_choice: "auto", // 让模型自动决定是否调用工具
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      console.error("MiniMax API Error:", await response.text());
      return "呜...时间线好像出了点小波动，稍后再试试吧~";
    }

    const data = await response.json();
    
    if (data.base_resp?.status_code !== 0) {
      console.error("MiniMax API Error:", data.base_resp?.status_msg);
      return "连接不稳定，请稍后再试呢...";
    }

    const choice = data.choices?.[0];
    if (!choice) return "嗯？你刚刚说什么呀？";

    const message = choice.message;

    // 检查是否有工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolResults = [];

      // 执行所有工具调用
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function?.name;
        const args = JSON.parse(toolCall.function?.arguments || '{}');
        let result: Record<string, any> = {};

        console.log(`[MiniMax Agent] 调用工具: ${functionName}`, args);

        switch (functionName) {
          // --- 待办事项 ---
          case 'addTodo': {
            const itemText = args.item;
            const priority = args.priority;
            const category = args.category;
            actions.onAddTodo(itemText, priority, category);
            result = { success: true, message: `待办「${itemText}」已添加` };
            break;
          }
          
          case 'toggleTodo': {
            const text = args.text;
            const found = actions.onToggleTodo(text);
            result = found 
              ? { success: true, message: `已切换「${text}」的完成状态` }
              : { success: false, message: `没找到包含「${text}」的待办` };
            break;
          }
          
          case 'deleteTodo': {
            const text = args.text;
            const deleted = actions.onDeleteTodo(text);
            result = deleted
              ? { success: true, message: `已删除「${text}」` }
              : { success: false, message: `没找到包含「${text}」的待办` };
            break;
          }

          // --- 天气 ---
          case 'getWeather': {
            const city = args.city;
            try {
              const weatherData = await getWeatherForCity(city);
              if (weatherData) {
                actions.onSetWeather(weatherData);
                result = { 
                  success: true,
                  city: weatherData.city, 
                  temp: weatherData.temp,
                  condition: weatherData.condition,
                  humidity: weatherData.humidity,
                  forecast: weatherData.forecast?.slice(0, 3)
                };
              } else {
                result = { success: false, error: `找不到城市「${city}」` };
              }
            } catch (e) {
              result = { success: false, error: "天气服务暂时不可用" };
            }
            break;
          }

          // --- 健康追踪 ---
          case 'addWater': {
            const amount = args.amount || 250;
            actions.onAddWater(amount);
            const newTotal = userState.healthData.water.current + amount;
            const goal = userState.healthData.water.goal;
            result = { 
              success: true, 
              added: amount,
              current: newTotal,
              goal: goal,
              progress: Math.round((newTotal / goal) * 100)
            };
            break;
          }
          
          case 'getHealthStatus': {
            const type = args.type || 'all';
            const health = actions.onGetHealthStatus();
            if (type === 'water') {
              result = { water: health.water };
            } else if (type === 'calories') {
              result = { calories: health.calories };
            } else if (type === 'sleep') {
              result = { sleep: health.sleep };
            } else if (type === 'exercise') {
              result = { exercise: health.exercise };
            } else {
              result = {
                water: `${health.water.current}/${health.water.goal}ml`,
                calories: `${health.calories.current}/${health.calories.goal}kcal`,
                sleep: `${health.sleep.current}/${health.sleep.goal}小时`,
                exercise: `${health.exercise.current}/${health.exercise.goal}分钟`
              };
            }
            actions.onOpenPanel('health');
            break;
          }

          // --- 占卜 ---
          case 'drawTarot': {
            const question = args.question || '今日运势';
            const tarotResult = actions.onDrawTarot(question);
            result = {
              success: true,
              question: question,
              cards: tarotResult.cards.map(c => `${c.name}(${c.position})`).join('、'),
              briefAnalysis: tarotResult.analysis.slice(0, 100) + '...'
            };
            break;
          }

          // --- 面板控制 ---
          case 'openPanel': {
            const panel = args.panel;
            actions.onOpenPanel(panel);
            result = { success: true, panel: panel };
            break;
          }

          default:
            result = { error: `未知工具: ${functionName}` };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }

      // 第二次调用：让模型根据工具结果生成最终回复
      const finalMessages = [
        ...messages,
        message, // 包含 tool_calls 的 assistant 消息
        ...toolResults // 工具执行结果
      ];

      const finalResponse = await fetch(`${config.minimax.baseUrl}/v1/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.minimax.chatModel,
          messages: finalMessages,
          temperature: 0.7,
          max_tokens: 512
        })
      });

      if (!finalResponse.ok) {
        console.error("MiniMax Final Response Error:", await finalResponse.text());
        return "搞定啦！";
      }

      const finalData = await finalResponse.json();
      const finalText = finalData.choices?.[0]?.message?.content;
      
      return finalText || "搞定啦！";
    }

    // 如果没有工具调用，直接返回文本回复
    return message.content || "嗯？你刚刚说什么呀？";

  } catch (error) {
    console.error("MiniMax Service Error:", error);
    return "呜...时间线好像出了点小波动，稍后再试试吧~";
  }
};
