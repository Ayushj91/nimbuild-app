import RNFS from 'react-native-fs';
import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Download Service
 * Handles file downloads with proper permissions and error handling
 */

interface DownloadResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

/**
 * Request storage permission for Android
 */
const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return true; // iOS doesn't need explicit permission for downloads
    }

    try {
        if (Platform.Version >= 33) {
            // Android 13+ doesn't require storage permissions for scoped storage
            return true;
        }

        const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
            return true;
        }

        if (result === RESULTS.DENIED) {
            const requestResult = await request(permission);
            return requestResult === RESULTS.GRANTED;
        }

        // Blocked or unavailable
        Alert.alert(
            'Permission Required',
            'Storage permission is required to download files. Please enable it in settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
        );
        return false;
    } catch (error) {
        console.error('Permission request error:', error);
        return false;
    }
};

/**
 * Get the appropriate download directory for the platform
 */
const getDownloadDirectory = (): string => {
    if (Platform.OS === 'ios') {
        return RNFS.DocumentDirectoryPath;
    }
    return RNFS.DownloadDirectoryPath;
};

/**
 * Generate a unique filename if file already exists
 */
const getUniqueFilePath = async (directory: string, filename: string): Promise<string> => {
    let filePath = `${directory}/${filename}`;
    let counter = 1;
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

    while (await RNFS.exists(filePath)) {
        filePath = `${directory}/${nameWithoutExt} (${counter})${extension}`;
        counter++;
    }

    return filePath;
};

/**
 * Download a file from URL to device storage
 */
export const downloadFile = async (
    url: string,
    filename: string,
    onProgress?: (progress: number) => void
): Promise<DownloadResult> => {
    try {
        // Request permission
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            return {
                success: false,
                error: 'Storage permission denied',
            };
        }

        // Get download directory
        const downloadDir = getDownloadDirectory();
        const filePath = await getUniqueFilePath(downloadDir, filename);

        console.log('Downloading to:', filePath);

        // Download the file
        const downloadResult = await RNFS.downloadFile({
            fromUrl: url,
            toFile: filePath,
            progress: onProgress
                ? (res) => {
                    const progress = res.bytesWritten / res.contentLength;
                    onProgress(progress);
                }
                : undefined,
        }).promise;

        if (downloadResult.statusCode === 200) {
            console.log('Download successful:', filePath);
            return {
                success: true,
                filePath,
            };
        } else {
            console.error('Download failed with status:', downloadResult.statusCode);
            return {
                success: false,
                error: `Download failed with status ${downloadResult.statusCode}`,
            };
        }
    } catch (error: any) {
        console.error('Download error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
        };
    }
};





/**
 * Open a downloaded file with external app
 */
export const openFile = async (filePath: string, filename: string): Promise<void> => {
    try {
        if (Platform.OS === 'android') {
            const FileViewer = require('react-native-file-viewer').default;
            await FileViewer.open(filePath, {
                showOpenWithDialog: true,
                showAppsSuggestions: true,
            });
        } else {
            // iOS - open with share sheet
            const Share = require('react-native').Share;
            await Share.share({
                url: `file://${filePath}`,
                title: filename,
            });
        }
    } catch (error: any) {
        console.error('Open file error:', error);
        if (error.message?.includes('No app')) {
            Alert.alert('No App Found', 'No app available to open this file type.');
        } else {
            Alert.alert('Error', 'Failed to open file.');
        }
    }
};

/**
 * Delete a file
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
        await RNFS.unlink(filePath);
        return true;
    } catch (error) {
        console.error('Delete file error:', error);
        return false;
    }
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        return await RNFS.exists(filePath);
    } catch {
        return false;
    }
};

export default {
    downloadFile,
    openFile,
    deleteFile,
    fileExists,
};
