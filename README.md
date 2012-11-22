# FileSystem #

A JavaScript object to make interacting with the HTML5 FileSystem API super-easy!

## Notes ##

All paths should be from root, not relative, unless a `dir` parameter is required in which case all other paths should be relative to `dir`.

Any method that takes a `success` parameter requires this to be a valid callback, as the underlying API methods return `void` and rely on callbacks themselves so no natural return is possible.

## Commands ##

### Implemented ###

**Generic**

* `filesystem.request(type, [size])` - request a FileSystem allocation
* `filesystem.init(fs)` - set initial variables, read root directory
* `filesystem.errorHandler(e)` - process errors (default: send to console)

**Directory**

* `filesystem.directory.create(path)` - create a directory path recursively
* `filesystem.directory.delete(path)` - recursively delete all files and directories along the path
* `filesystem.directory.copy(source, destination)` - copy a directory
* `filesystem.directory.rename(dir, old, new)` - rename a directory
* `filesystem.directory.read(path)` - read the given path
* `filesystem.directory.properties(path, success)` - get the metadata of a directory

**File**

* `filesystem.file.create(path)` - create a file, including its directory path
* `filesystem.file.delete(path)` - delete the file specified by path
* `filesystem.file.copy(source, destination)` - copy a file
* `filesystem.file.rename(dir, old, new)` - rename a file
* `filesystem.file.read(path, success)` - read a stored file and return its contents
* `filesystem.file.write(path, data, success, [append])` - write to a file
    * attempt to create file if it doesn't exist
    * optional `append` parameter, set to `true` to append
* `filesystem.file.properties(path, success)` - get the metadata of a file

**URL**

* `filesystem.url.get(path, success)` - get the URL of a file or directory from a path
* `filesystem.url.resolve(url, success)` - resolve the URL of a file or directory into a path

### Working on ###

* `filesystem.directory.move(source, destination)` - move a directory
* `filesystem.file.move(source, destination)` - move a file
* `filesystem.file.upload(id, [multiple])` - upload one or more local files to the FileSystem


## To Do ##

* Improve `filesystem.errorHandler(e)`
* Add support for other filetypes
    * Code this in a way that will allow others to easily add new definitions
* Investigate any other methods that are needed/could be helpful

## License ##

See included LICENSE.md file.