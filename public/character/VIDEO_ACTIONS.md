# 叉叉角色动作视频清单

所有视频已转换为透明背景的 WebM 格式（VP9编码 + Opus音频），支持 Alpha 通道。

## 📋 完整动作列表

### 🌟 待机动作
| 文件名 | 中文描述 | 大小 | 用途 |
|--------|---------|------|------|
| `idle.webm` | 待机/呼吸 | 4.0MB | 默认待机循环动画 |

### 😊 情绪表达类
| 文件名 | 中文描述 | 大小 | 用途 |
|--------|---------|------|------|
| `happy.webm` | 增加好感度 | 1.6MB | 开心/友好互动 |
| `excited.webm` | 激动 | 2.0MB | 兴奋/惊喜反应 |
| `rage.webm` | 无能狂怒 | 2.7MB | 愤怒/沮丧表达 |
| `scared.webm` | 害怕 | 4.0MB | 恐惧/紧张反应 |
| `disapprove.webm` | 不认可 | 1.9MB | 拒绝/不同意 |

### 🎵 娱乐活动类
| 文件名 | 中文描述 | 大小 | 用途 |
|--------|---------|------|------|
| `singing.webm` | 唱歌 | 4.9MB | 唱歌/表演动作 |
| `listening_music.webm` | 听音乐 | 2.7MB | 享受音乐/放松 |
| `jump.webm` | 跳跃 | 1.5MB | 跳跃/欢快动作 |

### 📱 日常活动类
| 文件名 | 中文描述 | 大小 | 用途 |
|--------|---------|------|------|
| `using_phone.webm` | 玩手机 | 2.0MB | 使用手机/浏览 |
| `checking_phone.webm` | 查询手机 | 1.9M | 查看信息/搜索 |
| `taking_notes.webm` | 记笔记 | 3.4MB | 记录/写字动作 |

### 🎬 扩展动作（待定义）
| 文件名 | 中文描述 | 大小 | 备注 |
|--------|---------|------|------|
| `action_1.webm` | 动作1 | 3.5MB | 可根据实际内容重命名 |
| `action_2.webm` | 动作2 | 1.9MB | 可根据实际内容重命名 |
| `action_3.webm` | 动作3 | 1.8MB | 可根据实际内容重命名 |
| `action_4.webm` | 动作4 | 2.0MB | 可根据实际内容重命名 |
| `action_5.webm` | 动作5 | 3.5MB | 可根据实际内容重命名 |

---

## 📊 统计信息
- **总文件数**: 17个
- **总大小**: ~43.9MB
- **格式**: WebM (VP9 + Opus)
- **特性**: 透明背景 (Alpha通道)
- **绿幕移除参数**: colorkey=0x00FF00:0.35:0.15

## 🎯 使用建议

### 状态机映射示例
```typescript
const characterActions = {
  // 待机状态
  IDLE: 'idle.webm',
  
  // 对话状态
  SPEAKING: 'idle.webm', // 或创建专门的说话动作
  LISTENING: 'listening_music.webm',
  
  // 情绪反应
  HAPPY: 'happy.webm',
  EXCITED: 'excited.webm',
  ANGRY: 'rage.webm',
  SCARED: 'scared.webm',
  
  // 活动状态
  WORKING: 'taking_notes.webm',
  PHONE: 'using_phone.webm',
  SINGING: 'singing.webm',
  JUMPING: 'jump.webm',
  
  // 交互反应
  APPROVE: 'happy.webm',
  DISAPPROVE: 'disapprove.webm',
};
```

## 🔧 技术规格
- **视频编码**: VP9 (libvpx-vp9)
- **音频编码**: Opus (96 kbps)
- **像素格式**: yuva420p (支持透明度)
- **比特率**: 2 Mbps
- **帧率**: 保持原始帧率 (通常60fps)
- **分辨率**: 1080x1920 (9:16竖屏)

---

**创建时间**: 2026-01-17  
**绿幕移除工具**: FFmpeg 8.0.1  
**转换命令**: `ffmpeg -i input.mp4 -filter_complex "[0:v]colorkey=0x00FF00:0.35:0.15,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 2M -c:a libopus output.webm`
