// src/webhooks/webhook.signer.ts

import * as crypto from 'crypto';

export class WebhookSigner {
  constructor(private readonly secret: string) {}

  /**
   * Создаёт HMAC SHA256 подпись по схеме Stripe-style
   * v1 = HMAC_SHA256(secret, timestamp + "." + payload)
   */
  signPayload(payload: string, timestamp: number): string {
    const data = `${timestamp}.${payload}`;
    const hmac = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');

    return hmac;
  }

  /**
   * Генерирует набор заголовков, которые будут отправлены мерчанту.
   *
   * psp-timestamp: <ts>
   * psp-signature: t=<ts>, v1=<hmac>
   */
  generateHeaders(payload: object) {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify(payload);

    const signature = this.signPayload(body, timestamp);

    return {
      'psp-timestamp': timestamp.toString(),
      'psp-signature': `t=${timestamp}, v1=${signature}`,
      'content-type': 'application/json',
    };
  }

  /**
   * Проверка подписи (нужна будет позже для merchant dashboard)
   */
  verifySignature(
    payload: string,
    timestamp: number,
    signature: string,
  ): boolean {
    const expected = this.signPayload(payload, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }
}
