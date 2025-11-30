#!/bin/bash
# Shai-Hulud 2.0 Compromise Detection Script
# Run this script to check if your repository has been compromised

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Shai-Hulud 2.0 Compromise Detection Script                ║"
echo "║     Last Updated: 2025-11-30                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

COMPROMISED=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_ok() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

print_fail() {
    echo -e "${RED}[✗]${NC} $1"
    COMPROMISED=$((COMPROMISED + 1))
}

echo "Starting comprehensive security scan..."
echo ""

# Check 1: Malicious Files
print_check "Checking for known malicious files..."
if find . -type f \( -name "setup_bun.js" -o -name "bun_environment.js" \) 2>/dev/null | grep -q .; then
    print_fail "CRITICAL: Malicious files (setup_bun.js or bun_environment.js) detected!"
    find . -type f \( -name "setup_bun.js" -o -name "bun_environment.js" \) 2>/dev/null
else
    print_ok "No malicious files detected"
fi

# Check 2: Install Scripts
print_check "Checking for suspicious install scripts..."
INSTALL_SCRIPTS=$(find . -name "package.json" -not -path "*/node_modules/*" -exec grep -l "\"preinstall\"\|\"postinstall\"" {} \; 2>/dev/null || true)
if [ -n "$INSTALL_SCRIPTS" ]; then
    print_warn "Install scripts found in package.json files:"
    echo "$INSTALL_SCRIPTS" | while read -r file; do
        echo "  - $file"
        grep -A 2 "\"preinstall\"\|\"postinstall\"" "$file"
    done
    echo ""
    echo "  ℹ️  Review these scripts to ensure they are legitimate"
else
    print_ok "No install scripts found"
fi

# Check 3: Shai-Hulud String Patterns
print_check "Scanning for Shai-Hulud signature strings in source code..."
SHAI_STRINGS=$(grep -r "Shai-Hulud\|Sha1-Hulud" . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.github \
    --exclude-dir=dist \
    --exclude="*.md" \
    --exclude="*.sh" \
    --exclude=".npmrc" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.py" \
    2>/dev/null || true)
if [ -n "$SHAI_STRINGS" ]; then
    print_fail "CRITICAL: Shai-Hulud signature strings found in source code!"
    echo "$SHAI_STRINGS"
else
    print_ok "No Shai-Hulud signatures in source code"
fi

# Check 4: Suspicious Workflows
print_check "Checking GitHub workflows for persistence mechanisms..."
if [ -f ".github/workflows/discussion.yml" ] || [ -f ".github/workflows/discussion.yaml" ]; then
    print_fail "CRITICAL: Suspicious workflow file 'discussion.y[a]ml' detected (Shai-Hulud persistence)!"
elif [ -d ".github/workflows" ]; then
    DISCUSSION_TRIGGERS=$(grep -r "discussion\|Discussion" .github/workflows/ 2>/dev/null || true)
    if [ -n "$DISCUSSION_TRIGGERS" ]; then
        print_warn "Discussion-triggered workflows found (review for legitimacy):"
        echo "$DISCUSSION_TRIGGERS"
    else
        print_ok "No suspicious workflow triggers found"
    fi
else
    print_ok "No GitHub workflows directory"
fi

# Check 5: Bun Runtime (only check in user home directory)
print_check "Checking for suspicious Bun runtime installation..."
if [ -d "$HOME/.bun" ] && [ ! -f "$HOME/.bun/LEGITIMATE_INSTALL" ]; then
    BUN_VERSION=$(bun --version 2>/dev/null || echo "unknown")
    print_warn "Bun runtime found in home directory (version: $BUN_VERSION)"
    echo "  ℹ️  If you didn't install Bun intentionally, this is suspicious"
    echo "  ℹ️  Malware installs Bun to ~/.bun to execute malicious scripts"
    echo "  ℹ️  If legitimate, create: touch ~/.bun/LEGITIMATE_INSTALL"
else
    print_ok "No suspicious Bun installation in home directory"
fi

# Check 6: GitHub Repos (requires gh CLI)
if command -v gh &> /dev/null; then
    print_check "Checking GitHub for exfiltration repositories..."
    if gh auth status &> /dev/null; then
        MALICIOUS_REPOS=$(gh repo list --json name,description --limit 1000 2>/dev/null | \
            jq -r '.[] | select(.description | contains("Shai-Hulud") or contains("Sha1-Hulud") or contains("Second Coming")) | .name' 2>/dev/null || true)
        if [ -n "$MALICIOUS_REPOS" ]; then
            print_fail "CRITICAL: Malicious GitHub repositories detected!"
            echo "$MALICIOUS_REPOS" | while read -r repo; do
                echo "  - $repo (DELETE IMMEDIATELY: gh repo delete $repo --confirm)"
            done
        else
            print_ok "No malicious GitHub repositories found"
        fi
    else
        print_warn "GitHub CLI not authenticated (skipping repo check)"
        echo "  ℹ️  Run 'gh auth login' to enable this check"
    fi
else
    print_warn "GitHub CLI not installed (skipping repo check)"
    echo "  ℹ️  Install with: brew install gh (macOS) or apt install gh (Ubuntu)"
fi

# Check 7: npm Packages (requires npm)
if command -v npm &> /dev/null; then
    print_check "Checking for suspicious npm package publications..."
    NPM_USER=$(npm whoami 2>/dev/null || echo "")
    if [ -n "$NPM_USER" ]; then
        print_ok "Logged in as npm user: $NPM_USER"
        echo "  ℹ️  Manually verify recent publications at: https://www.npmjs.com/~$NPM_USER"
    else
        print_ok "Not logged into npm registry"
    fi
else
    print_warn "npm not installed (skipping npm check)"
fi

# Check 8: Recent Process History
print_check "Checking for suspicious processes..."
# Using [b]un and [t]rufflehog prevents grep from matching itself
# The brackets make the pattern match "bun" but the process shows "[b]un"
if ps aux | grep -E "[b]un|[t]rufflehog" > /dev/null; then
    print_warn "Suspicious processes detected:"
    ps aux | grep -E "[b]un|[t]rufflehog"
else
    print_ok "No suspicious processes running"
fi

# Check 9: .npmrc Protection
print_check "Verifying .npmrc security configuration..."
if [ -f "ai-intent-tracker/.npmrc" ]; then
    if grep -q "ignore-scripts=true" "ai-intent-tracker/.npmrc"; then
        print_ok "Install script protection enabled (.npmrc)"
    else
        print_warn ".npmrc exists but ignore-scripts not set"
        echo "  ℹ️  Add 'ignore-scripts=true' to .npmrc for protection"
    fi
else
    print_warn "No .npmrc file found (protection not enabled)"
    echo "  ℹ️  Create .npmrc with 'ignore-scripts=true' to block malicious scripts"
fi

# Check 10: Lock File Integrity
print_check "Verifying package lock file integrity..."
if [ -f "ai-intent-tracker/pnpm-lock.yaml" ]; then
    if git diff --quiet ai-intent-tracker/pnpm-lock.yaml 2>/dev/null; then
        print_ok "Lock file has no uncommitted changes"
    else
        print_warn "Lock file has uncommitted changes"
        echo "  ℹ️  Review changes carefully: git diff ai-intent-tracker/pnpm-lock.yaml"
    fi
else
    print_warn "No lock file found"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     SCAN RESULTS SUMMARY                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $COMPROMISED -gt 0 ]; then
    echo -e "${RED}🚨 COMPROMISE DETECTED 🚨${NC}"
    echo ""
    echo "Critical issues found: $COMPROMISED"
    echo ""
    echo "IMMEDIATE ACTIONS REQUIRED:"
    echo "1. Disconnect from network immediately"
    echo "2. Revoke ALL credentials (npm, GitHub, AWS, SSH keys)"
    echo "3. Follow incident response plan in SECURITY_MITIGATION_PLAN.md"
    echo "4. Report to:"
    echo "   - security@github.com"
    echo "   - security@npmjs.com"
    echo "   - https://www.cisa.gov/report"
    echo ""
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS DETECTED ⚠️${NC}"
    echo ""
    echo "Warning issues found: $WARNINGS"
    echo ""
    echo "RECOMMENDED ACTIONS:"
    echo "1. Review warnings above carefully"
    echo "2. Investigate any suspicious findings"
    echo "3. Enable missing security protections"
    echo "4. Run 'pnpm audit' for vulnerability scan"
    echo ""
    echo "See SECURITY_QUICK_START.md for detailed guidance"
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ ALL CHECKS PASSED ✅${NC}"
    echo ""
    echo "No compromise detected. Repository appears secure."
    echo ""
    echo "Maintain security by:"
    echo "- Running this check regularly"
    echo "- Keeping dependencies updated"
    echo "- Reviewing Dependabot PRs promptly"
    echo "- Rotating credentials monthly"
    echo ""
    exit 0
fi
