# Backend Testing Guide

This document provides comprehensive information about the testing setup and structure for the Company Question Analyzer backend.

## Test Structure

The backend includes a comprehensive test suite with the following types of tests:

### 1. Unit Tests (`*.spec.ts`)
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test individual components in isolation
- **Coverage**: Services, controllers, utilities, and business logic

### 2. Integration Tests (`*.spec.ts`)
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test component interactions and dependencies
- **Coverage**: Controller-service interactions, repository operations

### 3. End-to-End Tests (`*.e2e-spec.ts`)
- **Location**: `test/*.e2e-spec.ts`
- **Purpose**: Test complete application workflows
- **Coverage**: Full HTTP request/response cycles, database operations

## Test Files Overview

### Unit Tests
- `src/app.controller.spec.ts` - AppController unit tests
- `src/app.service.spec.ts` - AppService unit tests
- `src/api/domain.service.spec.ts` - DomainService unit tests
- `src/api/history.service.spec.ts` - HistoryService unit tests
- `src/ai/multi-step.processor.spec.ts` - MultiStepProcessor unit tests
- `src/ai/perplexity.provider.spec.ts` - PerplexityProvider unit tests

### Integration Tests
- `src/api/questions.controller.spec.ts` - QuestionsController integration tests
- `src/api/history.controller.spec.ts` - HistoryController integration tests

### End-to-End Tests
- `test/app.e2e-spec.ts` - Complete application workflow tests

### Test Utilities
- `src/test-utils.ts` - Common test helpers, mocks, and utilities

## Running Tests

### Prerequisites
Ensure you have all dependencies installed:
```bash
npm install
```

### Available Test Commands

#### Run All Tests
```bash
npm test
```

#### Run Unit Tests Only
```bash
npm run test:unit
```

#### Run Integration Tests Only
```bash
npm run test:integration
```

#### Run End-to-End Tests Only
```bash
npm run test:e2e
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Tests with Coverage
```bash
npm run test:cov
```

#### Run Tests in Debug Mode
```bash
npm run test:debug
```

## Test Coverage

The test suite provides comprehensive coverage for:

### Core Functionality
- ✅ Domain extraction and validation
- ✅ Question analysis and processing
- ✅ History management (CRUD operations)
- ✅ AI provider integration
- ✅ Multi-step processing workflow

### Edge Cases
- ✅ Empty and invalid inputs
- ✅ Special characters and Unicode
- ✅ Long strings and performance
- ✅ Network errors and timeouts
- ✅ Database connection issues

### Error Handling
- ✅ Bad request exceptions
- ✅ Internal server errors
- ✅ Validation errors
- ✅ Service layer errors

### API Endpoints
- ✅ Health check endpoint
- ✅ Question analysis endpoint
- ✅ History management endpoints
- ✅ Error responses and status codes

## Test Utilities

The `src/test-utils.ts` file provides common utilities for testing:

### Mock Factories
- `createMockRepository()` - Repository mock
- `createMockAiProvider()` - AI provider mock
- `createMockConfigService()` - Config service mock
- `createMockResponse()` - HTTP response mock
- `createMockRequest()` - HTTP request mock

### Test Data Factories
- `createTestHistoryItem()` - History item test data
- `createTestHistoryItems()` - Multiple history items
- `createTestQuestionData()` - Question test data
- `createTestHistoryData()` - History test data

### Helper Functions
- `createMockStreamGenerator()` - Streaming response mock
- `createTestingModule()` - Test module builder
- `createRepositoryTestingModule()` - Repository testing setup
- `expectValidDomain()` - Domain validation helper
- `expectValidTimestamp()` - Timestamp validation helper
- `measureExecutionTime()` - Performance measurement
- `runConcurrentRequests()` - Concurrent request testing
- `expectThrowsAsync()` - Async error testing
- `cleanupMocks()` - Mock cleanup

## Test Configuration

### Jest Configuration
- **Unit Tests**: Configured in `package.json`
- **E2E Tests**: Configured in `test/jest-e2e.json`
- **Coverage**: Configured to exclude `node_modules` and `test` directories

### Test Environment
- **Unit Tests**: Node.js environment
- **E2E Tests**: Node.js environment with extended timeout (30s)
- **Database**: SQLite in-memory database for tests

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests with clear sections
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should test one thing
4. **Mock External Dependencies**: Mock external services and APIs
5. **Test Edge Cases**: Include tests for error conditions and edge cases

### Test Data
1. **Use Factories**: Use test data factories for consistent test data
2. **Avoid Hardcoded Values**: Use variables for test data
3. **Clean Up**: Clean up test data after each test
4. **Isolation**: Ensure tests don't depend on each other

### Mocking
1. **Mock External Services**: Mock HTTP requests, database calls
2. **Verify Interactions**: Verify that mocks are called correctly
3. **Reset Mocks**: Clean up mocks between tests
4. **Use Realistic Data**: Use realistic mock data

## Continuous Integration

The test suite is designed to run in CI/CD environments:

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    cd backend
    npm install
    npm test
    npm run test:e2e
```

### Docker
```dockerfile
# Run tests in Docker
RUN npm test
RUN npm run test:e2e
```

## Troubleshooting

### Common Issues

#### Tests Failing Due to Database
- Ensure SQLite is properly configured
- Check database file permissions
- Verify database schema is up to date

#### Mock Issues
- Clear mocks between tests using `cleanupMocks()`
- Verify mock implementations are correct
- Check mock return values

#### Timeout Issues
- Increase Jest timeout for long-running tests
- Use `jest.setTimeout()` for specific tests
- Check for infinite loops or hanging promises

#### Coverage Issues
- Ensure all code paths are tested
- Add tests for error conditions
- Check for untested branches

### Debugging Tests
1. Use `npm run test:debug` for debugging
2. Add `console.log()` statements for debugging
3. Use Jest's `--verbose` flag for detailed output
4. Check test output for specific error messages

## Performance Testing

The test suite includes performance tests:

### Load Testing
- Concurrent request handling
- Response time measurements
- Memory usage monitoring

### Stress Testing
- Large data sets
- Long-running operations
- Resource exhaustion scenarios

## Security Testing

The test suite includes security-related tests:

### Input Validation
- SQL injection prevention
- XSS prevention
- Input sanitization

### Authentication & Authorization
- API key validation
- Request validation
- Error message security

## Maintenance

### Regular Tasks
1. **Update Dependencies**: Keep test dependencies up to date
2. **Review Coverage**: Regularly review test coverage
3. **Refactor Tests**: Refactor tests as code changes
4. **Add New Tests**: Add tests for new features

### Test Maintenance
1. **Keep Tests Fast**: Ensure tests run quickly
2. **Maintain Readability**: Keep tests readable and maintainable
3. **Update Documentation**: Keep this guide updated
4. **Review Test Quality**: Regularly review test quality

## Contributing

When adding new features or modifying existing code:

1. **Write Tests First**: Follow TDD principles
2. **Maintain Coverage**: Ensure high test coverage
3. **Update Documentation**: Update this guide as needed
4. **Follow Patterns**: Follow existing test patterns
5. **Review Tests**: Have tests reviewed with code changes

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/testing) 