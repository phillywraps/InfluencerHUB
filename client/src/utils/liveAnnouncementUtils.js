/**
 * Live Announcement Utilities
 * 
 * This module provides utilities for managing ARIA live regions and screen reader
 * announcements throughout the application. It includes a priority system to
 * ensure important announcements aren't missed or overridden.
 */

import { useEffect, useRef, useState, useContext, createContext } from 'react';
import { useAccessibilityContext } from './accessibilityContext';

// Announcement priority levels
export const ANNOUNCEMENT_PRIORITY = {
  LOW: 'low',       // Informational updates that can be delayed
  MEDIUM: 'medium', // Important updates that should be announced soon
  HIGH: 'high',     // Critical updates that need immediate announcement
  NOW: 'now'        // Emergency updates that override any current announcement
};

// Politeness levels for ARIA live regions
export const POLITENESS = {
  POLITE: 'polite',       // Default - waits for screen reader to finish current task
  ASSERTIVE: 'assertive'  // Interrupts screen reader's current task
};

// Create a context for the announcement system
const LiveAnnouncementContext = createContext();

/**
 * LiveAnnouncementProvider component that manages a queue of announcements
 * for screen readers through ARIA live regions
 */
export function LiveAnnouncementProvider({ children }) {
  const [politeAnnouncements, setPoliteAnnouncements] = useState([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState([]);
  const [currentPoliteMessage, setCurrentPoliteMessage] = useState('');
  const [currentAssertiveMessage, setCurrentAssertiveMessage] = useState('');
  const politeTimeoutRef = useRef(null);
  const assertiveTimeoutRef = useRef(null);
  const { screenReaderEnabled } = useAccessibilityContext();

  // Process the assertive announcement queue
  useEffect(() => {
    if (assertiveAnnouncements.length === 0 || !screenReaderEnabled) return;
    
    // Clear any existing timeouts
    if (assertiveTimeoutRef.current) {
      clearTimeout(assertiveTimeoutRef.current);
    }
    
    // Get the next announcement
    const nextAnnouncement = assertiveAnnouncements[0];
    setCurrentAssertiveMessage(nextAnnouncement.message);
    
    // Set a timeout to clear the message and update the queue
    assertiveTimeoutRef.current = setTimeout(() => {
      setCurrentAssertiveMessage('');
      setAssertiveAnnouncements(prevAnnouncements => prevAnnouncements.slice(1));
      
      // Add a small delay before processing the next message
      assertiveTimeoutRef.current = setTimeout(() => {
        assertiveTimeoutRef.current = null;
      }, 50);
    }, nextAnnouncement.duration || 1000);
    
    return () => {
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
    };
  }, [assertiveAnnouncements, screenReaderEnabled]);
  
  // Process the polite announcement queue
  useEffect(() => {
    if (politeAnnouncements.length === 0 || !screenReaderEnabled) return;
    
    // Clear any existing timeouts
    if (politeTimeoutRef.current) {
      clearTimeout(politeTimeoutRef.current);
    }
    
    // Get the next announcement
    const nextAnnouncement = politeAnnouncements[0];
    setCurrentPoliteMessage(nextAnnouncement.message);
    
    // Set a timeout to clear the message and update the queue
    politeTimeoutRef.current = setTimeout(() => {
      setCurrentPoliteMessage('');
      setPoliteAnnouncements(prevAnnouncements => prevAnnouncements.slice(1));
      
      // Add a small delay before processing the next message
      politeTimeoutRef.current = setTimeout(() => {
        politeTimeoutRef.current = null;
      }, 50);
    }, nextAnnouncement.duration || 1000);
    
    return () => {
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
    };
  }, [politeAnnouncements, screenReaderEnabled]);

  /**
   * Add an announcement to the appropriate queue based on politeness level and priority
   * @param {string} message - The message to announce
   * @param {Object} options - Announcement options
   * @param {string} options.politeness - 'polite' or 'assertive'
   * @param {string} options.priority - 'low', 'medium', 'high', or 'now'
   * @param {number} options.duration - How long the message should stay in the live region in milliseconds
   */
  const announce = (message, options = {}) => {
    if (!message || !screenReaderEnabled) return;
    
    const {
      politeness = POLITENESS.POLITE,
      priority = ANNOUNCEMENT_PRIORITY.MEDIUM,
      duration = 1000
    } = options;
    
    const announcementItem = { message, priority, duration };
    
    // Handle NOW priority separately as it overrides all other announcements
    if (priority === ANNOUNCEMENT_PRIORITY.NOW) {
      if (politeness === POLITENESS.ASSERTIVE) {
        setCurrentAssertiveMessage(message);
        setAssertiveAnnouncements([]);
        if (assertiveTimeoutRef.current) {
          clearTimeout(assertiveTimeoutRef.current);
        }
        assertiveTimeoutRef.current = setTimeout(() => {
          setCurrentAssertiveMessage('');
        }, duration);
      } else {
        setCurrentPoliteMessage(message);
        setPoliteAnnouncements([]);
        if (politeTimeoutRef.current) {
          clearTimeout(politeTimeoutRef.current);
        }
        politeTimeoutRef.current = setTimeout(() => {
          setCurrentPoliteMessage('');
        }, duration);
      }
      return;
    }
    
    // Add to appropriate queue based on politeness
    if (politeness === POLITENESS.ASSERTIVE) {
      setAssertiveAnnouncements(prevAnnouncements => {
        // Insert based on priority
        const updatedAnnouncements = [...prevAnnouncements];
        
        // Find the insertion point based on priority
        let insertIndex = updatedAnnouncements.length;
        for (let i = 0; i < updatedAnnouncements.length; i++) {
          const currentPriority = updatedAnnouncements[i].priority;
          if (getPriorityValue(priority) > getPriorityValue(currentPriority)) {
            insertIndex = i;
            break;
          }
        }
        
        updatedAnnouncements.splice(insertIndex, 0, announcementItem);
        return updatedAnnouncements;
      });
    } else {
      setPoliteAnnouncements(prevAnnouncements => {
        // Insert based on priority
        const updatedAnnouncements = [...prevAnnouncements];
        
        // Find the insertion point based on priority
        let insertIndex = updatedAnnouncements.length;
        for (let i = 0; i < updatedAnnouncements.length; i++) {
          const currentPriority = updatedAnnouncements[i].priority;
          if (getPriorityValue(priority) > getPriorityValue(currentPriority)) {
            insertIndex = i;
            break;
          }
        }
        
        updatedAnnouncements.splice(insertIndex, 0, announcementItem);
        return updatedAnnouncements;
      });
    }
  };
  
  /**
   * Clear all pending announcements
   */
  const clearAnnouncements = () => {
    setPoliteAnnouncements([]);
    setAssertiveAnnouncements([]);
    setCurrentPoliteMessage('');
    setCurrentAssertiveMessage('');
    if (politeTimeoutRef.current) {
      clearTimeout(politeTimeoutRef.current);
      politeTimeoutRef.current = null;
    }
    if (assertiveTimeoutRef.current) {
      clearTimeout(assertiveTimeoutRef.current);
      assertiveTimeoutRef.current = null;
    }
  };
  
  return (
    <LiveAnnouncementContext.Provider value={{ announce, clearAnnouncements }}>
      {children}
      
      {/* ARIA live regions */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {currentPoliteMessage}
      </div>
      <div 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {currentAssertiveMessage}
      </div>
    </LiveAnnouncementContext.Provider>
  );
}

/**
 * Hook to use the live announcement system
 * @returns {Object} Announcement functions
 */
export function useLiveAnnouncement() {
  const context = useContext(LiveAnnouncementContext);
  if (!context) {
    throw new Error('useLiveAnnouncement must be used within a LiveAnnouncementProvider');
  }
  return context;
}

/**
 * Helper to get numerical value for priority levels for comparison
 * @param {string} priority - Priority level
 * @returns {number} Numerical priority value
 * @private
 */
function getPriorityValue(priority) {
  switch (priority) {
    case ANNOUNCEMENT_PRIORITY.NOW:
      return 4;
    case ANNOUNCEMENT_PRIORITY.HIGH:
      return 3;
    case ANNOUNCEMENT_PRIORITY.MEDIUM:
      return 2;
    case ANNOUNCEMENT_PRIORITY.LOW:
      return 1;
    default:
      return 0;
  }
}

/**
 * Component for making one-time announcements when a value changes
 * @param {Object} props - Component props
 * @param {any} props.value - Value to monitor for changes
 * @param {Function} props.getMessage - Function that returns the message to announce
 * @param {Object} props.options - Announcement options
 */
export function LiveRegionAnnouncer({ value, getMessage, options = {} }) {
  const { announce } = useLiveAnnouncement();
  const previousValueRef = useRef(value);
  
  useEffect(() => {
    // Only announce when the value changes
    if (value !== previousValueRef.current) {
      const message = typeof getMessage === 'function' 
        ? getMessage(value, previousValueRef.current)
        : getMessage;
      
      announce(message, options);
      previousValueRef.current = value;
    }
  }, [value, getMessage, announce, options]);
  
  // This component doesn't render anything
  return null;
}

/**
 * Higher order component that adds live announcement capabilities to a component
 * @param {Component} WrappedComponent - Component to wrap
 * @returns {Component} Enhanced component with live announcement capabilities
 */
export function withLiveAnnouncement(WrappedComponent) {
  function WithLiveAnnouncement(props) {
    const announcementProps = useLiveAnnouncement();
    return <WrappedComponent {...props} liveAnnouncement={announcementProps} />;
  }
  
  WithLiveAnnouncement.displayName = `WithLiveAnnouncement(${getDisplayName(WrappedComponent)})`;
  return WithLiveAnnouncement;
}

/**
 * Helper to get component display name for HOC
 * @param {Component} WrappedComponent - Component
 * @returns {string} Display name
 * @private
 */
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
