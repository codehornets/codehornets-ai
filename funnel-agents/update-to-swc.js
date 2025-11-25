const fs = require('fs');
const path = require('path');

const services = [
  'api-gateway',
  'auth-service',
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
  const projectPath = path.join(__dirname, 'apps', service, 'project.json');

  if (!fs.existsSync(projectPath)) {
    console.log(`Skipping ${service} - project.json not found`);
    return;
  }

  try {
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

    if (project.targets && project.targets.build && project.targets.build.options) {
      // Change compiler from tsc to swc
      const currentCompiler = project.targets.build.options.compiler;
      if (!currentCompiler || currentCompiler === 'tsc') {
        project.targets.build.options.compiler = 'swc';
        fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + '\n');
        console.log(`✓ Updated ${service} from ${currentCompiler || 'default'} to SWC`);
      } else if (currentCompiler === 'swc') {
        console.log(`- ${service} already using SWC`);
      } else {
        console.log(`- ${service} using ${currentCompiler}`);
      }
    }
  } catch (error) {
    console.error(`✗ Error processing ${service}:`, error.message);
  }
});

console.log('\nDone!');
