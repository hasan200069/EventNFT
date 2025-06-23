# EventNFT - Decentralized Event Ticket Marketplace

A comprehensive decentralized platform where users can buy and sell event tickets as NFTs with escrow-based transaction protection.

## 🎯 Features

### Core Functionality
- **NFT Ticket System**: Each ticket is represented as an ERC-721 NFT with metadata
- **Escrow Protection**: Secure transactions with 7-day confirmation period
- **Admin Verification**: Ticket verification system before marketplace listing
- **Dispute Resolution**: Admin-mediated dispute resolution system
- **Resale Functionality**: Ticket holders can resell their verified tickets

### User Roles
- **Sellers**: Can mint and list tickets for verification and sale
- **Buyers**: Can browse, purchase, and confirm receipt of tickets
- **Admins**: Can verify tickets and resolve disputes

## 🏗️ Architecture

### Smart Contracts
- **EventTicketNFT.sol**: ERC-721 NFT contract with ticket metadata and locking mechanism
- **TicketMarketplace.sol**: Marketplace with escrow functionality and dispute resolution

### Frontend
- **React.js**: Modern frontend with Material-UI components
- **Web3 Integration**: MetaMask and wallet connection support
- **IPFS Integration**: Decentralized storage for ticket images and metadata

## 📋 Requirements

- Node.js 16+ and npm
- MetaMask or other Web3 wallet
- Git

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd EventNFT
npm install
cd frontend && npm install && cd ..
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Update `.env` with your configuration:
```
PRIVATE_KEY=your_private_key_here
GOERLI_URL=https://goerli.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

### 4. Deploy Contracts

```bash
# Terminal 2: Deploy to local network
npm run deploy:local
```

### 5. Start Frontend

```bash
# Terminal 3: Start React app
npm run frontend
```

### 6. Connect MetaMask

1. Open http://localhost:3000
2. Connect MetaMask to localhost:8545
3. Import accounts from Hardhat node using provided private keys

## 📖 Detailed Setup Guide

### Blockchain Setup

#### Local Development
```bash
# Start local Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test
```

#### Testnet Deployment (Goerli)
```bash
# Deploy to Goerli testnet
npm run deploy:testnet
```

### Frontend Configuration

The deployment script automatically:
- Copies contract ABIs to `frontend/src/contracts/`
- Updates contract addresses in the frontend
- Saves deployment information to `deployments/`

## 🔧 Usage Guide

### For Sellers

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask
2. **List Ticket**: 
   - Navigate to "List Ticket"
   - Fill in event details (name, date, venue, seat info, price)
   - Upload ticket image
   - Submit for admin verification
3. **Await Verification**: Admin will verify your ticket
4. **List for Sale**: Once verified, list your ticket on the marketplace

### For Buyers

1. **Browse Marketplace**: View available verified tickets
2. **Purchase Ticket**: 
   - Select a ticket and click "Purchase"
   - Confirm transaction in MetaMask
   - Ticket enters escrow (7-day period)
3. **Confirm Receipt**: Confirm transaction after receiving/using the ticket
4. **Automatic Release**: Funds auto-release after 7 days if no disputes

### For Admins

1. **Access Admin Dashboard**: Navigate to "/admin"
2. **Verify Tickets**: Review pending tickets and verify legitimate ones
3. **Resolve Disputes**: Handle disputes between buyers and sellers

## 🔐 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Access Control**: Role-based permissions (Owner, Admin, Marketplace)
- **Escrow System**: Funds held in contract until confirmation

### Transaction Flow
```
1. Seller mints ticket NFT → PENDING status
2. Admin verifies ticket → VERIFIED status  
3. Seller lists on marketplace
4. Buyer purchases → ticket LOCKED, funds in escrow
5. NFT transferred to buyer (but locked)
6. 7-day confirmation period
7. Both parties confirm OR auto-release → UNLOCKED, funds to seller
```

## 📁 Project Structure

```
EventNFT/
├── contracts/                 # Smart contracts
│   ├── EventTicketNFT.sol    # NFT contract
│   └── TicketMarketplace.sol  # Marketplace contract
├── scripts/                   # Deployment scripts
│   └── deploy.js
├── test/                      # Contract tests
│   └── EventTicketNFT.test.js
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   └── contracts/        # Contract ABIs (auto-generated)
│   └── public/
├── deployments/              # Deployment artifacts
├── hardhat.config.js         # Hardhat configuration
└── package.json
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/EventTicketNFT.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## 🌐 Deployment Networks

### Supported Networks
- **Localhost** (Chain ID: 1337) - Development
- **Goerli** (Chain ID: 5) - Testnet
- **Ethereum Mainnet** (Chain ID: 1) - Production

### Contract Addresses
After deployment, contract addresses are saved in:
- `deployments/localhost.json` (local)
- `deployments/goerli.json` (testnet)

## 🛠️ Available Scripts

### Root Directory
```bash
npm run compile          # Compile contracts
npm run test            # Run contract tests
npm run deploy:local    # Deploy to localhost
npm run deploy:testnet  # Deploy to Goerli testnet
npm run node           # Start Hardhat node
npm run frontend       # Start React frontend
npm run install-all    # Install all dependencies
```

### Frontend Directory
```bash
cd frontend
npm start              # Start development server
npm run build          # Build for production
npm test              # Run frontend tests
```

## 🐛 Troubleshooting

### Common Issues

#### MetaMask Connection Issues
- Ensure you're on the correct network (localhost:8545 for local development)
- Reset MetaMask account if nonce errors occur
- Check that you have ETH for gas fees

#### Contract Interaction Errors
- Verify contracts are deployed: check `deployments/` folder
- Ensure you're connected to the right network
- Check console for detailed error messages

#### IPFS Upload Issues
- The demo uses simulated IPFS uploads
- For production, integrate with Pinata, Infura IPFS, or run your own node

### Reset Local Environment
```bash
# Reset Hardhat node
npx hardhat clean
npx hardhat compile
npx hardhat node

# Redeploy contracts
npm run deploy:local
```

## 🔮 Future Enhancements

- [ ] Real IPFS integration with Pinata
- [ ] Mobile-responsive design improvements
- [ ] Push notifications for transaction updates
- [ ] QR code generation for tickets
- [ ] Event organizer dashboard
- [ ] Multi-token support (USDC, DAI)
- [ ] Batch ticket operations
- [ ] Ticket transfer history
- [ ] Advanced filtering and search
- [ ] Integration with event management platforms

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the test files for usage examples

---

**Built with ❤️ using React, Hardhat, and Solidity** 