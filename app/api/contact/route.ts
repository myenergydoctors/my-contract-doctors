import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Email to Jesse
    await sgMail.send({
      to: "jesse@myenergydoctors.com",
      from: "noreply@mycontractdoctors.com",
      subject: `New Contact Form Submission — ${name}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          
          <!-- Header -->
          <div style="background: #0C2D54; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <div style="margin-bottom: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #6AAEE0;">My</div>
            <div style="font-size: 22px; color: #ffffff;">Contract <span style="font-style: italic; color: #6AAEE0;">Doctors</span></div>
            <div style="margin-top: 8px; font-size: 13px; color: rgba(255,255,255,0.6);">New contact form submission</div>
          </div>

          <!-- Body -->
          <div style="padding: 32px 40px; background: #F7F9FC; border: 1px solid #E2E8F0; border-top: none;">
            
            <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; width: 120px;">Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 15px; color: #0C2D54;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;">Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 15px; color: #0C2D54;"><a href="mailto:${email}" style="color: #3D80C8; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;">Phone</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8; font-size: 15px; color: #0C2D54;">${phone || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">Message</td>
                  <td style="padding: 10px 0; font-size: 15px; color: #0C2D54; line-height: 1.7;">${message.replace(/\n/g, "<br>")}</td>
                </tr>
              </table>
            </div>

            <a href="mailto:${email}" style="display: inline-block; background: #17A882; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Reply to ${name}</a>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 40px; background: #081E38; border-radius: 0 0 12px 12px; text-align: center;">
            <div style="font-size: 12px; color: rgba(255,255,255,0.3);">© 2026 My Contract Doctors | mycontractdoctors.com</div>
          </div>
        </div>
      `,
    });

    // Confirmation email to the person who submitted
    await sgMail.send({
      to: email,
      from: "noreply@mycontractdoctors.com",
      subject: "We received your message — My Contract Doctors",
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          
          <!-- Header -->
          <div style="background: #0C2D54; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <div style="margin-bottom: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #6AAEE0;">My</div>
            <div style="font-size: 22px; color: #ffffff;">Contract <span style="font-style: italic; color: #6AAEE0;">Doctors</span></div>
          </div>

          <!-- Body -->
          <div style="padding: 40px; background: #F7F9FC; border: 1px solid #E2E8F0; border-top: none;">
            <h1 style="font-size: 26px; color: #0C2D54; margin: 0 0 16px; line-height: 1.2;">Thanks, ${name.split(" ")[0]}. We'll be in touch.</h1>
            <p style="font-size: 15px; color: #64748B; line-height: 1.75; margin: 0 0 24px;">We received your message and will get back to you within one business day.</p>
            
            <div style="background: #ffffff; border: 1px solid #E2E8F0; border-left: 4px solid #3D80C8; border-radius: 0 10px 10px 0; padding: 18px 20px; margin-bottom: 28px;">
              <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your message</div>
              <div style="font-size: 14px; color: #334155; line-height: 1.7;">${message.replace(/\n/g, "<br>")}</div>
            </div>

            <p style="font-size: 14px; color: #64748B; line-height: 1.7; margin: 0 0 28px;">While you wait, you can explore our tools — upload your invoice for a free recommendation, or walk through the Demystifier to understand your contract terms.</p>

            <div style="display: flex; gap: 12px;">
              <a href="https://mycontractdoctors.com/invoice" style="display: inline-block; background: #17A882; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 12px;">Upload My Invoice →</a>
              <a href="https://mycontractdoctors.com/demystifier" style="display: inline-block; background: #0C2D54; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">The Demystifier →</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 40px; background: #081E38; border-radius: 0 0 12px 12px; text-align: center;">
            <div style="font-size: 12px; color: rgba(255,255,255,0.3);">© 2026 My Contract Doctors | We're on your side, not the vendor's.</div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SendGrid error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}