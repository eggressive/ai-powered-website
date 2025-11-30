# 🚀 Shai-Hulud 2.0 Protection - Quick Start Guide

> **Status**: ✅ Repository appears clean (as of 2025-11-30)
> **Action Required**: Implement preventive measures immediately

## ⚡ 5-Minute Security Checklist

### 1. Verify Repository Status

```bash
# Check for malicious files (should return nothing)
find . -name "setup_bun.js" -o -name "bun_environment.js"

# Check for install scripts
grep -r "preinstall\|postinstall" */package.json

# Check for Shai-Hulud repos in your GitHub account
gh repo list --json name,description | grep -i "shai-hulud\|sha1-hulud"
```

**Expected Result**: All commands should return empty or safe results

### 2. Rotate Credentials (If You Ran npm/pnpm Install Recently)

```bash
# 1. Revoke npm tokens
npm token list
npm token revoke <token-id>

# 2. Revoke GitHub PATs
gh auth logout
# Then: https://github.com/settings/tokens

# 3. Rotate SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add new key to GitHub: https://github.com/settings/keys

# 4. Check AWS/Cloud credentials
aws configure list
# Rotate if exposed
```

### 3. Enable Protection

```bash
# Already done - .npmrc file created with:
# - ignore-scripts=true (blocks preinstall/postinstall)
# - audit=true (enables security checks)

# Verify it's working
cd ai-intent-tracker
cat .npmrc | grep "ignore-scripts"
```

### 4. Install Dependencies Safely

```bash
cd ai-intent-tracker

# CORRECT way (with protection)
pnpm install --frozen-lockfile --ignore-scripts

# WRONG way (vulnerable)
# npm install  ❌ DON'T DO THIS
```

### 5. Enable Automated Scanning

The GitHub Actions workflow will run automatically on:
- Every push to main/develop
- Every pull request
- Daily at 2 AM UTC
- Manual trigger via GitHub UI

**Next**: Commit and push the security files to activate protection.

---

## 📋 What We've Implemented

| File | Purpose | Status |
|------|---------|--------|
| `.npmrc` | Blocks install scripts | ✅ Created |
| `.github/workflows/security-scan.yml` | Automated malware/vulnerability scanning | ✅ Created |
| `.github/dependabot.yml` | Automated dependency updates | ✅ Created |
| `SECURITY.md` | Security disclosure policy | ✅ Created |
| `SECURITY_MITIGATION_PLAN.md` | Comprehensive security guide | ✅ Created |

---

## 🎯 Immediate Actions (Do Today)

### For Developers

1. **Pull latest changes** with security configurations
2. **Delete node_modules** and reinstall:
   ```bash
   rm -rf ai-intent-tracker/node_modules
   cd ai-intent-tracker
   pnpm install --frozen-lockfile --ignore-scripts
   ```
3. **Enable 2FA** on npm and GitHub accounts
4. **Sign commits** with GPG keys (optional but recommended)

### For DevOps/Security Team

1. **Review and merge** this security PR
2. **Configure secrets** for GitHub Actions:
   - `SOCKET_SECURITY_TOKEN` (get from socket.dev)
   - `SNYK_TOKEN` (get from snyk.io)
3. **Set up monitoring** for security alerts
4. **Schedule monthly credential rotation**

---

## 🔍 How to Check If You're Compromised

Run this comprehensive check:

```bash
#!/bin/bash
echo "🔍 Shai-Hulud 2.0 Compromise Check"
echo "=================================="

# 1. Check for malicious files
echo -n "Malicious files: "
if find . -name "setup_bun.js" -o -name "bun_environment.js" | grep -q .; then
  echo "❌ FOUND - COMPROMISED!"
else
  echo "✅ None found"
fi

# 2. Check for exfiltration repos
echo -n "Malicious GitHub repos: "
if gh repo list --json name,description | grep -qi "shai-hulud\|sha1-hulud\|second coming"; then
  echo "❌ FOUND - COMPROMISED!"
else
  echo "✅ None found"
fi

# 3. Check for Bun installation
echo -n "Bun runtime (suspicious): "
if command -v bun &> /dev/null; then
  echo "⚠️  Installed (verify if legitimate)"
else
  echo "✅ Not installed"
fi

# 4. Check recently published npm packages
echo -n "Checking npm publish history: "
npm_packages=$(npm profile get 2>/dev/null | grep packages)
echo "${npm_packages:-✅ No packages}"

# 5. Check for malicious workflows
echo -n "Suspicious workflows: "
if [ -f ".github/workflows/discussion.yml" ] || [ -f ".github/workflows/discussion.yaml" ]; then
  echo "❌ FOUND - COMPROMISED!"
else
  echo "✅ None found"
fi

echo ""
echo "If you see any ❌ marks, follow the Incident Response plan immediately!"
```

Save as `check-compromise.sh`, make executable with `chmod +x check-compromise.sh`, and run.

---

## 🆘 If You Find Evidence of Compromise

**STOP EVERYTHING** and follow these steps:

### Step 1: Immediate Containment (First 5 minutes)

```bash
# 1. Disconnect from network (if possible)
sudo ip link set eth0 down

# 2. Kill package manager processes
pkill -9 npm
pkill -9 pnpm
pkill -9 yarn
pkill -9 bun

# 3. Preserve evidence
ps aux > /tmp/processes.txt
netstat -tulpn > /tmp/connections.txt
```

### Step 2: Revoke All Credentials (First 15 minutes)

Visit these URLs immediately:
1. **npm tokens**: https://www.npmjs.com/settings/~/tokens → Revoke all
2. **GitHub PATs**: https://github.com/settings/tokens → Revoke all
3. **SSH keys**: https://github.com/settings/keys → Delete suspicious keys
4. **AWS credentials**: AWS Console → IAM → Rotate all keys
5. **GCP credentials**: GCP Console → IAM → Deactivate service accounts
6. **Azure credentials**: Azure Portal → Rotate secrets

### Step 3: Report (First 30 minutes)

- **Internal**: Email security team and management
- **GitHub**: security@github.com with evidence
- **npm**: security@npmjs.com with package names
- **CISA**: File report at https://www.cisa.gov/report

### Step 4: Clean and Recover (First 24 hours)

```bash
# Delete malicious repos
gh repo delete <malicious-repo-name> --confirm

# Remove Bun if installed
rm -rf ~/.bun

# Clean npm cache
pnpm store prune

# Remove and reinstall packages
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install --frozen-lockfile --ignore-scripts

# Scan system for additional malware
clamscan -r ~/ > ~/malware-scan.log
```

Full details: See **Phase 5: Incident Response Plan** in [SECURITY_MITIGATION_PLAN.md](./SECURITY_MITIGATION_PLAN.md)

---

## 📚 Additional Resources

### Official Analyses
- [Wiz Shai-Hulud 2.0 Report](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)
- [Palo Alto Unit 42](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/)
- [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/)
- [CISA Alert](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)

### Post-Mortems from Affected Companies
- [PostHog](https://posthog.com/blog/nov-24-shai-hulud-attack-post-mortem)

### Security Tools
- [Socket.dev](https://socket.dev/) - Supply chain security
- [Snyk](https://snyk.io/) - Vulnerability scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Built-in scanning

---

## ✅ Verification Checklist

Before considering your repository secure:

- [ ] `.npmrc` file created with `ignore-scripts=true`
- [ ] GitHub Actions security workflow is running
- [ ] Dependabot is enabled and configured
- [ ] All credentials rotated (if you ran install recently)
- [ ] 2FA enabled on npm and GitHub
- [ ] Team members briefed on security procedures
- [ ] Compromise check script returns all green
- [ ] Lock files are committed and frozen
- [ ] Security monitoring is configured

---

## 🔄 Ongoing Maintenance

### Daily
- [ ] Review Dependabot PRs
- [ ] Check security alerts in GitHub

### Weekly
- [ ] Run `pnpm audit` manually
- [ ] Review dependency updates
- [ ] Check for new CVEs

### Monthly
- [ ] Rotate npm tokens
- [ ] Rotate GitHub PATs
- [ ] Full security review
- [ ] Update this documentation

---

## 💬 Questions?

- **Security Issues**: See [SECURITY.md](./SECURITY.md) for reporting
- **Implementation Help**: Open an issue with `[security]` tag
- **Urgent Security Matters**: security@yourcompany.com

---

**Last Updated**: 2025-11-30
**Next Review**: 2025-12-30
**Status**: 🟢 Active Protection Enabled
