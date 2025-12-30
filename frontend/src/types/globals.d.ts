interface NotificationOptions {
  actions?: NotificationAction[];
  renotify?: boolean;
  timestamp?: number;
  vibrate?: number[] | number;
  image?: string;
}

// FileSystem API types for folder/file drag and drop
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
  file(successCallback: (file: File) => void): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries(successCallback: (entries: FileSystemEntry[]) => void): void;
}

interface DataTransferItem {
  webkitGetAsEntry?(): FileSystemEntry | null;
}
