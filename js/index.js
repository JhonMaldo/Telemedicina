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
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    chatInput.value = '';

    showTypingIndicator();

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

// Indicador de “escribiendo...”
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
