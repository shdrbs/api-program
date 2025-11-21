const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const createWindow = () => {
	const win = new BrowserWindow({
		width: 1100,
		height: 760,
		minWidth: 900,
		minHeight: 600,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
		},
	});

	win.loadFile(path.join(__dirname, 'index.html'));
};

const initAutoUpdater = () => {
	if (!app.isPackaged) {
		console.log('[auto-updater] 개발 모드에서는 자동 업데이트를 건너뜁니다.');
		return;
	}

	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;

	autoUpdater.on('checking-for-update', () => {
		console.log('[auto-updater] 업데이트 확인 중...');
	});

	autoUpdater.on('update-available', (info) => {
		console.log(`[auto-updater] 새 버전 ${info.version} 감지, 다운로드 시작`);
	});

	autoUpdater.on('update-not-available', () => {
		console.log('[auto-updater] 최신 버전을 이미 사용 중입니다.');
	});

	autoUpdater.on('download-progress', (progress) => {
		const percent = Math.round(progress.percent * 10) / 10;
		console.log(`[auto-updater] 다운로드 진행률: ${percent}% (${Math.round(progress.bytesPerSecond / 1024)} KB/s)`);
	});

	autoUpdater.on('update-downloaded', () => {
		console.log('[auto-updater] 다운로드 완료. 사용자 승인을 기다립니다.');
		dialog
			.showMessageBox({
				type: 'info',
				title: '업데이트 준비 완료',
				message: '새 버전이 다운로드되었습니다. 지금 재시작하여 업데이트할까요?',
				buttons: ['지금 재시작', '나중에'],
				defaultId: 0,
				cancelId: 1,
			})
			.then((result) => {
				if (result.response === 0) {
					autoUpdater.quitAndInstall();
				}
			});
	});

	autoUpdater.on('error', (error) => {
		console.error('[auto-updater] 오류 발생:', error);
	});

	autoUpdater.checkForUpdates().catch((error) => {
		console.error('[auto-updater] 업데이트 확인 실패:', error);
	});
};

app.whenReady().then(() => {
	createWindow();
	initAutoUpdater();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
