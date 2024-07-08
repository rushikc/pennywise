import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ListIcon from '@mui/icons-material/List';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TagIcon from '@mui/icons-material/Tag';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStorage } from '../utility/utility';

const actions = [
  { icon: <ListIcon />, name: 'Expenses' },
  { icon: <TagIcon />, name: 'Tag' },
  { icon: <QueryStatsIcon />, name: 'Analysis' },
];

export default function MySpeedDial() {

  const navigate = useNavigate();


  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const onClickNav = (name: string) => {
    navigate(name.replace(' ', '_'));
  };


  return (
    <>
    <Backdrop sx={{backgroundColor: '#757575bd'}} open={open} />
    <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        sx={{ 
          position: 'absolute',
          zIndex: 1,
          bottom: 30,
          left: 0,
          right: 0,
          margin: '0 auto',
        }}
        color='secondary'
        icon={<SpeedDialIcon />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
    >
        {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          color='purple'
          onClick={() => {
              handleClose();
              onClickNav(action.name)
          }}
        />
        ))}

        <SpeedDialAction
          icon={<HighlightOffIcon/>}
          tooltipTitle="Clear"
          tooltipOpen
          // sx={{backgroundColor: 'grey'}}
          onClick={() => {
            handleClose();
            clearStorage();
          }}
        />
    </SpeedDial>
    </>
  );
}
