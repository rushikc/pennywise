import HomeIcon from '@mui/icons-material/Home';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
    setValue(newValue);
  };

  return (
    <BottomNavigation value={value} onChange={handleChange}>
      <BottomNavigationAction
        label="Home"
        value="home"
        icon={<HomeIcon />}
      />
      <BottomNavigationAction
        label="Stats"
        value="stats"
        icon={<SpaceDashboardIcon />}
      />
      <BottomNavigationAction
        label="Profile"
        value="profile"
        icon={<AccountCircleIcon />}
      />
    </BottomNavigation>
  );
}
