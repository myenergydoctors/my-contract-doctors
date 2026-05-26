# Supabase Email Templates — My Contract Doctors

Paste each block into **Supabase → Authentication → Email Templates → [template name]**. Each one uses Supabase's template variables (`{{ .ConfirmationURL }}`, `{{ .Email }}`, etc.) so the magic-link/confirm URLs work automatically.

Subject lines go in the **Subject heading** field. HTML goes in the **Message body** field. Switch the editor to **HTML** mode (not the rich text editor) to paste these in.

---

## 1. Confirm signup

**Subject:** `Confirm your My Contract Doctors account`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <!-- Header -->
        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Welcome aboard.</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
            Thanks for signing up. Click below to confirm your email and finish setting up your account. From there, you can upload your first invoice and get a free recommendation in under two minutes.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#17A882;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Confirm my email →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0 0 8px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size:12px;color:#3D80C8;word-break:break-all;line-height:1.5;margin:0;">
            {{ .ConfirmationURL }}
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">
            If you didn't sign up for My Contract Doctors, you can safely ignore this email.
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link

**Subject:** `Your sign-in link for My Contract Doctors`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Your sign-in link.</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
            Click the button below to sign in to your dashboard. No password needed — this link is good for the next hour.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#17A882;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Sign me in →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0 0 8px;">
            Or paste this link:
          </p>
          <p style="font-size:12px;color:#3D80C8;word-break:break-all;line-height:1.5;margin:0;">
            {{ .ConfirmationURL }}
          </p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">
            Didn't request this? Someone may have typed your email by accident — you can ignore this message.
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password

**Subject:** `Reset your My Contract Doctors password`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Reset your password.</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
            We received a request to reset your password. Click the button below to choose a new one. The link is good for the next hour.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#0C2D54;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Reset password →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0 0 8px;">Or paste this link:</p>
          <p style="font-size:12px;color:#3D80C8;word-break:break-all;line-height:1.5;margin:0;">
            {{ .ConfirmationURL }}
          </p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">
            If you didn't request a password reset, you can safely ignore this email — your password stays the same.
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 4. Invite User

**Subject:** `You're invited to My Contract Doctors`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">You've been invited.</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
            Someone invited you to My Contract Doctors — a service that helps small businesses understand their uniform and linen service contracts and find savings opportunities.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#17A882;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Accept invitation →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0;">
            Or paste this link: <span style="color:#3D80C8;word-break:break-all;">{{ .ConfirmationURL }}</span>
          </p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.3);">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 5. Change Email Address

Sent to the **new** email when a signed-in user changes their email in settings. They click to confirm the new address belongs to them.

**Subject:** `Confirm your new email address`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Confirm your new email address.</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
            You asked to change the email on your My Contract Doctors account. Click below to confirm this new address. After confirming, you'll sign in with this email going forward.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#17A882;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Confirm new email →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0 0 8px;">Or paste this link:</p>
          <p style="font-size:12px;color:#3D80C8;word-break:break-all;line-height:1.5;margin:0;">{{ .ConfirmationURL }}</p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">
            Didn't ask to change your email? Ignore this message — nothing will change.
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication

Sent when a user needs to re-verify their identity for a sensitive action (changing payment details, deleting account, etc.).

**Subject:** `Verify it's you · My Contract Doctors`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">

        <tr><td style="background:#0C2D54;padding:28px 36px;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
          <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Quick check — is this you?</h1>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 18px;">
            You're trying to make a sensitive change to your account. To keep things secure, we need you to verify your identity using the code below.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;width:100%;">
            <tr><td style="background:#F7F9FC;border:1px solid #E2E8F0;border-radius:10px;padding:20px;text-align:center;">
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Your verification code</div>
              <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:6px;color:#0C2D54;font-weight:bold;">{{ .Token }}</div>
              <div style="font-size:12px;color:#64748B;margin-top:8px;">Expires in 10 minutes</div>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748B;line-height:1.65;margin:0;">
            Enter this code on the page that prompted you.
          </p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">
            Didn't make this request? Someone may have your password. Reset it immediately at mycontractdoctors.com/sign-in.
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">
            © My Contract Doctors · We're on your side, not the vendor's.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## Security notifications (Supabase native — toggle ON + brand the templates)

In **Supabase → Authentication → Emails → Security** (or similar), Supabase has built-in toggles for these. **Turn all 7 on.** Each opens its own template editor.

All use the same shell — only the headline and body text differ. Pattern below.

---

### 7. Password changed

**Subject:** `Your My Contract Doctors password was changed`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Your password was just changed.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          We're letting you know that the password on your My Contract Doctors account was updated.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          <strong>If this was you</strong>, no action needed.<br/>
          <strong>If this wasn't you</strong>, secure your account immediately.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#DC2626;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Secure my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 8. Email address changed

**Subject:** `Your My Contract Doctors email was changed`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Your email address was just changed.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          The email address on your My Contract Doctors account was updated. If you did this, no action needed.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          If you <strong>didn't make this change</strong>, secure your account right away — your password may have been compromised.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#DC2626;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Secure my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 9. Phone number changed

**Subject:** `Your My Contract Doctors phone number was changed`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Your phone number was just changed.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          The phone number on your account was updated. This is the number we'll use for SMS sign-in codes and security alerts going forward.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          Didn't make this change? Secure your account immediately.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#DC2626;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Secure my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 10. Sign-in method linked

**Subject:** `A new sign-in method was added to your account`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#E2EEFA;color:#3D80C8;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">A new sign-in method was added.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          Someone added a new way to sign in to your My Contract Doctors account. Going forward you can sign in using this new method in addition to your existing ones.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          Didn't add this? Someone may have access to your account. Sign in and review your sign-in methods immediately.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#3D80C8;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Review my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 11. Sign-in method removed

**Subject:** `A sign-in method was removed from your account`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">A sign-in method was removed.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          One of your sign-in methods was removed from your My Contract Doctors account. You'll no longer be able to use it to sign in.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          Didn't remove this yourself? Sign in and check your remaining sign-in methods right away.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#DC2626;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Secure my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 12. MFA method added

**Subject:** `Multi-factor authentication added to your account`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#D4F2EA;color:#0D6E52;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security update</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">Multi-factor authentication is on.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          Nice — you just added a new MFA method to your account. From now on, you'll be prompted for a second factor when signing in. This makes your account significantly harder to break into.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          Didn't do this? Sign in and review your MFA settings.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#17A882;border-radius:8px;">
          <a href="https://mycontractdoctors.com/dashboard/settings" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">View security settings →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

### 13. MFA method removed

**Subject:** `Multi-factor authentication was removed`

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(12,45,84,0.08);">
      <tr><td style="background:#0C2D54;padding:28px 36px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6AAEE0;margin-bottom:6px;">My</div>
        <div style="font-size:22px;color:#ffffff;font-family:Georgia,serif;">Contract <span style="font-style:italic;color:#6AAEE0;">Doctors</span></div>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <div style="display:inline-block;background:#FEE2E2;color:#DC2626;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:18px;">Security notice</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#0C2D54;margin:0 0 14px;line-height:1.25;">An MFA method was removed.</h1>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 20px;">
          A multi-factor authentication method was removed from your My Contract Doctors account. If this was your only MFA method, your account is now protected by password alone.
        </p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px;">
          Didn't remove this? Sign in immediately and review your account — your password may be compromised.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td style="background:#DC2626;border-radius:8px;">
          <a href="https://mycontractdoctors.com/sign-in" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;">Secure my account →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 36px;background:#081E38;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">© My Contract Doctors · We're on your side, not the vendor's.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

---

## After saving

Send yourself one more test signup to verify:
1. The "From" address shows `My Contract Doctors <noreply@mycontractdoctors.com>` instead of the Supabase default
2. The email renders with the navy header, teal CTA button, dark footer
3. Click works and lands you in the dashboard

If the new "From" doesn't show up, double-check:
- SMTP credentials saved (was the toggle actually flipped on?)
- SendGrid domain authentication is still active (Sender Authentication → Domain Auth)
- Email isn't in spam (custom-SMTP test emails sometimes start there until the receiver marks them safe)
