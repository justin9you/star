import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'

// All Providers wrapper
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ConfigProvider>
  )
}

// Custom render function that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { default as userEvent } from '@testing-library/user-event'
export { screen, fireEvent, waitFor } from '@testing-library/react'