/**
 * Advanced Example: Multi-agent orchestration
 *
 * This example demonstrates:
 * - Broadcasting to multiple agents
 * - Different message types
 * - Error handling
 * - Strategy selection
 */

const AgentBridge = require('../src/index');

async function main() {
  // Initialize bridge
  const bridge = new AgentBridge({
    strategy: 'auto',
    retryAttempts: 3,
    retryDelay: 1000,
    debug: true
  });

  console.log('🚀 Docker Agent Bridge - Advanced Example\n');

  const workers = [
    'codehornets-worker-marie',
    'codehornets-worker-anga',
    'codehornets-worker-fabien'
  ];

  try {
    // Step 1: Check which containers are running
    console.log('🔍 Checking container status...\n');

    const statuses = await Promise.all(
      workers.map(async (name) => {
        const running = await bridge.isContainerRunning(name);
        return { name, running };
      })
    );

    const runningWorkers = statuses.filter(s => s.running).map(s => s.name);
    const stoppedWorkers = statuses.filter(s => !s.running).map(s => s.name);

    console.log(`✅ Running containers: ${runningWorkers.length}`);
    runningWorkers.forEach(name => console.log(`   - ${name}`));

    if (stoppedWorkers.length > 0) {
      console.log(`\n⚠️  Stopped containers: ${stoppedWorkers.length}`);
      stoppedWorkers.forEach(name => console.log(`   - ${name}`));
    }

    if (runningWorkers.length === 0) {
      console.error('\n❌ No worker containers are running');
      console.log('💡 Start them with: docker-compose up -d');
      process.exit(1);
    }

    // Step 2: Broadcast announcement
    console.log('\n📡 Broadcasting announcement to all workers...\n');

    const announcement = {
      type: 'announcement',
      message: 'System maintenance will begin in 5 minutes',
      priority: 'high',
      timestamp: new Date().toISOString()
    };

    const broadcastResults = await bridge.broadcast(runningWorkers, announcement, {
      from: 'orchestrator'
    });

    const successful = broadcastResults.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Broadcast complete: ${successful}/${runningWorkers.length} successful\n`);

    // Step 3: Send individual tasks
    console.log('📋 Assigning individual tasks...\n');

    const tasks = [
      {
        worker: 'codehornets-worker-marie',
        task: {
          type: 'task',
          action: 'evaluate_students',
          details: 'Evaluate dance performance for Spring Recital',
          deadline: '2025-12-01'
        }
      },
      {
        worker: 'codehornets-worker-anga',
        task: {
          type: 'task',
          action: 'code_review',
          details: 'Review PR #123 - Authentication system refactor',
          priority: 'high'
        }
      },
      {
        worker: 'codehornets-worker-fabien',
        task: {
          type: 'task',
          action: 'create_campaign',
          details: 'Q1 Marketing campaign for new product launch',
          budget: '$50,000'
        }
      }
    ];

    for (const { worker, task } of tasks) {
      // Only send if worker is running
      if (!runningWorkers.includes(worker)) {
        console.log(`⏭️  Skipping ${worker} (not running)`);
        continue;
      }

      try {
        const result = await bridge.send(worker, task, {
          from: 'orchestrator',
          id: `task-${Date.now()}`
        });

        console.log(`✅ Task sent to ${worker}: ${task.action}`);
      } catch (error) {
        console.error(`❌ Failed to send task to ${worker}: ${error.message}`);
      }
    }

    // Step 4: Send urgent message with specific strategy
    console.log('\n⚡ Sending urgent message with TTY injection...\n');

    if (runningWorkers.includes('codehornets-worker-anga')) {
      const urgentBridge = new AgentBridge({
        strategy: 'tty',
        debug: true
      });

      try {
        await urgentBridge.send(
          'codehornets-worker-anga',
          '🚨 URGENT: Critical security update required!',
          {
            from: 'orchestrator',
            prefix: '🚨'
          }
        );

        console.log('✅ Urgent message delivered');
      } catch (error) {
        console.log('⚠️  TTY injection failed, falling back to auto strategy');

        await bridge.send(
          'codehornets-worker-anga',
          '🚨 URGENT: Critical security update required!',
          { from: 'orchestrator' }
        );
      }
    }

    console.log('\n✨ Advanced example completed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

main();
