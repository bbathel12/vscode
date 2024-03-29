"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const logger_1 = require("../logging/logger");
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
/**
 * Validate the sqlite3 command/path passed as argument, if not valid fallback to the binary in the bin directory.
 */
function validateSqliteCommand(sqliteCommand, extensionPath) {
    let isValid = isSqliteCommandValid(sqliteCommand);
    if (isValid) {
        return sqliteCommand;
    }
    else {
        sqliteCommand = getSqliteBinariesPath(extensionPath);
        if (!sqliteCommand) {
            throw new Error(`Unable to find a valid SQLite command. Fallback binary not found.`);
        }
        isValid = isSqliteCommandValid(sqliteCommand);
        if (isValid) {
            return sqliteCommand;
        }
        else {
            throw new Error(`Unable to find a valid SQLite command. Fallback binary is not valid.`);
        }
    }
}
exports.validateSqliteCommand = validateSqliteCommand;
// verifies that the command/path passed as argument is an sqlite command
function isSqliteCommandValid(sqliteCommand) {
    let proc = child_process_1.spawnSync(`"${sqliteCommand}"`, [`-version`], { shell: true });
    let error = proc.stderr.toString();
    let output = proc.stdout.toString();
    // if there is any error the command is note valid
    // Note: the string match is a workaround for CentOS (and maybe other OS's) where the command throws an error at the start but everything works fine
    if (error && !error.match(/\: \/lib64\/libtinfo\.so\.[0-9]+: no version information available \(required by /)) {
        logger_1.logger.debug(`'${sqliteCommand}' is not a valid SQLite command: ${error}`);
        return false;
    }
    // out must be: {version at least 3} {date} {time}}
    // this is a naive way to check that the command is for sqlite3 after version 3.9
    let match = output.match(/3\.(?:9|[0-9][0-9])\.[0-9]{1,2} [0-9]{4}\-[0-9]{2}\-[0-9]{2} [0-9]{2}\:[0-9]{2}\:[0-9]{2}/);
    if (!match) {
        logger_1.logger.debug(`'${sqliteCommand}' is not a valid SQLite command: version must be >= 3.9`);
    }
    return match ? true : false;
}
exports.isSqliteCommandValid = isSqliteCommandValid;
/**
 * Get the path of the sqlite3 binaries based on the platform.
 * If there are no binaries for the platform returns an empty string.
 * @param extensionPath The path of this extension
 */
function getSqliteBinariesPath(extensionPath) {
    let plat = os_1.platform();
    let os_arch = os_1.arch();
    let sqliteBin;
    // TODO: move sqlite version number to package.json and import it from there
    switch (plat) {
        case 'win32':
            sqliteBin = 'sqlite-v3.26.0-win32-x86.exe';
            break;
        case 'linux':
            if (os_arch === 'x64') {
                sqliteBin = 'sqlite-v3.26.0-linux-x64';
            }
            else {
                sqliteBin = 'sqlite-v3.26.0-linux-x86';
            }
            break;
        case 'darwin':
            sqliteBin = 'sqlite-v3.26.0-osx-x86';
            break;
        default:
            logger_1.logger.info(`Fallback binary not found: system OS not recognized.`);
            sqliteBin = '';
            break;
    }
    if (sqliteBin) {
        let path = path_1.join(extensionPath, 'bin', sqliteBin);
        if (fs_1.existsSync(path)) {
            logger_1.logger.debug(`Fallback SQLite binary found: '${path}'.`);
            return path;
        }
        else {
            logger_1.logger.debug(`Fallback SQLite binary not found: '${path}' does not exist.`);
            return '';
        }
    }
    else {
        return '';
    }
}
exports.getSqliteBinariesPath = getSqliteBinariesPath;
//# sourceMappingURL=sqliteCommandValidation.js.map