import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const appName = args[0];
const platforms = args.slice(1);

// Validate app name
if (!appName) {
  console.error('❌ Error: App name is required');
  console.error('Usage: pnpm create-app <app-name> [platform1] [platform2] ...');
  console.error('Platforms: desktop, mobile (default: both)');
  process.exit(1);
}

// Determine which platforms to create
let platformsToCreate = ['desktop', 'mobile'];
if (platforms.length > 0) {
  const validPlatforms = ['desktop', 'mobile'];
  const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p));

  if (invalidPlatforms.length > 0) {
    console.error(`❌ Error: Invalid platform(s): ${invalidPlatforms.join(', ')}`);
    console.error('Valid platforms: desktop, mobile');
    process.exit(1);
  }

  platformsToCreate = platforms;
}

// Create app directory
const appsDir = path.join(__dirname, '..', 'src', 'apps');
const appDir = path.join(appsDir, appName);

if (fs.existsSync(appDir)) {
  console.error(`❌ Error: App "${appName}" already exists at ${appDir}`);
  process.exit(1);
}

console.log(`📦 Creating app: ${appName}`);
console.log(`📱 Platforms: ${platformsToCreate.join(', ')}`);

// Helper function to create directory
function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper function to write file
function writeFile(filePath, content) {
  createDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Created: ${path.relative(appsDir, filePath)}`);
}

// Create directories
createDir(appDir);
createDir(path.join(appDir, 'shared'));
createDir(path.join(appDir, 'test'));

platformsToCreate.forEach((platform) => {
  createDir(path.join(appDir, platform));
});

// Create Provider.tsx
const providerContent = `import { createContext, ReactNode } from 'react';

const ${appName}Context = createContext({});

export function Provider({ children }: { children: ReactNode }) {
  const value = {};

  return <${appName}Context.Provider value={value}>{children}</${appName}Context.Provider>;
}
`;
writeFile(path.join(appDir, 'shared', 'Provider.tsx'), providerContent);

// Create platform-specific files
platformsToCreate.forEach((platform) => {
  // Sidebar
  const sidebarContent = `export function Sidebar() {
  return <div>${appName} ${platform} sidebar</div>;
}
`;
  writeFile(path.join(appDir, platform, 'Sidebar.tsx'), sidebarContent);

  // Workspace
  const workspaceContent = `export function Workspace() {
  return <div>${appName} ${platform} workspace</div>;
}
`;
  writeFile(path.join(appDir, platform, 'Workspace.tsx'), workspaceContent);
});

// Create index.tsx with dynamic imports
const platformImports = platformsToCreate
  .map(
    (platform) =>
      `import { Sidebar as ${platform}Sidebar } from './${platform}/Sidebar.tsx';\nimport { Workspace as ${platform}Workspace } from './${platform}/Workspace.tsx';`,
  )
  .join('\n');

const platformExports = platformsToCreate
  .map((platform) => `  Sidebar: ${platform}Sidebar,\n  Workspace: ${platform}Workspace,`)
  .join('\n');

const indexContent = `import { App } from '@/apps/types';

${platformImports}
import { Provider } from './shared/Provider.tsx';

export const ${appName}: App = {
  name: '${appName}',
${platformExports}
  Provider,
};
`;
writeFile(path.join(appDir, 'index.tsx'), indexContent);

// Create test directory file
const testContent = `// Add tests for ${appName} app here
`;
writeFile(path.join(appDir, 'test', `.gitkeep`), testContent);

console.log(`\n✨ App "${appName}" created successfully!`);
console.log(`\n📂 App structure:`);
console.log(`   ${appName}/`);
console.log(`   ├── shared/`);
console.log(`   │   └── Provider.tsx`);
platformsToCreate.forEach((platform, index) => {
  const isLast = index === platformsToCreate.length - 1;
  console.log(`   ${isLast ? '└──' : '├──'} ${platform}/`);
  console.log(`   ${isLast ? '    ' : '│   '} ├── Sidebar.tsx`);
  console.log(`   ${isLast ? '    ' : '│   '} └── Workspace.tsx`);
});
console.log(`   ├── test/`);
console.log(`   │   └── .gitkeep`);
console.log(`   └── index.tsx`);
console.log(
  `\n📝 Next steps:\n   1. Import the app in src/apps/index.ts\n   2. Register it in your app registry\n`,
);
