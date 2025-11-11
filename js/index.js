// -------------------- NAVEGACIÓN --------------------
document.querySelectorAll('.menu-item').forEach(item => {
    if (item.dataset.section) {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            showSection(this.dataset.section);
        });
    }
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'appointments': 'Notificaciones',
        'schedule': 'Agendar Cita',
        'chatbot': 'Asistente Virtual',
        'video-consultation': 'Videoconsulta',
        'prescriptions': 'Mis Recetas'
    };
    
    document.getElementById('section-title').textContent = titles[sectionId] || 'Dashboard';
}

// -------------------- CHATBOT --------------------
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-message');
const chatMessages = document.getElementById('chatbot-messages');
let chatHistory = [];

// Enviar mensaje con Enter o botón
chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
sendBtn.addEventListener('click', sendMessage);

// Acciones rápidas
document.querySelectorAll('.quick-action').forEach(action => {
    action.addEventListener('click', function() {
        chatInput.value = this.dataset.message;
        sendMessage();
    });
});

// Enviar mensaje del usuario
// Enviar mensaje del usuario
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    chatInput.value = '';

    showTypingIndicator();

<<<<<<< HEAD
<<<<<<< Updated upstream
    // Simular respuesta del bot
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateBotResponse(message);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 2000);
=======
    console.log('🔍 DEPURACIÓN - Enviando mensaje:', message);

    // Intentar diferentes rutas
    const pathsToTry = [
        'DataBase/php/chatbot.php',
        './DataBase/php/chatbot.php',
        '../DataBase/php/chatbot.php',
        '/DataBase/php/chatbot.php'
    ];

    let currentTry = 0;

    function attemptFetch() {
        if (currentTry >= pathsToTry.length) {
            console.error('❌ Todas las rutas fallaron');
            hideTypingIndicator();
            addMessage("⚠️ Error: Verifica que el servidor esté funcionando y los archivos PHP estén en DataBase/php/", 'bot');
            return;
        }

        const currentPath = pathsToTry[currentTry];
        console.log(`🔄 Intentando ruta ${currentTry + 1}: ${currentPath}`);

        fetch(currentPath, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => {
            console.log(`📊 Status: ${response.status}, OK: ${response.ok}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ ÉXITO - Respuesta recibida:', data);
            hideTypingIndicator();
            addMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error(`❌ Error con ${currentPath}:`, error);
            currentTry++;
            
            // Intentar siguiente ruta después de un breve delay
            setTimeout(attemptFetch, 100);
        });
    }

    // Comenzar el primer intento
    attemptFetch();
>>>>>>> Stashed changes
=======
    fetch('bd/chatbot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        hideTypingIndicator();
        addMessage(data.response, 'bot');
    })
    .catch(err => {
        hideTypingIndicator();
        console.error('Error:', err);
        addMessage("⚠️ No se pudo conectar con el asistente.", 'bot');
    });
>>>>>>> parent of 396ba34 (Botones)
}

// Agregar mensajes al chat
function addMessage(text, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', sender);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageContainer.innerHTML = `
        <p>${text}</p>
        <span class="time">${time}</span>
    `;

    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatHistory.push({ sender, text, time });
}

<<<<<<< HEAD
<<<<<<< Updated upstream
// Generar respuesta del bot
function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
        return '¡Hola! Soy tu asistente virtual de salud. ¿En qué puedo ayudarte hoy?';
    } else if (lowerMessage.includes('cita') || lowerMessage.includes('agendar')) {
        return 'Puedes agendar una cita en la sección "Agendar Cita". ¿Necesitas ayuda con algún tipo de consulta específica?';
    } else if (lowerMessage.includes('receta') || lowerMessage.includes('medic')) {
        return 'Para solicitar una receta médica, ve a la sección "Mis Recetas" o contacta a tu médico directamente.';
    } else if (lowerMessage.includes('video') || lowerMessage.includes('virtual')) {
        return 'Puedes solicitar una videoconsulta en la sección "Videoconsulta". Tenemos disponibilidad inmediata.';
    } else if (lowerMessage.includes('fiebre') || lowerMessage.includes('dolor')) {
        return 'Si tienes fiebre o dolor persistente, te recomiendo agendar una consulta. ¿Quieres que te ayude a programarla?';
    } else if (lowerMessage.includes('gracias')) {
        return '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?';
    } else {
        return 'Entiendo que necesitas ayuda. Puedo asistirte con: agendar citas, solicitar recetas, videoconsultas o responder preguntas generales de salud. ¿En qué específicamente necesitas ayuda?';
    }
}

=======
>>>>>>> Stashed changes
// Indicador de "escribiendo..."
=======
// Indicador de “escribiendo...”
>>>>>>> parent of 396ba34 (Botones)
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'typing';
    typing.classList.add('message', 'bot');
    typing.innerHTML = `<p><em>Escribiendo...</em></p>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

// Limpiar chat
function clearChat() {
    chatMessages.innerHTML = '';
    chatHistory = [];
}

// -------------------- PAGOS --------------------
const paymentModal = document.getElementById('payment-modal');
const closeModalBtn = document.querySelector('.close-modal');
const paymentMethods = document.querySelectorAll('.payment-method');
let selectedMethod = null;
let consultationType = '';
let consultationPrice = 0;

function showPaymentModal(type) {
    consultationType = type === 'general' ? 'Consulta General' : type === 'specialist' ? 'Especialista' : 'Control';
    consultationPrice = type === 'general' ? 25000 : type === 'specialist' ? 40000 : 20000;
    
    document.getElementById('consultation-type').value = consultationType;
    document.getElementById('consultation-price').value = `$${consultationPrice.toLocaleString()}`;
    
    paymentModal.style.display = 'flex';
}

closeModalBtn.addEventListener('click', () => {
    paymentModal.style.display = 'none';
    resetPaymentModal();
});

window.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
        paymentModal.style.display = 'none';
        resetPaymentModal();
    }
});

paymentMethods.forEach(method => {
    method.addEventListener('click', function() {
        paymentMethods.forEach(m => m.classList.remove('selected'));
        this.classList.add('selected');
        selectedMethod = this.dataset.method;
        
        document.getElementById('credit-card-form').style.display = 
            selectedMethod === 'credit-card' || selectedMethod === 'debit-card' ? 'block' : 'none';
    });
});

document.getElementById('confirm-payment').addEventListener('click', () => {
    if (!selectedMethod) {
        alert('Por favor, selecciona un método de pago.');
        return;
    }
    
    if (selectedMethod === 'credit-card' || selectedMethod === 'debit-card') {
        const cardNumber = document.getElementById('card-number').value.trim();
        const cardExpiry = document.getElementById('card-expiry').value.trim();
        const cardCvc = document.getElementById('card-cvc').value.trim();
        const cardName = document.getElementById('card-name').value.trim();
        
        if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
            alert('Por favor, completa todos los campos de la tarjeta.');
            return;
        }
    }
    
    alert(`Pago de $${consultationPrice.toLocaleString()} por ${consultationType} realizado con éxito.`);
    paymentModal.style.display = 'none';
    resetPaymentModal();
});

function resetPaymentModal() {
    selectedMethod = null;
    consultationType = '';
    consultationPrice = 0;
    paymentMethods.forEach(m => m.classList.remove('selected'));
    document.getElementById('credit-card-form').style.display = 'none';
    document.getElementById('card-number').value = '';
    document.getElementById('card-expiry').value = '';
    document.getElementById('card-cvc').value = '';
    document.getElementById('card-name').value = '';
}

// -------------------- RECETAS --------------------
function downloadPrescription(id) {
    alert(`Descargando receta médica #${id}...`);
}

function requestNewPrescription() {
    alert('Funcionalidad para solicitar una nueva receta médica próximamente.');
}

// -------------------- PERFIL --------------------
document.getElementById('profile-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Perfil actualizado con éxito.');
});
<<<<<<< HEAD

<<<<<<< Updated upstream
// Botón solicitar nueva receta
document.querySelector('#prescriptions .btn')?.addEventListener('click', function() {
    if (this.textContent.includes('Solicitar Nueva Receta')) {
        requestNewPrescription();
    }
});

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de paciente inicializado');
    
    // Configurar fecha mínima para agendar citas (hoy)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        dateInput.min = today;
    }
});
=======
// Función de prueba para verificar rutas
function testPaths() {
    console.log('🧪 TESTEANDO RUTAS DISPONIBLES:');
    const testPaths = [
        'DataBase/php/chatbot.php',
        '../DataBase/php/chatbot.php', 
        './DataBase/php/chatbot.php',
        'php/chatbot.php',
        '../php/chatbot.php'
    ];
    
    testPaths.forEach(path => {
        fetch(path, { method: 'HEAD' })
            .then(res => console.log(`✅ ${path}: ${res.status}`))
            .catch(err => console.log(`❌ ${path}: ${err.message}`));
    });
}

// Ejecutar test al cargar (opcional)
// setTimeout(testPaths, 1000);
>>>>>>> Stashed changes
=======
>>>>>>> parent of 396ba34 (Botones)
