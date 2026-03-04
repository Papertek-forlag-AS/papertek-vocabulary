# Contributing

Thanks for your interest in contributing to Papertek Vocabulary API!

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Make your changes
4. Run validation: `npm run validate:all`
5. Commit your changes
6. Push to your fork and open a Pull Request

## Vocabulary Data

When adding or modifying vocabulary data:

- Follow existing JSON structure in `vocabulary/banks/`
- Ensure entries pass schema validation (`npm run validate:all`)
- Include audio filenames where applicable
- Add translations for both Norwegian and English

## Reporting Issues

Open an issue on GitHub with:

- A clear description of the problem
- Steps to reproduce (if applicable)
- Expected vs actual behavior
