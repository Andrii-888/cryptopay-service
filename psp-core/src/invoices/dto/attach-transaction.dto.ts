// src/invoices/dto/attach-transaction.dto.ts

export class AttachTransactionDto {
  /**
   * Blockchain network, e.g. "ETH", "TRON", "BSC"
   * Для MVP работаем со стейблкоинами, сеть можно задавать гибко.
   */
  network?: string;

  /**
   * On-chain transaction hash from the client.
   */
  txHash!: string;

  /**
   * Wallet address from which the client sent funds.
   */
  walletAddress?: string;
}
