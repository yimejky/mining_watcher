const util = require('util');
const net = require("net");
const exec = util.promisify(require('child_process').exec);
const spawn = util.promisify(require('child_process').spawn);
const { isProcessRunning } = require('./helpers/isProcessRunning');
const config = require('../config');
const logger = require('./helpers/logger');

class GPUMiner {
    async getRunningStats() {
        const isMinerRunning = await isProcessRunning(config.MINER_EXE_NAME);
        const data = await this.getData();

        const hashRate = data ? Number.parseInt(data.cardStats) : 0;
        const minutes = data ? Number.parseInt(data.minutes) : 0;
        return { isExeRunning: isMinerRunning, hasData: !!data, minutes, hashRate: hashRate };
    }

    async pause() {
        const runningStats = await this.getRunningStats();
        if (runningStats.isExeRunning) {
            logger.log('info', `GPUMiner: pausing miner`);
            await this.setGPUState(0);
        } else {
            logger.log('info', `GPUMiner: cannot pause, miner not running`);
        }
    }

    async resume() {
        const runningStats = await this.getRunningStats();
        if (runningStats.isExeRunning) {
            logger.log('info', `GPUMiner: resuming miner`);
            await this.setGPUState(1);
        } else {
            await this.spawn();
        }
    }

    async kill() {
        logger.log('info', `GPUMiner: killing miner`);
        await exec(`taskkill -F -IM ${config.MINER_EXE_NAME}`);
    }

    async spawn() {
        const runningStats = await this.getRunningStats();
        if (runningStats.isExeRunning) {
            logger.log('info', `GPUMiner: cannot spawn miner, it is already running`);
            return;
        }

        logger.log('info', `GPUMiner: spawning miner`);
        // spawn(`${config.MINER_SCRIPT_PATH}`, { cwd: config.MINER_PATH, detached: false, windowsHide: true });
        spawn(`${config.MINER_SCRIPT_PATH}`, { cwd: config.MINER_PATH, detached: false, windowsHide: config.SHOW_MINER_WINDOW });
    }

    async getData() {
        return new Promise((res, rej) => {
            const client = new net.Socket();

            client.on('data', (data) => {
                const response = JSON.parse(data.toString('utf8'));
                if (response.error == null) {
                    logger.log('debug', "GPUMiner.socket: data");
                    const { result } = response;

                    const [, minutes, hashRate, cardStats] = result;
                    logger.log('debug', `GPUMiner.socket: ${JSON.stringify(result, null, 2)}`);
                    const obj = {
                        minutes, hashRate, cardStats
                    };
                    res(obj);
                }
                client.end();
            });
    
            client.on('close', () => {
                logger.log('debug', "GPUMiner.socket: connection closed");
            });

            client.on('error', (error) => {
                logger.log('debug', "GPUMiner.socket: connection error");
                res(false);
            });

            client.connect(config.MINER_PORT, config.MINER_IP, () => {
                logger.log('debug', "GPUMiner.socket: connected");
                const data = {
                    "id": 0,
                    "jsonrpc": "2.0",
                    "method": "miner_getstat1"
                };
                client.write(`${JSON.stringify(data)}\n`);
            });
        });
    }

    async setGPUState(state) {
        return new Promise((res, rej) => {
            const client = new net.Socket();

            client.on('data', (data) => {
                const response = JSON.parse(data.toString('utf8'));
                if (response.error == null) {
                    // logger.log('info', "GPUMiner: data");
                    const { result } = response;
                    // logger.log('info', 'Debug json:', result);
                    res(result);
                }
                client.end();
            });
            
            // client.on('close', () => {
            //     logger.log('info', "GPUMiner: connection closed");
            // });
    
            client.connect(config.MINER_PORT, config.MINER_IP, () => {
                // logger.log('info', "GPUMiner: connected");
                const data = { 
                    "id": 0, 
                    "jsonrpc": "2.0", 
                    "method": "control_gpu", 
                    "params": [0, state]
                 };
                client.write(`${JSON.stringify(data)}\n`);
            });
        })
    }
}

module.exports = {
    GPUMiner
};