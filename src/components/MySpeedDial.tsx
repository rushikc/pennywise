import * as React from 'react';
import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: <FileCopyIcon />, name: 'Home' },
  { icon: <SaveIcon />, name: 'Tag' },
  { icon: <PrintIcon />, name: 'Update' },
  { icon: <ShareIcon />, name: 'Logout' },
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
    <Backdrop open={open} />
    <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        sx={{ zIndex: '1000', position: 'absolute', bottom: 50, right: 36 }}
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
            onClick={() => {
                handleClose();
                onClickNav(action.name)
            }}
        />
        ))}
    </SpeedDial>
    </>
  );
}
