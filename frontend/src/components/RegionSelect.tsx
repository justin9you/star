import { Cascader } from 'antd'
import type { CascaderProps } from 'antd'
import { regionData, DEFAULT_REGION, type RegionOption } from '../data/regions'

interface RegionSelectProps {
  value?: [string, string, string, string]
  onChange?: (value: [string, string, string, string]) => void
  disabled?: boolean
  placeholder?: string
}

// 自定义过滤，支持搜索
const filter: CascaderProps<RegionOption>['showSearch'] = {
  filter: (inputValue, path) =>
    path.some(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    ),
}

export default function RegionSelect({
  value,
  onChange,
  disabled,
  placeholder = '请选择地址'
}: RegionSelectProps) {
  const handleChange = (selectedValue: (string | number)[]) => {
    if (onChange) {
      if (selectedValue.length === 4) {
        onChange(selectedValue as [string, string, string, string])
      } else {
        onChange(undefined as unknown as [string, string, string, string])
      }
    }
  }

  // 确保值是有效的数组
  const currentValue = value && value.length === 4 ? value : DEFAULT_REGION

  return (
    <Cascader
      options={regionData}
      value={currentValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      showSearch={filter}
      style={{ width: '100%' }}
      changeOnSelect={false}
      expandTrigger="hover"
      placement="bottomLeft"
    />
  )
}