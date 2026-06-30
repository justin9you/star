import { useEffect, useState, type CSSProperties } from 'react'
import { Card, Spin, Empty } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useElderModeStore } from '../stores/elderModeStore'
import { authApi } from '../services/authApi'

interface DayWeather {
  date: string
  code: number
  tmax: number
  tmin: number
  pop: number
}

interface CurrentWeather {
  temp: number
  feels: number
  humidity: number
  wind: number
  code: number
  isDay: boolean
}

interface Quote {
  text: string
  from: string
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

// 根据实时天气 + 昼夜返回对应的淡雅浅色渐变，让大区域随实况微妙变化
const weatherTheme = (code: number, isDay: boolean): string => {
  if (!isDay) {
    // 夜间：柔和的暮蓝
    return 'linear-gradient(135deg, #eef1f8 0%, #e1e7f3 100%)'
  }
  // 雷暴
  if (code >= 95) return 'linear-gradient(135deg, #f0edf8 0%, #e4ddf0 100%)'
  // 雪
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return 'linear-gradient(135deg, #f7fbff 0%, #e9f2fb 100%)'
  // 雨
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return 'linear-gradient(135deg, #eef3f8 0%, #dde7f1 100%)'
  // 雾
  if (code === 45 || code === 48)
    return 'linear-gradient(135deg, #f1f3f5 0%, #e6eaee 100%)'
  // 阴
  if (code === 3) return 'linear-gradient(135deg, #f0f3f7 0%, #e4e9f0 100%)'
  // 多云
  if (code === 1 || code === 2) return 'linear-gradient(135deg, #f3f8fe 0%, #e4eefb 100%)'
  // 晴
  return 'linear-gradient(135deg, #fffaf0 0%, #fff1d6 45%, #eaf3ff 100%)'
}

// 江苏 · 苏州 · 吴中区 坐标
const LAT = 31.27
const LON = 120.63

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 根据当前时段返回问候语 + emoji
const greeting = (): [string, string] => {
  const h = dayjs().hour()
  if (h < 6) return ['夜深了', '🌙']
  if (h < 9) return ['早上好', '🌅']
  if (h < 12) return ['上午好', '☀️']
  if (h < 14) return ['中午好', '🌤️']
  if (h < 18) return ['下午好', '🌇']
  if (h < 22) return ['晚上好', '🌆']
  return ['夜深了', '🌙']
}

// 心灵鸡汤本地兜底（API 不可用时随机选一条）
const FALLBACK_QUOTES: Quote[] = [
  { text: '你想过的生活，要自己去挣，不要等别人来给。', from: '心灵鸡汤' },
  { text: '万物皆有裂痕，那是光照进来的地方。', from: '莱昂纳德·科恩' },
  { text: '愿你走出半生，归来仍是少年。', from: '苏轼' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', from: '谚语' },
  { text: '生活明朗，万物可爱，人间值得，未来可期。', from: '心灵鸡汤' },
  { text: '所有的努力都不会白费，时间会给你答案。', from: '心灵鸡汤' },
  { text: '星光不问赶路人，时光不负有心人。', from: '心灵鸡汤' },
]

// 心灵鸡汤文案淡入动画（注入一次）
const QUOTE_KEYFRAMES = `
@keyframes hf-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`

const dayCard: CSSProperties = {
  padding: '14px 10px',
  textAlign: 'center',
  border: '1px solid #eef0f4',
  borderRadius: 12,
  background: '#fafbfc',
}

export default function WeatherForecast() {
  const [days, setDays] = useState<DayWeather[] | null>(null)
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [userName, setUserName] = useState('管理员')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { isElderMode } = useElderModeStore()

  useEffect(() => {
    load()
    loadQuote()
    authApi.getCurrentUser()
      .then(u => { if (u?.name) setUserName(u.name) })
      .catch(() => { /* 失败时保留默认显示 */ })
  }, [])

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FShanghai&forecast_days=2`
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
      const c = j.current
      if (c) {
        setCurrent({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          humidity: Math.round(c.relative_humidity_2m),
          wind: Math.round(c.wind_speed_10m),
          code: c.weather_code,
          isDay: c.is_day === 1,
        })
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // 心灵鸡汤：一言 API，失败时回退到本地文案
  const loadQuote = async () => {
    setQuote(null)
    try {
      const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json')
      if (!res.ok) throw new Error('quote fetch failed')
      const j = await res.json()
      const text: string = (j.hitokoto || '').trim()
      if (!text) throw new Error('empty quote')
      setQuote({ text, from: j.from_who || j.from || '' })
    } catch {
      const pick = FALLBACK_QUOTES[Math.floor(Date.now() / 86400000) % FALLBACK_QUOTES.length]
      setQuote(pick)
    }
  }

  const renderDay = (dw: DayWeather, label: string) => {
    const [text, icon] = describe(dw.code)
    return (
      <div style={{ ...dayCard, flex: 1, padding: isElderMode ? '22px 16px' : '20px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: isElderMode ? 22 : 18, fontWeight: 600, color: '#1f2937' }}>{label}</div>
        <div style={{ fontSize: isElderMode ? 60 : 48, lineHeight: 1.2, margin: '10px 0' }}>{icon}</div>
        <div style={{ fontSize: isElderMode ? 20 : 16, color: '#595959' }}>{text}</div>
        <div style={{ marginTop: 12, fontSize: isElderMode ? 26 : 20, fontWeight: 600, color: '#1f2937' }}>
          {dw.tmax}°<span style={{ color: '#9aa3b5', fontWeight: 400 }}> / {dw.tmin}°</span>
        </div>
        {dw.pop > 0 && (
          <div style={{ fontSize: isElderMode ? 17 : 14, color: '#1677ff', marginTop: 6 }}>💧 {dw.pop}%</div>
        )}
      </div>
    )
  }

  const renderHero = () => {
    if (!days || days.length === 0) return null
    const today = days[0]
    const tomorrow = days[1]
    // 当前实况优先，没有则回退到当日预报
    const code = current?.code ?? today.code
    const [label, icon] = describe(code)
    const bigTemp = current ? current.temp : today.tmax
    const isDay = current ? current.isDay : true
    const background = weatherTheme(code, isDay)

    const metric = (emoji: string, text: string) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: isElderMode ? '6px 12px' : '5px 10px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <span style={{ fontSize: isElderMode ? 22 : 18 }}>{emoji}</span>
        <span style={{ fontSize: isElderMode ? 18 : 14, color: '#475569', fontWeight: 500 }}>{text}</span>
      </div>
    )

    return (
      <div style={{ flex: isElderMode ? '1 1 560px' : '1 1 500px', maxWidth: isElderMode ? 720 : 640, display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {/* 今天 · 大区域 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isElderMode ? 12 : 10,
            padding: isElderMode ? '16px 32px' : '12px 28px',
            borderRadius: 16,
            color: '#1f2937',
            background,
            border: '1px solid #eef0f4',
            boxShadow: '0 6px 20px rgba(100,120,150,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isElderMode ? 28 : 22 }}>
            <div style={{ fontSize: isElderMode ? 86 : 72, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }}>{icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ fontSize: isElderMode ? 70 : 56, fontWeight: 700, lineHeight: 1, color: '#1f2937' }}>{bigTemp}</span>
                <span style={{ fontSize: isElderMode ? 30 : 24, fontWeight: 600, marginTop: 5, color: '#475569' }}>°C</span>
              </div>
              <div style={{ fontSize: isElderMode ? 25 : 21, fontWeight: 600, marginTop: 4, color: '#1f2937' }}>{label}</div>
              <div style={{ fontSize: isElderMode ? 18 : 14, color: '#6b7280', marginTop: 2 }}>
                今天 · 最高 {today.tmax}° / 最低 {today.tmin}°
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isElderMode ? 12 : 10 }}>
            {current && metric('🌡️', `体感 ${current.feels}°`)}
            {current && metric('💧', `湿度 ${current.humidity}%`)}
            {current && metric('💨', `风速 ${current.wind} km/h`)}
            {today.pop > 0 && metric('☔', `降水概率 ${today.pop}%`)}
          </div>
        </div>

        {/* 明天 · 侧边卡片 */}
        {tomorrow && (
          <div style={{ flex: isElderMode ? '0 0 210px' : '0 0 180px', display: 'flex' }}>
            {renderDay(tomorrow, '明天')}
          </div>
        )}
      </div>
    )
  }

  // 心灵鸡汤区域：问候 + 日期 + 炫彩流光文字
  const renderQuote = () => {
    const [greet, greetIcon] = greeting()
    const now = dayjs()
    return (
      <div
        style={{
          flex: 1,
          minWidth: 260,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: isElderMode ? 12 : 10,
          padding: isElderMode ? '16px 36px' : '12px 32px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #fcfbff 0%, #f6f5fb 100%)',
          border: '1px solid #eef0f4',
          boxShadow: '0 6px 20px rgba(100,120,150,0.08)',
          color: '#1f2937',
        }}
      >
        {/* 顶部：问候 + 日期 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: isElderMode ? 34 : 28 }}>{greetIcon}</span>
            <span style={{ fontSize: isElderMode ? 30 : 24, fontWeight: 700, color: '#1f2937' }}>{greet}，{userName}</span>
          </div>
          <div style={{ fontSize: isElderMode ? 22 : 18, color: '#9aa3b5', marginTop: 6 }}>
            {now.format('M月D日')} · {WEEKDAYS[now.day()]}
          </div>
        </div>

        {/* 分隔线 */}
        <div style={{ height: 1, background: '#eef0f4' }} />

        {/* 中部：每日一句 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* 大引号 */}
          <div style={{ fontSize: isElderMode ? 48 : 40, lineHeight: 0.6, color: '#d8d3ea', fontFamily: 'Georgia, serif' }}>“</div>
          <div style={{ fontSize: isElderMode ? 19 : 16, fontWeight: 600, letterSpacing: 2, color: '#a78bca', margin: '2px 0 8px' }}>✦ 每日一句</div>
          {quote ? (
            <>
              <div
                key={quote.text}
                style={{
                  fontSize: isElderMode ? 30 : 24,
                  fontWeight: 700,
                  lineHeight: 1.6,
                  color: '#3a3550',
                  animation: 'hf-fadein 0.6s ease both',
                }}
              >
                {quote.text}
              </div>
              {quote.from && (
                <div style={{ marginTop: 16, fontSize: isElderMode ? 22 : 18, color: '#9aa3b5', textAlign: 'right', animation: 'hf-fadein 0.8s ease both' }}>
                  —— {quote.from}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '24px 0' }}><Spin /></div>
          )}
        </div>

        <a
          onClick={loadQuote}
          style={{ alignSelf: 'flex-end', color: '#8b7fb0', display: 'flex', alignItems: 'center', gap: 6, fontSize: isElderMode ? 19 : 16 }}
        >
          <ReloadOutlined /> 换一句
        </a>
      </div>
    )
  }

  return (
    <Card
      title="苏州 · 吴中 天气预报"
      style={{ marginBottom: 16 }}
      extra={<a onClick={load}>刷新</a>}
    >
      <style>{QUOTE_KEYFRAMES}</style>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
      ) : error ? (
        <Empty description="天气加载失败，请检查网络后点击刷新" />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
          {renderQuote()}
          {renderHero()}
        </div>
      )}
    </Card>
  )
}
