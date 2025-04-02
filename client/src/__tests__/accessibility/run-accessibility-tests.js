#!/usr/bin/env node

/**
 * Accessibility Tests Runner
 * 
 * This script runs all accessibility tests for the application.
 * It provides reporting about which components are accessibility-compliant
 * and which ones need improvement.
 */

const jest = require('jest');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Use the dedicated Jest config file for accessibility tests
const configPath = path.resolve(process.cwd(), 'jest.accessibility.config.js');
const CONFIG = require(configPath);

// Create a custom reporter to highlight accessibility issues
class AccessibilityReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.results = {
      passed: [],
      failed: [],
      components: {}
    };
  }

  onRunComplete(contexts, results) {
    console.log('\n');
    console.log(chalk.cyan.bold('=== Accessibility Test Results ==='));
    console.log('\n');

    // Collect test results by component
    results.testResults.forEach(testFile => {
      const relativePath = path.relative(process.cwd(), testFile.testFilePath);
      
      // Extract component name from file path
      let componentName = path.basename(testFile.testFilePath, '.test.js');
      componentName = componentName.replace('.a11y', '');
      
      if (!this.results.components[componentName]) {
        this.results.components[componentName] = {
          passed: 0,
          failed: 0,
          total: 0,
          errorMessages: []
        };
      }
      
      testFile.testResults.forEach(test => {
        this.results.components[componentName].total++;
        
        if (test.status === 'passed') {
          this.results.components[componentName].passed++;
          this.results.passed.push(`${componentName}: ${test.title}`);
        } else {
          this.results.components[componentName].failed++;
          this.results.failed.push(`${componentName}: ${test.title}`);
          
          // Collect error messages
          if (test.failureMessages && test.failureMessages.length > 0) {
            test.failureMessages.forEach(msg => {
              const cleanMsg = msg
                .replace(/\x1b\[\d+m/g, '') // Remove ANSI color codes
                .split('\n')
                .slice(0, 3) // Just take the first few lines for brevity
                .join('\n');
              
              this.results.components[componentName].errorMessages.push(
                `${test.title}: ${cleanMsg}`
              );
            });
          }
        }
      });
    });
    
    // Output summary by component
    console.log(chalk.bold('Component Accessibility Status:'));
    console.log('\n');
    
    Object.entries(this.results.components).forEach(([component, stats]) => {
      const passRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
      const color = passRate === 100 ? 'green' : 
                   passRate >= 80 ? 'yellow' : 'red';
      
      console.log(chalk[color](`${component}: ${stats.passed}/${stats.total} tests passed (${passRate.toFixed(1)}%)`));
      
      // Show errors for failed tests
      if (stats.failed > 0) {
        console.log(chalk.red('  Failed tests:'));
        stats.errorMessages.forEach(msg => {
          console.log(chalk.red(`  - ${msg}`));
        });
        console.log('\n');
      }
    });
    
    // Output overall summary
    const totalTests = results.numTotalTests;
    const passedTests = results.numPassedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    console.log('\n');
    console.log(chalk.bold('Overall Accessibility Compliance:'));
    console.log('\n');
    
    const overallColor = passRate === 100 ? 'green' : 
                        passRate >= 80 ? 'yellow' : 'red';
    
    console.log(chalk[overallColor](`${passedTests}/${totalTests} tests passed (${passRate.toFixed(1)}%)`));
    
    // Generate recommendations for failing components
    if (this.results.failed.length > 0) {
      console.log('\n');
      console.log(chalk.bold('Accessibility Improvement Recommendations:'));
      console.log('\n');
      
      // Group failed tests by component
      const componentFailures = {};
      
      this.results.failed.forEach(failure => {
        const [component, ...rest] = failure.split(':');
        if (!componentFailures[component]) {
          componentFailures[component] = [];
        }
        componentFailures[component].push(rest.join(':').trim());
      });
      
      // Output recommendations by component
      Object.entries(componentFailures).forEach(([component, failures]) => {
        console.log(chalk.yellow(`${component}:`));
        
        // Generate automated recommendations based on test names
        failures.forEach(failure => {
          if (failure.includes('keyboard') || failure.includes('focus')) {
            console.log(chalk.yellow(`  - Improve keyboard navigation and focus management`));
          } else if (failure.includes('contrast') || failure.includes('color')) {
            console.log(chalk.yellow(`  - Address color contrast issues for better visibility`));
          } else if (failure.includes('screen reader') || failure.includes('aria')) {
            console.log(chalk.yellow(`  - Enhance screen reader support with proper ARIA attributes`));
          } else if (failure.includes('axe')) {
            console.log(chalk.yellow(`  - Fix WCAG violations detected by axe`));
          } else {
            console.log(chalk.yellow(`  - Review test: ${failure}`));
          }
        });
        
        console.log('\n');
      });
    }
    
    // Save results to file
    try {
      const outputDir = './coverage/accessibility';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outputDir, 'accessibility-report.json'),
        JSON.stringify({
          summary: {
            total: totalTests,
            passed: passedTests,
            failed: results.numFailedTests,
            passRate: passRate
          },
          componentResults: this.results.components,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
      
      console.log(chalk.blue(`Detailed report saved to: ${outputDir}/accessibility-report.json`));
      console.log(chalk.blue(`Coverage report available at: ${outputDir}/index.html`));
    } catch (err) {
      console.error('Error saving report:', err);
    }
  }
}

// Create the reporter file if it doesn't exist
const reporterPath = path.join(process.cwd(), 'src', '__tests__', 'accessibility', 'accessibility-reporter.js');
if (!fs.existsSync(reporterPath)) {
  const dir = path.dirname(reporterPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const reporterContent = `
class AccessibilityReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  onRunComplete(contexts, results) {
    // Implementation is in the main script
    // This file just needs to exist for Jest to load it
  }
}

module.exports = AccessibilityReporter;
`;
  
  fs.writeFileSync(reporterPath, reporterContent);
}

// Run Jest with our custom configuration
console.log(chalk.cyan.bold('Starting Accessibility Tests...'));
console.log(chalk.cyan('Testing both component rendering and utility functions.'));
console.log('\n');

jest.run(['--config', JSON.stringify(CONFIG)]);

// Export the reporter for Jest to use
module.exports = AccessibilityReporter;
