# Testing Guide

This directory contains all test files for the AI Intent Tracker frontend.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Test Structure

```
src/
├── __tests__/              # Integration tests
│   └── README.md
├── components/
│   └── __tests__/          # Component tests
├── hooks/
│   └── __tests__/          # Hook tests
├── services/
│   └── __tests__/          # Service/API tests
└── test-utils.jsx          # Shared test utilities
```

## Writing Tests

### Basic Test Example

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Hook Testing Example

```javascript
import { renderHook, waitFor } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(null)
  })
})
```

### API Mocking Example

```javascript
import { vi } from 'vitest'
import { api } from '../services/api'

vi.mock('../services/api')

describe('API Tests', () => {
  it('fetches data', async () => {
    api.getData.mockResolvedValue({ data: 'test' })
    const result = await api.getData()
    expect(result.data).toBe('test')
  })
})
```

## Test Utilities

Use the helpers from `test-utils.jsx`:

```javascript
import {
  renderWithProviders,
  mockFetch,
  createMockSession,
  createMockPrediction,
} from '@/test-utils'

// Render with providers
const { getByText } = renderWithProviders(<MyComponent />)

// Mock fetch
mockFetch({ success: true })

// Create mock data
const session = createMockSession({ clickCount: 5 })
```

## Coverage Thresholds

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test Behavior**: Test what users see, not implementation
3. **Mock External Dependencies**: Use vi.mock() for APIs
4. **Clean Up**: Use afterEach(cleanup) automatically via setupTests.js
5. **Descriptive Names**: Use clear test descriptions
6. **Single Responsibility**: One assertion per test when possible

## Debugging Tests

```bash
# Run specific test file
pnpm test src/hooks/__tests__/useSession.test.js

# Run tests matching pattern
pnpm test --grep="session"

# Run with debugging
pnpm test --inspect-brk
```

## CI/CD Integration

Tests run automatically on:
- Every push to feature branches
- Pull request creation
- Before deployment

Coverage reports are uploaded to the artifacts.
