#FileSystem#

**THIS IS THE DEVELOPMENT VERSION - NOT GUARANTEED TO WORK EVEN IF METHODS ARE IMPLEMENTED**

A JavaScript object to make interacting with the HTML5 FileSystem API super-easy!

All paths should be from root, not relative.

Any method that takes a `success` parameter requires this to be a valid callback, as the underlying API methods return `void` and rely on callbacks themselves so no natural return is possible.

Methods that take the `type` parameter are looking for a string that contains either `file` or `directory` - giving any other value will cause them to fail, maybe silently.

##Commands##

###Implemented###

* `filesystem.request(type, [size])` - request a FileSystem allocation
* `filesystem.directory.read(path)` - read the given path
* `filesystem.directory.create(path)` - create a directory path recursively
* `filesystem.directory.delete(path)` - recursively delete all files and directories along the path
* `filesystem.file.create(path)` - create a file, including its directory path
* `filesystem.file.delete(path)` - delete the file specified by path
* `filesystem.file.write(path, data, success, [append])` - write to a file
    * attempt to create file if it doesn't exist
    * optional third parameter, set to `true` to append
* `filesystem.file.read(path, success)` - read a stored file and return its contents
* `filesystem.properties(path, success)` - get the metadata of a file or directory
* `filesystem.url.get(path, success)` - get the URL of a file or directory from a path
* `filesystem.url.resolve(url, success)` - resolve the URL of a file or directory into a path

###Working on###

* `filesystem.file.upload(id, [multiple])` - upload one or more local files to the FileSystem
* `filesystem.copy(type, source, destination)` - copy a file or directory
* `filesystem.move(type, source, destination)` - move a file or directory
* `filesystem.rename(type, old, new)` - rename a file or directory


##To Do##

* Improve `filesystem.errorHandler(e)`
* Investigate any other methods that are needed/could be helpful

##License##

See included LICENSE.md file.