/**
 * 天气 API 路由
 */

import { Router, Request, Response } from 'express';
import { getWeatherForCity, getWeatherByLocation, getWeatherByIP } from '../services/weather';
import { optionalAuthMiddleware } from '../middleware/auth';
import { ApiResponse, WeatherData } from '../types';

const router = Router();

// 天气接口可以公开访问，但如果登录了可以保存偏好
router.use(optionalAuthMiddleware);

/**
 * GET /api/weather/city/:name
 * 根据城市名获取天气
 */
router.get('/city/:name', async (req: Request, res: Response<ApiResponse<WeatherData>>) => {
  try {
    const cityName = decodeURIComponent(req.params.name);
    const weather = await getWeatherForCity(cityName);

    if (!weather) {
      return res.status(404).json({
        success: false,
        error: `找不到城市「${cityName}」的天气信息`
      });
    }

    res.json({ success: true, data: weather });
  } catch (error) {
    console.error('[Weather] City error:', error);
    res.status(500).json({ success: false, error: '获取天气失败' });
  }
});

/**
 * GET /api/weather/location
 * 根据经纬度获取天气
 */
router.get('/location', async (req: Request, res: Response<ApiResponse<WeatherData>>) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: '需要提供有效的经纬度参数 (lat, lng)'
      });
    }

    const weather = await getWeatherByLocation(lat, lng);

    if (!weather) {
      return res.status(500).json({
        success: false,
        error: '获取位置天气失败'
      });
    }

    res.json({ success: true, data: weather });
  } catch (error) {
    console.error('[Weather] Location error:', error);
    res.status(500).json({ success: false, error: '获取天气失败' });
  }
});

/**
 * GET /api/weather/auto
 * 根据 IP 自动获取天气
 */
router.get('/auto', async (req: Request, res: Response<ApiResponse<WeatherData>>) => {
  try {
    const weather = await getWeatherByIP();

    if (!weather) {
      return res.status(500).json({
        success: false,
        error: '无法自动获取位置天气'
      });
    }

    res.json({ success: true, data: weather });
  } catch (error) {
    console.error('[Weather] Auto error:', error);
    res.status(500).json({ success: false, error: '获取天气失败' });
  }
});

export default router;
