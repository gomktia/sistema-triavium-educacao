import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/inicio';

    if (!code) {
        return NextResponse.redirect(new URL('/login', origin));
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('[AUTH_CALLBACK] Exchange error:', error);
        return NextResponse.redirect(new URL('/login?error=callback_failed', origin));
    }

    // Handle production behind proxy
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
        return NextResponse.redirect(new URL(next, origin));
    } else if (forwardedHost) {
        return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
    }

    return NextResponse.redirect(new URL(next, origin));
}
