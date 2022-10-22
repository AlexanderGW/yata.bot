enum Level {
	Info = 0,
	Warn = 1,
	Err = 2,
}

export const Bot = {

	console: function (
		string: string,
		level?: Level,
	) {
		let now = new Date();
		let consoleString = `${now.toISOString()}: ${string}`;

		if (level === Level.Info)
			console.log(consoleString);
		else if (level === Level.Warn)
			console.warn(consoleString);
		else
			console.error(consoleString);
	},
};