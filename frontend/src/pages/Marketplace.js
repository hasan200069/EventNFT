import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Event,
  Chair,
  AttachMoney,
  Verified,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useWeb3 } from '../context/Web3Context';

const Marketplace = () => {
  const {
    account,
    contracts,
    formatEther,
    purchaseTicket,
  } = useWeb3();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [contracts]);

  const loadTickets = async () => {
    if (!contracts.marketplace || !contracts.ticketNFT) return;

    try {
      setLoading(true);
      
      // Get active listings
      const activeListings = await contracts.marketplace.getActiveListings();
      
      const ticketsData = await Promise.all(
        activeListings.map(async (tokenId) => {
          try {
            const listing = await contracts.marketplace.listings(tokenId);
            const ticketInfo = await contracts.ticketNFT.getTicketInfo(tokenId);
            const tokenURI = await contracts.ticketNFT.tokenURI(tokenId);
            
            return {
              tokenId: tokenId.toString(),
              listing,
              ticketInfo,
              tokenURI,
            };
          } catch (error) {
            console.error(`Error loading ticket ${tokenId}:`, error);
            return null;
          }
        })
      );

      setTickets(ticketsData.filter(ticket => ticket !== null));
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (ticket) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (ticket.listing.seller.toLowerCase() === account.toLowerCase()) {
      toast.error("You can't buy your own ticket");
      return;
    }

    setSelectedTicket(ticket);
    setPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedTicket) return;

    try {
      setPurchasing(true);
      const price = formatEther(selectedTicket.listing.price);
      
      await purchaseTicket(selectedTicket.tokenId, price);
      
      toast.success('Ticket purchased successfully!');
      setPurchaseDialog(false);
      await loadTickets(); // Refresh the list
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase ticket');
    } finally {
      setPurchasing(false);
    }
  };

  const filteredAndSortedTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.ticketInfo.eventName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        ticket.ticketInfo.venue
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const price = parseFloat(formatEther(ticket.listing.price));
      const matchesPrice = 
        (!priceRange.min || price >= parseFloat(priceRange.min)) &&
        (!priceRange.max || price <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.listing.price.sub(b.listing.price);
        case 'price-high':
          return b.listing.price.sub(a.listing.price);
        case 'event-name':
          return a.ticketInfo.eventName.localeCompare(b.ticketInfo.eventName);
        case 'newest':
        default:
          return b.listing.timestamp - a.listing.timestamp;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 1: return 'success'; // VERIFIED
      case 2: return 'warning'; // LOCKED
      case 3: return 'info';    // UNLOCKED
      case 4: return 'error';   // DISPUTED
      default: return 'default'; // PENDING
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Verified';
      case 2: return 'Locked';
      case 3: return 'Unlocked';
      case 4: return 'Disputed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Event Ticket Marketplace
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Discover and purchase verified event tickets as NFTs
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">Filter & Search</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search events or venues"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="event-name">Event Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Min Price (ETH)"
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                size="small"
              />
              <TextField
                label="Max Price (ETH)"
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Results */}
      {filteredAndSortedTickets.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No tickets found matching your criteria.
        </Alert>
      ) : (
        <Typography variant="h6" gutterBottom>
          {filteredAndSortedTickets.length} ticket(s) found
        </Typography>
      )}

      {/* Tickets Grid */}
      <Grid container spacing={3}>
        {filteredAndSortedTickets.map((ticket) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={ticket.tokenId}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={ticket.tokenURI.includes('ipfs://') 
                  ? `https://ipfs.io/ipfs/${ticket.tokenURI.replace('ipfs://', '')}`
                  : ticket.tokenURI || '/placeholder-ticket.jpg'
                }
                alt={ticket.ticketInfo.eventName}
                sx={{ objectFit: 'cover' }}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    {ticket.ticketInfo.eventName}
                  </Typography>
                  <Chip
                    size="small"
                    icon={<Verified />}
                    label={getStatusText(ticket.ticketInfo.status)}
                    color={getStatusColor(ticket.ticketInfo.status)}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Event sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {ticket.ticketInfo.eventDate}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {ticket.ticketInfo.venue}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chair sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {ticket.ticketInfo.seatInfo}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {formatEther(ticket.listing.price)} ETH
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePurchase(ticket)}
                  disabled={!account || ticket.listing.seller.toLowerCase() === account?.toLowerCase()}
                  sx={{ fontWeight: 'bold' }}
                >
                  {!account ? 'Connect Wallet' : 
                   ticket.listing.seller.toLowerCase() === account?.toLowerCase() ? 'Your Ticket' :
                   'Purchase Ticket'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={purchaseDialog}
        onClose={() => setPurchaseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.ticketInfo.eventName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedTicket.ticketInfo.venue} • {selectedTicket.ticketInfo.eventDate}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Seat: {selectedTicket.ticketInfo.seatInfo}
              </Typography>
              <Typography variant="h5" color="primary" sx={{ mt: 2, fontWeight: 'bold' }}>
                Price: {formatEther(selectedTicket.listing.price)} ETH
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                After purchase, the ticket will be transferred to your wallet but will remain locked until both parties confirm the transaction or 7 days pass.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmPurchase}
            variant="contained"
            disabled={purchasing}
            startIcon={purchasing && <CircularProgress size={20} />}
          >
            {purchasing ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Marketplace; 