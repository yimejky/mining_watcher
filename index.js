const { Monitor } = require('./src/Monitor');
const logger = require('./src/helpers/logger');

async function main() {
    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    const monitor = new Monitor();
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

    process.on('exit', () => {
        logger.log('info', `exiting code`);
        if (monitor.miner) {
            monitor.miner.kill();
        }
    });
}

main();