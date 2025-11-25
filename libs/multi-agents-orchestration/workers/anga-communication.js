/**
 * Anga - Coding Assistant Communication
 */

const WorkerCommunicator = require('./worker-communication');

class AngaCommunicator extends WorkerCommunicator {
  constructor(options = {}) {
    super('anga', 'Coding Assistant', [
      'code',
      'programming',
      'review',
      'architecture',
      'debug',
      'refactor',
      'testing'
    ], options);
  }

  /**
   * Process tasks specific to coding
   */
  async processTask(request, details) {
    console.log(`[anga] 💻 Processing coding task...`);

    const requestLower = request.toLowerCase();

    // Code review
    if (requestLower.includes('review')) {
      return await this.reviewCode(request, details);
    }

    // Debug
    if (requestLower.includes('debug') || requestLower.includes('fix')) {
      return await this.debugCode(request, details);
    }

    // Architecture
    if (requestLower.includes('architect') || requestLower.includes('design')) {
      return await this.designArchitecture(request, details);
    }

    // Testing
    if (requestLower.includes('test')) {
      return await this.writeTests(request, details);
    }

    // General coding task
    return await super.processTask(request, details);
  }

  async reviewCode(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 20, 'Analyzing code structure...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 40, 'Checking for code smells...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 60, 'Reviewing security patterns...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 80, 'Preparing review comments...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'code_review',
      message: 'Code review completed',
      data: {
        request,
        details,
        review: {
          issues: [],
          suggestions: ['Consider adding more comments', 'Follow naming conventions'],
          security: 'No security issues found',
          quality: 'Good code quality'
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  async debugCode(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 30, 'Reproducing the issue...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 60, 'Analyzing stack trace...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 90, 'Preparing fix...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'debug',
      message: 'Issue debugged and fixed',
      data: {
        request,
        details,
        debug: {
          issue_found: 'Sample issue identified',
          fix_applied: 'Fix implemented',
          tests_passed: true
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  async designArchitecture(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 25, 'Analyzing requirements...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 50, 'Designing system architecture...');
    await this.sleep(1500);

    await this.sendTaskProgress(this.currentTask.taskId, 75, 'Creating architecture diagrams...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'architecture_design',
      message: 'Architecture design completed',
      data: {
        request,
        details,
        architecture: {
          components: ['API Gateway', 'Services', 'Database'],
          patterns: ['Microservices', 'Event-driven'],
          recommendations: 'Architecture follows best practices'
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  async writeTests(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 35, 'Analyzing code coverage...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 70, 'Writing test cases...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'write_tests',
      message: 'Tests written',
      data: {
        request,
        details,
        tests: {
          unit_tests: 10,
          integration_tests: 5,
          coverage: '85%'
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  getSupportedActions() {
    return [
      ...super.getSupportedActions(),
      'review_code',
      'debug_code',
      'design_architecture',
      'write_tests'
    ];
  }
}

// Export for use in Anga's container
module.exports = AngaCommunicator;

// If run directly, start Anga's communicator
if (require.main === module) {
  (async () => {
    const anga = new AngaCommunicator({ debug: true });

    try {
      await anga.initialize();

      console.log('\n=== Anga (Coding Assistant) Ready ===\n');

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n[anga] Shutting down...');
        await anga.shutdown();
        process.exit(0);
      });
    } catch (error) {
      console.error('[anga] Failed to initialize:', error);
      process.exit(1);
    }
  })();
}
