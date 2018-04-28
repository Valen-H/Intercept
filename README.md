# Intercept  
A stream proxy utility.  
  
## Setup  
```javascript
const intercept = require('intercept');

var unhook = intercept.write(process.stdout, (...args) => {
	return args[0] + new Date(); //appends the date after every line on console! °_°"
});
intercept.write(process.stderr); //all data are gathered by default in the _data property of the intercepted stream
intercept.read(process.stdin); //_datar

unhook(); //release stdout hook
//process._stderr();
```  
**Note that all process streams are intercepted by default upon loading of the module! If you attempt to intercept more than once this will break the flow of the _data holder. Process stream hooks are found in process._stdout, process._stderr etc, so you can unbound them upon loading...**  
  
> This modules comes with an extra feature. All intercepted writable streams now emit a `data` event with the data to-be-written, this way you don't have to unhook the builtin tty streams to grab data in a custom function, BUT, one if the features of this module is that the data-to-be written can be **alternated** by returning a string from the callback, this wont work for events...  
