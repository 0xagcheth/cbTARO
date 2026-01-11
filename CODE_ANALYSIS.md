# Анализ кода: FID, Кошелек и Платежи

## 📋 Содержание
1. [Подключение к FID (Farcaster ID)](#1-подключение-к-fid-farcaster-id)
2. [Подключение кошелька](#2-подключение-кошелька)
3. [Обработка платежей](#3-обработка-платежей)

---

## 1. Подключение к FID (Farcaster ID)

### 1.1 Получение Farcaster SDK
**Файл:** `src/App.jsx` (строки 945-954)

```javascript
const getFarcasterSDK = () => {
  // Try multiple possible SDK locations
  return window.miniAppSDK || 
         window.farcaster?.sdk || 
         window.farcaster || 
         window.farcasterSDK || 
         window.sdk || 
         window.FarcasterSDK || 
         null;
};
```

### 1.2 Разрешение Farcaster Identity (получение FID)
**Файл:** `src/App.jsx` (строки 1023-1072)

```javascript
const resolveFarcasterIdentity = async (address) => {
  try {
    const sdk = getFarcasterSDK();
    if (!sdk) {
      console.debug('[identity] No Farcaster SDK found');
      return;
    }

    // Try to get context (may be async)
    let context = null;
    if (typeof sdk.context === 'function') {
      context = await sdk.context();
    } else if (sdk.context && typeof sdk.context.then === 'function') {
      context = await sdk.context;
    } else if (sdk.context) {
      context = sdk.context;
    } else if (typeof sdk.getContext === 'function') {
      context = await sdk.getContext();
    }

    // Extract user from context
    const user = context?.user || context?.viewer || sdk.user || null;

    if (user) {
      const fid = user.fid || user.userFid || null;
      const pfpUrl = user.pfpUrl || user.pfp_url || user.avatarUrl || user.avatar_url || null;
      const wallet = user.walletAddress || user.wallet || address || null;

      if (fid) {
        setFid(fid);
        console.log('[identity] ✅ Farcaster FID loaded:', fid);
      }
      if (pfpUrl) {
        setPfpUrl(pfpUrl);
        console.log('[identity] ✅ Farcaster avatar loaded');
      }
      if (wallet && wallet !== walletAddress) {
        setWalletAddress(wallet);
        setIsWalletConnected(true);
        console.log('[identity] ✅ Farcaster wallet loaded:', wallet);
      }

      console.log('[identity] ✅ Farcaster identity resolved:', { fid, hasPfp: !!pfpUrl, hasWallet: !!wallet });
    } else {
      console.debug('[identity] No user data in Farcaster context');
    }
  } catch (error) {
    console.warn('[identity] Error resolving Farcaster identity:', error);
  }
};
```

**Как работает:**
- Получает SDK из различных возможных мест в `window`
- Извлекает контекст пользователя из SDK (поддерживает разные форматы)
- Извлекает FID, аватар и адрес кошелька из контекста
- Сохраняет данные в состояние компонента

### 1.3 Автоматическое разрешение FID при подключении кошелька
**Файл:** `src/App.jsx` (строки 1104-1112)

```javascript
// Auto-connect in Mini App using Wagmi
// According to docs: connector automatically connects if wallet already connected
useEffect(() => {
  // Wagmi connector handles auto-connect automatically
  // Just resolve identity if already connected
  if (isConnected && address) {
    resolveFarcasterIdentity(address);
  }
}, [isConnected, address]);
```

---

## 2. Подключение кошелька

### 2.1 Конфигурация Wagmi
**Файл:** `src/wagmi.ts` (полный файл)

```typescript
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector(), // Primary: Farcaster & Base apps
    injected() // Fallback: Browser (MetaMask, Coinbase Wallet, etc.)
  ],
})
```

**Как работает:**
- Использует Wagmi v2 для управления подключением кошелька
- Поддерживает Base сеть (Chain ID: 8453)
- Два коннектора:
  - `miniAppConnector()` - для Farcaster/Base приложений
  - `injected()` - для браузера (MetaMask, Coinbase Wallet)

### 2.2 Wagmi Hooks
**Файл:** `src/App.jsx` (строки 625-630)

```javascript
// Wagmi hooks for wallet connection
const { address, isConnected, chainId } = useAccount();
const { connect, connectors, error: connectError } = useConnect();
const { sendTransaction, isPending: isSendingTx, isSuccess: txSuccess, error: txError, data: txData } = useSendTransaction();
const currentChainId = useChainId();
const { switchChain } = useSwitchChain();
```

### 2.3 Обработчик подключения кошелька
**Файл:** `src/App.jsx` (строки 1074-1102)

```javascript
// Handle connect button click using Wagmi
const handleConnect = async () => {
  playButtonSound();
  setWalletError(null);

  if (connectors.length === 0) {
    setWalletError('no_provider');
    return;
  }

  try {
    // Auto-select connector based on environment:
    // - In Farcaster/Base app: miniAppConnector (connectors[0])
    // - In browser: injected (connectors[1] or first available)
    const inMiniApp = await checkIsInMiniApp();
    const connector = inMiniApp ? connectors[0] : (connectors[1] || connectors[0]);
    
    console.log('[wallet] Connecting with:', connector.name, '(Mini App:', inMiniApp, ')');
    connect({ connector });
    
    // After connection, resolve Farcaster identity
    if (address) {
      await resolveFarcasterIdentity(address);
    }
  } catch (error) {
    console.error('[wallet] Connect failed:', error);
    setWalletError('connection_failed');
  }
};
```

**Как работает:**
- Проверяет доступность коннекторов
- Автоматически выбирает правильный коннектор в зависимости от окружения
- Вызывает `connect({ connector })` из Wagmi
- После подключения автоматически разрешает Farcaster identity

### 2.4 Получение Ethereum Provider
**Файл:** `src/App.jsx` (строки 985-1014)

```javascript
const getEip1193Provider = async () => {
  const inMiniApp = isInMiniAppEnvironment();
  
  if (inMiniApp) {
    // В Mini App - ТОЛЬКО SDK провайдер, БЕЗ fallback на window.ethereum
    try {
      const sdk = getFarcasterSDK();
      if (sdk?.wallet?.getEthereumProvider) {
        const provider = await sdk.wallet.getEthereumProvider();
        if (provider) {
          console.log('[wallet] ✅ Using Mini App SDK provider (Farcaster/Base)');
          return provider;
        }
      }
      console.warn('[wallet] ⚠️ Mini App SDK provider not available');
      return null;
    } catch (error) {
      console.error('[wallet] ❌ Error getting Mini App SDK provider:', error);
      return null;
    }
  } else {
    // В браузере - ТОЛЬКО window.ethereum (MetaMask)
    if (window.ethereum) {
      console.log('[wallet] Using window.ethereum provider (browser)');
      return window.ethereum;
    }
    console.warn('[wallet] ⚠️ No wallet provider found (not in Mini App, no MetaMask)');
    return null;
  }
};
```

### 2.5 Переключение на Base сеть
**Файл:** `src/App.jsx` (строки 1114-1130)

```javascript
// Ensure we're on Base network using Wagmi
const ensureBase = async () => {
  if (currentChainId !== BASE_CHAIN_ID) {
    try {
      if (switchChain) {
        await switchChain({ chainId: BASE_CHAIN_ID });
        console.log('[wallet] ✅ Switched to Base network');
      } else {
        throw new Error('Switch chain not available');
      }
    } catch (error) {
      console.error('[wallet] ❌ Failed to switch to Base:', error);
      setWalletError('wrong_chain');
      throw new Error('Please switch to Base network manually');
    }
  }
};
```

---

## 3. Обработка платежей

### 3.1 Константы платежей
**Файл:** `src/App.jsx` (строки 632-634)

```javascript
// Payment receiver address (TREASURY)
const RECEIVER_ADDRESS = '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6';
const BASE_CHAIN_ID = 8453;
```

### 3.2 Функция отправки платежа (Wagmi)
**Файл:** `src/App.jsx` (строки 1132-1152)

```javascript
// Send payment using Wagmi
const payETH = async (amountETH) => {
  try {
    // Ensure we're on Base network
    await ensureBase();

    // Send transaction using Wagmi
    sendTransaction({
      to: RECEIVER_ADDRESS,
      value: parseEther(amountETH),
    });

    setTxStatus("paying");
    console.log('[payment] 💸 Sending payment:', amountETH, 'ETH to', RECEIVER_ADDRESS);
  } catch (error) {
    console.error('[payment] ❌ Payment failed:', error);
    setTxStatus("error");
    setWalletError('payment_failed');
    throw error;
  }
};
```

**Как работает:**
- Проверяет, что кошелек подключен к Base сети
- Использует `sendTransaction` из Wagmi hook
- Отправляет ETH на адрес `RECEIVER_ADDRESS`
- Устанавливает статус "paying"

### 3.3 Альтернативная реализация (index.html с Base Pay)
**Файл:** `index.html` (строки 1704-1773)

```javascript
// Pay using Base Pay (for Base App) or Wagmi sendTransaction (for Farcaster/browser)
const payETH = async (address, amountETH) => {
  const TREASURY = '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6';

  // Check if in Base App - use Base Pay (no address needed)
  if (isBaseApp()) {
    try {
      const ua = navigator.userAgent.toLowerCase();
      console.log('[payment] Using Base Pay for Base App, UA:', ua);
      const { pay, getPaymentStatus } = await import(window.__SDK_URLS.baseAccount);
      
      const ETH_TO_USD = 3000;
      const amountUSD = (parseFloat(amountETH) * ETH_TO_USD).toFixed(2);
      
      console.log(`[payment] Base Pay: ${amountUSD} USD to ${TREASURY}`);
      
      const payment = await pay({
        amount: amountUSD,
        to: TREASURY,
        testnet: false
      });
      
      console.log(`[payment] ✅ Base Pay sent! ID: ${payment.id}`);
      
      const { status } = await getPaymentStatus({ 
        id: payment.id,
        testnet: false 
      });
      
      if (status === 'completed') {
        console.log('[payment] ✅ Base Pay confirmed!');
        return { 
          txHash: payment.id,
          receipt: { status: 'completed' }
        };
      } else {
        throw new Error(`Base Pay status: ${status}`);
      }
    } catch (error) {
      console.error('[payment] Base Pay failed, falling back to regular transaction:', error);
      // Fallback to regular transaction if Base Pay fails
    }
  }

  // Regular ETH transaction using Wagmi sendTransaction
  if (!address || !window.wagmiConfig) {
    throw new Error('Address and wagmi config required for payments');
  }
  
  console.log('[payment] Using Wagmi sendTransaction');
  
  // Use Wagmi sendTransaction
  const { sendTransaction, waitForTransactionReceipt } = await import('https://esm.sh/wagmi@2.12.0');
  const { parseEther } = await import('https://esm.sh/viem@2.21.0');
  
  const hash = await sendTransaction(window.wagmiConfig, {
    to: TREASURY,
    value: parseEther(amountETH.toString()),
    account: address
  });
  
  console.log('[payment] Transaction sent, hash:', hash);
  
  // Wait for transaction receipt
  const receipt = await waitForTransactionReceipt(window.wagmiConfig, { 
    hash,
    confirmations: 2 
  });

  return { txHash: hash, receipt };
};
```

**Как работает:**
- **В Base App:** использует Base Pay API (USD платежи)
- **В Farcaster/браузере:** использует Wagmi `sendTransaction` (ETH платежи)
- Ждет подтверждения транзакции (2 подтверждения)

### 3.4 Обработка выбора расклада и платежа
**Файл:** `src/App.jsx` (строки 1676-1750)

```javascript
// 2. Select specific spread (1, 3, or CUSTOM cards)
const handleSelectSpread = async (spread) => {
  setSelectedSpread(spread);
  setAiInterpretation(null);

  // Handle different payment requirements
  if (spread === "ONE") {
    // Free - log usage and start animation
    usageLogger.increment("ONE");
    await startSpreadAnimation(spread);
  } else if (spread === "THREE") {
    // Pay 0.0001 ETH for 3-card spread
    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        setTxStatus("error");
        setWalletError('not_connected');
        alert("Please connect your wallet first");
        return;
      }

      // Check if already paid in this session
      if (paidSpreads.THREE) {
        console.log('[payment] Already paid for THREE spread in this session, starting animation directly');
        usageLogger.increment("THREE");
        await startSpreadAnimation(spread);
        return;
      }

      // Ensure we're on Base network and send payment
      await payETH("0.0001");
      // Transaction status will be handled by useEffect when txSuccess/txError changes
    } catch (error) {
      console.error("Payment failed:", error);
      setTxStatus("error");
      const errorMsg = error?.shortMessage || error?.message || "Payment failed";
      if (errorMsg.includes("user rejected") || errorMsg.includes("User rejected")) {
        alert("Payment cancelled. 3-card reading requires 0.0001 ETH payment.");
      } else {
        alert(`Payment failed: ${errorMsg}`);
      }
      return;
    }
  } else if (spread === "CUSTOM") {
    // Pay 0.001 ETH for custom reading
    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        setTxStatus("error");
        setWalletError('not_connected');
        alert("Please connect your wallet first");
        return;
      }

      // Check if already paid in this session
      if (paidSpreads.CUSTOM) {
        console.log('[payment] Already paid for CUSTOM spread in this session, starting animation directly');
        usageLogger.increment("CUSTOM");
        await startSpreadAnimation(spread);
        return;
      }

      // Ensure we're on Base network and send payment
      await payETH("0.001");
      // Transaction status will be handled by useEffect when txSuccess/txError changes
    } catch (error) {
      console.error("Payment failed:", error);
      setTxStatus("error");
      const errorMsg = error?.shortMessage || error?.message || "Payment failed";
      if (errorMsg.includes("user rejected") || errorMsg.includes("User rejected")) {
        alert("Payment cancelled. Custom reading requires 0.001 ETH payment.");
      } else {
        alert(`Payment failed: ${errorMsg}`);
      }
      return;
    }
  }
};
```

**Цены:**
- **ONE (1 карта):** Бесплатно
- **THREE (3 карты):** 0.0001 ETH
- **CUSTOM (кастомный):** 0.001 ETH

### 3.5 Обработка успешного платежа
**Файл:** `src/App.jsx` (строки 784-818)

```javascript
// Handle transaction success/error
useEffect(() => {
  if (txSuccess && txData) {
    setTxStatus("success");
    setTxHash(txData.hash);
    console.log('[payment] ✅ Transaction successful:', txData.hash);
    
    // After successful payment, mark spread as paid and start the spread animation
    if (selectedSpread === "THREE" || selectedSpread === "CUSTOM") {
      // Mark spread as paid for this session (prevents double-charging)
      setPaidSpreads(prev => ({
        ...prev,
        [selectedSpread]: true
      }));
      
      // Log usage
      if (selectedSpread === "THREE") {
        usageLogger.increment("THREE");
      } else if (selectedSpread === "CUSTOM") {
        usageLogger.increment("CUSTOM");
      }
      
      // Small delay to show success, then start animation
      setTimeout(() => {
        setTxStatus("idle");
        startSpreadAnimation(selectedSpread);
      }, 2000);
    }
  } else if (txError) {
    setTxStatus("error");
    const errorMsg = txError.shortMessage || txError.message;
    console.error('[payment] ❌ Transaction failed:', errorMsg);
    setWalletError('payment_failed');
  }
}, [txSuccess, txError, txData, selectedSpread]);
```

**Как работает:**
- Отслеживает статус транзакции через Wagmi hooks (`txSuccess`, `txError`, `txData`)
- При успехе:
  - Сохраняет хеш транзакции
  - Помечает расклад как оплаченный (предотвращает двойную оплату)
  - Логирует использование
  - Запускает анимацию расклада через 2 секунды
- При ошибке: показывает сообщение об ошибке

---

## 📊 Схема потока

### Подключение FID и кошелька:
```
1. Пользователь открывает приложение
   ↓
2. Wagmi автоматически проверяет подключение (если в Mini App)
   ↓
3. Если подключен → resolveFarcasterIdentity(address)
   ↓
4. Извлекает FID, аватар, адрес из SDK context
   ↓
5. Сохраняет в состояние компонента
```

### Платежный поток:
```
1. Пользователь выбирает платный расклад (THREE или CUSTOM)
   ↓
2. Проверка: кошелек подключен?
   ↓
3. Проверка: уже оплачено в этой сессии?
   ↓
4. Проверка: сеть Base?
   ↓
5. Вызов payETH(amount)
   ↓
6. sendTransaction через Wagmi
   ↓
7. Пользователь подтверждает в кошельке
   ↓
8. Ожидание подтверждения (2 блока)
   ↓
9. useEffect отслеживает txSuccess
   ↓
10. Помечает как оплаченный + запускает анимацию
```

---

## 🔑 Ключевые технологии

- **Wagmi v2** - библиотека для работы с Ethereum кошельками
- **@farcaster/miniapp-wagmi-connector** - коннектор для Farcaster Mini Apps
- **Viem** - утилиты для работы с Ethereum (parseEther, sendTransaction)
- **Base Network** - L2 сеть Ethereum (Chain ID: 8453)
- **Farcaster Mini App SDK** - SDK для получения контекста пользователя (FID, аватар)

---

## 📝 Примечания

1. **Двойная оплата предотвращается** через `paidSpreads` state (сессионный)
2. **Два способа платежа:**
   - Base Pay (USD) - для Base App
   - Wagmi sendTransaction (ETH) - для Farcaster/браузера
3. **Автоматическое переключение сети** на Base при необходимости
4. **Fallback механизмы** для работы вне Mini App окружения
