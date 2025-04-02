/**
 * PageLayout component for consistent page layouts with enhanced accessibility
 * 
 * This component provides consistent spacing, responsive layouts,
 * and common elements like page titles, breadcrumbs, and actions
 * while ensuring proper accessibility for all users.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  Paper,
  Divider,
  useMediaQuery,
  VisuallyHidden,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Skip to content link for keyboard users
const SkipLink = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: 0,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  zIndex: 2000,
  transition: 'top 0.2s ease-in-out',
  textDecoration: 'none',
  borderRadius: '0 0 4px 0',
  '&:focus': {
    top: 0,
  },
}));

// Styled PageContainer for consistent spacing
const PageContainer = styled(Box)(({ theme, maxWidth, withPaper }) => ({
  width: '100%',
  maxWidth: maxWidth === 'full' ? '100%' : theme.breakpoints.values[maxWidth],
  margin: '0 auto',
  padding: theme.spacing(
    withPaper ? 0 : 3,
    2,
    withPaper ? 0 : 5,
    2
  ),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(
      withPaper ? 0 : 3,
      3,
      withPaper ? 0 : 5,
      3
    ),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(
      withPaper ? 0 : 4,
      4,
      withPaper ? 0 : 6,
      4
    ),
  },
}));

// Styled PageHeader for consistent header formatting
const PageHeader = styled('header')(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    marginBottom: theme.spacing(4),
  },
}));

// Styled Breadcrumbs with consistent styling
const Breadcrumbs = styled(MuiBreadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '& .MuiBreadcrumbs-separator': {
    margin: theme.spacing(0, 1),
  },
}));

// Styled ContentWrapper for consistent content spacing
const ContentWrapper = styled('main')(({ theme, withPaper }) => ({
  ...(!withPaper && {
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(3),
      [theme.breakpoints.up('md')]: {
        marginBottom: theme.spacing(4),
      },
    },
  }),
}));

// Styled PaperWrapper for paper-based layout
const PaperWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
}));

/**
 * PageLayout component for consistent page layouts with enhanced accessibility
 * 
 * @param {Object} props
 * @param {node} props.children - Page content
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {node} props.actions - Header actions (buttons, etc.)
 * @param {Array} props.breadcrumbs - Breadcrumb items [{label, path}]
 * @param {string} props.maxWidth - Max width of the page ('xs'|'sm'|'md'|'lg'|'xl'|'full')
 * @param {boolean} props.withPaper - Whether to wrap content in a Paper component
 * @param {boolean} props.withContainer - Whether to wrap with responsive container
 * @param {boolean} props.withSpacing - Whether to apply spacing to child components
 * @param {string} props.mainId - ID for the main content area (for skip links)
 * @param {string} props.pageRole - ARIA role for the page container
 * @param {string} props.pageLabel - Accessible label for the page
 * @param {Object} props.sx - Additional MUI sx styles
 */
const PageLayout = ({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs = [],
  maxWidth = 'lg',
  withPaper = false,
  withContainer = true,
  withSpacing = true,
  mainId = 'main-content',
  pageRole,
  pageLabel,
  sx = {},
}) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const content = withSpacing ? (
    <ContentWrapper 
      withPaper={withPaper} 
      id={mainId}
      tabIndex={-1} // Makes it focusable by the skip link without entering tab order
      role="region"
      aria-label={pageLabel || title || "Main content"}
    >
      {children}
    </ContentWrapper>
  ) : (
    <main 
      id={mainId}
      tabIndex={-1}
      role="region"
      aria-label={pageLabel || title || "Main content"}
    >
      {children}
    </main>
  );

  const pageContent = (
    <>
      {/* Skip Link for keyboard users */}
      <SkipLink href={`#${mainId}`}>
        Skip to main content
      </SkipLink>
      
      {/* Page Header */}
      {(title || breadcrumbs.length > 0) && (
        <PageHeader>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb navigation">
              <Breadcrumbs aria-label="breadcrumb navigation">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  
                  return isLast ? (
                    <Typography 
                      key={crumb.label} 
                      color="text.primary" 
                      variant="body2"
                      aria-current="page"
                    >
                      {crumb.label}
                    </Typography>
                  ) : (
                    <MuiLink
                      key={crumb.label}
                      component={RouterLink}
                      to={crumb.path}
                      underline="hover"
                      color="inherit"
                      variant="body2"
                      aria-label={`Go to ${crumb.label}`}
                    >
                      {crumb.label}
                    </MuiLink>
                  );
                })}
              </Breadcrumbs>
            </nav>
          )}
          
          {/* Title and Actions */}
          {title && (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
              role="banner"
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom={!!subtitle} id={`${mainId}-heading`}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="subtitle1" color="text.secondary" id={`${mainId}-subheading`}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {actions && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: isMobile ? 1 : 0,
                    alignSelf: isMobile ? 'flex-end' : 'center',
                  }}
                  role="toolbar"
                  aria-label="Page actions"
                >
                  {actions}
                </Box>
              )}
            </Box>
          )}
          
          {withPaper && <Divider sx={{ mt: 3 }} />}
        </PageHeader>
      )}
      
      {/* Page Content */}
      {withPaper ? <PaperWrapper>{content}</PaperWrapper> : content}
    </>
  );

  // With or without container
  return withContainer ? (
    <PageContainer 
      maxWidth={maxWidth} 
      withPaper={withPaper} 
      sx={sx}
      role={pageRole}
      aria-labelledby={title ? `${mainId}-heading` : undefined}
    >
      {pageContent}
    </PageContainer>
  ) : (
    <Box 
      role={pageRole}
      aria-labelledby={title ? `${mainId}-heading` : undefined}
    >
      {pageContent}
    </Box>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ),
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'full']),
  withPaper: PropTypes.bool,
  withContainer: PropTypes.bool,
  withSpacing: PropTypes.bool,
  mainId: PropTypes.string,
  pageRole: PropTypes.string,
  pageLabel: PropTypes.string,
  sx: PropTypes.object,
};

export default PageLayout;
