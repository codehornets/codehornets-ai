/**
 * Marie - Dance Teacher Assistant Communication
 */

const WorkerCommunicator = require('./worker-communication');

class MarieCommunicator extends WorkerCommunicator {
  constructor(options = {}) {
    super('marie', 'Dance Teacher Assistant', [
      'dance',
      'students',
      'choreography',
      'performance',
      'evaluation',
      'class_management'
    ], options);
  }

  /**
   * Process tasks specific to dance teaching
   */
  async processTask(request, details) {
    console.log(`[marie] 🩰 Processing dance-related task...`);

    const requestLower = request.toLowerCase();

    // Evaluate students
    if (requestLower.includes('evaluat')) {
      return await this.evaluateStudents(request, details);
    }

    // Class documentation
    if (requestLower.includes('document') || requestLower.includes('notes')) {
      return await this.documentClass(request, details);
    }

    // Choreography
    if (requestLower.includes('choreograph')) {
      return await this.organizeChoreography(request, details);
    }

    // General task
    return await super.processTask(request, details);
  }

  async evaluateStudents(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 25, 'Reviewing student performances...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 50, 'Analyzing technique and artistry...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 75, 'Preparing evaluation notes...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'student_evaluation',
      message: 'Student evaluations completed',
      data: {
        request,
        details,
        evaluations: [
          { student: 'Sample Student', score: 85, notes: 'Good technique, needs work on timing' }
        ],
        timestamp: new Date().toISOString()
      }
    };
  }

  async documentClass(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 30, 'Organizing class notes...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 70, 'Formatting documentation...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'class_documentation',
      message: 'Class documentation prepared',
      data: {
        request,
        details,
        document: 'Class notes and attendance documented',
        timestamp: new Date().toISOString()
      }
    };
  }

  async organizeChoreography(request, details) {
    await this.sendTaskProgress(this.currentTask.taskId, 40, 'Reviewing choreography structure...');
    await this.sleep(1000);

    await this.sendTaskProgress(this.currentTask.taskId, 80, 'Creating organization plan...');
    await this.sleep(1000);

    return {
      status: 'completed',
      task: 'choreography_organization',
      message: 'Choreography organized',
      data: {
        request,
        details,
        organization: 'Choreography organized and structured',
        timestamp: new Date().toISOString()
      }
    };
  }

  getSupportedActions() {
    return [
      ...super.getSupportedActions(),
      'evaluate_students',
      'document_class',
      'organize_choreography'
    ];
  }
}

// Export for use in Marie's container
module.exports = MarieCommunicator;

// If run directly, start Marie's communicator
if (require.main === module) {
  (async () => {
    const marie = new MarieCommunicator({ debug: true });

    try {
      await marie.initialize();

      console.log('\n=== Marie (Dance Teacher Assistant) Ready ===\n');

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n[marie] Shutting down...');
        await marie.shutdown();
        process.exit(0);
      });
    } catch (error) {
      console.error('[marie] Failed to initialize:', error);
      process.exit(1);
    }
  })();
}
