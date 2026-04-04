from app.core.config import settings


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
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">{preview}</span>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;width:100%;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#171717;">
                event<span style="color:#65a30d;">ara</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e5e5e5;
                        border-radius:16px;padding:40px 36px;">
              {body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#a3a3a3;line-height:1.6;">
                You received this email because an action was performed on your
                <span style="color:#65a30d;">Eventara</span> account.<br/>
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
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#171717;
                  letter-spacing:-0.3px;">Verify your email</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#737373;line-height:1.6;">
        Thanks for signing up. Confirm your email address to activate your account.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        <tr>
          <td style="border-radius:10px;background-color:#65a30d;">
            <a href="{link}"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:10px;
                       letter-spacing:0.1px;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;" />

      <p style="margin:0 0 8px;font-size:13px;color:#a3a3a3;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
        <a href="{link}" style="color:#65a30d;text-decoration:none;">{link}</a>
      </p>

      <p style="margin:0;font-size:13px;color:#a3a3a3;">
        This link expires in <strong style="color:#d97706;">24 hours</strong>.
      </p>
    """
    return _base_template(
        title="Verify your Eventara email",
        preview="Confirm your email address to get started with Eventara.",
        body=body,
    )


def reset_password_email_html(token: str) -> str:
    link = f"{settings.CORS_ORIGIN}/auth/reset-password?token={token}"
    body = f"""
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#171717;
                  letter-spacing:-0.3px;">Reset your password</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#737373;line-height:1.6;">
        We received a request to reset the password for your account.
        Click the button below to choose a new password.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        <tr>
          <td style="border-radius:10px;background-color:#65a30d;">
            <a href="{link}"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:10px;
                       letter-spacing:0.1px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;" />

      <p style="margin:0 0 8px;font-size:13px;color:#a3a3a3;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
        <a href="{link}" style="color:#65a30d;text-decoration:none;">{link}</a>
      </p>

      <p style="margin:0;font-size:13px;color:#a3a3a3;">
        This link expires in <strong style="color:#d97706;">1 hour</strong>.
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    """
    return _base_template(
        title="Reset your Eventara password",
        preview="Reset your password to regain access to your Eventara account.",
        body=body,
    )


def account_locked_email_html(unlock_minutes: int = 30) -> str:
    body = f"""
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#171717;
                  letter-spacing:-0.3px;">Account temporarily locked</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#737373;line-height:1.6;">
        We detected multiple failed login attempts on your account.
        For your security, your account has been temporarily locked.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation"
             style="margin-bottom:32px;width:100%;">
        <tr>
          <td style="background-color:#fef2f2;border:1px solid #fecaca;
                      border-radius:10px;padding:20px 24px;">
            <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
              Your account will automatically unlock in
              <strong>{unlock_minutes} minutes</strong>.
              If you need immediate access, reset your password below.
            </p>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        <tr>
          <td style="border-radius:10px;background-color:#65a30d;">
            <a href="{settings.CORS_ORIGIN}/auth/forgot-password"
               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:10px;
                       letter-spacing:0.1px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;" />

      <p style="margin:0;font-size:13px;color:#a3a3a3;">
        If this wasn't you, someone may be trying to access your account.
        We recommend resetting your password as soon as possible.
      </p>
    """
    return _base_template(
        title="Your Eventara account has been locked",
        preview="Multiple failed login attempts detected — your account is temporarily locked.",
        body=body,
    )


def otp_email_html(code: str) -> str:
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;background-color:#f5f5f5;border:1px solid #e5e5e5;'
        f'border-radius:8px;font-size:26px;font-weight:700;color:#171717;'
        f'margin:0 3px;">{d}</span>'
        for d in code
    )
    body = f"""
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#171717;
                  letter-spacing:-0.3px;">Login verification</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#737373;line-height:1.6;">
        Enter the code below to complete your sign-in.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation"
             style="margin:0 auto 32px;">
        <tr>
          <td align="center">{digits}</td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;" />

      <p style="margin:0 0 8px;font-size:13px;color:#a3a3a3;">
        This code expires in
        <strong style="color:#d97706;">10 minutes</strong>.
        Do not share it with anyone.
      </p>
      <p style="margin:0;font-size:13px;color:#a3a3a3;">
        If you didn't try to log in, reset your password immediately.
      </p>
    """
    return _base_template(
        title="Your Eventara login code",
        preview=f"Your login code is {code}. It expires in 10 minutes.",
        body=body,
    )
