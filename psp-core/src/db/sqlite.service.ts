// src/db/sqlite.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Database, { Database as BetterSqliteDatabase } from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class SqliteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqliteService.name);
  private db!: BetterSqliteDatabase;

  onModuleInit() {
    const rawPath = process.env.SQLITE_DB_PATH ?? 'data/psp-core.db';

    // Если путь относительный — делаем его абсолютным от текущей рабочей директории (/app на Fly)
    const dbPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.join(process.cwd(), rawPath);

    // ✅ Гарантируем, что директория существует (иначе better-sqlite3 падает на Fly)
    const dir = path.dirname(dbPath);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      this.logger.error(
        `Failed to create SQLite directory "${dir}": ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      );
      throw e;
    }

    this.logger.log(`Opening SQLite database at: ${dbPath}`);

    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');

    //
    // 1) Основная таблица invoices (минимальная базовая схема)
    //
    this.db
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          fiat_amount REAL NOT NULL,
          fiat_currency TEXT NOT NULL,
          crypto_amount REAL NOT NULL,
          crypto_currency TEXT NOT NULL,
          status TEXT NOT NULL,
          payment_url TEXT NOT NULL
        );
      `,
      )
      .run();

    //
    // 2) Дополнительные поля для invoices:
    //
    const alterStatements = [
      `ALTER TABLE invoices ADD COLUMN network TEXT`,
      `ALTER TABLE invoices ADD COLUMN tx_hash TEXT`,
      `ALTER TABLE invoices ADD COLUMN wallet_address TEXT`,
      `ALTER TABLE invoices ADD COLUMN risk_score INTEGER`,
      `ALTER TABLE invoices ADD COLUMN aml_status TEXT`,
      `ALTER TABLE invoices ADD COLUMN asset_risk_score INTEGER`,
      `ALTER TABLE invoices ADD COLUMN asset_status TEXT`,
      `ALTER TABLE invoices ADD COLUMN merchant_id TEXT`,
    ];

    for (const sql of alterStatements) {
      try {
        this.db.prepare(sql).run();
        this.logger.log(`Applied column change: ${sql}`);
      } catch {
        this.logger.debug(`Skip column change (likely exists): ${sql}`);
      }
    }

    //
    // 3) Таблица webhook_events
    //
    this.db
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS webhook_events (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_attempt_at TEXT DEFAULT NULL,
          created_at TEXT NOT NULL,

          FOREIGN KEY (invoice_id) REFERENCES invoices(id)
        );
      `,
      )
      .run();

    this.logger.log('SQLite table "webhook_events" is ready');
    this.logger.log('SQLite database initialized (tables are ready)');
  }

  onModuleDestroy() {
    if (this.db) {
      this.logger.log('Closing SQLite database connection');
      this.db.close();
    }
  }

  get connection(): BetterSqliteDatabase {
    return this.db;
  }
}
