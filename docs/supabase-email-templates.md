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

## Optional: also customize "Change Email Address"

If you want to brand the change-email confirmation flow too, copy any of the templates above and adjust the headline / body. Same `{{ .ConfirmationURL }}` variable.

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
