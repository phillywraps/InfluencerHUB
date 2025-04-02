import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

/**
 * A HOC (Higher Order Component) that provides router props to a component.
 * This is a workaround for class components to access router in React Router v6
 * since withRouter was removed in this version.
 * 
 * @param {React.Component} Component - The component to wrap
 * @returns {React.FunctionComponent} - Wrapped component with router props
 */
export const withRouter = (Component) => {
  const WithRouterWrapper = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    
    return (
      <Component
        {...props}
        navigate={navigate}
        location={location}
        params={params}
      />
    );
  };
  
  // Set display name for debugging purposes
  const displayName = Component.displayName || Component.name || 'Component';
  WithRouterWrapper.displayName = `withRouter(${displayName})`;
  
  return WithRouterWrapper;
};
