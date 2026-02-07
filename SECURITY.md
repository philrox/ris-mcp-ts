# Security Policy

The RIS MCP Server project takes security seriously. We appreciate your efforts to responsibly disclose vulnerabilities and will make every effort to acknowledge and address them promptly.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, send an email to **[security@philrox.at](mailto:security@philrox.at)** with the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Affected version(s)
- Potential impact assessment
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours of your report
- **Initial assessment**: Within 7 days
- **Resolution target**: Within 90 days, depending on severity

We will keep you informed of progress toward a fix and may ask for additional information.

## Scope

### In Scope

- Vulnerabilities in the MCP server code (`ris-mcp-ts`)
- Server-Side Request Forgery (SSRF) or injection issues
- Information disclosure through the server
- Dependency vulnerabilities affecting this project
- Input validation bypasses

### Out of Scope

- Issues in the upstream RIS API itself (`data.bka.gv.at`)
- General MCP protocol specification issues (report to the [MCP project](https://github.com/modelcontextprotocol))
- Denial of service attacks against the RIS API
- Social engineering attacks
- Issues in third-party dependencies without a demonstrated impact on this project

## Security Measures

This project implements the following security measures:

- **Input validation**: All tool inputs are validated using [Zod](https://zod.dev/) schemas before processing
- **URL allowlisting**: Document fetching is restricted to known RIS API endpoints
- **No credential storage**: The server accesses the publicly available RIS API and does not handle authentication credentials
- **Character limits**: Response content is capped at 25,000 characters to prevent resource exhaustion

## Disclosure Policy

We follow coordinated disclosure. We ask that you:

1. Give us reasonable time to address the issue before public disclosure
2. Make a good faith effort to avoid impacting other users
3. Do not access or modify data that does not belong to you

We will credit reporters who follow responsible disclosure (unless you prefer to remain anonymous).
