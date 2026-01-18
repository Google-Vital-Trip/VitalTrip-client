import crypto from 'crypto';

export function verifySentrySignature(
  rawBody: string,
  signatureHeader: string | null,
  clientSecret: string,
) {
  if (!signatureHeader) return false;

  const digest = crypto.createHmac('sha256', clientSecret).update(rawBody, 'utf8').digest('hex');

  return digest === signatureHeader.trim();
}
