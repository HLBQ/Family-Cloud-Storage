// 文件列表数据
let files = [];
let currentPath = '';

// DOM元素
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const fileTable = document.getElementById('file-table');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 模拟获取文件列表
    fetchFiles();
    
    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 上传文件夹按钮点击事件
    document.getElementById('upload-folder-btn').addEventListener('click', () => {
        document.getElementById('folder-input').click();
    });
    
    // 文件选择变化事件
    fileInput.addEventListener('change', handleFileUpload);

    // 文件夹选择变化事件
    document.getElementById('folder-input').addEventListener('change', handleFolderUpload);
    
    // 新建文件夹按钮点击事件
    document.getElementById('create-folder-btn').addEventListener('click', () => {
        document.getElementById('create-folder-modal').style.display = 'block';
    });
    
    // 导航按钮事件
    document.getElementById('home-btn').addEventListener('click', () => {
        currentPath = '';
        fetchFiles();
    });
    
    document.getElementById('up-btn').addEventListener('click', () => {
        if (currentPath) {
            const paths = currentPath.split('/');
            paths.pop();
            currentPath = paths.join('/');
            fetchFiles();
        }
    });
    
    // 新建文件夹弹窗事件
    document.getElementById('folder-confirm').addEventListener('click', async () => {
        const folderName = document.getElementById('folder-name-input').value;
        if (!folderName) return;
        
        document.getElementById('create-folder-modal').style.display = 'none';
        await createFolder(folderName);
        document.getElementById('folder-name-input').value = '';
    });
    
    document.getElementById('folder-cancel').addEventListener('click', () => {
        document.getElementById('create-folder-modal').style.display = 'none';
        document.getElementById('folder-name-input').value = '';
    });
});

// 获取文件列表
async function fetchFiles() {
    try {
        const response = await fetch(`http://${window.location.hostname}:3000/api/files?path=${encodeURIComponent(currentPath)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        files = await response.json();
        renderFileList();
        
        // 更新面包屑导航
        const breadcrumb = document.querySelector('.breadcrumb .path');
        breadcrumb.textContent = currentPath || '全部文件';
    } catch (error) {
        console.error('获取文件列表失败:', error);
        alert(t('fetchFilesError'));
    }
}

// 渲染文件列表
function renderFileList() {
    fileTable.innerHTML = '';
    
    files.forEach(file => {
        const row = document.createElement('tr');
        const isDir = file.isDirectory;
        const ext = isDir ? '' : file.name.split('.').pop().toLowerCase();
        let icon = '6.webp';
        
        if (isDir) {
            icon = '3.webp';
        } else if (['mp4','avi','mov','mkv'].includes(ext)) {
            icon = '1.webp';
        } else if (['mp3','wav','aac','flac'].includes(ext)) {
            icon = '2.webp';
        } else if (['zip','rar','7z','tar'].includes(ext)) {
            icon = '4.webp';
        } else if (['txt','doc','docx','pdf'].includes(ext)) {
            icon = '5.webp';
        } else if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
            icon = '7.webp';
        }
        
        row.innerHTML = `
            <td>
                <img src="image/${icon}" class="file-icon">
                ${isDir ? 
                    `<span class="folder-item" data-name="${file.name}">${file.name}</span>` : 
                    file.name
                }
            </td>
            <td>${isDir ? '-' : formatFileSize(file.size)}</td>
            <td>${new Date(file.modified).toLocaleString()}</td>
            <td class="action-buttons">
                ${isDir ? 
                    `<a href="#" class="download-folder-btn" data-name="${file.name}"><img src="image/8.webp" class="action-icon" title="下载文件夹" data-name="${file.name}"></a>` : 
                    `<a href="http://${window.location.hostname}:3000/api/download/${file.name}?path=${encodeURIComponent(currentPath)}" class="download-btn"><img src="image/9.webp" class="action-icon" title="下载文件"></a>`
                }
                <a href="#" class="rename-btn" data-name="${file.name}"><img src="image/11.webp" class="action-icon" title="重命名" data-name="${file.name}"></a>
                <a href="#" class="delete-btn" data-name="${file.name}"><img src="image/10.webp" class="action-icon" title="删除" data-name="${file.name}"></a>
            </td>
        `;
        
        fileTable.appendChild(row);
    });

    // 绑定事件
    document.querySelectorAll('.rename-btn').forEach(btn => {
        btn.addEventListener('click', handleRename);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
    
    document.querySelectorAll('.download-folder-btn').forEach(btn => {
        btn.addEventListener('click', handleDownloadFolder);
    });

        document.querySelectorAll('tr').forEach(row => {
            const folderItem = row.querySelector('.folder-item');
            const fileItem = row.querySelector('td:first-child');
            if (folderItem) {
                row.addEventListener('dblclick', () => {
                    handleFolderClick({ 
                        target: folderItem,
                        preventDefault: () => {} 
                    });
                });
            } else if (fileItem) {
                row.addEventListener('dblclick', () => {
                    const fileName = fileItem.textContent.trim();
                    const fileExt = fileName.split('.').pop().toLowerCase();
                    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
                    
                    // 图片预览
                    if (['jpg','jpeg','png','gif','webp'].includes(fileExt)) {
                        showImagePreview(filePath);
                    }
                    // 视频播放
                    else if (['mp4','avi','mov','mkv'].includes(fileExt)) {
                        showVideoPlayer(filePath);
                    }
                    // 音频播放
                    else if (['mp3','wav','aac','flac'].includes(fileExt)) {
                        showAudioPlayer(filePath);
                    }
                });
            }
        });
}

// 创建文件夹
async function createFolder(folderName) {
    if (!folderName) return;
    
    try {
        const pathWithSlash = currentPath && !currentPath.endsWith('/') ? currentPath + '/' : currentPath;
        console.log('创建文件夹请求参数:', { dirname: folderName, path: pathWithSlash });
        const response = await fetch(`http://${window.location.hostname}:3000/api/mkdir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dirname: folderName, path: pathWithSlash })
        });
        
        if (response.ok) {
            fetchFiles();
        } else {
            const error = await response.json();
            alert(error.error || t('createError'));
        }
    } catch (error) {
        console.error('创建文件夹出错:', error);
        alert(t('createError'));
    }
}

// 重命名文件
async function handleRename(e) {
    e.preventDefault();
    // 从点击的元素或其父元素获取文件名
    let oldName;
    if (e.target.classList.contains('action-icon')) {
        // 点击的是图标
        oldName = e.target.parentElement.dataset.name;
    } else if (e.target.classList.contains('rename-btn')) {
        // 点击的是链接
        oldName = e.target.dataset.name;
    } else {
        // 尝试从最近的.rename-btn元素获取
        const renameBtn = e.target.closest('.rename-btn');
        if (renameBtn) {
            oldName = renameBtn.dataset.name;
        }
    }
    
    if (!oldName) {
        console.error('无法获取文件名:', {
            target: e.target,
            currentTarget: e.currentTarget,
            dataset: e.target.dataset
        });
        alert(t('noFilename'));
        return;
    }
    
    // 显示自定义重命名弹窗
    const renameModal = document.getElementById('rename-modal');
    const renameInput = document.getElementById('rename-input');
    const renameConfirm = document.getElementById('rename-confirm');
    const renameCancel = document.getElementById('rename-cancel');
    
    renameInput.value = oldName;
    renameModal.style.display = 'block';
    
    // 等待用户确认或取消
    const newName = await new Promise((resolve) => {
        renameConfirm.onclick = () => {
            renameModal.style.display = 'none';
            resolve(renameInput.value);
        };
        renameCancel.onclick = () => {
            renameModal.style.display = 'none';
            resolve(null);
        };
    });
    
    if (!newName || newName === oldName) return;
    
    try {
        const response = await fetch(`http://${window.location.hostname}:3000/api/rename`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                oldName: currentPath ? `${currentPath}/${oldName}` : oldName,
                newName: currentPath ? `${currentPath}/${newName}` : newName
            })
        });
        
        if (response.ok) {
            fetchFiles();
        } else {
            const error = await response.json();
            alert(error.error || t('renameError'));
        }
    } catch (error) {
        console.error('重命名出错:', error);
        alert(t('renameError'));
    }
}

// 删除文件
async function handleDelete(e) {
    e.preventDefault();
    // 调试日志
    console.log('Delete event:', e);
    
    // 从点击的元素或其父元素获取文件名
    let filename;
    if (e.target.classList.contains('action-icon')) {
        // 点击的是图标
        filename = e.target.parentElement.dataset.name;
    } else if (e.target.classList.contains('delete-btn')) {
        // 点击的是链接
        filename = e.target.dataset.name;
    } else {
        // 尝试从最近的.delete-btn元素获取
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            filename = deleteBtn.dataset.name;
        }
    }
    
    if (!filename) {
        console.error('无法获取文件名:', {
            target: e.target,
            currentTarget: e.currentTarget,
            dataset: e.target.dataset
        });
        alert(t('noFilename'));
        return;
    }

    // 显示自定义删除确认弹窗
    const deleteModal = document.getElementById('delete-modal');
    const deleteMessage = document.getElementById('delete-message');
    const deleteConfirm = document.getElementById('delete-confirm');
    const deleteCancel = document.getElementById('delete-cancel');
    
    deleteMessage.textContent = t('deleteMessage', { filename: filename });
    deleteModal.style.display = 'block';
    
    // 等待用户确认或取消
    const confirmed = await new Promise((resolve) => {
        deleteConfirm.onclick = () => {
            deleteModal.style.display = 'none';
            resolve(true);
        };
        deleteCancel.onclick = () => {
            deleteModal.style.display = 'none';
            resolve(false);
        };
    });
    
    if (!confirmed) return;
    
    try {
        const fullPath = currentPath ? `${currentPath}/${filename}` : filename;
        const response = await fetch(`http://${window.location.hostname}:3000/api/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                filename: filename,
                path: currentPath || '',
                fullPath: fullPath
            })
        });
        
        if (response.ok) {
            fetchFiles();
        } else {
            const error = await response.json();
            alert(error.error || t('deleteError'));
        }
    } catch (error) {
        console.error('删除出错:', error);
        alert(t('deleteError'));
    }
}

// 显示上传进度弹窗
function showUploadProgress() {
    const modal = document.getElementById('upload-progress-modal');
    modal.style.display = 'block';
}

// 隐藏上传进度弹窗
function hideUploadProgress() {
    const modal = document.getElementById('upload-progress-modal');
    modal.style.display = 'none';
    
    // 重置进度条
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');
    const speedText = document.getElementById('upload-speed-text');
    
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    speedText.textContent = '';
}

// 更新上传进度
let lastLoaded = 0;
let lastTime = 0;

function updateUploadProgress(e) {
    const percent = Math.round((e.loaded / e.total) * 100);
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');
    const speedText = document.getElementById('upload-speed-text');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    
    // 计算上传速度
    const now = Date.now();
    if (lastTime > 0) {
        const timeDiff = (now - lastTime) / 1000; // 秒
        const loadedDiff = e.loaded - lastLoaded;
        const speed = loadedDiff / timeDiff; // bytes/s
        
        let speedStr;
        if (speed > 1024 * 1024) {
            speedStr = `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
        } else if (speed > 1024) {
            speedStr = `${(speed / 1024).toFixed(1)} KB/s`;
        } else {
            speedStr = `${Math.round(speed)} B/s`;
        }
        
        speedText.textContent = speedStr;
    }
    
    lastLoaded = e.loaded;
    lastTime = now;
}

// 处理文件上传
async function handleFileUpload(e) {
    const selectedFiles = e.target.files;
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
        // 确保中文文件名正确编码
        const file = selectedFiles[i];
        formData.append('files', file, encodeURIComponent(file.name));
    }
    
    await uploadFormData(formData);
}

// 处理文件夹上传
async function handleFolderUpload(e) {
    const folderInput = e.target;
    if (!folderInput.files || folderInput.files.length === 0) return;
    
    showUploadProgress();
    updateUploadProgress(0);
    
    try {
        // 获取文件夹路径
        const folderPath = folderInput.files[0].webkitRelativePath.split('/')[0];
        
        // 先创建文件夹
        await createFolder(folderPath);
        
        // 创建FormData并添加所有文件
        const formData = new FormData();
        for (let i = 0; i < folderInput.files.length; i++) {
            const file = folderInput.files[i];
            const relativePath = file.webkitRelativePath.replace(folderPath + '/', '');
            formData.append('files', file, encodeURIComponent(relativePath));
        }
        
        await uploadFormData(formData, folderPath);
    } catch (error) {
        hideUploadProgress();
        console.error('上传文件夹出错:', error);
        alert(t('folderUploadError'));
    }
}

// 通用上传函数
async function uploadFormData(formData, folderPath = '') {
    showUploadProgress();
    updateUploadProgress(0);
    
    try {
        const xhr = new XMLHttpRequest();
        const url = `http://${window.location.hostname}:3000/api/upload?path=${encodeURIComponent(currentPath)}${folderPath ? `/${encodeURIComponent(folderPath)}` : ''}`;
        xhr.open('POST', url, true);
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                updateUploadProgress(e);
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                updateUploadProgress(100);
                setTimeout(() => {
                    hideUploadProgress();
                    fetchFiles();
                }, 500);
            } else {
                hideUploadProgress();
                alert(t('uploadError'));
            }
        };
        
        xhr.onerror = () => {
            hideUploadProgress();
            alert(t('uploadError'));
        };
        
        xhr.send(formData);
    } catch (error) {
        hideUploadProgress();
        console.error('上传出错:', error);
        alert(t('uploadError'));
    }
}

// 下载文件夹
async function handleDownloadFolder(e) {
    e.preventDefault();
    // 从点击的元素或其父元素获取文件夹名
    let folderName;
    if (e.target.classList.contains('action-icon')) {
        // 点击的是图标
        folderName = e.target.parentElement.dataset.name;
    } else if (e.target.classList.contains('download-folder-btn')) {
        // 点击的是链接
        folderName = e.target.dataset.name;
    } else {
        // 尝试从最近的.download-folder-btn元素获取
        const downloadBtn = e.target.closest('.download-folder-btn');
        if (downloadBtn) {
            folderName = downloadBtn.dataset.name;
        }
    }
    
    if (!folderName) {
        console.error('无法获取文件夹名:', {
            target: e.target,
            currentTarget: e.currentTarget,
            dataset: e.target.dataset
        });
        alert(t('noFolderName'));
        return;
    }
    const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    console.log('下载文件夹路径:', fullPath);
    window.location.href = `/api/download-folder/${encodeURIComponent(fullPath)}`;
}

// 处理文件夹点击
async function handleFolderClick(e) {
    e.preventDefault();
    const folderName = e.target.dataset.name;
    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    fetchFiles();
}

// 全局媒体元素引用
let currentMediaElement = null;

// 关闭预览
function closePreview() {
    const previewModal = document.getElementById('preview-modal');
    if (currentMediaElement) {
        currentMediaElement.pause();
        currentMediaElement = null;
    }
    previewModal.style.display = 'none';
}

// 图片预览
function showImagePreview(filePath) {
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    const previewControls = document.querySelector('.preview-controls');
    
    previewContent.innerHTML = `
        <img src="/uploads/${filePath}" class="image-preview">
    `;
    previewControls.innerHTML = '';
    previewModal.style.display = 'block';
}

// 视频播放器
function showVideoPlayer(filePath) {
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    previewContent.innerHTML = `
        <div class="video-container">
            <video autoplay>
                <source src="/uploads/${filePath}" type="video/mp4">
                您的浏览器不支持视频播放
            </video>
            <div class="video-controls">
                <button class="play-pause-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M6 4l15 8-15 8z" fill="currentColor"/>
                    </svg>
                </button>
                <span class="time-display current-time">00:00</span>
                <div class="progress-bar">
                    <div class="progress-filled"></div>
                </div>
                <span class="time-display duration">00:00</span>
                <button class="volume-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="fullscreen-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="preview-close" onclick="closePreview()">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
        </div>
    `;
    previewModal.style.display = 'block';
    
    const video = previewContent.querySelector('video');
    currentMediaElement = video;
    
    // 初始化控制栏
    const playBtn = previewContent.querySelector('.play-pause-btn');
    const progressBar = previewContent.querySelector('.progress-bar');
    const progressFilled = previewContent.querySelector('.progress-filled');
    const currentTimeDisplay = previewContent.querySelector('.current-time');
    const durationDisplay = previewContent.querySelector('.duration');
    const fullscreenBtn = previewContent.querySelector('.fullscreen-btn');
    const volumeBtn = previewContent.querySelector('.volume-btn');
    
    // 播放/暂停控制
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                </svg>
            `;
        } else {
            video.pause();
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M6 4l15 8-15 8z" fill="currentColor"/>
                </svg>
            `;
        }
    });
    
    // 进度条更新
    video.addEventListener('timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressFilled.style.width = `${percent}%`;
        currentTimeDisplay.textContent = formatTime(video.currentTime);
    });
    
    // 点击进度条跳转
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    });
    
    // 全屏控制
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            previewContent.requestFullscreen().catch(err => {
                console.error(`全屏错误: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
    
    // 音量控制
    volumeBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        volumeBtn.innerHTML = video.muted ? `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
            </svg>
        ` : `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
            </svg>
        `;
    });
    
    // 视频加载完成
    video.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(video.duration);
    });
    
    // 自适应视频尺寸
    function resizeVideo() {
        const container = previewContent.querySelector('.video-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const videoRatio = video.videoWidth / video.videoHeight;
        
        if (containerWidth / containerHeight > videoRatio) {
            video.style.width = 'auto';
            video.style.height = '100%';
        } else {
            video.style.width = '100%';
            video.style.height = 'auto';
        }
    }
    
    video.addEventListener('loadedmetadata', resizeVideo);
    window.addEventListener('resize', resizeVideo);
}

// 格式化时间显示
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 音频播放器
function showAudioPlayer(filePath) {
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    previewContent.innerHTML = `
        <div class="audio-container">
            <div class="audio-info">
                <div class="audio-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="audio-title">${filePath.split('/').pop()}</div>
            </div>
            <audio autoplay>
                <source src="/uploads/${filePath}" type="audio/mpeg">
                您的浏览器不支持音频播放
            </audio>
            <div class="audio-controls">
                <button class="play-pause-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M6 4l15 8-15 8z" fill="currentColor"/>
                    </svg>
                </button>
                <span class="time-display current-time">00:00</span>
                <div class="progress-bar">
                    <div class="progress-filled"></div>
                </div>
                <span class="time-display duration">00:00</span>
                <button class="volume-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
            <div class="preview-close" onclick="closePreview()">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
            </div>
        </div>
    `;
    previewModal.style.display = 'block';
    
    const audio = previewContent.querySelector('audio');
    currentMediaElement = audio;
    
    // 初始化控制栏
    const playBtn = previewContent.querySelector('.play-pause-btn');
    const progressBar = previewContent.querySelector('.progress-bar');
    const progressFilled = previewContent.querySelector('.progress-filled');
    const currentTimeDisplay = previewContent.querySelector('.current-time');
    const durationDisplay = previewContent.querySelector('.duration');
    const volumeBtn = previewContent.querySelector('.volume-btn');
    
    // 播放/暂停控制
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                </svg>
            `;
        } else {
            audio.pause();
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M6 4l15 8-15 8z" fill="currentColor"/>
                </svg>
            `;
        }
    });
    
    // 进度条更新
    audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFilled.style.width = `${percent}%`;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
    });
    
    // 点击进度条跳转
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * audio.duration;
    });
    
    // 音量控制
    volumeBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        volumeBtn.innerHTML = audio.muted ? `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
            </svg>
        ` : `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
            </svg>
        `;
    });
    
    // 音频加载完成
    audio.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audio.duration);
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat(bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}
