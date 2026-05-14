export async function getFilesFromDataTransfer(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];
  const promises: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        promises.push(traverseFileTree(entry, '', files));
      } else {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }

  await Promise.all(promises);
  return files;
}

// Extending File to support the non-standard path property used internally
export interface FileWithPath extends File {
  path?: string;
}

function traverseFileTree(item: FileSystemEntry, path: string, files: File[]): Promise<void> {
  return new Promise((resolve) => {
    if (item.isFile) {
      const fileEntry = item as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        if (path) {
          // Attach custom path for folder structure preservation
          (file as FileWithPath).path = path + file.name;
        }
        files.push(file);
        resolve();
      });
    } else if (item.isDirectory) {
      const dirEntry = item as FileSystemDirectoryEntry;
      const dirReader = dirEntry.createReader();
      
      // readEntries may need to be called multiple times, but for now we keep existing behavior
      dirReader.readEntries((entries: FileSystemEntry[]) => {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < entries.length; i++) {
          promises.push(traverseFileTree(entries[i], path + item.name + "/", files));
        }
        Promise.all(promises).then(() => resolve());
      });
    } else {
      resolve();
    }
  });
}

