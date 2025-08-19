import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('Auth callback received:', {
    code: !!code,
    error,
    url: requestUrl.toString(),
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    search: requestUrl.search,
    hash: requestUrl.hash
  })

  if (error) {
    console.error('OAuth error:', error)
    // 重定向到首页，不带任何fragment
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        console.error('Exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin))
    }
  }

  // 确保重定向到干净的URL，不带fragment
  const redirectUrl = new URL('/', requestUrl.origin)
  console.log('Redirecting to:', redirectUrl.toString())
  return NextResponse.redirect(redirectUrl)
}
