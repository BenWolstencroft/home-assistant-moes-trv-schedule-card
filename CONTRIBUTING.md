# Contributing to MOES TRV Schedule Card

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear description of the problem
- Steps to reproduce the issue
- Your Home Assistant version
- Your TRV model and integration type (Zigbee/Tuya)
- Browser console errors (if applicable)

### Suggesting Enhancements

Feature requests are welcome! Please include:
- A clear description of the feature
- Why it would be useful
- How it should work

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly with your MOES TRV
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code formatting
- Test with both text and climate entities if possible

### Testing

Before submitting a PR:
- Test the card loads without errors
- Verify schedule parsing works correctly
- Test schedule saving to your TRV
- Check browser console for errors
- Test on both desktop and mobile

## Development Setup

1. Clone the repository
2. Copy files to your Home Assistant `config/www` directory
3. Add the resource in `configuration.yaml`:
   ```yaml
   lovelace:
     resources:
       - url: /local/moes-trv-schedule-card.js
         type: module
   ```
4. Restart Home Assistant
5. Add the card to a dashboard for testing

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
