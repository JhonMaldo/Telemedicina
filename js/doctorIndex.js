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
        'patients': 'Mis Pacientes',
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
            }
        });
    });
});

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
        
        // RUTA CORREGIDA - mismo directorio
        const response = await fetch('DataBase/php/listaPacientes.php');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Respuesta cruda:', text);
        
        const pacientes = JSON.parse(text);
        console.log('Pacientes cargados:', pacientes);

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

    } catch (error) {
        console.error('Error cargando lista de pacientes:', error);
        recordsSidebar.innerHTML = '<h3>Pacientes</h3><p class="error">Error al cargar pacientes</p>';
        recordsContent.innerHTML = `
            <div class="error-message">
                <h3>Error de conexión</h3>
                <p>No se pudo cargar la lista de pacientes: ${error.message}</p>
                <p>Verifica la consola para más detalles.</p>
            </div>
        `;
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
        console.log('Cargando perfil del paciente ID:', id);
        // RUTA CORREGIDA - mismo directorio
        const response = await fetch(`DataBase/php/perfilPaciente.php?id=${id}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Respuesta cruda perfil:', text);
        
        const data = JSON.parse(text);
        console.log('Datos del paciente:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        // Procesar datos
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
                    <button class="btn btn-success btn-full-width" id="btnActivarEdicion" data-id="${id}">
                        ✏️ Actualizar Expediente
                    </button>
                </div>

                <div class="profile-actions-row">
                    <button class="btn btn-primary">Agendar Nueva Cita</button>
                    <button class="btn btn-secondary">Generar Reporte</button>
                    <button class="btn" onclick="cargarListaPacientes()">← Volver a la Lista</button>
                </div>
            </div>
        `;
         
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

// 5. También agreguemos funcionalidad al botón "Ver Expediente" en otras secciones
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Ver Expediente')) {
        // Navegar a la sección de expedientes
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelector('[data-section="medical-records"]').classList.add('active');
        showSection('medical-records');
        
        // Cargar lista de pacientes
        cargarListaPacientes();
    }
});

// --- ACTUALIZAR EXPEDIENTE ---
document.addEventListener('click', function (e) {
    // Botón para activar edición
    if (e.target.id === 'btnActivarEdicion') {
        const idPaciente = e.target.dataset.id;
        activarModoEdicion(idPaciente);
    }
    
    // Botón para guardar cambios
    if (e.target.id === 'btnGuardarCambios') {
        const idPaciente = e.target.dataset.id;
        guardarCambiosExpediente(idPaciente);
    }
    
    // Botón para cancelar edición
    if (e.target.id === 'btnCancelarEdicion') {
        const idPaciente = document.querySelector('#btnGuardarCambios').dataset.id;
        cancelarEdicion(idPaciente);
    }
});

// Función para activar el modo edición
function activarModoEdicion(idPaciente) {
    const profile = document.querySelector('.patient-profile');
    
    // Reemplazar campos de solo lectura por campos editables
    const basicInfo = profile.querySelector('.patient-basic-info');
    basicInfo.innerHTML = `
        <p><strong>Edad:</strong> ${profile.querySelector('p:nth-child(1)').textContent.replace('Edad:', '').trim()}</p>
        <p><strong>Género:</strong> ${profile.querySelector('p:nth-child(2)').textContent.replace('Género:', '').trim()}</p>
        
        <div class="editable-field">
            <label><strong>Teléfono:</strong></label>
            <input type="text" class="editable-input" id="telefono" value="${profile.querySelector('p:nth-child(3)').textContent.replace('Teléfono:', '').trim() || ''}" placeholder="No registrado">
        </div>
        
        <div class="editable-field">
            <label><strong>Dirección:</strong></label>
            <textarea class="editable-textarea" id="direccion" placeholder="No registrada">${profile.querySelector('p:nth-child(4)').textContent.replace('Dirección:', '').trim() || ''}</textarea>
        </div>
        
        <div class="editable-field">
            <label><strong>Contacto emergencia:</strong></label>
            <input type="text" class="editable-input" id="contacto_emergencia" value="${profile.querySelector('p:nth-child(5)') ? profile.querySelector('p:nth-child(5)').textContent.replace('Contacto emergencia:', '').trim() : ''}" placeholder="No registrado">
        </div>
    `;

    // Hacer editables las otras secciones
    const historialContainer = profile.querySelector('.historial-container');
    const historialOriginal = Array.from(historialContainer.querySelectorAll('.historial-item'))
        .map(item => item.textContent.trim())
        .join('\n\n');
    
    historialContainer.innerHTML = `
        <textarea class="editable-textarea large" id="historial_medico" placeholder="Agregar historial médico...">${historialOriginal}</textarea>
    `;

    const medicacionContainer = profile.querySelector('.medicacion-container');
    const medicacionOriginal = Array.from(medicacionContainer.querySelectorAll('.receta-item'))
        .map(item => item.textContent.trim())
        .join('\n\n');
    
    medicacionContainer.innerHTML = `
        <textarea class="editable-textarea large" id="medicacion" placeholder="Agregar medicación...">${medicacionOriginal}</textarea>
    `;

    const alergiasContainer = profile.querySelector('.allergies-display');
    const alergiasOriginal = alergiasContainer.textContent.trim();
    
    alergiasContainer.innerHTML = `
        <textarea class="editable-textarea" id="alergias" placeholder="Listar alergias...">${alergiasOriginal}</textarea>
    `;

    const citaContainer = profile.querySelector('.appointment-display');
    citaContainer.innerHTML = `
        <div class="editable-field">
            <input type="datetime-local" class="editable-input" id="proxima_cita">
            <input type="text" class="editable-input" id="razon_cita" placeholder="Razón de la cita" style="margin-top: 5px;">
        </div>
    `;

    // Cambiar el botón a "Guardar Cambios"
    const btnContainer = profile.querySelector('.profile-action-update');
    btnContainer.innerHTML = `
        <button class="btn btn-success btn-full-width" id="btnGuardarCambios" data-id="${idPaciente}">
            💾 Guardar Cambios
        </button>
        <button class="btn btn-secondary btn-full-width" id="btnCancelarEdicion">
            ❌ Cancelar
        </button>
    `;
}

// Función para guardar cambios
async function guardarCambiosExpediente(idPaciente) {
    try {
        // Obtener todos los valores editados
        const telefono = document.getElementById('telefono').value;
        const direccion = document.getElementById('direccion').value;
        const contacto_emergencia = document.getElementById('contacto_emergencia').value;
        const historial_medico = document.getElementById('historial_medico').value;
        const medicacion = document.getElementById('medicacion').value;
        const alergias = document.getElementById('alergias').value;

        console.log('Enviando datos al servidor...', {
            id_paciente: idPaciente,
            telefono,
            direccion,
            contacto_emergencia,
            historial_medico,
            medicacion,
            alergias
        });

        // Enviar la actualización
        const updateResponse = await fetch('DataBase/php/actualizarExpediente.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_paciente: parseInt(idPaciente),
                telefono_paciente: telefono,
                direccion: direccion,
                contacto_de_emergencia: contacto_emergencia,
                historial_medico: historial_medico,
                medicacion: medicacion,
                alergias: alergias
            })
        });

        const result = await updateResponse.json();
        console.log('Respuesta del servidor:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        alert('✅ Expediente actualizado correctamente');
        // Volver a vista normal - ESTO ES IMPORTANTE para recargar los datos
        cargarPerfilPaciente(idPaciente);
        
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('❌ Error al actualizar expediente: ' + error.message);
    }
}