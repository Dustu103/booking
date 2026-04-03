# 📧 SMTP Configuration Guide

This document explains how to configure the email system for MovieShine to send booking confirmations.

## 🚀 Recommended: Brevo (Formerly Sendinblue)
The application is pre-configured to use **Brevo**'s SMTP relay.

1.  **Sign Up**: Create a free account at [Brevo.com](https://www.brevo.com/).
2.  **Get API Key**:
    -   Go to **SMTP & API** in your dashboard.
    -   Click on the **SMTP** tab.
    -   Copy your **SMTP Server** (should be `smtp-relay.brevo.com`).
    -   Copy your **Login** (this will be your `SMTP_USER`).
    -   Create a new **Master Password** (this will be your `SMTP_PASS`).
3.  **Update Environment**:
    Add the credentials to `server/.env`:
    ```bash
    SMTP_USER=your-brevo-login@email.com
    SMTP_PASS=your-brevo-master-password
    SENDER_EMAIL=your-verified-brevo-sender@email.com
    ```

---

## 🔒 Alternative: Gmail App Passwords
If you prefer using a Gmail account:

1.  **Enable 2FA**: Ensure Two-Factor Authentication is enabled on your Google Account.
2.  **App Password**:
    -   Go to [Google Account Security](https://myaccount.google.com/security).
    -   Search for **"App passwords"**.
    -   Name it "MovieShine" and click **Create**.
    -   Copy the 16-character code.
3.  **Update Code & Env**:
    -   In `server/src/configs/nodeMailer.ts`, change the `host` to `smtp.gmail.com`.
    -   In `server/.env`:
        ```bash
        SMTP_USER=your-email@gmail.com
        SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character code
        SENDER_EMAIL=your-email@gmail.com
        ```

---

## 🛠️ Testing the Configuration
Once configured, you can test the email system by creating a test booking in the application. The system will attempt to send a confirmation email via the `nodeMailer.ts` configuration.

> [!IMPORTANT]
> Always ensure your `SENDER_EMAIL` is a verified sender in your SMTP provider's dashboard, or emails may be rejected.
