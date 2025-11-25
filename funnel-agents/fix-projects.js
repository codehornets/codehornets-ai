const fs = require('fs');
const path = require('path');

const services = [
  'crm-service',
  'campaigns-service',
  'content-service',
  'agents-service',
  'tasks-service',
  'automations-service',
  'reports-service',
  'worker-runner',
  'scheduler'
];

services.forEach(service => {
  const projectPath = path.join('apps', service, 'project.json');
  if (!fs.existsSync(projectPath)) {
    console.log(`Skipping ${service} - project.json not found`);
    return;
  }

  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  
  if (project.targets && project.targets.build) {
    const buildTarget = project.targets.build;
    
    // Update executor
    buildTarget.executor = '@nx/webpack:webpack';
    
    // Add dependsOn if not exists
    if (!buildTarget.dependsOn) {
      buildTarget.dependsOn = ['^build'];
    }
    
    // Update options
    const options = buildTarget.options;
    options.target = 'node';
    options.compiler = 'tsc';
    options.webpackConfig = 'webpack.config.js';
    options.generatePackageJson = true;
    
    // Write back
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + '\n');
    console.log(`Updated ${service}`);
  }
});

console.log('Done!');
