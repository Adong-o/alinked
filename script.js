// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.querySelector('.progress-bar');
const progress = document.getElementById('progressBar');
const shareLink = document.getElementById('shareLink');
const linkInput = document.getElementById('linkInput');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    if (e.target.files.length > 0) {
        uploadVideo();
    }
});
uploadBtn.addEventListener('click', () => fileInput.click());

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
    if (files.length > 0) {
        uploadVideo();
    }
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
            if (file.size <= 100 * 1024 * 1024) { // 100MB limit
                errorMessage.style.display = 'none';
                const fileInfo = document.getElementById('fileInfo');
                fileInfo.textContent = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
                fileInfo.style.display = 'block';
                uploadBtn.textContent = 'Choose Another Video';
                
                // Show video preview
                showVideoPreview(file);
            } else {
                showError('File size must be less than 100MB');
            }
        } else {
            showError('Please select a video file');
        }
    }
}

function showVideoPreview(file) {
    const preview = document.createElement('video');
    preview.className = 'video-preview';
    preview.controls = true;
    preview.style.maxWidth = '100%';
    preview.style.marginTop = '20px';

    const source = document.createElement('source');
    source.src = URL.createObjectURL(file);
    source.type = file.type;

    preview.appendChild(source);
    
    // Remove any existing preview
    const existingPreview = document.querySelector('.video-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Add new preview after file info
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.parentNode.insertBefore(preview, fileInfo.nextSibling);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

async function uploadVideo() {
    const file = fileInput.files[0];
    errorMessage.style.display = 'none';
    shareLink.style.display = 'block';
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.textContent = 'Uploading video...';
    const linkContainer = document.getElementById('linkContainer');
    linkContainer.style.display = 'none';
    
    const getLinkBtn = document.getElementById('getLinkBtn');
    getLinkBtn.textContent = 'Uploading...';
    getLinkBtn.disabled = true;

    progressBar.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    // Set up progress tracking
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentage = (event.loaded / event.total) * 100;
            progress.style.width = percentage + '%';
        }
    };

    try {
        // Create a promise to handle the XHR upload
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.open('POST', '/upload', true);
            xhr.setRequestHeader('Accept', '*/*');
            xhr.onload = () => {
                if (xhr.status === 200) {
                    console.error('Server response:', xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    console.error('Server response:', xhr.responseText);
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });

        const data = await uploadPromise;

        if (data.success) {
            uploadStatus.textContent = 'Upload complete!';
            getLinkBtn.textContent = 'Get Share Link';
            getLinkBtn.disabled = false;
            getLinkBtn.onclick = () => {
                linkInput.value = `${window.location.origin}/share/${data.videoId}`;
                linkContainer.style.display = 'block';
                getLinkBtn.style.display = 'none';
            };
        } else {
            throw new Error(data.error || 'Upload failed');
        }

    } catch (error) {
        console.error('Upload error:', error);
        showError('Error uploading video: ' + error.message);
        progressBar.style.display = 'none';
        getLinkBtn.textContent = 'Get Share Link';
        getLinkBtn.disabled = false;
    }
}

function generateUniqueId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
}
