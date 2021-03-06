const { GPUManager } = require('./GPUManager');
const { GPUMiner } = require('./GPUMiner');
const { getRunningGames } = require('./helpers/isProcessRunning');
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

        const minerRunningStats = await this.miner.getRunningStats();
        if (minerRunningStats.isExeRunning) {
            await this.miner.kill();
        }
    }

    async intervalFn() {
        const promises = [
            this.gpuManager.getGpuInfo(),
            this.miner.getRunningStats(),
            getRunningGames(config.GAMES_EXES),
        ];
        const [gpuInfo, minerRunningStats, runningGames] = await Promise.all(promises);
        const isGameRunning = runningGames.length > 0;

        this.printIntervalInfo(gpuInfo, minerRunningStats, isGameRunning, runningGames);

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

    printIntervalInfo(gpuInfo, minerRunningStats, isGameRunning, runningGames) {
        const { actualWatt, maxWatt } = gpuInfo;
        const { isExeRunning, hasData, minutes, hashRate } = minerRunningStats;

        const parsedHash = (hashRate / 1000).toFixed(2);
        const consume = `${actualWatt}W/${maxWatt}W`;
        const minerStatRender = isExeRunning
            ? (
                hasData
                    ? `Miner ${minutes}m ${parsedHash} MH/s`
                    : 'Miner starting'
            )
            : 'Miner Offline';

        logger.log('verbose', `Monitor: ----------------------`);
        logger.log('verbose', `Monitor: GPU ${consume}`);
        logger.log('verbose', `Monitor: ${minerStatRender}`);
        if (this.isInSpectateMode) logger.log('verbose', `Monitor: Spectate mode active`)
        logger.log('verbose', `Monitor: ${isGameRunning ? `Game Running (${runningGames.join(', ')})` : 'No Game'}`)
        logger.log('verbose', `Monitor:`);
    }
}

module.exports = {
    Monitor
};