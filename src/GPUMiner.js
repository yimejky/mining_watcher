const util = require('util');
const net = require("net");
const exec = util.promisify(require('child_process').exec);
const spawn = util.promisify(require('child_process').spawn);
const { isProcessRunning } = require('./helpers/isProcessRunning');
const config = require('../config');
const { CMD_PATH } = require('../config');

class GPUMiner {
    async isRunning() {
        return isProcessRunning(config.MINER_EXE_NAME);
    }

    async kill() {
        console.log(`GPUMiner: killing miner`);
        await exec(`taskkill -IM ${config.MINER_EXE_NAME} -F`);
    }

    async spawn() {
        const isRunning = await this.isRunning();
        if (isRunning) {
            console.log(`GPUMiner: cannot spawn miner, it is already running`);
            return;
        }

        console.log(`GPUMiner: spawning miner`);
        spawn(`${config.MINER_SCRIPT_PATH}`, { cwd: config.MINER_PATH, detached: false, windowsHide: true });
    }

    // getData() {
    //     const client = new net.Socket();
    //     client.on('data', (data) => {
    //         const response = JSON.parse(data.toString('utf8'));
    //         if (response.error == null) {
    //             console.log("GPUMiner: data");
    //             const { result } = response;
    //             console.log(result);
    //         }
    //         client.end();
    //     });
    //     client.on('close', () => {
    //         console.log("GPUMiner: connection closed");
    //     });
    //     client.connect(this.MINER_PORT, this.MINER_IP, () => {
    //         console.log("GPUMiner: connected");
    //         const data = {
    //             "id": 0,
    //             "jsonrpc": "2.0",
    //             "method": "miner_getstat1"
    //         };
    //         client.write(`${JSON.stringify(data)}\n`);
    //     });
    // }

    // setGPUState(state) {
    //     const client = new net.Socket();
    //     client.on('data', (data) => {
    //         const response = JSON.parse(data.toString('utf8'));
    //         if (response.error == null) {
    //             console.log("GPUMiner: data");
    //             const { result } = response;
    //             console.log(result);
    //         }
    //     });
    //     client.on('close', () => {
    //         console.log("GPUMiner: connection closed");
    //     });
    //     client.connect(this.MINER_PORT, this.MINER_IP, () => {
    //         console.log("GPUMiner: connected");
    //         const data = { 
    //             "id": 0, 
    //             "jsonrpc": "2.0", 
    //             "method": "control_gpu", 
    //             "params": [0, state]
    //          };
    //         client.write(`${JSON.stringify(data)}\n`);
    //     });
    // }
}

module.exports = {
    GPUMiner
};