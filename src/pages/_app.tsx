import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import type { AppProps } from 'next/app'

import '@components/Themes/layout.scss'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider {...pageProps}>
      <Component {...pageProps} />
    </AppCacheProvider>
  )
}
