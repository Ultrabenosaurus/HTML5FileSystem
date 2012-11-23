# FileSystem #

**THIS IS THE DEVELOPMENT VERSION - NOT GUARANTEED TO WORK EVEN IF METHODS ARE IMPLEMENTED**

A JavaScript object to make interacting with the HTML5 FileSystem API super-easy!

## Notes ##

All paths should be from root, not relative, unless a `dir` parameter is required in which case all other paths should be relative to `dir`. Also, all paths should be provided as strings, not DirectoryEntry objects.

Any method that takes `success` and/or `failure` parameters requires these to be valid callbacks, as the underlying API methods return `void` and rely on callbacks themselves so no natural return is possible.

*Commands marked with an asterisk are not meant to be called directly.

## Commands ##

### Implemented ###

**Generic**

* `filesystem.request(type, [size])` - request a FileSystem allocation
* `filesystem.clear()` - deletes ALL files and directories in the FileSystem
* `filesystem.init(fs)`* - set initial variables, read root directory
* `filesystem.errorHandler(e)`* - process errors (default: send to console)

**Directory**

* `filesystem.directory.create(path)` - create a directory path recursively
* `filesystem.directory.delete(path)` - recursively delete all files and directories along the path
* `filesystem.directory.read(path, [success])` - read the given path
* `filesystem.directory.empty(path)` - delete all files and directories in the given path
* `filesystem.directory.copy(source, destination)` - copy a directory
* `filesystem.directory.move(source, destination)` - move a directory
* `filesystem.directory.rename(dir, old, new)` - rename a directory
* `filesystem.directory.properties(path, success)` - get the metadata of a directory

**File**

* `filesystem.file.create(path)` - create a file, including its directory path
* `filesystem.file.delete(path)` - delete the file specified by path
* `filesystem.file.read(path, success)` - read a stored text file and return its contents
* `filesystem.file.write(path, data, success, [append])` - write to a text file
    * attempt to create file if it doesn't exist
    * optional `append` parameter, set to `true` to append
* `filesystem.file.copy(source, destination)` - copy a file
* `filesystem.file.move(source, destination)` - move a file
* `filesystem.file.rename(dir, old, new)` - rename a file
* `filesystem.file.upload(name, dir, [success, [failure]])` - upload one or more local files to the FileSystem
* `filesystem.file.download(path)` - force a file in the FileSystem to be downloaded (Chrome only)
* `filesystem.file.properties(path, success)` - get the metadata of a file

**URL**

* `filesystem.url.get(path, success)` - get the URL of a file from a path
* `filesystem.url.resolve(url, success)` - resolve the URL of a file into a path

**Settings**

* `filesystem.settings.setQuota(bytes)` - set a custom storage quota before making a request
* `filesystem.settings.storage([success])` - returns current usage values
* `filesystem.settings.registerFiletypes(options)` - adds mime and filetypes for use with reading/writing files
* `filesystem.settings.getFiletypes()` - returns current filetype list

**Support**

* `filesystem.support.toArray(list)`* - convert an object to an array
* `filesystem.support.listResults(entries, dir)`* - output the results of `filesystem.directory.read()` to the webpage
* `filesystem.support.upload(dir, file, [success, [failure]])`* - this method actually performs the upload, called by `filesystem.file.upload()`
* `filesystem.support.filetypeSearch(ext)`* - searches registered filetypes and returns the mime or false

**Extras** - not part of the `filesystem` object

* `Array.prototype.forEach(fn, scope)`* - runs function `fn` for each item in the array
* `Array.prototype.contains(term)`* - returns true if `term` is found, or false
* `Array.prototype.find(term)`* - returns index of `term` if found, or false

## To Do ##

* Improve `filesystem.errorHandler(e)`
* Show progress of uploads
* Investigate any other methods that are needed/could be helpful

## License ##

See included LICENSE.md file.