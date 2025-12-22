# 🚀 Fixing Features on Render Deployment

If you have deployed this application to Render, you must configure your environment and build settings correctly for Email and WhatsApp to work.

## 📧 1. Fix Email (Gmail)
Emails fail on Render because the environment variables are not automatically shared from your local `.env.local` file.

1.  Go to your **Render Dashboard**.
2.  Select your Web Service.
3.  Click on **Environment** in the left sidebar.
4.  Add these **Environment Variables**:
    -   `GMAIL_USER`: your@gmail.com
    -   `GMAIL_APP_PASSWORD`: your-16-character-app-password
    -   `ADMIN_EMAIL`: vignanpranadhara@gmail.com (You can add multiple emails separated by commas: `admin1@gmail.com,admin2@gmail.com`)
5.  Click **Save Changes**. Render will redeploy automatically.

**💡 Pro Tip**: I have added a "Safety BCC" feature. Every email sent by the system will now automatically BCC the email set in `ADMIN_EMAIL`. If you are sending emails to yourself, check your **Sent** folder in Gmail!

**Verify**: Visit `https://your-app-url.render.com/api/test-config` to check if the variables are detected.

---

## 📱 2. WhatsApp on Docker (Render)
Since your project uses a **Dockerfile**, you do NOT need a Build Command. The Dockerfile already handles installing the Chrome browser for you.

### **How it works:**
-   The `Dockerfile` in your repo automatically installs `google-chrome-stable`.
-   It also sets the `PUPPETEER_EXECUTABLE_PATH` to `/usr/bin/google-chrome-stable`.
-   **No manual commands needed** in the Render dashboard.

### **Docker Command Field**:
If you see a field named "Docker Command" in Render, you can **leave it empty**. Render will automatically use the `CMD ["node", "server.js"]` instruction already inside your Dockerfile.

---

## 🔗 3. Common Issues on Render
1.  **Disk Space**: Puppeteer and Chrome capture some cache. If your service crashes, try increasing the "Plan" to one with more RAM (at least 512MB or 1GB is recommended for WhatsApp Web.js).
2.  **QR Code**: To link your WhatsApp, visit your site's admin panel at `/admin/whatsapp`. The QR code will be generated there.

Once the variables are saved and the build finishes:
1.  Try an Emergency Request.
2.  Check the **Log Viewer** in Render. 
3.  Look for `[PROD-LOG] ✅ SMTP Connection Verified`. If you see a `Failed` message, it will give you a specific error code like `EAUTH` (wrong password).

---

### **Need more help?**
If the logs still show errors after doing the above, please copy and paste the last 20 lines of your Render "Logs" here so I can see the exact system error.
