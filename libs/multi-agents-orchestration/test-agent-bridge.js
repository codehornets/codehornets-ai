#!/usr/bin/env node

/**
 * Test Script for Agent Bridge Integration
 *
 * This script demonstrates and tests the docker-agent-bridge
 * integration with the CodeHornets orchestration system.
 */

const OrchestratorCommunicator = require('./orchestrator/agent-communication');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  CodeHornets Agent Bridge Integration Test                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize orchestrator
  const orchestrator = new OrchestratorCommunicator({ debug: true });

  try {
    console.log('🚀 Initializing orchestrator...\n');
    await orchestrator.initialize();

    console.log('\n📊 Checking worker statuses...\n');
    const statuses = await orchestrator.getAgentStatuses();

    console.log('Agent Statuses:');
    Object.entries(statuses).forEach(([agent, status]) => {
      const icon = status === 'running' ? '✅' : status === 'self' ? '🎯' : '❌';
      console.log(`  ${icon} ${agent}: ${status}`);
    });

    // Test 1: Send task to Marie
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Delegate task to Marie (Dance Teacher)');
    console.log('='.repeat(60));

    const task1 = await orchestrator.delegateTask(
      'Evaluate student performances for Spring Recital',
      { priority: 'high' }
    );

    if (task1.success) {
      console.log(`✅ Task ${task1.taskId} assigned to ${task1.worker}`);
    } else {
      console.error(`❌ Task failed: ${task1.error}`);
    }

    // Wait a bit
    await sleep(2000);

    // Test 2: Send task to Anga
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Delegate task to Anga (Coding Assistant)');
    console.log('='.repeat(60));

    const task2 = await orchestrator.delegateTask(
      'Review code for authentication system PR #123',
      { priority: 'high' }
    );

    if (task2.success) {
      console.log(`✅ Task ${task2.taskId} assigned to ${task2.worker}`);
    } else {
      console.error(`❌ Task failed: ${task2.error}`);
    }

    await sleep(2000);

    // Test 3: Send task to Fabien
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Delegate task to Fabien (Marketing Assistant)');
    console.log('='.repeat(60));

    const task3 = await orchestrator.delegateTask(
      'Create marketing campaign for Q1 product launch',
      { priority: 'normal', budget: '$50,000' }
    );

    if (task3.success) {
      console.log(`✅ Task ${task3.taskId} assigned to ${task3.worker}`);
    } else {
      console.error(`❌ Task failed: ${task3.error}`);
    }

    await sleep(2000);

    // Test 4: Broadcast announcement
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Broadcast announcement to all workers');
    console.log('='.repeat(60));

    const broadcastResult = await orchestrator.announceToWorkers(
      'System maintenance will begin in 10 minutes. Please complete current tasks.',
      { priority: 'urgent' }
    );

    const successful = broadcastResult.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Broadcast sent to ${successful} workers`);

    await sleep(2000);

    // Test 5: Request status from a worker (if available)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Request status from Anga');
    console.log('='.repeat(60));

    if (statuses['worker-anga'] === 'running') {
      try {
        const angaStatus = await orchestrator.requestWorkerStatus('anga');
        console.log('✅ Anga status:', JSON.stringify(angaStatus, null, 2));
      } catch (error) {
        console.log('⚠️  Could not get Anga status (may be busy)');
      }
    } else {
      console.log('⚠️  Anga is not running, skipping status request');
    }

    await sleep(2000);

    // Show statistics
    console.log('\n' + '='.repeat(60));
    console.log('STATISTICS');
    console.log('='.repeat(60));

    const stats = orchestrator.getStatistics();
    console.log(`Total tasks: ${stats.total}`);
    console.log(`Active tasks: ${stats.active}`);
    console.log(`Completed tasks: ${stats.completed}`);

    console.log('\nActive Tasks:');
    const activeTasks = orchestrator.getActiveTasks();
    if (activeTasks.length === 0) {
      console.log('  (none)');
    } else {
      activeTasks.forEach(task => {
        console.log(`  - ${task.taskId}: ${task.request} (${task.status})`);
      });
    }

    console.log('\nCompleted Tasks:');
    const completedTasks = orchestrator.getCompletedTasks();
    if (completedTasks.length === 0) {
      console.log('  (none yet)');
    } else {
      completedTasks.forEach(task => {
        console.log(`  - ${task.taskId}: ${task.request} (✅ completed)`);
      });
    }

    // Wait for results (optional)
    console.log('\n💡 Listening for task results for 10 seconds...');
    console.log('   (Workers will send results when tasks complete)\n');

    await sleep(10000);

    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('FINAL STATISTICS');
    console.log('='.repeat(60));

    const finalStats = orchestrator.getStatistics();
    console.log(`Total tasks: ${finalStats.total}`);
    console.log(`Active tasks: ${finalStats.active}`);
    console.log(`Completed tasks: ${finalStats.completed}`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Test Complete!                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Cleanup
    await orchestrator.shutdown();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    await orchestrator.shutdown();
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
