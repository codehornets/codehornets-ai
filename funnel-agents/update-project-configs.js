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

    if (project.targets && project.targets.build) {
      const buildTarget = project.targets.build;

      // Only update if it's using @nx/js:tsc
      if (buildTarget.executor === '@nx/js:tsc') {
        // Update executor
        buildTarget.executor = '@nx/webpack:webpack';

        // Add dependsOn if not exists
        if (!buildTarget.dependsOn) {
          buildTarget.dependsOn = ['^build'];
        }

        // Update options
        const options = buildTarget.options;

        // Create new options object with correct order
        const newOptions = {
          target: 'node',
          compiler: 'tsc',
          outputPath: options.outputPath,
          main: options.main,
          tsConfig: options.tsConfig,
          webpackConfig: 'webpack.config.js',
          assets: options.assets,
          generatePackageJson: true
        };

        buildTarget.options = newOptions;

        // Write back
        fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + '\n');
        console.log(`✓ Updated ${service}`);
      } else {
        console.log(`- Skipped ${service} (already using ${buildTarget.executor})`);
      }
    }
  } catch (error) {
    console.error(`✗ Error processing ${service}:`, error.message);
  }
});

console.log('\nDone!');
