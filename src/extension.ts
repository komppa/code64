import * as vscode from 'vscode';
import * as process from 'child_process';


const JAVA_PATH = "java";
// Path where KickAss.jar can be found without "/" on the end
const KICKASS_PATH = "/<PATH_TO_KICK_ASSEMBLY_FOLDER>/KickAssembly";
// TODO do not hardcode the path of the VICE runtime
const C64_RUNTIME = "/snap/bin/vice-jz.x64";

// TODO CRIT change 

class FileHolder {

	filenames: Array<string>;

	constructor(filenames?: Array<string>) {
		if (filenames === undefined)
			this.filenames = [];
		else
			this.filenames = filenames;
	}

	getNewFilename() {
		let name = getRandomFilename();
		this.filenames.push(name);
		return name;
	}

	getLatestFilename() {
		return this.filenames[this.filenames.length - 1];
	}

	removeAllFilenames() {
		this.filenames = [];
	}

}

const getCurrentProgram = () => {
	console.log("@getCurrentProgram", vscode.window.activeTextEditor?.document.fileName);
	return vscode.window.activeTextEditor?.document.fileName
}

const getRandomFilename = () => new Date().getTime().toString() + Math.random().toString(36).slice(2)

const execProcess = (cmd: string) => {
	new Promise<string>((res, rej) => {
		// TODO out string?
		process.exec(cmd, (err: any, out: any) => {
			if (err) {
				return rej(err);
			}
			return res(out);
		})
	});
}

export function activate(context: vscode.ExtensionContext) {

	const fh = new FileHolder();
	
	// Build listener
	context.subscriptions.push(
		vscode.commands.registerCommand('code64.build', () => {

			const terminal = getCode64Terminal();

			console.debug("BUILD: got terminal ", terminal);

			// TODO remove hardcoded paths
			terminal.sendText(
				`${JAVA_PATH} -jar ${KICKASS_PATH}/KickAss.jar "${getCurrentProgram()}" \
				-odir ${KICKASS_PATH} \
				-o ${KICKASS_PATH}/out.prg`
			);

		})
	);

	// Runtime run listener
	context.subscriptions.push(
		vscode.commands.registerCommand('code64.run', () => {
			vscode.window.showInformationMessage('Running...');
			const terminal = getCode64Terminal();
			// TODO remove harcoded path
			terminal.sendText(`${C64_RUNTIME} ${KICKASS_PATH}/out.prg`);
		})
	);

	// Build & Run
	context.subscriptions.push(
		vscode.commands.registerCommand('code64.buildAndRun', () => {
			vscode.window.showInformationMessage('Building and running...');
			const terminal = getCode64Terminal();
			// TODO remove hardcoded path
			terminal.sendText(
				`${JAVA_PATH} -jar ${KICKASS_PATH}/KickAss.jar "${getCurrentProgram()}" \
				-odir ${KICKASS_PATH} \
				-o ${KICKASS_PATH}/out.prg`
			);
			// TODO remove hardcoded path
			terminal.sendText(`${C64_RUNTIME} ${KICKASS_PATH}/out.prg`);
		})
	);
	
}

export function deactivate() {}


interface TerminalExists {
	terminal:vscode.Terminal | null
	terminalExists: boolean
}

const isCode64Terminal = (terminal: vscode.Terminal): boolean => terminal.name === "code64";

const code64TerminalExists = (): boolean => {

	const terminals = (<any>vscode.window).terminals;

	if (terminals.length === 0) {
		return false;
	}

	const terminal = terminals.filter(isCode64Terminal);

	if (terminal.length === 0) {
		return false;
	}

	return true;

};


// This gets a new code64 terminal or creates a new one
const getCode64Terminal = (): vscode.Terminal => {

	if (code64TerminalExists() === false) {
		// Terminal does not exst, create it
		const t = vscode.window.createTerminal("code64");
		t.show();
		return t;
	}

	const terminals = (<any>vscode.window).terminals;
	
	const terminal = terminals.filter(isCode64Terminal);

	// TODO remove hardcoded index
	return terminal[0];

};
