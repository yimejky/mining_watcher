const util = require('util');
const exec = util.promisify(require('child_process').exec);

const config = require('../config');

class GPUManager {
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
        console.log('GPUManager.setMiningProfile: setting mining profile')
        return await exec(`"${config.MSI_EXE_PATH}" -profile${config.MINING_PROFILE}`);
    }

    async setGamingProfile() {
        console.log('GPUManager.setGamingProfile: setting gaming profile')
        return await exec(`"${config.MSI_EXE_PATH}" -profile${config.GAMING_PROFILE}`);
    }
}

module.exports = {
    GPUManager
};