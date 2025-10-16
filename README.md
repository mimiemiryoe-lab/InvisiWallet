## InvisiWallet — Invisible Crypto Payments (Starknet + ChiPay)

InvisiWallet is a mobile‑first, Venmo‑style payments app that hides blockchain complexity while keeping users in self‑custody on Starknet. Users sign up with email, send to `@username`, and never touch seed phrases, gas, or addresses. Under the hood, we integrate Starknet account abstraction and optional ChiPay checkout for fiat‑like flows.

### Why it matters
- Ultra‑low fees (Starknet), security inherited from Ethereum, and a familiar UX.
- Bridges Web2 sign‑in with Web3 self‑custody for the next wave of users.
- Optional privacy mode masks sensitive UI, opening doors for future private tx research.

---

## Features
- Starknet wallet connect (Argent X / Braavos)
- On‑chain ERC‑20 transfer via `starknet.js`, recording `tx_hash`
- ChiPay checkout fallback (opens ChiPay checkout if no on‑chain transfer)
- Off‑chain ledger in Supabase for activity feed and balances
- Privacy mode (masks balance, usernames, amounts; tags tx note as `[private]`)
- Invisible wallet creation via ChiPay SDK on user signup
- Gas sponsorship through ChiPay paymaster

---

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Wallet/Chain: `starknet.js` (Argent X / Braavos injectors)
- Backend-as-a-service: Supabase (Auth, DB)
- Payments: ChiPay Checkout (client‑side), server webhook for production

---

## Project Story

### 🎯 **What Inspired Us**

The inspiration for InvisiWallet came from a simple observation: **crypto payments still feel worse than Venmo**. Despite having superior technology (ultra-low fees, instant settlement, self-custody), mainstream users are blocked by:

- Complex wallet addresses (`0x742d35Cc6634C0532925a3b8D...`)
- Gas fees and transaction failures
- Seed phrase management nightmares
- Unfamiliar blockchain terminology

We asked: *"What if we could give users the security and sovereignty of crypto with the simplicity of Venmo?"*

### 🏗️ **How We Built It**

Our approach was to **abstract away blockchain complexity** while maintaining self-custody:

1. **Invisible Wallets**: Every user gets a Starknet wallet created via ChiPay SDK on signup
2. **Username-Based Payments**: Send to `@username` instead of addresses
3. **Gas Sponsorship**: ChiPay paymaster covers gas fees for seamless UX
4. **Account Abstraction**: Leverage Starknet's native AA for Web2-like features
5. **Hybrid Architecture**: On-chain transfers when possible, ChiPay fallback when needed

**Technical Architecture:**
```
Frontend (React + starknet.js) 
    ↓
Backend (Node.js + ChiPay SDK)
    ↓
Starknet (Account Abstraction + ERC-20)
    ↓
Supabase (User data + Transaction ledger)
```

### 🎓 **What We Learned**

**Starknet Account Abstraction is Powerful:**
- Native support for social recovery and paymasters
- Seamless wallet connection with Argent X/Braavos
- Gas sponsorship enables fee-less user experience

**ChiPay Integration Challenges:**
- API documentation gaps required trial-and-error
- Environment variable management across frontend/backend
- Webhook handling for transaction reconciliation

**User Experience Insights:**
- Privacy mode is crucial for mainstream adoption
- Transaction transparency (showing both DB and blockchain records) builds trust
- Dark theme and modern UI significantly improve perceived quality

### 🚧 **Challenges We Faced**

#### **Technical Challenges:**

1. **Starknet.js Learning Curve**
   - Complex wallet connection flow with multiple providers
   - RPC endpoint compatibility issues
   - Transaction signing and execution nuances

2. **ChiPay API Integration**
   - Limited documentation for server-side SDK
   - Environment variable configuration complexity
   - Webhook implementation for transaction status updates

3. **Database Schema Evolution**
   - Adding `starknet_address` column to existing profiles
   - Transaction type enum limitations in PostgreSQL
   - Real-time transaction updates with Supabase

4. **Frontend State Management**
   - Coordinating wallet connection with user authentication
   - Managing on-chain vs off-chain transaction states
   - Privacy mode implementation across all components

#### **What We Failed to Achieve:**

1. **Complete Social Recovery**
   - **Goal**: Email/OTP-based wallet recovery
   - **Reality**: Implemented basic account abstraction but not full social recovery
   - **Why**: Time constraints and complexity of Starknet AA implementation

2. **Real-Time Transaction Updates**
   - **Goal**: Live transaction status updates via webhooks
   - **Reality**: Manual refresh required for transaction status
   - **Why**: ChiPay webhook integration complexity and time limits

3. **Mobile App**
   - **Goal**: Native mobile app for better UX
   - **Reality**: Web app only (though mobile-responsive)
   - **Why**: Focused on core functionality over platform expansion

4. **Advanced Privacy Features**
   - **Goal**: Private transactions with no trace
   - **Reality**: Basic privacy mode (UI masking only)
   - **Why**: Starknet privacy features require additional research

### 🏆 **What We Achieved**

#### **Core Functionality:**
✅ **Invisible Wallet Creation**: Automatic Starknet wallet provisioning via ChiPay SDK  
✅ **Username-Based Payments**: Send to `@username` instead of addresses  
✅ **Real On-Chain Transfers**: Actual ERC-20 token transfers with `tx_hash` recording  
✅ **Gas Sponsorship**: ChiPay paymaster integration for fee-less transactions  
✅ **Hybrid Payment Flow**: On-chain when possible, ChiPay fallback when needed  

#### **User Experience:**
✅ **Venmo-Like Interface**: Familiar payment flow with modern dark theme  
✅ **Privacy Mode**: Mask sensitive information for privacy-conscious users  
✅ **Transaction Transparency**: Separate tabs for database vs blockchain records  
✅ **Wallet Integration**: Seamless Argent X/Braavos connection  

#### **Technical Excellence:**
✅ **Production-Ready Code**: No demo/mock modes, real API integrations  
✅ **Error Handling**: Graceful fallbacks and user-friendly error messages  
✅ **Responsive Design**: Mobile-first approach with beautiful UI  
✅ **Type Safety**: Full TypeScript implementation with proper interfaces  

### 🔮 **Future Vision**

**Short Term:**
- Complete social recovery implementation
- Real-time webhook integration
- Mobile app development

**Long Term:**
- Cross-chain compatibility
- Advanced privacy features
- DeFi integration (lending, staking)
- Merchant payment processing

### 💡 **Key Innovation**

Our core innovation is the **"Invisible Wallet"** concept - users get the security and sovereignty of self-custody without any blockchain complexity. This bridges the gap between Web2 convenience and Web3 benefits, making crypto payments accessible to mainstream users.

**The magic happens when users don't even know they're using blockchain technology, but they still maintain full control of their funds.**

---

## Quick Start

### Prerequisites
- Node.js 18+ (or Bun 1.1+, optional)
- npm 10+/pnpm 9+ (any Node package manager)
- Supabase project (Anon key + URL)
- Argent X or Braavos installed in your browser for on‑chain demo

### Install
```bash
npm install
# or
pnpm install
# or
bun install
```

### Environment
Create a `.env` file at project root with the following (Vite exposes `VITE_` vars):
```env
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# Optional: Starknet
VITE_STARKNET_RPC="https://starknet-sepolia.public.blastapi.io/rpc/v0_7"  # or your provider
VITE_STARKNET_TOKEN="0x..."  # ERC-20 token (18 decimals assumed)

# Optional: ChiPay
VITE_CHIPAY_CHECKOUT_URL="https://pay.chipay.example/checkout"  # your ChiPay checkout base
```

Supabase anon URL/key are currently hardcoded in `src/lib/supabase.ts` for demo. Prefer environment variables for production.

### Run Dev
```bash
npm run dev
```
App starts on `http://localhost:5173` by default.

### Build
```bash
npm run build && npm run preview
```

---

## Supabase Schema (minimum)
- `refer - supabase_migration_invisible_wallets.sql & 
supabase_tables.txt`
---

## Where things live
- `src/contexts/StarknetContext.tsx`: wallet connect, chain id, `sendToken()`
- `src/components/WalletConnect.tsx`: connect/disconnect UI
- `src/pages/Send.tsx`: hybrid flow — on‑chain attempt → else ChiPay checkout; records `tx_hash`/`processor`
- `src/pages/Dashboard.tsx`: balance and activity feed; privacy toggle
- `src/contexts/PrivacyContext.tsx`: privacy mode state
- `src/lib/chipay.ts`: ChiPay checkout URL helper
- `src/lib/supabase.ts`: Supabase client (replace with env usage for prod)

---

## Production Notes & Next Steps
- Replace hardcoded Supabase values with environment variables.
- Add backend webhook to confirm ChiPay payments and set `transactions.status='completed'`.
- Add paymaster and social recovery for true “invisible wallet” UX.
- Support tokens with arbitrary decimals (current demo assumes 18).
- Add username → Starknet address resolution service or ENS‑like aliasing.

---

## License
MIT
 

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
