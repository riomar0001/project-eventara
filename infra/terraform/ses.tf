# SES sending identity. Add the DKIM CNAMEs from the `ses_dkim_records` output
# to your DNS, then request SES production access (new accounts are sandboxed
# and can only email verified addresses).

resource "aws_sesv2_email_identity" "mail" {
  email_identity = var.mail_domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}
