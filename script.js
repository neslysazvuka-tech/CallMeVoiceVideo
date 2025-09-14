let peer;
let localStream;
let currentCall;

// Инициализация PeerJS
function initializePeer() {
    // Создаем случайный ID для демонстрации
    const randomId = 'user-' + Math.random().toString(36).substr(2, 9);
    
    peer = new Peer(randomId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        debug: 3
    });

    peer.on('open', (id) => {
        console.log('Peer подключен с ID:', id);
        document.getElementById('myPeerId').textContent = id;
        updateStatus('Готов к звонку');
    });

    peer.on('call', (call) => {
        // Запрос на доступ к медиа
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                
                // Отвечаем на звонок
                call.answer(stream);
                currentCall = call;
                
                call.on('stream', (remoteStream) => {
                    document.getElementById('remoteVideo').srcObject = remoteStream;
                    updateStatus('В разговоре', true);
                });
                
                call.on('close', () => {
                    endCall();
                });
            })
            .catch((err) => {
                console.error('Ошибка доступа к медиа:', err);
                updateStatus('Ошибка доступа к камере/микрофону');
            });
    });

    peer.on('error', (err) => {
        console.error('PeerJS ошибка:', err);
        updateStatus('Ошибка подключения');
    });
}

// Начать звонок (получить доступ к медиа)
function startCall() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            localStream = stream;
            document.getElementById('localVideo').srcObject = stream;
            updateStatus('Камера и микрофон активны');
            
            // Активируем кнопки
            document.getElementById('startCall').disabled = true;
            document.getElementById('endCall').disabled = false;
        })
        .catch((err) => {
            console.error('Ошибка доступа к медиа:', err);
            alert('Не удалось получить доступ к камере и микрофону. Проверьте разрешения.');
        });
}

// Позвонить другому пользователю
function callPeer() {
    const peerId = document.getElementById('peerIdInput').value.trim();
    
    if (!peerId) {
        alert('Введите ID собеседника');
        return;
    }
    
    if (!localStream) {
        alert('Сначала активируйте камеру и микрофон');
        return;
    }
    
    const call = peer.call(peerId, localStream);
    currentCall = call;
    
    call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
        updateStatus('В разговоре', true);
    });
    
    call.on('close', () => {
        endCall();
    });
}

// Завершить звонок
function endCall() {
    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
    
    document.getElementById('startCall').disabled = false;
    document.getElementById('endCall').disabled = true;
    
    updateStatus('Звонок завершен');
}

// Обновить статус
function updateStatus(message, isConnected = false) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    
    if (isConnected) {
        statusElement.classList.add('connected');
    } else {
        statusElement.classList.remove('connected');
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    initializePeer();
    
    // Проверяем поддержку getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Ваш браузер не поддерживает видеозвонки');
        return;
    }
});

// Обработка закрытия страницы
window.addEventListener('beforeunload', () => {
    if (currentCall) {
        currentCall.close();
    }
    if (peer) {
        peer.destroy();
    }
});
