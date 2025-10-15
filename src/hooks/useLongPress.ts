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

import React, {useCallback, useEffect, useRef, useState} from 'react';

type LongPressOptions = {
    shouldPreventDefault?: boolean;
    delay?: number;
    moveThreshold?: number; // Added threshold for detecting movement
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
    {shouldPreventDefault = true, delay = 500, moveThreshold = 10}: LongPressOptions = {}
) {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>();
    const target = useRef<EventTarget>();

    // Track touch position to detect movement/scrolling
    const touchStartPosition = useRef<{x: number; y: number} | null>(null);
    const isMoving = useRef(false);

    // Prevent default for touch events
    const preventDefault = useCallback((e: Event) => {
        if (e && e.cancelable) {
            e.preventDefault();
        }
    }, []);

    // Track touch movement
    const handleTouchMove = useCallback((e: TouchEvent) => {
        // console.log('touchMove detected');
        if (!touchStartPosition.current) return;

        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPosition.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosition.current.y);

        // If movement exceeds threshold, mark as moving/scrolling
        if (dx > moveThreshold || dy > moveThreshold) {
            // console.log('Movement detected, likely scrolling');
            isMoving.current = true;

            // Clear the timeout since user is scrolling, not long-pressing
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = undefined;
            }
        }
    }, [moveThreshold]);

    // Start the long press timer
    const start = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            // console.log('start called', e.type);

            // Reset the moving flag at the start of each interaction
            isMoving.current = false;

            // Record touch start position for touch events
            if (e.type === 'touchstart') {
                const touchEvent = e as React.TouchEvent;
                const touch = touchEvent.touches[0];
                touchStartPosition.current = {
                    x: touch.clientX,
                    y: touch.clientY
                };

                // Add touchmove listener to detect scrolling
                document.addEventListener('touchmove', handleTouchMove, { passive: true });
            } else {
                touchStartPosition.current = null;
            }

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
        [shouldPreventDefault, delay, preventDefault, onLongPress, handleTouchMove]
    );

    // Clear the long press timer
    const clear = useCallback(
        (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
            // Remove touchmove listener
            document.removeEventListener('touchmove', handleTouchMove);

            // Clear the timeout
            if (timeout.current) {
                clearTimeout(timeout.current);
            }

            // Trigger click if appropriate - only if not moving/scrolling
            if (shouldTriggerClick && !longPressTriggered && onClick && !isMoving.current) {
                onClick();
            }

            // Reset the triggered state
            setLongPressTriggered(false);
            touchStartPosition.current = null;

            // Clean up event listeners
            if (shouldPreventDefault && target.current) {
                (target.current as Element).removeEventListener('touchend', preventDefault);
            }
        },
        [longPressTriggered, onClick, shouldPreventDefault, preventDefault, handleTouchMove]
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
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [preventDefault, handleTouchMove]);

    // Return event handlers to be spread onto the target element
    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e)
    };
}
