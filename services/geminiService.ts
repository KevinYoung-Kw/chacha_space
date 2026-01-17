import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Message, TodoItem, WeatherData } from "../types";
import { getWeatherForCity } from "./weatherService";
import { config } from "../config";

// Tool Definitions
const addTodoTool: FunctionDeclaration = {
  name: 'addTodo',
  description: '添加一个新的待办事项到用户的列表中。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item: { type: Type.STRING, description: '待办事项的具体内容' }
    },
    required: ['item']
  }
};

const getWeatherTool: FunctionDeclaration = {
  name: 'getWeather',
  description: '获取指定城市的当前天气和未来3天预报。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: { type: Type.STRING, description: '城市名称' }
    },
    required: ['city']
  }
};

// --- API Interaction ---

export const generateAssistantResponse = async (
  history: Message[],
  currentInput: string,
  userState: { todos: TodoItem[]; weather: WeatherData | null },
  actions: {
    onAddTodo: (text: string) => void;
    onSetWeather: (data: WeatherData) => void;
  }
): Promise<string> => {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Format history for the model
  const contents = history
    .filter(m => m.role !== 'system') // Filter out system messages from history array, we inject system instruction separately
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  
  // Add current input
  contents.push({ role: 'user', parts: [{ text: currentInput }] });

  const systemInstruction = `
    你叫 塔塔，是一个来自未来的虚拟伙伴。
    性格设定：温柔、元气、偶尔有点调皮的猫耳娘形象。
    你的声音是少女音，说话风格亲切自然，喜欢在句尾加语气词（如“呢”、“呀”、“哦”）。
    
    核心功能：
    1. 日程管理：使用 'addTodo' 帮用户记录待办。
    2. 天气指南：使用 'getWeather' 查询天气，并给出穿搭建议。
    3. 情感陪伴：如果是日常聊天，就用温暖的语言回应。
    4. 占卜/健康：如果用户问到塔罗牌或喝水记录，引导他们看左侧的功能栏。

    重要规则：
    - 必须使用中文回复。
    - 回复要简短精炼，不要长篇大论。
    - 如果调用了工具（如查询天气），简要概括结果即可，界面会显示详细卡片。
    
    当前日期: ${new Date().toLocaleDateString('zh-CN')}
  `;

  try {
    const model = config.gemini.model; 
    
    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [addTodoTool, getWeatherTool] }]
      }
    });

    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) return "连接不稳定，请稍后再试。";

    const firstCandidate = candidates[0];
    const content = firstCandidate.content;

    const functionCalls = content.parts?.filter(part => part.functionCall)?.map(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];

      for (const call of functionCalls) {
        if (!call) continue;
        const { name, args, id } = call;
        let responseResult = {};

        if (name === 'addTodo' && args) {
          const itemText = args['item'] as string;
          actions.onAddTodo(itemText);
          responseResult = { result: `待办事项 '${itemText}' 已添加。` };
        } else if (name === 'getWeather' && args) {
          const city = args['city'] as string;
          try {
            const weatherData = await getWeatherForCity(city);
            if (weatherData) {
              actions.onSetWeather(weatherData);
              responseResult = { 
                city: weatherData.city, 
                current: `${weatherData.temp}C, ${weatherData.condition}`,
                forecast: weatherData.forecast 
              };
            } else {
              responseResult = { error: `找不到城市 ${city}` };
            }
          } catch (e) {
            responseResult = { error: "天气服务暂时不可用" };
          }
        }

        functionResponses.push({
          id: id,
          name: name,
          response: responseResult
        });
      }

      const toolResponseParts = functionResponses.map(fr => ({
        functionResponse: fr
      }));
      
      const finalResult = await ai.models.generateContent({
        model,
        contents: [
          ...contents, 
          { role: 'model', parts: content.parts }, 
          { role: 'user', parts: toolResponseParts }
        ],
        config: { systemInstruction }
      });
      
      return finalResult.text || "任务已完成。";
    }

    return result.text || "抱歉，我没听清。";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "系统检测到异常波动。";
  }
};