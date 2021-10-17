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

    rl.on('line', (line) => {
        const cmd = line.trim();

        if (cmd === 'exit' || cmd === 'e') {
            monitor.stop()
            rl.close();
            return;
        }
        if (cmd === 'pause' || cmd === 'p') {
            monitor.stop();
        }
        if (cmd === 'start' || cmd === 's') {
            monitor.start();
        }

        rl.prompt();
    });

    rl.on('close', () => {
        process.exit(0);
    });
    
    rl.prompt();
}

main();