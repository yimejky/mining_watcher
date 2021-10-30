const util = require('util');
const net = require("net");
const exec = util.promisify(require('child_process').exec);
const spawn = util.promisify(require('child_process').spawn);
const { isProcessRunning } = require('./helpers/isProcessRunning');
const config = require('../config');
const logger = require('./helpers/logger');

class GPUMiner {
    async isRunning() {
        return isProcessRunning(config.MINER_EXE_NAME);
    }

    async pause() {
        const isRunning = await this.isRunning();
        if (isRunning) {
            logger.log('info', `GPUMiner: pausing miner`);
            await this.setGPUState(0);
        } else {
            logger.log('info', `GPUMiner: cannot pause, miner not running`);
        }
    }

    async resume() {
        const isRunning = await this.isRunning();
        if (isRunning) {
            logger.log('info', `GPUMiner: resuming miner`);
            await this.setGPUState(1);
        } else {
            await this.spawn();
        }
    }

    async kill() {
        logger.info('info', `GPUMiner: killing miner`);
        await exec(`taskkill -F -IM ${config.MINER_EXE_NAME}`);
    }

    async spawn() {
        const isRunning = await this.isRunning();
        if (isRunning) {
            logger.log('info', `GPUMiner: cannot spawn miner, it is already running`);
            return;
        }

        logger.log('info', `GPUMiner: spawning miner`);
        // spawn(`${config.MINER_SCRIPT_PATH}`, { cwd: config.MINER_PATH, detached: false, windowsHide: true });
        spawn(`${config.MINER_SCRIPT_PATH}`, { cwd: config.MINER_PATH, detached: true, windowsHide: true });
    }

    // async getData() {
    //     return new Promise((res, rej) => {
    //         const client = new net.Socket();

    //         client.on('data', (data) => {
    //             const response = JSON.parse(data.toString('utf8'));
    //             if (response.error == null) {
    //                 logger.info('info', "GPUMiner: data");
    //                 const { result } = response;

    //                 const [, minutes, hashRate, cardStats] = result;
    //                 logger.info('info', result);
    //                 const obj = {
    //                     minutes, hashRate, cardStats
    //                 };
    //                 res(obj);
    //             }
    //             client.end();
    //         });
    
    //         client.on('close', () => {
    //             logger.info('info', "GPUMiner: connection closed");
    //         });
    
    //         client.connect(config.MINER_PORT, config.MINER_IP, () => {
    //             logger.info('info', "GPUMiner: connected");
    //             const data = {
    //                 "id": 0,
    //                 "jsonrpc": "2.0",
    //                 "method": "miner_getstat1"
    //             };
    //             client.write(`${JSON.stringify(data)}\n`);
    //         });
    //     });
    // }

    async setGPUState(state) {
        return new Promise((res, rej) => {
            const client = new net.Socket();

            client.on('data', (data) => {
                const response = JSON.parse(data.toString('utf8'));
                if (response.error == null) {
                    // logger.info('info', "GPUMiner: data");
                    const { result } = response;
                    // logger.info('info', 'Debug json:', result);
                    res(result);
                }
                client.end();
            });
            
            // client.on('close', () => {
            //     logger.info('info', "GPUMiner: connection closed");
            // });
    
            client.connect(config.MINER_PORT, config.MINER_IP, () => {
                // logger.info('info', "GPUMiner: connected");
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