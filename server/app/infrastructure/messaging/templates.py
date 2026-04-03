from app.config import settings


def _base_template(title: str, preview: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">{preview}</span>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;width:100%;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">
                event<span style="color:#a3e635;">ara</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#141414;border:1px solid #1f1f1f;
                        border-radius:16px;padding:40px 36px;">
              {body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#525252;line-height:1.6;">
                You received this email because an action was performed on your
                <span style="color:#a3e635;">Eventara</span> account.<br/>
                If this wasn't you, you can safely ignore this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def verification_email_html(token: str) -> str:
    link = f"{settings.CORS_ORIGIN}/auth/verify-email?token={token}"
    body = f"""
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;
                  letter-spacing:-0.3px;">Verify your email</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">
        Thanks for signing up. Confirm your email address to activate your account.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        <tr>
          <td style="border-radius:10px;background-color:#a3e635;">
            <a href="{link}"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                       color:#0a0a0a;text-decoration:none;border-radius:10px;
                       letter-spacing:0.1px;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #1f1f1f;margin:0 0 24px;" />

      <p style="margin:0 0 8px;font-size:13px;color:#737373;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
        <a href="{link}" style="color:#a3e635;text-decoration:none;">{link}</a>
      </p>

      <p style="margin:0;font-size:13px;color:#525252;">
        This link expires in <strong style="color:#fbbf24;">24 hours</strong>.
      </p>
    """
    return _base_template(
        title="Verify your Eventara email",
        preview="Confirm your email address to get started with Eventara.",
        body=body,
    )


def otp_email_html(code: str) -> str:
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;background-color:#1a1a1a;border:1px solid #2a2a2a;'
        f'border-radius:8px;font-size:26px;font-weight:700;color:#ffffff;'
        f'margin:0 3px;">{d}</span>'
        for d in code
    )
    body = f"""
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;
                  letter-spacing:-0.3px;">Login verification</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">
        Enter the code below to complete your sign-in.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation"
             style="margin:0 auto 32px;">
        <tr>
          <td align="center">{digits}</td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #1f1f1f;margin:0 0 24px;" />

      <p style="margin:0 0 8px;font-size:13px;color:#737373;">
        This code expires in
        <strong style="color:#fbbf24;">10 minutes</strong>.
        Do not share it with anyone.
      </p>
      <p style="margin:0;font-size:13px;color:#525252;">
        If you didn't try to log in, reset your password immediately.
      </p>
    """
    return _base_template(
        title="Your Eventara login code",
        preview=f"Your login code is {code}. It expires in 10 minutes.",
        body=body,
    )
