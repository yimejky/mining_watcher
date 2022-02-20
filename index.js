const { GPUMonitor } = require('./src/GPUMonitor');

async function main() {
    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    const monitor = new GPUMonitor();
    await monitor.start();

    rl.on('line', async (line) => {
        const cmd = line.trim();

        if (['exit', 'e'].includes(cmd)) {
            await monitor.stop()
            rl.close();
            return;
        }
        if (['pause', 'p'].includes(cmd)) {
            await monitor.stop();
        }
        if (['start', 'resume', 's', 'r'].includes(cmd)) {
            await monitor.start();
        }
        if (['spectate', 'spec'].includes(cmd)) {
            monitor.toggleSpectateMode();
        }

        rl.prompt();
    });

    rl.on('close', () => {
        process.exit(0);
    });
    
    rl.prompt();

    // TODO on process exit, clear miner
}

main();