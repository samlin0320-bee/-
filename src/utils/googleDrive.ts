import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Shared token cache across Google Docs and Google Drive buttons to optimize user experience
let cachedGoogleAccessToken: string | null = null;

// Clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedGoogleAccessToken = null;
  }
});

/**
 * Access token getter that triggers popups with necessary Google Drive & Docs scopes if not already cached.
 */
export async function getGoogleAccessToken(forceConsent = false): Promise<string> {
  if (cachedGoogleAccessToken && !forceConsent) {
    return cachedGoogleAccessToken;
  }

  const provider = new GoogleAuthProvider();
  // Request BOTH Drive, Documents, and Calendar scopes to allow full integration features
  provider.addScope('https://www.googleapis.com/auth/drive');
  provider.addScope('https://www.googleapis.com/auth/documents');
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  if (forceConsent) {
    provider.setCustomParameters({
      prompt: 'consent'
    });
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) {
      throw new Error('無法從 Google 帳戶中獲取 Access Token，請確認已核准授權。');
    }

    cachedGoogleAccessToken = token;
    return token;
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    cachedGoogleAccessToken = null;
    throw error;
  }
}

/**
 * Set the token manually (e.g. from a separate popup result if needed)
 */
export function setCachedGoogleToken(token: string | null) {
  cachedGoogleAccessToken = token;
}

/**
 * Helper to upload as standard Markdown file to users' Google Drive
 */
export async function uploadToGoogleDrive(
  fileName: string,
  reportTitle: string,
  finalUserName: string,
  reportText: string
): Promise<string> {
  const token = await getGoogleAccessToken();

  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'text/markdown',
  };

  const markdownContent = `# 【印度占星星盤解讀大數據分析特刊】\n\n` +
                          `* **報告名稱:** ${reportTitle}\n` +
                          `* **分析對象:** ${finalUserName}\n` +
                          `* **建立日期:** ${new Date().toLocaleString()}\n` +
                          `* **系統算法:** 古典梵天印度占星 (Lahiri Sidereal)\n\n` +
                          `---\n\n` +
                          reportText;

  const payload = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
    markdownContent +
    closeDelimiter;

  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: payload
  });

  if (!uploadResponse.ok) {
    const errJson = await uploadResponse.json().catch(() => ({}));
    if (uploadResponse.status === 401) {
      cachedGoogleAccessToken = null;
    }
    throw new Error(errJson.error?.message || `上傳雲端硬碟遭遇錯誤：(代碼 ${uploadResponse.status})`);
  }

  const fileData = await uploadResponse.json();
  return fileData.id;
}

/**
 * Interface representing a Google Drive File reference
 */
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

/**
 * Fetches the user's saved markdown reports or files from Google Drive
 */
export async function listGoogleDriveFiles(): Promise<GoogleDriveFile[]> {
  const token = await getGoogleAccessToken();

  // Query markdown files or general documents created by this app (using file search query filtering)
  const q = encodeURIComponent("mimeType = 'text/markdown' or mimeType = 'application/vnd.google-apps.document'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime+desc&fields=files(id,name,mimeType,webViewLink,createdTime)&pageSize=30`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedGoogleAccessToken = null;
    }
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `無法讀取 Google 雲端硬碟檔案 (代碼 ${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteGoogleDriveFile(fileId: string): Promise<void> {
  const token = await getGoogleAccessToken();

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedGoogleAccessToken = null;
    }
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `從 Google 雲端硬碟中刪除檔案失敗 (代碼 ${response.status})`);
  }
}

/**
 * Downloads a markdown or text file content from Google Drive by its file ID
 */
export async function downloadGoogleDriveFileContent(fileId: string): Promise<string> {
  const token = await getGoogleAccessToken();

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedGoogleAccessToken = null;
    }
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `無法讀取檔案內文 (代碼 ${response.status})`);
  }

  return response.text();
}
