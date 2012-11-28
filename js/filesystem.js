window.onload = function(){
	filesystem = new FileSystem();
	filesystem.request(window.PERSISTENT);
	
	var dropZone = document.getElementById('filesDrag');
	dropZone.addEventListener('dragover', filesystem.support.dragOver, false);
	dropZone.addEventListener('drop', function(evt){
		filesystem.support.drop(evt, '/');
	}, false);
};

function FileSystem(){
	var filesystem = {
		request:function(type, size){
			if(!filesystem.quota){
				filesystem.quota = 5*1024*1024;
			}
			var type = (type) ? type : window.PERSISTENT;
			var size = (size) ? size : filesystem.quota;
			window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
			if(window.webkitStorageInfo && window.webkitStorageInfo.requestQuota){
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
			} else {
				if(window.requestFileSystem){
					window.requestFileSystem(type, filesystem.quota, function(fs){
						filesystem.init(fs);
					}, function(e){
						filesystem.errorHandler(e);
					});
				} else {
					return false;
				}
			}
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
					'markdown',
					'css'
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
				],
				'audio/mp3':[
					'mp3'
				]
			};
			filesystem.server.script = 'php/html5fs.php';
			if(!filesystem.maxChunk){
				filesystem.maxChunk = 10*1024*1024;
			}
			filesystem.directory.read('/');
		},
		clear:function(){
			filesystem.directory.empty('/');
		},
		errorHandler:function(e, data){
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
			if(data){
				console.warn(data);
			}
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
			read:function(path, success){
				if(!path){
					path = filesystem.root.fullPath;
				}
				filesystem.root.getDirectory(path, {create: false}, function(dirEntry) {
					filesystem.dirReader = dirEntry.createReader();
					filesystem.entries = [];
					filesystem.dirReader.readEntries(function(results) {
						if(success){
							success(filesystem.support.toArray(results).sort(), dirEntry.fullPath);
						} else {
							filesystem.support.listResults(filesystem.support.toArray(results).sort(), dirEntry.fullPath);
						}
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			empty:function(path){
				this.read(path, function(list, dir){
					for(var i = 0, len = list.length; i < len; i++){
						if(list[i].fullPath.split('.').length > 1){
							filesystem.file.del(list[i].fullPath);
						} else {
							filesystem.directory.del(list[i].fullPath);
						}
					}
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
			create:function(path, read){
				var path = path;
				var folders = path.split('/');
				var filename = folders.pop();
				folders = filesystem.support.toArray(folders);
				filesystem.directory.create(folders);
				filesystem.root.getDirectory(folders.join('/'), {create: false, exclusive: true}, function(dirEntry){
					dirEntry.getFile(filename, {create: true}, function(fileEntry){
						if(read === null){
							filesystem.directory.read(dirEntry.fullPath);
						}
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
				});
			},
			read:function(path, success){
				var mime = filesystem.support.filetypeSearch(path.split('.')[1]);
				filesystem.root.getFile(path, {create: false}, function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();
						reader.onload = success;
						if(typeof mime === 'undefined'){
							reader.readAsBinaryString(file);
						} else if(mime.match('text.*')) {
							reader.readAsText(file);
						} else {
							reader.readAsArrayBuffer(file);
						}
					}, function(e){
						filesystem.errorHandler(e);
					})
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			write:function(path, data, success, append){
				var mime = filesystem.support.filetypeSearch(path.split('.')[1]);
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
							var blob = new Blob([data], {type: mime});
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
			copy:function(source, destination, create){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getFile(source, {create: false}, function(fileEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(dirEntry){
							fileEntry.copyTo(dirEntry);
							filesystem.directory.read(dirEntry.fullPath);
						}, function(e){
							if(create){
								filesystem.directory.create(destination);
								filesystem.file.copy(source, destination);
							} else {
								filesystem.errorHandler(e);
							}
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}
			},
			move:function(source, destination, create){
				var source = source || false, destination = destination || false;
				if(source && destination){
					filesystem.root.getFile(source, {create: false}, function(fileEntry){
						filesystem.root.getDirectory(destination, {create: false}, function(dirEntry){
							fileEntry.moveTo(dirEntry);
							filesystem.directory.read(destination);
						}, function(e){
							if(create){
								filesystem.directory.create(destination);
								filesystem.file.copy(source, destination);
							} else {
								filesystem.errorHandler(e);
							}
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
				if(document.getElementsByName(name).length > 0){
					inputs = document.getElementsByName(name);
					for(var i = 0, elem; elem = inputs[i]; i++){
						f = elem.files[0];
						if(typeof f !== 'undefined'){
							filesystem.support.upload(dir, f, elem, success, failure);
						}
					}
				} else {
					elem = document.getElementById(name);
					if(typeof elem.files !== 'undefined'){
						for(var i = 0, f; f = elem.files[i]; i++){
							if(typeof f !== 'undefined'){
								filesystem.support.upload(dir, f, elem, success, failure);
							}
						}
					}
				}
			},
			download:function(path){
				var fname = path.split('/').pop();
				filesystem.url.get(path, function(url){
					var a = document.createElement('a');
					a.style.display = 'none';
					a.id = 'download_'+fname;
					a.href = url;
					a.download = fname;
					document.getElementsByTagName('body')[0].appendChild(a);
					a.click();
					document.getElementsByTagName('body')[0].removeChild(document.getElementById('download_'+fname));
				});
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
			},
			relative:function(path){
				var a = document.createElement('a');
				a.href = path;
				temp = a.href;
				a = null;
				return temp;
			}
		},
		server:{
			upload:function(local, remote, success, failure){
				fname = local.split('/').pop();
				filesystem.root.getFile(local, {create: false}, function(fileEntry){
					fileEntry.file(function(file){
						filesystem.support.ajax("POST", filesystem.server.script, file, success, failure, null, {
							'X_TYPE':'upload',
							'X_FILENAME':file.name,
							'X_DIRECTORY':remote
						});
					}, function(e){
						filesystem.errorHandler(e);
					});
				}, function(e){
					filesystem.errorHandler(e);
				});
			},
			download:function(remote, local, success, failure){
				remote = "./"+remote;
				fname = remote.split('/');
				fname = fname.pop();
				local = (local.substring(-1) == '/') ? local : local+'/';
				console.log(local+fname);
				filesystem.support.ajax("GET", remote, null, function(e){
					filesystem.file.write(local+fname, e.target.response, success, failure);
				}, failure, 'blob', null);
			},
			multi:function(direction, files, directory, success, failure){
				for(var i = 0, file; file = files[i]; i++){
					switch(direction){
						case 'upload':
							filesystem.server.upload(file, directory, success, failure);
							break;
						case 'download':
							filesystem.server.download(file, directory, success, failure);
							break;
					}
				}
			}
		},
		settings:{
			setQuota:function(bytes){
				filesystem.quota = bytes;
			},
			setMaxChunk:function(bytes){
				filesystem.maxChunk = bytes;
			},
			storage:function(success){
				var suffix = [' bytes', 'KB', 'MB', 'GB'];
				success = success || function(currBytes, totalBytes){
					remBytes = totalBytes-currBytes;
					current = currBytes;
					currCount = 0;
					while((current / 1024) >= 1){
						current = current / 1024;
						currCount++;
					}
					remaining = remBytes;
					remCount = 0;
					while((remaining / 1024) >= 1){
						remaining = remaining / 1024;
						remCount++;
					}
					total = totalBytes;
					totCount = 0;
					while((total / 1024) >= 1){
						total = total / 1024;
						totCount++;
					}
					console.log('current: ', filesystem.support.roundTo(current, 3), suffix[currCount], " (", currBytes, ' bytes)');
					console.log('total: ', filesystem.support.roundTo(total, 3), suffix[totCount], " (", totalBytes, ' bytes)');
					console.log('remaining: ', filesystem.support.roundTo(remaining, 3), suffix[remCount], " (", remBytes, ' bytes)');
				};
				window.webkitStorageInfo.queryUsageAndQuota(window.PERSISTENT, success);
			},
			registerFiletypes:function(options){
				if(typeof options === 'object'){
					for(var mime in options){
						var types = options[mime];
						if(filesystem.filetypes.hasOwnProperty(mime)){
							for(var i = 0, len = types.length; i < len; i++){
								ftype = types[i];
								var currTypes = filesystem.filetypes[mime];
								if(!currTypes.contains(ftype)){
									filesystem.filetypes[mime].push(ftype);
								}
							}
						} else {
							filesystem.filetypes[mime] = types;
						}
					}
				} else {
					return false;
				}
				return true;
			},
			getFiletypes:function(){
				return filesystem.filetypes;
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
			upload:function(dir, file, elem, success, failure){
				if(typeof file !== 'undefined'){
					var ftype = file.type, fname = file.name.replace(/ /g, '-'), fmod = file.lastModifiedDate, fsize = file.size;
					filesystem.root.getDirectory(dir, {create: false}, function(dirEntry){
						dirEntry.getFile(fname, {create: true}, function(fileEntry){
							if(document.getElementById('progress_'+fname) && elem){
								var progBar = document.getElementById('progress_'+fname);
								progBar.style.width = '0%';
							} else {
								var progBar = document.createElement('div');
								progBar.id = 'progress_'+fname;
								progBar.className = 'filesystem_progress';
								progBar.style.width = '0%';
								elem.parentNode.insertBefore(progBar, elem.nextSibling);
							}
							filesystem.file.properties(fileEntry.fullPath, function(value){
								if(value.size > 0){
									tdir = (dir.substring(-1) === '/') ? dir : dir+'/';
									filesystem.file.del(tdir+fname);
									filesystem.file.create(tdir+fname);
								}
							});
							if(fsize > filesystem.maxChunk){
								filesystem.support.multiPartUpload(dir, file, success, failure);
							} else {
								var reader = new FileReader();
								reader.onloadstart = function(e){
									if(document.getElementById('progress_'+fname)){
										var progBar = document.getElementById('progress_'+fname);
										progBar.style.width = '0%';
									} else {
										var progBar = document.createElement('div');
										progBar.id = 'progress_'+fname;
										progBar.className = 'filesystem_progress';
										progBar.style.width = '0%';
										elem.parentNode.insertBefore(progBar, elem.nextSibling);
									}
								};
								reader.onloadend = function(theFile){
									if(theFile.target.readyState == FileReader.DONE){
										fileEntry.createWriter(function(fileWriter){
											fileWriter.onprogress = function(e){
												var progBar = document.getElementById('progress_'+fname);
												progBar.style.width = (e.loaded / e.total)*100+'%';
											}
											fileWriter.onwrite = function(e){
												if(document.getElementById('progress_'+fname)){
													var progBar = document.getElementById('progress_'+fname);
													progBar.className = progBar.className+' complete';
													progBar.style.width = '100%';
												}
												if(success){
													success(e);
												}
											}
											fileWriter.onerror = function(e){
												filesystem.errorHandler(e);
												var progBar = document.getElementById('progress_'+fname);
												progBar.className = progBar.className+' error';
												progBar.style.width = '100%';
												if(failure){
													failure(e);
												}
											};
											fileWriter.seek(fileWriter.length);
											var blob = new Blob([theFile.target.result], {type: ftype});
											fileWriter.write(blob);
										}, function(e){
											filesystem.errorHandler(e);
										});
									}
								};
								reader.onerror = function(e){
									filesystem.errorHandler(e);
									if(document.getElementById('progress_'+fname)){
										var progBar = document.getElementById('progress_'+fname);
										progBar.className = progBar.className+' error';
										progBar.style.width = '100%';
									}
									if(failure){
										failure(e);
									}
								};
								if(ftype.match('text.*')) {
									reader.readAsText(file);
								} else {
									reader.readAsArrayBuffer(file);
								}
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
			},
			multiPartUpload:function(dir, file, success, failure){
				var ftype = file.type, fname = file.name.replace(/ /g, '-'), fmod = file.lastModifiedDate, fsize = file.size;
				var tdir = (dir.substring(-1) === '/') ? dir : dir+'/';
				var chunks = Math.ceil(fsize / filesystem.maxChunk), finalChunk = fsize % filesystem.maxChunk;
				filesystem.root.getDirectory(dir, {create: false}, function(dirEntry){
					dirEntry.getFile(fname, {create: true}, function(fileEntry){
						filesystem.file.properties(fileEntry.fullPath, function(value){
							var currSize = value.size;
							if(currSize == fsize){
								if(success){
									success(fileEntry.fullPath, fsize, ftype);
								}
							} else {
								var start = currSize;
								var end = (fsize - currSize > filesystem.maxChunk) ? start+filesystem.maxChunk : fsize;
								var reader = new FileReader();
								reader.onloadend = function(theFile){
									if(theFile.target.readyState == FileReader.DONE){
										fileEntry.createWriter(function(fileWriter){
											fileWriter.onwrite = function(e){
												filesystem.file.properties(fileEntry.fullPath, function(value){
													currSize = value.size;
													if(currSize < fsize){
														if(document.getElementById('progress_'+fname)){
															var progBar = document.getElementById('progress_'+fname);
															progBar.style.width = (currSize/fsize)*100+'%';
														}
														filesystem.support.multiPartUpload(dir, file, success, failure);
													} else {
														if(document.getElementById('progress_'+fname)){
															var progBar = document.getElementById('progress_'+fname);
															progBar.className = progBar.className+' complete';
															progBar.style.width = '100%';
														}
														filesystem.directory.read(dir);
													}
												});
											}
											fileWriter.onerror = function(e){
												filesystem.errorHandler(e);
												if(document.getElementById('progress_'+fname)){
													var progBar = document.getElementById('progress_'+fname);
													progBar.className = progBar.className+' error';
												}
												if(failure){
													failure(e);
												}
											};
											fileWriter.seek(fileWriter.length);
											var wblob = new Blob([theFile.target.result], {type: ftype});
											fileWriter.write(wblob);
										}, function(e){
											filesystem.errorHandler(e);
											if(failure){
												failure(e);
											}
										});
									}
								};
								reader.onerror = function(e){
									filesystem.errorHandler(e);
									if(failure){
										failure(e);
									}
								};
								var rblob = file.slice(start, end);
								if(ftype.match('text.*')){
									reader.readAsText(rblob);
								} else {
									reader.readAsArrayBuffer(rblob);
								}
							}
						});
					}, function(e){
						filesystem.errorHandler(e);
						if(failure){
							failure(e);
						}
					});
				}, function(e){
					filesystem.errorHandler(e);
					if(failure){
						failure(e);
					}
				});
			},
			dragOver:function(evt){
				evt.stopPropagation();
				evt.preventDefault();
			},
			drop:function(evt, dir, success, failure){
				evt.stopPropagation();
				evt.preventDefault();
				f = evt.dataTransfer.files[0];
				filesystem.support.upload(dir, f, evt.target, success, failure);
			},
			filetypeSearch:function(ext){
				for(var mime in filesystem.filetypes){
					var types = filesystem.filetypes[mime];
					if(types.contains(ext)){
						return mime;
					}
				}
			},
			roundTo:function(number, decimals){
				var multiplier = Math.pow(10, decimals);
				return Math.round(number * multiplier) / multiplier;
			},
			urlencode:function(str){
				str = (str + '').toString();
				return encodeURIComponent(str).replace(/'/g, '%27').replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/!/g, '%21').replace(/\*/g, '%2A');
			},
			urldecode:function(str){
				return decodeURIComponent((str + '').replace(/\+/g, '%20'));
			},
			ajax:function(type, address, data, success, failure, responseType, requestHeaders){
				if(window.XMLHttpRequest){
					var xhr = {};
					xhr.address = new XMLHttpRequest();
					if(xhr.address.upload){
						xhr.address.onload = function(e){
							if(success){
								success(e);
							}
						};
						xhr.address.onerror = function(e){
							if(failure){
								failure(e);
							}
						}
						xhr.address.open(type, address, true);
						if(requestHeaders){
							for(header in requestHeaders){
								xhr.address.setRequestHeader(header, requestHeaders[header]);
							}
						}
						if(responseType){
							xhr.address.responseType = responseType;
						}
						xhr.address.send(data);
					} else {
						if(failure){
							failure();
						}
					}
				} else {
					if(failure){
						failure();
					}
				}
			},
			ab2str:function(buf) {
				// credit to http://stackoverflow.com/users/1429114/mangini
				// http://stackoverflow.com/a/11058858/1734964
				return String.fromCharCode.apply(null, new Uint16Array(buf));
			},
			str2ab:function(str) {
				// credit to http://stackoverflow.com/users/1429114/mangini
				// http://stackoverflow.com/a/11058858/1734964
				var buf = new ArrayBuffer(str.length*2);
				var bufView = new Uint16Array(buf);
				for (var i=0, strLen=str.length; i<strLen; i++) {
					bufView[i] = str.charCodeAt(i);
				}
				return buf;
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
	if(!Array.prototype.contains){
		Array.prototype.contains = function(term){
			"use strict";
			for(var i = 0, len = this.length; i < len; i++){
				if(this[i] === term){
					return true;
				}
			}
			return false;
		}
	}
	if(!Array.prototype.find){
		Array.prototype.find = function(term){
			"use strict";
			for (var i = 0, len = this.length; i < len; i++) {
				if (this[i] === term) {
					return i;
				}
			}
			return false;
		}
	}
	return filesystem;
}