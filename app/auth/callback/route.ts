import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // Auth callback received

  if (error) {
    // OAuth error
    // 重定向到首页，不带任何fragment
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        // Exchange error
        return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
      }
    } catch (err) {
      // Unexpected error
      return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin))
    }
  }

  // 确保重定向到干净的URL，不带fragment
  const redirectUrl = new URL('/', requestUrl.origin)
  // Redirecting to home
  return NextResponse.redirect(redirectUrl)
}
