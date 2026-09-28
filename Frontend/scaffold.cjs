const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirs = [
  'pages',
  'components/layout',
  'components/dashboard',
  'components/scan',
  'components/findings',
  'components/chains',
  'components/graph',
  'components/report',
  'components/common',
  'services',
  'store',
  'hooks',
  'types',
  'utils'
];

dirs.forEach(d => {
  const fullPath = path.join(srcDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Rename existing pages to match new spec
const pageRenames = {
  'Dashboard.tsx': 'DashboardPage.tsx',
  'Target.tsx': 'NewScanPage.tsx',
  'AssessmentRunning.tsx': 'ScanMonitorPage.tsx',
  'Findings.tsx': 'FindingsExplorerPage.tsx',
  'FindingDetails.tsx': 'FindingDetailPage.tsx',
  'Reports.tsx': 'ReportBuilderPage.tsx',
  'Settings.tsx': 'SettingsPage.tsx',
};

for (const [oldName, newName] of Object.entries(pageRenames)) {
  const oldPath = path.join(srcDir, 'pages', oldName);
  const newPath = path.join(srcDir, 'pages', newName);
  if (fs.existsSync(oldPath)) {
    // Read content to update export if needed, but for now just rename file
    fs.renameSync(oldPath, newPath);
  }
}

// Rename layout components
const layoutRenames = {
  'Header.tsx': 'Topbar.tsx'
};
for (const [oldName, newName] of Object.entries(layoutRenames)) {
  const oldPath = path.join(srcDir, 'components/layout', oldName);
  const newPath = path.join(srcDir, 'components/layout', newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
}

// Move api to services
const apiDir = path.join(srcDir, 'api');
const servicesDir = path.join(srcDir, 'services');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  apiFiles.forEach(f => {
    // Map api files to service spec where possible
    let targetName = f;
    if (f === 'client.ts') targetName = 'apiClient.ts';
    if (f === 'assessmentApi.ts') targetName = 'scanService.ts';
    if (f === 'findingsApi.ts') targetName = 'findingsService.ts';
    if (f === 'reportsApi.ts') targetName = 'reportService.ts';
    
    fs.renameSync(path.join(apiDir, f), path.join(servicesDir, targetName));
  });
  // don't delete api folder in case something is still pointing to it or if it fails
}

// Create blank pages if they don't exist
const newPages = ['LoginPage.tsx', 'ChainReviewPage.tsx', 'AttackGraphPage.tsx'];
newPages.forEach(p => {
  const file = path.join(srcDir, 'pages', p);
  if (!fs.existsSync(file)) {
    const compName = p.replace('.tsx', '');
    fs.writeFileSync(file, `import React from 'react';\n\nexport const ${compName}: React.FC = () => {\n  return <div>${compName}</div>;\n};\n`);
  }
});

// Create blank files for all missing specified components
const missingComponents = {
  'components/layout': ['PageContainer.tsx'],
  'components/dashboard': ['RiskScoreCard.tsx', 'SeverityDonutChart.tsx', 'RecentChainsList.tsx'],
  'components/scan': ['ScanConfigForm.tsx', 'ModuleCheckboxGroup.tsx', 'ModuleStatusChip.tsx', 'LiveLogViewer.tsx'],
  'components/findings': ['FindingsTable.tsx', 'FindingsFilterBar.tsx', 'FindingDetailPanel.tsx', 'CvssEditor.tsx', 'EvidenceViewer.tsx'],
  'components/chains': ['ChainCard.tsx', 'ChainReviewControls.tsx'],
  'components/graph': ['AttackGraphCanvas.tsx', 'GraphNode.tsx', 'GraphEdge.tsx', 'GraphControls.tsx'],
  'components/report': ['ReportTemplateSelector.tsx', 'ReportPreview.tsx'],
  'components/common': ['Modal.tsx', 'Table.tsx', 'Spinner.tsx']
};

for (const [dir, files] of Object.entries(missingComponents)) {
  files.forEach(f => {
    const file = path.join(srcDir, dir, f);
    if (!fs.existsSync(file)) {
      const compName = f.replace('.tsx', '');
      fs.writeFileSync(file, `import React from 'react';\n\nexport const ${compName}: React.FC = () => {\n  return <div>${compName}</div>;\n};\n`);
    }
  });
}

// Architecture layers
const emptyFiles = {
  'store': ['scanStore.ts', 'findingsStore.ts', 'graphStore.ts', 'authStore.ts'],
  'hooks': ['useScanPolling.ts', 'useFindingsFilter.ts', 'useWebSocket.ts'],
  'utils': ['cvssCalculator.ts', 'severityColors.ts', 'formatters.ts'],
  'types': ['finding.ts', 'chain.ts', 'scan.ts', 'report.ts'],
  'services': ['chainsService.ts', 'authService.ts']
};

for (const [dir, files] of Object.entries(emptyFiles)) {
  files.forEach(f => {
    const file = path.join(srcDir, dir, f);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, `// TODO: Implement ${f}\nexport {};\n`);
    }
  });
}

console.log("Scaffolding complete.");
