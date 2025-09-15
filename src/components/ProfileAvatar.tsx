/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/


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
        <AccountIcon sx={{fontSize: size * 0.6}}/>
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
