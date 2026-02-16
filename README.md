# .NoblSft

Welcome to .NoblSft. This is a software project that aims to provide a comprehensive solution for everything that is both
digital a personal to you. Our goal is to create a platform that allows users to manage their digital lives in a seamless and efficient way. While being hyper secure, free and open source.

## How to contribute ?

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
