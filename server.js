const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 创建主应用(3000端口)
const mainApp = express();
const mainPort = 3000;

// 创建只读应用(7860端口)
const readOnlyApp = express(); 
const readOnlyPort = 7860;

// 上传目录配置
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 通用中间件
const setupCommonMiddleware = (app) => {
    app.use(express.static(__dirname));
    app.use(express.json());
};

// 配置主应用(完整功能)
setupCommonMiddleware(mainApp);

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const relativePath = req.query.path || '';
        const targetPath = path.join(uploadDir, relativePath);
        
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        cb(null, targetPath);
    },
    filename: (req, file, cb) => {
        // 解码前端编码过的文件名
        cb(null, decodeURIComponent(file.originalname));
    }
});

const upload = multer({ storage });

// 主应用路由(完整功能)
mainApp.get('/api/files', handleGetFiles);
mainApp.post('/api/upload', upload.array('files'), handleUpload);
mainApp.get('/api/download/:filename', handleDownload);
mainApp.post('/api/mkdir', handleMkdir);
mainApp.post('/api/rename', handleRename);
mainApp.post('/api/delete', handleDelete);
mainApp.get('/api/download-folder/:foldername', handleDownloadFolder);

// 只读应用路由(仅读取功能)
setupCommonMiddleware(readOnlyApp);
readOnlyApp.get('/api/files', handleGetFiles);
readOnlyApp.get('/api/download/:filename', handleDownload);
readOnlyApp.get('/api/download-folder/:foldername', handleDownloadFolder);

// 路由处理函数
function handleGetFiles(req, res) {
    const relativePath = req.query.path || '';
    const targetPath = path.join(uploadDir, relativePath);
    
    fs.readdir(targetPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: '无法读取文件列表(The list of files cannot be read)' });
        }

        const fileList = files.map(file => {
            const filePath = path.join(targetPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        });

        res.json(fileList);
    });
}

function handleUpload(req, res) {
    res.json({ success: true });
}

function handleDownload(req, res) {
    let relativePath = req.query.path || '';
    if (relativePath && !relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
    }
    const filePath = path.join(uploadDir, relativePath, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('文件不存在(The file does not exist)');
    }
}

function handleMkdir(req, res) {
    let { dirname, path: relativePath = '' } = req.body;
    if (relativePath && !relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
    }
    const fullPath = path.join(uploadDir, relativePath, dirname);
    
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        res.json({ success: true });
    } else {
        res.status(400).json({ error: '文件夹已存在(The folder already exists)' });
    }
}

function handleRename(req, res) {
    try {
        const { oldName, newName, path: relativePath = '' } = req.body;
        const oldPath = path.join(uploadDir, relativePath, oldName);
        const newPath = path.join(uploadDir, relativePath, newName);
        
        if (!oldName || !newName) {
            return res.status(400).json({ error: '缺少必要参数(Missing necessary parameters)' });
        }

        if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
            fs.renameSync(oldPath, newPath);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '重命名失败(Renaming failed)' });
        }
    } catch (err) {
        res.status(500).json({ error: '重命名操作出错(The rename operation got an error)' });
    }
}

function handleDelete(req, res) {
    try {
        const { filename, path: relativePath = '', fullPath } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: '缺少文件名参数(Missing filename parameter)' });
        }

        const filePath = path.join(uploadDir, fullPath || path.join(safePath, relativePath, filename));
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在(The file does not exist)' });
        }

        if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmdirSync(filePath, { recursive: true });
        } else {
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '删除文件失败(Deleting files fails)' });
    }
}

function handleDownloadFolder(req, res) {
    const folderPath = path.join(uploadDir, req.params.foldername);
    const zipPath = path.join(uploadDir, `${req.params.foldername}.zip`);
    
    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: '文件夹不存在(The folder does not exist)' });
    }

    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        res.download(zipPath, () => {
            fs.unlinkSync(zipPath);
        });
    });

    archive.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
}

// 启动服务器
mainApp.listen(mainPort, '0.0.0.0', () => {
    console.log(`主服务器运行在(The primary server is running on) http://0.0.0.0:${mainPort}`);
});

readOnlyApp.listen(readOnlyPort, '0.0.0.0', () => {
    console.log(`只读服务器运行在(The read-only server is running on) http://0.0.0.0:${readOnlyPort}`);
});
