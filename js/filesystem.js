var filesystem;

window.onload = function(){
	FileSystem();
	filesystem.request(PERSISTENT);
};

function FileSystem(){
	filesystem = {
		quota:5*1024*1024,
		request:function(type, size){
			size = (size) ? size : filesystem.quota;
			window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
			window.webkitStorageInfo.requestQuota(type, size, function(grantedBytes) {
				filesystem.quota = grantedBytes;
				window.requestFileSystem(type, grantedBytes, function(fs){
					filesystem.onInitFs(fs);
				}, function(e){
					filesystem.errorHandler(e);
				});
			}, function(e){
				filesystem.errorHandler(e);
			});
		},
		onInitFs:function(fs){
			filesystem.fs = fs;
			filesystem.root = fs.root;
			filesystem.dirReader = filesystem.root.createReader();
			filesystem.entries = [];
			filesystem.directory.read('/');
		},
		errorHandler:function(e){
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
		},
		directory:{
			create:function(path, rootDir){
				if(typeof path == 'string'){
					folders = path.split('/');
				} else {
					folders = path;
				}
				if(folders[0] == '.' || folders[0] == ''){
					folders = toArray(folders);
					folders.shift();
				}
				if(!rootDir){
					rootDir = filesystem.root;
				}
				return rootDir.getDirectory(folders[0], {create: true}, function(dirEntry){
					if(folders.length){
						folders = toArray(folders);
						folders.shift();
						filesystem.directory.create(folders, dirEntry);
					}
					filesystem.directory.read(dirEntry.fullPath);
					return true;
				}, function(e){
					filesystem.errorHandler(e);
					return false;
				});
			},
			delete:function(path){
				path = (path.substring(-1) == '/') ? path : path+'/';
				filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
					dirEntry.removeRecursively(function() {
						filesystem.directory.read(path+'../');
					}, function(e){
						filesystem.errorHandler(e);
						return false;
					});
				}, function(e){
					filesystem.errorHandler(e);
					return false;
				});
			},
			read:function(path){
				if(!path){
					path = filesystem.root;
				}
				filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
					filesystem.dirReader = dirEntry.createReader();
					filesystem.entries = [];
					filesystem.dirReader.readEntries(function(results) {
						listResults(toArray(results).sort(), dirEntry.fullPath);
					}, function(e){
						filesystem.errorHandler(e);
						return false;
					});
				}, function(e){
					filesystem.errorHandler(e);
					return false;
				});
			}
		},
		file:{
			create:function(path){
				var path = path;
				folders = path.split('/');
				filename = folders.pop();
				folders = toArray(folders);
				filesystem.directory.create(folders);
				return filesystem.root.getDirectory(folders.join('/'), {create: false, exclusive: true}, function(dirEntry){
					return dirEntry.getFile(filename, {create: true}, function(fileEntry){
						filesystem.directory.read(dirEntry.fullPath);
						return true;
					}, function(e){
						filesystem.errorHandler(e);
						filesystem.file.create(path);
					});
				}, function(e){
					setTimeout(function(){filesystem.file.create(path);}, 50);
					return false;
				});
			},
			delete:function(path){
				folders = path.split('/');
				filename = folders.pop();
				folder = toArray(folders).join('/')+'/';
				return filesystem.root.getFile(path, {create: false}, function(fileEntry) {
					return fileEntry.remove(function() {
						filesystem.directory.read(folder);
						return true;
					}, function(e){
						filesystem.errorHandler(e);
						return false;
					});
				}, function(e){
					filesystem.errorHandler(e);
					return false;
				});
			},
			read:function(path){
				
			},
			write:function(path, data, append){
				
			},
			upload:function(id, multiple){
				
			}
		},
		copy:function(source, destination){
			
		},
		move:function(source, destination){
			
		},
		rename:function(old, _new, cwd){
			if(cwd){
				old = (cwd.substring(-1) == '/') ? cwd+old : cwd+'/'+old;
				_new = (cwd.substring(-1) == '/') ? cwd+_new : cwd+'/'+_new;
			}
			filesystem.move(old, _new);
		},
		properties:function(path){
			
		},
		url:{
			get:function(path){
				
			},
			resolve:function(url){
				
			}
		}
	};
}