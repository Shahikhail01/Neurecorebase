import type { DriveFile, CreateFolderInput, CreateFileInput } from './google-drive.service';

/**
 * WS-4.2: Drive service abstraction (Interface Segregation + DIP).
 *
 * Tools that read/write Drive depend on this interface, not on GoogleDriveService.
 * Allows swapping the implementation (e.g., Dropbox, OneDrive) without consumer changes.
 */
export interface IDriveService {
  createFolder(input: CreateFolderInput): Promise<DriveFile>;
  createFile(input: CreateFileInput): Promise<DriveFile>;
  listFiles(
    folderId: string,
    options?: { pageSize?: number },
  ): Promise<DriveFile[]>;
  deleteFile(fileId: string): Promise<void>;
  listAgentFolders(): Promise<{
    rootFolderId: string;
    agents: { agentId: string; agentName: string; folderId: string; folderLink?: string }[];
  }>;
  listRootTree(): Promise<{
    rootFolderId: string | null;
    children: { id: string; name: string; mimeType: string; webViewLink?: string; children: DriveFile[] }[];
  }>;
}

export const DRIVE_SERVICE = Symbol('DRIVE_SERVICE');
