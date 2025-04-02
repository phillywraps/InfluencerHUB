/**
 * Enhanced Form components for the design system
 * 
 * A collection of form components including FormControl, TextField, Select,
 * Checkbox, Radio, and FormActions with consistent styling, validation,
 * and accessibility features.
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormControl as MuiFormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  InputLabel,
  OutlinedInput,
  TextField as MuiTextField,
  Select as MuiSelect,
  MenuItem,
  Checkbox as MuiCheckbox,
  Radio as MuiRadio,
  RadioGroup as MuiRadioGroup,
  Switch as MuiSwitch,
  InputAdornment,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled FormControl with consistent spacing, layout, and accessibility focus states
const StyledFormControl = styled(MuiFormControl)(({ theme, fullWidth }) => ({
  margin: theme.spacing(1, 0),
  width: fullWidth ? '100%' : 'auto',
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius / 2,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: 2,
  },
  '& .MuiFormLabel-root.Mui-focused': {
    fontWeight: 500,
  },
  // Enhanced focus styles for accessibility
  '& .Mui-focused': {
    outline: 0,
  },
  '& .MuiInputBase-root.Mui-focused': {
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1.5, 2),
  },
  // Better error state visualization
  '& .Mui-error .MuiOutlinedInput-notchedOutline': {
    borderWidth: 2,
  },
  '& .MuiFormHelperText-root.Mui-error': {
    fontWeight: 500,
  },
}));

// Styled Form Actions container for buttons
const FormActions = styled(Box)(({ theme, align }) => ({
  display: 'flex',
  justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'space-between',
  marginTop: theme.spacing(3),
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

/**
 * Generate a unique ID for form element connections
 */
const generateUniqueId = (prefix = 'form-field') => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Enhanced FormControl component with consistent styling and accessibility features
 * 
 * @param {Object} props
 * @param {node} props.children - Control content
 * @param {string} props.label - Form control label
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the control has an error
 * @param {string} props.errorText - Error message text
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.fullWidth - Whether the control should take full width
 * @param {string} props.size - Size of the control (small, medium, large)
 * @param {string} props.id - ID for the form control
 * @param {string} props.labelId - ID for the form control label
 * @param {string} props.helperId - ID for the helper text
 */
const FormControl = forwardRef(({
  children,
  label,
  helper,
  error = false,
  errorText,
  required = false,
  fullWidth = true,
  size = 'medium',
  id,
  labelId,
  helperId,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId();
  const fieldLabelId = labelId || `${fieldId}-label`;
  const fieldHelperId = helperId || `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  return (
    <StyledFormControl
      error={error}
      required={required}
      fullWidth={fullWidth}
      size={size}
      sx={sx}
      ref={ref}
      id={fieldId}
      aria-describedby={helperText ? fieldHelperId : undefined}
      {...rest}
    >
      {label && (
        <InputLabel id={fieldLabelId} htmlFor={fieldId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </InputLabel>
      )}
      {children}
      {helperText && (
        <FormHelperText id={fieldHelperId}>
          {helperText}
        </FormHelperText>
      )}
    </StyledFormControl>
  );
});

/**
 * Enhanced TextField component with improved accessibility
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorText - Error message text
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.fullWidth - Whether the field should take full width
 * @param {node} props.startAdornment - Element to display at the start of the input
 * @param {node} props.endAdornment - Element to display at the end of the input
 * @param {string} props.id - ID for the form control
 * @param {string} props.ariaLabel - Accessible label (when visual label is not used)
 */
const TextField = forwardRef(({
  label,
  placeholder,
  helper,
  error = false,
  errorText,
  required = false,
  fullWidth = true,
  startAdornment,
  endAdornment,
  size = 'medium',
  id,
  ariaLabel,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId('text-field');
  const fieldHelperId = `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  const inputProps = {
    // If there's no visible label, use aria-label
    ...((!label && ariaLabel) && { 'aria-label': ariaLabel }),
  };
  
  const InputProps = {};
  
  if (startAdornment) {
    InputProps.startAdornment = (
      <InputAdornment position="start">{startAdornment}</InputAdornment>
    );
  }
  
  if (endAdornment) {
    InputProps.endAdornment = (
      <InputAdornment position="end">{endAdornment}</InputAdornment>
    );
  }
  
  return (
    <MuiTextField
      id={fieldId}
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      required={required}
      fullWidth={fullWidth}
      size={size}
      InputProps={Object.keys(InputProps).length > 0 ? InputProps : undefined}
      inputProps={inputProps}
      aria-describedby={helperText ? fieldHelperId : undefined}
      FormHelperTextProps={{ id: fieldHelperId }}
      sx={{
        ...sx,
        '& .MuiInputBase-root.Mui-focused': {
          boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
      ref={ref}
      variant="outlined"
      {...rest}
    />
  );
});

/**
 * Enhanced Select component with improved accessibility
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {Array} props.options - Array of { value, label } objects
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorText - Error message text
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.fullWidth - Whether the field should take full width
 * @param {string} props.id - ID for the select field
 * @param {string} props.ariaLabel - Accessible label when visual label is not used
 */
const Select = forwardRef(({
  label,
  options = [],
  helper,
  error = false,
  errorText,
  required = false,
  fullWidth = true,
  children,
  size = 'medium',
  id,
  ariaLabel,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId('select-field');
  const fieldLabelId = `${fieldId}-label`;
  const fieldHelperId = `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  return (
    <StyledFormControl 
      error={error} 
      required={required} 
      fullWidth={fullWidth}
      size={size}
      sx={sx}
      id={fieldId}
    >
      {label && (
        <InputLabel id={fieldLabelId} htmlFor={fieldId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </InputLabel>
      )}
      <MuiSelect
        labelId={fieldLabelId}
        id={fieldId}
        label={label}
        ref={ref}
        aria-describedby={helperText ? fieldHelperId : undefined}
        input={<OutlinedInput label={label} />}
        // If there's no visible label, use aria-label
        {...(!label && ariaLabel && { 'aria-label': ariaLabel })}
        {...rest}
      >
        {children || options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && (
        <FormHelperText id={fieldHelperId}>
          {helperText}
        </FormHelperText>
      )}
    </StyledFormControl>
  );
});

/**
 * Enhanced Checkbox component with improved accessibility
 * 
 * @param {Object} props
 * @param {string} props.label - Checkbox label
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorText - Error message text
 * @param {boolean} props.indeterminate - Whether the checkbox is in indeterminate state
 * @param {string} props.id - ID for the checkbox field
 * @param {string} props.ariaLabel - Accessible label when visual label is not used
 */
const Checkbox = forwardRef(({
  label,
  helper,
  error = false,
  errorText,
  indeterminate = false,
  size = 'medium',
  id,
  ariaLabel,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId('checkbox');
  const fieldHelperId = `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <MuiCheckbox
            id={fieldId}
            ref={ref}
            indeterminate={indeterminate}
            size={size}
            inputProps={{
              'aria-describedby': helperText ? fieldHelperId : undefined,
              // If there's no visible label, use aria-label
              ...((!label && ariaLabel) && { 'aria-label': ariaLabel }),
            }}
            sx={{
              '&.Mui-focusVisible': {
                outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
            {...rest}
          />
        }
        label={label}
        htmlFor={fieldId}
      />
      {helperText && (
        <FormHelperText id={fieldHelperId} error={error}>
          {helperText}
        </FormHelperText>
      )}
    </FormGroup>
  );
});

/**
 * Enhanced RadioGroup component with improved accessibility
 * 
 * @param {Object} props
 * @param {string} props.label - Radio group label
 * @param {Array} props.options - Array of { value, label } objects
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorText - Error message text
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.row - Whether to display radio buttons in a row
 * @param {string} props.id - ID for the radio group
 * @param {string} props.ariaLabel - Accessible label when visual label is not used
 */
const RadioGroup = forwardRef(({
  label,
  options = [],
  helper,
  error = false,
  errorText,
  required = false,
  row = false,
  size = 'medium',
  id,
  ariaLabel,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId('radio-group');
  const fieldLabelId = `${fieldId}-label`;
  const fieldHelperId = `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  return (
    <FormControl 
      component="fieldset" 
      error={error} 
      required={required} 
      sx={sx}
      id={fieldId}
    >
      {label && (
        <FormLabel 
          component="legend" 
          id={fieldLabelId}
          // Explicitly identify this as the group label for screen readers
          aria-role="group"
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </FormLabel>
      )}
      <MuiRadioGroup 
        row={row} 
        ref={ref}
        aria-labelledby={label ? fieldLabelId : undefined}
        // If there's no visible label, use aria-label
        {...(!label && ariaLabel && { 'aria-label': ariaLabel })}
        {...rest}
      >
        {options.map((option, index) => {
          const radioId = `${fieldId}-option-${index}`;
          return (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <MuiRadio 
                  id={radioId}
                  size={size}
                  sx={{
                    '&.Mui-focusVisible': {
                      outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: '2px',
                    },
                  }}
                />
              }
              label={option.label}
              htmlFor={radioId}
            />
          );
        })}
      </MuiRadioGroup>
      {helperText && (
        <FormHelperText id={fieldHelperId}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

/**
 * Enhanced Switch component with improved accessibility
 * 
 * @param {Object} props
 * @param {string} props.label - Switch label
 * @param {string} props.helper - Helper text
 * @param {boolean} props.error - Whether the field has an error
 * @param {string} props.errorText - Error message text
 * @param {string} props.id - ID for the switch
 * @param {string} props.ariaLabel - Accessible label when visual label is not used
 */
const Switch = forwardRef(({
  label,
  helper,
  error = false,
  errorText,
  size = 'medium',
  id,
  ariaLabel,
  sx = {},
  ...rest
}, ref) => {
  // Generate IDs for accessibility if not provided
  const fieldId = id || generateUniqueId('switch');
  const fieldHelperId = `${fieldId}-helper`;
  
  // Determine helper text - use errorText when in error state if provided
  const helperText = error && errorText ? errorText : helper;
  
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <MuiSwitch
            id={fieldId}
            ref={ref}
            size={size}
            inputProps={{
              'aria-describedby': helperText ? fieldHelperId : undefined,
              // If there's no visible label, use aria-label
              ...((!label && ariaLabel) && { 'aria-label': ariaLabel }),
            }}
            sx={{
              '&.Mui-focusVisible': {
                outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
            {...rest}
          />
        }
        label={label}
        htmlFor={fieldId}
      />
      {helperText && (
        <FormHelperText id={fieldHelperId} error={error}>
          {helperText}
        </FormHelperText>
      )}
    </FormGroup>
  );
});

// PropTypes
FormControl.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  labelId: PropTypes.string,
  helperId: PropTypes.string,
  sx: PropTypes.object,
};

TextField.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  sx: PropTypes.object,
};

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
    })
  ),
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  sx: PropTypes.object,
};

Checkbox.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  indeterminate: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  sx: PropTypes.object,
};

RadioGroup.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
    })
  ),
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  required: PropTypes.bool,
  row: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  sx: PropTypes.object,
};

Switch.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium']),
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  sx: PropTypes.object,
};

FormControl.displayName = 'FormControl';
TextField.displayName = 'TextField';
Select.displayName = 'Select';
Checkbox.displayName = 'Checkbox';
RadioGroup.displayName = 'RadioGroup';
Switch.displayName = 'Switch';

export {
  FormControl,
  TextField,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  FormActions,
};

export default {
  FormControl,
  TextField,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  FormActions,
};
