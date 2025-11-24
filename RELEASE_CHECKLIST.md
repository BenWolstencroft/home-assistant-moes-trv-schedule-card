# Release Checklist

Use this checklist before publishing a new release.

## Pre-Release Verification

### Files Check
- [ ] `moes-trv-schedule-card.js` - Main card file exists and works
- [ ] `moes-trv-schedule-card-editor.js` - Editor file exists and works
- [ ] `hacs.json` - Valid JSON with correct configuration
- [ ] `README.md` - Complete and up-to-date documentation
- [ ] `info.md` - HACS display page with correct repository URL
- [ ] `LICENSE` - MIT License file present
- [ ] `CHANGELOG.md` - Updated with new version
- [ ] `.gitignore` - Proper git ignore rules

### Version Numbers Match
- [ ] `package.json` - version: `"1.0.0"`
- [ ] `CHANGELOG.md` - Latest entry: `## 1.0.0`
- [ ] `moes-trv-schedule-card.js` - Header comment version: `1.0.0`
- [ ] `moes-trv-schedule-card.js` - Console log: `1.0.0`
- [ ] README badges - version badge shows `1.0.0`

### URLs are Correct
- [ ] `package.json` - Repository URL: `https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card`
- [ ] `info.md` - Repository URL: `https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card`
- [ ] `moes-trv-schedule-card.js` - documentationURL: `https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card`
- [ ] `moes-trv-schedule-card.js` - Header comment repository link

### Documentation Check
- [ ] README has installation instructions
- [ ] README has configuration examples
- [ ] README mentions both text and climate entity support
- [ ] INTEGRATION.md explains different integration types
- [ ] Examples folder has valid YAML examples

### Testing
- [ ] Card loads without errors in browser console
- [ ] Card appears in Lovelace card picker
- [ ] Entity selector shows appropriate entities
- [ ] Schedule can be edited and saved
- [ ] Works with text entities
- [ ] Works with climate entities (if available)

## GitHub Repository

- [ ] Repository created on GitHub: `BenWolstencroft/home-assistant-moes-trv-schedule-card`
- [ ] Repository is public
- [ ] All files committed and pushed
- [ ] GitHub Actions workflow runs successfully
- [ ] HACS validation passes

## Release Creation

- [ ] Create release on GitHub
- [ ] Tag version: `v1.0.0` (must start with 'v')
- [ ] Release title: `v1.0.0 - Initial Release`
- [ ] Release description from CHANGELOG.md
- [ ] Release marked as "Latest release"

## Post-Release

- [ ] Test installation via HACS custom repository
- [ ] Card installs successfully
- [ ] Card works after installation
- [ ] Documentation is accessible from GitHub

## HACS Default Submission (Optional)

- [ ] Repository has been tested as custom repository
- [ ] At least one release exists
- [ ] HACS validation passes
- [ ] Fork `hacs/default` repository
- [ ] Add `BenWolstencroft/home-assistant-moes-trv-schedule-card` to `plugin` file
- [ ] Create pull request
- [ ] Wait for HACS team review

---

## Quick Commands

```powershell
# Check current version
git tag

# Create and push new version
git add .
git commit -m "v1.0.0 - Initial release"
git push

# Create tag
git tag v1.0.0
git push origin v1.0.0

# Then create release on GitHub web interface
```

## Notes

- Always use semantic versioning: `v1.0.0`, `v1.1.0`, `v2.0.0`
- Update CHANGELOG.md before each release
- Test thoroughly before creating release
- GitHub release triggers HACS update notification for users
