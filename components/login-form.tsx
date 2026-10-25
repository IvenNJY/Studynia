'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { toast } from 'sonner'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push('/home')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async () => {
    const supabase = createClient()
    setIsOAuthLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/home`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      setIsOAuthLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="relative text-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={handleSocialLogin}
                disabled={isOAuthLoading || isLoading}
              >
                <Image src="/github-mark.svg" alt="" width={16} height={16} unoptimized className="mr-2 h-4 w-4" />
                {isOAuthLoading ? 'Redirecting...' : 'Continue with GitHub'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
