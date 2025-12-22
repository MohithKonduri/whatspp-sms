import { NextRequest, NextResponse } from "next/server"

// Mark this route as server-only
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Dynamic import to avoid bundling issues with whatsapp-web.js
async function getWhatsAppService() {
  // Only import on server-side
  if (typeof window !== "undefined") {
    throw new Error("WhatsApp service can only be used server-side")
  }
  return await import("@/lib/whatsapp-service")
}

export async function POST(request: NextRequest) {
  try {
    const whatsappService = await getWhatsAppService()
    const { sendWhatsAppMessage, sendBulkWhatsAppMessages, initializeWhatsApp, isWhatsAppReady } = whatsappService

    const body = await request.json()
    const { phoneNumber, message, recipients, initialize, logout } = body

    // Handle logout request
    if (logout) {
      const { logoutWhatsApp } = whatsappService
      const loggedOut = await logoutWhatsApp()

      const status = whatsappService.getWhatsAppStatus()
      return NextResponse.json({
        success: loggedOut,
        status: status,
        message: loggedOut ? "WhatsApp logged out successfully" : "Failed to logout WhatsApp",
      })
    }

    // Handle initialization request
    if (initialize) {
      const initialized = await initializeWhatsApp(false) // Don't wait for connection, just start init
      const status = whatsappService.getWhatsAppStatus()
      return NextResponse.json({
        success: initialized,
        status: status,
        message: initialized ? "WhatsApp initialized successfully" : "Initialization in progress, check for QR code",
      })
    }

    // Check if WhatsApp is ready, if not try to initialize
    if (!isWhatsAppReady()) {
      console.log("📱 Initializing WhatsApp client...")
      const initialized = await initializeWhatsApp()
      if (!initialized) {
        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp client is not ready. Please ensure the admin WhatsApp account is connected by scanning the QR code.",
          },
          { status: 503 }
        )
      }
    }

    // Single message
    if (phoneNumber && message) {
      const result = await sendWhatsAppMessage(phoneNumber, message)
      if (result.success) {
        return NextResponse.json({ success: true, message: "WhatsApp message sent successfully" })
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }
    }

    // Bulk messages
    if (recipients && Array.isArray(recipients)) {
      const result = await sendBulkWhatsAppMessages(recipients)
      return NextResponse.json({
        success: result.failed === 0,
        sent: result.success,
        failed: result.failed,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid request. Provide either phoneNumber+message or recipients array" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error in send-whatsapp API:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send WhatsApp message" },
      { status: 500 }
    )
  }
}

// GET endpoint to check WhatsApp status and get QR code
export async function GET(request: NextRequest) {
  try {
    const whatsappService = await getWhatsAppService()
    const { initializeWhatsApp, getWhatsAppStatus, isInitializing } = whatsappService
    const status = getWhatsAppStatus()

    if (!status.ready && !status.initialized && !isInitializing()) {
      console.log("📱 Status check: Triggering background initialization...")
      initializeWhatsApp(false).catch((err: any) => console.error("Background whatsapp init error:", err))
    } else {
      console.log("📱 Status check completed", {
        ready: status.ready,
        initialized: status.initialized,
        initializing: isInitializing()
      })
    }

    // Return the current status immediately without blocking
    return NextResponse.json({
      status: status,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get WhatsApp status" },
      { status: 500 }
    )
  }
}
// DELETE endpoint to logout and reset WhatsApp
export async function DELETE(request: NextRequest) {
  try {
    const whatsappService = await getWhatsAppService()
    const { logoutWhatsApp } = whatsappService

    console.log("📱 Reset request received. Logging out WhatsApp...")
    const success = await logoutWhatsApp()

    if (success) {
      return NextResponse.json({ message: "WhatsApp logged out successfully" })
    } else {
      throw new Error("Failed to logout WhatsApp")
    }
  } catch (error: any) {
    console.error("❌ Logout API Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to logout WhatsApp" },
      { status: 500 }
    )
  }
}

// PATCH endpoint for initialization (compatible with old client)
export async function PATCH(request: NextRequest) {
  try {
    const whatsappService = await getWhatsAppService()
    const { initializeWhatsApp, getWhatsAppStatus } = whatsappService

    console.log("📱 PATCH request received. Initializing WhatsApp...")
    const initialized = await initializeWhatsApp(false)
    const status = getWhatsAppStatus()

    return NextResponse.json({
      success: initialized,
      status: status,
      message: initialized ? "WhatsApp initialized successfully" : "Initialization started",
    })
  } catch (error: any) {
    console.error("Error in WhatsApp PATCH API:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize WhatsApp" },
      { status: 500 }
    )
  }
}
