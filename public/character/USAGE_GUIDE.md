# 叉叉角色动作使用指南

本指南说明如何在项目中使用新的透明背景角色动作视频。

## 📦 已完成的更新

✅ 所有视频已转换为透明背景 WebM 格式  
✅ `config/characterConfig.ts` 已更新视频路径  
✅ `services/characterStateMachine.ts` 已更新默认配置  
✅ 清理了所有旧的 MP4 文件  

---

## 🎬 基础使用

### 1. 使用默认配置

默认配置使用 `action_*.webm` 系列作为基础状态：

```typescript
import { VideoAvatar } from './components/VideoAvatar';
import { createCustomConfig } from './config/characterConfig';

function App() {
  return (
    <VideoAvatar 
      config={createCustomConfig()} 
      autoPlay={true}
    />
  );
}
```

### 2. 视频状态映射

当前默认映射关系：

| 状态 | 视频文件 | 说明 |
|------|---------|------|
| `IDLE_CENTER` | `action_1.webm` | 中间待机（循环） |
| `TRANS_CENTER_TO_LEFT` | `action_2.webm` | 中间→左边过渡 |
| `IDLE_LEFT` | `action_3.webm` | 左边待机（循环） |
| `TRANS_LEFT_TO_CENTER` | `action_4.webm` | 左边→中间过渡 |
| `ACTION_SPEAKING` | `action_5.webm` | 说话动作 |

---

## 🎭 使用情绪和活动动作

### 方式一：使用扩展配置

使用 `createEmotionalConfig()` 获得包含所有情绪的完整配置：

```typescript
import { VideoAvatar } from './components/VideoAvatar';
import { createEmotionalConfig } from './config/characterConfig';

function App() {
  const videoAvatarRef = useRef<VideoAvatarRef>(null);

  const handleEmotionClick = (emotion: string) => {
    // 播放情绪动作
    videoAvatarRef.current?.playAction(emotion);
  };

  return (
    <div>
      <VideoAvatar 
        ref={videoAvatarRef}
        config={createEmotionalConfig()} 
        autoPlay={true}
      />
      
      <button onClick={() => handleEmotionClick('ACTION_HAPPY')}>
        开心
      </button>
      <button onClick={() => handleEmotionClick('ACTION_EXCITED')}>
        激动
      </button>
      <button onClick={() => handleEmotionClick('ACTION_SINGING')}>
        唱歌
      </button>
    </div>
  );
}
```

### 方式二：动态添加自定义动作

```typescript
import { VideoStateID } from './services/characterStateMachine';
import { createCustomConfig } from './config/characterConfig';

const customConfig = createCustomConfig();

// 添加自定义情绪动作
customConfig.states.set('EMOTION_HAPPY' as VideoStateID, {
  stateID: 'EMOTION_HAPPY' as VideoStateID,
  videoSource: '/character/happy.webm',
  isLoop: false,
  nextStateID: VideoStateID.IDLE_CENTER,
  preloadStates: [VideoStateID.IDLE_CENTER],
});

// 在组件中使用
<VideoAvatar config={customConfig} />
```

---

## 🎨 可用的情绪和动作

### 情绪表达类

```typescript
const emotions = {
  HAPPY: '/character/happy.webm',           // 开心/增加好感度
  EXCITED: '/character/excited.webm',       // 激动/兴奋
  RAGE: '/character/rage.webm',             // 愤怒/无能狂怒
  SCARED: '/character/scared.webm',         // 害怕/恐惧
  DISAPPROVE: '/character/disapprove.webm', // 不认可/拒绝
};
```

### 娱乐活动类

```typescript
const activities = {
  SINGING: '/character/singing.webm',              // 唱歌
  LISTENING_MUSIC: '/character/listening_music.webm', // 听音乐
  JUMP: '/character/jump.webm',                    // 跳跃
};
```

### 日常活动类

```typescript
const dailyActions = {
  USING_PHONE: '/character/using_phone.webm',       // 玩手机
  CHECKING_PHONE: '/character/checking_phone.webm', // 查询手机
  TAKING_NOTES: '/character/taking_notes.webm',    // 记笔记
};
```

### 默认待机

```typescript
const idle = {
  DEFAULT: '/character/idle.webm', // 默认待机动画
};
```

---

## 💡 实际应用场景

### 场景1：根据对话情绪触发动作

```typescript
const handleAIResponse = (response: string, sentiment: string) => {
  // 根据情感分析结果播放对应动作
  const emotionMap = {
    'positive': 'ACTION_HAPPY',
    'excited': 'ACTION_EXCITED',
    'negative': 'ACTION_DISAPPROVE',
    'angry': 'ACTION_RAGE',
  };
  
  const action = emotionMap[sentiment];
  if (action) {
    videoAvatarRef.current?.playAction(action);
  }
};
```

### 场景2：工具面板交互

```typescript
const handleToolClick = (toolName: string) => {
  const toolActions = {
    'todo': 'ACTION_NOTES',        // 打开待办 → 记笔记动作
    'music': 'ACTION_LISTENING',   // 打开音乐 → 听音乐动作
    'phone': 'ACTION_CHECK_PHONE', // 打开手机 → 查询手机动作
  };
  
  const action = toolActions[toolName];
  if (action) {
    videoAvatarRef.current?.playAction(action);
  }
  
  // 打开对应面板
  setActivePanel(toolName);
};
```

### 场景3：随机待机动作

```typescript
useEffect(() => {
  const idleActions = [
    'ACTION_LISTENING',
    'ACTION_PHONE',
    'EMOTION_HAPPY',
  ];
  
  const interval = setInterval(() => {
    // 每30秒随机播放一个待机动作
    const randomAction = idleActions[
      Math.floor(Math.random() * idleActions.length)
    ];
    videoAvatarRef.current?.playAction(randomAction);
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 🔧 高级自定义

### 创建完全自定义的配置

```typescript
import { StateMachineConfig, VideoStateID } from './services/characterStateMachine';

export function createMyCustomConfig(): StateMachineConfig {
  const states = new Map();
  
  // 使用 idle.webm 作为主要待机状态
  states.set(VideoStateID.IDLE_CENTER, {
    stateID: VideoStateID.IDLE_CENTER,
    videoSource: '/character/idle.webm',
    isLoop: true,
    nextStateID: null,
    preloadStates: ['ACTION_HAPPY', 'ACTION_EXCITED'],
  });
  
  // 添加多个情绪状态
  states.set('ACTION_HAPPY' as VideoStateID, {
    stateID: 'ACTION_HAPPY' as VideoStateID,
    videoSource: '/character/happy.webm',
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
  });
  
  // ... 继续添加更多状态
  
  return {
    states,
    initialState: VideoStateID.IDLE_CENTER,
    defaultIdleState: VideoStateID.IDLE_CENTER,
  };
}
```

---

## 📝 注意事项

1. **透明背景支持**：所有 `.webm` 文件都包含 Alpha 通道，可以直接在任何背景上使用
2. **文件大小**：单个视频文件约 1.5MB - 5MB，注意预加载策略
3. **浏览器兼容性**：WebM VP9 格式在现代浏览器中支持良好
4. **循环 vs 单次**：
   - 待机动作（idle）应设置 `isLoop: true`
   - 情绪/活动动作应设置 `isLoop: false` 并指定 `nextStateID`

---

## 🎯 快速参考

| 动作类型 | 文件名 | 用途场景 |
|---------|--------|---------|
| 默认待机 | `idle.webm` | 主要循环待机 |
| 开心 | `happy.webm` | 正面反馈、好评 |
| 激动 | `excited.webm` | 惊喜、兴奋时刻 |
| 愤怒 | `rage.webm` | 错误、失败提示 |
| 害怕 | `scared.webm` | 警告、危险提示 |
| 不认可 | `disapprove.webm` | 否定、拒绝操作 |
| 唱歌 | `singing.webm` | 音乐相关功能 |
| 听音乐 | `listening_music.webm` | 播放音乐时 |
| 跳跃 | `jump.webm` | 成功庆祝 |
| 玩手机 | `using_phone.webm` | 手机相关功能 |
| 查询手机 | `checking_phone.webm` | 搜索、查询时 |
| 记笔记 | `taking_notes.webm` | 待办、笔记功能 |

---

**更新日期**: 2026-01-17  
**配置文件**: `config/characterConfig.ts`  
**详细清单**: `VIDEO_ACTIONS.md`
