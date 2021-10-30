const { GPUManager } = require('./GPUManager');
const { GPUMiner } = require('./GPUMiner');
const { isProcessRunning } = require('./helpers/isProcessRunning');
const config = require('../config');
const logger = require('./helpers/logger');

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
            logger.log('info', `GPUMonitor: already watching for changes`);
            return;
        }

        this.miner.resume();

        logger.log('info', `GPUMonitor: watching for change`);
        this.interval = setInterval(this.intervalFn.bind(this), config.REFRESH_INTERVAL_TIME);
    }

    async stop() {
        if (!this.interval) {
            logger.log('info', `GPUMonitor: watcher is not active`);
            return;
        }

        logger.log('info', `GPUMonitor: ending watcher`);
        clearInterval(this.interval);
        this.interval = null;

        await this.miner.pause();
    }

    async intervalFn() {
        const [gpuTemp, isDotaRunning, isMinerRunning] = await Promise.all([
            this.gpuManager.getGpuTemp(),
            isProcessRunning('dota'),
            this.miner.isRunning()
        ])

        const consume = `${gpuTemp.actualWatt}W/${gpuTemp.maxWatt}W`;
        logger.log('verbose', `GPUMonitor: ${consume}, D${isDotaRunning ? '1' : '0'}, S${this.isInSpectateMode ? '1' : '0'}, M${isMinerRunning ? '1' : '0'}`);

        if (!isMinerRunning) {
            this.miner.resume();
        }

        const gpuLimit = config.GPU_WATT_MINING_LIMIT + config.GPU_WATT_EPSILON;
        const isAboveLimit = gpuTemp.maxWatt > gpuLimit;
        const underLimit = gpuTemp.maxWatt < gpuLimit;

        if (this.isInSpectateMode && isAboveLimit) {
            await Promise.all([
                this.miner.resume(),
                this.gpuManager.setMiningProfile()
            ]);
        } else if (!this.isInSpectateMode && isDotaRunning && underLimit) {
            await Promise.all([
                this.miner.pause(),
                this.gpuManager.setGamingProfile()
            ]);
        } else if (!this.isInSpectateMode && !isDotaRunning && isAboveLimit) {
            await Promise.all([
                this.miner.resume(),
                this.gpuManager.setMiningProfile()
            ]);
        }
    }

    toggleSpectateMode() {
        this.isInSpectateMode = !this.isInSpectateMode;
        logger.log('info', `GPUMonitor: toggling spectate mode: ${this.isInSpectateMode}`);
    }
}

module.exports = {
    GPUMonitor,
    isProcessRunning
};