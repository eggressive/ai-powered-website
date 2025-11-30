# Security Workflow Maintenance Guide

This document explains how to maintain the security scanning workflow (`.github/workflows/security-scan.yml`).

## Overview

The security workflow automatically scans for vulnerabilities using multiple methods:

1. **Automated npm advisory checks** via `pnpm audit` (always up-to-date)
2. **Optional blocklist** for specific packages
3. **Malware detection** for Shai-Hulud and similar attacks
4. **Typosquatting detection** for Python packages

## How Vulnerability Detection Works

### Primary Method: pnpm audit

The workflow uses `pnpm audit` to check against the **npm advisory database**, which is:
- ✅ Continuously updated by the npm community
- ✅ Maintained by security researchers worldwide
- ✅ Includes all known vulnerabilities with CVE numbers
- ✅ No manual maintenance required

**The workflow automatically fails if:**
- Any CRITICAL severity vulnerabilities are found
- Any HIGH severity vulnerabilities are found

### Secondary Method: Package Blocklist (Optional)

Use the blocklist for packages that should **never** be installed, even if not flagged by npm audit.

**When to add packages to the blocklist:**

1. **Known malware** that hasn't been removed from npm yet
2. **Abandoned packages** with known vulnerabilities that won't be fixed
3. **Packages banned by your organization's security policy**
4. **Supply chain compromise** discovered but not yet in npm advisories

**How to update the blocklist:**

Edit `.github/workflows/security-scan.yml` at line ~164:

```yaml
BLOCKLIST=""
# Example: BLOCKLIST="malicious-package@1.0.0 another-bad-pkg"
```

Change to:

```yaml
BLOCKLIST="malicious-pkg@1.0.0 compromised-lib"
```

**Format:**
- Space-separated list
- Can include version: `package@1.0.0`
- Or block all versions: `package-name`

## Maintenance Sources

### Where to find security advisories:

1. **GitHub Security Advisories**
   - URL: https://github.com/advisories
   - Filter by ecosystem: npm, PyPI
   - Subscribe to notifications

2. **Snyk Vulnerability Database**
   - URL: https://security.snyk.io/
   - Search by package name
   - Free for open source

3. **npm Security Advisories**
   - URL: https://www.npmjs.com/advisories
   - Built into `pnpm audit`

4. **NIST National Vulnerability Database**
   - URL: https://nvd.nist.gov/
   - Search by CVE number

5. **Security Mailing Lists**
   - npm Security: https://nodesecurity.io/
   - Python Security: https://mail.python.org/mailman3/lists/security-announce.python.org/

## Updating Malware Detection

### Shai-Hulud Detection (lines 52-110)

The malware detection checks for specific indicators of compromise (IOCs):

```yaml
MALWARE_INDICATORS=(
  "setup_bun.js"
  "bun_environment.js"
  # Add new indicators here
)
```

**When to update:**

1. New supply chain attacks are discovered
2. Malware uses different file names
3. Security researchers publish new IOCs

**How to update:**

1. Add new file names to `MALWARE_INDICATORS` array
2. Add new patterns to the grep commands
3. Update suspicious URLs list if new C2 servers are found

### Typosquatting Detection (lines 289-351)

Checks for common misspellings of popular packages.

**When to update:**

1. New typosquatting attacks are discovered
2. Your project adds new critical dependencies
3. Security advisories mention new typosquatted packages

**How to update:**

Add new checks following the existing pattern:

```bash
# Check for "package-name" typos (correct: package-name)
if grep -qE "^(packge-name|pakage-name)==" requirements.txt 2>/dev/null; then
  echo "🚨 Possible typo of 'package-name' package found"
  grep -E "^(packge-name|pakage-name)==" requirements.txt
  TYPOS_FOUND=true
fi
```

## Testing Changes

Before committing changes to the security workflow:

1. **Test locally:**
   ```bash
   cd ai-intent-tracker
   pnpm audit --json
   pnpm list
   ```

2. **Verify the workflow syntax:**
   ```bash
   # Use GitHub CLI or online validators
   gh workflow view security-scan.yml
   ```

3. **Test the grep patterns:**
   ```bash
   # Test the pattern matches what you expect
   echo "test-package==1.0.0" | grep -qE "^(test-package)==" && echo "Match!"
   ```

4. **Create a test branch:**
   - Push to a test branch first
   - Verify workflow runs successfully
   - Check workflow logs in GitHub Actions tab

## Automated Updates

### Dependabot Configuration

Dependabot automatically creates PRs for dependency updates weekly.

**Configuration:** `.github/dependabot.yml`

**What it does:**
- Checks for new package versions every Monday at 9:00 AM
- Creates PRs for security updates immediately
- Limits to 10 open PRs at once
- Labels PRs with "dependencies" and "security"

**No manual maintenance required** - Dependabot uses the same npm registry data as `pnpm audit`.

## Workflow Schedule

The security scan runs:

- ✅ **On every push** to any branch
- ✅ **On every pull request**
- ✅ **Daily at 2:00 AM UTC** (scheduled scan)

This ensures:
- New code is scanned immediately
- Existing code is checked daily for newly discovered vulnerabilities
- No manual scanning required

## When the Workflow Fails

If the security workflow fails:

1. **Check the workflow logs** in GitHub Actions
2. **Identify which check failed:**
   - Malware detection → Possible compromise
   - Vulnerability check → Update dependencies
   - Typosquatting → Fix package name typo
   - Lock file integrity → Restore from git history

3. **For vulnerability failures:**
   ```bash
   # View detailed report
   pnpm audit

   # Try automatic fixes
   pnpm audit --fix

   # Update specific package
   pnpm update package-name
   ```

4. **For malware detection:**
   - DO NOT commit the changes
   - Run `scripts/check-shai-hulud.sh`
   - Follow incident response in `SECURITY_MITIGATION_PLAN.md`
   - Contact security team

5. **For false positives:**
   - Review the detection logic
   - Adjust patterns if needed
   - Document the exception

## Best Practices

1. ✅ **Never disable security checks** to make builds pass
2. ✅ **Investigate all failures** before merging
3. ✅ **Keep the blocklist minimal** - rely on `pnpm audit` primarily
4. ✅ **Document blocklist additions** with reason and date
5. ✅ **Review the workflow quarterly** for improvements
6. ✅ **Subscribe to security advisories** for your dependencies
7. ✅ **Test workflow changes** on a separate branch first

## Questions?

For security concerns, see `docs/SECURITY.md` for reporting procedures.

For workflow issues, open a GitHub issue with:
- The workflow run URL
- The error message
- Steps to reproduce
