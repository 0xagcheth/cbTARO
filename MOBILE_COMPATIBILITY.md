# 📱 Совместимость с мобильными приложениями

## ✅ Поддерживаемые платформы

### 1. Farcaster App (iOS/Android)
- **SDK**: @farcaster/miniapp-sdk@^0.2.1
- **Connector**: miniAppConnector() (первый в списке)
- **Wallet**: Встроенный Farcaster wallet
- **Документация**: https://miniapps.farcaster.xyz/

### 2. Base App (iOS/Android)
- **SDK**: Тот же @farcaster/miniapp-sdk
- **Connector**: miniAppConnector() (первый в списке)
- **Wallet**: Встроенный Base wallet
- **Документация**: https://www.base.org/build/mini-apps

### 3. Обычные браузеры (Desktop/Mobile)
- **Connector**: injected() (второй в списке)
- **Wallet**: MetaMask, Coinbase Wallet, и др.
- **Fallback**: Работает если нет Mini App SDK

## 🔧 Реализация

### src/wagmi.ts
```typescript
connectors: [
  miniAppConnector(), // Primary: Farcaster & Base apps
  injected()          // Fallback: Browser wallets
]
```

### src/App.jsx - handleConnect()
```javascript
// Auto-select connector based on environment
const inMiniApp = await checkIsInMiniApp();
const connector = inMiniApp 
  ? connectors[0]  // miniAppConnector
  : (connectors[1] || connectors[0]); // injected or fallback
```

## 🎯 Логика выбора connector

| Окружение | User Agent | Connector | Wallet |
|-----------|-----------|-----------|--------|
| Farcaster App | `farcaster` | miniAppConnector | Farcaster |
| Base App | `base` | miniAppConnector | Base |
| Browser | другое | injected | MetaMask/Coinbase |

## 🔍 Диагностика

Приложение логирует окружение при запуске:
```javascript
console.log('🔍 [DIAGNOSTIC] App initialized:', {
  environment: 'Farcaster' | 'Base' | 'Browser',
  connectors: ['Farcaster Mini App', 'Injected'],
  isConnected: true/false,
  chainId: 8453 (Base)
});
```

## ✅ Тестирование

1. **Farcaster App**:
   - Открыть в Farcaster iOS/Android
   - Нажать кнопку подключения
   - Должен подключиться Farcaster wallet
   - Оплата должна пройти

2. **Base App**:
   - Открыть в Base iOS/Android
   - Нажать кнопку подключения
   - Должен подключиться Base wallet
   - Оплата должна пройти

3. **Browser**:
   - Открыть в Chrome/Safari
   - Нажать кнопку подключения
   - Должен появиться MetaMask/Coinbase
   - Оплата должна пройти

## 🚨 Важно

- **miniAppConnector** должен быть **первым** в списке connectors
- **injected** должен быть **вторым** (fallback)
- Логика выбора connector основана на `isInMiniApp()`
- Все три окружения используют **Base chain (8453)**

Дата: 2026-01-10
