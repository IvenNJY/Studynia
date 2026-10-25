import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthErrorToast } from '@/components/auth-error-toast'

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const errorMessage = params?.error || 'An unspecified authentication error occurred.'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <AuthErrorToast message={errorMessage} />
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">An error occurred</p>
            </CardContent>
          </Card>

          <Button>
              <a href="/auth/login" className="w-full text-center ">
                Go back to login
              </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

