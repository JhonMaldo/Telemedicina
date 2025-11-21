// ==================== SISTEMA DE NAVEGACIÓN ====================

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
    
    // Cargar notificaciones automáticamente al cambiar a esa sección
    if (sectionId === 'appointments') {
        setTimeout(cargarNotificacionesPacientes, 300);
    }
}

// ==================== SISTEMA DE AGENDAR CITAS ====================

// -------------------- AGENDAR CITA --------------------
document.getElementById('schedule-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        tipo_consulta: document.getElementById('appointment-type').value,
        especialidad: document.getElementById('specialty').value,
        doctor_id: document.getElementById('doctor').value || null,
        fecha: document.getElementById('appointment-date').value,
        hora: document.getElementById('appointment-time').value,
        sintomas: document.getElementById('symptoms').value
    };

    // Validar que todos los campos obligatorios estén llenos
    if (!formData.tipo_consulta || !formData.fecha || !formData.hora) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }

    // Si es especialista, validar que se seleccionó especialidad
    if (formData.tipo_consulta === 'specialist' && !formData.especialidad) {
        alert('Para consulta con especialista, por favor selecciona una especialidad.');
        return;
    }

    // Mostrar loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
    submitBtn.disabled = true;

    // Enviar datos al servidor
    fetch('DataBase/php/agendarCita.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ ' + data.message);
            // Limpiar formulario
            this.reset();
            // Redirigir a notificaciones
            showSection('appointments');
        } else {
            alert('❌ ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    })
    .finally(() => {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
});

// ==================== SISTEMA DE CHATBOT ====================

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
        const message = this.dataset.message;
        addMessage(message, 'user');
        chatInput.value = '';

        showTypingIndicator();

        fetch('DataBase/php/chatbot.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return res.json();
        })
        .then(data => {
            hideTypingIndicator();
            addMessage(data.response, 'bot');
        })
        .catch(err => {
            hideTypingIndicator();
            console.error('Error:', err);
            addMessage("⚠️ No se pudo conectar con el asistente.", 'bot');
        });
    });
});

// Enviar mensaje del usuario
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    chatInput.value = '';

    showTypingIndicator();

    fetch('DataBase/php/chatbot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return res.json();
    })
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

// Indicador de "escribiendo..."
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

// ==================== SISTEMA DE VIDEOCONSULTAS ====================

// -------------------- VIDEOCONSULTA --------------------
document.getElementById('start-video-call').addEventListener('click', function() {
    window.open('https://meet.google.com/npr-mpgv-vrc', '_blank');
});

// ==================== SISTEMA DE PAGOS ====================

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

// ==================== SISTEMA DE RECETAS ====================

// -------------------- RECETAS --------------------
function downloadPrescription(id) {
    alert(`Descargando receta médica #${id}...`);
}

function requestNewPrescription() {
    alert('Funcionalidad para solicitar una nueva receta médica próximamente.');
}

<<<<<<< HEAD
// ==================== SISTEMA DE NOTIFICACIONES ====================

// -------------------- CARGAR NOTIFICACIONES DE PACIENTES --------------------
function cargarNotificacionesPacientes() {
    console.log('🔔 Cargando notificaciones de pacientes...');
    
    // Mostrar estado de carga
    const estadoCarga = document.getElementById('estado-carga');
    const container = document.getElementById('notificaciones-container');
    
    if (estadoCarga) estadoCarga.textContent = 'Cargando...';
    if (container) {
        container.innerHTML = `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h4><i class="fas fa-spinner fa-spin"></i> Cargando notificaciones...</h4>
                    <p>Por favor espera mientras cargamos tus notificaciones.</p>
                </div>
            </div>
        `;
    }

    // SIMULACIÓN TEMPORAL - Datos de ejemplo
    setTimeout(() => {
        const notificacionesEjemplo = [
            {
                id_notificaciones: 1,
                id_usuario: 1,
                tipo_notificacion: "Bienvenida",
                mensaje: "¡Hola Juan Pérez! Te damos la bienvenida a TeleMed. Estamos aquí para cuidar de tu salud.",
                leido: 0,
                creado_en: new Date().toISOString()
            },
            {
                id_notificaciones: 2,
                id_usuario: 1,
                tipo_notificacion: "Cita Programada",
                mensaje: "Tu cita de Cardiología ha sido programada para el 25 de Enero a las 14:30 hrs.",
                leido: 0,
                creado_en: new Date(Date.now() - 86400000).toISOString() // Ayer
            },
            {
                id_notificaciones: 3,
                id_usuario: 1,
                tipo_notificacion: "Recordatorio",
                mensaje: "Recuerda tu consulta de seguimiento mañana a las 11:00 AM.",
                leido: 1,
                creado_en: new Date(Date.now() - 172800000).toISOString() // Hace 2 días
            }
        ];
        
        mostrarNotificacionesEnUI(notificacionesEjemplo);
        if (estadoCarga) estadoCarga.textContent = `Cargadas ${notificacionesEjemplo.length} notificaciones`;
        
    }, 1000);
    
    /* 
    // CÓDIGO REAL PARA CUANDO TENGAS EL BACKEND:
    const idPaciente = 1;
    
    fetch('DataBase/php/obtenerNotificacionesPacientes.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_paciente: idPaciente })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacionesEnUI(data.notificaciones);
            if (estadoCarga) estadoCarga.textContent = `Cargadas ${data.notificaciones.length} notificaciones`;
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacionesEnUI([]);
        if (estadoCarga) estadoCarga.textContent = 'Error al cargar';
    });
    */
}

// -------------------- MOSTRAR NOTIFICACIONES EN LA UI --------------------
function mostrarNotificacionesEnUI(notificaciones) {
    const container = document.getElementById('notificaciones-container');
    const contador = document.getElementById('notificaciones-contador');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de notificaciones');
        return;
    }
    
    if (notificaciones.length === 0) {
        container.innerHTML = `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h4>🎉 No hay notificaciones</h4>
                    <p>No tienes notificaciones pendientes en este momento.</p>
                </div>
            </div>
        `;
        if (contador) {
            contador.style.display = 'none';
        }
        return;
    }
    
    let html = '';
    
    notificaciones.forEach(notificacion => {
        const fecha = new Date(notificacion.creado_en).toLocaleDateString('es-ES');
        const hora = new Date(notificacion.creado_en).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determinar el tipo de notificación y el icono
        let icono = 'fa-bell';
        let claseTipo = 'info';
        
        if (notificacion.tipo_notificacion.includes('Bienvenida')) {
            icono = 'fa-user-plus';
            claseTipo = 'success';
        } else if (notificacion.tipo_notificacion.includes('Cita')) {
            icono = 'fa-calendar-alt';
            claseTipo = 'warning';
        } else if (notificacion.tipo_notificacion.includes('Recordatorio')) {
            icono = 'fa-clock';
            claseTipo = 'info';
        }
        
        html += `
            <div class="appointment-item notificacion-item ${notificacion.leido ? 'leida' : 'no-leida'}" data-id="${notificacion.id_notificaciones}">
                <div class="appointment-info">
                    <div class="notificacion-header">
                        <i class="fas ${icono} ${claseTipo}"></i>
                        <h4>${notificacion.tipo_notificacion}</h4>
                        <span class="notificacion-fecha">${fecha} - ${hora}</span>
                    </div>
                    <p class="notificacion-mensaje">${notificacion.mensaje}</p>
                </div>
                <div class="appointment-actions">
                    ${!notificacion.leido ? 
                        `<button class="btn btn-success" onclick="marcarComoLeida(${notificacion.id_notificaciones})">
                            <i class="fas fa-check"></i> Marcar como leída
                        </button>` 
                        : 
                        `<span class="leida-badge"><i class="fas fa-check-circle"></i> Leída</span>`
                    }
                    <button class="btn btn-danger" onclick="eliminarNotificacion(${notificacion.id_notificaciones})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Actualizar contador de notificaciones no leídas
    const notificacionesNoLeidas = notificaciones.filter(n => !n.leido).length;
    actualizarContadorNotificaciones(notificacionesNoLeidas);
    
    console.log(`✅ ${notificaciones.length} notificaciones mostradas, ${notificacionesNoLeidas} sin leer`);
}

// -------------------- MARCAR NOTIFICACIÓN COMO LEÍDA --------------------
function marcarComoLeida(idNotificacion) {
    console.log(`📌 Marcando notificación ${idNotificacion} como leída`);
    
    // SIMULACIÓN TEMPORAL
    const notificacionItem = document.querySelector(`.notificacion-item[data-id="${idNotificacion}"]`);
    if (notificacionItem) {
        notificacionItem.classList.remove('no-leida');
        notificacionItem.classList.add('leida');
        const actions = notificacionItem.querySelector('.appointment-actions');
        if (actions) {
            actions.innerHTML = `
                <span class="leida-badge"><i class="fas fa-check-circle"></i> Leída</span>
                <button class="btn btn-danger" onclick="eliminarNotificacion(${idNotificacion})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            `;
        }
        actualizarContadorNotificaciones(-1);
        showNotification('Notificación marcada como leída', 'success');
    }
}

// -------------------- MARCAR TODAS COMO LEÍDAS --------------------
function marcarTodasComoLeidas() {
    console.log('📌 Marcando todas las notificaciones como leídas');
    
    const notificacionesNoLeidas = document.querySelectorAll('.notificacion-item.no-leida');
    
    if (notificacionesNoLeidas.length === 0) {
        showNotification('No hay notificaciones sin leer', 'info');
        return;
    }
    
    if (!confirm(`¿Marcar ${notificacionesNoLeidas.length} notificaciones como leídas?`)) {
        return;
    }
    
    // SIMULACIÓN TEMPORAL
    notificacionesNoLeidas.forEach(item => {
        item.classList.remove('no-leida');
        item.classList.add('leida');
        const actions = item.querySelector('.appointment-actions');
        if (actions) {
            const id = item.dataset.id;
            actions.innerHTML = `
                <span class="leida-badge"><i class="fas fa-check-circle"></i> Leída</span>
                <button class="btn btn-danger" onclick="eliminarNotificacion(${id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            `;
        }
    });
    
    actualizarContadorNotificaciones(0);
    showNotification(`✅ ${notificacionesNoLeidas.length} notificaciones marcadas como leídas`, 'success');
}

// -------------------- ELIMINAR NOTIFICACIÓN --------------------
function eliminarNotificacion(idNotificacion) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
        return;
    }
    
    console.log(`🗑️ Eliminando notificación: ${idNotificacion}`);
    
    // SIMULACIÓN TEMPORAL
    const notificacionItem = document.querySelector(`.notificacion-item[data-id="${idNotificacion}"]`);
    if (notificacionItem) {
        notificacionItem.style.opacity = '0';
        notificacionItem.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            notificacionItem.remove();
            // Recargar para actualizar contadores
            cargarNotificacionesPacientes();
        }, 300);
    }
    
    showNotification('Notificación eliminada', 'success');
}

// -------------------- ACTUALIZAR CONTADOR DE NOTIFICACIONES --------------------
function actualizarContadorNotificaciones(cantidad) {
    // Actualizar badge en el menú
    const menuItem = document.querySelector('.menu-item[data-section="appointments"]');
    let badge = menuItem.querySelector('.notification-badge');
    
    if (cantidad > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            menuItem.appendChild(badge);
        }
        badge.textContent = cantidad;
    } else if (badge) {
        badge.remove();
    }
    
    // Actualizar contador en los controles
    const contador = document.getElementById('notificaciones-contador');
    if (contador) {
        if (cantidad > 0) {
            contador.textContent = cantidad;
            contador.style.display = 'inline-block';
        } else {
            contador.style.display = 'none';
        }
    }
}

// ==================== SISTEMA DE DOCTORES ====================

// -------------------- CARGAR DOCTORES DINÁMICAMENTE --------------------
function cargarDoctores() {
    console.log('Cargando doctores...');
    
    // Mostrar loading en el select
    const doctorSelect = document.getElementById('doctor');
    doctorSelect.innerHTML = '<option value="">Cargando médicos...</option>';
    doctorSelect.disabled = true;

    fetch('DataBase/php/obtenerDoctores.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Respuesta recibida:', data);
            
            if (data.success) {
                // Limpiar y llenar el select
                doctorSelect.innerHTML = '<option value="">Selecciona médico</option>';
                
                if (data.doctores && data.doctores.length > 0) {
                    data.doctores.forEach(doctor => {
                        const option = document.createElement('option');
                        option.value = doctor.id;
                        option.textContent = `${doctor.nombre} (${doctor.email})`;
                        doctorSelect.appendChild(option);
                    });
                    console.log(`✅ ${data.doctores.length} médicos cargados`);
                } else {
                    doctorSelect.innerHTML = '<option value="">No hay médicos disponibles</option>';
                    console.warn('⚠️ No se encontraron médicos');
                }
            } else {
                doctorSelect.innerHTML = '<option value="">Error al cargar médicos</option>';
                console.error('❌ Error:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error al cargar doctores:', error);
            doctorSelect.innerHTML = '<option value="">Error de conexión</option>';
        })
        .finally(() => {
            doctorSelect.disabled = false;
        });
}

// -------------------- MANEJO DEL FORMULARIO DINÁMICO --------------------
document.getElementById('appointment-type').addEventListener('change', function() {
    const specialtyGroup = document.getElementById('specialty').closest('.form-group');
    const doctorGroup = document.getElementById('doctor').closest('.form-group');
    
    if (this.value === 'specialist') {
        // Mostrar campos de especialista
        specialtyGroup.style.display = 'block';
        doctorGroup.style.display = 'block';
        
        // Cargar doctores automáticamente
        cargarDoctores();
    } else {
        // Ocultar campos de especialista
        specialtyGroup.style.display = 'none';
        doctorGroup.style.display = 'none';
    }
});

// Cargar doctores también cuando se hace clic en el menú de agendar cita
document.querySelector('.menu-item[data-section="schedule"]').addEventListener('click', function() {
    setTimeout(() => {
        const appointmentType = document.getElementById('appointment-type');
        if (appointmentType.value === 'specialist') {
            cargarDoctores();
        }
    }, 300);
});

// ==================== UTILIDADES Y FUNCIONES GLOBALES ====================

// -------------------- UTILIDADES --------------------
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function formatTime(timeString) {
    return timeString.replace(':00', '');
}

// -------------------- NOTIFICACIONES DEL SISTEMA --------------------
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema TeleMed inicializado');
    
    // Configurar fecha mínima para el datepicker (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').min = today;
    
    // Configurar evento para el menú de notificaciones
    const notificacionesMenu = document.querySelector('.menu-item[data-section="appointments"]');
    if (notificacionesMenu) {
        notificacionesMenu.addEventListener('click', function() {
            setTimeout(cargarNotificacionesPacientes, 100);
        });
    }
    
    // Cargar notificaciones si estamos en esa sección al iniciar
    if (document.getElementById('appointments').classList.contains('active')) {
        setTimeout(cargarNotificacionesPacientes, 500);
    }
    
    // Cargar doctores si estamos en agendar cita
    if (document.getElementById('schedule').classList.contains('active')) {
        const appointmentType = document.getElementById('appointment-type');
        if (appointmentType.value === 'specialist') {
            cargarDoctores();
        }
    }
});

console.log('✅ index.js cargado correctamente');
=======
// -------------------- PERFIL --------------------
document.getElementById('profile-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Perfil actualizado con éxito.');
});

// -------------------- CERRAR SESIÓN --------------------
document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Evitar que el evento se propague a otros listeners
    
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        // Limpiar almacenamiento local
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirección al login - AJUSTA ESTA RUTA SEGÚN TU ESTRUCTURA
        window.location.href = "http://localhost/Telemedicina/login.html";
        // Si login.html está en la misma carpeta que index.html, usa: "login.html"
        // Si está en la carpeta padre, usa: "../login.html"
        // Si está dos niveles arriba, usa: "../../login.html"
    }
});

>>>>>>> origin/master
