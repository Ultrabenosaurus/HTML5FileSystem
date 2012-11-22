window.onload = function(){
	filesystem = new FileSystem();
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
					filesystem.init(fs);
				}, function(e){
					filesystem.errorHandler(e);
				});
			}, function(e){
				filesystem.errorHandler(e);
			});
		},
		init:function(fs){
			filesystem.fs = fs;
			filesystem.root = fs.root;
			filesystem.dirReader = filesystem.root.createReader();
			filesystem.entries = [];
			filesystem.filetypes = {
				'text/plain':[
					'txt',
					'html',
					'htm',
					'php',
					'js',
					'asp',
					'aspx',
					'md',
					'markdown'
				],
				'application/x-msdownload':[
					'exe'
				],
				'image/png':[
					'png'
				],
				'image/gif':[
					'gif'
				],
				'image/jpeg':[
					'jpg',
					'jpeg'
				]
			};
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
			create:function(path, root){
				var folders;
				if(typeof path == 'string'){
					folders = path.split('/');
				} else {
					folders = path;
				}
				if(folders[0] == '.' || folders[0] == ''){
					folders = filesystem.support.toArray(folders);
					folders.shift();
				}
				if(!root){
					root = filesystem.root.fullPath;
				}
				filesystem.root.getDirectory(root, {}, function(rootEntry){
					rootEntry.getDirectory(folders[0], {create: true}, function(dirEntry){
						if(folders.length){
							folders = filesystem.support.toArray(folders);
							folders.shift();
							filesystem.directory.create(folders, dirEntry.fullPath);
						}
						filesystem.directory.read(dirEntry.fullPath);
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			del:function(path){
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
						filesystem.support.listResults(filesystem.support.toArray(results).sort(), dirEntry.fullPath);
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			copy:function(source, destination){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getDirectory(source, {create: false}, function(sourceEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(destEntry){
							sourceEntry.copyTo(destEntry);
							filesystem.directory.read(destEntry.fullPath);
						}, function(e){
							filesystem.errorHandler(e);
							filesystem.directory.create(destination);
							filesystem.directory.copy(source, destination);
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}
			},
			move:function(source, destination){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getDirectory(source, {create: false}, function(sourceEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(destEntry){
							sourceEntry.moveTo(destEntry);
							filesystem.directory.read(destination);
						}, function(e){
							filesystem.errorHandler(e);
							filesystem.directory.create(destination);
							filesystem.directory.move(source, destination);
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}
			},
			rename:function(dir, old, _new){
				var old = old || false, _new = _new || false, dir = dir || '/';
				if(old && _new && dir){
					filesystem.root.getDirectory(dir, {create: false}, function(parent){
						parent.getDirectory(old, {create: false}, function(dirEntry){
							dirEntry.moveTo(parent, _new);
							filesystem.directory.read(dir);
						}, function(e){
							filesystem.errorHandler(e);
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}
			},
			properties:function(path, success){
				filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
					dirEntry.getMetadata(success, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			}
		},
		file:{
			create:function(path){
				var path = path;
				var folders = path.split('/');
				var filename = folders.pop();
				folders = filesystem.support.toArray(folders);
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
			del:function(path){
				var folders = path.split('/');
				var filename = folders.pop();
				var folder = filesystem.support.toArray(folders).join('/')+'/';
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
					this.del(path);
					this.create(path);
				}
				folders = filesystem.support.toArray(folders);
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
			copy:function(source, destination){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getFile(source, {create: false}, function(fileEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(dirEntry){
							fileEntry.copyTo(dirEntry);
							filesystem.directory.read(dirEntry.fullPath);
						}, function(e){
							filesystem.errorHandler(e);
							filesystem.directory.create(destination);
							filesystem.file.copy(source, destination);
						});
						filesystem.errorHandler(e);
					});
				}
			},
			move:function(source, destination){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getFile(source, {create: false}, function(fileEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(dirEntry){
							fileEntry.moveTo(dirEntry);
							filesystem.directory.read(destination);
						}, function(e){
							filesystem.errorHandler(e);
							filesystem.directory.create(destination);
							filesystem.file.move(source, destination);
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}
			},
			rename:function(dir, old, name){
				dir = (dir.substring(-1) === '/') ? dir : dir+'/';
				filesystem.root.getDirectory(dir, {create: false}, function(dirEntry){
					dirEntry.getFile(old, {create: false}, function(fileEntry){
						fileEntry.moveTo(dirEntry, name);
						filesystem.directory.read(dir);
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			upload:function(name, dir, success, failure){
				inputs = document.getElementsByName(name);
				for(var i = 0, elem; elem = inputs[i]; i++){
					f = elem.files[0];
					if(typeof f !== 'undefined'){
						filesystem.support.upload(dir, f, success, failure);
					}
				}
			},
			properties:function(path, success){
				filesystem.root.getFile(path, {create: false}, function(fileEntry){
					fileEntry.getMetadata(success, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
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
		},
		support:{
			toArray:function(list){
				return Array.prototype.slice.call(list || [], 0);
			},
			listResults:function(entries, dir){
				dir = (dir == '../') ? "" : dir;
				dir = (dir.substring(-1) == '/') ? dir : dir+'/';
				document.querySelector('#filelist').innerHTML = (dir) ? "<strong>"+dir+"</strong>" : "<strong>/</strong>";
				var fragment = document.createDocumentFragment();
				if(dir != '/'){
					var li = document.createElement('li');
					li.innerHTML = '<img src="images/folder-icon.png" /><span> <a href="javascript: filesystem.directory.read(\''+dir+'../\');">../</a></span>';
					fragment.appendChild(li);
				}
				entries.forEach(function(entry, i) {
					var img = entry.isDirectory ? '<img src="images/folder-icon.png" />' : '<img src="images/file-icon.png" />';
					var li = document.createElement('li');
					if(entry.isDirectory){
						li.innerHTML = img + '<span> <a href="javascript: filesystem.directory.read(\''+entry.fullPath+'\');">' + entry.name + '</a></span>';
					} else {
						li.innerHTML = img + '<span> ' + entry.name + '</span>';
					}
					fragment.appendChild(li);
				});
				document.querySelector('#filelist').appendChild(fragment);
			},
			upload:function(dir, file, success, failure){
				if(typeof file !== 'undefined'){
					var ftype = file.type, fname = file.name, fmod = file.lastModifiedDate, fsize = file.size;
					filesystem.root.getDirectory(dir, {create: false}, function(dirEntry){
						filesystem.root.getFile(fname, {create: true}, function(fileEntry){
							var reader = new FileReader();
							reader.onloadend = function(theFile){
								if(theFile.target.readyState == FileReader.DONE){
									fileEntry.createWriter(function(fileWriter){
										fileWriter.onwriteend = success || function(e){filesystem.directory.read(dir)};
										fileWriter.onerror = failure || function(e){
											filesystem.errorHandler(e);
										};
										var blob = new Blob([theFile.target.result], {type: ftype});
										fileWriter.write(blob);
									}, function(e){
										filesystem.errorHandler(e);
									});
								}
							};
							reader.onerror = failure || function(e){
								filesystem.errorHandler(e);
							};
							if(ftype.match('text.*')) {
								reader.readAsText(file);
							} else {
								reader.readAsArrayBuffer(file);
							}
						}, function(e){
							filesystem.errorHandler(e);
						});
					}, function(e){
						filesystem.errorHandler(e);
						filesystem.directory.create(dir);
						filesystem.support.upload(dir, file, success, failure);
					});
				}
			}
		}
	};
	if(!Array.prototype.forEach){
		Array.prototype.forEach = function(fn, scope){
			for(var i = 0, len = this.length; i < len; ++i){
				fn.call(scope, this[i], i, this);
			}
		}
	}
	return filesystem;
}