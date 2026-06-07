# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/health.spec.ts >> frontend loads and stumble button exists
- Location: e2e/health.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Stumble")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Stumble")')

```

# Test source

```ts
  1 | import { test, expect } from "@playwright/test";
  2 | 
  3 | test("frontend loads and stumble button exists", async ({ page }) => {
  4 |   await page.goto("http://localhost:5173");
> 5 |   await expect(page.locator("button:has-text(\"Stumble\")")).toBeVisible();
    |                                                              ^ Error: expect(locator).toBeVisible() failed
  6 | });
  7 | 
```