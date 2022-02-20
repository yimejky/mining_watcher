const { GPUManager } = require('./GPUManager');
const { GPUMiner } = require('./GPUMiner');
const { isSomeProcessesRunning } = require('./helpers/isProcessRunning');
const config = require('../config');
const logger = require('./helpers/logger');

class Monitor {
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
            logger.log('info', `Monitor: already watching for changes`);
            return;
        }

        logger.log('info', `Monitor: watching for change`);
        this.interval = setInterval(this.intervalFn.bind(this), config.REFRESH_INTERVAL_TIME);
    }

    async stop() {
        if (!this.interval) {
            logger.log('info', `Monitor: watcher is not active`);
            return;
        }

        logger.log('info', `Monitor: ending watcher`);
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
        logger.log('verbose', `Monitor: ----------------------`);
        logger.log('verbose', `Monitor: GPU ${consume}`);
        logger.log('verbose', `Monitor: ${minerRunningStats.isExeRunning ? 'Miner Online' : 'Miner Offline'}`);
        if (this.isInSpectateMode) logger.log(`Monitor: Spectate mode active`)
        logger.log('verbose', `Monitor: ${isGameRunning ? 'Game Running' : 'No Game'}`)
        logger.log('verbose', `Monitor:`);

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
        logger.log('info', `Monitor: toggling spectate mode: ${this.isInSpectateMode}`);
    }
}

module.exports = {
    Monitor
};