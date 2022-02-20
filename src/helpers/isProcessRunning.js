const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function isProcessRunning(processName) {
    const { stdout } = await exec(`tasklist -FO LIST | grep "Image Name:"`);
    const runningProcesses = stdout.replace(/Image Name\:   /g, '').split(os.EOL);

    const found = runningProcesses.find((proc) => proc.toLowerCase().includes(processName.toLowerCase()));
    return !!found;
}

async function isSomeProcessesRunning(processesNames) {
    const { stdout } = await exec(`tasklist -FO LIST | grep "Image Name:"`);
    const runningProcesses = stdout.replace(/Image Name\:   /g, '').split(os.EOL).map((str) => str.toLowerCase());
    const parsedProcessesNames = processesNames.map((str) => str.toLowerCase());

    const found = runningProcesses.find(runningProcess => parsedProcessesNames.some(process => runningProcess.includes(process)));
    return !!found;
}

module.exports = {
    isProcessRunning,
    isSomeProcessesRunning
};
