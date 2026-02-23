# .NoblSft

Welcome to .NoblSft. This is a software project that aims to provide a comprehensive solution for everything that is both
digital a personal to you. Our goal is to create a platform that allows users to manage their digital lives in a seamless and efficient way. While being hyper secure, free and open source.

## How to contribute ?

### How to create a new application

We provide an automated script to generate new applications with a standardized structure. This ensures consistency across all apps in the project.

#### Using the `create-app` Script

The `create-app` script generates a new app with all necessary files and folder structure.

**Basic Syntax:**

```bash
pnpm create-app <app-name> [platform1] [platform2] ...
```

**Parameters:**

- `app-name` (required): The name of your app in PascalCase (e.g., `MyApp`, `Vault`, `Sigil`)
- `platforms` (optional): Specify which platforms to create files for
  - Valid platforms: `desktop`, `mobile`
  - If no platforms are specified, files for both `desktop` and `mobile` are created

#### Examples

**Create an app for both desktop and mobile (default):**

```bash
pnpm create-app MyApp
```

This generates:

```
src/apps/MyApp/
├── shared/
│   └── Provider.tsx
├── desktop/
│   ├── Sidebar.tsx
│   └── Workspace.tsx
├── mobile/
│   ├── Sidebar.tsx
│   └── Workspace.tsx
├── test/
│   └── .gitkeep
└── index.tsx
```

**Create an app for desktop only:**

```bash
pnpm create-app MyApp desktop
```

**Create an app for mobile only:**

```bash
pnpm create-app MyApp mobile
```

**Create an app for specific platforms:**

```bash
pnpm create-app MyApp desktop mobile
```

#### Generated Files

The script creates the following files for you:

- **`shared/Provider.tsx`**: A React context provider for global state management
- **`<platform>/Sidebar.tsx`**: Platform-specific sidebar component
- **`<platform>/Workspace.tsx`**: Platform-specific workspace component
- **`index.tsx`**: Main app export that implements the `App` interface
- **`test/`**: Directory for your app's tests

#### After Creating Your App

1. **Import the app** in `src/apps/index.ts`:

   ```typescript
   export * from './MyApp/index.tsx';
   ```

2. **Customize the generated files** to fit your app's specific needs

3. **Add tests** in the `test/` folder for your components and logic

4. **Register the app** in your app registry or routing system

### Use the logger

For logging please use exclusively the logger module provided in the project. This will help us maintain consistency and ensure that all logs are properly formatted and stored.

**Example usage:**

```typescript
import { logger } from '@/utils';

// Log info level message
logger.info('User successfully logged in');

// Log warning level message
logger.warn('API rate limit approaching');

// Log error level message
logger.error('Failed to fetch user data from database');
```

**Output format:**

```
[2026-02-16T10:30:45.123Z] [INFO] User successfully logged in
[2026-02-16T10:30:46.456Z] [WARN] API rate limit approaching
[2026-02-16T10:30:47.789Z] [ERROR] Failed to fetch user data from database
```
