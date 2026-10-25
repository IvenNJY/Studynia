"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FlaskConical, Key, Save, Globe } from "lucide-react"
import { toast } from "sonner"

export function LmsIntegration() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [platformName, setPlatformName] = useState("")
  const [token, setToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [connectedPlatform, setConnectedPlatform] = useState<string>("")

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsChecking(false)
          return
        }

        const { data, error } = await supabase
          .from("lms_connections")
          .select("id, platform_name, last_synced_at, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setIsConnected(true)
          setConnectedPlatform(data[0].platform_name)
          setLastSyncedAt(data[0].last_synced_at)
        }
      } catch (err) {
        console.error("Error checking LMS connection:", err)
      } finally {
        setIsChecking(false)
      }
    }

    checkConnection()
  }, [])

  const handleConnect = async () => {
    if (!token || !platformName) return
    setIsSubmitting(true)
    try {
      // 1. The token is sent to your Edge Function or RPC endpoint
      // 2. The Edge Function inserts it into vault.secrets
      // 3. The returned vault ID is inserted into public.lms_connections
      
      const response = await fetch("/api/lms/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_name: platformName,
          token: token
        })
      });

      if (response.ok) {
        setIsConnected(true)
        setIsUpdating(false)
        setToken("")
      } else {
        const errorData = await response.json();
        console.error("Failed to connect LMS:", errorData);
        toast.error(errorData.error || "Failed to connect LMS.", {
          description: errorData.details,
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm bg-card overflow-hidden h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">LMS Integration</CardTitle>
            <p className="text-sm text-muted-foreground">Syncing with Canvas</p>
          </div>
        </div>
        {isConnected ? (
          <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full tracking-wide">
            CONNECTED
          </div>
        ) : isChecking ? (
          <div className="px-3 py-1 bg-muted/50 text-muted-foreground text-xs font-bold rounded-full tracking-wide animate-pulse">
            CHECKING
          </div>
        ) : (
          <div className="px-3 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full tracking-wide">
            NOT CONNECTED
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-8">
        {isChecking ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (!isConnected || isUpdating) ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Canvas API token and institution domain to allow us to sync your courses, assignments, and announcements automatically.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Institution Domain (e.g., https://canvas.instructure.com)" 
                  className="pl-10"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Enter your Canvas API Token..." 
                    className="pl-10"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button 
                  onClick={handleConnect} 
                  disabled={!token || !platformName || isSubmitting}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Connecting..." : (isConnected ? "Update" : "Connect")}
                </Button>
                {isConnected && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsUpdating(false)
                      setToken("")
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/100 p-6 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-foreground">Last successful sync</p>
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <p className="text-3xl font-light text-muted-foreground">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Never"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Connected to {connectedPlatform}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="font-medium" 
                onClick={() => setIsUpdating(true)}
              >
                Update Token
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 cursor-pointer"
                onClick={() => router.push("/resources")}
              >
                Sync Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
