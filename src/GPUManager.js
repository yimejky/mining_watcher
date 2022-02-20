const util = require('util');
const exec = util.promisify(require('child_process').exec);
const logger = require('./helpers/logger');

const config = require('../config');

class GPUManager {
    async getGpuInfo() {
        const queryAttributes = [
            'power.draw',
            'power.limit',
            'clocks.current.graphics',
            'clocks.current.memory'
        ].join(',');
        const { stdout } = await exec(`nvidia-smi --query-gpu=${queryAttributes} --format=csv`);
        const lines = stdout.split('\n');

        const parsedLine = lines[1].replace(/[^0-9.,]/g, '');
        const values = parsedLine.split(',');

        const [powerDraw, powerLimit, clockGraphics, clockMemory] = values.map(str => {
            const num = Number.parseFloat(str);
            return Number.isNaN(num) ? 0 : num;
        });

        return {
            actualWatt: powerDraw, maxWatt: powerLimit,
            actualClock: clockGraphics,
            actualMemoryClock: clockMemory
        };
    }

    async getGpuTemp() {
        const { stdout } = await exec('nvidia-smi');

        const re = /\d+W \/ \d+W/g;
        const match = stdout.match(re);
        if (!match) {
            throw new Error('GPUManager.getGpuTemp: values were not found');
        }

        const [textValues] = match;
        const [actualWattStr, maxWattStr] = textValues.replace(/[ W]/g, '').split('/');
        const actualWatt = Number.parseInt(actualWattStr);
        const maxWatt = Number.parseInt(maxWattStr);

        if (Number.isNaN(actualWatt) || Number.isNaN(maxWatt)) {
            throw new Error('GPUManager.getGpuTemp: values were invalid numbers');
        }

        return {
            actualWatt, maxWatt
        };
    }

    async setMiningProfile() {
        logger.log('info', 'GPUManager.setMiningProfile: setting mining profile')
        return await exec(`"${config.MSI_EXE_PATH}" -profile${config.MINING_PROFILE}`);
    }

    async setGamingProfile() {
        logger.log('info', 'GPUManager.setGamingProfile: setting gaming profile')
        return await exec(`"${config.MSI_EXE_PATH}" -profile${config.GAMING_PROFILE}`);
    }
}

module.exports = {
    GPUManager
};