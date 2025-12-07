// src/webhooks/interfaces/webhook-event.interface.ts

export interface WebhookEvent {
  id: string; // UUID события
  invoiceId: string; // ID инвойса
  eventType: string; // Тип события: invoice.confirmed, invoice.expired, invoice.rejected
  payloadJson: string; // Полный JSON payload в виде строки
  status: 'pending' | 'sent' | 'failed'; // Статус отправки
  retryCount: number; // Количество попыток отправки
  lastAttemptAt: string | null; // Когда последний раз пытались
  createdAt: string; // Когда событие создано
}
