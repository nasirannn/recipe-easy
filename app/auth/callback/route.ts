import { createServerClient } from '@supabase/ssr'
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
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging session code:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}?auth_error=session_exchange_failed`)
      }
    } catch (error) {
      console.error('Error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}?auth_error=callback_failed`)
    }
  } else {
    console.error('No code parameter in OAuth callback')
    return NextResponse.redirect(`${requestUrl.origin}?auth_error=no_code`)
  }

  // Redirect to the home page after successful authentication
  return NextResponse.redirect(requestUrl.origin)
}