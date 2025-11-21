// Navigation
async function cargarDatosDoctor() {
    const idDoctor = 101; // <-- tu ID fijo

    try {
        const response = await fetch(
            `/Telemedicina/DataBase/php/obtenerDoctor.php?id_doctor=${idDoctor}`
        );

        const doctor = await response.json();

        if (!doctor || doctor.error) {
            console.error("Error obteniendo doctor:", doctor.error);
            return;
        }

        // Llenar Sidebar
        document.getElementById("sidebar-doctor-nombre").textContent =
            `Bienvenido, Dr. ${doctor.nombre_completo}`;

        // Llenar Header (arriba)
        document.getElementById("header-doctor-nombre").textContent =
            `Dr. ${doctor.nombre_completo}`;

        document.getElementById("header-doctor-especialidad").textContent =
            doctor.especialidad ?? "";
        
    } catch (e) {
        console.error("Error cargando info de doctor:", e);
    }
}

document.addEventListener("DOMContentLoaded", cargarDatosDoctor);
//jhgfd
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

    // --- MODIFICACIÓN ---
    // Cargar datos específicos de la sección
    if (sectionId === 'dashboard') {
        cargarConsultasDashboard(); // Carga las citas del día
    }
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
    
    // --- NUEVO ---
    // Inicializar sistemas principales en segundo plano
    console.log('🚀 Inicializando sistema médico completo...');
    inicializarSistemaRecetas();
    inicializarSistemaPacientes();
    inicializarSistemaConsultas(); // Asegurarse de que se inicialice
    
    // Carga inicial de notificaciones
    setTimeout(cargarNotificaciones, 1000);
});

// 2. Función para cargar la LISTA de pacientes - LIMPIA
async function cargarListaPacientes() {
    try {
        console.log('🔄 Cargando lista de pacientes...');
        recordsSidebar.innerHTML = '<h3>Pacientes</h3><p>Cargando...</p>';
        
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        const response = await fetch('DataBase/php/listaPacientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        const pacientes = JSON.parse(text);

        recordsSidebar.innerHTML = '<h3>Pacientes</h3>';
        
        if (pacientes.length === 0) {
            recordsSidebar.innerHTML += '<p>No hay pacientes registrados</p>';
            recordsContent.innerHTML = '<div class="loading-message"><p>No hay pacientes disponibles</p></div>';
            return;
        }

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

        recordsContent.innerHTML = '<div class="loading-message"><p>Selecciona un paciente para ver su expediente</p></div>';

    } catch (error) {
        console.error('❌ Error cargando lista de pacientes:', error);
        recordsSidebar.innerHTML = '<h3>Pacientes</h3><p class="error">Error al cargar pacientes</p>';
        recordsContent.innerHTML = `
            <div class="error-message">
                <h3>Error de conexión</h3>
                <p>${error.message}</p>
                <button class="btn" onclick="cargarListaPacientes()">Reintentar</button>
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

// 4. Función para cargar el PERFIL de un paciente - CORREGIDA
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
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario. Por favor, inicie sesión nuevamente.');
        }

        console.log('👤 Usuario logueado:', userData);
        console.log('🔑 ID de usuario:', userData.id);

        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario como parámetro ⬇️⬇️⬇️
        const response = await fetch(`DataBase/php/perfilPaciente.php?id=${id}&id_usuario=${userData.id}`);
        
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

// Función para guardar cambios - MODIFICADA
async function guardarCambiosExpediente(idPaciente) {
    try {
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario. Por favor, inicie sesión nuevamente.');
        }

        // Obtener todos los valores editados
        const telefono = document.getElementById('telefono').value;
        const direccion = document.getElementById('direccion').value;
        const contacto_emergencia = document.getElementById('contacto_emergencia').value;
        const historial_medico = document.getElementById('historial_medico').value;
        const medicacion = document.getElementById('medicacion').value;
        const alergias = document.getElementById('alergias').value;

        console.log('Enviando datos al servidor...', {
            id_paciente: idPaciente,
            id_usuario: userData.id, // ⬅️ NUEVO
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
                id_usuario: userData.id, // ⬅️ NUEVO: Enviar ID del usuario
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

// --- SISTEMA DE RECETAS VIRTUALES EN PDF ---

// Variables globales para recetas
let pacienteSeleccionadoReceta = null;
let recetaActual = null;

// Inicializar sistema de recetas - VERSIÓN MÁS SEGURA
function inicializarSistemaRecetas() {
    console.log('🔧 Inicializando sistema de recetas...');
    
    // Verificar que los elementos necesarios existen
    const elementosRequeridos = [
        'btnNuevaReceta', 'btnCancelarReceta', 'btnGuardarReceta',
        'btnGenerarReceta', 'btnDescargarReceta', 'btnEditarReceta',
        'select-paciente', 'lista-pacientes-recetas'
    ];
    
    const elementosFaltantes = elementosRequeridos.filter(id => !document.getElementById(id));
    
    if (elementosFaltantes.length > 0) {
        console.warn('⚠️ Elementos faltantes en el HTML:', elementosFaltantes);
    }
    
    // Cargar pacientes para recetas cuando se accede a la sección
    const prescriptionsSection = document.querySelector('[data-section="prescriptions"]');
    if (prescriptionsSection) {
        prescriptionsSection.addEventListener('click', function() {
            console.log('📋 Accediendo a sección de recetas');
            cargarPacientesParaRecetas();
            cargarRecetasExistentes();
            
            // POR DEFECTO: Mostrar lista de recetas al entrar - CON VERIFICACIÓN
            const formularioReceta = document.getElementById('formulario-receta');
            const vistaPreviaReceta = document.getElementById('vista-previa-receta');
            const listaRecetas = document.getElementById('lista-recetas');
            
            if (formularioReceta) formularioReceta.style.display = 'none';
            if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'none';
            if (listaRecetas) listaRecetas.style.display = 'block';
        });
    }
    
    // Event listeners para botones de recetas (con verificación)
    const botones = {
        'btnNuevaReceta': mostrarFormularioReceta,
        'btnCancelarReceta': cancelarReceta,
        'btnGuardarReceta': guardarReceta,
        'btnGenerarReceta': generarVistaPrevia,
        'btnDescargarReceta': descargarRecetaPDF,
        'btnEditarReceta': editarReceta
    };
    
    Object.entries(botones).forEach(([id, funcion]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('click', funcion);
        } else {
            console.warn(`⚠️ Botón ${id} no encontrado`);
        }
    });
    
    console.log('✅ Sistema de recetas inicializado');
}

// 1. Cargar pacientes para el sistema de recetas - VERSIÓN CORREGIDA
async function cargarPacientesParaRecetas() {
    try {
        console.log('🔄 Cargando pacientes para recetas...');
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario al servidor ⬇️⬇️⬇️
        const response = await fetch('DataBase/php/listaPacientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const pacientes = await response.json();
        
        const selectPaciente = document.getElementById('select-paciente');
        const listaPacientes = document.getElementById('lista-pacientes-recetas');
        
        // VERIFICAR QUE LOS ELEMENTOS EXISTEN ANTES DE USARLOS
        if (!selectPaciente || !listaPacientes) {
            console.warn('⚠️ Elementos del DOM no encontrados. El HTML podría haber cambiado.');
            return;
        }
        
        // Limpiar listas
        selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>';
        listaPacientes.innerHTML = '';
        
        if (pacientes.length === 0) {
            listaPacientes.innerHTML = '<p>No hay pacientes registrados</p>';
            return;
        }
        
        // Llenar select y lista mini
        pacientes.forEach(paciente => {
            // Option para select
            const option = document.createElement('option');
            option.value = paciente.id_paciente;
            option.textContent = `${paciente.nombre_completo} - ${paciente.edad} años`;
            selectPaciente.appendChild(option);
            
            // Item para lista mini
            const item = document.createElement('div');
            item.className = 'patient-item-mini';
            item.dataset.patientId = paciente.id_paciente;
            item.innerHTML = `
                <h5>${paciente.nombre_completo}</h5>
                <p>${paciente.edad} años • ${paciente.telefono_paciente || 'Sin teléfono'}</p>
            `;
            listaPacientes.appendChild(item);
            
            // Event listener para items de lista mini
            item.addEventListener('click', function() {
                document.querySelectorAll('.patient-item-mini').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // SOLO seleccionar paciente, NO mostrar formulario automáticamente
                seleccionarPacienteReceta(paciente.id_paciente, paciente.nombre_completo);
                
                // Cargar las recetas de este paciente específico
                cargarRecetasExistentes(paciente.id_paciente);
            });
        });
        
        // Event listener para el select
        selectPaciente.addEventListener('change', function() {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                const nombrePaciente = selectedOption.text.split(' - ')[0];
                seleccionarPacienteReceta(this.value, nombrePaciente);
                
                // Marcar como activo en la lista mini
                document.querySelectorAll('.patient-item-mini').forEach(item => {
                    if (item.dataset.patientId === this.value) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                // NO cambiar la vista automáticamente - solo cargar recetas de ese paciente
                cargarRecetasExistentes(this.value);
                
            } else {
                // Si se selecciona "Seleccione un paciente", mostrar todas las recetas
                mostrarTodasLasRecetas();
            }
        });

    } catch (error) {
        console.error('❌ Error cargando pacientes para recetas:', error);
        // Mostrar error en la interfaz si los elementos existen
        const listaPacientes = document.getElementById('lista-pacientes-recetas');
        if (listaPacientes) {
            listaPacientes.innerHTML = '<p class="error">Error al cargar pacientes</p>';
        }
    }
}

// 2. Seleccionar paciente para receta - VERSIÓN FINAL CORREGIDA
function seleccionarPacienteReceta(idPaciente, nombrePaciente) {
    pacienteSeleccionadoReceta = { 
        id: idPaciente, 
        nombre: nombrePaciente 
    };
    
    // Actualizar select - CON VERIFICACIÓN
    const selectPaciente = document.getElementById('select-paciente');
    const tituloFormulario = document.getElementById('titulo-formulario-receta');
    const btnGenerar = document.getElementById('btnGenerarReceta');
    
    if (selectPaciente) selectPaciente.value = idPaciente;
    if (tituloFormulario) tituloFormulario.textContent = `Nueva Receta para ${nombrePaciente}`;
    if (btnGenerar) btnGenerar.disabled = false;
    
    console.log(`👤 Paciente seleccionado para receta: ${nombrePaciente} (ID: ${idPaciente})`);
}

// 3. Mostrar formulario de receta - VERSIÓN CORREGIDA
function mostrarFormularioReceta() {
    const formularioReceta = document.getElementById('formulario-receta');
    const vistaPreviaReceta = document.getElementById('vista-previa-receta');
    const listaRecetas = document.getElementById('lista-recetas');
    
    if (formularioReceta) formularioReceta.style.display = 'block';
    if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'none';
    if (listaRecetas) listaRecetas.style.display = 'none';
    
    // Limpiar formulario
    document.getElementById('medicamentos').value = '';
    document.getElementById('instrucciones').value = '';
    document.getElementById('validez-receta').value = '30';
    pacienteSeleccionadoReceta = null;
    
    // Resetear selección
    const selectPaciente = document.getElementById('select-paciente');
    if (selectPaciente) selectPaciente.value = '';
    
    document.querySelectorAll('.patient-item-mini').forEach(item => item.classList.remove('active'));
    
    // Cargar pacientes si no están cargados
    if (selectPaciente && selectPaciente.options.length <= 1) {
        cargarPacientesParaRecetas();
    }
}

// 4. Cancelar receta - VERSIÓN CORREGIDA
function cancelarReceta() {
    const formularioReceta = document.getElementById('formulario-receta');
    const vistaPreviaReceta = document.getElementById('vista-previa-receta');
    const listaRecetas = document.getElementById('lista-recetas');
    
    if (formularioReceta) formularioReceta.style.display = 'none';
    if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'none';
    if (listaRecetas) listaRecetas.style.display = 'block';
    
    pacienteSeleccionadoReceta = null;
    recetaActual = null;
}

// ===== NUEVA FUNCIÓN AUXILIAR =====
/**
 * Lee los datos del formulario de receta y devuelve un objeto.
 * Realiza validaciones básicas.
 * @returns {object|null} Objeto con datos de la receta, or null si falla la validación.
 */
async function buildRecetaDataFromForm() {
    const pacienteId = document.getElementById('select-paciente').value;
    const medicamentos = document.getElementById('medicamentos').value.trim();
    const instrucciones = document.getElementById('instrucciones').value.trim();
    const validez = document.getElementById('validez-receta').value;

    // Validaciones
    if (!pacienteId) {
        alert('❌ Por favor seleccione un paciente');
        return null;
    }
    if (!medicamentos) {
        alert('❌ Por favor ingrese los medicamentos y tratamiento');
        return null;
    }
    if (medicamentos.length < 10 && !instrucciones) {
         alert('❌ La descripción del tratamiento es muy breve. Por favor sea más específico.');
         return null;
    }

    const select = document.getElementById('select-paciente');
    const nombrePaciente = select.options[select.selectedIndex].text.split(' - ')[0];

    // ⬇️⬇️⬇️ NUEVO: Obtener datos del doctor logueado ⬇️⬇️⬇️
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.id) {
        throw new Error('No se encontraron datos de usuario válidos');
    }

    // Obtener información del doctor
    const doctorData = await obtenerDatosDoctor(userData.id);
    
    // Devolver el objeto completo
    return {
        paciente_id: pacienteId,
        paciente_nombre: nombrePaciente,
        medicamentos: medicamentos,
        instrucciones: instrucciones,
        validez_dias: validez,
        fecha_emision: new Date().toISOString().split('T')[0],
        
        // --- DATOS DEL DOCTOR LOGEADO ---
        doctor_id: doctorData.id_doctor,
        doctor_nombre: doctorData.nombre_completo || userData.name,
        doctor_especialidad: doctorData.especialidad || 'Médico',
        doctor_cedula: doctorData.numero_licencia || 'N/A',
        consultorio: 'Centro Médico TeleMed',
        direccion_consultorio: 'Av. Principal #123, Ciudad'
    };
}

//funcion para obtner datos del doctor
async function obtenerDatosDoctor(idDoctor) {
    const url = `/Telemedicina/DataBase/php/obtenerDoctor.php?id_doctor=${idDoctor}`;
    const response = await fetch(url);
    return await response.json();
}


// FUNCIÓN QUE FALTA - Agregar esto ANTES de generarVistaPrevia
function generarHTMLVistaPrevia(receta) {
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(receta.validez_dias));
    
    return `
        <div class="receta-preview-content">
            <div class="receta-header">
                <h2>${receta.consultorio}</h2>
                <p class="subtitle">Sistema de Telemedicina - Receta Digital</p>
            </div>
            
            <hr class="separator">
            
            <div class="receta-section">
                <h3>INFORMACIÓN DEL PACIENTE</h3>
                <div class="patient-info">
                    <p><strong>Nombre:</strong> ${receta.paciente_nombre}</p>
                    <p><strong>Fecha de emisión:</strong> ${receta.fecha_emision}</p>
                    <p><strong>Válida hasta:</strong> ${fechaVencimiento.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                </div>
            </div>
            
            <div class="receta-section">
                <h3>TRATAMIENTO PRESCRITO</h3>
                <div class="treatment-content">
                    ${receta.medicamentos.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            ${receta.instrucciones ? `
            <div class="receta-section">
                <h3>INSTRUCCIONES ESPECIALES</h3>
                <div class="instructions-content">
                    ${receta.instrucciones.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
            
            <hr class="separator">
            
            <div class="receta-footer">
                <h3>MÉDICO TRATANTE</h3>
                <div class="doctor-info">
                    <p><strong>${receta.doctor_nombre}</strong></p>
                    <p>${receta.doctor_especialidad}</p>
                    <p><small>Cédula Profesional: ${receta.doctor_cedula}</small></p>
                </div>
            </div>
            
            <div class="receta-notes">
                <p><small>Nota: Esta receta es válida por ${receta.validez_dias} días a partir de la fecha de emisión.</small></p>
                <p><small>Documento generado electrónicamente - Firma digital del médico</small></p>
            </div>
        </div>
        
        <div class="preview-alert">
            <p>✅ <strong>Vista previa</strong> - Al descargar se generará un archivo PDF profesional</p>
        </div>
    `;
}


// 5. Generar vista previa de receta (VERSIÓN CORREGIDA Y REFACTORIZADA)
async function generarVistaPrevia() {
    try {
        // ⬇️⬇️⬇️ MODIFICADO: Usar función async ⬇️⬇️⬇️
        recetaActual = await buildRecetaDataFromForm();
        
        if (!recetaActual) {
            return; // La validación falló y ya mostró alerta
        }

        console.log('✅ recetaActual creado:', recetaActual);
        
        // Mostrar loading
        const vistaPrevia = document.querySelector('.receta-preview');
        if (!vistaPrevia) {
            console.error('❌ Elemento .receta-preview no encontrado');
            alert('Error: No se puede mostrar la vista previa');
            return;
        }
        
        vistaPrevia.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #3498db;"></i>
                <p style="margin-top: 15px;">Generando vista previa...</p>
            </div>
        `;
        
        // Pequeño delay para mejor UX
        setTimeout(() => {
            try {
                // Generar vista previa MEJORADA
                vistaPrevia.innerHTML = generarHTMLVistaPrevia(recetaActual);
                
                // Mostrar vista previa - CON VERIFICACIÓN
                const formularioReceta = document.getElementById('formulario-receta');
                const vistaPreviaReceta = document.getElementById('vista-previa-receta');
                const listaRecetas = document.getElementById('lista-recetas');
                
                if (formularioReceta) formularioReceta.style.display = 'none';
                if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'block';
                if (listaRecetas) listaRecetas.style.display = 'none';
                
                console.log('📄 Vista previa generada correctamente');
                
            } catch (error) {
                console.error('❌ Error generando vista previa:', error);
                alert('Error al generar la vista previa: ' + error.message);
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error en generarVistaPrevia:', error);
        alert('Error: ' + error.message);
    }
}

// 6. Descargar receta como PDF (VERSIÓN CON VALIDACIÓN DE TEXTO)
async function descargarRecetaPDF() {
    if (!recetaActual) {
         // --- MODIFICADO ---
        // Si recetaActual es null (ej. no se generó vista previa), intentar construirla desde el form.
        recetaActual = buildRecetaDataFromForm();
        if (!recetaActual) {
             alert('❌ No hay receta para descargar. Completa el formulario.');
            return;
        }
         // --- FIN MODIFICADO ---
    }

    console.log('🔄 Iniciando generación de PDF...');

    // Mostrar loading
    const btnDescargar = document.getElementById('btnDescargarReceta');
    if (!btnDescargar) {
        // Fallback por si se llama desde otro botón
        console.warn('Botón de descarga no encontrado');
    } else {
        var originalText = btnDescargar.innerHTML;
        btnDescargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
        btnDescargar.disabled = true;
    }


    try {
        // VERIFICACIÓN CORRECTA - jspdf.jsPDF es la función constructora
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            throw new Error('La librería jsPDF no está disponible correctamente.');
        }

        console.log('✅ jsPDF disponible, creando instancia...');
        
        // CREAR INSTANCIA CORRECTAMENTE
        const doc = new jspdf.jsPDF();
        console.log('✅ Instancia de jsPDF creada:', doc);
        
        // Configuración
        const margin = 20;
        let yPosition = margin;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const contentWidth = pageWidth - (margin * 2);
        
        // VALIDAR Y LIMPIAR DATOS
        const pacienteNombre = recetaActual.paciente_nombre || 'Paciente no especificado';
        const fechaEmision = recetaActual.fecha_emision || new Date().toISOString().split('T')[0];
        const medicamentos = recetaActual.medicamentos || 'No se especificaron medicamentos';
        const instrucciones = recetaActual.instrucciones || '';
        const validezDias = recetaActual.validez_dias || '30';
        
        // Calcular fecha de vencimiento
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(validezDias));
        
        // --- ENCABEZADO ---
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        
        // ENCABEZADO CON VALIDACIÓN
        const consultorio = recetaActual.consultorio || 'Centro Médico';
        doc.text(consultorio, pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text('Sistema de Telemedicina - Receta Digital', pageWidth / 2, 22, { align: 'center' });
        
        yPosition = 45;
        doc.setTextColor(0, 0, 0);
        
        // --- INFORMACIÓN DEL PACIENTE ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE', margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // TEXTO CON VALIDACIÓN
        doc.text(`Nombre: ${pacienteNombre}`, margin, yPosition);
        yPosition += 5;
        
        doc.text(`Fecha de emisión: ${fechaEmision}`, margin, yPosition);
        yPosition += 5;
        
        doc.text(`Válida hasta: ${fechaVencimiento.toLocaleDateString('es-ES')}`, margin, yPosition);
        yPosition += 12;
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        // --- TRATAMIENTO PRESCRITO ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TRATAMIENTO PRESCRITO', margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // VALIDAR Y LIMPIAR TEXTO DE MEDICAMENTOS
        const medicamentosLimpio = String(medicamentos).trim();
        if (!medicamentosLimpio) {
            doc.text('No se especificaron medicamentos', margin, yPosition);
            yPosition += 10;
        } else {
            // Dividir texto de medicamentos con manejo de errores
            try {
                const medicamentosLines = doc.splitTextToSize(medicamentosLimpio, contentWidth);
                medicamentosLines.forEach(line => {
                    if (yPosition > pageHeight - 50) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    // Validar que la línea no esté vacía
                    if (line && line.trim() !== '') {
                        doc.text(line, margin, yPosition);
                        yPosition += 5;
                    }
                });
            } catch (error) {
                console.warn('Error al dividir texto, usando fallback:', error);
                // Fallback: texto simple
                doc.text('Medicamentos prescritos:', margin, yPosition);
                yPosition += 5;
                doc.text(medicamentosLimpio.substring(0, 100) + '...', margin, yPosition);
                yPosition += 10;
            }
        }
        
        yPosition += 8;
        
        // --- INSTRUCCIONES ESPECIALES ---
        const instruccionesLimpio = String(instrucciones).trim();
        if (instruccionesLimpio && instruccionesLimpio !== '') {
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = margin;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('INSTRUCCIONES ESPECIALES', margin, yPosition);
            
            yPosition += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            try {
                const instruccionesLines = doc.splitTextToSize(instruccionesLimpio, contentWidth);
                instruccionesLines.forEach(line => {
                    if (yPosition > pageHeight - 50) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    if (line && line.trim() !== '') {
                        doc.text(line, margin, yPosition);
                        yPosition += 5;
                    }
                });
            } catch (error) {
                console.warn('Error al dividir instrucciones:', error);
                doc.text(instruccionesLimpio.substring(0, 100) + '...', margin, yPosition);
                yPosition += 10;
            }
            
            yPosition += 8;
        }
        
        // Línea separadora final
        if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
        }
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        // --- INFORMACIÓN DEL MÉDICO ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MÉDICO TRATANTE', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        
        const doctorNombre = recetaActual.doctor_nombre || 'Dr. Médico';
        doc.text(doctorNombre, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const doctorEspecialidad = recetaActual.doctor_especialidad || 'Especialista';
        doc.text(doctorEspecialidad, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        const doctorCedula = recetaActual.doctor_cedula || 'Cédula no especificada';
        doc.text(`Cédula Profesional: ${doctorCedula}`, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.text(consultorio, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        const direccionConsultorio = recetaActual.direccion_consultorio || 'Dirección no especificada';
        doc.text(direccionConsultorio, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;
        
        // --- NOTAS FINALES ---
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Nota: Esta receta es válida por ${validezDias} días a partir de la fecha de emisión.`, 
            pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 4;
        doc.text('Documento generado electrónicamente - Firma digital del médico', 
            pageWidth / 2, yPosition, { align: 'center' });
        
        // Generar nombre del archivo
        const fileName = `Receta_${pacienteNombre.replace(/\s+/g, '_')}_${fechaEmision}.pdf`;
        
        // Descargar el PDF
        doc.save(fileName);
        
        console.log('✅ PDF generado y descargado correctamente');
        alert('✅ Receta descargada en formato PDF correctamente');
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        
        // Mensaje de error más detallado
        let mensajeError = 'Error al generar el PDF:\n\n';
        
        if (error.message.includes('Invalid arguments')) {
            mensajeError += 'Problema con el formato del texto. ';
            mensajeError += 'Verifica que los campos de medicamentos e instrucciones contengan texto válido.';
        } else {
            mensajeError += error.message;
        }
        
        alert(mensajeError);
    } finally {
        // Restaurar botón
        if(btnDescargar) {
            btnDescargar.innerHTML = originalText;
            btnDescargar.disabled = false;
        }
    }
}

// 7. Guardar receta en base de datos - VERSIÓN CORREGIDA
async function guardarReceta() {
    console.log('🔄 Guardando receta...');

    try {
        // ⬇️⬇️⬇️ MODIFICADO: Usar función async para obtener datos ⬇️⬇️⬇️
        recetaActual = await buildRecetaDataFromForm();
        if (!recetaActual) return;

        const btnGuardar = document.getElementById('btnGuardarReceta');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btnGuardar.disabled = true;

        // Construir texto completo de receta
        let textoRecetaCompleta = "TRATAMIENTO PRESCRITO:\n" + recetaActual.medicamentos;

        if (recetaActual.instrucciones.trim() !== "") {
            textoRecetaCompleta += `\n\nINSTRUCCIONES ESPECIALES:\n${recetaActual.instrucciones}`;
        }

        textoRecetaCompleta += `\n\nVÁLIDA POR: ${recetaActual.validez_dias} días`;

        // Datos para guardar en BD
        const datosReceta = {
            id_doctor: recetaActual.doctor_id,
            id_paciente: parseInt(recetaActual.paciente_id),
            id_consulta: null, // Puedes modificar esto si tienes consultas asociadas
            la_receta: textoRecetaCompleta,
            url_pdf: "",
            fecha_emision: recetaActual.fecha_emision
        };

        console.log("📤 Enviando a guardarReceta.php:", datosReceta);

        const response = await fetch('DataBase/php/guardarReceta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosReceta)
        });

        const resultado = await response.json();
        console.log("📥 Respuesta del servidor:", resultado);

        if (!resultado.success) throw new Error(resultado.error);

        alert('✅ Receta guardada exitosamente');

        // Limpiar formulario
        document.getElementById('medicamentos').value = '';
        document.getElementById('instrucciones').value = '';
        document.getElementById('validez-receta').value = '30';
        document.getElementById('select-paciente').value = '';
        
        // Limpiar selección de paciente
        document.querySelectorAll('.patient-item-mini').forEach(item => item.classList.remove('active'));

        recetaActual = null;

        // Recargar lista de recetas
        await cargarRecetasExistentes();

    } catch (error) {
        console.error("❌ Error guardando receta:", error);
        alert("Error: " + error.message);

    } finally {
        const btnGuardar = document.getElementById('btnGuardarReceta');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
            btnGuardar.disabled = false;
        }
    }
}


// 8. Editar receta - VERSIÓN CORREGIDA
function editarReceta() {
    const vistaPreviaReceta = document.getElementById('vista-previa-receta');
    const formularioReceta = document.getElementById('formulario-receta');
    const listaRecetas = document.getElementById('lista-recetas');
    
    if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'none';
    if (formularioReceta) formularioReceta.style.display = 'block';
    if (listaRecetas) listaRecetas.style.display = 'none';
    
    if (recetaActual) {
        document.getElementById('medicamentos').value = recetaActual.medicamentos;
        document.getElementById('instrucciones').value = recetaActual.instrucciones || '';
        document.getElementById('validez-receta').value = recetaActual.validez_dias;
        // --- MODIFICADO ---
        // Asegurarse de seleccionar el paciente correcto
        if(document.getElementById('select-paciente')) {
            document.getElementById('select-paciente').value = recetaActual.paciente_id;
        }
        // --- FIN MODIFICADO ---
    }
}


// 9. Cargar recetas existentes - VERSIÓN CORREGIDA
async function cargarRecetasExistentes(pacienteId = null) {
    try {
        console.log('🔄 Cargando recetas existentes...', pacienteId ? `Para paciente: ${pacienteId}` : 'Todas las recetas');
        
        // VERIFICAR QUE EL BOTÓN EXISTE ANTES DE ACCEDER A SU STYLE
        const btnTodas = document.getElementById('btn-todas-recetas');
        if (btnTodas) {
            if (pacienteId) {
                btnTodas.style.display = 'block';
            } else {
                btnTodas.style.display = 'none';
            }
        } else {
            console.warn('⚠️ Botón btn-todas-recetas no encontrado');
        }
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        let url = 'DataBase/php/obtenerRecetas.php';
        if (pacienteId) {
            url += `?paciente_id=${pacienteId}`;
        }
        
        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario al servidor ⬇️⬇️⬇️
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const recetas = await response.json();
        console.log('📋 Recetas cargadas:', recetas);
        
        const contenedor = document.getElementById('contenedor-recetas');
        const tituloLista = document.getElementById('titulo-lista-recetas');
        
        // VERIFICAR QUE LOS ELEMENTOS EXISTEN
        if (!contenedor) {
            console.error('❌ Elemento contenedor-recetas no encontrado');
            return;
        }
        
        if (!tituloLista) {
            console.warn('⚠️ Elemento titulo-lista-recetas no encontrado');
        }
        
        // Actualizar título según el filtro
        if (pacienteId && pacienteSeleccionadoReceta && tituloLista) {
            tituloLista.textContent = `Recetas de ${pacienteSeleccionadoReceta.nombre}`;
        } else if (tituloLista) {
            tituloLista.textContent = 'Todas las Recetas Recientes';
        }
        
        contenedor.innerHTML = '';
        
        if (!recetas || recetas.length === 0) {
            const mensaje = pacienteId ? 
                'No hay recetas registradas para este paciente' : 
                'No hay recetas registradas';
                
            contenedor.innerHTML = `
                <div class="no-recetas">
                    <i class="fas fa-file-medical" style="font-size: 40px; color: #6c757d; margin-bottom: 10px;"></i>
                    <p>${mensaje}</p>
                    <small>Crea una nueva receta usando el botón "Crear Nueva Receta"</small>
                </div>
            `;
            return;
        }
        
        // Ordenar por fecha más reciente primero
        recetas.sort((a, b) => new Date(b.fecha_emision) - new Date(a.fecha_emision));
        
        recetas.forEach((receta, index) => {
            const item = document.createElement('div');
            item.className = 'receta-item';
            item.style.animationDelay = `${index * 0.1}s`;
            
            // Formatear fecha
            const fecha = new Date(receta.fecha_emision);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Extraer preview del contenido
            let preview = 'Receta médica';
            if (receta.la_receta) {
                const lineas = receta.la_receta.split('\n');
                preview = lineas.find(line => line.trim().length > 0 && !line.startsWith('TRATAMIENTO PRESCRITO:')) || 'Receta médica';
                if (preview.length > 80) {
                    preview = preview.substring(0, 80) + '...';
                }
            }
            
            item.innerHTML = `
                <div class="receta-header">
                    <div class="receta-paciente">
                        <i class="fas fa-user"></i> ${receta.paciente_nombre || 'Paciente'}
                    </div>
                    <div class="receta-fecha">
                        <i class="far fa-calendar"></i> ${fechaFormateada}
                    </div>
                </div>
                <div class="receta-contenido">
                    ${preview}
                </div>
                <div class="receta-actions">
                    <button class="btn btn-sm btn-info" onclick="verRecetaCompleta(${receta.id_receta_medica})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-success" onclick="descargarRecetaExistente(${receta.id_receta_medica})">
                        <i class="fas fa-download"></i> PDF
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="reutilizarReceta(${receta.id_receta_medica})">
                        <i class="fas fa-copy"></i> Reutilizar
                    </button>
                </div>
            `;
            contenedor.appendChild(item);
        });
        
        console.log(`✅ ${recetas.length} recetas mostradas en la lista`);
        
    } catch (error) {
        console.error('❌ Error cargando recetas existentes:', error);
        const contenedor = document.getElementById('contenedor-recetas');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar recetas</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-sm" onclick="cargarRecetasExistentes(${pacienteId ? pacienteId : ''})">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// 10. Ver receta completa
async function verRecetaCompleta(idReceta) {
    try {
        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const receta = await response.json();
        
        if (receta.error) {
            throw new Error(receta.error);
        }
        
        if (receta) {
            // --- MODIFICADO ---
            // Ya no partimos la receta aquí. Tu PHP 'obtenerReceta.php'
            // ya devuelve 'medicamentos', 'instrucciones' y 'validez_dias'
            // como campos separados en el JSON.
            
            // Asignamos directamente los campos que devuelve el PHP
            recetaActual = {
                ...receta, // Trae id_receta_medica, paciente_nombre, doctor_nombre, etc.
                medicamentos: receta.medicamentos || '', // Campo del PHP
                instrucciones: receta.instrucciones || '', // Campo del PHP
                validez_dias: receta.validez_dias || 30, // Campo del PHP
                
                // Info para la VISTA PREVIA (ya viene de tu PHP)
                doctor_nombre: receta.doctor_nombre || 'Dr. Médico',
                doctor_especialidad: receta.doctor_especialidad || 'Especialista',
                doctor_cedula: receta.doctor_cedula || 'N/A',
                consultorio: 'Centro Médico TeleMed', // Puedes añadir esto al PHP si quieres
                direccion_consultorio: 'Av. Principal #123, Ciudad' // Puedes añadir esto al PHP
            };
            // --- FIN MODIFICADO ---

            const vistaPrevia = document.querySelector('.receta-preview');
            if (vistaPrevia) {
                vistaPrevia.innerHTML = generarHTMLVistaPrevia(recetaActual);
            }
            
            // CON VERIFICACIÓN
            const formularioReceta = document.getElementById('formulario-receta');
            const vistaPreviaReceta = document.getElementById('vista-previa-receta');
            const listaRecetas = document.getElementById('lista-recetas');
            
            if (formularioReceta) formularioReceta.style.display = 'none';
            if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'block';
            if (listaRecetas) listaRecetas.style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando receta:', error);
        alert('Error al cargar la receta: ' + error.message);
    }
}

// 11. Descargar receta existente
async function descargarRecetaExistente(idReceta) {
    try {
        const btnDescargar = event.target.closest('button'); // Asegurarse de obtener el botón
        const originalText = btnDescargar.innerHTML;
        btnDescargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btnDescargar.disabled = true;

        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const receta = await response.json();
        
        if (receta.error) {
            throw new Error(receta.error);
        }
        
        if (receta) {
             // --- MODIFICADO (Igual que en verRecetaCompleta) ---
            // Tu PHP ya devuelve los campos separados
            recetaActual = {
                ...receta,
                medicamentos: receta.medicamentos || '',
                instrucciones: receta.instrucciones || '',
                validez_dias: receta.validez_dias || 30, 
                doctor_nombre: receta.doctor_nombre || 'Dr. Médico',
                doctor_especialidad: receta.doctor_especialidad || 'Especialista',
                doctor_cedula: receta.doctor_cedula || 'N/A',
                consultorio: 'Centro Médico TeleMed',
                direccion_consultorio: 'Av. Principal #123, Ciudad'
            };
            // --- FIN MODIFICADO ---
            
            await descargarRecetaPDF();
        }
    } catch (error) {
        console.error('Error descargando receta:', error);
        alert('Error al descargar la receta: ' + error.message);
    } finally {
        // Restaurar botón
        const btnDescargar = event.target.closest('button');
        if (btnDescargar) {
            btnDescargar.innerHTML = '<i class="fas fa-download"></i> PDF'; // Texto original del botón
            btnDescargar.disabled = false;
        }
    }
}

// 12. Reutilizar receta existente (NUEVA FUNCIÓN)
async function reutilizarReceta(idReceta) {
    try {
        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        const receta = await response.json();
        
        if (receta) {
            // --- MODIFICADO (Igual que en verRecetaCompleta) ---
            // Usar los campos que ya procesó el PHP
            const medicamentos = receta.medicamentos || '';
            const instrucciones = receta.instrucciones || '';
            // --- FIN MODIFICADO ---

            // Llenar el formulario con los datos de la receta existente
            document.getElementById('medicamentos').value = medicamentos;
            document.getElementById('instrucciones').value = instrucciones;
            document.getElementById('validez-receta').value = receta.validez_dias || 30;
            
            // --- NUEVO ---
            // Seleccionar al paciente
            const selectPaciente = document.getElementById('select-paciente');
            if(selectPaciente) {
                selectPaciente.value = receta.id_paciente;
                // Si el paciente no está en la lista (raro), cargarlos
                if (selectPaciente.value !== receta.id_paciente) {
                    await cargarPacientesParaRecetas();
                    selectPaciente.value = receta.id_paciente;
                }
            }
            seleccionarPacienteReceta(receta.id_paciente, receta.paciente_nombre);
            // --- FIN NUEVO ---

            // Mostrar formulario - CON VERIFICACIÓN
            const listaRecetas = document.getElementById('lista-recetas');
            const vistaPreviaReceta = document.getElementById('vista-previa-receta');
            const formularioReceta = document.getElementById('formulario-receta');
            
            if (listaRecetas) listaRecetas.style.display = 'none';
            if (vistaPreviaReceta) vistaPreviaReceta.style.display = 'none';
            if (formularioReceta) formularioReceta.style.display = 'block';
            
            alert('📝 Formulario cargado con receta existente. Modifica y guarda como nueva.');
        }
    } catch (error) {
        console.error('Error reutilizando receta:', error);
        alert('Error al cargar la receta: ' + error.message);
    }
}

// 13. Función para mostrar todas las recetas - VERSIÓN CORREGIDA
function mostrarTodasLasRecetas() {
    pacienteSeleccionadoReceta = null;
    
    // Resetear selecciones
    const selectPaciente = document.getElementById('select-paciente');
    if (selectPaciente) {
        selectPaciente.value = '';
    }
    
    document.querySelectorAll('.patient-item-mini').forEach(item => item.classList.remove('active'));
    
    // Cargar todas las recetas
    cargarRecetasExistentes();
    
    console.log('📋 Mostrando todas las recetas');
}

// Función para diagnosticar problemas con los datos de la receta
function diagnosticarRecetaActual() {
    console.log('🔍 Diagnóstico de recetaActual:', {
        existe: !!recetaActual,
        paciente_nombre: recetaActual?.paciente_nombre,
        paciente_nombre_tipo: typeof recetaActual?.paciente_nombre,
        medicamentos: recetaActual?.medicamentos?.substring(0, 50) + '...',
        medicamentos_tipo: typeof recetaActual?.medicamentos,
        instrucciones: recetaActual?.instrucciones?.substring(0, 50) + '...',
        instrucciones_tipo: typeof recetaActual?.instrucciones,
        recetaCompleta: recetaActual
    });
}

// Llama a esta función antes de generar el PDF para ver qué datos tienes
// Ya no es tan necesario aquí, se puede llamar en las funciones de descarga/guardado si falla
// diagnosticarRecetaActual(); 

// ===== SISTEMA COMPLETO DE GESTIÓN DE PACIENTES - CORREGIDO =====

// Variables globales
let pacienteSeleccionado = null;
let todosLosPacientes = [];

// Inicializar sistema de pacientes
function inicializarSistemaPacientes() {
    console.log('🔄 Inicializando sistema de pacientes...');
    
    const patientsSection = document.querySelector('[data-section="patients"]');
    if (patientsSection) {
        patientsSection.addEventListener('click', function() {
            console.log('📋 Accediendo a sección de pacientes');
            cargarListaPacientesCompleta();
        });
    }
    
    // Event listener para búsqueda
    const searchInput = document.getElementById('search-patient');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filtrarPacientes(e.target.value.toLowerCase());
        });
    }
    
    // Event listener para nuevo paciente
    const btnNuevoPaciente = document.getElementById('btn-nuevo-paciente');
    if (btnNuevoPaciente) {
        btnNuevoPaciente.addEventListener('click', function() {
            alert('👥 Funcionalidad de nuevo paciente - Próximamente');
        });
    }
}

// Cargar lista completa de pacientes - CORREGIDA
async function cargarListaPacientesCompleta() {
    try {
        console.log('🔄 Cargando lista completa de pacientes...');
        const listaPacientes = document.getElementById('lista-pacientes-completa');
        
        if (!listaPacientes) {
            console.error('❌ Elemento lista-pacientes-completa no encontrado');
            return;
        }
        
        // Mostrar loading
        listaPacientes.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando lista de pacientes...</p>
            </div>
        `;
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        console.log('👤 Usuario logueado:', userData.id);
        
        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario al servidor ⬇️⬇️⬇️
        const response = await fetch('DataBase/php/listaPacientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const pacientes = await response.json();
        todosLosPacientes = pacientes; // Guardar para filtrado
        
        console.log(`✅ ${pacientes.length} pacientes cargados`);
        
        // Actualizar contador
        const contador = document.getElementById('contador-pacientes');
        if (contador) {
            contador.textContent = pacientes.length;
        }
        
        // Renderizar lista
        renderizarListaPacientes(pacientes);
        
    } catch (error) {
        console.error('❌ Error cargando lista de pacientes:', error);
        const listaPacientes = document.getElementById('lista-pacientes-completa');
        if (listaPacientes) {
            listaPacientes.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar pacientes</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-sm" onclick="cargarListaPacientesCompleta()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Renderizar lista de pacientes
function renderizarListaPacientes(pacientes) {
    const listaPacientes = document.getElementById('lista-pacientes-completa');
    
    if (!listaPacientes) return;
    
    if (pacientes.length === 0) {
        listaPacientes.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <p>No hay pacientes registrados</p>
                <small>Usa el botón "Nuevo Paciente" para agregar uno</small>
            </div>
        `;
        return;
    }
    
    listaPacientes.innerHTML = '';
    
    pacientes.forEach(paciente => {
        const item = document.createElement('div');
        item.className = 'patient-item-full';
        item.dataset.patientId = paciente.id_paciente;
        
        item.innerHTML = `
            <div class="patient-item-content">
                <div class="patient-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="patient-info-compact">
                    <h4>${paciente.nombre_completo}</h4>
                    <div class="patient-details-compact">
                        <span class="patient-age">${paciente.edad} años</span>
                        <span class="patient-gender">${paciente.genero === 'M' ? '♂ Masculino' : '♀ Femenino'}</span>
                        <span class="patient-phone">${paciente.telefono_paciente || 'Sin teléfono'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Event listener para seleccionar paciente
        item.addEventListener('click', function() {
            seleccionarPacienteEnLista(paciente.id_paciente);
            mostrarDetallesPaciente(paciente.id_paciente);
        });
        
        listaPacientes.appendChild(item);
    });
}

// Seleccionar paciente en la lista
function seleccionarPacienteEnLista(idPaciente) {
    const items = document.querySelectorAll('.patient-item-full');
    items.forEach(item => {
        if (item.dataset.patientId === idPaciente.toString()) {
            item.classList.add('active');
            pacienteSeleccionado = idPaciente;
        } else {
            item.classList.remove('active');
        }
    });
}

// Filtrar pacientes
function filtrarPacientes(searchTerm) {
    if (!searchTerm) {
        renderizarListaPacientes(todosLosPacientes);
        return;
    }
    
    const pacientesFiltrados = todosLosPacientes.filter(paciente => 
        paciente.nombre_completo.toLowerCase().includes(searchTerm) ||
        (paciente.telefono_paciente && paciente.telefono_paciente.includes(searchTerm)) ||
        (paciente.email && paciente.email.toLowerCase().includes(searchTerm))
    );
    
    renderizarListaPacientes(pacientesFiltrados);
    
    // Mostrar mensaje si no hay resultados
    const listaPacientes = document.getElementById('lista-pacientes-completa');
    const mensajeNoResultados = listaPacientes.querySelector('.no-results');
    
    if (pacientesFiltrados.length === 0 && searchTerm) {
        if (!mensajeNoResultados) {
            const mensaje = document.createElement('div');
            mensaje.className = 'no-results';
            mensaje.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #6c757d;">
                    <i class="fas fa-search" style="font-size: 32px; margin-bottom: 10px;"></i>
                    <p>No se encontraron pacientes con "<strong>${searchTerm}</strong>"</p>
                    <small>Intenta con otro nombre o término de búsqueda</small>
                </div>
            `;
            listaPacientes.appendChild(mensaje);
        }
    } else if (mensajeNoResultados) {
        mensajeNoResultados.remove();
    }
}

// Mostrar detalles del paciente seleccionado - CORREGIDA
async function mostrarDetallesPaciente(idPaciente) {
    try {
        const vistaPaciente = document.getElementById('vista-paciente-seleccionado');
        
        if (!vistaPaciente) {
            console.error('❌ Elemento vista-paciente-seleccionado no encontrado');
            return;
        }
        
        // Mostrar loading
        vistaPaciente.innerHTML = `
            <div class="loading-paciente">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando información del paciente...</p>
            </div>
        `;
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario como parámetro ⬇️⬇️⬇️
        const response = await fetch(`DataBase/php/perfilPaciente.php?id=${idPaciente}&id_usuario=${userData.id}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const info = data.info;
        
        // Generar y mostrar el perfil detallado
        vistaPaciente.innerHTML = generarHTMLPerfilPaciente(info, data);
        
        console.log('✅ Perfil del paciente cargado:', info.nombre_completo);
        
    } catch (error) {
        console.error('❌ Error cargando detalles del paciente:', error);
        const vistaPaciente = document.getElementById('vista-paciente-seleccionado');
        if (vistaPaciente) {
            vistaPaciente.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar información</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-sm" onclick="mostrarDetallesPaciente(${idPaciente})">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Generar HTML del perfil del paciente
function generarHTMLPerfilPaciente(info, data) {
    const edad = calcularEdad(info.fecha_nacimiento);
    const ultimaVisita = data.ultima_visita ? 
        new Date(data.ultima_visita).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 
        'No registrada';
    
    // Obtener estadísticas
    const totalRegistros = data.historial ? data.historial.length : 0;
    const totalRecetas = data.recetas ? data.recetas.length : 0;
    const tieneCitaProgramada = data.proxima_cita ? 'Sí' : 'No';
    const alergias = obtenerAlergias(data.historial);
    
    return `
        <div class="patient-profile-detailed">
            <!-- Header con información principal -->
            <div class="patient-header-detailed">
                <div class="patient-main-info">
                    <div class="patient-avatar-large">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="patient-basic-details">
                        <h2>${info.nombre_completo}</h2>
                        <div class="patient-meta">
                            <span class="patient-id">ID: ${info.id_paciente}</span>
                            <span class="patient-age">${edad} años</span>
                            <span class="patient-gender">${info.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="patient-stats-overview">
                    <div class="stat-item">
                        <div class="stat-number">${totalRegistros}</div>
                        <div class="stat-label">Registros Médicos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${totalRecetas}</div>
                        <div class="stat-label">Recetas Activas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${tieneCitaProgramada}</div>
                        <div class="stat-label">Cita Programada</div>
                    </div>
                </div>
            </div>
            
            <!-- Información de contacto -->
            <div class="patient-contact-section">
                <h3>📞 Información de Contacto</h3>
                <div class="contact-grid">
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <label>Teléfono Principal</label>
                            <p>${info.telefono_paciente || 'No registrado'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <label>Correo Electrónico</label>
                            <p>${info.email || 'No registrado'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-home"></i>
                        <div>
                            <label>Dirección</label>
                            <p>${info.direccion || 'No registrada'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-ambulance"></i>
                        <div>
                            <label>Contacto de Emergencia</label>
                            <p>${info.contacto_de_emergencia || 'No registrado'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Resumen médico -->
            <div class="patient-medical-overview">
                <h3>🏥 Resumen Médico</h3>
                <div class="medical-summary">
                    <div class="summary-item">
                        <label>Última Visita</label>
                        <p>${ultimaVisita}</p>
                    </div>
                    <div class="summary-item">
                        <label>Alergias Conocidas</label>
                        <p>${alergias || 'No registradas'}</p>
                    </div>
                    <div class="summary-item">
                        <label>Medicación Actual</label>
                        <p>${totalRecetas > 0 ? `${totalRecetas} receta(s) activa(s)` : 'Sin medicación activa'}</p>
                    </div>
                    <div class="summary-item">
                        <label>Estado General</label>
                        <p>${totalRegistros > 0 ? 'Con historial médico' : 'Sin historial registrado'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Acciones rápidas -->
            <div class="patient-actions-detailed">
                <button class="btn btn-primary" onclick="irAExpediente(${info.id_paciente})">
                    <i class="fas fa-notes-medical"></i> Ver Expediente Completo
                </button>
                <button class="btn btn-success" onclick="crearRecetaParaPaciente(${info.id_paciente}, '${info.nombre_completo}')">
                    <i class="fas fa-file-prescription"></i> Nueva Receta
                </button>
                <button class="btn btn-warning" onclick="agendarCitaPaciente(${info.id_paciente})">
                    <i class="fas fa-calendar-plus"></i> Agendar Cita
                </button>
                <button class="btn btn-info" onclick="generarReportePaciente(${info.id_paciente})">
                    <i class="fas fa-chart-bar"></i> Generar Reporte
                </button>
            </div>
        </div>
    `;
}

// Función auxiliar para obtener alergias del historial
function obtenerAlergias(historial) {
    if (!historial) return null;
    
    const alergias = historial.filter(h => 
        h.tipo_registro && h.tipo_registro.toLowerCase() === 'alergia'
    );
    
    return alergias.length > 0 ? 
        alergias.map(a => a.descripcion).join(', ') : 
        null;
}

// ===== FUNCIONES DE ACCIÓN PARA LOS BOTONES =====

function irAExpediente(idPaciente) {
    console.log('📁 Navegando a expediente del paciente:', idPaciente);
    
    // Navegar a la sección de expedientes
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="medical-records"]').classList.add('active');
    showSection('medical-records');
    
    // Cargar lista y seleccionar paciente
    setTimeout(() => {
        cargarListaPacientes();
        
        // Esperar a que cargue la lista y luego seleccionar el paciente
        setTimeout(() => {
            const pacienteItem = document.querySelector(`.record-item[data-patient="${idPaciente}"]`);
            if (pacienteItem) {
                pacienteItem.click();
            } else {
                console.warn('⚠️ No se encontró el paciente en la lista de expedientes');
                // Recargar después de un tiempo si no se encuentra
                setTimeout(() => {
                    const pacienteItemRetry = document.querySelector(`.record-item[data-patient="${idPaciente}"]`);
                    if (pacienteItemRetry) {
                        pacienteItemRetry.click();
                    }
                }, 1000);
            }
        }, 800);
    }, 100);
}

function crearRecetaParaPaciente(idPaciente, nombrePaciente) {
    console.log('📝 Creando receta para:', nombrePaciente);
    
    // Navegar a la sección de recetas
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="prescriptions"]').classList.add('active');
    showSection('prescriptions');
    
    // Seleccionar el paciente en el sistema de recetas
    setTimeout(() => {
        if (typeof seleccionarPacienteReceta === 'function') {
            // PRIMERO mostrar el formulario (solo cuando viene de "Nueva Receta")
            mostrarFormularioReceta();
            // LUEGO seleccionar el paciente
            seleccionarPacienteReceta(idPaciente, nombrePaciente);
        } else {
            console.error('❌ Función seleccionarPacienteReceta no disponible');
            alert('Error: Sistema de recetas no disponible');
        }
    }, 100);
}

function agendarCitaPaciente(idPaciente) {
    alert(`📅 Agendar cita para paciente ID: ${idPaciente}\n\nEsta funcionalidad estará disponible en la próxima actualización.`);
    // Aquí puedes implementar la lógica de agendamiento
}

function generarReportePaciente(idPaciente) {
    alert(`📊 Generar reporte para paciente ID: ${idPaciente}\n\nEsta funcionalidad estará disponible en la próxima actualización.`);
    // Aquí puedes implementar la generación de reportes
}
// ===== SISTEMA DE NOTIFICACIONES - VERSIÓN CORREGIDA =====
let isLoading = false;
let notificacionesCache = [];

async function cargarNotificaciones() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        console.log('🔄 Iniciando carga de notificaciones...');
        
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            console.warn('⚠️ No se pudieron cargar notificaciones: usuario no logueado');
            return;
        }

        console.log('👤 Usuario logueado:', userData.id);
        
        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario al servidor ⬇️⬇️⬇️
        const response = await fetch('DataBase/php/obtenerNotificaciones.php?_=' + Date.now(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const notificaciones = await response.json();
        console.log('📨 Notificaciones recibidas:', notificaciones);
        notificacionesCache = notificaciones;

        renderizarNotificaciones(notificaciones);
        actualizarContadorNotificaciones();

    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
        if (notificacionesCache.length > 0) {
            renderizarNotificaciones(notificacionesCache);
        }
    } finally {
        isLoading = false;
    }
}

function renderizarNotificaciones(notificaciones) {
    const listaNotificaciones = document.getElementById('lista-notificaciones-contenedor');
    if (!listaNotificaciones) {
        console.error('❌ No se encontró el contenedor de notificaciones');
        return;
    }

    console.log('🎨 Renderizando notificaciones...');
    const fragment = document.createDocumentFragment();
    
    notificaciones.forEach((notificacion, index) => {
        const item = document.createElement('div');
        item.className = `notificacion-item ${notificacion.leido == 1 ? 'leido' : ''}`;
        item.dataset.id = notificacion.id; // Para debug
        
        // ⬇️⬇️⬇️ MEJORADO: Iconos más específicos según el tipo ⬇️⬇️⬇️
        const icono = obtenerIconoPorTipo(notificacion.tipo_notificacion);
        
        item.innerHTML = `
            <div class="notificacion-icono">${icono}</div>
            <div class="notificacion-mensaje">${notificacion.mensaje}</div>
            <div class="notificacion-fecha">${notificacion.fecha}</div>
        `;

        console.log(`📝 Notificación ${index}: ID=${notificacion.id}, Leído=${notificacion.leido}`);

        // VERSIÓN SIMPLE - Sin remover eventos
        if (notificacion.leido == 0) {
            item.style.cursor = 'pointer'; // Para que se vea que es clickeable
            item.addEventListener('click', function() {
                console.log('🖱️ CLICK DETECTADO en notificación:', notificacion.id);
                marcarNotificacionComoLeida(notificacion.id, item);
            });
        } else {
            item.style.cursor = 'default';
        }

        fragment.appendChild(item);
    });
    
    listaNotificaciones.innerHTML = '';
    listaNotificaciones.appendChild(fragment);
    console.log('✅ Renderizado completado');
}

// ⬇️⬇️⬇️ NUEVA FUNCIÓN: Obtener icono según tipo de notificación ⬇️⬇️⬇️
function obtenerIconoPorTipo(tipo) {
    const iconos = {
        'Bienvenida': '<i class="fas fa-hand-wave"></i>',
        'Recordatorio': '<i class="fas fa-clock"></i>',
        'NuevoPaciente': '<i class="fas fa-user-plus"></i>',
        'Consulta completada': '<i class="fas fa-check-circle"></i>',
        'Consulta registrada': '<i class="fas fa-file-medical"></i>',
        'Informe': '<i class="fas fa-file-alt"></i>',
        'AvisoSistema': '<i class="fas fa-cog"></i>',
        'cita': '<i class="fas fa-calendar"></i>'
    };
    
    return iconos[tipo] || '<i class="fas fa-bell"></i>';
}

async function marcarNotificacionComoLeida(idNotificacion, elementoHTML) {
    console.log('🚀 Ejecutando marcarNotificacionComoLeida...');
    
    // Actualizar UI inmediatamente
    elementoHTML.classList.add('leido');
    elementoHTML.style.cursor = 'default';
    console.log('✅ Clase "leido" agregada al elemento');
    
    // Actualizar contador inmediatamente
    actualizarContadorNotificaciones();
    
    try {
        console.log('📡 Enviando solicitud al servidor...');
        const response = await fetch('DataBase/php/marcarNotificacionLeida.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_notificacion: idNotificacion })
        });

        const result = await response.json();
        console.log('📨 Respuesta del servidor:', result);

        if (!result.success) {
            console.error('❌ Error al marcar como leída:', result.error);
            elementoHTML.classList.remove('leido');
            elementoHTML.style.cursor = 'pointer';
            actualizarContadorNotificaciones();
        } else {
            console.log('✅ Notificación actualizada en la BD.');
            
            // ⬇️⬇️⬇️ NUEVO: Actualizar el cache local ⬇️⬇️⬇️
            const notificacionIndex = notificacionesCache.findIndex(n => n.id == idNotificacion);
            if (notificacionIndex !== -1) {
                notificacionesCache[notificacionIndex].leido = 1;
            }
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        elementoHTML.classList.remove('leido');
        elementoHTML.style.cursor = 'pointer';
        actualizarContadorNotificaciones();
    }
}

function actualizarContadorNotificaciones() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) {
        console.error('❌ No se encontró el badge de notificaciones');
        return;
    }
    
    // ⬇️⬇️⬇️ MEJORADO: Contar desde el cache para mayor precisión ⬇️⬇️⬇️
    const notificacionesNoLeidas = notificacionesCache.filter(n => n.leido == 0).length;
    console.log(`🔢 Actualizando contador: ${notificacionesNoLeidas} no leídas`);
    
    badge.textContent = notificacionesNoLeidas;
    badge.style.display = notificacionesNoLeidas > 0 ? 'inline-block' : 'none';
}

// ⬇️⬇️⬇️ NUEVA FUNCIÓN: Forzar recarga de notificaciones ⬇️⬇️⬇️
function forzarRecargaNotificaciones() {
    notificacionesCache = []; // Limpiar cache
    cargarNotificaciones();
}

// Event listeners para debug
document.addEventListener('click', function(e) {
    if (e.target.closest('.notificacion-item')) {
        console.log('🎯 Evento click global capturado en:', e.target);
    }
});

// Recargar cada 60 segundos
setInterval(cargarNotificaciones, 60000);

// ⬇️⬇️⬇️ NUEVO: Cargar notificaciones al iniciar la página ⬇️⬇️⬇️
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de notificaciones...');
    setTimeout(cargarNotificaciones, 1000); // Pequeño delay para asegurar que el DOM esté listo
});

// ===============================================
// ===== LÓGICA DEL DASHBOARD (CORREGIDA) =====
// ===============================================

/**
 * Carga y muestra las consultas programadas para el día de hoy en el Dashboard.
 */
async function cargarConsultasDashboard() {
    const dashboardList = document.querySelector('#dashboard .appointments-list');
    if (!dashboardList) {
        console.error('❌ Contenedor .appointments-list no encontrado en Dashboard');
        return;
    }

    console.log('🔄 Cargando consultas del día para el Dashboard...');

    // Mostrar estado de carga
    dashboardList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando citas del día...</p>
        </div>`;

    try {
        // ⬇️⬇️⬇️ NUEVO: Obtener datos del usuario logueado ⬇️⬇️⬇️
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            throw new Error('No se encontraron datos de usuario válidos');
        }

        console.log('👤 Usuario logueado:', userData.id);

        // ⬇️⬇️⬇️ MODIFICADO: Enviar id_usuario al servidor ⬇️⬇️⬇️
        const response = await fetch('DataBase/php/obtenerConsultas.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: userData.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const todasLasConsultasApi = await response.json();
        
        // ⬇️⬇️⬇️ NUEVO: Manejar errores del backend ⬇️⬇️⬇️
        if (todasLasConsultasApi.error) {
            throw new Error(todasLasConsultasApi.error);
        }

        // Filtrar solo las de hoy
        const ahora = new Date();
        const consultasHoy = todasLasConsultasApi.filter(consulta => {
            const fecha = new Date(consulta.fecha_programada);
            // Comparamos solo la fecha (año, mes, día), ignorando la hora
            return fecha.toDateString() === ahora.toDateString();
        });

        console.log(`✅ Consultas encontradas para hoy: ${consultasHoy.length}`);

        // Renderizar las consultas de hoy
        renderizarConsultasDashboard(consultasHoy, dashboardList);

    } catch (error) {
        console.error('❌ Error cargando consultas del dashboard:', error);
        dashboardList.innerHTML = `
            <div class="error-message-compact">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No se pudo cargar la agenda.</p>
                <p><small>${error.message}</small></p>
                <button class="btn btn-sm" onclick="cargarConsultasDashboard()">Reintentar</button>
            </div>`;
    }
}

/**
 * Renderiza la lista de consultas de hoy en el contenedor del dashboard.
 */
function renderizarConsultasDashboard(consultas, container) {
    if (consultas.length === 0) {
        container.innerHTML = `
            <div class="no-data-compact">
                <i class="fas fa-calendar-check"></i>
                <p>No hay citas programadas para hoy.</p>
                <small>¡Disfruta de tu día!</small>
            </div>`;
        return;
    }

    // Ordenar por hora
    consultas.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

    container.innerHTML = ''; // Limpiar el loading
    
    consultas.forEach(consulta => {
        const item = document.createElement('div');
        item.className = `appointment-item-card status-${consulta.estado}`;
        
        const fecha = new Date(consulta.fecha_programada);
        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        // Determinar qué botón mostrar
        let actionButton = '';
        if (consulta.enlace_meet && (consulta.estado === 'programado' || consulta.estado === 'en-curso' || consulta.estado === 'confirmada')) {
            // Botón para unirse si es virtual y está programada/en curso
            actionButton = `<button class="btn btn-sm btn-success" onclick="irAPerfilConsulta(${consulta.id})"><i class="fas fa-video"></i> Unir</button>`;
        } else if (consulta.estado === 'completada') {
            // Botón de ver expediente si ya se completó
            actionButton = `<button class="btn btn-sm btn-secondary" onclick="irAExpediente(${consulta.id_paciente})"><i class="fas fa-notes-medical"></i> Ver Exp.</button>`;
        } else {
            // Botón de ver perfil de consulta por defecto
            actionButton = `<button class="btn btn-sm btn-info" onclick="irAPerfilConsulta(${consulta.id})"><i class="fas fa-eye"></i> Ver</button>`;
        }

        item.innerHTML = `
            <div class="appointment-time">${hora}</div>
            <div class="appointment-details">
                <h4>${consulta.paciente_nombre || 'Paciente'}</h4>
                <p>${consulta.motivo || 'Consulta'} (${obtenerTextoTipo(consulta.tipo)})</p>
            </div>
            <div class="appointment-actions">
                ${actionButton}
            </div>
        `;
        
        // Evento para ir a la consulta (si no es el botón)
        item.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                irAPerfilConsulta(consulta.id);
            }
        });

        container.appendChild(item);
    });
}

/**
 * Función auxiliar para navegar a la sección de consultas y ver una específica.
 */
function irAPerfilConsulta(idConsulta) {
    console.log('Navegando al perfil de la consulta:', idConsulta);
    
    // Navegar a la sección de consultas
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="consultations"]').classList.add('active');
    showSection('consultations');
    
    // Esperar un momento para que la UI se actualice y cargue las consultas
    setTimeout(() => {
        // Asegurarse de que las consultas estén cargadas
        if (typeof todasLasConsultas === 'undefined' || todasLasConsultas.length === 0) {
            // Si no están cargadas, forzar la carga y luego seleccionar
            cargarConsultas().then(() => {
                if (typeof seleccionarConsultaEnLista === 'function') {
                    seleccionarConsultaEnLista(idConsulta);
                }
                if (typeof mostrarDetallesConsulta === 'function') {
                    mostrarDetallesConsulta(idConsulta);
                }
            });
        } else {
            // Si ya están cargadas, solo seleccionar
            if (typeof seleccionarConsultaEnLista === 'function') {
                seleccionarConsultaEnLista(idConsulta);
            }
            if (typeof mostrarDetallesConsulta === 'function') {
                mostrarDetallesConsulta(idConsulta);
            }
        }
    }, 300); // 300ms de espera
}

// ⬇️⬇️⬇️ NUEVO: Asegurar que se carguen las consultas del dashboard al iniciar ⬇️⬇️⬇️
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando dashboard...');
    
    // Cargar consultas del dashboard después de un pequeño delay
    setTimeout(() => {
        if (document.querySelector('#dashboard .appointments-list')) {
            cargarConsultasDashboard();
        }
    }, 500);
});

// ⬇️⬇️⬇️ NUEVO: Función para recargar el dashboard manualmente ⬇️⬇️⬇️
function recargarDashboard() {
    console.log('🔄 Recargando dashboard...');
    cargarConsultasDashboard();
    
    // También puedes agregar aquí la recarga de otros elementos del dashboard
    // como estadísticas, notificaciones, etc.
}

// ===== SISTEMA DE CONSULTAS VIRTUALES =====

// Variables globales
let consultaSeleccionada = null;
let todasLasConsultas = [];
let jitsiApi = null;

// Inicializar sistema de consultas
function inicializarSistemaConsultas() {
    console.log('🔄 Inicializando sistema de consultas...');

    // Cargar consultas cuando se accede a la sección
    const consultationsSection = document.querySelector('[data-section="consultations"]');
    if (consultationsSection) {
        consultationsSection.addEventListener('click', function() {
            console.log('🩺 Accediendo a sección de Consultas');
            cargarConsultas();
        });
    }

    // Event listeners para filtros
    document.getElementById('filter-status')?.addEventListener('change', filtrarConsultas);
    document.getElementById('search-consultation')?.addEventListener('input', filtrarConsultas);
}

// ==========================
// CARGAR CONSULTAS DESDE BD - CORREGIDA
// ==========================
async function cargarConsultas() {
    try {
        console.log('🔄 Cargando consultas desde la base de datos...');
        
        // ⬇️⬇️⬇️ CORREGIDO: Leer correctamente del localStorage ⬇️⬇️⬇️
        const userData = localStorage.getItem('user');
        if (!userData) {
            throw new Error('No se encontraron datos de usuario. Por favor, inicie sesión nuevamente.');
        }
        
        const user = JSON.parse(userData);
        const idUsuario = user.id; // ⬅️ Ahora sí obtenemos el ID correcto
        
        console.log('👤 Usuario logueado:', user);
        console.log('🔑 ID de usuario:', idUsuario);

        const listaConsultas = document.getElementById('lista-consultas');
        if (!listaConsultas) return;

        // Mostrar loading state
        listaConsultas.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando consultas...</p>
            </div>
        `;

        console.log(`👨‍⚕️ Cargando consultas para el usuario ID: ${idUsuario}`);

        const response = await fetch('DataBase/php/obtenerConsultas.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario: idUsuario
            })
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const consultas = await response.json();
        
        if (consultas.error) {
            throw new Error(consultas.error);
        }

        todasLasConsultas = consultas;
        console.log(`✅ ${consultas.length} consultas cargadas:`, consultas);

        // Actualizar contador
        const contador = document.getElementById('contador-consultas');
        if (contador) {
            const programadas = consultas.filter(consulta => consulta.estado === 'programado').length;
            contador.textContent = programadas;
            contador.style.display = programadas > 0 ? 'inline-block' : 'none';
        }

        renderizarListaConsultas(consultas);
        
        if (consultaSeleccionada) {
            mostrarDetallesConsulta(consultaSeleccionada);
        }
        
    } catch (error) {
        console.error('❌ Error cargando consultas:', error);
        const listaConsultas = document.getElementById('lista-consultas');
        if (listaConsultas) {
            listaConsultas.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar consultas</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-sm" onclick="cargarConsultas()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// ==========================
// RENDERIZAR CONSULTAS
// ==========================
function renderizarListaConsultas(consultas) {
    const listaConsultas = document.getElementById('lista-consultas');
    if (!listaConsultas) return;

    if (consultas.length === 0) {
        listaConsultas.innerHTML = `
            <div class="no-data">
                <i class="fas fa-video-slash"></i>
                <p>No hay consultas programadas</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha (más cercanas primero)
    consultas.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
    listaConsultas.innerHTML = '';

    consultas.forEach(consulta => {
        const item = document.createElement('div');
        item.className = `consultation-item ${consultaSeleccionada === consulta.id ? 'active' : ''}`;
        item.dataset.consultaId = consulta.id;

        const fecha = new Date(consulta.fecha_programada);
        const ahora = new Date();
        const esHoy = fecha.toDateString() === ahora.toDateString();
        const esPasada = fecha < ahora;

        item.innerHTML = `
            <div class="consultation-item-header">
                <div class="consultation-patient">${consulta.paciente_nombre || 'Paciente'}</div>
                <div class="consultation-status status-${consulta.estado}">
                    ${obtenerTextoEstado(consulta.estado)}
                </div>
            </div>
            <div class="consultation-datetime">
                <span>
                    <i class="far fa-calendar"></i>
                    ${esHoy ? 'Hoy' : fecha.toLocaleDateString('es-ES')}
                    ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span class="consultation-type">${obtenerTextoTipo(consulta.tipo)}</span>
            </div>
            <div class="consultation-reason">${consulta.motivo || 'Sin motivo especificado'}</div>
            ${consulta.enlace_meet ? '<div class="consultation-badge-virtual"><i class="fas fa-video"></i> Virtual</div>' : ''}
        `;

        item.addEventListener('click', function () {
            seleccionarConsultaEnLista(consulta.id);
            mostrarDetallesConsulta(consulta.id);
        });

        listaConsultas.appendChild(item);
    });
}

// ==========================
// DETALLES DE CONSULTA
// ==========================
function seleccionarConsultaEnLista(idConsulta) {
    document.querySelectorAll('.consultation-item').forEach(item => {
        item.classList.toggle('active', item.dataset.consultaId === idConsulta.toString());
    });
    consultaSeleccionada = idConsulta;
}

function mostrarDetallesConsulta(idConsulta) {
    const consulta = todasLasConsultas.find(consulta => consulta.id === idConsulta);
    const vistaConsulta = document.getElementById('vista-consulta-seleccionada');
    if (!consulta || !vistaConsulta) {
        console.warn('❌ No se encontró consulta o contenedor de detalles');
        // Limpiar vista si la consulta no se encuentra (ej. después de filtrar)
        if (vistaConsulta) {
            vistaConsulta.innerHTML = `
                <div class="no-consultation-selected">
                    <div class="empty-state">
                        <i class="fas fa-video-slash"></i>
                        <h3>Selecciona una consulta</h3>
                        <p>Haz clic en una consulta de la lista para ver los detalles</p>
                    </div>
                </div>`;
        }
        return;
    }

    const fecha = new Date(consulta.fecha_programada);
    const esPasada = fecha < new Date();

    vistaConsulta.innerHTML = generarHTMLDetallesConsulta(consulta, esPasada);
}


function generarHTMLDetallesConsulta(consulta, esPasada) {
    const fecha = new Date(consulta.fecha_programada);
    const esHoy = fecha.toDateString() === new Date().toDateString();
    const esFutura = fecha > new Date();
    const enProgreso = !esPasada && !esFutura; // Simplificación
    const puedeUnirse = consulta.estado === 'programado' || consulta.estado === 'en-curso' || consulta.estado === 'confirmada';

    return `
        <div class="consultation-detail-container">
            <div class="consultation-detail-header">
                <div class="consultation-main-info">
                    <h2>Consulta con ${consulta.paciente_nombre || 'Paciente'}</h2>
                    <div class="consultation-meta">
                        <div class="status-badge status-${consulta.estado}">
                            ${obtenerTextoEstado(consulta.estado)}
                        </div>
                        ${consulta.enlace_meet ? '<div class="virtual-badge"><i class="fas fa-video"></i> Consulta Virtual</div>' : ''}
                    </div>
                </div>
            </div>

            <div class="consultation-info-grid">
                <div class="info-card">
                    <h3><i class="far fa-clock"></i> Información de la Cita</h3>
                    <div class="info-item">
                        <span class="info-label">Fecha y Hora:</span>
                        <span class="info-value">
                            ${fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            <br>${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Duración:</span>
                        <span class="info-value">${consulta.duracion || 30} minutos</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tipo:</span>
                        <span class="info-value">${obtenerTextoTipo(consulta.tipo)}</span>
                    </div>
                </div>

                <div class="info-card">
                    <h3><i class="fas fa-stethoscope"></i> Detalles Médicos</h3>
                    <div class="info-item">
                        <span class="info-label">Motivo:</span>
                        <span class="info-value">${consulta.motivo || 'No especificado'}</span>
                    </div>
                    ${consulta.notas ? `
                    <div class="info-item">
                        <span class="info-label">Notas:</span>
                        <span class="info-value">${consulta.notas}</span>
                    </div>` : ''}
                </div>
            </div>

            <!-- BOTONES DE ACCIÓN -->
            <div class="consultation-actions">
                ${consulta.enlace_meet && puedeUnirse && !esPasada ? `
                <button class="btn btn-success btn-lg" onclick="unirseAConsulta('${consulta.enlace_meet}', ${consulta.id})">
                    <i class="fas fa-video"></i> Unirse a Videollamada
                </button>
                ` : ''}
                

            </div>
        </div>
    `;
}
// ==========================
// VIDEOCONFERENCIA JITSI - MEJORADA
// ==========================
function unirseAConsulta(roomName, idConsulta) {
    console.log(`🎥 Uniéndose a la sala: ${roomName}`);
    
    // Validar que haya sala configurada
    if (!roomName || roomName === 'null' || roomName === 'undefined') {
        alert('❌ No hay sala de videoconferencia configurada para esta consulta');
        return;
    }

    const vistaConsulta = document.getElementById('vista-consulta-seleccionada');
    if (!vistaConsulta) return;

    // Mostrar mensaje de carga
    vistaConsulta.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Iniciando videollamada...</p>
        </div>
    `;

    // Pequeño delay para mostrar el loading
    setTimeout(() => {
        iniciarVideollamada(roomName, idConsulta);
    }, 1000);
}

function iniciarVideollamada(roomName, idConsulta) {
    const vistaConsulta = document.getElementById('vista-consulta-seleccionada');
    
    // Crear interfaz de Jitsi
    vistaConsulta.innerHTML = `
        <div class="jitsi-wrapper">
            <div class="jitsi-header">
                <h3><i class="fas fa-video"></i> Consulta en curso - Dr. ${obtenerNombreDoctor()}</h3>
                <div class="jitsi-room-info">
                    <strong>Paciente:</strong> ${obtenerNombrePaciente(idConsulta)}
                    <button class="btn btn-sm btn-outline" onclick="copiarEnlaceMeet('${roomName}')">
                        <i class="fas fa-copy"></i> Copiar enlace
                    </button>
                </div>
            </div>
            <div id="jitsi-container-embed"></div>
            <div class="jitsi-controls">
                <button class="btn btn-danger btn-lg" id="btn-colgar-jitsi">
                    <i class="fas fa-phone-slash"></i> Finalizar consulta
                </button>
                <button class="btn btn-secondary" onclick="volverADetallesConsulta(${idConsulta})">
                    <i class="fas fa-arrow-left"></i> Volver a detalles
                </button>
            </div>
        </div>
    `;

    // Configuración optimizada para consultas médicas
    const domain = 'meet.jit.si';
    const options = {
        roomName: roomName,
        width: '100%',
        height: 500,
        parentNode: document.querySelector('#jitsi-container-embed'),
        userInfo: {
            displayName: 'Doctor',
            email: '' // Puedes agregar email si lo tienes
        },
        configOverwrite: {
            prejoinPageEnabled: false, // Entrar directamente a la sala
            disableInviteFunctions: true, // No permitir invitar
            defaultLanguage: 'es',
            enableWelcomePage: false,
            startWithAudioMuted: false, // Audio activado por defecto
            startWithVideoMuted: false, // Video activado por defecto
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            resolution: 720, // Calidad HD
            constraints: {
                video: {
                    height: { ideal: 720, max: 1080, min: 240 }
                }
            }
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'settings', 'raisehand', 'videoquality', 'filmstrip', 'shortcuts',
                'tileview', 'videobackgroundblur', 'help', 'mute-everyone'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_CHROME_EXTENSION_BANNER: false
        }
    };

    try {
        // Verificar que la API de Jitsi esté disponible
        if (typeof JitsiMeetExternalAPI === 'undefined') {
            throw new Error('Jitsi Meet API no está cargada. Verifica el script.');
        }

        jitsiApi = new JitsiMeetExternalAPI(domain, options);
        
        // Event listeners importantes
        jitsiApi.addEventListener('videoConferenceJoined', () => {
            console.log('✅ Doctor se unió a la videollamada');
            actualizarEstadoConsulta(idConsulta, 'en-curso');
        });

        jitsiApi.addEventListener('videoConferenceLeft', () => {
            console.log('👋 Doctor salió de la videollamada');
            actualizarEstadoConsulta(idConsulta, 'completada');
            volverADetallesConsulta(idConsulta);
        });

        jitsiApi.addEventListener('participantJoined', (participant) => {
            console.log('👤 Paciente se unió:', participant);
            // Aquí puedes mostrar notificación o actualizar UI
        });

        jitsiApi.addEventListener('participantLeft', (participant) => {
            console.log('👤 Paciente salió:', participant);
        });

        // Botón para finalizar llamada
        document.getElementById('btn-colgar-jitsi').addEventListener('click', () => {
            finalizarConsulta(idConsulta);
        });

        // Manejar errores de Jitsi
        jitsiApi.addEventListener('connectionFailed', () => {
            console.error('❌ Error de conexión con Jitsi');
            alert('Error de conexión. Verifica tu internet.');
        });

    } catch (error) {
        console.error('❌ Error iniciando Jitsi:', error);
        vistaConsulta.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error al conectar con la videollamada</h4>
                <p>${error.message}</p>
                <div class="consultation-actions">
                    <button class="btn btn-primary" onclick="unirseAConsulta('${roomName}', ${idConsulta})">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button class="btn btn-secondary" onclick="volverADetallesConsulta(${idConsulta})">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                </div>
            </div>
        `;
    }
}

// ==========================
// FUNCIONES AUXILIARES
// ==========================
function obtenerTextoEstado(estado) {
    const estados = {
        'programado': 'Programada',
        'completada': 'Completada',
        'cancelada': 'Cancelada',
        'en-curso': 'En Curso',
        'confirmada': 'Confirmada'
    };
    return estados[estado] || estado;
}

function obtenerTextoTipo(tipo) {
    const tipos = {
        'virtual': 'Virtual',
        'presencial': 'Presencial',
        'primera_vez': 'Primera Vez',
        'seguimiento': 'Seguimiento',
        'urgencia': 'Urgencia',
        'control': 'Control'
    };
    return tipos[tipo] || tipo;
}

function filtrarConsultas() {
    const estado = document.getElementById('filter-status')?.value || 'all';
    const busqueda = document.getElementById('search-consultation')?.value.toLowerCase() || '';

    let filtradas = todasLasConsultas;
    
    if (estado !== 'all') {
        filtradas = filtradas.filter(consulta => consulta.estado === estado);
    }
    
    if (busqueda) {
        filtradas = filtradas.filter(consulta =>
            (consulta.paciente_nombre && consulta.paciente_nombre.toLowerCase().includes(busqueda)) ||
            (consulta.motivo && consulta.motivo.toLowerCase().includes(busqueda))
        );
    }
    
    renderizarListaConsultas(filtradas);
}

// ==========================
// FUNCIONES DE APOYO PARA CONSULTAS
// ==========================

function obtenerNombreDoctor() {
    // ⬇️⬇️⬇️ CORREGIDO: Obtener nombre del objeto user ⬇️⬇️⬇️
    const userData = localStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        return user.name || 'Doctor';
    }
    return 'Doctor';
}

function obtenerNombrePaciente(idConsulta) {
    const consulta = todasLasConsultas.find(c => c.id === idConsulta);
    return consulta ? consulta.paciente_nombre : 'Paciente';
}

async function actualizarEstadoConsulta(idConsulta, nuevoEstado) {
    try {
        const response = await fetch('DataBase/php/actualizarEstadoConsulta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                consulta_id: idConsulta,
                estado: nuevoEstado
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log(`✅ Estado actualizado a: ${nuevoEstado}`);
            // Actualizar la consulta en el array local
            const consultaIndex = todasLasConsultas.findIndex(c => c.id === idConsulta);
            if (consultaIndex !== -1) {
                todasLasConsultas[consultaIndex].estado = nuevoEstado;
            }
            // Recargar la lista en la pestaña de consultas (si está visible)
            if (document.getElementById('consultations').classList.contains('active')) {
                renderizarListaConsultas(todasLasConsultas);
            }
        }
    } catch (error) {
        console.error('❌ Error actualizando estado:', error);
    }
}

function finalizarConsulta(idConsulta) {
    if (confirm('¿Está seguro de que desea finalizar la consulta?')) {
        if (jitsiApi) {
            jitsiApi.executeCommand('hangup');
        } else {
             // Si Jitsi no está, solo actualiza el estado y vuelve
            actualizarEstadoConsulta(idConsulta, 'completada');
            volverADetallesConsulta(idConsulta);
        }
    }
}

function volverADetallesConsulta(idConsulta) {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }
    // Recargar la consulta específica para ver el estado actualizado
    cargarConsultas().then(() => {
        mostrarDetallesConsulta(idConsulta);
    });
}

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
