# Publishing Puppeteer+ MarTech to npm

This document provides instructions for publishing the package to npm.

## Problem with @modelcontextprotocol scope

You encountered an error when trying to publish with the @modelcontextprotocol scope because you don't have permission to publish to this organization. The package has been reconfigured to use an unscoped name `puppeteer-plus-martech` instead.

## Steps to Publish

1. **Make the publishing script executable**:
   ```bash
   chmod +x publish-unscoped.sh
   ```

2. **Run the publishing script**:
   ```bash
   ./publish-unscoped.sh
   ```

3. **Follow the prompts** to confirm and publish the package.

## Alternative Manual Publishing

If you prefer to publish manually:

1. **Verify your npm account**:
   ```bash
   npm whoami
   ```
   
   If this doesn't show your username, log in with:
   ```bash
   npm login
   ```

2. **Test the package**:
   ```bash
   npm pack --dry-run
   ```

3. **Publish the package**:
   ```bash
   npm publish
   ```

## Using Your Own Scope

If you want to use your own npm username as the scope:

1. **Edit package.json** to change the name to:
   ```json
   "name": "@yourusername/puppeteer-plus-martech"
   ```

2. **Make sure the publishConfig has public access**:
   ```json
   "publishConfig": {
     "access": "public"
   }
   ```

3. **Publish with your scope**:
   ```bash
   npm publish
   ```

## After Publishing

Once published, users can install your package with:

```bash
npm install puppeteer-plus-martech
```

And use it with:

```bash
npx puppeteer-plus-martech
```

In Claude Desktop, they can configure it in their `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puppeteer-plus-martech": {
      "command": "npx",
      "args": [
        "-y",
        "puppeteer-plus-martech"
      ]
    }
  }
}
```
