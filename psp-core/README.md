# cryptopay-service / psp-core

Backend-ядро платёжного сервиса для приёма криптоплатежей.

`psp-core` отвечает за:

- создание и хранение инвойсов,
- статусы платежей (`waiting / confirmed / expired / rejected`),
- дальнейшее подключение AML / риск-оценки,
- webhooks в интернет-магазины,
- базу для бухгалтерии и отчётности.

---

## 1. Технологии

- **Node.js** + **TypeScript**
- **NestJS 11** — каркас backend-приложения
- In-memory хранилище (массив в памяти) — для первой версии
- Позже: PostgreSQL + Prisma, AML API, webhooks, dashboard и т.д.

---

## 2. Структура репозитория

В рамках общего проекта:

```bash
cryptopay-service/
  └── psp-core/          # этот backend-проект (NestJS)
      ├── src/
      │   ├── app.module.ts
      │   ├── app.controller.ts (пока не используется)
      │   ├── invoices/
      │   │   ├── dto/
      │   │   │   └── create-invoice.dto.ts
      │   │   ├── invoices.controller.ts
      │   │   └── invoices.service.ts
      │   └── main.ts
      ├── package.json
      ├── tsconfig.json
      ├── tsconfig.build.json
      ├── nest-cli.json
      └── README.md
Модуль Invoices — это ядро текущей версии psp-core.

3. Подготовка окружения
3.1. Требования
Node.js 20+

npm 10+

Глобально установленный Nest CLI:

bash
Copy code
npm install -g @nestjs/cli
Проверить:

bash
Copy code
node -v
npm -v
nest --version
4. Установка и запуск проекта
4.1. Клонирование / создание папки
bash
Copy code
cd ~/Desktop
mkdir cryptopay-service
cd cryptopay-service
(если репозиторий уже есть, этот шаг можно пропустить).

4.2. Создание Nest-проекта psp-core
Команда (выполняется один раз):

bash
Copy code
nest new psp-core
# при вопросе "Which package manager" → выбрать: npm
4.3. Установка зависимостей
Перейти в папку проекта:

bash
Copy code
cd psp-core
Установить зависимости (рекомендуемый вариант для NestJS 11 + npm 10):

bash
Copy code
npm install --legacy-peer-deps
Если npm когда-то запускался с sudo и возникли ошибки прав доступа (EACCES), нужно один раз поправить права на кэш:

bash
Copy code
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
npm install --legacy-peer-deps
5. Запуск в режиме разработки
bash
Copy code
cd psp-core
npm run start:dev
Приложение поднимается на:

text
Copy code
http://localhost:3000
При первом запуске стандартный контроллер отдаёт "Hello World!".
После подключения InvoicesModule основные точки — /invoices.

Логи Nest при успешном запуске:

text
Copy code
[Nest] ... LOG [NestFactory] Starting Nest application...
[Nest] ... LOG [RoutesResolver] InvoicesController {/invoices}:
[Nest] ... LOG [RouterExplorer] Mapped {/invoices, POST} route
[Nest] ... LOG [RouterExplorer] Mapped {/invoices/:id, GET} route
[Nest] ... LOG [RouterExplorer] Mapped {/invoices/:id/confirm, POST} route
[Nest] ... LOG [RouterExplorer] Mapped {/invoices/:id/expire, POST} route
[Nest] ... LOG [RouterExplorer] Mapped {/invoices/:id/reject, POST} route
[Nest] ... LOG [NestApplication] Nest application successfully started
6. Модуль инвойсов (InvoicesModule)
6.1. DTO: CreateInvoiceDto
Файл: src/invoices/dto/create-invoice.dto.ts

Описывает данные, которые приходят в POST /invoices:

ts
Copy code
export class CreateInvoiceDto {
  fiatAmount: number;      // сумма в фиате (например, 249)
  fiatCurrency: string;    // валютa фиата ("EUR", "CHF", "USD")
  cryptoCurrency: string;  // криптовалюта ("USDT", "USDC" и т.п.)
}
6.2. Сервис: InvoicesService
Файл: src/invoices/invoices.service.ts

Отвечает за:

хранение инвойсов (пока в памяти),

создание нового инвойса,

поиск по id,

смену статуса.

Ключевые элементы:

ts
Copy code
// Возможные статусы инвойса:
export type InvoiceStatus = 'waiting' | 'confirmed' | 'expired' | 'rejected';

// Структура инвойса:
export interface Invoice {
  id: string;
  createdAt: string;
  expiresAt: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: InvoiceStatus;
  paymentUrl: string;
}
Основные методы:

ts
Copy code
@Injectable()
export class InvoicesService {
  private invoices: Invoice[] = [];

  create(createInvoiceDto: CreateInvoiceDto): Invoice {
    const id = `inv_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const invoice: Invoice = {
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fiatAmount: createInvoiceDto.fiatAmount,
      fiatCurrency: createInvoiceDto.fiatCurrency,
      cryptoAmount: createInvoiceDto.fiatAmount, // временно 1:1
      cryptoCurrency: createInvoiceDto.cryptoCurrency,
      status: 'waiting',
      paymentUrl: `https://demo.your-cryptopay.com/open/pay/${id}`,
    };

    this.invoices.push(invoice);
    return invoice;
  }

  findOne(id: string): Invoice | undefined {
    return this.invoices.find((invoice) => invoice.id === id);
  }

  updateStatus(id: string, status: InvoiceStatus): Invoice | undefined {
    const invoice = this.invoices.find((item) => item.id === id);
    if (!invoice) return undefined;
    invoice.status = status;
    return invoice;
  }
}
⚠️ Важно: сейчас инвойсы хранятся только в памяти.
При перезапуске сервера (npm run start:dev) массив очищается.
На боевой версии это будет заменено на базу данных (PostgreSQL + Prisma).

6.3. Контроллер: InvoicesController
Файл: src/invoices/invoices.controller.ts

Отвечает за HTTP-маршруты:

ts
Copy code
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import type { Invoice } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto): Invoice {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Invoice {
    const invoice = this.invoicesService.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    return invoice;
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'confirmed');
    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    return updated;
  }

  @Post(':id/expire')
  expire(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'expired');
    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    return updated;
  }

  @Post(':id/reject')
  reject(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'rejected');
    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    return updated;
  }
}
7. API: эндпоинты и примеры
Базовый URL (локально):

text
Copy code
http://localhost:3000
7.1. Создать инвойс
POST /invoices

Запрос:

json
Copy code
{
  "fiatAmount": 249,
  "fiatCurrency": "EUR",
  "cryptoCurrency": "USDT"
}
Пример через curl:

bash
Copy code
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{"fiatAmount": 249, "fiatCurrency": "EUR", "cryptoCurrency": "USDT"}'
Ответ:

json
Copy code
{
  "id": "inv_1764880152750",
  "createdAt": "2025-12-04T20:29:12.750Z",
  "expiresAt": "2025-12-04T20:44:12.750Z",
  "fiatAmount": 249,
  "fiatCurrency": "EUR",
  "cryptoAmount": 249,
  "cryptoCurrency": "USDT",
  "status": "waiting",
  "paymentUrl": "https://demo.your-cryptopay.com/open/pay/inv_1764880152750"
}
7.2. Получить инвойс по id
GET /invoices/:id

bash
Copy code
curl http://localhost:3000/invoices/inv_1764880152750
Ответ:

json
Copy code
{
  "id": "inv_1764880152750",
  "createdAt": "...",
  "expiresAt": "...",
  "fiatAmount": 249,
  "fiatCurrency": "EUR",
  "cryptoAmount": 249,
  "cryptoCurrency": "USDT",
  "status": "waiting",
  "paymentUrl": "https://demo.your-cryptopay.com/open/pay/inv_1764880152750"
}
Если инвойс не найден:

json
Copy code
{
  "statusCode": 404,
  "message": "Invoice with id ... not found",
  "error": "Not Found"
}
7.3. Подтвердить оплату инвойса
POST /invoices/:id/confirm

bash
Copy code
curl -X POST http://localhost:3000/invoices/inv_1764880152750/confirm
Ответ:

json
Copy code
{
  "id": "inv_1764880152750",
  "status": "confirmed",
  ...
}
7.4. Пометить инвойс как истёкший
POST /invoices/:id/expire

bash
Copy code
curl -X POST http://localhost:3000/invoices/inv_1764880152750/expire
Ответ:

json
Copy code
{
  "id": "inv_1764880152750",
  "status": "expired",
  ...
}
7.5. Отклонить инвойс (ошибка / риск / AML)
POST /invoices/:id/reject

bash
Copy code
curl -X POST http://localhost:3000/invoices/inv_1764880152750/reject
Ответ:

json
Copy code
{
  "id": "inv_1764880152750",
  "status": "rejected",
  ...
}
8. Поведение в памяти (без базы)
На текущем этапе для простоты:

все инвойсы хранятся в массиве this.invoices внутри InvoicesService,

при перезапуске сервера (npm run start:dev) память очищается,

поэтому для тестов нужно:

создать инвойс (POST /invoices);

использовать его id в рамках текущего запуска для confirm/expire/reject.

9. Планы по развитию psp-core
Следующие шаги для боевой версии:

Подключить базу данных (PostgreSQL + Prisma):

таблица Invoice,

миграции,

фильтры по дате, магазину, статусу.

Добавить MerchantsModule:

интернет-магазины (ID, название, callback URL webhooks, allowed assets),

привязка инвойсов к магазину.

Добавить AmlModule (Risk Engine v1):

внутренний riskScore (0–100),

уровни риска: low / medium / high,

подготовка интеграции с внешними AML-провайдерами.

Webhooks:

при confirmed отправлять POST-запрос в магазин:

json
Copy code
{
  "invoiceId": "...",
  "status": "confirmed",
  "txHash": "...",
  "network": "TRC20",
  "cryptoAmount": "...",
  "fiatAmount": "...",
  "riskScore": 7,
  "amlClean": true
}
retries, логирование, защита подписью.

Админ / Dashboard для швейцарского партнёра:

отдельный фронт (Next.js),

список инвойсов,

фильтры, статусы, AML, KYC,

экспорт CSV / Excel.

Интеграция с frontend crypto-pay:

вместо локального in-memory store в frontend:

POST /invoices в psp-core при создании платежа,

GET /invoices/:id для страницы /open/pay/[invoiceId],

единый поток данных между демо-магазином и psp-core.

10. Краткое резюме
На текущей версии psp-core:

✅ Запускается как NestJS backend.

✅ Есть модуль инвойсов InvoicesModule.

✅ Реализован базовый жизненный цикл инвойса:

создание,

просмотр,

подтверждение,

истечение,

отклонение.

✅ API готово к интеграции с демо-фронтендом crypto-pay.

Дальше проект расширяется за счёт:

базы данных,

AML / risk логики,

webhooks,

кабинета для швейцарского партнёра,

интеграции с реальными блокчейн-провайдерами.

yaml
Copy code
```
