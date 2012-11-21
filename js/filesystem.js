window.onload = function(){
	filesystem = FileSystem();
	filesystem.request(PERSISTENT);
};

function FileSystem(){
	var filesystem = {
		quota:5*1024*1024,
		request:function(type, size){
			var type = (type) ? type : PERSISTENT;
			var size = (size) ? size : filesystem.quota;
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
			console.error('Error: ' + msg);
		},
		directory:{
			create:function(path, rootDir){
				var folders;
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
				rootDir.getDirectory(folders[0], {create: true}, function(dirEntry){
					if(folders.length){
						folders = toArray(folders);
						folders.shift();
						filesystem.directory.create(folders, dirEntry);
					}
					filesystem.directory.read(dirEntry.fullPath);
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			delete:function(path){
				path = (path.substring(-1) == '/') ? path : path+'/';
				filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
					dirEntry.removeRecursively(function() {
						filesystem.directory.read(path+'../');
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
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
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			copy:function(source, destination){
				filesystem.copy('directory', source, destination);
			},
			move:function(source, destination){
				filesystem.move('directory', source, destination);
			},
			rename:function(old, _new){
				filesystem.move('directory', old, _new);
			}
		},
		file:{
			create:function(path){
				var path = path;
				var folders = path.split('/');
				var filename = folders.pop();
				folders = toArray(folders);
				filesystem.directory.create(folders);
				filesystem.root.getDirectory(folders.join('/'), {create: false, exclusive: true}, function(dirEntry){
					dirEntry.getFile(filename, {create: true}, function(fileEntry){
						filesystem.directory.read(dirEntry.fullPath);
					}, function(e){
						filesystem.errorHandler(e);
						filesystem.file.create(path);
					});
				}, function(e){
					filesystem.errorHandler(e);
					setTimeout(function(){filesystem.file.create(path);}, 50);
				});
			},
			delete:function(path){
				var folders = path.split('/');
				var filename = folders.pop();
				var folder = toArray(folders).join('/')+'/';
				filesystem.root.getFile(path, {create: false}, function(fileEntry) {
					fileEntry.remove(function() {
						filesystem.directory.read(folder);
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			read:function(path, success){
				filesystem.root.getFile(path, {create: false}, function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();
						reader.onloadend = success;
						reader.readAsText(file);
					}, function(e){
						filesystem.errorHandler(e);
					})
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			write:function(path, data, success, append){
				var append = append || false,
					path = path,
					data = data,
					folders = path.split('/'),
					filename = folders.pop();
				if(!append){
					this.delete(path);
					this.create(path);
				}
				folders = toArray(folders);
				filesystem.directory.create(folders);
				filesystem.root.getDirectory(folders.join('/'), {create: false, exclusive: true}, function(dirEntry){
					dirEntry.getFile(filename, {create: false, exclusive: true}, function(fileEntry){
						fileEntry.createWriter(function(fileWriter){
							fileWriter.onwriteend = success;
							fileWriter.onerror = function(e){
								filesystem.errorHandler(e);
							};
							if(append){
								fileWriter.seek(fileWriter.length);
							}
							var blob = new Blob([data], {type: 'text/plain'});
							fileWriter.write(blob);
						}, function(e){
							filesystem.errorHandler(e);
						});
					}, function(e){
						filesystem.errorHandler(e);
						filesystem.file.create(path);
						filesystem.file.write(path, data, append);
					});
				}, function(e){
					filesystem.errorHandler(e);
					filesystem.directory.create(folders.join('/'));
					filesystem.file.write(path, data, append);
				});
			},
			upload:function(id, multiple){
				
			},
			copy:function(source, destination){
				filesystem.copy('file', source, destination);
			},
			move:function(source, destination){
				filesystem.move('file', source, destination);
			},
			rename:function(old, _new){
				filesystem.move('file', old, _new);
			}
		},
		copy:function(type, source, destination){
			switch(type){
				case 'file':
					
					break;
				case 'directory':
					
					break;
			}
		},
		move:function(type, source, destination){
			switch(type){
				case 'file':
					
					break;
				case 'directory':
					
					break;
			}
		},
		properties:function(type, path, success){
			if(type && path && success){
				switch(type){
					case 'file':
						filesystem.root.getFile(path, {create: false}, function(fileEntry){
							fileEntry.getMetadata(success, function(e){
								filesystem.errorHandler(e);
							});
						}, function(e){
							filesystem.errorHandler(e);
						});
						break;
					case 'directory':
						filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
							dirEntry.getMetadata(success, function(e){
								filesystem.errorHandler(e);
							});
						}, function(e){
							filesystem.errorHandler(e);
						});
						break;
				}
			}
		},
		url:{
			get:function(path, success){
				var path = path;
				filesystem.root.getFile(path, {create: false}, function(fileEntry){
					success(fileEntry.toURL());
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			resolve:function(url, success){
				window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
				window.resolveLocalFileSystemURL(url, function(fileEntry){
					success(fileEntry.fullPath);
				}, function(e){
					filesystem.errorHandler(e);
				});
			}
		}
	};
	return filesystem;
}