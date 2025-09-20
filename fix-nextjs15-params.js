const fs = require('fs');
const path = require('path');

// Find all TypeScript files in the API routes
function findApiRouteFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Check if this is a dynamic route directory (starts with [ and ends with ])
        if (item.startsWith('[') && item.endsWith(']')) {
          // This is a dynamic route directory, look for route.ts
          const routeFile = path.join(fullPath, 'route.ts');
          if (fs.existsSync(routeFile)) {
            files.push(routeFile);
          }
        } else {
          // Regular directory, traverse it
          traverse(fullPath);
        }
      } else if (stat.isFile() && item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Fix Next.js 15 async params in a file
function fixNextjs15Params(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern to match: { params }: { params: { paramName: string } }
    // Replace with: { params }: { params: Promise<{ paramName: string }> }
    const paramPattern = /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([^}]+)\s*\}\s*\}/g;

    const newContent = content.replace(paramPattern, (match, paramList) => {
      modified = true;
      return `{ params }: { params: Promise<{ ${paramList} }> }`;
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const files = findApiRouteFiles(apiDir);

  console.log(`Found ${files.length} API route files to check`);

  let fixedCount = 0;
  for (const file of files) {
    if (fixNextjs15Params(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files for Next.js 15 async params`);
}

if (require.main === module) {
  main();
}

module.exports = { findApiRouteFiles, fixNextjs15Params };