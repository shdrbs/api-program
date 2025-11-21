const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// --- [설정 1] 로그 설정 ---
// 업데이트 관련 로그가 파일로 저장되도록 설정합니다.
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const createWindow = () => {
	const win = new BrowserWindow({
		width: 1100,
		height: 760,
		minWidth: 900,
		minHeight: 600,
		autoHideMenuBar: false,
		webPreferences: {
			contextIsolation: true,
			// preload: path.join(__dirname, 'preload.js'), // 필요시 사용
		},
	});

	win.loadFile(path.join(__dirname, 'index.html'));
};

const initAutoUpdater = () => {
	if (!app.isPackaged) {
		log.info('[auto-updater] development mode - skipped');
		return;
	}

	// --- [설정 2] 코드 서명 검증 비활성화 (중요!) ---
	// 코드 서명(인증서) 없이 업데이트하려면 이 옵션이 필수입니다.
	autoUpdater.verifyUpdateCodeSignature = false;

	// 업데이트 설정
	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;
	
	// 업데이트 체크 간격 (밀리초) - 1시간마다 체크
	const CHECK_INTERVAL = 60 * 60 * 1000; 

	const checkForUpdates = () => {
		log.info('[auto-updater] checking for updates...');
		// 에러 핸들링 강화
		autoUpdater.checkForUpdates().catch((error) => {
			log.error('[auto-updater] update check failed:', error);
		});
	};

	// --- 이벤트 리스너 (console.log -> log.info로 변경) ---
	
	autoUpdater.on('checking-for-update', () => {
		log.info('[auto-updater] checking for updates...');
	});

	autoUpdater.on('update-available', (info) => {
		log.info(`[auto-updater] new version ${info.version} detected. Current: ${app.getVersion()}`);
	});

	autoUpdater.on('update-not-available', (info) => {
		log.info(`[auto-updater] already using the latest version (current: ${app.getVersion()})`);
	});

	autoUpdater.on('download-progress', (progress) => {
		const percent = Math.round(progress.percent * 10) / 10;
		const speed = Math.round(progress.bytesPerSecond / 1024);
		log.info(`[auto-updater] download progress: ${percent}% (${speed} KB/s)`);
	});

	autoUpdater.on('update-downloaded', (info) => {
		log.info(`[auto-updater] download completed, version ${info.version} ready.`);
		
		// 사용자에게 알림창 표시
		dialog.showMessageBox({
			type: 'info',
			title: '업데이트 준비 완료',
			message: `새 버전 ${info.version}이 다운로드되었습니다. 지금 재시작하여 업데이트할까요?`,
			buttons: ['지금 재시작', '나중에'],
			defaultId: 0,
			cancelId: 1,
		}).then((result) => {
			if (result.response === 0) {
				log.info('[auto-updater] User chose to restart.');
				// 강제로 종료하고 설치 (조용히 설치되지 않도록 확실하게 호출)
				autoUpdater.quitAndInstall(false, true); 
			} else {
				log.info('[auto-updater] User chose to restart later.');
			}
		});
	});

	autoUpdater.on('error', (error) => {
		log.error('[auto-updater] error occurred:', error);
		// 필요하다면 사용자에게 에러 알림을 띄울 수도 있습니다.
		// dialog.showErrorBox('Update Error', error == null ? "unknown" : (error.stack || error).toString());
	});

	// 앱 시작 시 즉시 체크
	checkForUpdates();

	// 주기적으로 업데이트 체크
	setInterval(checkForUpdates, CHECK_INTERVAL);
	
	log.info(`[auto-updater] initialized. Checking every ${CHECK_INTERVAL / 1000 / 60} minutes`);
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