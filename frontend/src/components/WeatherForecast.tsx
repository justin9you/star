import { useEffect, useState, type CSSProperties } from 'react'
import { Card, Spin, Empty } from 'antd'
import dayjs from 'dayjs'
import { useElderModeStore } from '../stores/elderModeStore'

interface DayWeather {
  date: string
  code: number
  tmax: number
  tmin: number
  pop: number
}

// WMO 天气代码 → 中文 + emoji
const WMO: Record<number, [string, string]> = {
  0: ['晴', '☀️'],
  1: ['晴间多云', '🌤️'],
  2: ['多云', '⛅'],
  3: ['阴', '☁️'],
  45: ['雾', '🌫️'], 48: ['雾凇', '🌫️'],
  51: ['小毛雨', '🌦️'], 53: ['毛毛雨', '🌦️'], 55: ['大毛雨', '🌧️'],
  56: ['冻毛雨', '🌧️'], 57: ['冻毛雨', '🌧️'],
  61: ['小雨', '🌦️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
  66: ['冻雨', '🌧️'], 67: ['冻雨', '🌧️'],
  71: ['小雪', '🌨️'], 73: ['中雪', '❄️'], 75: ['大雪', '❄️'], 77: ['雪粒', '🌨️'],
  80: ['阵雨', '🌦️'], 81: ['阵雨', '🌧️'], 82: ['强阵雨', '⛈️'],
  85: ['阵雪', '🌨️'], 86: ['强阵雪', '❄️'],
  95: ['雷阵雨', '⛈️'], 96: ['雷阵雨夹雹', '⛈️'], 99: ['强雷雨夹雹', '⛈️'],
}

const describe = (code: number): [string, string] => WMO[code] || ['—', '🌡️']

// 江苏 · 苏州 · 吴中区 坐标
const LAT = 31.27
const LON = 120.63

const dayCard: CSSProperties = {
  padding: '14px 10px',
  textAlign: 'center',
  border: '1px solid #eef0f4',
  borderRadius: 12,
  background: '#fafbfc',
}
const todayCard: CSSProperties = {
  background: 'linear-gradient(135deg, #eef5ff 0%, #f7faff 100%)',
  border: '1px solid #cfe0ff',
}

export default function WeatherForecast() {
  const [days, setDays] = useState<DayWeather[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { isElderMode } = useElderModeStore()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FShanghai&forecast_days=8`
      const res = await fetch(url)
      if (!res.ok) throw new Error('weather fetch failed')
      const j = await res.json()
      const d = j.daily
      const list: DayWeather[] = (d.time as string[]).map((t, i) => ({
        date: t,
        code: d.weather_code[i],
        tmax: Math.round(d.temperature_2m_max[i]),
        tmin: Math.round(d.temperature_2m_min[i]),
        pop: d.precipitation_probability_max?.[i] ?? 0,
      }))
      setDays(list)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const dayLabel = (date: string, i: number) => {
    if (i === 0) return '今天'
    if (i === 1) return '明天'
    return dayjs(date).format('ddd')
  }

  return (
    <Card
      title="苏州 · 吴中 天气预报"
      style={{ marginBottom: 16 }}
      extra={<a onClick={load}>刷新</a>}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
      ) : error ? (
        <Empty description="天气加载失败，请检查网络后点击刷新" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isElderMode ? 140 : 116}px, 1fr))`, gap: 12 }}>
          {days!.map((dw, i) => {
            const [label, icon] = describe(dw.code)
            return (
              <div key={dw.date} style={{ ...dayCard, ...(i === 0 ? todayCard : {}) }}>
                <div style={{ fontSize: isElderMode ? 18 : 14, fontWeight: 600, color: '#1f2937' }}>{dayLabel(dw.date, i)}</div>
                <div style={{ fontSize: isElderMode ? 15 : 12, color: '#9aa3b5' }}>{dayjs(dw.date).format('MM/DD')}</div>
                <div style={{ fontSize: isElderMode ? 44 : 34, lineHeight: 1.3, margin: '6px 0' }}>{icon}</div>
                <div style={{ fontSize: isElderMode ? 17 : 13, color: '#595959' }}>{label}</div>
                <div style={{ marginTop: 8, fontSize: isElderMode ? 20 : 15, fontWeight: 600, color: '#1f2937' }}>
                  {dw.tmax}°<span style={{ color: '#9aa3b5', fontWeight: 400 }}> / {dw.tmin}°</span>
                </div>
                {dw.pop > 0 && (
                  <div style={{ fontSize: isElderMode ? 15 : 12, color: '#1677ff', marginTop: 4 }}>💧 {dw.pop}%</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
