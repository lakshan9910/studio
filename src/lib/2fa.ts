
"use server"

import { authenticator } from 'otplib';
import qrcode from 'qrcode';

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

export function getTwoFactorQRCode(username: string, secret: string): Promise<string> {
  const otpAuthUrl = authenticator.keyuri(username, 'CashyPOS', secret);
  return qrcode.toDataURL(otpAuthUrl);
}

export function verifyTwoFactorCode(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}
