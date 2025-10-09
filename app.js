// Global state management
let currentMode = null;
let isConnected = false;
let roomCode = null;
let connectionCheckInterval = null;
let videoDetectionInterval = null;
let currentVideoUrl = null;

// In-memory storage for demo purposes (simulating cross-device communication)
const appState = {
    receivers: {},
    senders: {},
    casts: {}
};



// Initialize app
document.addEventListener('DOMContentLoaded', function() {

    initializeApp();
});

function initializeApp() {
    // // console.log('Initializing Video Casting App...');
    
    // Set up event listeners for mode selection
    const senderBtn = document.getElementById('sender-mode-btn');
    const receiverBtn = document.getElementById('receiver-mode-btn');
    
    if (senderBtn) {
        senderBtn.addEventListener('click', function() {
            // console.log('Sender mode clicked');
            setMode('sender');
        });
    }
    
    if (receiverBtn) {
        receiverBtn.addEventListener('click', function() {
            // console.log('Receiver mode clicked');
            setMode('receiver');
        });
    }
    
    // Set up sender app event listeners
    setupSenderEventListeners();
    
    // Set up receiver app event listeners
    setupReceiverEventListeners();
    
    // console.log('App initialized successfully');
}

function setupSenderEventListeners() {
    // Connection button
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectToReceiver);
    }
    
    // Disconnect button
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnect);
    }
    
    // Browser controls
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const homeBtn = document.getElementById('home-btn');
    const goBtn = document.getElementById('go-btn');
    
    if (backBtn) backBtn.addEventListener('click', goBack);
    if (forwardBtn) forwardBtn.addEventListener('click', goForward);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshPage);
    if (homeBtn) homeBtn.addEventListener('click', goHome);
    if (goBtn) goBtn.addEventListener('click', navigateToUrl);
    
    // URL input enter key
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                navigateToUrl();
            }
        });
    }
    
    // Room code input enter key
    const roomInput = document.getElementById('room-code-input');
    if (roomInput) {
        roomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                connectToReceiver();
            }
        });
    }
}

function setupReceiverEventListeners() {
    // Stop casting button
    const stopBtn = document.getElementById('stop-cast-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopCasting);
    }
}

function setMode(mode) {
    // console.log('Setting mode to:', mode);
    currentMode = mode;
    
    // Hide mode selection
    const modeSelection = document.getElementById('mode-selection');
    if (modeSelection) {
        modeSelection.classList.add('hidden');
    }
    
    if (mode === 'sender') {
        initializeSender();
    } else if (mode === 'receiver') {
        initializeReceiver();
    }
}

function initializeSender() {
    // console.log('Initializing sender...');
    const senderApp = document.getElementById('sender-app');
    if (senderApp) {
        senderApp.classList.remove('hidden');
    }
    
    // Start video detection when connected
    startVideoDetection();
    
    // console.log('Sender initialized');
}

function initializeReceiver() {
    // console.log('Initializing receiver...');
    const receiverApp = document.getElementById('receiver-app');
    if (receiverApp) {
        receiverApp.classList.remove('hidden');
    }
    
    // Generate room code
    roomCode = generateRoomCode();
    const roomDisplay = document.getElementById('room-code-display');
    if (roomDisplay) {
        roomDisplay.textContent = roomCode;
    }
    
    // Store receiver in app state
    appState.receivers[roomCode] = {
        active: true,
        timestamp: Date.now()
    };
    
    // Start listening for connections
    startConnectionListener();
    
    console.log('Receiver initialized with room code:', roomCode);
}

function generateRoomCode() {
    return Math.random().toString(36).substr(2, 4).toUpperCase();
}

function connectToReceiver() {
    const input = document.getElementById('room-code-input');
    if (!input) return;
    
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        alert('Please enter a room code');
        return;
    }
    
    console.log('Attempting to connect to:', code);
    showLoading('Connecting...');
    
    // Simulate connection process
    setTimeout(() => {
        // Check if receiver with this code exists
        if (appState.receivers[code] && appState.receivers[code].active) {
            // Connect successfully
            isConnected = true;
            roomCode = code;
            
            // Update app state
            appState.senders[code] = {
                connected: true,
                timestamp: Date.now()
            };
            
            // Update UI
            const connectionPanel = document.getElementById('connection-panel');
            const senderInterface = document.getElementById('sender-interface');
            
            if (connectionPanel) connectionPanel.classList.add('hidden');
            if (senderInterface) senderInterface.classList.remove('hidden');
            
            updateConnectionStatus(true);
            hideLoading();
            
            // Load initial test page
            navigateToUrl();
            
            console.log('Connected to receiver:', code);
        } else {
            hideLoading();
            alert('Room code not found. Make sure the receiver is running and try again.');
        }
    }, 1000);
}

function disconnect() {
    console.log('Disconnecting...');
    
    if (roomCode && appState.senders[roomCode]) {
        delete appState.senders[roomCode];
    }
    
    isConnected = false;
    const oldRoomCode = roomCode;
    roomCode = null;
    
    // Reset UI
    const senderInterface = document.getElementById('sender-interface');
    const connectionPanel = document.getElementById('connection-panel');
    const roomInput = document.getElementById('room-code-input');
    
    if (senderInterface) senderInterface.classList.add('hidden');
    if (connectionPanel) connectionPanel.classList.remove('hidden');
    if (roomInput) roomInput.value = '';
    
    updateConnectionStatus(false);
    
    // Clear detected videos
    const detectedVideos = document.getElementById('detected-videos');
    const videoOverlays = document.getElementById('video-overlays');
    
    if (detectedVideos) detectedVideos.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); text-align: center;">Disconnected</p>';
    if (videoOverlays) videoOverlays.innerHTML = '';
    
    console.log('Disconnected from:', oldRoomCode);
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('span:last-child');
    
    if (connected) {
        indicator.classList.add('connected');
        indicator.classList.remove('disconnected');
        text.textContent = `Connected to ${roomCode}`;
    } else {
        indicator.classList.remove('connected');
        indicator.classList.add('disconnected');
        text.textContent = 'Disconnected';
    }
}

function startConnectionListener() {
    console.log('Starting connection listener for room:', roomCode);
    
    // Listen for sender connections and video casts
    connectionCheckInterval = setInterval(() => {
        checkForSenderConnection();
        checkForVideoCast();
    }, 1000);
}

function checkForSenderConnection() {
    const senderData = appState.senders[roomCode];
    const statusIndicator = document.getElementById('receiver-status-indicator');
    const statusText = document.getElementById('receiver-status-text');
    
    if (senderData && senderData.connected && !isConnected) {
        isConnected = true;
        if (statusIndicator) statusIndicator.classList.add('connected');
        if (statusText) statusText.textContent = 'Connected to sender';
        console.log('Sender connected to receiver');
    } else if (!senderData && isConnected) {
        isConnected = false;
        if (statusIndicator) statusIndicator.classList.remove('connected');
        if (statusText) statusText.textContent = 'Waiting for connection...';
        stopCasting();
        console.log('Sender disconnected from receiver');
    }
}

function checkForVideoCast() {
    const castData = appState.casts[roomCode];
    if (castData && castData.videoUrl && castData.videoUrl !== currentVideoUrl) {
        console.log('New video cast received:', castData.videoUrl);
        playVideo(castData.videoUrl, castData.title || 'Cast Video');
        currentVideoUrl = castData.videoUrl;
    }
}

function navigateToUrl() {
    const urlInput = document.getElementById('url-input');
    if (!urlInput) return;
    
    let url = urlInput.value.trim();
    
    if (!url) {
        url = 'about:blank';
        urlInput.value = url;
    }
    
    const frame = document.getElementById('browser-frame');
    if (!frame) return;
    
    // Add protocol if missing
    let finalUrl = url;
    if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('about:')) {
        finalUrl = 'https://' + url;
    }
    
    try {
        frame.src = finalUrl;
        urlInput.value = finalUrl;
    } catch (error) {
        
        alert('Unable to load this URL.');
    }
}

function goBack() {
    const frame = document.getElementById('browser-frame');
    if (frame) {
        frame.contentWindow.history.back();
    }
}

function goForward() {
    const frame = document.getElementById('browser-frame');
    if (frame) {
        frame.contentWindow.history.forward();
    }
}





function refreshPage() {
    console.log('Refresh clicked');
    navigateToUrl();
}

function goHome() {
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
        urlInput.value = 'about:blank';
        navigateToUrl();
    }
}

function startVideoDetection() {
    console.log('Starting video detection...');
    
    // Run detection periodically when connected
    videoDetectionInterval = setInterval(() => {
        if (isConnected) {
            detectVideos();
        }
    }, 3000);
    
    // Run once immediately after a short delay
    setTimeout(() => {
        if (isConnected) detectVideos();
    }, 2000);
}

function detectVideos() {
    const frame = document.getElementById('browser-frame');
    const detectedContainer = document.getElementById('detected-videos');
    const overlayContainer = document.getElementById('video-overlays');
    
    if (!detectedContainer || !frame) return;
    
    try {
        // Clear previous overlays
        if (overlayContainer) overlayContainer.innerHTML = '';
        
        // Try to access iframe content (will work with data URLs)
        const frameDoc = frame.contentDocument || frame.contentWindow.document;
        if (!frameDoc) {
            detectedContainer.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); text-align: center;">Loading page...</p>';
            return;
        }
        
        const videos = frameDoc.querySelectorAll('video');
        
        // Clear previous detected videos list
        detectedContainer.innerHTML = '';
        
        if (videos.length === 0) {
            detectedContainer.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); text-align: center;">No videos detected.</p>';
            return;
        }
        
        console.log('Detected', videos.length, 'video(s)');
        
        videos.forEach((video, index) => {
            const videoSrc = getVideoSource(video);
            if (videoSrc) {
                // Add to detected videos list
                const videoItem = createDetectedVideoItem(videoSrc, index);
                detectedContainer.appendChild(videoItem);
                
                console.log(`Video ${index + 1}:`, videoSrc);
            }
        });
        
    } catch (error) {
        // Expected error for external sites due to cross-origin restrictions
        detectedContainer.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); text-align: center;">Cannot scan external sites.</p>';
        console.log('Video detection limited due to cross-origin restrictions (expected)');
    }
}

function getVideoSource(video) {
    // Try to get video source URL
    if (video.src && video.src !== window.location.href && video.src !== '') {
        return video.src;
    }
    
    const sources = video.querySelectorAll('source');
    if (sources.length > 0 && sources[0].src) {
        return sources[0].src;
    }
    
    return null;
}

function createDetectedVideoItem(videoSrc, index) {
    const item = document.createElement('div');
    item.className = 'detected-video';
    
    const info = document.createElement('div');
    info.className = 'video-info';
    
    const url = document.createElement('div');
    url.className = 'video-url';
    const displayUrl = videoSrc.length > 50 ? videoSrc.substring(0, 50) + '...' : videoSrc;
    url.textContent = displayUrl;
    
    const title = document.createElement('div');
    title.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text); margin-bottom: var(--space-4);';
    title.textContent = `Video ${index + 1}`;
    
    info.appendChild(title);
    info.appendChild(url);
    
    const castBtn = document.createElement('button');
    castBtn.className = 'btn btn--primary btn--sm';
    castBtn.textContent = '📺 Cast';
    castBtn.addEventListener('click', () => castVideo(videoSrc, `Video ${index + 1}`));
    
    item.appendChild(info);
    item.appendChild(castBtn);
    
    return item;
}

function castVideo(videoUrl, title) {
    if (!isConnected || !roomCode) {
        alert('Not connected to receiver. Please connect first.');
        return;
    }
    
    console.log('Casting video:', title, videoUrl);
    showLoading('Casting video...');
    
    // Send video to receiver via app state
    appState.casts[roomCode] = {
        videoUrl: videoUrl,
        title: title,
        timestamp: Date.now()
    };
    
    setTimeout(() => {
        hideLoading();
        showCastConfirmation();
    }, 800);
}

function showCastConfirmation() {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    
    const confirmMsg = document.createElement('div');
    confirmMsg.textContent = '✓ Video cast successfully!';
    confirmMsg.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--color-success); color: white; padding: 8px; text-align: center; font-size: var(--font-size-sm); z-index: 100; border-radius: var(--radius-sm);';
    statusBar.style.position = 'relative';
    statusBar.appendChild(confirmMsg);
    
    setTimeout(() => {
        if (confirmMsg.parentNode) {
            confirmMsg.remove();
        }
    }, 3000);
}

function playVideo(videoUrl, title) {
    console.log('Playing video on receiver:', title, videoUrl);
    
    const waitingScreen = document.getElementById('waiting-screen');
    const videoPlayer = document.getElementById('video-player');
    const video = document.getElementById('cast-video');
    const videoTitle = document.getElementById('video-title');
    const videoSource = document.getElementById('video-source');
    
    if (!video || !waitingScreen || !videoPlayer) return;
    
    // Stop current video if playing
    video.pause();
    video.currentTime = 0;
    
    // Update video info
    if (videoTitle) videoTitle.textContent = title;
    if (videoSource) {
        try {
            videoSource.textContent = `Source: ${new URL(videoUrl).hostname}`;
        } catch (e) {
            videoSource.textContent = 'Source: Local file';
        }
    }
    
    // Load new video
    video.src = videoUrl;
    video.load();
    
    // Show video player
    waitingScreen.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    
    // Auto-play when loaded
    video.addEventListener('loadeddata', function() {
        video.play().catch(error => {
            console.log('Autoplay prevented by browser policy (expected)');
        });
    }, { once: true });
    
    video.addEventListener('error', function(e) {
        // console.error('Video playback error:', e);
        alert('Error playing video. The video source may not be accessible.');
        stopCasting();
    }, { once: true });
}

function stopCasting() {
    console.log('Stopping cast...');
    
    const waitingScreen = document.getElementById('waiting-screen');
    const videoPlayer = document.getElementById('video-player');
    const video = document.getElementById('cast-video');
    
    if (!video || !waitingScreen || !videoPlayer) return;
    
    // Stop video
    video.pause();
    video.src = '';
    video.load();
    
    // Show waiting screen
    videoPlayer.classList.add('hidden');
    waitingScreen.classList.remove('hidden');
    
    // Clear current video URL
    currentVideoUrl = null;
    
    // Clear cast data
    if (roomCode && appState.casts[roomCode]) {
        delete appState.casts[roomCode];
    }
}

function showLoading(text) {
    const loadingText = document.getElementById('loading-text');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (loadingText) loadingText.textContent = text;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
    if (videoDetectionInterval) {
        clearInterval(videoDetectionInterval);
    }
});
