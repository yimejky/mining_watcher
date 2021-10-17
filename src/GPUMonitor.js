const { GPUManager } = require('./GPUManager');
const { GPUMiner } = require('./GPUMiner');
const { isProcessRunning } = require('./helpers/isProcessRunning');
const config = require('../config');

const PROFILES = {
    MINING: 'MINING',
    GAMING: 'GAMING'
}

class GPUMonitor {
    interval = null;
    gpuManager = null;
    isInSpectateMode = false;

    constructor() {
        this.gpuManager = new GPUManager();
        this.gpuManager.setMiningProfile();
    }

    async start() {
        if (this.interval) {
            console.log(`GPUMonitor: already watching for changes`);
            return;
        }

        const miner = new GPUMiner();
        await miner.spawn();

        console.log(`GPUMonitor: watching for change`);
        this.interval = setInterval(async () => {
            const gpuTemp = await this.gpuManager.getGpuTemp();
            const isDotaRunning = await isProcessRunning('dota');
            const isMinerRunning = await miner.isRunning();
            console.log(`GPUMonitor: ${gpuTemp.actualWatt}W/${gpuTemp.maxWatt}W,  dota running ${isDotaRunning}, spectate ${this.isInSpectateMode}, miner running ${isMinerRunning}`);

            const gpuLimit = config.GPU_WATT_MINING_LIMIT + config.GPU_WATT_EPSILON;
            const isAboveLimit = gpuTemp.maxWatt > gpuLimit
            if (this.isInSpectateMode) {
                if (isAboveLimit) {
                    await miner.spawn();
                    await this.gpuManager.setMiningProfile();
                }
            } else {
                if (isDotaRunning && gpuTemp.maxWatt < gpuLimit) {
                    await miner.kill();
                    await this.gpuManager.setGamingProfile();
                } else if (!isDotaRunning && isAboveLimit) {
                    await miner.spawn();
                    await this.gpuManager.setMiningProfile();
                }
            }
        }, config.REFRESH_INTERVAL_TIME);
    }

    stop() {
        if (!this.interval) {
            console.log(`GPUMonitor: watcher is not active`);
            return;
        }

        console.log(`GPUMonitor: ending watcher`);
        clearInterval(this.interval);
        this.interval = null;
    }

    toggleSpectateMode() {
        this.isInSpectateMode = !this.isInSpectateMode;
        console.log(`GPUMonitor: toggling spectate mode: ${this.isInSpectateMode}`);
    }
}

module.exports = {
    GPUMonitor,
    isProcessRunning
};