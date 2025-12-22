import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, replyTo } = await request.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format (can be multiple emails separated by commas)
    const emails = to.split(',').map((e: string) => e.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const allValid = emails.every((e: string) => emailRegex.test(e))
    if (!allValid) {
      return NextResponse.json(
        { success: false, error: 'One or more invalid email addresses in the recipient list' },
        { status: 400 }
      )
    }

    // Basic XSS protection - limit HTML size
    if (html.length > 50000) {
      return NextResponse.json(
        { success: false, error: 'Email content too large' },
        { status: 400 }
      )
    }

    // Create transporter using Gmail SMTP
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD

    console.log('[PROD-LOG] Checking Email Config...')
    if (!gmailUser || !gmailPassword) {
      console.error('[PROD-LOG] ❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.')
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing environment variables' },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })

    // Verify connection immediately for production debugging
    try {
      await transporter.verify()
      console.log('[PROD-LOG] ✅ SMTP Connection Verified')
    } catch (verifyError: any) {
      console.error('[PROD-LOG] ❌ SMTP Verification Failed:', verifyError.message)
      throw verifyError // Re-throw to be caught by the main catch block
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"NSS BloodConnect" <${gmailUser}>`,
      to,
      bcc: process.env.ADMIN_EMAIL || undefined, // Safety net: Always notify admin defined in server environment
      subject,
      html,
      text: text || subject,
      replyTo: replyTo || undefined,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
      },
      priority: 'high',
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    })
  } catch (error: any) {
    console.error('❌ Failed to send email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })

    let userFriendlyError = 'Failed to send email'
    if (error.code === 'EAUTH') {
      userFriendlyError = 'Authentication failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD.'
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      userFriendlyError = 'Connection timed out. Check your internet connection or SMTP settings.'
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
