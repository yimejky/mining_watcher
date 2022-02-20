const { GPUManager } = require('./GPUManager');
const { GPUMiner } = require('./GPUMiner');
const { isSomeProcessesRunning } = require('./helpers/isProcessRunning');
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

        await this.miner.kill();
    }

    async intervalFn() {
        const [gpuInfo, isGameRunning, minerRunningStats] = await Promise.all([
            this.gpuManager.getGpuInfo(),
            isSomeProcessesRunning(config.GAMES_EXES),
            this.miner.getRunningStats()
        ]);

        const consume = `${gpuInfo.actualWatt}W/${gpuInfo.maxWatt}W`;
        logger.log('verbose', `GPUMonitor: ${consume}, D${isGameRunning ? '1' : '0'}, S${this.isInSpectateMode ? '1' : '0'}, M${minerRunningStats.isExeRunning ? '1' : '0'}`);

        const gpuConfigLimit = config.GPU_WATT_MINING_LIMIT + config.GPU_WATT_EPSILON;
        const isMaxAboveLimit = gpuInfo.maxWatt > gpuConfigLimit;
        const isMaxUnderLimit = gpuInfo.maxWatt < gpuConfigLimit;

        if (this.isInSpectateMode) {
            // spectate mode
            if (!minerRunningStats.isExeRunning) await this.miner.resume();
            if (isMaxAboveLimit) await this.gpuManager.setMiningProfile();
        } else {

            if (isGameRunning && minerRunningStats.isExeRunning) await this.miner.kill();
            if (isGameRunning && isMaxUnderLimit) await this.gpuManager.setGamingProfile();

            if (!isGameRunning && !minerRunningStats.isExeRunning) await this.miner.resume();
            if (!isGameRunning && isMaxAboveLimit) await this.gpuManager.setMiningProfile();
        }
    }

    toggleSpectateMode() {
        this.isInSpectateMode = !this.isInSpectateMode;
        logger.log('info', `GPUMonitor: toggling spectate mode: ${this.isInSpectateMode}`);
    }
}

module.exports = {
    GPUMonitor
};