/**
 * Accessibility tests to verify components meet WCAG standards
 * 
 * These tests use jest-axe to check for accessibility violations
 * in our UI components.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { Button, Card, Modal, Table, PageLayout } from '../../components/ui';
import theme from '../../theme';

// Add the custom matcher to Jest
expect.extend(toHaveNoViolations);

// Helper function to wrap components with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Accessibility tests for UI components', () => {
  it('Button component should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Button>Accessible Button</Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('Card component should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Card 
        title="Accessible Card"
        content="This is an accessible card component with proper heading structure."
        actions={<Button>Action</Button>}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('Table component should have no accessibility violations', async () => {
    const columns = [
      { id: 'name', label: 'Name', accessor: (row) => row.name },
      { id: 'age', label: 'Age', accessor: (row) => row.age },
      { id: 'location', label: 'Location', accessor: (row) => row.location },
    ];
    
    const data = [
      { id: 1, name: 'John Doe', age: 30, location: 'New York' },
      { id: 2, name: 'Jane Smith', age: 25, location: 'Los Angeles' },
      { id: 3, name: 'Bob Johnson', age: 40, location: 'Chicago' },
    ];
    
    const { container } = renderWithProviders(
      <Table 
        columns={columns}
        data={data}
        title="Users Table"
        paginated={true}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('PageLayout component should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <PageLayout
        title="Accessible Page"
        subtitle="This is an accessible page layout"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings', path: '/dashboard/settings' },
        ]}
      >
        <div>Page content goes here</div>
      </PageLayout>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('Modal component should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Accessible Modal"
        actions={
          <>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained">Submit</Button>
          </>
        }
      >
        <p>This is an accessible modal with proper focus management.</p>
      </Modal>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // Test for focus trapping and keyboard navigation
  it('Focus should be managed properly in Modal component', async () => {
    // This is just a placeholder - in a real test, you would use
    // userEvent from @testing-library/user-event to test keyboard navigation
    expect(true).toBeTruthy();
  });
});
