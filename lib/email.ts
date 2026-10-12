import nodemailer from "nodemailer";

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

/**
 * Creates and returns a Nodemailer transporter using server-side SMTP environment variables.
 * Returns null if SMTP is not configured.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const portStr = process.env.SMTP_PORT?.trim() || "587";

  if (!host || !user || !pass) {
    return null;
  }

  const port = parseInt(portStr, 10) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    // Useful for cloud / serverless deployments
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Builds professional branded HTML for SALVORA Admin Password Reset.
 */
function buildResetEmailHtml(otp: string, userName?: string): string {
  const greeting = userName ? `Hello ${userName},` : "Hello,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SALVORA Admin Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8F9FA;padding:40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background-color:#FFFFFF;border-radius:24px;border:1px solid #E7E5E4;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);overflow:hidden;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Branding -->
          <tr>
            <td style="background-color:#12101C;padding:32px 36px;text-align:center;">
              <span style="display:inline-block;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:4px;text-transform:uppercase;margin:0;">
                SALVORA
              </span>
              <div style="color:#A78BFA;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:6px;">
                Website Admin Portal
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 36px 24px 36px;">
              <h1 style="color:#1C1917;font-size:20px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.02em;">
                Admin Password Reset
              </h1>
              
              <p style="color:#57534E;font-size:14px;line-height:22px;margin:0 0 20px 0;">
                ${greeting}
              </p>
              
              <p style="color:#57534E;font-size:14px;line-height:22px;margin:0 0 24px 0;">
                We received a request to reset the password for your SALVORA administrator account. Use the 6-digit verification code below to proceed:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="background-color:#FAF5FF;border:1px solid #E9D5FF;border-radius:16px;padding:24px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7C3AED;margin-bottom:8px;">
                      Verification Code
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#581C87;padding-left:10px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0 0;">
                <tr>
                  <td style="background-color:#F5F5F4;border-radius:12px;padding:14px 16px;">
                    <p style="color:#44403C;font-size:12px;line-height:18px;margin:0;">
                      ⏱ <strong>Expiry Notice:</strong> This code is valid for <strong>10 minutes</strong>. For your security, it can only be used once.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="color:#78716C;font-size:12px;line-height:18px;margin:24px 0 0 0;">
                🔒 If you did not request a password reset, you can safely ignore this email. Your current password remains secure and will not change without this code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAFAF9;border-top:1px solid #F5F5F4;padding:20px 36px;text-align:center;">
              <p style="color:#A8A29E;font-size:11px;line-height:16px;margin:0;">
                SALVORA Salon Management • Automated Security Notification<br>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds plain-text fallback content.
 */
function buildResetEmailText(otp: string): string {
  return `SALVORA - Admin Password Reset\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.`;
}

/**
 * Sends the password reset OTP email using configured SMTP.
 * If SMTP credentials are missing, logs a configuration notice without exposing the OTP.
 */
export async function sendPasswordResetOtpEmail({
  to,
  otp,
  userName,
}: SendOtpEmailOptions): Promise<{ success: boolean; simulated?: boolean; message?: string }> {
  try {
    const transporter = getEmailTransporter();

    if (!transporter) {
      // SMTP not configured - gracefully simulate for local development / testing
      console.warn(
        `[Email Service] SMTP credentials not configured. OTP email simulated for recipient: ${to}`
      );
      return {
        success: true,
        simulated: true,
        message: "SMTP not configured. Email simulated in development mode.",
      };
    }

    const fromAddress =
      process.env.SMTP_FROM?.trim() ||
      `"SALVORA Admin" <${process.env.SMTP_USER?.trim()}>`;

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: "SALVORA Admin Password Reset",
      text: buildResetEmailText(otp),
      html: buildResetEmailHtml(otp, userName),
    });

    return { success: true };
  } catch (error) {
    console.error(
      `[Email Service] Failed to send password reset email to ${to}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      success: false,
      message: "Failed to send email through SMTP service.",
    };
  }
}
