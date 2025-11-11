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

// Cerrar sesión
document.querySelectorAll('.menu-item').forEach(item => {
    if (item.textContent.includes('Cerrar Sesión')) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                window.location.href = 'login.html';
            }
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

// -------------------- BOTONES DE ACCIONES RÁPIDAS --------------------
document.querySelectorAll('.dashboard-cards .card').forEach(card => {
    card.addEventListener('click', function() {
        const section = this.querySelector('h3').textContent;
        switch(section) {
            case 'Agendar Cita':
                showSection('schedule');
                break;
            case 'Asistente Virtual':
                showSection('chatbot');
                break;
            case 'Videoconsulta':
                showSection('video-consultation');
                break;
            case 'Mis Recetas':
                showSection('prescriptions');
                break;
        }
    });
});

// -------------------- BOTONES DE CITAS --------------------
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-success') && e.target.textContent.includes('Confirmar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        confirmAppointment(appointmentItem);
    }
    
    if (e.target.classList.contains('btn-warning') && e.target.textContent.includes('Reagendar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        rescheduleAppointment(appointmentItem);
    }
    
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Cancelar') && !e.target.textContent.includes('Descargar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        cancelAppointment(appointmentItem);
    }
    
    if (e.target.classList.contains('btn-success') && e.target.textContent.includes('Unirse')) {
        joinVideoCall();
    }
});

function confirmAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    
    if (confirm('¿Confirmar esta cita?')) {
        appointmentItem.style.opacity = '0.7';
        const confirmBtn = appointmentItem.querySelector('.btn-success');
        confirmBtn.textContent = 'Confirmada';
        confirmBtn.disabled = true;
        
        alert(`Cita "${appointmentId}" confirmada exitosamente`);
    }
}

function rescheduleAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    const newDate = prompt('Ingrese nueva fecha y hora para la cita (ej: 25/10/2023 11:00):');
    
    if (newDate) {
        alert(`Cita "${appointmentId}" reagendada para: ${newDate}`);
        // Aquí iría la llamada al backend
    }
}

function cancelAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    
    if (confirm(`¿Está seguro de cancelar la cita "${appointmentId}"?`)) {
        appointmentItem.style.display = 'none';
        alert(`Cita "${appointmentId}" cancelada exitosamente`);
    }
}

function joinVideoCall() {
    alert('Iniciando videollamada...');
    // Simular apertura de ventana de videollamada
    setTimeout(() => {
        alert('¡Conectado a la videoconsulta!');
        // Aquí iría la integración con WebRTC
    }, 1000);
}

// -------------------- FORMULARIO AGENDAR CITA --------------------
document.getElementById('schedule-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    scheduleAppointment();
});

function scheduleAppointment() {
    const tipo = document.getElementById('appointment-type').value;
    const especialidad = document.getElementById('specialty').value;
    const doctor = document.getElementById('doctor').value;
    const fecha = document.getElementById('appointment-date').value;
    const hora = document.getElementById('appointment-time').value;
    const sintomas = document.getElementById('symptoms').value;
    
    if (!tipo || !fecha || !hora) {
        alert('Por favor complete los campos obligatorios');
        return;
    }
    
    // Simular envío
    setTimeout(() => {
        alert(`Cita agendada exitosamente:\nTipo: ${tipo}\nFecha: ${fecha}\nHora: ${hora}\n\nRecibirá una confirmación por correo.`);
        document.getElementById('schedule-form').reset();
    }, 1000);
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

// Botón de videollamada
document.getElementById('start-video-call')?.addEventListener('click', function() {
    startEmergencyVideoCall();
});

function startEmergencyVideoCall() {
    if (confirm('¿Iniciar videollamada de emergencia con un especialista?')) {
        alert('Conectando con el primer especialista disponible...');
        // Aquí iría la integración real
    }
}

// Enviar mensaje del usuario
// Enviar mensaje del usuario
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    chatInput.value = '';

    showTypingIndicator();

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
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'typing';
    typing.classList.add('message', 'bot');
    typing.innerHTML = `<p><em>El asistente está escribiendo...</em></p>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

// -------------------- VIDEOCONSULTAS --------------------
document.querySelectorAll('#video-consultation .btn').forEach(btn => {
    if (btn.textContent.includes('Solicitar')) {
        btn.addEventListener('click', function() {
            const tipo = this.closest('.card').querySelector('h3').textContent;
            const precio = this.closest('.card').querySelector('p[style*="font-weight: bold"]').textContent;
            showPaymentModal(tipo, precio);
        });
    }
});

// -------------------- PAGOS --------------------
const paymentModal = document.getElementById('payment-modal');
const closeModalBtn = document.querySelector('.close-modal');
const paymentMethods = document.querySelectorAll('.payment-method');
let selectedMethod = null;
let consultationType = '';
let consultationPrice = 0;

function showPaymentModal(type, price) {
    consultationType = type;
    consultationPrice = parseInt(price.replace(/\D/g, '')) || 0;
    
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
    processPayment();
});

function processPayment() {
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
        
        // Validación básica
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            alert('Por favor, ingresa un número de tarjeta válido (16 dígitos).');
            return;
        }
    }
    
    // Simular procesamiento de pago
    alert(`Procesando pago de $${consultationPrice.toLocaleString()} por ${consultationType}...`);
    
    setTimeout(() => {
        alert(`¡Pago realizado con éxito!\n${consultationType} - $${consultationPrice.toLocaleString()}`);
        paymentModal.style.display = 'none';
        resetPaymentModal();
        
        // Mostrar confirmación
        showSection('appointments');
    }, 2000);
}

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
    // Simular descarga
    setTimeout(() => {
        alert('Receta descargada exitosamente');
    }, 1000);
}

function requestNewPrescription() {
    if (confirm('¿Solicitar nueva receta médica?')) {
        const motivo = prompt('Por favor, describe para qué necesitas la receta:');
        if (motivo) {
            alert('Solicitud de receta enviada a tu médico. Te contactaremos pronto.');
        }
    }
}

// Configurar botones de descarga
document.querySelectorAll('.prescription-item .btn').forEach(btn => {
    if (btn.textContent.includes('Descargar')) {
        btn.addEventListener('click', function() {
            const prescriptionId = this.closest('.prescription-item').querySelector('h4').textContent;
            downloadPrescription(prescriptionId);
        });
    }
});

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
