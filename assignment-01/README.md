## Dropbox [(raw)](https://gist.github.com/CrabDude/040af9c1b93e350608ff/raw)

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: `6h`

### Features

#### HTTP file sync server

The `index.js` which will do.

- [✓] Client can make GET requests to get file or directory contents
- [✓] Client can make HEAD request to get just the GET headers 
- [✓] Client can make PUT requests to create new directories and files with content
- [✓] Client can make POST requests to update the contents of a file
- [✓] Client can make DELETE requests to delete files and folders
- [✓] Server will serve from `--dir` or cwd as root
- [✓] Client will sync from server over TCP to cwd or CLI `dir` argument

#### The TCP sync server/client

- [✓] Server will send a list of file system changes to client
- [✘] First time's full system sync
- [✘] Client ask for folder or file, and sync (should be easy)
- [✓] Client apply server's change's action in sequence, so it won't conflicts
- [✓] Sync logic is in separate module
- [✘] Isolate client and server sync code in FileSync module (should do it)
- [✓] Sync over tcp
- [✓] Middleware style compositble operations chain in FileSync module

![Video Walkthrough](./assignment-1.gif)

#### Optional

- [ ] Client and User will be redirected from HTTP to HTTPS
- [✓] Server will sync from client over TCP
- [ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
- [ ] Client can stream and scrub video files (e.g., on iOS)
- [ ] Client can download a directory as an archive
- [ ] Client can create a directory with an archive
- [ ] User can connect to the server using an FTP client

