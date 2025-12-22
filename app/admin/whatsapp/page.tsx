"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Smartphone, QrCode, LogOut, AlertCircle } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminWhatsAppPage() {
  const router = useRouter()
  const [status, setStatus] = useState<{
    initialized: boolean
    authenticated: boolean
    ready: boolean
    hasClient: boolean
    qrCode: string | null
    isInitializing: boolean
    error: string | null
    lastQRUpdate: number | null
    loadingPercent: number
    loadingMessage: string
  } | null>(null)
  /* Separate loading states to avoid UI confusion */
  const [isChecking, setIsChecking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const checkStatus = async (silent: boolean = false) => {
    // frequent background checks shouldn't trigger full UI loading states if possible
    // but for the button feedback, we use isChecking
    if (!silent) setIsChecking(true)
    try {
      const response = await fetch("/api/send-whatsapp")
      const data = await response.json()
      if (data.status) {
        setStatus(data.status)
        // Auto-show success message if we just transitions to ready
        if (data.status.ready && !status?.ready) {
          setSuccess("WhatsApp is now connected and ready to send messages!")
        } else if (data.status.qrCode && !status?.qrCode) {
          setSuccess("Scan the QR code below with your WhatsApp to connect.")
        } else if (!data.status.initialized && !status?.initialized) {
          setError("WhatsApp is not initialized. Click 'Initialize WhatsApp' to start.")
        }
      }
    } catch (err) {
      console.error("Failed to check status:", err)
      setError("Failed to check WhatsApp status. Please try again.")
    } finally {
      if (!silent) setIsChecking(false)
    }
  }

  const handleInitialize = async () => {
    setIsInitializing(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initialize: true }),
      })
      const data = await response.json()
      if (data.success) {
        setSuccess("Initialization started. Please wait for the QR code.")
        checkStatus()
      } else {
        throw new Error(data.error || "Failed to initialize")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout and reset the WhatsApp session? You will need to scan the QR code again.")) {
      return
    }

    setIsLoggingOut(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/send-whatsapp", {
        method: "DELETE",
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess("Successfully logged out. Session has been reset.")
        checkStatus()
      } else {
        throw new Error(data.error || "Failed to logout")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem("adminSession")
    if (!adminSession) {
      router.push("/admin/login")
      return
    }

    checkStatus()
    // Check status more frequently when waiting for QR code or connection
    const interval = setInterval(() => {
      checkStatus(true)
    }, status?.ready ? 10000 : 2000) // Check every 2 seconds if not ready, 10 seconds if ready
    return () => clearInterval(interval)
  }, [status?.ready])

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-background px-6 py-4">
          <h1 className="text-2xl font-bold">WhatsApp Configuration</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  WhatsApp Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {status && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="font-medium">Initialized:</span>
                      {status.initialized ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md border-l-4 border-l-blue-500">
                      <span className="font-medium">Authenticated:</span>
                      {status.authenticated ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="font-medium">Ready:</span>
                      {status.ready ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="font-medium">Client Connected:</span>
                      {status.hasClient ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="font-medium">Initializing:</span>
                      {status.isInitializing ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {status?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>System Error</AlertTitle>
                    <AlertDescription>
                      WhatsApp system error: {status.error}
                      <br />
                      <span className="text-xs mt-2 opacity-70 italic">Try clicking 'Initialize WhatsApp' again to reset.</span>
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {status?.authenticated && !status?.ready
                        ? (
                          <div className="space-y-2">
                            <p className="font-semibold">Scan successful! Syncing messages...</p>
                            <div className="w-full bg-green-200 rounded-full h-2.5">
                              <div
                                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${status.loadingPercent || 5}%` }}
                              ></div>
                            </div>
                            <p className="text-xs italic">{status.loadingMessage || "Connecting to WhatsApp servers..."} ({status.loadingPercent}%)</p>
                          </div>
                        )
                        : success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* QR Code Display */}
                {status?.qrCode && !status.ready && (
                  <div className="flex flex-col items-center p-6 bg-muted rounded-lg border-2 border-dashed">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Scan QR Code with WhatsApp
                    </h3>
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img
                        src={status.qrCode}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                      Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                      <br />
                      Then scan this QR code
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleInitialize}
                    disabled={isInitializing || status?.initialized}
                    className="w-full"
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Initialize WhatsApp"
                    )}
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => checkStatus()}
                      disabled={isChecking}
                      className="w-full"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        "Refresh Status"
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut || !status?.hasClient}
                      className="w-full"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout / Reset
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold">How to Connect WhatsApp</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Click the "Initialize WhatsApp" button above</li>
                    <li>A QR code will appear on this page</li>
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices → Link a Device</li>
                    <li>Scan the QR code shown on this page</li>
                    <li>Wait for the connection to be established</li>
                    <li>The status will update automatically once connected</li>
                  </ol>

                  <h3 className="text-lg font-semibold mt-6">How It Works</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>When a blood request is submitted, the system finds compatible donors</li>
                    <li>WhatsApp messages are automatically sent to all registered donors with WhatsApp numbers</li>
                    <li>Messages are sent from the admin WhatsApp account that you connect</li>
                    <li>Donors receive formatted messages with all emergency details</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6">Important Notes</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>The WhatsApp connection persists across server restarts</li>
                    <li>Only one WhatsApp account can be connected at a time</li>
                    <li>Make sure the phone with the connected WhatsApp account stays online</li>
                    <li>Donors must provide their WhatsApp number during registration to receive alerts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

