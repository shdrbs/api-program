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

	// 업데이트 설정
	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;
	
	// 업데이트 체크 간격 (밀리초) - 1시간마다 체크
	const CHECK_INTERVAL = 60 * 60 * 1000; // 1시간

	const checkForUpdates = () => {
		console.log('[auto-updater] 업데이트 확인 시작...');
		autoUpdater.checkForUpdates().catch((error) => {
			console.error('[auto-updater] 업데이트 확인 실패:', error);
		});
	};

	autoUpdater.on('checking-for-update', () => {
		console.log('[auto-updater] 업데이트 확인 중...');
	});

	autoUpdater.on('update-available', (info) => {
		console.log(`[auto-updater] 새 버전 ${info.version} 감지, 다운로드 시작`);
		console.log(`[auto-updater] 현재 버전: ${app.getVersion()}, 새 버전: ${info.version}`);
	});

	autoUpdater.on('update-not-available', (info) => {
		console.log(`[auto-updater] 최신 버전을 이미 사용 중입니다. (현재: ${app.getVersion()})`);
	});

	autoUpdater.on('download-progress', (progress) => {
		const percent = Math.round(progress.percent * 10) / 10;
		console.log(`[auto-updater] 다운로드 진행률: ${percent}% (${Math.round(progress.bytesPerSecond / 1024)} KB/s)`);
	});

	autoUpdater.on('update-downloaded', (info) => {
		console.log(`[auto-updater] 다운로드 완료. 버전 ${info.version} 준비됨. 사용자 승인을 기다립니다.`);
		dialog
			.showMessageBox({
				type: 'info',
				title: '업데이트 준비 완료',
				message: `새 버전 ${info.version}이 다운로드되었습니다. 지금 재시작하여 업데이트할까요?`,
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
		console.error('[auto-updater] 오류 상세:', error.message);
	});

	// 앱 시작 시 즉시 체크
	checkForUpdates();

	// 주기적으로 업데이트 체크 (1시간마다)
	setInterval(checkForUpdates, CHECK_INTERVAL);
	
	console.log(`[auto-updater] 자동 업데이트 초기화 완료. ${CHECK_INTERVAL / 1000 / 60}분마다 업데이트를 확인합니다.`);
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
