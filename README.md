#FileSystem#

A JavaScript object to make interacting with the HTML5 FileSystem API super-easy!

##Commands##

###Implemented###

* `filesystem.request(type, [size])` - request a FileSystem allocation
* `filesystem.directory.read(path)` - read the given path
* `filesystem.directory.create(path)` - create a directory path recursively
* `filesystem.directory.delete(path)` - recursively delete all files and directories along the path
* `filesystem.file.create(path)` - create a file, including its directory path
* `filesystem.file.delete(path)` - delete the file specified by path

###Working on###

* `filesystem.file.read(path)` - read a stored file and return its contents
* `filesystem.file.write(path, data, [append])` - write to a file
    * attempt to create file if it doesn't exist
    * optional third parameter, set to `true` to append
* `filesystem.file.upload(id, [multiple])` - upload one or more local files to the FileSystem
* `filesystem.copy(source, destination)` - copy a file or directory
* `filesystem.move(source, destination)` - move a file or directory
* `filesystem.rename(old, new, [cwd])` - rename a file or directory
* `filesystem.properties(path)` - get the metadata of a file or directory
* `filesystem.url.get(path)` - get the URL of a file or directory from a path
* `filesystem.url.resolve(path)` - resolve the URL of a file or directory into a path

All paths should be from root, not relative, unless the command has an optional `[cwd]` parameter.

##To Do##

* Make `filesystem.onInitFs(fs)` private
* Improve `filesystem.errorHandler(e)` and make private
* Make `FileSystem()` into a reusable object (change `filesystem` references into `this` and `this.parent`)
* Investigate any other methods that are needed/could be helpful

##License##

See included LICENSE.md file.