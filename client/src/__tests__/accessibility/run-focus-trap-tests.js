#!/usr/bin/env node

/**
 * Focus Trap and Form Accessibility Tests Runner
 * 
 * This script runs the accessibility tests for our newly implemented focus trap
 * and form accessibility enhancements.
 */

const jest = require('jest');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  testMatch: [
    '**/client/src/__tests__/accessibility/components/ThemeSwitcher.a11y.test.js',
    '**/client/src/__tests__/accessibility/components/RealTimeAnalyticsDashboard.a11y.test.js',
    '**/client/src/__tests__/accessibility/components/ProfileUpdateExample.a11y.test.js'
  ],
  setupFilesAfterEnv: [
    'jest-axe/extend-expect'
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: './coverage/accessibility/focus-trap',
  coverageReporters: ['text', 'html', 'json-summary'],
  testEnvironment: 'jsdom',
};

// Banner display
console.log('\n');
console.log(chalk.cyan.bold('================================================'));
console.log(chalk.cyan.bold('=                                              ='));
console.log(chalk.cyan.bold('=       FOCUS TRAP & FORM ACCESSIBILITY        ='));
console.log(chalk.cyan.bold('=              TESTING SUITE                   ='));
console.log(chalk.cyan.bold('=                                              ='));
console.log(chalk.cyan.bold('================================================'));
console.log('\n');

console.log(chalk.white('This test suite validates our latest accessibility improvements:'));
console.log(chalk.white('1. Focus trap implementation in menus and dialogs'));
console.log(chalk.white('2. Enhanced keyboard navigation and focus management'));
console.log(chalk.white('3. Screen reader announcements for state changes'));
console.log(chalk.white('4. Improved ARIA attributes for interactive elements'));
console.log(chalk.white('5. Accessible form validation with error summaries'));
console.log('\n');

console.log(chalk.yellow('Running tests for the following components:'));
console.log(chalk.yellow('- ThemeSwitcher'));
console.log(chalk.yellow('- RealTimeAnalyticsDashboard'));
console.log(chalk.yellow('- ProfileUpdateExample'));
console.log('\n');

// Run Jest with our custom configuration
jest.run(['--config', JSON.stringify(CONFIG)])
  .then(() => {
    console.log('\n');
    console.log(chalk.green.bold('✓ Focus trap and form accessibility tests completed'));
    console.log(chalk.green('Results saved to: ./coverage/accessibility/focus-trap/'));
    console.log('\n');
  })
  .catch(error => {
    console.error(chalk.red('Error running tests:'), error);
    process.exit(1);
  });
