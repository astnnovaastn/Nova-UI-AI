#!/usr/bin/env node
/**
 * Astra AI React - Complete Setup Verification
 * Checks all components and dependencies are ready
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const symbols = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  arrow: '→',
  check: '✓',
  cross: '✗'
};

let testsPassed = 0;
let testsFailed = 0;
let testsWarning = 0;

const log = {
  success: (msg) => console.log(`${colors.green}${symbols.success}${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}${symbols.error}${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}${symbols.warning}${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}${symbols.info}${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  normal: (msg) => console.log(msg),
};

const fileExists = (filePath) => fs.existsSync(filePath);
const fileSize = (filePath) => fs.statSync(filePath).size;

// Start verification
console.clear();
console.log(`\n${colors.bright}${colors.magenta}`);
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     ASTRA AI REACT - COMPLETE SETUP VERIFICATION          ║');
console.log('║                                                           ║');
console.log('║     Checking that all components are ready to run        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`${colors.reset}`);

const uiPath = path.join(__dirname, 'astra_ai', 'ui');
const srcPath = path.join(uiPath, 'src');
const componentPath = path.join(srcPath, 'components');

// ============ SECTION 1: PROJECT STRUCTURE ============
log.header('1️⃣  PROJECT STRUCTURE');

const requiredDirs = [
  { path: uiPath, name: 'UI Root' },
  { path: srcPath, name: 'Source (src)' },
  { path: componentPath, name: 'Components' },
  { path: path.join(uiPath, 'public'), name: 'Public' }
];

requiredDirs.forEach(dir => {
  if (fileExists(dir.path)) {
    log.success(`${dir.name} directory exists`);
    testsPassed++;
  } else {
    log.error(`${dir.name} directory missing: ${dir.path}`);
    testsFailed++;
  }
});

// ============ SECTION 2: ROOT CONFIGURATION FILES ============
log.header('2️⃣  CONFIGURATION FILES');

const rootFiles = [
  { path: path.join(uiPath, 'package.json'), name: 'package.json', critical: true },
  { path: path.join(uiPath, '.gitignore'), name: '.gitignore', critical: false },
  { path: path.join(uiPath, 'README.md'), name: 'README.md', critical: false }
];

rootFiles.forEach(file => {
  if (fileExists(file.path)) {
    const size = fileSize(file.path);
    log.success(`${file.name} (${size} bytes)`);
    testsPassed++;
  } else {
    if (file.critical) {
      log.error(`${file.name} is CRITICAL - missing!`);
      testsFailed++;
    } else {
      log.warn(`${file.name} is optional - missing`);
      testsWarning++;
    }
  }
});

// ============ SECTION 3: REACT ENTRY POINTS ============
log.header('3️⃣  REACT ENTRY POINTS');

const entryPoints = [
  { path: path.join(uiPath, 'public', 'index.html'), name: 'index.html' },
  { path: path.join(srcPath, 'index.jsx'), name: 'src/index.jsx' },
  { path: path.join(srcPath, 'index.css'), name: 'src/index.css' }
];

entryPoints.forEach(file => {
  if (fileExists(file.path)) {
    log.success(`${file.name} present`);
    testsPassed++;
  } else {
    log.error(`${file.name} missing!`);
    testsFailed++;
  }
});

// ============ SECTION 4: MAIN APPLICATION ============
log.header('4️⃣  MAIN APPLICATION FILES');

const appFiles = [
  { path: path.join(srcPath, 'App.jsx'), name: 'App.jsx' },
  { path: path.join(srcPath, 'App.css'), name: 'App.css' }
];

appFiles.forEach(file => {
  if (fileExists(file.path)) {
    const content = fs.readFileSync(file.path, 'utf8');
    log.success(`${file.name} (${content.length} bytes)`);
    testsPassed++;
  } else {
    log.error(`${file.name} missing!`);
    testsFailed++;
  }
});

// ============ SECTION 5: WIDGET COMPONENTS ============
log.header('5️⃣  WIDGET COMPONENTS (11 Total)');

const widgets = [
  'NovaCore',
  'Chat',
  'Search',
  'News',
  'Notepad',
  'TicTacToe',
  'Camera',
  'Calculator',
  'ObjectIdentification',
  'Task',
  'AIEye'
];

let widgetsComplete = 0;
widgets.forEach(widget => {
  let folder = widget;
  if (widget === 'Chat') {
    // Chat has 3 files
    const chatFiles = [
      path.join(componentPath, 'Chat', 'ModernChat.jsx'),
      path.join(componentPath, 'Chat', 'ModernChat.css'),
      path.join(componentPath, 'Chat', 'FloatingChatButton.jsx'),
      path.join(componentPath, 'Chat', 'FloatingChatButton.css')
    ];
    const allExist = chatFiles.every(f => fileExists(f));
    if (allExist) {
      log.success(`${widget} (4 files: 2 components, 2 styles)`);
      testsPassed += 4;
      widgetsComplete++;
    } else {
      log.error(`${widget} incomplete`);
      testsFailed++;
    }
  } else {
    const widgetFiles = [
      path.join(componentPath, folder, `${folder}Widget.jsx`),
      path.join(componentPath, folder, `${folder}Widget.css`)
    ];
    const allExist = widgetFiles.every(f => fileExists(f));
    if (allExist) {
      log.success(`${widget} (JSX + CSS)`);
      testsPassed += 2;
      widgetsComplete++;
    } else {
      const jsxExists = fileExists(widgetFiles[0]);
      const cssExists = fileExists(widgetFiles[1]);
      if (jsxExists && !cssExists) {
        log.warn(`${widget} (JSX exists, CSS missing)`);
        testsWarning++;
      } else if (!jsxExists && cssExists) {
        log.warn(`${widget} (CSS exists, JSX missing)`);
        testsWarning++;
      } else {
        log.error(`${widget} (both missing)`);
        testsFailed++;
      }
    }
  }
});

console.log(`\n${colors.cyan}Widgets: ${widgetsComplete}/${widgets.length} complete${colors.reset}`);

// ============ SECTION 6: DEPENDENCIES ============
log.header('6️⃣  DEPENDENCIES');

const packageJsonPath = path.join(uiPath, 'package.json');
if (fileExists(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = {
      'react': '18.2.0',
      'react-dom': '18.2.0',
      'framer-motion': '10.16.4',
      'zustand': '4.4.0',
      'axios': '1.6.0'
    };

    Object.entries(requiredDeps).forEach(([dep, expectedVersion]) => {
      const installed = packageJson.dependencies && packageJson.dependencies[dep];
      if (installed) {
        log.success(`${dep} installed`);
        testsPassed++;
      } else {
        log.error(`${dep} NOT INSTALLED`);
        testsFailed++;
      }
    });

    // Check scripts
    log.section('\n📜 NPM Scripts');
    const requiredScripts = ['start', 'build', 'test'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log.success(`npm ${script} configured`);
        testsPassed++;
      } else {
        log.error(`npm ${script} not configured`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Could not parse package.json: ${error.message}`);
    testsFailed++;
  }
} else {
  log.error('package.json not found!');
  testsFailed++;
}

// ============ SECTION 7: STARTUP SCRIPTS ============
log.header('7️⃣  STARTUP SCRIPTS');

const startupScripts = [
  { path: path.join(uiPath, 'start.bat'), name: 'start.bat (Windows)' },
  { path: path.join(uiPath, 'start.ps1'), name: 'start.ps1 (PowerShell)' },
  { path: path.join(uiPath, 'start.sh'), name: 'start.sh (Bash)' }
];

startupScripts.forEach(script => {
  if (fileExists(script.path)) {
    log.success(`${script.name} available`);
    testsPassed++;
  } else {
    log.warn(`${script.name} missing (optional)`);
    testsWarning++;
  }
});

// ============ SECTION 8: ENVIRONMENT ============
log.header('8️⃣  ENVIRONMENT CONFIGURATION');

const envFiles = [
  { path: path.join(uiPath, '.env'), name: '.env (actual)', required: false },
  { path: path.join(uiPath, '.env.example'), name: '.env.example (template)', required: false }
];

envFiles.forEach(file => {
  if (fileExists(file.path)) {
    log.success(`${file.name} found`);
    testsPassed++;
  } else {
    log.warn(`${file.name} not found`);
    testsWarning++;
  }
});

// ============ SECTION 9: NODE MODULES ============
log.header('9️⃣  INSTALLED PACKAGES');

const nodeModulesPath = path.join(uiPath, 'node_modules');
if (fileExists(nodeModulesPath)) {
  const packageCount = fs.readdirSync(nodeModulesPath).length;
  log.success(`node_modules installed (${packageCount} packages)`);
  testsPassed++;
} else {
  log.warn('node_modules not installed (run: npm install)');
  testsWarning++;
}

// ============ SUMMARY ============
log.header('📊 VERIFICATION SUMMARY');

const total = testsPassed + testsFailed + testsWarning;
const percentage = total > 0 ? Math.round((testsPassed / total) * 100) : 0;

console.log(`
${colors.bright}Test Results:${colors.reset}
  ${colors.green}${symbols.success} Passed:${colors.reset}  ${testsPassed}
  ${colors.yellow}${symbols.warning} Warning:${colors.reset} ${testsWarning}
  ${colors.red}${symbols.error} Failed:${colors.reset}  ${testsFailed}
  ${colors.cyan}━━━━━━━━━${colors.reset}
  ${colors.bright}Total:${colors.reset}   ${total}

${colors.bright}Success Rate: ${percentage}%${colors.reset}
`);

// ============ RECOMMENDATIONS ============
if (testsFailed === 0 && testsWarning === 0) {
  log.section(`\n🎉 ALL CHECKS PASSED! Ready to run!\n`);
  console.log(`${colors.bright}${colors.green}Next steps:${colors.reset}`);
  console.log(`
  1. Navigate to the UI folder:
     cd astra_ai/ui

  2. Run the startup script:
     ${colors.cyan}Windows:  start.bat${colors.reset}
     ${colors.cyan}PowerShell: .\\start.ps1${colors.reset}
     ${colors.cyan}Mac/Linux:  ./start.sh${colors.reset}

  3. Or use npm directly:
     ${colors.cyan}npm start${colors.reset}

  4. Browser opens at ${colors.cyan}http://localhost:3000${colors.reset}
`);
} else if (testsFailed > 0) {
  log.section(`\n⚠️  ISSUES FOUND - Please fix before running\n`);
  console.log(`${colors.yellow}Critical issues: ${testsFailed}${colors.reset}\n`);
  console.log('Run this command to fix:');
  console.log(`  ${colors.cyan}cd astra_ai/ui && npm install${colors.reset}\n`);
} else if (testsWarning > 0) {
  log.section(`\n✅ READY TO RUN (with optional items missing)\n`);
  console.log(`You can start right now:
  ${colors.cyan}cd astra_ai/ui && npm start${colors.reset}\n`);
}

process.exit(testsFailed > 0 ? 1 : 0);
