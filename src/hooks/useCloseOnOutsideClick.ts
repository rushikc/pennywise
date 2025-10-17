/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, { useEffect } from 'react';

/**
 * Custom hook to handle outside clicks and scroll events for panels
 * @param isOpen - Whether the panel is currently open
 * @param onClose - Function to call when the panel should be closed
 * @param panelRef - Ref to the panel element
 * @param buttonRef - Ref to the button that opens the panel
 */
export const useCloseOnOutsideClick = (
  isOpen: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLDivElement>,
  buttonRef: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    if (!isOpen) return; // Skip if panel not shown

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleScroll = () => onClose();

    // Add and clean up event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose, panelRef, buttonRef]);
};
