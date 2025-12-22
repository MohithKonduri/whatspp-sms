import { searchDonors } from "./firestore-utils"
import type { Donor } from "./types"

export interface BloodRequestData {
  bloodGroup: string
  district: string
  urgency: "low" | "medium" | "high" | "critical"
  description?: string
  contactName: string
  contactPhone: string
  patientName?: string
  hospitalName?: string
  requiredUnits?: string
}

/**
 * Format WhatsApp message for blood request
 */
export function formatBloodRequestMessage(data: BloodRequestData): string {
  const urgencyEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  }

  const urgencyText = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    critical: "CRITICAL",
  }

  let message = `🚨 *URGENT BLOOD REQUEST* 🚨\n\n`
  message += `${urgencyEmoji[data.urgency]} *Priority: ${urgencyText[data.urgency]}*\n\n`

  message += `*Blood Group Needed:* ${data.bloodGroup}\n`
  message += `*Location:* ${data.district}\n`

  if (data.patientName) {
    message += `*Patient Name:* ${data.patientName}\n`
  }

  if (data.hospitalName) {
    message += `*Hospital:* ${data.hospitalName}\n`
  }

  if (data.requiredUnits) {
    message += `*Required Units:* ${data.requiredUnits}\n`
  }

  if (data.description) {
    message += `*Details:* ${data.description}\n`
  }

  message += `\n*Contact Information:*\n`
  message += `Name: ${data.contactName}\n`
  message += `Phone: ${data.contactPhone}\n`

  message += `\n━━━━━━━━━━━━━━━━━━━━\n`
  message += `If you can help, please contact the requester directly.\n`
  message += `Thank you for being a lifesaver! ❤️\n`
  message += `\n_NSS BloodConnect System_`

  return message
}

/**
 * Send WhatsApp notifications to compatible donors
 */
export async function sendBloodRequestWhatsAppNotifications(
  requestData: BloodRequestData
): Promise<{ success: number; failed: number; errors: Array<{ phoneNumber: string; error: string }> }> {
  try {
    console.log(`📱 Starting WhatsApp notification process for ${requestData.bloodGroup} in ${requestData.district}...`)

    // Find compatible donors
    const compatibleDonors = await searchDonors(requestData.bloodGroup, requestData.district)
    console.log(`🔍 Found ${compatibleDonors.length} compatible donors in the database.`)

    // Filter donors with usable numbers and who are available
    // Fallback to donor.phone if whatsappNumber is not explicitly provided
    const donorsToNotify = compatibleDonors.filter(
      (donor) => (donor.whatsappNumber || donor.phone) && donor.isAvailable
    )

    if (donorsToNotify.length === 0) {
      console.log("ℹ️  No active donors with usable phone numbers found for this request.")
      return { success: 0, failed: 0, errors: [] }
    }

    console.log(`📱 Preparing to send WhatsApp notifications to ${donorsToNotify.length} donors.`)

    // Format the message
    const message = formatBloodRequestMessage(requestData)

    // Prepare recipients
    const recipients = donorsToNotify.map((donor) => ({
      phoneNumber: donor.whatsappNumber || donor.phone,
      message: message,
    }))

    // Send via API (use relative URL for client-side, absolute for server-side)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const apiUrl = typeof window !== "undefined"
      ? "/api/send-whatsapp"
      : (appUrl ? `${appUrl}/api/send-whatsapp` : "http://localhost:3000/api/send-whatsapp")

    console.log(`🌐 Calling WhatsApp API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients }),
    })

    if (!response.ok) {
      let errorInfo = "Unknown API Error"
      try {
        const errorData = await response.json()
        errorInfo = errorData.error || errorData.message || JSON.stringify(errorData)
      } catch (e) {
        errorInfo = `HTTP ${response.status}: ${response.statusText}`
      }
      console.error(`❌ WhatsApp API call failed: ${errorInfo}`)
      throw new Error(errorInfo)
    }

    const result = await response.json()
    console.log(`✅ WhatsApp API result: ${result.sent} success, ${result.failed} failed.`)

    return {
      success: result.sent || 0,
      failed: result.failed || 0,
      errors: result.errors || [],
    }
  } catch (error: any) {
    console.error("❌ Critical error in WhatsApp notification system:", error)
    return {
      success: 0,
      failed: 0,
      errors: [{ phoneNumber: "all", error: error.message || "Failed to send notifications" }],
    }
  }
}

