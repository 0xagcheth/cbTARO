# Farcaster Mini Apps Integration Guide

Полное руководство по интеграции Farcaster Mini Apps SDK в cbTARO.  
Следует официальной документации: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz)

## 📋 Содержание

1. [Обзор](#обзор)
2. [Установка и настройка](#установка-и-настройка)
3. [Основные функции](#основные-функции)
4. [Context API](#context-api)
5. [Actions API](#actions-api)
6. [Wallet Integration](#wallet-integration)
7. [Share Extensions](#share-extensions)
8. [Notifications](#notifications)
9. [Quick Auth](#quick-auth)
10. [Best Practices](#best-practices)

---

## Обзор

Farcaster Mini Apps — это нативно-подобные приложения, встроенные в экосистему Farcaster. Они предоставляют:

- ⚡ **Быстрое развертывание** - без проверки App Store
- 🔍 **Встроенное обнаружение** - в социальной ленте Farcaster
- 🔔 **Push-уведомления** - для удержания пользователей
- 💰 **Встроенный кошелек** - беспрепятственные транзакции
- 👤 **Автоматическая аутентификация** - через Farcaster

---

## Установка и настройка

### 1. Установка SDK

```bash
npm install @farcaster/miniapp-sdk
```

### 2. Структура проекта

```
src/
├── utils/
│   └── miniapp.js       # Утилиты для работы с SDK
├── main.jsx             # Инициализация SDK
└── App.jsx              # Использование SDK функций
```

### 3. Конфигурация manifest

Файл `.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "<BASE64_HEADER>",
    "payload": "<BASE64_PAYLOAD>",
    "signature": "<BASE64_SIGNATURE>"
  },
  "miniapp": {
    "version": "1",
    "name": "cbTARO",
    "homeUrl": "https://0xagcheth.github.io/cbTARO/",
    "iconUrl": "https://0xagcheth.github.io/cbTARO/i.png",
    "splashImageUrl": "https://0xagcheth.github.io/cbTARO/s.png",
    "splashBackgroundColor": "#0b1020",
    "castShareUrl": "https://0xagcheth.github.io/cbTARO/share"
  }
}
```

### 4. Meta tags в HTML

```html
<meta name="fc:miniapp" content="{&quot;version&quot;:&quot;1&quot;,&quot;imageUrl&quot;:&quot;https://...&quot;,&quot;iconUrl&quot;:&quot;https://...&quot;,&quot;button&quot;:{&quot;title&quot;:&quot;Reveal&quot;,&quot;action&quot;:{&quot;type&quot;:&quot;launch_frame&quot;,&quot;name&quot;:&quot;cbTARO&quot;,&quot;url&quot;:&quot;https://...&quot;}}}" />
```

---

## Основные функции

### Инициализация приложения

**Обязательно**: Вызовите `ready()` после загрузки приложения, чтобы скрыть splash screen.

```javascript
import { initMiniApp } from './utils/miniapp';

// В src/main.jsx после рендера React
await initMiniApp();
```

### Проверка окружения

```javascript
import { isInMiniApp } from './utils/miniapp';

if (await isInMiniApp()) {
  console.log('Running in Farcaster Mini App');
  // Включить функции Mini App
} else {
  console.log('Running in regular browser');
  // Fallback логика
}
```

---

## Context API

### Получение информации о пользователе

```javascript
import { getUserContext } from './utils/miniapp';

const userContext = await getUserContext();
if (userContext) {
  console.log('FID:', userContext.fid);
  console.log('Username:', userContext.username);
  console.log('Display Name:', userContext.displayName);
  console.log('Profile Picture:', userContext.pfpUrl);
  console.log('Address:', userContext.address);
  console.log('Theme:', userContext.theme); // 'light' | 'dark'
}
```

**Структура userContext:**

```typescript
{
  fid: number | null;          // Farcaster ID
  username: string | null;     // @username
  displayName: string | null;  // Display name
  pfpUrl: string | null;       // Profile picture URL
  address: string | null;      // Custody address
  theme: 'light' | 'dark';     // App theme
}
```

**Использование в cbTARO:**

```javascript
// src/App.jsx - при инициализации
useEffect(() => {
  async function loadUserContext() {
    if (isInMiniApp) {
      const userContext = await getUserContext();
      if (userContext) {
        setFid(userContext.fid);
        setPfpUrl(userContext.pfpUrl);
        
        // Автоматический трекинг визита
        if (userContext.fid && address) {
          await trackVisit(userContext.fid, address);
        }
      }
    }
  }
  loadUserContext();
}, [isInMiniApp, address]);
```

---

## Actions API

### Haptics (тактильная обратная связь)

Добавляет вибрацию для улучшения UX:

```javascript
import { triggerHaptic } from './utils/miniapp';

// При нажатии кнопки
await triggerHaptic('light');   // Легкая вибрация
await triggerHaptic('medium');  // Средняя вибрация
await triggerHaptic('heavy');   // Сильная вибрация
await triggerHaptic('success'); // Успех
await triggerHaptic('warning'); // Предупреждение
await triggerHaptic('error');   // Ошибка
```

**Интеграция в cbTARO:**

```javascript
// src/App.jsx - в функции playButtonSound
const playButtonSound = async () => {
  // Haptic feedback для Mini App
  await triggerHaptic('light');
  
  // Затем звук
  if (soundEnabled) {
    const audio = new Audio('./Assets/audio/tab.mp3');
    audio.play();
  }
};
```

### Compose Cast (создание поста)

```javascript
import { composeCast } from './utils/miniapp';

// Простой текст
await composeCast({
  text: '🃏 Daily Taro reading revealed!',
  embeds: []
});

// С embed (картинка/ссылка)
await composeCast({
  text: '🔮 My cbTARO reading',
  embeds: [
    'https://0xagcheth.github.io/cbTARO/',
    'https://example.com/image.png'
  ]
});
```

**Fallback для браузера:**

```javascript
// Если не в Mini App - открывает warpcast.com
await composeCast({ text: 'Hello!' });
// → https://warpcast.com/~/compose?text=Hello!
```

### Open URL (открыть ссылку)

```javascript
import { openUrl } from './utils/miniapp';

// Откроет в in-app браузере или внешнем браузере
await openUrl('https://docs.farcaster.xyz');
```

### Navigate Back (навигация назад)

```javascript
import { navigateBack } from './utils/miniapp';

// В Mini App: использует нативную навигацию
// В браузере: window.history.back()
await navigateBack();
```

### Close Mini App

```javascript
import { closeMiniApp } from './utils/miniapp';

// Закрывает Mini App (только в Farcaster)
await closeMiniApp();
```

### Primary Button (главная кнопка)

```javascript
import { setPrimaryButton } from './utils/miniapp';

// Устанавливает кнопку в нижней части экрана
await setPrimaryButton({
  text: 'Continue',
  isVisible: true,
  isEnabled: true,
  onClick: () => {
    console.log('Button clicked!');
  }
});
```

---

## Wallet Integration

### Получение Ethereum Provider

```javascript
import { getEthereumProvider } from './utils/miniapp';

const provider = await getEthereumProvider();
if (provider) {
  // Используйте provider с ethers.js или wagmi
  const accounts = await provider.request({ 
    method: 'eth_requestAccounts' 
  });
}
```

**Интеграция с Wagmi:**

Уже реализовано в `src/wagmi.ts`:

```typescript
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    miniAppConnector() // Автоматически использует SDK provider
  ],
});
```

---

## Share Extensions

Позволяет пользователям делиться контентом напрямую с вашим приложением из Farcaster.

### 1. Добавьте в manifest

```json
{
  "miniapp": {
    "castShareUrl": "https://0xagcheth.github.io/cbTARO/share"
  }
}
```

### 2. Создайте страницу `/share`

```javascript
// share/index.html или React route /share
const urlParams = new URLSearchParams(window.location.search);
const castHash = urlParams.get('castHash');
const castFid = urlParams.get('castFid');
const viewerFid = urlParams.get('viewerFid');

// Обработайте параметры и перенаправьте на главную страницу
window.location.href = `/?sharedCastHash=${castHash}&sharedCastFid=${castFid}&viewerFid=${viewerFid}`;
```

### 3. Обработка на главной странице

```javascript
// src/App.jsx
const urlParams = new URLSearchParams(window.location.search);
const sharedCastHash = urlParams.get('sharedCastHash');

if (sharedCastHash) {
  // Пользователь открыл app через Share Extension
  console.log('Opened from shared cast:', sharedCastHash);
  // Покажите UI или действие, связанное с кастом
}
```

**Реализовано в cbTARO:**

- `share/index.html` - обработка Share Extension параметров
- `src/App.jsx` - чтение параметров из localStorage
- UI уведомление "Opened from shared cast"

---

## Notifications

Push-уведомления требуют backend реализации.

### Архитектура

```
Backend → Farcaster Notifications API → Пользователь
```

### Backend endpoint (пример)

```javascript
// Node.js example
import fetch from 'node-fetch';

async function sendNotification({ fid, title, body, targetUrl }) {
  const response = await fetch('https://api.farcaster.xyz/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FARCASTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fid,
      notification: {
        title,
        body,
        targetUrl
      }
    })
  });

  return response.json();
}

// Пример: уведомление о новой карте дня
await sendNotification({
  fid: 12345,
  title: '🃏 Daily Taro Card is Ready!',
  body: 'Your mystical reading awaits...',
  targetUrl: 'https://0xagcheth.github.io/cbTARO/'
});
```

### Документация

Полное руководство: [miniapps.farcaster.xyz/docs/guides/notifications](https://miniapps.farcaster.xyz/docs/guides/notifications)

---

## Quick Auth

Упрощенная аутентификация с автоматическими JWT токенами.

### Вариант 1: Quick Auth Fetch

```javascript
import { quickAuthFetch } from './utils/miniapp';

// Автоматически добавляет Farcaster auth заголовки
const response = await quickAuthFetch('https://api.example.com/me');
const user = await response.json();
```

### Вариант 2: Sign In with Farcaster (SIWE)

```javascript
import { signIn } from './utils/miniapp';

const credentials = await signIn();
if (credentials) {
  // Отправьте credentials на backend для верификации
  const response = await fetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}
```

### Backend верификация (Node.js)

```javascript
import { verifySignInMessage } from '@farcaster/auth-kit';

app.post('/api/auth', async (req, res) => {
  const { message, signature, fid } = req.body;
  
  try {
    const { success, fid: verifiedFid } = await verifySignInMessage({
      message,
      signature,
      domain: 'your-app.com'
    });

    if (success) {
      // Создайте сессию для пользователя
      const token = createJWT({ fid: verifiedFid });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Best Practices

### 1. Всегда вызывайте ready()

```javascript
// ❌ НЕПРАВИЛЬНО
// Не вызван ready() - пользователь видит бесконечный splash screen

// ✅ ПРАВИЛЬНО
import { initMiniApp } from './utils/miniapp';
await initMiniApp(); // Вызывает ready() внутри
```

### 2. Graceful degradation для браузера

```javascript
// Всегда предоставляйте fallback для обычных браузеров
const inMiniApp = await isInMiniApp();

if (inMiniApp) {
  // Mini App функциональность
  await composeCast({ text: 'Hello!' });
} else {
  // Fallback для браузера
  window.open(`https://warpcast.com/~/compose?text=Hello!`, '_blank');
}
```

### 3. Используйте haptics для важных действий

```javascript
// Haptics улучшают UX
await triggerHaptic('success'); // Успешная оплата
await triggerHaptic('warning'); // Предупреждение
await triggerHaptic('error');   // Ошибка
await triggerHaptic('light');   // Нажатие кнопки
```

### 4. Кешируйте user context

```javascript
let cachedUserContext = null;

async function getCachedUserContext() {
  if (!cachedUserContext) {
    cachedUserContext = await getUserContext();
  }
  return cachedUserContext;
}
```

### 5. Обрабатывайте ошибки

```javascript
try {
  await composeCast({ text: 'Hello!' });
} catch (error) {
  console.error('Failed to compose cast:', error);
  // Показать UI ошибку пользователю
}
```

### 6. Тестирование в Dev Mode

Включите Dev Mode в Farcaster:

1. Перейдите на [farcaster.xyz/~/settings/developer-tools](https://farcaster.xyz/~/settings/developer-tools)
2. Включите "Developer Mode"
3. Используйте Dev Tools для тестирования Mini App

### 7. Мониторинг производительности

```javascript
// Логируйте время инициализации
console.time('[miniapp] Initialization');
await initMiniApp();
console.timeEnd('[miniapp] Initialization');
```

---

## События и обработчики

### Слушать события SDK

```javascript
import { addEventListener } from './utils/miniapp';

// Primary button clicked
const unsubscribe = await addEventListener('primaryButtonClicked', () => {
  console.log('Primary button clicked!');
});

// Отписаться позже
unsubscribe();
```

### Доступные события

- `primaryButtonClicked` - Главная кнопка нажата
- `themeChanged` - Тема изменена (light/dark)
- `contextChanged` - Контекст пользователя изменен

---

## Ресурсы

### Официальная документация

- **Главная**: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz)
- **Getting Started**: [miniapps.farcaster.xyz/docs/getting-started](https://miniapps.farcaster.xyz/docs/getting-started)
- **SDK Reference**: [miniapps.farcaster.xyz/docs/sdk](https://miniapps.farcaster.xyz/docs/sdk)
- **Wallet Integration**: [miniapps.farcaster.xyz/docs/guides/ethereum-wallet](https://miniapps.farcaster.xyz/docs/guides/ethereum-wallet)
- **Share Extensions**: [miniapps.farcaster.xyz/docs/guides/share-extension](https://miniapps.farcaster.xyz/docs/guides/share-extension)
- **Notifications**: [miniapps.farcaster.xyz/docs/guides/notifications](https://miniapps.farcaster.xyz/docs/guides/notifications)

### Примеры

- **Official Examples**: [github.com/farcasterxyz/miniapp-examples](https://github.com/farcasterxyz/miniapp-examples)
- **cbTARO Source**: [github.com/0xagcheth/cbTARO](https://github.com/0xagcheth/cbTARO)

### Инструменты

- **Farcaster Developer Tools**: [farcaster.xyz/~/settings/developer-tools](https://farcaster.xyz/~/settings/developer-tools)
- **Warpcast Preview**: Тестируйте Mini App в Warpcast mobile app
- **Frame Validator**: [warpcast.com/~/developers/frames](https://warpcast.com/~/developers/frames)

---

## Checklist для запуска

### Перед деплоем

- [ ] `sdk.actions.ready()` вызывается после загрузки
- [ ] Manifest файл доступен по `/.well-known/farcaster.json`
- [ ] Meta tags `fc:miniapp` присутствуют в `index.html`
- [ ] Account Association настроена в manifest
- [ ] Haptics добавлены для основных действий
- [ ] Graceful fallback для non-Mini App браузеров
- [ ] Share Extension настроен (`castShareUrl` в manifest)
- [ ] User context используется для персонализации
- [ ] Wallet integration через Wagmi connector
- [ ] HTTPS для всех URLs (GitHub Pages автоматически)

### После деплоя

- [ ] Проверить `https://your-app.com/.well-known/farcaster.json` доступен
- [ ] Открыть app в Warpcast mobile и проверить splash screen скрывается
- [ ] Проверить wallet подключение в Mini App
- [ ] Протестировать Share Extension из Farcaster cast
- [ ] Проверить haptics на физическом устройстве
- [ ] Проверить compose cast с embeds
- [ ] Проверить theme (light/dark mode)

---

## Поддержка

Если возникли вопросы или проблемы:

1. Проверьте [официальную документацию](https://miniapps.farcaster.xyz)
2. Посмотрите [примеры](https://github.com/farcasterxyz/miniapp-examples)
3. Спросите в [Farcaster Developers](https://warpcast.com/~/channel/fc-devs)

---

**Дата обновления**: Январь 2026  
**SDK версия**: @farcaster/miniapp-sdk@latest  
**Поддерживаемые платформы**: iOS, Android, Web
