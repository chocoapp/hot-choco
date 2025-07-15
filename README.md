# Hot Choco - User Flow Quality Visualization

A Next.js application that visualizes user flows with integrated quality metrics and risk assessment. This tool displays interactive flow diagrams where each screen is mapped to product documentation, test results, and bug reports to create a comprehensive quality/risk heatmap.

## Features

- **Interactive Flow Visualization**: React Flow-based diagrams showing user journey screens
- **Quality Metrics Integration**: Real-time display of test coverage, bug counts, and risk levels
- **Risk-Based Color Coding**: Visual heatmap using green/yellow/red color scheme
- **Product Hierarchy Mapping**: Structured product/section/feature organization
- **Extensible Architecture**: Ready for Supabase vector DB and Allure TestOps integration

## Architecture Overview

### Core Components

```
├── app/
│   ├── graph/page.tsx           # Main flow visualization page
│   └── layout.tsx               # App layout
├── components/
│   ├── SimpleFlowNode.tsx       # Flow node component with risk colors
│   ├── NodeDetailsPanel.tsx     # Detailed node information panel
│   └── CircularFlowNode.tsx     # Alternative circular node component
├── services/
│   ├── supabaseService.ts       # Product docs & bug reports integration
│   ├── allureService.ts         # Test results & coverage integration
│   └── qualityService.ts        # Risk calculation & metrics aggregation
├── types/
│   └── flow.ts                  # TypeScript type definitions
├── utils/
│   └── layoutUtils.ts           # Auto-layout algorithms using Dagre
└── public/
    └── flow.json                # Flow data with quality metrics
```

### Data Structure

Each screen node contains:
- **Screen metadata**: Label, URL, role, description, actions, prerequisites
- **Product hierarchy**: Product, section, feature mapping
- **Quality metrics**: Test coverage, bug count, risk level, test results

### Service Architecture

- **SupabaseService**: Vector DB integration for product documentation and bug reports
- **AllureService**: TestOps integration for test execution data and coverage metrics
- **QualityService**: Aggregates data from both services to calculate risk levels

## Risk Level Calculation

The risk level is calculated using a weighted scoring system in `QualityServiceImpl.calculateRiskLevel()`:

### Scoring Components:
1. **Test Coverage (40% weight):**
   - < 60% coverage: +40 risk points
   - 60-79% coverage: +20 risk points  
   - ≥ 80% coverage: +0 risk points

2. **Bug Count (60% weight):**
   - 0 bugs: +0 risk points
   - 1-2 bugs: +20 risk points
   - 3-5 bugs: +40 risk points
   - 6+ bugs: +60 risk points

### Risk Level Classification:
- **≤ 20 points**: 🟢 **Low Risk**
- **21-50 points**: 🟡 **Medium Risk**  
- **51+ points**: 🔴 **High Risk**

### Example Calculations:

**Phone Login (Medium Risk):**
- Test coverage: 85% → 0 points
- Bug count: 2 → 20 points
- **Total: 20 points = Medium Risk**

**Order Guide (High Risk):**
- Test coverage: 72% → 20 points
- Bug count: 3 → 40 points
- **Total: 60 points = High Risk**

**Inbox (Low Risk):**
- Test coverage: 95% → 0 points
- Bug count: 0 → 0 points
- **Total: 0 points = Low Risk**

## Implementation Progress

### ✅ Completed Tasks
1. **Extended FlowNodeData type** with product/section/feature hierarchy
2. **Mapped existing screens** to product/section/feature structure
3. **Created data integration service interfaces** for Supabase and Allure
4. **Updated flow.json** with new hierarchical structure and quality metrics
5. **Enhanced NodeDetailsPanel** to show quality metrics and product hierarchy
6. **Added risk-based color coding** to flow visualization nodes
7. **Tested application** and verified all features work with mock data

### 🔄 Next Steps
- Connect real Supabase vector DB for product documentation
- Integrate with Allure TestOps for live test data
- Add real-time quality metrics updates
- Implement filtering by risk level, product, or coverage
- Create aggregate quality dashboards and reports

## Getting Started

1. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

2. **Run the development server:**
```bash
npm run dev
# or
pnpm dev
```

3. **Open the application:**
- Main page: [http://localhost:3000](http://localhost:3000)
- Flow visualization: [http://localhost:3000/graph](http://localhost:3000/graph)

4. **Build for production:**
```bash
npm run build
```

## Usage

### Viewing Flow Visualization
1. Navigate to `/graph` to see the interactive flow diagram
2. Nodes are color-coded by risk level (green/yellow/red)
3. Click any node to see detailed information in the side panel
4. Use the minimap and controls for navigation

### Understanding Quality Metrics
- **Test Coverage**: Progress bar showing percentage of tests passing
- **Bug Count**: Badge showing number of open bugs
- **Risk Level**: Color-coded badge (Low/Medium/High)
- **Test Results**: Breakdown of passed/failed/skipped tests

### Product Hierarchy
Each screen is mapped to:
- **Product**: High-level product area (e.g., "authentication", "ordering-system")
- **Section**: Functional section (e.g., "login", "checkout", "catalog")
- **Feature**: Specific feature (e.g., "phone-login", "product-browsing")

This structure enables direct mapping to documentation, tests, and bug reports stored in external systems.

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Visualization**: React Flow, Dagre (auto-layout)
- **Styling**: Tailwind CSS
- **Data Sources**: Supabase (vector DB), Allure TestOps
- **Build**: Turbopack

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.