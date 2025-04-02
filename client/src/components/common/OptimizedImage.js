import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { startTransaction, recordMetric } from '../../services/monitoringService';
import { memoWithOptions } from '../../utils/memoHelper';
import handleError from '../../services/errorService';

/**
 * OptimizedImage component for efficient image loading and display
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Progressive loading with low-quality placeholder
 * - Blur-up animation when transitioning from placeholder to full image
 * - Fallback behavior for image loading errors
 * - Performance tracking for image loading metrics
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '',
  fallback = '',
  aspectRatio,
  lazy = true,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  loadingStrategy = 'progressive', // 'progressive', 'eager', or 'lazy'
  placeholderColor = '#f0f0f0',
  rounded = false,
  quality = 'auto',
  trackPerformance = false,
  ...otherProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const imageRef = useRef(null);
  const observerRef = useRef(null);
  const loadStartTime = useRef(0);
  const performanceTransaction = useRef(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy) return;
    
    const options = {
      root: null, // viewport
      rootMargin,
      threshold
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Element is in view, start loading the image
        loadImage();
        
        // Stop observing once image is loading
        if (observerRef.current && imageRef.current) {
          observerRef.current.unobserve(imageRef.current);
        }
      }
    }, options);

    if (imageRef.current) {
      observerRef.current.observe(imageRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, rootMargin, threshold, src]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (performanceTransaction.current) {
        performanceTransaction.current.finish();
      }
    };
  }, []);

  // Start loading image directly if not lazy loading
  useEffect(() => {
    if (!lazy) {
      loadImage();
    }
  }, [lazy, src]);

  // Reset state if src or placeholder changes
  useEffect(() => {
    if (!isLoaded) {
      setImageSrc(placeholder || src);
    }
  }, [placeholder, src, isLoaded]);

  const loadImage = () => {
    if (!src || src === placeholder) return;
    
    // Start tracking performance if enabled
    if (trackPerformance) {
      loadStartTime.current = performance.now();
      performanceTransaction.current = startTransaction('image_load', 'resource');
      performanceTransaction.current.setTag('src', src);
    }
    
    // Create a new image for preloading
    const img = new Image();
    
    // Quality parameter handling (for compatible CDNs like Cloudinary, Imgix)
    if (quality !== 'auto' && src.includes('?')) {
      // If the URL already has query parameters, append quality
      img.src = `${src}&q=${quality}`;
    } else if (quality !== 'auto') {
      // If no query parameters, add quality
      img.src = `${src}?q=${quality}`;
    } else {
      img.src = src;
    }
    
    img.onload = () => {
      // Enable transitions before switching to real image for smooth effect
      setTransitionEnabled(true);
      setImageSrc(img.src);
      setIsLoaded(true);
      
      // Record performance metrics if tracking is enabled
      if (trackPerformance) {
        const loadTime = performance.now() - loadStartTime.current;
        recordMetric('image_load_time', loadTime, { src });
        
        if (performanceTransaction.current) {
          performanceTransaction.current.setData('loadTime', loadTime);
          performanceTransaction.current.finish();
        }
      }
      
      // Call user's onLoad handler if provided
      if (onLoad) onLoad();
    };
    
    img.onerror = (event) => {
      setIsError(true);
      setImageSrc(fallback || placeholder);
      
      // Log error
      const errorId = handleError(
        new Error(`Failed to load image: ${src}`),
        { fallbackUsed: !!fallback, placeholderUsed: !!placeholder },
        'OptimizedImage'
      );
      
      // Call user's onError handler if provided
      if (onError) onError(event, errorId);
    };
  };

  // Compose class names based on component state
  const getClassNames = () => {
    const classes = ['optimized-image'];
    
    if (className) classes.push(className);
    if (isLoaded) classes.push('is-loaded');
    if (isError) classes.push('has-error');
    if (transitionEnabled) classes.push('with-transition');
    if (rounded) classes.push('is-rounded');
    
    return classes.join(' ');
  };

  // Styles for component
  const getStyles = () => {
    const styles = {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: placeholderColor,
      objectFit,
      objectPosition,
    };
    
    if (width) styles.width = width;
    if (height) styles.height = height;
    
    if (aspectRatio && !height) {
      styles.aspectRatio = aspectRatio;
    }
    
    // Apply transition when enabled
    if (transitionEnabled) {
      styles.transition = 'filter 0.3s ease-out';
      styles.filter = isLoaded ? 'blur(0)' : 'blur(10px)';
    }
    
    if (rounded) {
      styles.borderRadius = '50%';
    }
    
    return styles;
  };

  // Choose appropriate loading attribute based on strategy
  const getLoadingAttribute = () => {
    switch (loadingStrategy) {
      case 'eager': return 'eager';
      case 'lazy': return 'lazy';
      default: return null; // 'progressive' uses our custom approach
    }
  };

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={getClassNames()}
      style={getStyles()}
      width={width}
      height={height}
      loading={getLoadingAttribute()}
      {...otherProps}
    />
  );
};

OptimizedImage.propTypes = {
  // Essential props
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  
  // Dimension props
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  aspectRatio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  
  // Appearance props
  className: PropTypes.string,
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  objectPosition: PropTypes.string,
  placeholderColor: PropTypes.string,
  rounded: PropTypes.bool,
  
  // Optimization props
  placeholder: PropTypes.string,
  fallback: PropTypes.string,
  lazy: PropTypes.bool,
  threshold: PropTypes.number,
  rootMargin: PropTypes.string,
  loadingStrategy: PropTypes.oneOf(['progressive', 'eager', 'lazy']),
  quality: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
  trackPerformance: PropTypes.bool,
  
  // Event handlers
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

// Export memoized version for better performance
export default memoWithOptions(OptimizedImage, {
  componentName: 'OptimizedImage',
});

// Export non-memoized version for contexts where memoization would be problematic
export { OptimizedImage as OptimizedImagePure };
