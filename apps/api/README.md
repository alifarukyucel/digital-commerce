# Digital Commerce API

## Testing

### Run All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Run Only Unit Tests
```bash
npm run test:unit
```

### Run Only Integration Tests
```bash
npm run test:integration
```

### Coverage Report
```bash
npm test
# Coverage report will be in coverage/lcov-report/index.html
```

## Test Structure

```
src/__tests__/
├── unit/              # Unit tests (isolated, mocked dependencies)
│   ├── *.service.test.ts
│   └── *.utils.test.ts
├── integration/       # Integration tests (real HTTP requests)
│   └── *.api.test.ts
├── utils/             # Test utilities
└── setup.ts           # Test configuration
```

## Coverage Thresholds

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%
