# StreamFlow Clone

A modern token streaming and vesting platform for Solana with real-time payments, vesting schedules, and treasury management.

## Features

- **Token Streaming**: Create continuous payment streams with customizable rates and schedules
- **Vesting Schedules**: Set up linear and cliff vesting for team tokens and investor allocations
- **Treasury Management**: Comprehensive dashboard for managing organizational funds
- **Real-time Payments**: Automated payment distribution with second-by-second precision
- **Multi-token Support**: Support for SPL tokens and native SOL
- **Advanced Analytics**: Detailed insights into payment flows and vesting progress
- **Recipient Management**: Easy management of payment recipients and beneficiaries

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Blockchain**: Solana Web3.js, Anchor Framework
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Solana CLI tools
- Phantom or Solflare wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/streamflow-clone.git
cd streamflow-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
streamflow-clone/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── streams/           # Stream management pages
│   ├── vesting/           # Vesting schedule pages
│   └── treasury/          # Treasury management pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Chart components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── solana/           # Solana-specific utilities
│   ├── utils.ts          # General utilities
│   └── constants.ts      # Application constants
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Components

### Stream Management
- Create and manage token streams
- Real-time payment tracking
- Automatic payment distribution
- Stream pause/resume functionality

### Vesting Schedules
- Linear vesting with customizable periods
- Cliff vesting support
- Beneficiary management
- Vesting progress tracking

### Treasury Dashboard
- Multi-token balance overview
- Transaction history
- Payment analytics
- Fund allocation insights

### Wallet Integration
- Solana Wallet Adapter integration
- Multi-wallet support (Phantom, Solflare, etc.)
- Secure transaction signing
- Account balance monitoring

## Usage

### Creating a Stream

1. Connect your Solana wallet
2. Navigate to "Create Stream"
3. Select token and recipient
4. Configure stream parameters (rate, duration, start time)
5. Review and confirm transaction

### Setting Up Vesting

1. Go to "Vesting Schedules"
2. Click "New Vesting Schedule"
3. Add beneficiaries and token amounts
4. Configure vesting parameters (cliff, duration)
5. Deploy vesting contract

### Managing Treasury

1. Access "Treasury Dashboard"
2. View token balances and allocations
3. Monitor payment flows
4. Generate financial reports

## API Reference

### Stream Operations

```typescript
// Create a new stream
const stream = await createStream({
  recipient: PublicKey,
  token: PublicKey,
  amount: number,
  rate: number,
  startTime: Date,
  endTime: Date
});

// Pause/Resume stream
await pauseStream(streamId);
await resumeStream(streamId);

// Cancel stream
await cancelStream(streamId);
```

### Vesting Operations

```typescript
// Create vesting schedule
const vesting = await createVestingSchedule({
  beneficiary: PublicKey,
  token: PublicKey,
  totalAmount: number,
  cliffDuration: number,
  vestingDuration: number
});

// Claim vested tokens
await claimVestedTokens(vestingId);
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All smart contracts are audited
- Multi-signature wallet support
- Secure key management practices
- Regular security updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs.streamflow-clone.com](https://docs.streamflow-clone.com)
- Discord: [Join our community](https://discord.gg/streamflow-clone)
- Email: support@streamflow-clone.com

## Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Governance token and DAO features

## Acknowledgments

- Solana Foundation for blockchain infrastructure
- shadcn/ui for component library
- Vercel for hosting and deployment
- The open-source community for various tools and libraries