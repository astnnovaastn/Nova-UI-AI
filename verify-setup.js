#!/usr/bin/env node

/**
 * Astra AI React UI - Setup Verification Script
 * Checks that all components are in place and properly configured
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}`)
};

const uiPath = path.join(__dirname, 'astra_ai', 'ui');
const srcPath = path.join(uiPath, 'src');

let checksPassed = 0;
let checksFailed = 0;

const fileExists = (filePath) => fs.existsSync(filePath);
const fileContains = (filePath, text) => {
  try {
    return fs.readFileSync(filePath, 'utf8').includes(text);
  } catch {
    return false;
  }
};

log.header('Astra AI React UI - Setup Verification');

// Check 1: Root files
log.header('1. Root Configuration Files');

const rootFiles = [
  'astra_ai/ui/package.json',
  'astra_ai/ui/.gitignore',
  'astra_ai/ui/public/index.html'
];

rootFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fileExists(fullPath)) {
    log.success(file);
    checksPassed++;
  } else {
    log.error(`Missing: ${file}`);
    checksFailed++;
  }
});

// Check 2: Source files
log.header('2. Source Files');

const sourceFiles = [
  'astra_ai/ui/src/index.jsx',
  'astra_ai/ui/src/index.css',
  'astra_ai/ui/src/App.jsx',
  'astra_ai/ui/src/App.css'
];

sourceFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fileExists(fullPath)) {
    log.success(file);
    checksPassed++;
  } else {
    log.error(`Missing: ${file}`);
    checksFailed++;
  }
});

// Check 3: Components
log.header('3. Widget Components');

const components = [
  { name: 'NovaCore', path: 'astra_ai/ui/src/components/NovaCore' },
  { name: 'Chat', path: 'astra_ai/ui/src/components/Chat' },
  { name: 'Search', path: 'astra_ai/ui/src/components/Search' },
  { name: 'News', path: 'astra_ai/ui/src/components/News' },
  { name: 'Notepad', path: 'astra_ai/ui/src/components/Notepad' },
  { name: 'TicTacToe', path: 'astra_ai/ui/src/components/TicTacToe' },
  { name: 'Camera', path: 'astra_ai/ui/src/components/Camera' },
  { name: 'Calculator', path: 'astra_ai/ui/src/components/Calculator' },
  { name: 'ObjectIdentification', path: 'astra_ai/ui/src/components/ObjectIdentification' },
  { name: 'Task', path: 'astra_ai/ui/src/components/Task' },
  { name: 'AIEye', path: 'astra_ai/ui/src/components/AIEye' }
];

components.forEach(comp => {
  const compPath = path.join(__dirname, comp.path);
  const jsxFile = path.join(compPath, `${comp.name}Widget.jsx`);
  const cssFile = path.join(compPath, `${comp.name}Widget.css`);
  
  const jsxExists = fileExists(jsxFile);
  const cssExists = fileExists(cssFile);
  
  if (jsxExists && cssExists) {
    log.success(`${comp.name} Widget (JSX + CSS)`);
    checksPassed++;
  } else if (jsxExists) {
    log.warn(`${comp.name} Widget (JSX only, missing CSS)`);
    checksFailed++;
  } else {
    log.error(`${comp.name} Widget (Missing JSX)`);
    checksFailed++;
  }
});

// Check 4: Dependencies
log.header('4. Package.json Dependencies');

const packageJsonPath = path.join(__dirname, 'astra_ai', 'ui', 'package.json');

if (fileExists(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['react', 'react-dom', 'framer-motion', 'zustand', 'axios'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log.success(`${dep} (${packageJson.dependencies[dep]})`);
        checksPassed++;
      } else {
        log.error(`Missing: ${dep}`);
        checksFailed++;
      }
    });
  } catch (error) {
    log.error('Could not parse package.json');
    checksFailed++;
  }
} else {
  log.error('package.json not found');
  checksFailed++;
}

// Check 5: CSS Variables
log.header('5. CSS Variables & Theme');

const appCssPath = path.join(__dirname, 'astra_ai', 'ui', 'src', 'App.css');

if (fileExists(appCssPath)) {
  const appCss = fs.readFileSync(appCssPath, 'utf8');
  const cssVars = [
    '--primary-cyan',
    '--primary-orange',
    '--primary-green',
    '--primary-purple',
    '--bg-dark',
    '--bg-darker',
    '--bg-darkest'
  ];
  
  cssVars.forEach(cssVar => {
    if (appCss.includes(cssVar)) {
      log.success(`${cssVar} defined`);
      checksPassed++;
    } else {
      log.warn(`${cssVar} not found`);
      checksFailed++;
    }
  });
}

// Check 6: Animations
log.header('6. Framer Motion Imports');

const appJsxPath = path.join(__dirname, 'astra_ai', 'ui', 'src', 'App.jsx');

if (fileExists(appJsxPath)) {
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');
  
  const expectedImports = [
    { pattern: /import.*React.*from 'react'/, name: 'React' },
    { pattern: /import.*App\.css/, name: 'App.css' },
    { pattern: /NovaCore.*from.*NovaCore/, name: 'NovaCore component' }
  ];
  
  expectedImports.forEach(imp => {
    if (imp.pattern.test(appJsx)) {
      log.success(`${imp.name} imported`);
      checksPassed++;
    } else {
      log.error(`${imp.name} import missing`);
      checksFailed++;
    }
  });
}

// Check 7: Documentation
log.header('7. Documentation Files');

const docs = [
  'QUICK_START_REACT.md',
  'WIDGET_IMPLEMENTATION_GUIDE.md',
  'astra_ai/ui/README.md'
];

docs.forEach(doc => {
  const fullPath = path.join(__dirname, doc);
  if (fileExists(fullPath)) {
    log.success(doc);
    checksPassed++;
  } else {
    log.warn(`Optional: ${doc}`);
  }
});

// Check 8: Node modules
log.header('8. Dependencies Installation');

const nodeModulesPath = path.join(__dirname, 'astra_ai', 'ui', 'node_modules');
if (fileExists(nodeModulesPath)) {
  log.success('node_modules directory exists');
  checksPassed++;
} else {
  log.warn('node_modules not installed. Run: npm install');
}

// Summary
log.header('Verification Summary');

console.log(`
${colors.green}Passed:${colors.reset} ${checksPassed}
${colors.red}Failed:${colors.reset} ${checksFailed}
${colors.cyan}Total:${colors.reset} ${checksPassed + checksFailed}
`);

if (checksFailed === 0) {
  log.success('All checks passed! Your React UI is ready.');
  console.log(`
${colors.cyan}Next steps:${colors.reset}
1. Navigate to the UI folder: cd astra_ai/ui
2. Install dependencies: npm install
3. Start development server: npm start
4. Open http://localhost:3000 in your browser
  `);
} else {
  log.warn(`${checksFailed} check(s) failed. Please review the items above.`);
  console.log(`
${colors.cyan}Common fixes:${colors.reset}
- Make sure you're running this script from the project root
- Check that all component files are created
- Verify package.json exists and is valid
- Run: npm install (if node_modules is missing)
  `);
}

process.exit(checksFailed > 0 ? 1 : 0);
