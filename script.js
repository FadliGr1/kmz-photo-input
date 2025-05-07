// Variabel global untuk menyimpan data
let zipFile = null;
let kmzFile = null;
let folderPhotos = {}; // { folderName: { photos: [photo1, photo2...], selectedIndex: 3 } }
let extractedPhotos = []; // [{ folderName, photoName, photoData, folderNumber }]
let kmzPlacemarks = []; // [{ name, placemarkNumber, xml }]
let matchedPhotos = []; // [{ placemarkName, photoName, matched }]
let resultKMZ = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Step 1 Elements
    const zipDropzone = document.getElementById('zipDropzone');
    const zipFileInput = document.getElementById('zipFileInput');
    const zipBrowseBtn = document.getElementById('zipBrowseBtn');
    const zipFileInfo = document.getElementById('zipFileInfo');
    const zipFileName = document.getElementById('zipFileName');
    const zipFileSize = document.getElementById('zipFileSize');
    const step1NextBtn = document.getElementById('step1NextBtn');
    
    // Step 2 Elements
    const folderList = document.getElementById('folderList');
    const photoSelectionMethod = document.getElementById('photoSelectionMethod');
    const customPhotoNumberContainer = document.getElementById('customPhotoNumberContainer');
    const customPhotoNumber = document.getElementById('customPhotoNumber');
    const applyPhotoSelectionBtn = document.getElementById('applyPhotoSelectionBtn');
    const step2BackBtn = document.getElementById('step2BackBtn');
    const step2NextBtn = document.getElementById('step2NextBtn');
    
    // Step 3 Elements
    const kmzDropzone = document.getElementById('kmzDropzone');
    const kmzFileInput = document.getElementById('kmzFileInput');
    const kmzBrowseBtn = document.getElementById('kmzBrowseBtn');
    const kmzFileInfo = document.getElementById('kmzFileInfo');
    const kmzFileName = document.getElementById('kmzFileName');
    const kmzFileSize = document.getElementById('kmzFileSize');
    const step3BackBtn = document.getElementById('step3BackBtn');
    const step3NextBtn = document.getElementById('step3NextBtn');
    
    // Step 4 Elements
    const matchingResultList = document.getElementById('matchingResultList');
    const totalFolders = document.getElementById('totalFolders');
    const totalPhotos = document.getElementById('totalPhotos');
    const totalMatched = document.getElementById('totalMatched');
    const totalUnmatched = document.getElementById('totalUnmatched');
    const useRandomPhotosCheckbox = document.getElementById('useRandomPhotosCheckbox');
    const step4BackBtn = document.getElementById('step4BackBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Loading Elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingSubtext = document.getElementById('loadingSubtext');
    const progressBar = document.getElementById('progressBar');

    // Step circles
    const step1Circle = document.getElementById('step1Circle');
    const step2Circle = document.getElementById('step2Circle');
    const step3Circle = document.getElementById('step3Circle');
    const step4Circle = document.getElementById('step4Circle');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const line3 = document.getElementById('line3');

    // Step containers
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');

    // PERBAIKAN: Sembunyikan loading overlay di awal
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none';
    }

    // UTILITY FUNCTIONS
    // =================

    // Format bytes to human-readable format
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Show loading overlay
    function showLoading(text, subtext = 'Mohon tunggu sebentar') {
        if (!loadingOverlay) return;
        
        loadingText.textContent = text;
        loadingSubtext.textContent = subtext;
        progressBar.style.width = '0%';
        
        // PERBAIKAN: Tampilkan loading overlay dengan benar
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.style.display = 'flex';
        loadingOverlay.classList.add('visible');
    }

    // Update progress bar
    function updateProgress(percent) {
        if (!progressBar) return;
        progressBar.style.width = `${percent}%`;
    }

    // Hide loading overlay
    function hideLoading() {
        if (!loadingOverlay) return;
        
        // PERBAIKAN: Sembunyikan loading overlay dengan benar
        loadingOverlay.classList.remove('visible');
        
        // Tunggu transisi selesai
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }, 300);
    }

    // Extract number from string (for matching purposes)
    function extractNumberFromString(str) {
        if (!str) return null;
        const match = str.match(/\d+/);
        return match ? match[0] : null;
    }

    // Navigate between steps
    function goToStep(stepNumber) {
        [step1, step2, step3, step4].forEach((step, index) => {
            if (index + 1 === stepNumber) {
                step.classList.remove('hidden');
                step.classList.add('active');
            } else {
                step.classList.add('hidden');
                step.classList.remove('active');
            }
        });

        // Update stepper UI
        if (step1Circle) step1Circle.className = stepNumber >= 1 ? 'flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full' : 'flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full';
        if (step2Circle) step2Circle.className = stepNumber >= 2 ? 'flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full' : 'flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full';
        if (step3Circle) step3Circle.className = stepNumber >= 3 ? 'flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full' : 'flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full';
        if (step4Circle) step4Circle.className = stepNumber >= 4 ? 'flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full' : 'flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full';
        
        if (line1) line1.className = stepNumber >= 2 ? 'flex-1 h-1 mx-2 bg-blue-600' : 'flex-1 h-1 mx-2 bg-gray-300';
        if (line2) line2.className = stepNumber >= 3 ? 'flex-1 h-1 mx-2 bg-blue-600' : 'flex-1 h-1 mx-2 bg-gray-300';
        if (line3) line3.className = stepNumber >= 4 ? 'flex-1 h-1 mx-2 bg-blue-600' : 'flex-1 h-1 mx-2 bg-gray-300';
    }

    // STEP 1: ZIP FILE HANDLING
    // =========================

    // Click event for browse button
    if (zipBrowseBtn) {
        zipBrowseBtn.addEventListener('click', () => {
            if (zipFileInput) zipFileInput.click();
        });
    }

    // Handle file selection
    if (zipFileInput) {
        zipFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleZipFileSelection(e.target.files[0]);
            }
        });
    }

    // Prevent default behaviors for drag events
    if (zipDropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zipDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Add drag-over class during drag
        ['dragenter', 'dragover'].forEach(eventName => {
            zipDropzone.addEventListener(eventName, () => {
                zipDropzone.classList.add('drag-over');
            }, false);
        });

        // Remove drag-over class when drag ends
        ['dragleave', 'drop'].forEach(eventName => {
            zipDropzone.addEventListener(eventName, () => {
                zipDropzone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        zipDropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0 && files[0].name.toLowerCase().endsWith('.zip')) {
                handleZipFileSelection(files[0]);
            } else {
                alert('Harap pilih file ZIP yang valid.');
            }
        }, false);
    }

    // Process selected ZIP file
    function handleZipFileSelection(file) {
        zipFile = file;
        if (zipFileName) zipFileName.textContent = file.name;
        if (zipFileSize) zipFileSize.textContent = formatBytes(file.size);
        if (zipFileInfo) zipFileInfo.classList.remove('hidden');
        if (step1NextBtn) step1NextBtn.disabled = false;
    }

    // Next button click handler
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', async () => {
            if (!zipFile) return;
            
            showLoading('Mengekstrak file ZIP', 'Mencari folder dan foto...');
            
            try {
                await processZipFile();
                
                // Update UI for step 2
                updateFolderList();
                
                goToStep(2);
                hideLoading();
            } catch (error) {
                hideLoading();
                console.error('Error processing ZIP file:', error);
                alert('Terjadi kesalahan saat memproses file ZIP: ' + error.message);
            }
        });
    }

    // Process ZIP file to extract folders and photos
    async function processZipFile() {
        return new Promise(async (resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = async function(e) {
                    try {
                        const zip = await JSZip.loadAsync(e.target.result);
                        folderPhotos = {};
                        
                        // Group files by folder
                        let totalItems = Object.keys(zip.files).length;
                        let processedItems = 0;
                        
                        for (const [path, zipEntry] of Object.entries(zip.files)) {
                            if (!zipEntry.dir) {
                                processedItems++;
                                updateProgress((processedItems / totalItems) * 100);
                                
                                // File path structure: folder/subfolder/file.jpg
                                const pathParts = path.split('/');
                                
                                // Skip hidden files and directories
                                if (pathParts[0].startsWith('__MACOSX') || pathParts[0].startsWith('.')) {
                                    continue;
                                }
                                
                                // Skip non-image files
                                const fileExt = pathParts[pathParts.length - 1].split('.').pop().toLowerCase();
                                if (!['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExt)) {
                                    continue;
                                }
                                
                                // Use the first folder as the main folder name
                                const folderName = pathParts[0];
                                const fileName = pathParts[pathParts.length - 1];
                                
                                if (!folderPhotos[folderName]) {
                                    folderPhotos[folderName] = {
                                        photos: [],
                                        selectedIndex: 3 // Default to 4th photo (index 3)
                                    };
                                }
                                
                                // Get the file data as base64
                                const fileData = await zipEntry.async('base64');
                                
                                folderPhotos[folderName].photos.push({
                                    name: fileName,
                                    path: path,
                                    data: fileData,
                                    type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
                                });
                            }
                        }
                        
                        // Sort photos in each folder
                        for (const folder in folderPhotos) {
                            folderPhotos[folder].photos.sort((a, b) => a.name.localeCompare(b.name));
                            
                            // Default to the 4th photo if it exists, otherwise the last photo
                            const photoCount = folderPhotos[folder].photos.length;
                            if (photoCount > 0) {
                                folderPhotos[folder].selectedIndex = Math.min(3, photoCount - 1);
                            }
                        }
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsArrayBuffer(zipFile);
            } catch (error) {
                reject(error);
            }
        });
    }

    // STEP 2: MANAGE PHOTOS
    // =====================

    // Update folder list in Step 2
    function updateFolderList() {
        if (!folderList) return;
        
        folderList.innerHTML = '';
        
        const folderKeys = Object.keys(folderPhotos);
        
        if (folderKeys.length === 0) {
            folderList.innerHTML = '<div class="text-center text-gray-500">Tidak ada folder ditemukan.</div>';
            return;
        }
        
        folderKeys.sort().forEach(folderName => {
            const folder = folderPhotos[folderName];
            const photoCount = folder.photos.length;
            
            // Extract number from folder name for matching later
            const folderNumber = extractNumberFromString(folderName);
            
            const folderItem = document.createElement('div');
            folderItem.className = 'mb-4 p-3 bg-white rounded shadow-sm';
            folderItem.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold">${folderName}</h4>
                    <span class="text-gray-500 text-sm">${photoCount} foto</span>
                </div>
                <div class="mb-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pilih foto untuk digunakan:</label>
                    <select class="folder-photo-select w-full p-2 border border-gray-300 rounded" data-folder="${folderName}">
                        ${folder.photos.map((photo, index) => `
                            <option value="${index}" ${index === folder.selectedIndex ? 'selected' : ''}>
                                ${index + 1}. ${photo.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="preview mt-2 flex justify-center bg-gray-100 rounded photo-preview-container">
                    ${photoCount > 0 ? 
                        `<img src="data:${folder.photos[folder.selectedIndex].type};base64,${folder.photos[folder.selectedIndex].data}" 
                              alt="Preview" class="h-40 object-contain">` : 
                        '<div class="text-gray-500 p-4">Tidak ada foto</div>'}
                </div>
            `;
            
            folderList.appendChild(folderItem);
            
            // Add event listener to the select dropdown
            const select = folderItem.querySelector('.folder-photo-select');
            select.addEventListener('change', (e) => {
                const selectedIndex = parseInt(e.target.value);
                folderPhotos[folderName].selectedIndex = selectedIndex;
                
                // Update preview
                const previewContainer = folderItem.querySelector('.preview');
                const selectedPhoto = folder.photos[selectedIndex];
                previewContainer.innerHTML = `<img src="data:${selectedPhoto.type};base64,${selectedPhoto.data}" alt="Preview" class="h-40 object-contain">`;
            });
        });
    }

    // Show/hide custom photo number input based on selection method
    if (photoSelectionMethod) {
        photoSelectionMethod.addEventListener('change', function() {
            if (this.value === 'custom') {
                customPhotoNumberContainer.classList.remove('hidden');
            } else {
                customPhotoNumberContainer.classList.add('hidden');
            }
        });
    }

    // Apply photo selection to all folders
    if (applyPhotoSelectionBtn) {
        applyPhotoSelectionBtn.addEventListener('click', function() {
            const method = photoSelectionMethod.value;
            
            for (const folderName in folderPhotos) {
                const photoCount = folderPhotos[folderName].photos.length;
                
                if (photoCount > 0) {
                    switch (method) {
                        case 'fourth':
                            // Foto ke-4 (index 3) atau terakhir jika tidak cukup foto
                            folderPhotos[folderName].selectedIndex = Math.min(3, photoCount - 1);
                            break;
                        case 'last':
                            // Foto terakhir
                            folderPhotos[folderName].selectedIndex = photoCount - 1;
                            break;
                        case 'custom':
                            // Foto ke-N (index N-1) atau terakhir jika tidak cukup foto
                            const customIndex = parseInt(customPhotoNumber.value) - 1;
                            folderPhotos[folderName].selectedIndex = Math.min(Math.max(0, customIndex), photoCount - 1);
                            break;
                    }
                }
            }
            
            // Update UI
            updateFolderList();
        });
    }
    // Go back to Step 1
    if (step2BackBtn) {
        step2BackBtn.addEventListener('click', () => {
            goToStep(1);
        });
    }

    // Proceed to Step 3
    if (step2NextBtn) {
        step2NextBtn.addEventListener('click', () => {
            // Prepare extracted photos
            extractedPhotos = [];
            
            for (const folderName in folderPhotos) {
                const folder = folderPhotos[folderName];
                const photo = folder.photos[folder.selectedIndex];
                
                if (photo) {
                    // Extract number from folder name
                    const folderNumber = extractNumberFromString(folderName);
                    
                    extractedPhotos.push({
                        folderName: folderName,
                        photoName: photo.name,
                        photoData: photo.data,
                        photoType: photo.type,
                        folderNumber: folderNumber
                    });
                }
            }
            
            // Go to Step 3
            goToStep(3);
        });
    }

    // STEP 3: KMZ FILE HANDLING
    // =========================

    // Click event for browse button
    if (kmzBrowseBtn) {
        kmzBrowseBtn.addEventListener('click', () => {
            if (kmzFileInput) kmzFileInput.click();
        });
    }

    // Handle file selection
    if (kmzFileInput) {
        kmzFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleKmzFileSelection(e.target.files[0]);
            }
        });
    }

    // Prevent default behaviors for drag events
    if (kmzDropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            kmzDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Add drag-over class during drag
        ['dragenter', 'dragover'].forEach(eventName => {
            kmzDropzone.addEventListener(eventName, () => {
                kmzDropzone.classList.add('drag-over');
            }, false);
        });

        // Remove drag-over class when drag ends
        ['dragleave', 'drop'].forEach(eventName => {
            kmzDropzone.addEventListener(eventName, () => {
                kmzDropzone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        kmzDropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0 && files[0].name.toLowerCase().endsWith('.kmz')) {
                handleKmzFileSelection(files[0]);
            } else {
                alert('Harap pilih file KMZ yang valid.');
            }
        }, false);
    }

    // Process selected KMZ file
    function handleKmzFileSelection(file) {
        kmzFile = file;
        if (kmzFileName) kmzFileName.textContent = file.name;
        if (kmzFileSize) kmzFileSize.textContent = formatBytes(file.size);
        if (kmzFileInfo) kmzFileInfo.classList.remove('hidden');
        if (step3NextBtn) step3NextBtn.disabled = false;
    }

    // Go back to Step 2
    if (step3BackBtn) {
        step3BackBtn.addEventListener('click', () => {
            goToStep(2);
        });
    }

    // Process KMZ and proceed to Step 4
    if (step3NextBtn) {
        step3NextBtn.addEventListener('click', async () => {
            if (!kmzFile) return;
            
            showLoading('Memproses file KMZ', 'Membaca dan menganalisis placemark...');
            
            try {
                await processKmzFile();
                await matchPhotosWithPlacemarks();
                
                // Update UI for step 4
                updateMatchingResults();
                updateSummary();
                
                goToStep(4);
                hideLoading();
            } catch (error) {
                hideLoading();
                console.error('Error processing KMZ file:', error);
                alert('Terjadi kesalahan saat memproses file KMZ: ' + error.message);
            }
        });
    }

    // Process KMZ file to extract placemarks
    async function processKmzFile() {
        return new Promise(async (resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = async function(e) {
                    try {
                        // KMZ is a ZIP file containing KML files
                        const zip = await JSZip.loadAsync(e.target.result);
                        kmzPlacemarks = [];
                        
                        // Find the KML file
                        let kmlContent = null;
                        let kmlFilePath = null;
                        
                        for (const [path, zipEntry] of Object.entries(zip.files)) {
                            if (path.toLowerCase().endsWith('.kml') && !zipEntry.dir) {
                                kmlContent = await zipEntry.async('text');
                                kmlFilePath = path;
                                break;
                            }
                        }
                        
                        if (!kmlContent) {
                            throw new Error('Tidak ada file KML ditemukan dalam file KMZ.');
                        }
                        
                        // Parse the KML to extract placemarks
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
                        
                        // Extract placemarks
                        const placemarkElements = xmlDoc.getElementsByTagName('Placemark');
                        
                        for (let i = 0; i < placemarkElements.length; i++) {
                            const placemark = placemarkElements[i];
                            const nameElement = placemark.getElementsByTagName('name')[0];
                            
                            if (nameElement) {
                                const placemarkName = nameElement.textContent.trim();
                                const placemarkNumber = extractNumberFromString(placemarkName);
                                
                                // Create a serialized XML string for this placemark
                                const serializer = new XMLSerializer();
                                const placemarkXml = serializer.serializeToString(placemark);
                                
                                kmzPlacemarks.push({
                                    name: placemarkName,
                                    placemarkNumber: placemarkNumber,
                                    xml: placemarkXml
                                });
                            }
                        }
                        
                        // Save original KMZ file structure for later use
                        resultKMZ = {
                            zip: zip,
                            kmlPath: kmlFilePath,
                            kmlContent: kmlContent
                        };
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsArrayBuffer(kmzFile);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Match photos with placemarks based on numbers
    async function matchPhotosWithPlacemarks() {
        matchedPhotos = [];
        
        for (const photo of extractedPhotos) {
            let matched = false;
            let matchedPlacemark = null;
            
            if (photo.folderNumber) {
                // Find matching placemark
                for (const placemark of kmzPlacemarks) {
                    if (placemark.placemarkNumber === photo.folderNumber) {
                        matched = true;
                        matchedPlacemark = placemark;
                        break;
                    }
                }
            }
            
            matchedPhotos.push({
                folderName: photo.folderName,
                photoName: photo.photoName,
                photoData: photo.photoData,
                photoType: photo.photoType,
                folderNumber: photo.folderNumber,
                placemarkName: matched ? matchedPlacemark.name : null,
                placemarkNumber: matched ? matchedPlacemark.placemarkNumber : null,
                matched: matched
            });
        }
    }

    // STEP 4: RESULTS
    // ===============

    // Update matching results list
    function updateMatchingResults() {
        if (!matchingResultList) return;
        
        matchingResultList.innerHTML = '';
        
        if (matchedPhotos.length === 0) {
            matchingResultList.innerHTML = '<div class="text-center text-gray-500">Tidak ada foto yang diproses.</div>';
            return;
        }
        
        matchedPhotos.forEach(photo => {
            const matchItem = document.createElement('div');
            matchItem.className = `match-item ${photo.matched ? 'match-success' : 'match-failed'} p-2 bg-white rounded shadow-sm mb-2`;
            
            matchItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-medium">${photo.folderName}</span> 
                        <span class="text-sm text-gray-500">(${photo.photoName})</span>
                    </div>
                    <div>
                        ${photo.matched ? 
                            `<span class="badge badge-success">Dicocokkan dengan: ${photo.placemarkName}</span>` : 
                            '<span class="badge badge-error">Tidak cocok</span>'}
                    </div>
                </div>
            `;
            
            matchingResultList.appendChild(matchItem);
        });
    }

    // Update summary
    function updateSummary() {
        const totalFolderCount = Object.keys(folderPhotos).length;
        const totalPhotoCount = matchedPhotos.length;
        const totalMatchedCount = matchedPhotos.filter(photo => photo.matched).length;
        const totalUnmatchedCount = totalPhotoCount - totalMatchedCount;
        
        if (totalFolders) totalFolders.textContent = `Total folder: ${totalFolderCount}`;
        if (totalPhotos) totalPhotos.textContent = `Total foto yang diambil: ${totalPhotoCount}`;
        if (totalMatched) totalMatched.textContent = `Total foto yang berhasil dicocokkan: ${totalMatchedCount}`;
        if (totalUnmatched) totalUnmatched.textContent = `Total foto yang tidak berhasil dicocokkan: ${totalUnmatchedCount}`;
    }

    // Go back to Step 3
    if (step4BackBtn) {
        step4BackBtn.addEventListener('click', () => {
            goToStep(3);
        });
    }

    // Download the resulting KMZ
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            showLoading('Membuat file KMZ baru', 'Menambahkan foto ke dalam KMZ...');
            
            try {
                await createResultKmz();
                hideLoading();
            } catch (error) {
                hideLoading();
                console.error('Error creating result KMZ:', error);
                alert('Terjadi kesalahan saat membuat file KMZ: ' + error.message);
            }
        });
    }

// Create the resulting KMZ file with unique placemarks and green icons
async function createResultKmz() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!resultKMZ || !resultKMZ.zip || !resultKMZ.kmlPath) {
                throw new Error('KMZ file structure tidak valid.');
            }
            
            const zip = resultKMZ.zip;
            const kmlPath = resultKMZ.kmlPath;
            
            // Get the original KML content to extract Document and Folder structure
            let kmlContent = resultKMZ.kmlContent;
            
            // Parse the KML to create a new clean KML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
            
            // Create a new clean KML structure
            const newKmlDoc = parser.parseFromString('<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"></kml>', 'text/xml');
            
            // Copy the Document element and its basic properties (no styles)
            let originalDocument = xmlDoc.getElementsByTagName('Document')[0];
            let newDocument = newKmlDoc.createElement('Document');
            newKmlDoc.documentElement.appendChild(newDocument);
            
            // Copy essential Document properties like name if they exist
            if (originalDocument.getElementsByTagName('name')[0]) {
                const docName = originalDocument.getElementsByTagName('name')[0].cloneNode(true);
                newDocument.appendChild(docName);
            }
            
            // Create a folder for images
            const imagesFolder = 'images/';
            zip.folder(imagesFolder);
            
            // Extract all original placemarks
            const placemarkElements = xmlDoc.getElementsByTagName('Placemark');
            
            // Create a new Folder to hold placemarks
            const folder = newKmlDoc.createElement('Folder');
            const folderName = newKmlDoc.createElement('name');
            folderName.textContent = 'Placemarks with Photos';
            folder.appendChild(folderName);
            newDocument.appendChild(folder);
            
            // Create map to track unique placemarks by name to avoid duplicates
            const placemarkMap = new Map();
            
            // First, collect all placemarks with their associated photos (if any)
            for (let i = 0; i < placemarkElements.length; i++) {
                const originalPlacemark = placemarkElements[i];
                const nameElement = originalPlacemark.getElementsByTagName('name')[0];
                
                if (nameElement) {
                    const placemarkName = nameElement.textContent.trim();
                    const originalPoint = originalPlacemark.getElementsByTagName('Point')[0];
                    
                    // Skip if no Point geometry
                    if (!originalPoint) continue;
                    
                    // Extract coordinates to create a unique key for the placemark
                    const coordsElement = originalPoint.getElementsByTagName('coordinates')[0];
                    let coords = '';
                    if (coordsElement) {
                        coords = coordsElement.textContent.trim();
                    }
                    
                    const uniqueKey = `${placemarkName}_${coords}`;
                    
                    // Find matched photos for this placemark
                    const matchedPhoto = matchedPhotos.find(photo => 
                        photo.matched && photo.placemarkName === placemarkName
                    );
                    
                    // Store information needed to create the placemark
                    placemarkMap.set(uniqueKey, {
                        name: placemarkName,
                        point: originalPoint,
                        photo: matchedPhoto
                    });
                }
            }
            
            // Check if we need to include unmatched placemarks with random photos
            const useRandomPhotos = document.getElementById('useRandomPhotosCheckbox') && 
                                    document.getElementById('useRandomPhotosCheckbox').checked;
            
            // Create a pool of photos that can be used for random assignment
            const availablePhotos = matchedPhotos.filter(photo => photo.photoData);
            
            // Now create unique placemarks
            for (const [uniqueKey, placemarkInfo] of placemarkMap.entries()) {
                // Create a new clean Placemark
                const newPlacemark = newKmlDoc.createElement('Placemark');
                
                // 1. Copy name
                const name = newKmlDoc.createElement('name');
                name.textContent = placemarkInfo.name;
                newPlacemark.appendChild(name);
                
                // 2. Copy geometry (Point with coordinates)
                if (placemarkInfo.point) {
                    const newPoint = placemarkInfo.point.cloneNode(true);
                    newPlacemark.appendChild(newPoint);
                }
                
                // 3. Create a clean Style
                const style = newKmlDoc.createElement('Style');
                const balloonStyle = newKmlDoc.createElement('BalloonStyle');
                const text = newKmlDoc.createElement('text');
                
                // Determine if we have a photo to use
                let usePhoto = null;
                let photoSource = '';
                
                if (placemarkInfo.photo) {
                    // Use matched photo
                    usePhoto = placemarkInfo.photo;
                    photoSource = `Foto dari folder: ${usePhoto.folderName}`;
                } else if (useRandomPhotos && availablePhotos.length > 0) {
                    // Use random photo
                    const randomIndex = Math.floor(Math.random() * availablePhotos.length);
                    usePhoto = availablePhotos[randomIndex];
                    photoSource = `Foto acak dari: ${usePhoto.folderName} <em>(Catatan: Foto ini dipilih secara acak)</em>`;
                }
                
                if (usePhoto) {
                    // Create a file name for the photo
                    const photoFileName = `${placemarkInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
                    const photoPath = imagesFolder + photoFileName;
                    
                    // Add the photo to the ZIP
                    const photoData = base64ToArrayBuffer(usePhoto.photoData);
                    zip.file(photoPath, photoData);
                    
                    // Create clean CDATA content with photo
                    text.textContent = `
                        <![CDATA[
                        <h3>${placemarkInfo.name}</h3>
                        <p><img src="${photoPath}" width="300" /></p>
                        <p>${photoSource}</p>
                        ]]>
                    `;
                } else {
                    // No photo
                    text.textContent = `
                        <![CDATA[
                        <h3>${placemarkInfo.name}</h3>
                        <p>Tidak ada foto yang cocok untuk placemark ini.</p>
                        ]]>
                    `;
                }
                
                balloonStyle.appendChild(text);
                style.appendChild(balloonStyle);
                
                // Add IconStyle with green icon for all placemarks
                const iconStyle = newKmlDoc.createElement('IconStyle');
                const icon = newKmlDoc.createElement('Icon');
                const href = newKmlDoc.createElement('href');
                href.textContent = 'http://maps.google.com/mapfiles/kml/paddle/grn-blank.png';
                icon.appendChild(href);
                iconStyle.appendChild(icon);
                style.appendChild(iconStyle);
                
                newPlacemark.appendChild(style);
                
                // Add the clean placemark to the folder
                folder.appendChild(newPlacemark);
            }
            
            // Serialize the new KML document
            const serializer = new XMLSerializer();
            const newKmlContent = serializer.serializeToString(newKmlDoc);
            
            // Update the KML file in the ZIP
            zip.file(kmlPath, newKmlContent);
            
            // Generate the ZIP file
            const content = await zip.generateAsync({ type: 'blob' });
            
            // Create a download link
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = kmzFile.name.replace('.kmz', '_with_photos.kmz');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// Utility function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
});