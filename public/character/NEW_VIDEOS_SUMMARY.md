# 新增视频总结

本文档记录了从中文命名的 MP4 文件转换为 WebM 格式的所有新增视频。

## 转换命令

所有视频使用以下 ffmpeg 命令转换：

```bash
ffmpeg -i input.mp4 -filter_complex "[0:v]colorkey=0x00FF00:0.35:0.15,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 2M -c:a libopus output.webm
```

## 新增视频列表 (共13个)

### 天气相关 (Weather)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 天气.mp4 | weather.webm | weather | ACTION_WEATHER | 天气展示动画 |

### 技能相关 (Skills)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 技能.mp4 | skill.webm | skill | ACTION_SKILL | 技能展示动画 |

### 风相关 (Wind)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 有风吹过.mp4 | wind_blowing.webm | wind_blowing | ACTION_WIND_BLOWING | 微风吹拂动画 |
| 大风吹过.mp4 | strong_wind.webm | strong_wind | ACTION_STRONG_WIND | 大风吹过动画 |
| 风吹过2.mp4 | wind_blowing_2.webm | wind_blowing_2 | ACTION_WIND_BLOWING_2 | 风吹效果2 |

### 跳舞相关 (Dancing)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 跳舞.mp4 | dancing.webm | dancing | ACTION_DANCING | 欢快舞蹈动画 |
| 跳舞2.mp4 | dancing_2.webm | dancing_2 | ACTION_DANCING_2 | 欢快舞蹈动画2 |

### 塔罗相关 (Tarot)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 塔罗占卜9秒.mp4 | tarot_reading.webm | tarot_reading | ACTION_TAROT_READING | 塔罗牌占卜动画 (9秒) |

### 睡眠相关 (Sleep)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 睡觉20秒.mp4 | sleeping_long.webm | sleeping_long | ACTION_SLEEPING_LONG | 长时间睡眠动画 (20秒) |

### 观察相关 (Observation)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 惊喜靠近观察5秒.mp4 | surprised_observe.webm | surprised_observe | ACTION_SURPRISED_OBSERVE | 惊喜靠近观察动画 (5秒) |
| 观猹3秒.mp4 | observing.webm | observing | ACTION_OBSERVING | 观察动画 (3秒) |

### 喝水相关 (Drinking Water)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 喝水1_3秒.mp4 | drinking_water.webm | drinking_water | ACTION_DRINKING_WATER | 喝水动画 (3秒) |

### 待机相关 (Idle)

| 原文件名 | 新文件名 | 英文名称 | 状态ID | 用途描述 |
|---------|---------|---------|--------|---------|
| 待机01.mp4 | idle_action_4.webm | idle_4 | ACTION_IDLE_4 | 待机动作4 |

## 代码更新

### 1. VideoStateID 枚举更新 (characterStateMachine.ts)

添加了以下新状态：

```typescript
// 天气相关
ACTION_WEATHER = 'ACTION_WEATHER',

// 技能相关
ACTION_SKILL = 'ACTION_SKILL',

// 风相关
ACTION_WIND_BLOWING = 'ACTION_WIND_BLOWING',
ACTION_STRONG_WIND = 'ACTION_STRONG_WIND',
ACTION_WIND_BLOWING_2 = 'ACTION_WIND_BLOWING_2',

// 跳舞相关
ACTION_DANCING = 'ACTION_DANCING',
ACTION_DANCING_2 = 'ACTION_DANCING_2',

// 塔罗相关
ACTION_TAROT_READING = 'ACTION_TAROT_READING',

// 其他动作
ACTION_SLEEPING_LONG = 'ACTION_SLEEPING_LONG',
ACTION_SURPRISED_OBSERVE = 'ACTION_SURPRISED_OBSERVE',
ACTION_DRINKING_WATER = 'ACTION_DRINKING_WATER',
ACTION_OBSERVING = 'ACTION_OBSERVING',
ACTION_IDLE_4 = 'ACTION_IDLE_4',
```

### 2. EmotionActionName 类型更新

添加了所有新动作的类型定义。

### 3. VIDEO_PATHS 配置更新 (characterConfig.ts)

添加了所有新视频的路径映射。

### 4. playAction 方法更新

在状态机的 `playAction` 方法中添加了所有新动作的映射。

### 5. AnimationPanel 更新

在动画点播面板中更新了分类：

- **天气相关** (Weather): 包含天气展示、风吹等4个动画
- **特殊动作** (Special): 包含技能、塔罗、跳舞等4个动画
- **活动状态** (Activities): 新增了喝水、深度睡眠等动画
- **待机动作** (Idle): 新增了 idle_4 和 observing

## 使用方法

### 通过代码触发

```typescript
// 播放天气动画
characterRef.current?.playAction('weather');

// 播放技能动画
characterRef.current?.playAction('skill');

// 播放塔罗占卜
characterRef.current?.playAction('tarot_reading');

// 播放跳舞动画
characterRef.current?.playAction('dancing');

// 播放风吹动画
characterRef.current?.playAction('wind_blowing');

// 播放深度睡眠
characterRef.current?.playAction('sleeping_long');

// 播放观察动画
characterRef.current?.playAction('observing');

// 播放喝水动画
characterRef.current?.playAction('drinking_water');
```

### 通过动画面板

用户可以在左侧工具栏点击"点播"按钮，然后在动画面板中选择相应的分类和动画进行播放。

## 注意事项

1. 所有新视频都已转换为透明背景的 WebM 格式
2. 所有动画播放完毕后会自动返回待机状态
3. 视频文件使用 VP9 编码，音频使用 Opus 编码
4. 比特率设置为 2M，确保画质和文件大小的平衡
5. 所有动画都已添加到状态机配置中，可以通过 `playAction` 方法调用

## 文件大小统计

| 文件名 | 大小 |
|--------|------|
| weather.webm | 2.0MB |
| skill.webm | 2.0MB |
| wind_blowing.webm | 1.9MB |
| strong_wind.webm | 1.9MB |
| wind_blowing_2.webm | 1.9MB |
| dancing.webm | 2.1MB |
| dancing_2.webm | 2.1MB |
| tarot_reading.webm | 5.1MB |
| sleeping_long.webm | 8.9MB |
| surprised_observe.webm | 3.1MB |
| observing.webm | 2.5MB |
| drinking_water.webm | 1.6MB |
| idle_action_4.webm | 2.0MB |

**总计**: 约 37.1MB

---

**更新日期**: 2026-01-18  
**转换工具**: FFmpeg 8.0.1  
**编码格式**: VP9 (视频) + Opus (音频)  
**转换成功率**: 100% (13/13)
