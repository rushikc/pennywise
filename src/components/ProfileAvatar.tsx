import React, {useState} from 'react';
import {Avatar} from '@mui/material';
import AccountIcon from '@mui/icons-material/AccountCircle';

interface ProfileAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * A component to display user profile images with proper loading states
 */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoUrl,
  name,
  size = 60,
  className
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };


  if (!photoUrl || imageError) {
    return (
      <Avatar
        alt={name}
        className={className}
        sx={{
          width: size,
          height: size,
          bgcolor: 'primary.main'
        }}
      >
        <AccountIcon sx={{ fontSize: size * 0.6 }} />
      </Avatar>
    );
  }

  return (
    <Avatar
      src={photoUrl}
      alt={name}
      className={className}
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main'
      }}
      slotProps={{
        img: {
          loading: 'lazy',
          onError: handleImageError,
        },
      }}
    />
  );
};

export default ProfileAvatar;
