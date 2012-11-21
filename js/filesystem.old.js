var size = 5*1024*1024;

document.onready = function(){
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
	window.webkitStorageInfo.requestQuota(PERSISTENT, size, function(grantedBytes) {
		size = grantedBytes;
		window.requestFileSystem(PERSISTENT, grantedBytes, function(fs){
			onInitFs(fs);
		}, function(e){
			errorHandler(e);
		});
	}, function(e){
		errorHandler(e);
	});
};

function onInitFs(fs) {
	console.log('Opened file system: ' + fs.name);
	var dirReader = fs.root.createReader();
	var entries = [];

	// Call the reader.readEntries() until no more results are returned.
	var readEntries = function() {
		dirReader.readEntries(function(results) {
			console.log(results);
			if (!results.length) {
				listResults(entries.sort(), '/');
			} else {
				entries = entries.concat(toArray(results));
				readEntries();
			}
		}, errorHandler);
	};
	readEntries(); // Start reading dirs.
}

function errorHandler(e) {
	var msg = '';
	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'Storage Quota Exceeded';
			break;
		case FileError.NOT_FOUND_ERR:
			msg = 'Object Not Found';
			break;
		case FileError.SECURITY_ERR:
			msg = 'Security Error';
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = 'Invalid Modification Command';
			break;
		case FileError.INVALID_STATE_ERR:
			msg = 'Invalid State';
			break;
		default:
			msg = 'Unknown Error';
			break;
	};
	console.log('Error: ' + msg);
}

function createFile(path) {
	var path = path;
	folders = path.split('/');
	filename = folders.pop();
	folders = toArray(folders);
	createPath(folders);
	return window.requestFileSystem(PERSISTENT, size, function(fs){
		return fs.root.getDirectory(folders.join('/'), {create: false}, function(dirEntry){
			return dirEntry.getFile(filename, {create: true}, function(fileEntry){
				console.log("file made");
				readPath(dirEntry.fullPath);
				return true;
			}, function(e){
				console.log("file not made");
				errorHandler(e);
				createFile(path);
			});
		}, function(e){
			setTimeout(function(){createFile(path);}, 25);
			return false;
		});
	}, function(e){
		errorHandler(e);
		return false;
	});
}

function createPath(path, rootDir) {
	// console.log(rootDir);
	if(typeof path == 'string'){
		folders = path.split('/');
	} else {
		folders = path;
	}
	if(folders[0] == '.' || folders[0] == ''){
		folders = toArray(folders);
		folders.shift();
	}
	// console.log(folders);
	return window.requestFileSystem(PERSISTENT, size, function(fs){
		if(!rootDir){
			rootDir = fs.root;
		}
		return rootDir.getDirectory(folders[0], {create: true}, function(dirEntry){
			if(folders.length){
				folders = toArray(folders);
				folders.shift();
				createPath(folders, dirEntry);
			}
			readPath(dirEntry.fullPath);
			return true;
		}, function(e){
			errorHandler(e);
			return false;
		});
	}, function(e){
		errorHandler(e);
		return false;
	});
}

function clearPath(path){
	path = (path.substring(-1) == '/') ? path : path+'/';
	window.requestFileSystem(PERSISTENT, size, function(fs) {
		fs.root.getDirectory(path, {}, function(dirEntry) {
			dirEntry.removeRecursively(function() {
				readPath(path+'../');
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}

function clearFile(path){
	folders = path.split('/');
	filename = folders.pop();
	folder = toArray(folders).join('/')+'/';
	return window.requestFileSystem(window.PERSISTENT, size, function(fs) {
		return fs.root.getFile(path, {create: false}, function(fileEntry) {
			return fileEntry.remove(function() {
				readPath(folder);
				return true;
			}, function(e){
				errorHandler(e);
				return false;
			});
		}, function(e){
			errorHandler(e);
			return false;
		});
	}, function(e){
		errorHandler(e);
		return false;
	});
}

function readPath(path){
	window.requestFileSystem(PERSISTENT, size, function(fs) {
		if(!path){
			path = fs.root;
		}
		fs.root.getDirectory(path, {create: false}, function(dirEntry) {
			var dirReader = dirEntry.createReader();
			var entries = [];
			dirReader.readEntries(function(results) {
				listResults(toArray(results).sort(), dirEntry.fullPath);
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}