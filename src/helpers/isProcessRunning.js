const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function getRunningProcesses() {
    const { stdout } = await exec(`tasklist -FO LIST | find "Image Name:"`);
    const runningProcesses = stdout.replace(/Image Name\:   /g, '').split(os.EOL).map((str) => str.toLowerCase());
    return runningProcesses;
}

async function isProcessRunning(processName) {
    const runningProcesses = await getRunningProcesses();
    const found = runningProcesses.find((proc) => proc.toLowerCase().includes(processName.toLowerCase()));
    return !!found;
}

async function isSomeProcessesRunning(processesNames) {
    const runningProcesses = await getRunningProcesses();
    const parsedProcessesNames = processesNames.map((str) => str.toLowerCase());

    const found = runningProcesses.find(runningProcess => parsedProcessesNames.some(process => runningProcess.includes(process)));
    return !!found;
}

async function getRunningGames(processesNames) {
    const runningProcesses = await getRunningProcesses();
    const parsedProcessesNames = processesNames.map((str) => str.toLowerCase());

    return runningProcesses.filter(runningProcess => parsedProcessesNames.some(process => runningProcess.includes(process)));
}

module.exports = {
    isProcessRunning,
    isSomeProcessesRunning,
    getRunningGames
};
