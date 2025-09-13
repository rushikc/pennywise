/*
 * Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details, or get a copy at
 * <https://www.gnu.org/licenses/gpl-3.0.txt>.
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';

type LongPressOptions = {
 shouldPreventDefault?: boolean;
 delay?: number;
};

/**
 * Hook for detecting long press gestures on both touch and mouse devices.
 *
 * @param onLongPress Function to call when long press is detected
 * @param onClick Optional function to call for normal clicks/taps
 * @param options Configuration options for the long press behavior
 * @returns Event handlers to attach to the target element
 */
export function useLongPress(
 onLongPress: () => void,
 onClick?: () => void,
 {shouldPreventDefault = true, delay = 500}: LongPressOptions = {}
) {
 const [longPressTriggered, setLongPressTriggered] = useState(false);
 const timeout = useRef<ReturnType<typeof setTimeout>>();
 const target = useRef<EventTarget>();

 // Prevent default for touch events
 const preventDefault = useCallback((e: Event) => {
  if (e && e.cancelable) {
   e.preventDefault();
  }
 }, []);


 // Start the long press timer
 const start = useCallback(
  (e: React.MouseEvent | React.TouchEvent) => {
   // Prevent default behavior if configured to do so
   if (shouldPreventDefault && e.target) {
    e.target.addEventListener('touchend', preventDefault, {passive: false});
    target.current = e.target;
   }

   // Set a timer for the long press
   timeout.current = setTimeout(() => {
    onLongPress();
    setLongPressTriggered(true);
   }, delay);
  },
  [shouldPreventDefault, delay, preventDefault, onLongPress]
 );

 // Clear the long press timer
 const clear = useCallback(
  (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
   // Clear the timeout
   if (timeout.current) {
    clearTimeout(timeout.current);
   }

   // Trigger click if appropriate
   if (shouldTriggerClick && !longPressTriggered && onClick) {
    onClick();
   }

   // Reset the triggered state
   setLongPressTriggered(false);

   // Clean up event listeners
   if (shouldPreventDefault && target.current) {
    (target.current as Element).removeEventListener('touchend', preventDefault);
   }
  },
  [longPressTriggered, onClick, shouldPreventDefault, preventDefault]
 );


 // Clean up on unmount
 useEffect(() => {
  return () => {
   if (timeout.current) {
    clearTimeout(timeout.current);
   }
   if (target.current) {
    (target.current as Element).removeEventListener('touchend', preventDefault);
   }
  };
 }, [preventDefault]);

 // Return event handlers to be spread onto the target element
 return {
  onMouseDown: (e: React.MouseEvent) => start(e),
  onTouchStart: (e: React.TouchEvent) => start(e),
  onMouseUp: (e: React.MouseEvent) => clear(e),
  onMouseLeave: (e: React.MouseEvent) => clear(e, false),
  onTouchEnd: (e: React.TouchEvent) => clear(e)
 };
}
