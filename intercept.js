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
	
	stream.write = function(...args) {
		args[0] = interceptor(intercept, ...args);
		this._data += Decoder.write(args[0]);
		this.emit('data', ...args);
		return _old_write.call(this, ...args);
	};
	
	function interceptor(callback, ...args) {
		var result = callback(...args);
		if (typeof result == 'string') {
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
	
	stream.read = function(...args) {
		var data = _old_read.call(this, ...args);
		data = interceptor(intercept, data, ...args);
		this._datar += Decoder.write(data);
		return data;
	};
	
	function interceptor(callback, string, ...args) {
		var result = callback(string, ...args);
		if (result || typeof result == 'string') {
			args[0] = result;
		}
		return args[0];
	} //interceptor
	
	return function unhook() {
		return stream.read = _old_read;
	};
};

process._stdout = exports.write(process.stdout);
process._stderr = exports.write(process.stderr);
process._stdin = exports.read(process.stdin);
