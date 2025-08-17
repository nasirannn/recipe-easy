import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 配置 Edge Runtime 以支持 Cloudflare Pages
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  // If there's an error, log it and redirect to the home page
  if (error) {
    console.error('OAuth callback error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}?auth_error=${error}`)
  }

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase.auth.exchangeCodeForSession(code)

    } catch (error) {
      console.error('Error exchanging session code:', error)
      return NextResponse.redirect(`${requestUrl.origin}?auth_error=session_exchange_failed`)
    }
  } else {
    console.error('No code parameter in OAuth callback')
    return NextResponse.redirect(`${requestUrl.origin}?auth_error=no_code`)
  }

  // Redirect to the home page after successful authentication
  return NextResponse.redirect(requestUrl.origin)
}