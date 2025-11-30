# Shai-Hulud 2.0 Security Mitigation Plan

## Executive Summary

This document outlines the comprehensive security measures to protect this repository from the Shai-Hulud 2.0 npm supply chain attack and similar threats.

**Status**: Repository currently shows no signs of compromise
**Risk Level**: MEDIUM (Active threat in npm ecosystem)
**Last Updated**: 2025-11-30

---

## Understanding the Threat

### What is Shai-Hulud 2.0?

Shai-Hulud 2.0 is an active npm supply chain attack that:

- Compromised 25,000+ repositories and ~800 npm packages
- Uses `preinstall` scripts to execute before package installation
- Harvests credentials (GitHub tokens, npm tokens, AWS keys, SSH keys)
- Self-propagates by publishing backdoored packages
- Can destroy entire home directories if exfiltration fails

### Attack Timeline

- **November 21-23, 2025**: Initial wave of trojanized packages published
- **November 24, 2025**: Major packages from Zapier, PostHog, Postman compromised
- **November 26, 2025**: Attack continues with expanded scope

---

## Current Repository Assessment

### Clean Indicators

- No malicious `setup_bun.js` or `bun_environment.js` files
- No `preinstall`/`postinstall` scripts in package.json
- No suspicious GitHub workflows
- Using pnpm (more secure than npm)
- Lock file present (pnpm-lock.yaml)

### Risk Factors

- 62 production dependencies (large attack surface)
- No automated security scanning in place
- No dependency version pinning policy
- No SBOM (Software Bill of Materials) generation
- CI/CD may have access to secrets

---

## Phase 1: Immediate Actions (Do Within 24 Hours)

### 1.1 Audit Current Installation

```bash
# Check for suspicious files
find . -name "setup_bun.js" -o -name "bun_environment.js"
find . -type f -name "*.js" -exec grep -l "Shai-Hulud\|Sha1-Hulud" {} \;

# Review all package.json files for install scripts
find . -name "package.json" -exec grep -H "preinstall\|postinstall\|preuninstall" {} \;

# Check for suspicious GitHub repos in your account
gh repo list --json name,description | grep -i "shai-hulud\|sha1-hulud\|second coming"
```

### 1.2 Rotate ALL Credentials

**Assumption**: If you ran `npm install` or `pnpm install` in the last 30 days, rotate these credentials:

```bash
# Priority 1: npm tokens
npm token list
npm token revoke <token-id>
npm token create --read-only  # For CI/CD

# Priority 2: GitHub tokens
gh auth token  # Review current token
# Revoke at: https://github.com/settings/tokens

# Priority 3: SSH keys
ls -la ~/.ssh/
# Generate new keys and update GitHub/GitLab

# Priority 4: Cloud provider credentials
aws configure list  # Check for AWS credentials
# Rotate AWS access keys, GCP service accounts, Azure credentials
```

**Enable 2FA/MFA on all accounts** (GitHub, npm, cloud providers)

### 1.3 Scan for Credential Leaks

```bash
# Check for public repos with leaked credentials
gh repo list --json name,description,visibility | jq '.[] | select(.visibility == "public")'

# Scan recent commits for exposed secrets
git log --all --full-history --source --find-object=<secret>
```

### 1.4 Lock Down package.json

Add the following to prevent install scripts:

```json
{
  "scripts": {
    "preinstall": "echo '⚠️  Preinstall scripts are blocked for security' && exit 1"
  }
}
```

**Better approach**: Use `.npmrc` or `.yarnrc` configuration:

```ini
# .npmrc
ignore-scripts=true
```

---

## Phase 2: Enhanced Security Measures (Do Within 1 Week)

### 2.1 Install Security Scanning Tools

```bash
# Install npm audit
pnpm audit --audit-level=high

# Install Socket.dev for supply chain security
pnpm add -D @socketsecurity/cli
npx socket-npm audit

# Install Snyk for vulnerability scanning
pnpm add -D snyk
npx snyk test
npx snyk monitor
```

### 2.2 Implement Dependency Pinning

Update package.json to use exact versions (remove ^ and ~):

```json
{
  "dependencies": {
    "react": "19.1.0",  // Instead of "^19.1.0"
    "vite": "6.3.5"     // Instead of "^6.3.5"
  }
}
```

### 2.3 Enable Dependabot/Renovate

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/ai-intent-tracker"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
      - "security"
```

### 2.4 Create Security Policy

Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Email: security@yourcompany.com
```

---

## Phase 3: CI/CD Hardening

### 3.1 Create GitHub Actions Security Workflow

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: |
          cd ai-intent-tracker
          pnpm install --frozen-lockfile --ignore-scripts

      - name: Run pnpm audit
        run: |
          cd ai-intent-tracker
          pnpm audit --audit-level=moderate

      - name: Socket Security Scan
        uses: SocketDev/socket-security-scan-action@v1
        with:
          token: ${{ secrets.SOCKET_SECURITY_TOKEN }}

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Check for malicious files
        run: |
          # Check for Shai-Hulud indicators
          if find . -name "setup_bun.js" -o -name "bun_environment.js" | grep -q .; then
            echo "⚠️ MALICIOUS FILES DETECTED!"
            exit 1
          fi

          # Check for install scripts
          if grep -r "preinstall\|postinstall" */package.json | grep -v "echo"; then
            echo "⚠️ SUSPICIOUS INSTALL SCRIPTS DETECTED!"
            exit 1
          fi

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

      - name: GitLeaks Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3.2 Restrict CI/CD Permissions

Update GitHub Actions to use minimal permissions:

```yaml
permissions:
  contents: read
  pull-requests: read
  security-events: write  # Only for security uploads
```

### 3.3 Use Isolated Build Environments

```yaml
# Use ephemeral runners
jobs:
  build:
    runs-on: ubuntu-latest
    container:
      image: node:18-alpine
      options: --read-only --tmpfs /tmp
```

### 3.4 Implement SBOM Generation

```yaml
- name: Generate SBOM
  run: |
    npx @cyclonedx/cyclonedx-npm --output-file sbom.json

- name: Upload SBOM
  uses: actions/upload-artifact@v4
  with:
    name: sbom
    path: sbom.json
```

---

## Phase 4: Ongoing Monitoring

### 4.1 Daily Monitoring Checklist

- [ ] Review Dependabot/Renovate PRs
- [ ] Check security alerts: `gh api /repos/OWNER/REPO/security-advisories`
- [ ] Monitor npm advisories: https://github.com/advisories
- [ ] Check Socket.dev dashboard
- [ ] Review audit logs for package installations

### 4.2 Weekly Security Tasks

- [ ] Run full dependency audit: `pnpm audit`
- [ ] Review GitHub security alerts
- [ ] Check for new CVEs in dependencies
- [ ] Review access logs for npm/GitHub accounts
- [ ] Verify 2FA is enabled on all accounts

### 4.3 Monthly Security Review

- [ ] Full credential rotation (npm tokens, GitHub PATs)
- [ ] Review and update dependencies
- [ ] Audit CI/CD secrets and permissions
- [ ] Review security policies and update as needed
- [ ] Test incident response procedures

### 4.4 Automated Monitoring Tools

```bash
# Set up npm-watch for real-time monitoring
pnpm add -D npm-check-updates
npx ncu --doctor -u  # Interactive upgrade

# Monitor for supply chain attacks
pnpm add -D @socket.security/cli
npx socket-npm audit --package-manager pnpm
```

---

## Phase 5: Incident Response Plan

### If You Suspect Compromise

#### Immediate Actions (First 15 Minutes)

1. **Isolate the System**

   ```bash
   # Disconnect from network
   sudo ip link set <interface> down

   # Kill package manager processes
   pkill -9 npm
   pkill -9 pnpm
   pkill -9 node
   ```

2. **Preserve Evidence**

   ```bash
   # Capture current state
   ps aux > /tmp/process_list.txt
   netstat -tulpn > /tmp/network_connections.txt
   ls -laR ~/ > /tmp/file_listing.txt

   # Check for Shai-Hulud artifacts
   find ~ -name "*shai-hulud*" -o -name "*sha1-hulud*" > /tmp/malware_files.txt
   ```

3. **Revoke All Credentials**
   - npm tokens: https://www.npmjs.com/settings/~/tokens
   - GitHub tokens: https://github.com/settings/tokens
   - Cloud credentials: AWS, GCP, Azure consoles

#### Investigation (First Hour)

4. **Check for Exfiltration**

   ```bash
   # Check for public repos created by malware
   gh repo list --json name,description,createdAt | \
     jq '.[] | select(.description | contains("Shai-Hulud") or contains("Sha1-Hulud") or contains("Second Coming"))'

   # Check recently published npm packages
   npm profile get
   npm access ls-packages
   ```

5. **Review System Modifications**

   ```bash
   # Check for malicious cron jobs
   crontab -l

   # Check for modified SSH authorized_keys
   cat ~/.ssh/authorized_keys

   # Check for new user accounts
   cat /etc/passwd
   ```

6. **Analyze Package Installations**

   ```bash
   # Review npm install history
   npm config get cache
   ls -lat $(npm config get cache)

   # Check for Bun installation
   which bun
   bun --version
   ```

#### Remediation (First 24 Hours)

7. **Clean the System**

   ```bash
   # Remove Bun if installed by malware
   rm -rf ~/.bun

   # Delete malicious repos
   gh repo delete <malicious-repo-name> --confirm

   # Clean npm cache
   pnpm store prune
   ```

8. **Restore from Clean State**

   ```bash
   # Remove all node_modules
   find . -name "node_modules" -type d -prune -exec rm -rf {} +

   # Verify package.json integrity
   git diff package.json

   # Reinstall from lock file
   pnpm install --frozen-lockfile --ignore-scripts
   ```

9. **Report the Incident**
   - GitHub Security: security@github.com
   - npm Security: security@npmjs.com
   - CISA: https://www.cisa.gov/report

#### Post-Incident (First Week)

10. **Audit All Code Changes**

    ```bash
    # Check for malicious commits
    git log --all --source --full-history

    # Review all branches
    git branch -a

    # Check for malicious GitHub workflows
    find .github/workflows -name "*.yml" -exec cat {} \;
    ```

11. **Communicate with Stakeholders**
    - Internal team notification
    - Customer notification (if data exposed)
    - Regulatory compliance reporting (if required)

---

## Tools and Resources

### Security Scanning Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| Socket.dev | Supply chain security | `pnpm add -D @socketsecurity/cli` |
| Snyk | Vulnerability scanning | `pnpm add -D snyk` |
| npm audit | Built-in security check | Built into pnpm |
| TruffleHog | Secret scanning | GitHub Action |
| GitLeaks | Secret detection | GitHub Action |
| Dependabot | Automated updates | GitHub native |
| Renovate | Dependency management | GitHub App |

### Configuration Files to Create

1. `.npmrc` - Disable install scripts
2. `.github/dependabot.yml` - Automated security updates
3. `.github/workflows/security-scan.yml` - CI/CD security scanning
4. `SECURITY.md` - Security disclosure policy
5. `.snyk` - Snyk policy configuration

### Useful Commands

```bash
# Audit dependencies
pnpm audit --audit-level=moderate

# List all dependencies (including transitive)
pnpm list --depth=Infinity

# Check for outdated packages
pnpm outdated

# Verify package integrity
pnpm install --frozen-lockfile

# Disable all install scripts permanently
echo "ignore-scripts=true" >> .npmrc

# Generate Software Bill of Materials (SBOM)
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

---

## Additional Hardening Measures

### 1. Package Manager Configuration

Create `.npmrc` in project root:

```ini
# Disable install scripts
ignore-scripts=true

# Use exact versions
save-exact=true

# Verify package integrity
package-lock=true

# Audit on install
audit=true
audit-level=moderate

# Use registry with 2FA enforcement
registry=https://registry.npmjs.org/
```

### 2. Code Signing

```bash
# Sign commits
git config --global commit.gpgsign true
git config --global user.signingkey <GPG-KEY-ID>

# Verify commit signatures
git log --show-signature
```

### 3. Network Segmentation

- Isolate CI/CD runners from production
- Use VPN for package registry access
- Implement egress filtering to prevent data exfiltration

### 4. Principle of Least Privilege

- CI/CD should have read-only access to secrets
- Use scoped npm tokens (read-only for CI)
- Implement branch protection rules
- Require code review for dependency updates

---

## Compliance and Reporting

### Required Documentation

- [ ] Incident response plan reviewed and approved
- [ ] Security policy documented (SECURITY.md)
- [ ] SBOM generated and archived
- [ ] Dependency audit log maintained
- [ ] Access control matrix updated

### Reporting Requirements

If compromise is detected:

1. **Internal**: Notify security team within 1 hour
2. **GitHub**: Report via security@github.com
3. **npm**: Report via security@npmjs.com
4. **CISA**: File report at https://www.cisa.gov/report
5. **Customers**: Notify within 72 hours if data exposed

---

## References and Further Reading

- [Palo Alto Unit 42 Analysis](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/)
- [Wiz Shai-Hulud 2.0 Report](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)
- [Datadog Security Labs Analysis](https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/)
- [CISA Alert](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)
- [PostHog Post-Mortem](https://posthog.com/blog/nov-24-shai-hulud-attack-post-mortem)

---

**Version**: 1.0
