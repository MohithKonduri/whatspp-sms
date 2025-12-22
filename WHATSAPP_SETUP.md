# WhatsApp Automation Setup Guide

## Overview

The WhatsApp automation feature sends instant alerts to registered donors when a blood request is submitted. Messages are sent from the admin WhatsApp account to all compatible donors who have provided their WhatsApp numbers.

## Features

- ✅ Automatic WhatsApp notifications when blood requests are created
- ✅ Messages sent to compatible donors based on blood group and district
- ✅ Formatted messages with all emergency details
- ✅ Admin dashboard for WhatsApp connection management
- ✅ QR code-based authentication (no API keys needed)

## Setup Instructions

### Step 1: Install Dependencies

The required packages are already installed:
- `whatsapp-web.js` - WhatsApp Web API wrapper
- `qrcode-terminal` - QR code display in terminal

### Step 2: Connect Admin WhatsApp Account

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Access Admin Dashboard**:
   - Go to `/admin/login` and login as admin
   - Navigate to "WhatsApp Setup" in the sidebar

3. **Initialize WhatsApp**:
   - Click the "Initialize WhatsApp" button
   - The QR code will appear directly on the website (and in the server console)
   - Scan the QR code with your phone

4. **Scan QR Code**:
   - Open WhatsApp on your phone
   - Go to **Settings → Linked Devices → Link a Device**
   - Scan the QR code shown on the screen
   - Wait for the connection to be established

5. **Verify Connection**:
   - The status page will automatically update
   - You should see all green checkmarks when connected

### Step 3: Configure Donor Registration

Donors can now provide their WhatsApp number during registration:
- The WhatsApp number field is optional
- If left empty, the mobile number will be used
- Donors with WhatsApp numbers will receive instant alerts

### Step 4: Test the System

1. **Create a Test Blood Request**:
   - Go to `/emergency` page
   - Fill out the emergency request form
   - Submit the request

2. **Check WhatsApp Messages**:
   - Compatible donors with WhatsApp numbers should receive messages
   - Messages are sent from the admin WhatsApp account
   - Check the console for sending status

## How It Works

### Request Flow

1. **User submits blood request** via `/emergency` page or dashboard emergency contact
2. **System finds compatible donors**:
   - Matches blood group compatibility
   - Filters by district (if specified)
   - Only includes available donors
   - Only includes donors with WhatsApp numbers

3. **WhatsApp messages are sent**:
   - Messages are formatted with all emergency details
   - Sent in bulk to all compatible donors
   - 2-second delay between messages to avoid rate limiting

4. **Donors receive alerts**:
   - Formatted message with priority level
   - Blood group needed
   - Location and contact information
   - Hospital details (if provided)

### Message Format

```
🚨 URGENT BLOOD REQUEST 🚨

🔴 Priority: CRITICAL

Blood Group Needed: O+
Location: Hyderabad
Patient Name: John Doe
Hospital: City Hospital
Required Units: 2
Details: Emergency surgery needed

Contact Information:
Name: Jane Doe
Phone: +91 9876543210

━━━━━━━━━━━━━━━━━━━━
If you can help, please contact the requester directly.
Thank you for being a lifesaver! ❤️

_NSS BloodConnect System_
```

## Admin Dashboard

### WhatsApp Status Page (`/admin/whatsapp`)

- **Status Monitoring**: Real-time connection status
- **Initialization**: One-click WhatsApp connection
- **Auto-refresh**: Status updates every 5 seconds
- **Setup Instructions**: Built-in guide

### Status Indicators

- ✅ **Initialized**: WhatsApp client is initialized
- ✅ **Ready**: WhatsApp is connected and ready to send
- ✅ **Client Connected**: Active connection to WhatsApp Web

## Troubleshooting

### WhatsApp Not Connecting

1. **Check Server Console**: Look for QR code or error messages
2. **Restart Server**: Stop and restart `npm run dev`
3. **Clear Auth Data**: Delete `.wwebjs_auth` folder and reinitialize
4. **Check Phone**: Ensure phone with WhatsApp is online

### Messages Not Sending

1. **Check Connection Status**: Verify WhatsApp is ready in admin dashboard
2. **Check Donor Data**: Ensure donors have WhatsApp numbers
3. **Check Console**: Look for error messages in server console
4. **Rate Limiting**: Messages are sent with 2-second delays

### QR Code Not Appearing
 
 1. **Check Status**: Click "Refresh Status" to check if initialization is complete
 2. **Check Terminal**: Backup QR code always appears in server console
 3. **Check Dependencies**: Ensure `qrcode-terminal` is installed
3. **Restart Server**: Try restarting the development server

## File Structure

```
lib/
  ├── whatsapp-service.ts          # Core WhatsApp client service
  ├── whatsapp-notifications.ts    # Notification formatting and sending
app/
  ├── api/
  │   └── send-whatsapp/
  │       └── route.ts             # API endpoint for sending messages
  └── admin/
      └── whatsapp/
          └── page.tsx             # Admin WhatsApp configuration page
components/
  └── admin-sidebar.tsx            # Updated with WhatsApp link
```

## Environment Variables

No environment variables are required for basic setup. The WhatsApp connection uses QR code authentication.

Optional:
- `NEXT_PUBLIC_APP_URL` - For server-side API calls (defaults to localhost:3000)

## Security Notes

- WhatsApp authentication data is stored locally in `.wwebjs_auth` folder
- This folder is automatically added to `.gitignore`
- Only one WhatsApp account can be connected at a time
- Messages are sent from the connected admin account

## Production Deployment (Render.com Recommended)

We have created a `Dockerfile` optimized for deploying this application on Render.com.

1.  **Push your code to GitHub** including the new `Dockerfile`.
2.  **Create a New Web Service** on Render.
3.  **Connect your repository**.
4.  **Select "Docker"** as the Runtime (Render should auto-detect the Dockerfile).
5.  **Environment Variables**:
    Add the following environment variables in the Render dashboard:
    *   `GMAIL_USER`: Your Gmail address
    *   `GMAIL_APP_PASSWORD`: Your App Password
    *   All Firebase variables (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.) from your `.env.local`

### ⚠️ Important Note on Persistence
On the free tier of Render, the filesystem is **ephemeral**. This means every time you redeploy, the WhatsApp session will be reset, and you will need to scan the QR code again.

To fix this (optional, paid feature):
1.  Add a **Disk** in Render settings.
2.  Mount path: `/app/.wwebjs_auth`
3.  Size: 1GB is sufficient.

This ensures your WhatsApp login stays active across deployments.

## Support

If you encounter issues:
1. Check the server console for detailed error messages
2. Verify all dependencies are installed correctly
3. Ensure the WhatsApp account stays connected
4. Check that donors have provided WhatsApp numbers

