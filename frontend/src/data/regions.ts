// 江苏省苏州市吴中区地址数据（四级联动：省-市-区-镇）
// 可根据需要扩展其他地区

export interface RegionOption {
  value: string
  label: string
  children?: RegionOption[]
}

// 江苏省数据
export const regionData: RegionOption[] = [
  {
    value: '江苏省',
    label: '江苏省',
    children: [
      {
        value: '苏州市',
        label: '苏州市',
        children: [
          {
            value: '吴中区',
            label: '吴中区',
            children: [
              { value: '临湖镇', label: '临湖镇' },
              { value: '木渎镇', label: '木渎镇' },
              { value: '胥口镇', label: '胥口镇' },
              { value: '东山镇', label: '东山镇' },
              { value: '西山镇', label: '西山镇' },
              { value: '光福镇', label: '光福镇' },
              { value: '横泾街道', label: '横泾街道' },
              { value: '越溪街道', label: '越溪街道' },
              { value: '城南街道', label: '城南街道' },
              { value: '郭巷街道', label: '郭巷街道' },
              { value: '香山街道', label: '香山街道' },
              { value: '甪直镇', label: '甪直镇' },
            ]
          },
          {
            value: '姑苏区',
            label: '姑苏区',
            children: [
              { value: '观前街道', label: '观前街道' },
              { value: '平江街道', label: '平江街道' },
              { value: '沧浪街道', label: '沧浪街道' },
              { value: '双塔街道', label: '双塔街道' },
            ]
          },
          {
            value: '相城区',
            label: '相城区',
            children: [
              { value: '元和街道', label: '元和街道' },
              { value: '黄埭镇', label: '黄埭镇' },
              { value: '渭塘镇', label: '渭塘镇' },
            ]
          },
          {
            value: '吴江区',
            label: '吴江区',
            children: [
              { value: '松陵街道', label: '松陵街道' },
              { value: '同里镇', label: '同里镇' },
              { value: '盛泽镇', label: '盛泽镇' },
            ]
          },
          {
            value: '工业园区',
            label: '工业园区',
            children: [
              { value: '湖东', label: '湖东' },
              { value: '湖西', label: '湖西' },
              { value: '斜塘', label: '斜塘' },
            ]
          },
          {
            value: '虎丘区',
            label: '虎丘区',
            children: [
              { value: '狮山街道', label: '狮山街道' },
              { value: '枫桥街道', label: '枫桥街道' },
            ]
          },
        ]
      },
      {
        value: '南京市',
        label: '南京市',
        children: [
          {
            value: '玄武区',
            label: '玄武区',
            children: [
              { value: '梅园新村街道', label: '梅园新村街道' },
              { value: '锁金村街道', label: '锁金村街道' },
            ]
          },
          {
            value: '秦淮区',
            label: '秦淮区',
            children: [
              { value: '夫子庙街道', label: '夫子庙街道' },
              { value: '双塘街道', label: '双塘街道' },
            ]
          },
        ]
      },
      {
        value: '无锡市',
        label: '无锡市',
        children: [
          {
            value: '梁溪区',
            label: '梁溪区',
            children: [
              { value: '崇安寺街道', label: '崇安寺街道' },
              { value: '南禅寺街道', label: '南禅寺街道' },
            ]
          },
        ]
      },
    ]
  },
  {
    value: '上海市',
    label: '上海市',
    children: [
      {
        value: '上海市',
        label: '上海市',
        children: [
          {
            value: '浦东新区',
            label: '浦东新区',
            children: [
              { value: '陆家嘴街道', label: '陆家嘴街道' },
              { value: '张江镇', label: '张江镇' },
            ]
          },
          {
            value: '黄浦区',
            label: '黄浦区',
            children: [
              { value: '南京东路街道', label: '南京东路街道' },
              { value: '外滩街道', label: '外滩街道' },
            ]
          },
        ]
      },
    ]
  },
  {
    value: '浙江省',
    label: '浙江省',
    children: [
      {
        value: '杭州市',
        label: '杭州市',
        children: [
          {
            value: '西湖区',
            label: '西湖区',
            children: [
              { value: '北山街道', label: '北山街道' },
              { value: '西溪街道', label: '西溪街道' },
            ]
          },
        ]
      },
    ]
  },
]

// 默认地址
export const DEFAULT_REGION = ['江苏省', '苏州市', '吴中区', '临湖镇']