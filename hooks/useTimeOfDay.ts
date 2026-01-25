/**
 * useTimeOfDay - 时间感知 Hook
 * 
 * 根据当前时间返回时段，用于背景色调切换
 * - dawn: 黎明 (5:00 - 8:00) - 温暖的橙紫色调
 * - day: 白天 (8:00 - 17:00) - 明亮清爽
 * - dusk: 黄昏 (17:00 - 20:00) - 温暖的橙红色调
 * - night: 夜晚 (20:00 - 5:00) - 深邃的蓝色调
 */

import { useState, useEffect } from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) {
    return 'dawn';
  } else if (hour >= 8 && hour < 17) {
    return 'day';
  } else if (hour >= 17 && hour < 20) {
    return 'dusk';
  } else {
    return 'night';
  }
}

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    return getTimeOfDay(hour);
  });

  useEffect(() => {
    // 检查并更新时段
    const checkTime = () => {
      const hour = new Date().getHours();
      const newTimeOfDay = getTimeOfDay(hour);
      setTimeOfDay(prev => {
        if (prev !== newTimeOfDay) {
          console.log(`[TimeOfDay] 时段变化: ${prev} → ${newTimeOfDay}`);
          return newTimeOfDay;
        }
        return prev;
      });
    };

    // 每分钟检查一次
    const interval = setInterval(checkTime, 60000);

    // 初始检查
    checkTime();

    return () => clearInterval(interval);
  }, []);

  // 同步更新 document 的 data-time 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-time', timeOfDay);
  }, [timeOfDay]);

  return timeOfDay;
}

/**
 * 获取时段对应的问候语
 */
export function getTimeGreeting(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn':
      return '早安，新的一天开始啦';
    case 'day':
      return '今天也要元气满满哦';
    case 'dusk':
      return '傍晚好，今天过得怎么样';
    case 'night':
      return '夜深了，记得早点休息';
  }
}

/**
 * 获取时段对应的状态提示
 */
export function getTimeStatus(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn':
      return '刚醒来，有点犯困...';
    case 'day':
      return '精神满满，随时待命';
    case 'dusk':
      return '在看夕阳呢';
    case 'night':
      return '夜间模式，安静陪伴';
  }
}

export default useTimeOfDay;
