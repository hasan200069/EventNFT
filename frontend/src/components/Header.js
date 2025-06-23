import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Person,
  Menu as MenuIcon,
  AdminPanelSettings,
  ConfirmationNumber,
  Storefront,
  Add,
  History,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    account,
    chainId,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getNetworkName,
    formatAddress,
  } = useWeb3();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleAccountMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleAccountMenuClose();
  };

  const navigationItems = [
    { label: 'Marketplace', path: '/marketplace', icon: <Storefront /> },
    { label: 'List Ticket', path: '/list-ticket', icon: <Add /> },
    { label: 'My Tickets', path: '/my-tickets', icon: <ConfirmationNumber /> },
    { label: 'My Transactions', path: '/my-transactions', icon: <History /> },
    { label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> },
  ];

  const NavigationButtons = () => (
    <>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          color="inherit"
          sx={{
            mx: 1,
            backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          startIcon={item.icon}
        >
          {item.label}
        </Button>
      ))}
    </>
  );

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
    >
      <Box sx={{ width: 250 }} onClick={() => setMobileDrawerOpen(false)}>
        <List>
          <ListItem>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              EventNFT
            </Typography>
          </ListItem>
          <Divider />
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                {item.icon}
                <ListItemText primary={item.label} sx={{ ml: 2 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  const WalletButton = () => {
    if (!account) {
      return (
        <Button
          variant="contained"
          onClick={connectWallet}
          disabled={isConnecting}
          startIcon={
            isConnecting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AccountBalanceWallet />
            )
          }
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {chainId && (
          <Chip
            label={getNetworkName(chainId)}
            size="small"
            color="secondary"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          />
        )}
        <Button
          color="inherit"
          onClick={handleAccountMenuOpen}
          startIcon={<Person />}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          {formatAddress(account)}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleAccountMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleAccountMenuClose(); }}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleDisconnect}>
            <AccountBalanceWallet sx={{ mr: 1 }} />
            Disconnect
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff, #f0f0f0)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🎫 EventNFT
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <NavigationButtons />
            </Box>
          )}

          <WalletButton />
        </Toolbar>
      </AppBar>
      
      {isMobile && <MobileDrawer />}
    </>
  );
};

export default Header; 