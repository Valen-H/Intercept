const Stream = require('stream'),
Decoder = new (require('string_decoder').StringDecoder)(),
os = require('os');

exports.write = function write(stream = process.stdout, intercept = it => it) {
	if (!(stream instanceof Stream.Writable)) {
		let err = new TypeError('A non-Stream#Writable object was passed.');
		err.code = 'ENOSTRW';
		throw err;
	} else if (stream._data !== undefined) {
		let err = new Error('Stream is already being intercepted.');
		err.code = 'EALRINTR';
		throw err;
	}
	
	var _old_write = stream.write;
	stream._data = '';
	Object.defineProperty(stream, '_lines', {
		get value() {
			return stream._data.split(os.EOL).length;
		}
	});
	Object.defineProperty(stream, '_indent', {
		get value() {
			return stream._data.split(os.EOL).pop().length;
		}
	});
	
	stream.write = function(...args) {
		args[0] = interceptor(intercept, ...args);
		if (args[0]) this._data += (args[0] instanceof Buffer) ? Decoder.write(args[0] || Buffer.alloc(0)) : args[0];
		this.emit('data', ...args);
		return _old_write.call(this, ...args);
	};
	
	function interceptor(callback, ...args) {
		var result = callback(...args);
		if (typeof result == 'string' || (result instanceof Buffer)) {
			args[0] = result;
		}
		return args[0];
	} //interceptor
	
	return function unhook() {
		return stream.write = _old_write;
	};
};

exports.read = function read(stream = process.stdin, intercept = it => it) {
	if (!(stream instanceof Stream.Readable)) {
		let err = new TypeError('A non-Stream#Readable object was passed.');
		err.code = 'ENOSTRR';
		throw err;
	} else if (stream._data !== undefined) {
		let err = new Error('Stream is already being intercepted.');
		err.code = 'EALRINTR';
		throw err;
	}
	
	var _old_read = stream.read;
	stream._datar = '';
	Object.defineProperty(stream, '_linesr', {
		get value() {
			return stream._datar.split(os.EOL).length;
		}
	});
	Object.defineProperty(stream, '_indentr', {
		get value() {
			return stream._datar.split(os.EOL).pop().length;
		}
	});
	
	stream.read = function(...args) {
		var data = _old_read.call(this, ...args);
		data = interceptor(intercept, data, ...args);
		if (data) this._datar += (data instanceof Buffer) ? Decoder.write(data || Buffer.alloc(0)) : data;
		this.emit('read', data, ...args);
		return data;
	};
	
	function interceptor(callback, ...args) {
		var result = callback(args[0], ...args);
		if (typeof result == 'string' || (result instanceof Buffer)) {
			args[0] = result;
		}
		return args[0];
	} //interceptor
	
	return function unhook() {
		return stream.read = _old_read;
	};
};

try {
	process._stdout = exports.write(process.stdout);
	process._stderr = exports.write(process.stderr);
	process._stdin = exports.read(process.stdin);
} catch(ex) { }
