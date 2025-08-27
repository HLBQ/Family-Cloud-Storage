// 国际化语言配置
const translations = {
    'zh-CN': {
        // 页面标题和头部
        'title': '内网文件共享系统',
        'header': '内网文件共享',
        'uploadFile': '上传文件',
        'uploadFolder': '上传文件夹',
        'createFolder': '新建文件夹',
        
        // 文件列表
        'allFiles': '全部文件',
        'rootDir': '根目录',
        'parentDir': '上一级',
        'fileName': '文件名',
        'fileSize': '大小',
        'modifyDate': '修改日期',
        'actions': '操作',
        
        // 弹窗
        'createFolderTitle': '新建文件夹',
        'folderNamePlaceholder': '请输入文件夹名称',
        'confirm': '确认',
        'cancel': '取消',
        'renameTitle': '重命名',
        'renamePlaceholder': '请输入新名称',
        'deleteTitle': '删除确认',
        'deleteMessage': '确定要删除 {filename} 吗？',
        'deleteConfirm': '确认删除',
        'previewTitle': '文件预览',
        'uploadProgress': '上传进度',
        
        // 操作提示
        'downloadFile': '下载文件',
        'downloadFolder': '下载文件夹',
        'rename': '重命名',
        'delete': '删除',
        
        // 错误消息
        'fetchFilesError': '获取文件列表失败，请检查服务器是否运行',
        'createFolderError': '创建文件夹出错',
        'renameError': '重命名出错',
        'deleteError': '删除出错',
        'uploadError': '上传出错',
        'folderUploadError': '上传文件夹出错',
        'noFilename': '无法获取文件名',
        
        // 上传进度
        'uploadSpeed': '{speed}',
        
        // 媒体播放器
        'browserNotSupportVideo': '您的浏览器不支持视频播放',
        'browserNotSupportAudio': '您的浏览器不支持音频播放'
    },
    'en-US': {
        // 页面标题和头部
        'title': 'Internal File Sharing System',
        'header': 'Internal File Sharing',
        'uploadFile': 'Upload File',
        'uploadFolder': 'Upload Folder',
        'createFolder': 'Create Folder',
        
        // 文件列表
        'allFiles': 'All Files',
        'rootDir': 'Root Directory',
        'parentDir': 'Parent Directory',
        'fileName': 'File Name',
        'fileSize': 'Size',
        'modifyDate': 'Modified Date',
        'actions': 'Actions',
        
        // 弹窗
        'createFolderTitle': 'Create Folder',
        'folderNamePlaceholder': 'Please enter folder name',
        'confirm': 'Confirm',
        'cancel': 'Cancel',
        'renameTitle': 'Rename',
        'renamePlaceholder': 'Please enter new name',
        'deleteTitle': 'Delete Confirmation',
        'deleteMessage': 'Are you sure you want to delete {filename}?',
        'deleteConfirm': 'Confirm Delete',
        'previewTitle': 'File Preview',
        'uploadProgress': 'Upload Progress',
        
        // 操作提示
        'downloadFile': 'Download File',
        'downloadFolder': 'Download Folder',
        'rename': 'Rename',
        'delete': 'Delete',
        
        // 错误消息
        'fetchFilesError': 'Failed to get file list, please check if server is running',
        'createFolderError': 'Error creating folder',
        'renameError': 'Error renaming',
        'deleteError': 'Error deleting',
        'uploadError': 'Upload error',
        'folderUploadError': 'Folder upload error',
        'noFilename': 'Cannot get filename',
        
        // 上传进度
        'uploadSpeed': '{speed}',
        
        // 媒体播放器
        'browserNotSupportVideo': 'Your browser does not support video playback',
        'browserNotSupportAudio': 'Your browser does not support audio playback'
    }
};

// 当前语言
let currentLanguage = 'zh-CN';

// 获取翻译
function t(key, params = {}) {
    const translation = translations[currentLanguage][key] || key;
    return translation.replace(/{(\w+)}/g, (match, param) => params[param] || match);
}

// 切换语言
function switchLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        updateUI();
    }
}

// 更新界面文本
function updateUI() {
    // 更新页面标题
    document.title = t('title');
    
    // 更新头部文本
    const header = document.querySelector('header h1');
    if (header) header.textContent = t('header');
    
    // 更新按钮文本
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) uploadBtn.textContent = t('uploadFile');
    
    const uploadFolderBtn = document.getElementById('upload-folder-btn');
    if (uploadFolderBtn) uploadFolderBtn.textContent = t('uploadFolder');
    
    const createFolderBtn = document.getElementById('create-folder-btn');
    if (createFolderBtn) createFolderBtn.textContent = t('createFolder');
    
    // 更新导航按钮
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.textContent = t('rootDir');
    
    const upBtn = document.getElementById('up-btn');
    if (upBtn) upBtn.textContent = t('parentDir');
    
    // 更新表格标题
    const thElements = document.querySelectorAll('th');
    if (thElements.length >= 4) {
        thElements[0].textContent = t('fileName');
        thElements[1].textContent = t('fileSize');
        thElements[2].textContent = t('modifyDate');
        thElements[3].textContent = t('actions');
    }
    
    // 更新弹窗标题
    const createFolderModal = document.querySelector('#create-folder-modal h3');
    if (createFolderModal) createFolderModal.textContent = t('createFolderTitle');
    
    const renameModal = document.querySelector('#rename-modal h3');
    if (renameModal) renameModal.textContent = t('renameTitle');
    
    const deleteModal = document.querySelector('#delete-modal h3');
    if (deleteModal) deleteModal.textContent = t('deleteTitle');
    
    const previewModal = document.querySelector('#preview-modal .preview-title');
    if (previewModal) previewModal.textContent = t('previewTitle');
    
    const uploadProgressModal = document.querySelector('#upload-progress-modal h3');
    if (uploadProgressModal) uploadProgressModal.textContent = t('uploadProgress');
    
    // 更新输入框占位符
    const folderNameInput = document.getElementById('folder-name-input');
    if (folderNameInput) folderNameInput.placeholder = t('folderNamePlaceholder');
    
    const renameInput = document.getElementById('rename-input');
    if (renameInput) renameInput.placeholder = t('renamePlaceholder');
    
    // 更新按钮文本
    const confirmButtons = document.querySelectorAll('#folder-confirm, #rename-confirm');
    confirmButtons.forEach(btn => {
        if (btn) btn.textContent = t('confirm');
    });
    
    const cancelButtons = document.querySelectorAll('#folder-cancel, #rename-cancel, #delete-cancel');
    cancelButtons.forEach(btn => {
        if (btn) btn.textContent = t('cancel');
    });
    
    const deleteConfirm = document.getElementById('delete-confirm');
    if (deleteConfirm) deleteConfirm.textContent = t('deleteConfirm');
    
    // 更新操作图标标题
    updateActionIcons();
}

// 更新操作图标标题
function updateActionIcons() {
    const downloadIcons = document.querySelectorAll('.download-btn .action-icon');
    downloadIcons.forEach(icon => {
        icon.title = t('downloadFile');
    });
    
    const downloadFolderIcons = document.querySelectorAll('.download-folder-btn .action-icon');
    downloadFolderIcons.forEach(icon => {
        icon.title = t('downloadFolder');
    });
    
    const renameIcons = document.querySelectorAll('.rename-btn .action-icon');
    renameIcons.forEach(icon => {
        icon.title = t('rename');
    });
    
    const deleteIcons = document.querySelectorAll('.delete-btn .action-icon');
    deleteIcons.forEach(icon => {
        icon.title = t('delete');
    });
}

// 初始化语言
document.addEventListener('DOMContentLoaded', () => {
    // 检测浏览器语言
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('en')) {
        switchLanguage('en-US');
    } else {
        switchLanguage('zh-CN');
    }
});
