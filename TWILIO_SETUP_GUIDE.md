# Twilio SMS Setup Guide

## Overview

The Twilio integration adds SMS capabilities to your blood donation system. This allows you to send urgent text alerts to donors, which is more reliable than WhatsApp for critical emergencies where internet connectivity might be an issue.

## Setup Instructions

### Step 1: Get Twilio Credentials

1.  Sign up or log in to [Twilio](https://www.twilio.com/).
2.  Go to your **Console Dashboard**.
3.  Locate your **Account SID** and **Auth Token**.
4.  Get a **Twilio Phone Number** (or use your existing one).

### Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### Step 3: Test the Integration

You can test the SMS service by sending a POST request to `/api/send-sms` or using the `sendSMS` function from `lib/twilio-service.ts`.

Example API Request:
```json
POST /api/send-sms
Content-Type: application/json

{
  "to": "+918888888888",
  "body": "🚨 TEST: Urgent Blood Request from NSS BloodConnect"
}
```

## How It Works

### lib/twilio-service.ts
Contains the core logic for initializing the Twilio client and sending messages. It includes:
- `sendSMS(data: SMSData)`: Sends a single SMS.
- `sendEmergencySMS(phoneNumbers, message)`: Sends bulk SMS notifications.

### app/api/send-sms/route.ts
An API endpoint that allows the frontend to trigger SMS notifications securely from the server side.

## Integration Plan

The SMS service is ready to be integrated into `app/emergency/page.tsx` alongside Email and WhatsApp notifications. This ensures a multi-channel alert system for every emergency.

---
_NSS BloodConnect System_
