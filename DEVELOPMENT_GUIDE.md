# Development & Troubleshooting Guide

This guide documents key learnings from debugging and developing the Hot Choco risk heatmap application.

## Key Architecture Learnings

### 1. **Data Flow & Risk Calculation**
- **Real Data Sources**: Only bug data from Supabase and test count from Allure TestOps are available
- **No Test Execution Data**: Test coverage percentages and pass/fail results are mocked - avoid using them
- **Feature vs Screen**: Risk is calculated at the **feature level**, not screen level
- **Multiple Screens per Feature**: One feature can have multiple screens (e.g., `feature_checkout_order_submission` has Shopping Cart, Checkout, and Confirmation screens)

### 2. **React Key Management**
- **Critical Issue**: Using feature names as React keys causes "duplicate key" errors when multiple screens share the same feature
- **Solution**: Use unique node IDs or feature-level grouping with unique keys
- **Example**: `key={item.featureId}` instead of `key={item.feature}`

### 3. **Data Structure Rules**
- **Never modify feature names** in `flow.json` - they're fixed and map to real data sources
- **Feature grouping**: Multiple screens can legitimately belong to the same feature
- **Risk calculation**: Group screens by feature, then calculate risk per feature

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 20+ (use `nvm use 20`)
- **Package Manager**: pnpm (faster and more reliable than npm)
- **Browser Testing**: Playwright with MCP for automated testing

### Setup Steps
```bash
# 1. Switch to Node 20
nvm use 20

# 2. Install pnpm globally
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Start development server
pnpm dev
```

**Note**: No need to install Playwright locally - use the Playwright MCP server for testing!

## Debugging Methodology

### 1. **Server Connection Issues**
**Problem**: "This site can't be reached" errors

**Debugging Steps**:
1. **Check if server is running**: `ps aux | grep "next dev"`
2. **Check port listening**: `netstat -an | grep :3000`
3. **Test with curl**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
4. **Use Playwright MCP**: Automated browser testing to verify actual functionality

**Common Solutions**:
- Kill existing processes: `pkill -f "next dev"`
- Try different port: `pnpm dev -- --port 3001`
- Check firewall/VPN settings
- Use `127.0.0.1` instead of `localhost`

### 2. **Playwright MCP Issues**
**Problem**: Browser executable not found

**Root Cause**: Version mismatch between MCP server and installed browsers

**Solutions**:

**Option 1: Use MCP Server Only (Recommended)**
- Don't install Playwright locally
- Rely on the MCP server for all browser testing
- MCP server handles browser management automatically

**Option 2: Fix Version Compatibility (If needed)**
```bash
# Only if you need local Playwright for some reason
pnpm add @playwright/test
npx playwright install

# Fix version compatibility if needed
ln -sf /path/to/chromium-actual /path/to/chromium-expected
```

**Best Practice**: Use the MCP server for testing - it's cleaner and avoids version conflicts!

### 3. **TypeScript Compilation Errors**
**Problem**: Property doesn't exist on type errors

**Debugging Steps**:
1. **Run TypeScript check**: `npx tsc --noEmit`
2. **Check types**: Ensure interface definitions match actual data
3. **Update types**: Remove mocked properties that don't exist in real data

### 4. **React Runtime Errors**
**Problem**: Duplicate keys, component crashes

**Debugging Steps**:
1. **Check browser console**: F12 → Console for detailed error messages
2. **Verify data structure**: Ensure keys are unique across all items
3. **Test with simplified data**: Isolate the problematic component

## Testing Strategy

### 1. **Build Verification**
```bash
# Always test build before deployment
pnpm build

# Check for linting issues
pnpm lint

# Verify TypeScript compilation
npx tsc --noEmit
```

### 2. **Automated Browser Testing**
Using Playwright MCP for comprehensive testing:

**MCP Commands for Testing**:
```bash
# Navigate to page
mcp__playwright__playwright_navigate(url: "http://localhost:3000/graph")

# Take screenshot
mcp__playwright__playwright_screenshot(name: "graph-page", savePng: true)

# Click elements
mcp__playwright__playwright_click(selector: 'button:has-text("Risk Overview")')

# Test interactions
mcp__playwright__playwright_click(selector: 'button:has-text("View Details")')
```

**MCP Testing Workflow**:
1. **Start server**: `pnpm dev`
2. **Navigate**: Use MCP to open pages
3. **Interact**: Click buttons, fill forms
4. **Verify**: Take screenshots, check content
5. **Debug**: Use console logs and visual verification

**Advantages of MCP Testing**:
- ✅ No local Playwright installation needed
- ✅ No version conflicts
- ✅ Visual verification with screenshots
- ✅ Real browser environment
- ✅ No test setup configuration required

### 3. **Component Testing**
- **Test with real data**: Don't rely on mocked data for final verification
- **Test edge cases**: Empty data, no bugs, no tests
- **Test grouping logic**: Verify features with multiple screens work correctly

## Common Pitfalls & Solutions

### 1. **Don't Modify Fixed Data**
❌ **Wrong**: Changing feature names in `flow.json` to fix React keys
✅ **Right**: Use proper key management in components

### 2. **Understand Real vs Mocked Data**
❌ **Wrong**: Building features based on mocked test execution data
✅ **Right**: Only use real data sources (Supabase bugs, Allure test count)

### 3. **Feature vs Screen Confusion**
❌ **Wrong**: Calculating risk per screen
✅ **Right**: Group screens by feature, calculate risk per feature

### 4. **Dependency Management**
❌ **Wrong**: Using npm with Node 18
✅ **Right**: Use pnpm with Node 20 for better performance and compatibility

## Risk Calculation Formula

### Enhanced Algorithm (Real Data Only)
```typescript
// Risk Score = Bug Risk (70%) + Test Coverage Risk (30%)
riskScore = (bugRiskScore * 0.7) + (testCoverageRisk * 0.3)

// Bug Risk Score
bugVolumeScore = Math.min(openBugCount * 3, 30) // Capped at 30
severityScore = sum of:
  - Critical bugs: 20 points each
  - High bugs: 12 points each  
  - Medium bugs: 6 points each
  - Low bugs: 2 points each

// Test Coverage Risk (inverse relationship)
testCoverageRisk = 
  - 0 tests: 30 points
  - 1-5 tests: 20 points
  - 6-10 tests: 10 points
  - 11+ tests: 0 points
```

## Performance Optimization

### 1. **Build Time**
- Use Turbopack: `next dev --turbopack`
- Optimize dependencies: Use pnpm for faster installs
- Node 20: Better performance than 18

### 2. **Runtime Performance**
- Group data processing: Don't recalculate risk for each render
- Use proper React keys: Avoid unnecessary re-renders
- Lazy load heavy components: Use React.lazy for modals

## Production Readiness Checklist

- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No linting issues: `pnpm lint`
- [ ] **🚨 CRITICAL: App functionality verified with MCP after ALL changes**
- [ ] All features tested with real data
- [ ] Risk calculation works correctly
- [ ] Modals open and close properly
- [ ] No React key warnings in console
- [ ] Responsive design works on different screen sizes

## Environment Configuration

### Required Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_ALLURE_TESTOPS_URL=https://choco.testops.cloud
NEXT_PUBLIC_ALLURE_TESTOPS_API_KEY=your-api-key
```

### Service Configuration
- **Supabase**: Real bug data with severity levels
- **Allure TestOps**: Real test case counts and metadata
- **Mock Services**: Available for development when real services are unavailable

## Debugging Tools

### 1. **Playwright MCP (Primary Testing Tool)**
- **Navigate**: `mcp__playwright__playwright_navigate(url)`
- **Screenshot**: `mcp__playwright__playwright_screenshot(name, savePng: true)`
- **Click**: `mcp__playwright__playwright_click(selector)`
- **Fill Forms**: `mcp__playwright__playwright_fill(selector, value)`
- **Get Content**: `mcp__playwright__playwright_get_visible_text()`
- **Console**: `mcp__playwright__playwright_console_logs()`

**MCP Testing Tips**:
- Use `headless: false` for visual debugging
- Save screenshots with `savePng: true` for documentation
- Use descriptive names for screenshots
- Test both happy path and error scenarios
- Screenshots save to `~/Downloads` by default
- Use `playwright_get_visible_text()` to verify content
- Check `playwright_console_logs()` for JavaScript errors

### 2. **Browser DevTools**
- **Console**: React warnings, JavaScript errors
- **Network**: API calls, failed requests
- **React DevTools**: Component state inspection

### 3. **Command Line**
- **Process monitoring**: `ps aux | grep next`
- **Port checking**: `netstat -an | grep :3000`
- **HTTP testing**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`

## Playwright MCP Best Practices

### Testing Workflow with MCP
```bash
# 1. Start your app
pnpm dev

# 2. Test basic functionality
mcp__playwright__playwright_navigate(url: "http://localhost:3000/graph")
mcp__playwright__playwright_screenshot(name: "initial-load")

# 3. Test Risk Overview feature
mcp__playwright__playwright_click(selector: 'button:has-text("Risk Overview")')
mcp__playwright__playwright_screenshot(name: "risk-overview-open")

# 4. Test detailed modal
mcp__playwright__playwright_click(selector: 'button:has-text("View Details")')
mcp__playwright__playwright_screenshot(name: "feature-detail-modal")

# 5. Verify console is clean
mcp__playwright__playwright_console_logs(type: "error")
```

### MCP vs Local Playwright

| Aspect | MCP Server | Local Playwright |
|--------|------------|------------------|
| **Setup** | ✅ Zero setup | ❌ Requires installation |
| **Version conflicts** | ✅ None | ❌ Common issue |
| **Browser management** | ✅ Automatic | ❌ Manual |
| **Visual debugging** | ✅ Screenshots | ❌ Headless mainly |
| **CI/CD** | ✅ Ready | ❌ Needs configuration |
| **Maintenance** | ✅ Handled by MCP | ❌ Manual updates |

### Common MCP Testing Patterns

**1. Page Load Verification**
```bash
# Navigate and verify page loads
mcp__playwright__playwright_navigate(url: "http://localhost:3000/graph")
mcp__playwright__playwright_get_visible_text() # Check for expected content
```

**2. Feature Testing**
```bash
# Test interactive features
mcp__playwright__playwright_click(selector: 'button:has-text("Risk Overview")')
mcp__playwright__playwright_screenshot(name: "feature-test")
```

**3. Error Detection**
```bash
# Check for JavaScript errors
mcp__playwright__playwright_console_logs(type: "error")
```

**4. Visual Regression**
```bash
# Save screenshots for comparison
mcp__playwright__playwright_screenshot(name: "baseline-graph-page", savePng: true)
```

### Why MCP is Superior for This Project

1. **No dependency management**: No need to keep Playwright versions in sync
2. **Clean project**: No test frameworks cluttering the codebase
3. **Visual feedback**: Screenshots automatically saved for debugging
4. **Real browser testing**: Full browser environment, not just unit tests
5. **Immediate feedback**: No test setup, just run commands
6. **Documentation**: Screenshots serve as living documentation

## Future Enhancements

### When Test Execution Data Becomes Available
1. **Update risk calculation**: Include test pass/fail rates
2. **Enhanced coverage**: Real coverage percentages
3. **Trend analysis**: Historical test stability
4. **Predictive risk**: Based on test failure patterns

### Scalability Considerations
- **Data caching**: Cache risk calculations for better performance
- **Pagination**: Handle large numbers of features
- **Real-time updates**: WebSocket connections for live data
- **Export functionality**: CSV/PDF reports of risk data

---

This guide should be updated as new patterns and solutions are discovered during development.