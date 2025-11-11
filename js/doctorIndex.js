// Navigation
document.querySelectorAll('.menu-item').forEach(item => {
    if (item.dataset.section) {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            showSection(this.dataset.section);
            
            // Cargar pacientes cuando se accede a expedientes
            if (this.dataset.section === 'medical-records') {
                cargarListaPacientes();
            }
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
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update section title
    const titles = {
        'dashboard': 'Dashboard',
        'consultations': 'Consultas',
        'medical-records': 'Expedientes Médicos',
        'prescriptions': 'Recetas Médicas',
        'notifications': 'Notificaciones'
    };
    
    document.getElementById('section-title').textContent = titles[sectionId] || 'Dashboard';
}

// Notifications - Mark as read
document.querySelectorAll('.notification-item.unread').forEach(item => {
    item.addEventListener('click', function() {
        this.classList.remove('unread');
        
        // Update notification badge
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            let count = parseInt(badge.textContent);
            if (count > 0) {
                count--;
                badge.textContent = count;
                if (count === 0) badge.style.display = 'none';
            }
        });
    });
});

// Botones de citas del dashboard
document.addEventListener('click', function(e) {
    // Botones del dashboard
    if (e.target.classList.contains('btn-success') && e.target.textContent.includes('Iniciar Consulta')) {
        const appointmentItem = e.target.closest('.appointment-item');
        startConsultation(appointmentItem);
    }
    
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Ver Expediente')) {
        const patientName = e.target.closest('.appointment-item').querySelector('h4').textContent;
        viewMedicalRecord(patientName);
    }
    
    // Botones de citas programadas
    if (e.target.classList.contains('btn-success') && e.target.textContent.includes('Confirmar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        confirmAppointment(appointmentItem);
    }
    
    if (e.target.classList.contains('btn-warning') && e.target.textContent.includes('Reagendar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        rescheduleAppointment(appointmentItem);
    }
    
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Cancelar')) {
        const appointmentItem = e.target.closest('.appointment-item');
        cancelAppointment(appointmentItem);
    }
    
    // Botones de pacientes
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Ver Expediente')) {
        const patientItem = e.target.closest('.patient-item');
        viewPatientRecord(patientItem);
    }
    
    if (e.target.classList.contains('btn-success') && e.target.textContent.includes('Agendar Cita')) {
        const patientItem = e.target.closest('.patient-item');
        scheduleAppointmentWithPatient(patientItem);
    }
    
    // Botones de consultas
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Ver Todas')) {
        showSection('appointments');
    }
    
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Nueva Consulta')) {
        scheduleNewConsultation();
    }
    
    // Botones de recetas
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Crear Receta')) {
        createNewPrescription();
    }
});

// Función para iniciar consulta
function startConsultation(appointmentItem) {
    const patientName = appointmentItem.querySelector('h4').textContent;
    const appointmentInfo = appointmentItem.querySelector('p').textContent;
    
    if (confirm(`¿Iniciar consulta con ${patientName}?`)) {
        // Simular inicio de videollamada
        alert(`Iniciando consulta con ${patientName} - ${appointmentInfo}`);
        
        // Cambiar estado del botón
        const startBtn = appointmentItem.querySelector('.btn-success');
        startBtn.textContent = 'Consulta en Curso';
        startBtn.disabled = true;
        startBtn.classList.remove('btn-success');
        
        // Aquí iría la integración real con WebRTC
        console.log('Iniciando videollamada...');
    }
}

function viewMedicalRecord(patientName) {
    alert(`Abriendo expediente de ${patientName}`);
    showSection('medical-records');
    // Aquí se cargaría el expediente específico
}

function confirmAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    
    if (confirm('¿Confirmar esta cita?')) {
        appointmentItem.style.opacity = '0.7';
        const confirmBtn = appointmentItem.querySelector('.btn-success');
        confirmBtn.textContent = 'Confirmada';
        confirmBtn.disabled = true;
        
        alert(`Cita ${appointmentId} confirmada`);
    }
}

function rescheduleAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    const newDate = prompt('Ingrese nueva fecha y hora para la cita:');
    
    if (newDate) {
        alert(`Cita ${appointmentId} reagendada para: ${newDate}`);
        // Aquí iría la lógica real de reagendamiento
    }
}

function cancelAppointment(appointmentItem) {
    const appointmentId = appointmentItem.querySelector('h4').textContent;
    
    if (confirm(`¿Cancelar cita ${appointmentId}?`)) {
        appointmentItem.style.display = 'none';
        alert(`Cita ${appointmentId} cancelada`);
    }
}

function viewPatientRecord(patientItem) {
    const patientName = patientItem.querySelector('h4').textContent;
    alert(`Abriendo expediente de ${patientName}`);
    showSection('medical-records');
}

function scheduleAppointmentWithPatient(patientItem) {
    const patientName = patientItem.querySelector('h4').textContent;
    const date = prompt(`Ingrese fecha y hora para la cita con ${patientName}:`);
    
    if (date) {
        alert(`Cita agendada con ${patientName} para: ${date}`);
    }
}

function scheduleNewConsultation() {
    const patientName = prompt('Nombre del paciente:');
    const date = prompt('Fecha y hora de la consulta:');
    const type = prompt('Tipo de consulta (Presencial/Virtual):');
    
    if (patientName && date && type) {
        alert(`Nueva consulta agendada:\nPaciente: ${patientName}\nFecha: ${date}\nTipo: ${type}`);
    }
}

function createNewPrescription() {
    const patientName = prompt('Nombre del paciente:');
    const medication = prompt('Medicamento:');
    const dosage = prompt('Dosis:');
    const duration = prompt('Duración del tratamiento:');
    
    if (patientName && medication && dosage && duration) {
        alert(`Receta creada para ${patientName}:\n${medication} - ${dosage} durante ${duration}`);
        // Aquí se generaría el PDF de la receta
    }
}

// --- FUNCIONALIDAD DE PERFILES DE PACIENTES ---

// Contenedores principales
const recordsSidebar = document.querySelector('.records-sidebar');
const recordsContent = document.querySelector('.records-content');

// 1. Cargar todo cuando el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Por defecto, mostramos el dashboard
    showSection('dashboard'); 
});

// 2. Función para cargar la LISTA de pacientes
async function cargarListaPacientes() {
    try {
        console.log('Cargando lista de pacientes...');
        recordsSidebar.innerHTML = '<h3>Pacientes</h3><p>Cargando...</p>';
        
        // Simular carga de pacientes
        setTimeout(() => {
            const pacientes = [
                { id_paciente: 1, nombre_completo: 'Juan Pérez', edad: 45, genero: 'M', telefono_paciente: '+57 300 123 4567' },
                { id_paciente: 2, nombre_completo: 'María González', edad: 52, genero: 'F', telefono_paciente: '+57 301 234 5678' },
                { id_paciente: 3, nombre_completo: 'Carlos Rodríguez', edad: 38, genero: 'M', telefono_paciente: '+57 302 345 6789' }
            ];

            // Limpiamos la lista
            recordsSidebar.innerHTML = '<h3>Pacientes</h3>';
            
            if (pacientes.length === 0) {
                recordsSidebar.innerHTML += '<p>No hay pacientes registrados</p>';
                recordsContent.innerHTML = '<div class="loading-message"><p>No hay pacientes disponibles</p></div>';
                return;
            }

            // Creamos un item por cada paciente
            pacientes.forEach(paciente => {
                const item = document.createElement('div');
                item.className = 'record-item';
                item.dataset.patient = paciente.id_paciente; 
                
                item.innerHTML = `
                    <h4>${paciente.nombre_completo}</h4>
                    <p>${paciente.edad} años • ${paciente.genero === 'M' ? '♂' : '♀'}</p>
                    <small>${paciente.telefono_paciente || 'Sin teléfono'}</small>
                `;
                recordsSidebar.appendChild(item);
            });

            // Limpiar el contenido principal
            recordsContent.innerHTML = '<div class="loading-message"><p>Selecciona un paciente para ver su expediente</p></div>';

        }, 1000);

    } catch (error) {
        console.error('Error cargando lista de pacientes:', error);
        recordsSidebar.innerHTML = '<h3>Pacientes</h3><p class="error">Error al cargar pacientes</p>';
    }
}

// 3. Escuchar clics en la barra lateral usando delegación de eventos
recordsSidebar.addEventListener('click', function(e) {
    const clickedItem = e.target.closest('.record-item');
    
    if (!clickedItem) return;

    // Marcar el item como activo
    document.querySelectorAll('.record-item').forEach(i => i.classList.remove('active'));
    clickedItem.classList.add('active');
    
    const patientId = clickedItem.dataset.patient;
    cargarPerfilPaciente(patientId);
});

// 4. Función para cargar el PERFIL de un paciente
async function cargarPerfilPaciente(id) {
    // Mostrar estado de carga
    recordsContent.innerHTML = `
        <div class="loading-message">
            <h3>Cargando expediente...</h3>
            <p>Por favor espera</p>
        </div>
    `;

    try {
        // Simular carga de datos del paciente
        setTimeout(() => {
            const pacienteData = {
                info: {
                    nombre_completo: 'Juan Pérez',
                    fecha_nacimiento: '1978-04-12',
                    genero: 'M',
                    telefono_paciente: '+57 300 123 4567',
                    direccion: 'Calle Luna 123, Cuernavaca, Morelos',
                    contacto_de_emergencia: 'María López - 555-0001'
                },
                historial: [
                    {
                        tipo_registro: 'Alergia',
                        descripcion: 'Alergia conocida a la penicilina',
                        creado_en: '2024-06-15T12:00:00'
                    },
                    {
                        tipo_registro: 'Consulta',
                        descripcion: 'Control cardiológico anual - Estable',
                        creado_en: '2024-01-10T09:30:00'
                    }
                ],
                recetas: [
                    {
                        fecha_emision: '2024-01-10T10:00:00',
                        la_receta: 'Losartán 50 mg: 1 tableta cada 24 horas'
                    }
                ],
                proxima_cita: {
                    fecha_programada: '2024-07-15T09:00:00',
                    razon: 'Control cardiológico de seguimiento',
                    type: 'virtual'
                }
            };

            // Renderizar el perfil completo
            renderPatientProfile(pacienteData, id);
        }, 1000);
         
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        recordsContent.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar el expediente</h3>
                <p>${error.message}</p>
                <button class="btn" onclick="cargarListaPacientes()">Volver a la lista</button>
            </div>
        `;
    }
}

function renderPatientProfile(data, patientId) {
    const info = data.info;
    
    // Formatear historial
    const historialHtml = data.historial && data.historial.length > 0 
        ? data.historial.map(h => 
            `<div class="historial-item">
                <strong>${h.tipo_registro}</strong> - ${new Date(h.creado_en).toLocaleDateString()}
                <p>${h.descripcion}</p>
            </div>`
        ).join('')
        : '<p>Sin historial médico registrado.</p>';

    // Formatear medicación
    const medicacionHtml = data.recetas && data.recetas.length > 0
        ? data.recetas.map(r => 
            `<div class="receta-item">
                <strong>${new Date(r.fecha_emision).toLocaleDateString()}:</strong>
                <p>${r.la_receta}</p>
            </div>`
        ).join('')
        : '<p>Sin medicación activa registrada.</p>';
        
    // Formatear alergias
    const alergias = data.historial ? 
        data.historial.filter(h => h.tipo_registro.toLowerCase() === 'alergia')
            .map(a => a.descripcion) : [];
    const alergiasHtml = alergias.length > 0 ? alergias.join(', ') : 'No se registran alergias conocidas';
        
    // Formatear próxima cita
    let proximaCitaHtml = 'No hay citas programadas';
    if (data.proxima_cita) {
        const fechaCita = new Date(data.proxima_cita.fecha_programada);
        proximaCitaHtml = `
            <strong>${fechaCita.toLocaleDateString()} ${fechaCita.toLocaleTimeString()}</strong><br>
            <em>${data.proxima_cita.razon || 'Sin motivo especificado'}</em><br>
            <small>Tipo: ${data.proxima_cita.type === 'virtual' ? 'Virtual' : 'En persona'}</small>
        `;
    }

    // Renderizar el perfil completo
    recordsContent.innerHTML = `
        <div class="patient-profile">
            <div class="profile-header">
                <h3>Expediente Médico - ${info.nombre_completo}</h3>
                <div class="patient-basic-info">
                    <p><strong>Edad:</strong> ${calcularEdad(info.fecha_nacimiento)} años</p>
                    <p><strong>Género:</strong> ${info.genero === 'M' ? 'Masculino' : 'Femenino'}</p>
                    <p><strong>Teléfono:</strong> ${info.telefono_paciente || 'No registrado'}</p>
                    <p><strong>Dirección:</strong> ${info.direccion || 'No registrada'}</p>
                    ${info.contacto_de_emergencia ? `<p><strong>Contacto emergencia:</strong> ${info.contacto_de_emergencia}</p>` : ''}
                </div>
            </div>

            <div class="profile-sections">
                <div class="form-section">
                    <label>Historial Médico</label>
                    <div class="historial-container">
                        ${historialHtml}
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Medicación Actual y Recetas</label>
                    <div class="medicacion-container">
                        ${medicacionHtml}
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Alergias Conocidas</label>
                    <div class="allergies-display">
                        ${alergiasHtml}
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Próxima Cita Programada</label>
                    <div class="appointment-display">
                        ${proximaCitaHtml}
                    </div>
                </div>
            </div>
            
            <div class="profile-action-update">
                <button class="btn btn-success btn-full-width" id="btnActualizar" data-id="${patientId}">
                    Actualizar Expediente
                </button>
            </div>

            <div class="profile-actions-row">
                <button class="btn btn-primary" onclick="agendarCitaRapida('${info.nombre_completo}')">Agendar Nueva Cita</button>
                <button class="btn btn-secondary" onclick="generarReportePaciente(${patientId})">Generar Reporte</button>
                <button class="btn" onclick="cargarListaPacientes()">Volver a la Lista</button>
            </div>
        </div>
    `;
    
    // Configurar el botón de actualizar
    document.getElementById('btnActualizar').addEventListener('click', function() {
        updateMedicalRecord(patientId);
    });
}

function agendarCitaRapida(nombrePaciente) {
    const fecha = prompt(`Agendar cita para ${nombrePaciente}:\nIngrese fecha y hora:`);
    if (fecha) {
        alert(`Cita agendada para ${nombrePaciente} el ${fecha}`);
    }
}

function generarReportePaciente(patientId) {
    alert(`Generando reporte del paciente ID: ${patientId}`);
    // Aquí iría la generación real del reporte PDF
}

async function updateMedicalRecord(patientId) {
    // Aquí se obtendrían los valores actualizados de los campos
    const historial = prompt('Actualizar historial médico:');
    
    if (historial) {
        // Simular actualización
        setTimeout(() => {
            alert('Expediente actualizado exitosamente');
            cargarPerfilPaciente(patientId); // Recargar
        }, 500);
    }
}

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'N/A';
    
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}