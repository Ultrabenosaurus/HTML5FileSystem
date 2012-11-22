if ( !Array.prototype.forEach ) {
	Array.prototype.forEach = function(fn, scope) {
		for(var i = 0, len = this.length; i < len; ++i) {
			fn.call(scope, this[i], i, this);
		}
	}
}

function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries, dir) {
	// console.log(entries);
	dir = (dir == '../') ? "" : dir;
	dir = (dir.substring(-1) == '/') ? dir : dir+'/';
	document.querySelector('#filelist').innerHTML = (dir) ? "<strong>"+dir+"</strong>" : "<strong>/</strong>";
	// Document fragments can improve performance since they're only appended
	// to the DOM once. Only one browser reflow occurs.
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
}

function getFiles(name){
	inputs = document.getElementsByName(name);
	files = [];
	for(var i = 0, f; f = inputs[i]; i++){
		if(typeof f !== 'undefined'){
			files.push(f.files[0]);
		}
	}
	return (files.length > 0) ? files : false;
}

function uploadFiles(name, filesystem, dir, success, failure){
	files = getFiles(name);
	if(files){
		for(var i = 0, f; f = files[i]; i++){
			filesystem.file.upload(dir, f, success, failure);
		}
	}
}