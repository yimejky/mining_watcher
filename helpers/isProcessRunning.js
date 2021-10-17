const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function isProcessRunning(processName) {
    const { stdout } = await exec(`tasklist -FO LIST | grep "Image Name:"`);
    const runningProcess = stdout.replace(/Image Name\:   /g, '').split(os.EOL);

    const found = runningProcess.find((proc) => proc.toLowerCase().includes(processName.toLowerCase()));
    return !!found;
}

module.exports = {
    isProcessRunning
};
