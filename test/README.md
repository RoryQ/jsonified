# Testing Framework for Jsonifed

This directory contains tests for the Jsonifed project. The tests use Jest as the testing framework and fixtures to verify the functionality of the parsers.

## Running Tests

To run all tests:

```bash
make test
```

Or directly with npm:

```bash
npm test
```

## Test Structure

- `test/`: Contains all test files
  - `fixtures/`: Contains HTML fixtures used for testing
  - `*.test.js`: Test files for each parser

## Adding New Tests

1. Create a fixture in the `fixtures/` directory if needed
2. Create a test file named `[parser-name].test.js`
3. Import the parser and fixture in the test file
4. Write tests using Jest's `describe`, `test`, and `expect` functions

## Example Test

```javascript
const fs = require('fs');
const path = require('path');
const Parser = require('../src/parser');

describe('Parser', () => {
  let htmlContent;

  beforeAll(() => {
    // Load the fixture
    htmlContent = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'fixture.html'),
      'utf8'
    );
  });

  test('should parse HTML content correctly', () => {
    const result = Parser.parseHTML(htmlContent);
    expect(result).toBeDefined();
    // Add more assertions here
  });
});
```
