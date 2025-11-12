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

// --- SISTEMA DE RECETAS VIRTUALES EN PDF ---

// Variables globales para recetas
let pacienteSeleccionadoReceta = null;
let recetaActual = null;

// Inicializar sistema de recetas cuando se carga la sección
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistemaRecetas();
});

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
        const response = await fetch('DataBase/php/listaPacientes.php');
        
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
                seleccionarPacienteReceta(paciente.id_paciente, paciente.nombre_completo);
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

// 2. Seleccionar paciente para receta - VERSIÓN MEJORADA
function seleccionarPacienteReceta(idPaciente, nombrePaciente) {
    pacienteSeleccionadoReceta = { 
        id: idPaciente, 
        nombre: nombrePaciente 
    };
    
    // Actualizar select
    document.getElementById('select-paciente').value = idPaciente;
    document.getElementById('titulo-formulario-receta').textContent = `Nueva Receta para ${nombrePaciente}`;
    
    // Habilitar botones
    document.getElementById('btnGenerarReceta').disabled = false;
    
    // MOSTRAR RECETAS DE ESTE PACIENTE ESPECÍFICO
    console.log(`👤 Cargando recetas del paciente: ${nombrePaciente} (ID: ${idPaciente})`);
    cargarRecetasExistentes(idPaciente);
    
    // Mostrar la lista de recetas si está oculta
    document.getElementById('formulario-receta').style.display = 'none';
    document.getElementById('vista-previa-receta').style.display = 'none';
    document.getElementById('lista-recetas').style.display = 'block';
}

// 3. Mostrar formulario de receta
function mostrarFormularioReceta() {
    document.getElementById('formulario-receta').style.display = 'block';
    document.getElementById('vista-previa-receta').style.display = 'none';
    document.getElementById('lista-recetas').style.display = 'none';
    
    // Limpiar formulario
    document.getElementById('medicamentos').value = '';
    document.getElementById('instrucciones').value = '';
    document.getElementById('validez-receta').value = '30';
    pacienteSeleccionadoReceta = null;
    
    // Resetear selección
    document.getElementById('select-paciente').value = '';
    document.querySelectorAll('.patient-item-mini').forEach(item => item.classList.remove('active'));
    
    // Cargar pacientes si no están cargados
    if (document.getElementById('select-paciente').options.length <= 1) {
        cargarPacientesParaRecetas();
    }
}

// 4. Cancelar receta
function cancelarReceta() {
    document.getElementById('formulario-receta').style.display = 'none';
    document.getElementById('vista-previa-receta').style.display = 'none';
    document.getElementById('lista-recetas').style.display = 'block';
    pacienteSeleccionadoReceta = null;
    recetaActual = null;
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

// 5. Generar vista previa de receta (VERSIÓN CORREGIDA)
function generarVistaPrevia() {
    const pacienteId = document.getElementById('select-paciente').value;
    const medicamentos = document.getElementById('medicamentos').value.trim();
    const instrucciones = document.getElementById('instrucciones').value.trim();
    const validez = document.getElementById('validez-receta').value;
    
    console.log('🔍 Datos del formulario:', {
        pacienteId,
        medicamentos,
        instrucciones,
        validez
    });
    
    // Validaciones
    if (!pacienteId) {
        alert('❌ Por favor seleccione un paciente');
        return;
    }
    
    if (!medicamentos) {
        alert('❌ Por favor ingrese los medicamentos y tratamiento');
        return;
    }
    
    if (medicamentos.length < 10) {
        alert('❌ La descripción del tratamiento es muy breve. Por favor sea más específico.');
        return;
    }
    
    // Obtener nombre del paciente seleccionado
    const select = document.getElementById('select-paciente');
    const nombrePaciente = select.options[select.selectedIndex].text.split(' - ')[0];
    
    // CREAR EL OBJETO recetaActual CORRECTAMENTE
    recetaActual = {
        paciente_id: pacienteId,
        paciente_nombre: nombrePaciente,
        medicamentos: medicamentos,
        instrucciones: instrucciones,
        validez_dias: validez,
        fecha_emision: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        doctor_nombre: 'Dr. Laura Martínez',
        doctor_especialidad: 'Cardióloga',
        doctor_cedula: 'LIC-DF-2020-001',
        consultorio: 'Centro Médico TeleMed',
        direccion_consultorio: 'Av. Principal #123, Ciudad'
    };
    
    console.log('✅ recetaActual creado:', recetaActual);
    
    // Mostrar loading
    const vistaPrevia = document.querySelector('.receta-preview');
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
            
            // Mostrar vista previa
            document.getElementById('formulario-receta').style.display = 'none';
            document.getElementById('vista-previa-receta').style.display = 'block';
            
            console.log('📄 Vista previa generada correctamente');
            
        } catch (error) {
            console.error('❌ Error generando vista previa:', error);
            alert('Error al generar la vista previa: ' + error.message);
        }
    }, 500);
}

// 6. Descargar receta como PDF (MEJORADA)
async function descargarRecetaPDF() {
    if (!recetaActual) {
        alert('❌ No hay receta para descargar');
        return;
    }

    // Mostrar loading
    const btnDescargar = document.getElementById('btnDescargarReceta');
    const originalText = btnDescargar.innerHTML;
    btnDescargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
    btnDescargar.disabled = true;

    try {
        // Verificar que jsPDF esté disponible
        if (typeof jspdf === 'undefined') {
            throw new Error('La librería PDF no está disponible. Recarga la página.');
        }

        // Crear instancia de jsPDF
        const doc = new jspdf.jsPDF();
        
        // Configuración
        const margin = 20;
        let yPosition = margin;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const contentWidth = pageWidth - (margin * 2);
        
        // Calcular fecha de vencimiento
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(recetaActual.validez_dias));
        
        // --- ENCABEZADO ---
        doc.setFillColor(0, 102, 204);
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(recetaActual.consultorio, pageWidth / 2, 12, { align: 'center' });
        
        doc.setFontSize(8);
        doc.text('Sistema de Telemedicina - Receta Digital', pageWidth / 2, 18, { align: 'center' });
        
        yPosition = 40;
        doc.setTextColor(0, 0, 0);
        
        // --- INFORMACIÓN DEL PACIENTE ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE', margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${recetaActual.paciente_nombre}`, margin, yPosition);
        
        yPosition += 5;
        doc.text(`Fecha de emisión: ${recetaActual.fecha_emision}`, margin, yPosition);
        
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
        
        // Dividir texto de medicamentos
        const medicamentosLines = doc.splitTextToSize(recetaActual.medicamentos, contentWidth);
        medicamentosLines.forEach(line => {
            if (yPosition > pageHeight - 50) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 5;
        });
        
        yPosition += 8;
        
        // --- INSTRUCCIONES ESPECIALES ---
        if (recetaActual.instrucciones && recetaActual.instrucciones.trim() !== '') {
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
            
            const instruccionesLines = doc.splitTextToSize(recetaActual.instrucciones, contentWidth);
            instruccionesLines.forEach(line => {
                if (yPosition > pageHeight - 50) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(line, margin, yPosition);
                yPosition += 5;
            });
            
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
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(recetaActual.doctor_nombre, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.text(recetaActual.doctor_especialidad, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.text(`Cédula Profesional: ${recetaActual.doctor_cedula}`, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.text(recetaActual.consultorio, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.text(recetaActual.direccion_consultorio, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;
        
        // --- NOTAS FINALES ---
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Nota: Esta receta es válida por ${recetaActual.validez_dias} días a partir de la fecha de emisión.`, 
                 pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 4;
        doc.text('Documento generado electrónicamente - Firma digital del médico', 
                 pageWidth / 2, yPosition, { align: 'center' });
        
        // --- WATERMARK ---
        doc.setFontSize(40);
        doc.setTextColor(240, 240, 240);
        doc.setFont('helvetica', 'bold');
        doc.text('RECETA VIRTUAL', pageWidth / 2, pageHeight / 2, { 
            align: 'center',
            angle: 45
        });
        
        // Generar nombre del archivo
        const fileName = `Receta_${recetaActual.paciente_nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Descargar el PDF
        doc.save(fileName);
        
        alert('✅ Receta descargada en formato PDF correctamente');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('❌ Error al generar el PDF: ' + error.message);
    } finally {
        // Restaurar botón
        btnDescargar.innerHTML = originalText;
        btnDescargar.disabled = false;
    }
}

// 7. Guardar receta en base de datos (VERSIÓN CON VALIDACIONES MEJORADAS)
async function guardarReceta() {
    console.log('🔄 Iniciando guardado de receta...');
    
    // VALIDACIÓN CRÍTICA: Verificar que recetaActual existe
    if (!recetaActual) {
        console.error('❌ recetaActual es null o undefined');
        alert('❌ ERROR: No hay datos de receta para guardar. Por favor genere la vista previa primero.');
        return;
    }
    
    // Validar campos esenciales
    if (!recetaActual.paciente_id) {
        alert('❌ ERROR: No hay paciente seleccionado');
        return;
    }
    
    if (!recetaActual.medicamentos || recetaActual.medicamentos.trim().length === 0) {
        alert('❌ ERROR: No hay medicamentos especificados');
        return;
    }
    
    console.log('✅ Validaciones pasadas. recetaActual:', recetaActual);
    
    try {
        // Mostrar loading
        const btnGuardar = document.getElementById('btnGuardarReceta');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btnGuardar.disabled = true;

        // Preparar datos para enviar (SOLO los necesarios para el PHP)
        const datosReceta = {
            paciente_id: parseInt(recetaActual.paciente_id),
            medicamentos: recetaActual.medicamentos,
            instrucciones: recetaActual.instrucciones || '',
            validez_dias: parseInt(recetaActual.validez_dias) || 30
        };

        console.log('📤 Enviando al servidor:', datosReceta);

        const response = await fetch('DataBase/php/guardarReceta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosReceta)
        });

        console.log('📨 Respuesta del servidor - Status:', response.status);

        // Verificar si la respuesta es JSON válido
        const responseText = await response.text();
        console.log('📄 Respuesta cruda:', responseText);

        let resultado;
        try {
            resultado = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Error parseando JSON:', e);
            throw new Error('Respuesta inválida del servidor: ' + responseText);
        }

        console.log('✅ Resultado parseado:', resultado);

        if (resultado.success) {
            alert('✅ Receta guardada exitosamente con ID: ' + resultado.id_receta);
            
            // ESPERAR a que se carguen las recetas antes de mostrar la lista
            await cargarRecetasExistentes();
            
            // Cambiar a la vista de lista
            document.getElementById('vista-previa-receta').style.display = 'none';
            document.getElementById('formulario-receta').style.display = 'none';
            document.getElementById('lista-recetas').style.display = 'block';
            
            console.log('🎉 Receta guardada y lista actualizada');
            
        } else {
            throw new Error(resultado.error || 'Error desconocido al guardar');
        }
        
    } catch (error) {
        console.error('❌ Error guardando receta:', error);
        alert('❌ Error al guardar la receta: ' + error.message);
    } finally {
        // Restaurar botón
        const btnGuardar = document.getElementById('btnGuardarReceta');
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Receta';
        btnGuardar.disabled = false;
    }
}
// 8. Editar receta
function editarReceta() {
    document.getElementById('vista-previa-receta').style.display = 'none';
    document.getElementById('formulario-receta').style.display = 'block';
    
    if (recetaActual) {
        document.getElementById('medicamentos').value = recetaActual.medicamentos;
        document.getElementById('instrucciones').value = recetaActual.instrucciones || '';
        document.getElementById('validez-receta').value = recetaActual.validez_dias;
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
        
        let url = 'DataBase/php/obtenerRecetas.php';
        if (pacienteId) {
            url += `?paciente_id=${pacienteId}`;
        }
        
        const response = await fetch(url);
        
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
                preview = lineas.find(line => line.trim().length > 0) || 'Receta médica';
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
                    <button class="btn btn-sm btn-secondary" onclick="reutilizarReceta(${receta.id_receta_medica})">
                        <i class="fas fa-copy"></i> Reusar
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
            recetaActual = receta;
            const vistaPrevia = document.querySelector('.receta-preview');
            vistaPrevia.innerHTML = generarHTMLVistaPrevia(receta);
            
            document.getElementById('formulario-receta').style.display = 'none';
            document.getElementById('vista-previa-receta').style.display = 'block';
            document.getElementById('lista-recetas').style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando receta:', error);
        alert('Error al cargar la receta: ' + error.message);
    }
}

// 11. Descargar receta existente
async function descargarRecetaExistente(idReceta) {
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
            recetaActual = receta;
            await descargarRecetaPDF();
        }
    } catch (error) {
        console.error('Error descargando receta:', error);
        alert('Error al descargar la receta: ' + error.message);
    }
}

// Función auxiliar para formatear fecha
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 12. Reutilizar receta existente (NUEVA FUNCIÓN)
async function reutilizarReceta(idReceta) {
    try {
        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        const receta = await response.json();
        
        if (receta) {
            // Llenar el formulario con los datos de la receta existente
            document.getElementById('medicamentos').value = receta.medicamentos || '';
            document.getElementById('instrucciones').value = receta.instrucciones || '';
            document.getElementById('validez-receta').value = receta.validez_dias || 30;
            
            // Mostrar formulario
            document.getElementById('lista-recetas').style.display = 'none';
            document.getElementById('vista-previa-receta').style.display = 'none';
            document.getElementById('formulario-receta').style.display = 'block';
            
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