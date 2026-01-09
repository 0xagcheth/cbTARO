# cbTARO Analytics Worker

Cloudflare Worker для отслеживания статистики пользователей по FID.

## Установка

1. Установите Wrangler CLI:
```bash
npm install -g wrangler
```

2. Войдите в Cloudflare:
```bash
wrangler login
```

## Создание D1 базы данных

1. Создайте базу данных:
```bash
wrangler d1 create cbtaro-stats
```

2. Скопируйте `database_id` из вывода команды и вставьте в `wrangler.toml` в поле `database_id`.

## Применение миграций

```bash
wrangler d1 migrations apply cbtaro-stats
```

## Разработка

```bash
npm run dev
```

## Деплой

```bash
npm run deploy
```

## API Endpoints

### POST /api/track
Отслеживание событий (visit/reading).

Body:
```json
{
  "fid": 12345,
  "wallet": "0x...",
  "event": "visit" | "reading",
  "readingType": "one" | "three" | "custom" | null,
  "clientTs": 1234567890
}
```

### GET /api/stats?fid=12345
Получение статистики пользователя.

