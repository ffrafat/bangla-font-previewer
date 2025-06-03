const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fontkit = require('fontkit');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Load config from disk
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    console.warn('No config file found. Using defaults.');
    return {};
  }
}

// Save config to disk
function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config));
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // App menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Select Font Folder',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const folderPath = result.filePaths[0];
              saveConfig({ fontFolder: folderPath });
              mainWindow.webContents.send('font-folder-updated', folderPath);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Bangla Font Previewer',
              detail: `Version: 1.0 (Build: 2506.02)
Author: Faisal F Rafat
Email: ff@rafat.cc
Website: https://rafat.cc
GitHub: https://github.com/ffrafat

This is an open-source project. Contributions are welcome.`,
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Open Website',
          click: () => shell.openExternal('https://rafat.cc')
        },
        {
          label: 'Open GitHub',
          click: () => shell.openExternal('https://github.com/ffrafat')
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Get saved folder path on startup
ipcMain.handle('get-saved-font-folder', () => {
  const config = loadConfig();
  return config.fontFolder || null;
});

// IPC: User selects font folder manually
ipcMain.handle('select-font-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  saveConfig({ fontFolder: folderPath });
  return folderPath;
});

// IPC: Read font files
ipcMain.handle('read-font-files', async (event, folderPath) => {
  try {
    const files = await fs.promises.readdir(folderPath);
    const fontFiles = files.filter(file =>
      /\.(ttf|otf|woff|woff2)$/i.test(file)
    );

    const fonts = [];

    for (const file of fontFiles) {
      const fullPath = path.join(folderPath, file);
      try {
        const font = fontkit.openSync(fullPath);
        const fontName = font.fullName || path.basename(file);
        fonts.push({ path: fullPath, name: fontName });
      } catch (err) {
        console.error(`Failed to read font metadata for ${file}:`, err);
        fonts.push({ path: fullPath, name: path.basename(file) });
      }
    }

    return fonts;
  } catch (err) {
    console.error('Error reading font folder:', err);
    return [];
  }
});
