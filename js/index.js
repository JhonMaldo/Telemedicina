// Navigation
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
    
    // Update section title
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

// --- CHATBOT MEJORADO ---
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
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    chatInput.value = '';
    showTypingIndicator();

    setTimeout(() => {
        const response = getBotResponse(message);
        hideTypingIndicator();
        addMessage(response, 'bot');
    }, 1200);
}

// Agregar mensaje al chat
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

    // Guardar historial
    chatHistory.push({ sender, text, time });
}

// Simular “escribiendo...”
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

// Respuestas más inteligentes
function getBotResponse(input) {
    input = input.toLowerCase();

    if (input.includes('hola') || input.includes('buenas')) {
        return '¡Hola! 😊 ¿En qué puedo ayudarte hoy?';
    } 
    if (input.includes('fiebre') || input.includes('dolor')) {
        return 'Parece que tienes síntomas. ¿Quieres que te ayude a agendar una cita médica?';
    }
    if (input.includes('receta')) {
        return 'Para solicitar una receta médica, por favor agenda una cita con tu médico.';
    }
    if (input.includes('cita') || input.includes('agendar')) {
        return 'Puedes agendar una cita en la sección "Agendar Cita" del menú. ¿Deseas que te lleve allí?';
    }
    if (input.includes('videoconsulta')) {
        return 'Puedes acceder a las videoconsultas desde la sección "Videoconsulta".';
    }
    if (input.includes('contacto') || input.includes('ayuda')) {
        return 'Puedes escribirnos al correo soporte@clinicavirtual.com o usar este chat para orientación básica.';
    }
    if (input.includes('limpiar') || input.includes('borrar')) {
        clearChat();
        return 'He limpiado el chat 🧹';
    }

    return 'No estoy seguro de entender. ¿Podrías reformular tu pregunta o escribir “ayuda”?';
}

// Limpiar chat
function clearChat() {
    chatMessages.innerHTML = '';
    chatHistory = [];
}

// Payment Modal
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

// Prescription Download
function downloadPrescription(id) {
    alert(`Descargando receta médica #${id}...`);
    // Aquí iría la lógica para descargar el PDF real
}

function requestNewPrescription() {
    alert('Funcionalidad para solicitar una nueva receta médica próximamente.');
}

// Profile Update
document.getElementById('profile-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Perfil actualizado con éxito.');
});
