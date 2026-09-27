const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/pages');
if (fs.existsSync(pagesDir)) {
  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  files.forEach(f => {
    const filePath = path.join(pagesDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace api imports with services imports
    content = content.replace(/from\s+['"]\.\.\/api\/client['"]/g, "from '../services/apiClient'");
    content = content.replace(/from\s+['"]\.\.\/api\/assessmentApi['"]/g, "from '../services/scanService'");
    content = content.replace(/from\s+['"]\.\.\/api\/findingsApi['"]/g, "from '../services/findingsService'");
    content = content.replace(/from\s+['"]\.\.\/api\/reportsApi['"]/g, "from '../services/reportService'");
    content = content.replace(/from\s+['"]\.\.\/api\/targetApi['"]/g, "from '../services/targetApi'");
    
    fs.writeFileSync(filePath, content);
  });
  console.log("Fixed page imports");
}
