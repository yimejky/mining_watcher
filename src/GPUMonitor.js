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
    miner = null;
    isInSpectateMode = false;

    constructor() {
        this.gpuManager = new GPUManager();
        this.gpuManager.setMiningProfile();
        this.miner = new GPUMiner();
    }

    async start() {
        if (this.interval) {
            console.log(`GPUMonitor: already watching for changes`);
            return;
        }

        await this.miner.spawn();

        console.log(`GPUMonitor: watching for change`);
        this.interval = setInterval(async () => {
            const [gpuTemp, isDotaRunning, isMinerRunning] = await Promise.all([
                this.gpuManager.getGpuTemp(),
                isProcessRunning('dota'),
                this.miner.isRunning()
            ])
            console.log(`GPUMonitor: ${gpuTemp.actualWatt}W/${gpuTemp.maxWatt}W,  dota running ${isDotaRunning}, spectate ${this.isInSpectateMode}, miner running ${isMinerRunning}`);

            const gpuLimit = config.GPU_WATT_MINING_LIMIT + config.GPU_WATT_EPSILON;
            const isAboveLimit = gpuTemp.maxWatt > gpuLimit
            if (this.isInSpectateMode) {
                if (isAboveLimit) {
                    await Promise.all([
                        this.miner.spawn(),
                        this.gpuManager.setMiningProfile()
                    ]);
                }
            } else {
                if (isDotaRunning && gpuTemp.maxWatt < gpuLimit) {
                    await Promise.all([
                        this.miner.kill(),
                        this.gpuManager.setGamingProfile()
                    ]);
                } else if (!isDotaRunning && isAboveLimit) {
                    await Promise.all([
                        this.miner.spawn(),
                        this.gpuManager.setMiningProfile()
                    ]);
                }
            }
        }, config.REFRESH_INTERVAL_TIME);
    }

    async stop() {
        if (!this.interval) {
            console.log(`GPUMonitor: watcher is not active`);
            return;
        }

        console.log(`GPUMonitor: ending watcher`);
        clearInterval(this.interval);
        this.interval = null;

        await this.miner.kill();
        this.miner = null;
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