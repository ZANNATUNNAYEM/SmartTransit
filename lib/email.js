import nodemailer from 'nodemailer';

function getEmailConfiguration() {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (
    !emailUser ||
    !emailAppPassword ||
    !emailFrom ||
    !appUrl
  ) {
    throw new Error(
      'Email configuration is missing from .env.local'
    );
  }

  return {
    emailUser,
    emailAppPassword,
    emailFrom,
    appUrl,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendVerificationEmail({
  recipientEmail,
  recipientName,
  verificationToken,
}) {
  const {
    emailUser,
    emailAppPassword,
    emailFrom,
    appUrl,
  } = getEmailConfiguration();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailAppPassword,
    },
  });

  const verificationUrl = new URL(
    '/verify-email',
    appUrl
  );

  verificationUrl.searchParams.set(
    'token',
    verificationToken
  );

  const safeName = escapeHtml(recipientName);
  const safeVerificationUrl = escapeHtml(
    verificationUrl.toString()
  );

  await transporter.sendMail({
    from: emailFrom,
    to: recipientEmail,
    subject: 'Verify your SmartTransit email address',
    text: [
      `Hello ${recipientName},`,
      '',
      'Thank you for registering with SmartTransit.',
      'Verify your email address using the link below:',
      verificationUrl.toString(),
      '',
      'This link will expire in 30 minutes.',
      '',
      'If you did not create this account, ignore this email.',
    ].join('\n'),
    html: `
      <div style="background:#f1f5f9;padding:32px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
          <h1 style="margin:0;color:#1d4ed8;">
            SmartTransit
          </h1>

          <h2 style="color:#0f172a;margin-top:24px;">
            Verify your email address
          </h2>

          <p style="color:#475569;line-height:1.6;">
            Hello ${safeName},
          </p>

          <p style="color:#475569;line-height:1.6;">
            Thank you for registering with SmartTransit.
            Click the button below to verify your email address.
          </p>

          <p style="margin:28px 0;">
            <a
              href="${safeVerificationUrl}"
              style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;"
            >
              Verify email address
            </a>
          </p>

          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            This verification link will expire in 30 minutes.
          </p>

          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            If the button does not work, copy this link into your browser:
          </p>

          <p style="word-break:break-all;color:#2563eb;font-size:13px;">
            ${safeVerificationUrl}
          </p>

          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            If you did not create this account, ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}