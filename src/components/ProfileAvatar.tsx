import React, { useState } from 'react';
import { Avatar, CircularProgress, Box } from '@mui/material';
import { AccountCircle as AccountIcon } from '@mui/icons-material';

interface ProfileAvatarProps {
  photoUrl: string | null;
  name: string;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Avatar
      src={imageLoaded && photoUrl ? photoUrl : undefined}
      alt={name}
      className={className}
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main'
      }}
    >
      {!imageLoaded && photoUrl && (
        <>
          <img
            src={photoUrl}
            alt=""
            style={{ display: 'none' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {/*<CircularProgress size={size * 0.4} color="inherit" />*/}
        </>
      )}
      {(!photoUrl || imageError) && (
        <AccountIcon sx={{ fontSize: size * 0.6 }} />
      )}
    </Avatar>
  );
};

export default ProfileAvatar;
