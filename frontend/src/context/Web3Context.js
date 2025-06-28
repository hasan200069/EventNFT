import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// Import contract ABIs and addresses
import EventTicketNFTABI from '../contracts/EventTicketNFT.json';
import TicketMarketplaceABI from '../contracts/TicketMarketplace.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contracts, setContracts] = useState({
    ticketNFT: null,
    marketplace: null,
  });

  // Contract addresses (these will be set after deployment)
  const CONTRACT_ADDRESSES = {
    TICKET_NFT: EventTicketNFTABI.address || '',
    MARKETPLACE: TicketMarketplaceABI.address || '',
  };

  // Network configuration
  const SUPPORTED_NETWORKS = {
    1337: 'Localhost',
    5: 'Goerli',
    1: 'Ethereum Mainnet',
  };

  // Initialize provider and check if wallet is already connected
  useEffect(() => {
    const initializeWeb3 = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);

        // Check if already connected
        try {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            
            setAccount(accounts[0].address);
            setSigner(signer);
            setChainId(Number(network.chainId));
            
            await initializeContracts(signer);
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    };

    initializeWeb3();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null);
      setSigner(null);
      setContracts({ ticketNFT: null, marketplace: null });
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      if (provider) {
        const signer = await provider.getSigner();
        setSigner(signer);
        await initializeContracts(signer);
      }
    }
  };

  const handleChainChanged = (chainId) => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const initializeContracts = async (signer) => {
    try {
      if (!CONTRACT_ADDRESSES.TICKET_NFT || !CONTRACT_ADDRESSES.MARKETPLACE) {
        console.warn('Contract addresses not set');
        return;
      }
      // console.log("NFT address:", CONTRACT_ADDRESSES.TICKET_NFT);
      // console.log("Marketplace address:", CONTRACT_ADDRESSES.MARKETPLACE);
      const ticketNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.TICKET_NFT,
        EventTicketNFTABI.abi,
        signer
      );

      const marketplace = new ethers.Contract(
        CONTRACT_ADDRESSES.MARKETPLACE,
        TicketMarketplaceABI.abi,
        signer
      );

      setContracts({ ticketNFT, marketplace });

      // const network = await signer.provider.getNetwork();
      // console.log("Connected network:", network);

    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize contracts');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet');
      return false;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      // Check if we're on a supported network
      if (!SUPPORTED_NETWORKS[Number(network.chainId)]) {
        toast.warn(`Unsupported network. Please switch to a supported network.`);
      }

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      await initializeContracts(signer);

      toast.success('Wallet connected successfully!');
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setContracts({ ticketNFT: null, marketplace: null });
    toast.info('Wallet disconnected');
  };

  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(targetChainId) }],
      });
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
      return false;
    }
  };

  const getNetworkName = (chainId) => {
    return SUPPORTED_NETWORKS[chainId] || 'Unknown Network';
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEther = (value) => {
    return ethers.formatEther(value);
  };

  const parseEther = (value) => {
    return ethers.parseEther(value.toString());
  };

  // Contract interaction helpers
  const mintTicket = async (ticketData) => {
    if (!contracts.ticketNFT) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.ticketNFT.mintTicket(
        account,
        ticketData.eventName,
        ticketData.eventDate,
        ticketData.venue,
        ticketData.seatInfo,
        parseEther(String(ticketData.originalPrice || "0")),
        ticketData.proofImageHash,
        ticketData.tokenURI
      );
      
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error minting ticket:', error);
      throw error;
    }
  };

  const listTicket = async (tokenId, price) => {
    if (!contracts.marketplace) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.marketplace.listTicket(tokenId, parseEther(price));
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error listing ticket:', error);
      throw error;
    }
  };

  const purchaseTicket = async (tokenId, price) => {
    if (!contracts.marketplace) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.marketplace.purchaseTicket(tokenId, {
        value: parseEther(price)
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw error;
    }
  };

  const confirmTransaction = async (tokenId) => {
    if (!contracts.marketplace) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.marketplace.confirmTransaction(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      throw error;
    }
  };

  const raiseDispute = async (tokenId, reason) => {
    if (!contracts.marketplace) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.marketplace.raiseDispute(tokenId, reason);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error raising dispute:', error);
      throw error;
    }
  };

  const verifyTicket = async (tokenId) => {
    if (!contracts.ticketNFT) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.ticketNFT.verifyTicket(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error verifying ticket:', error);
      throw error;
    }
  };

  const resolveDispute = async (tokenId, sellerWins) => {
    if (!contracts.marketplace) throw new Error('Contract not initialized');
    
    try {
      const tx = await contracts.marketplace.resolveDispute(tokenId, sellerWins);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  };

  const value = {
    // State
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    contracts,
    
    // Configuration
    SUPPORTED_NETWORKS,
    CONTRACT_ADDRESSES,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    
    // Utilities
    getNetworkName,
    formatAddress,
    formatEther,
    parseEther,
    
    // Contract interactions
    mintTicket,
    listTicket,
    purchaseTicket,
    confirmTransaction,
    raiseDispute,
    verifyTicket,
    resolveDispute,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}; 