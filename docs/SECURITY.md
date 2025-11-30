# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.x.x   | :white_check_mark: | TBD            |
| < 1.0   | :x:                | N/A            |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues via one of the following methods:

1. **Preferred**: Use GitHub's [Security Advisory](../../security/advisories/new) feature
2. **Email**: Send details to `mitrovdim@gmail.com`
3. **Private disclosure**: Contact the maintainers directly

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, supply chain attack)
- Full paths of source file(s) related to the vulnerability
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact assessment (what an attacker could achieve)
- Suggested remediation (if you have ideas)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Fix Timeline**:
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: As resources permit

### Disclosure Policy

- We follow coordinated vulnerability disclosure
- Security advisories will be published after fixes are deployed
- We will credit reporters (unless they prefer to remain anonymous)

## Security Measures

### Supply Chain Security

This project implements multiple layers of protection against supply chain attacks like Shai-Hulud 2.0:

1. **Install Scripts Disabled**: All npm/pnpm install scripts are blocked via `.npmrc`
2. **Dependency Scanning**: Automated daily scans for vulnerabilities
3. **Lock File Enforcement**: All installations use frozen lock files
4. **Malware Detection**: CI/CD scans for known malicious patterns
5. **SBOM Generation**: Software Bill of Materials created for all builds
6. **Secret Scanning**: Automated detection of exposed credentials

### Development Security

- All commits should be signed with GPG keys
- Two-factor authentication required for all contributors
- Branch protection rules enforce code review
- Automated security testing in CI/CD

### Dependency Management

- Dependabot enabled for automated security updates
- Weekly dependency audits
- Pinned versions for reproducible builds
- Regular dependency updates to patch vulnerabilities

### Infrastructure Security

- Minimal Docker images (Alpine-based)
- Non-root user in containers
- Security headers enforced (CSP, HSTS, etc.)
- Rate limiting enabled on all API endpoints
- Input validation and sanitization

## Known Security Considerations

### Current Mitigations

1. **CORS Configuration**: Properly configured to prevent cross-origin attacks
2. **SQL Injection**: Using SQLAlchemy ORM with parameterized queries
3. **XSS Prevention**: Input sanitization and output encoding
4. **CSRF Protection**: CSRF tokens required for state-changing operations
5. **Rate Limiting**: Implemented to prevent abuse

### Areas for Improvement

1. **Authentication**: Currently no authentication system (demo application)
2. **Encryption**: No encryption at rest for database
3. **Audit Logging**: Limited audit trail for security events

## Security Best Practices for Contributors

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] Input validation for all user-provided data
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries to prevent SQL injection
- [ ] Proper error handling (don't leak sensitive info)
- [ ] Authentication/authorization checks where applicable
- [ ] Security headers configured correctly
- [ ] Dependencies are up-to-date and vulnerability-free

### Local Development

```bash
# Always install with frozen lockfile
pnpm install --frozen-lockfile --ignore-scripts

# Run security audit before committing
pnpm audit

# Check for secrets before committing
git diff | grep -E "npm_|ghp_|AKIA|sk-|-----BEGIN"
```

### Pre-Commit Checks

```bash
# Install pre-commit hooks
pnpm add -D husky
npx husky install

# Add security checks
npx husky add .husky/pre-commit "pnpm audit"
```

## Incident Response

In the event of a security incident:

1. **Detection**: Automated monitoring alerts or manual discovery
2. **Assessment**: Determine scope and severity (CVSS scoring)
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove vulnerability/malware
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-mortem analysis

See [SECURITY_MITIGATION_PLAN.md](./SECURITY_MITIGATION_PLAN.md) for detailed incident response procedures.

## Compliance

This project aims to comply with:

- OWASP Top 10 security risks mitigation
- GDPR data protection requirements
- npm/GitHub security best practices
- NIST Cybersecurity Framework guidelines

## Security Tools in Use

- **pnpm audit**: Vulnerability scanning
- **Dependabot**: Automated dependency updates
- **TruffleHog**: Secret detection
- **Safety**: Python dependency scanning
- **CycloneDX**: SBOM generation
- **GitHub Security**: Code scanning and secret detection

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [Shai-Hulud 2.0 Analysis](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## Contact

For security-related questions or concerns:

- Security Team: `mitrovdim@gmail.com`
- Project Maintainers: See [CODEOWNERS](./CODEOWNERS)

---

**Last Updated**: 2025-11-30
**Version**: 1.0
