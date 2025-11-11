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
            <button class="btn btn-success btn-full-width" id="btnActualizar" data-id="${id}">
                Actualizar Expediente
            </button>
            </div>



                <div class="profile-actions-row">
                    <button class="btn btn-primary">Agendar Nueva Cita</button>
                    <button class="btn btn-secondary">Generar Reporte</button>
                    <button class="btn" onclick="cargarListaPacientes()">Volver a la Lista</button>
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

// ==================================================
// SISTEMA DE RECETAS VIRTUALES - AGREGAR AL FINAL
// ==================================================

// Variables globales para recetas
let pacienteSeleccionadoReceta = null;
let recetaActual = null;

// Inicializar sistema de recetas cuando se carga la sección
function inicializarSistemaRecetas() {
    // Cargar pacientes para recetas cuando se accede a la sección
    document.querySelector('[data-section="prescriptions"]').addEventListener('click', function() {
        cargarPacientesParaRecetas();
        cargarRecetasExistentes();
    });
    
    // Event listeners para botones de recetas
    document.getElementById('btnNuevaReceta').addEventListener('click', mostrarFormularioReceta);
    document.getElementById('btnCancelarReceta').addEventListener('click', cancelarReceta);
    document.getElementById('btnGuardarReceta').addEventListener('click', guardarReceta);
    document.getElementById('btnGenerarReceta').addEventListener('click', generarVistaPrevia);
    document.getElementById('btnDescargarReceta').addEventListener('click', descargarRecetaPDF);
    document.getElementById('btnEditarReceta').addEventListener('click', editarReceta);
}

// 1. Cargar pacientes para el sistema de recetas
async function cargarPacientesParaRecetas() {
    try {
        const response = await fetch('DataBase/php/listaPacientes.php');
        const pacientes = await response.json();
        
        const selectPaciente = document.getElementById('select-paciente');
        const listaPacientes = document.getElementById('lista-pacientes-recetas');
        
        // Limpiar listas
        selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>';
        listaPacientes.innerHTML = '';
        
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
        
    } catch (error) {
        console.error('Error cargando pacientes para recetas:', error);
    }
}

// 2. Seleccionar paciente para receta
function seleccionarPacienteReceta(idPaciente, nombrePaciente) {
    pacienteSeleccionadoReceta = { id: idPaciente, nombre: nombrePaciente };
    document.getElementById('select-paciente').value = idPaciente;
    document.getElementById('titulo-formulario-receta').textContent = `Nueva Receta para ${nombrePaciente}`;
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

// 5. Generar vista previa de receta
function generarVistaPrevia() {
    const pacienteId = document.getElementById('select-paciente').value;
    const medicamentos = document.getElementById('medicamentos').value;
    const instrucciones = document.getElementById('instrucciones').value;
    const validez = document.getElementById('validez-receta').value;
    
    if (!pacienteId) {
        alert('Por favor seleccione un paciente');
        return;
    }
    
    if (!medicamentos.trim()) {
        alert('Por favor ingrese los medicamentos y tratamiento');
        return;
    }
    
    // Obtener nombre del paciente seleccionado
    const select = document.getElementById('select-paciente');
    const nombrePaciente = select.options[select.selectedIndex].text.split(' - ')[0];
    
    // Crear objeto receta
    recetaActual = {
        paciente_id: pacienteId,
        paciente_nombre: nombrePaciente,
        medicamentos: medicamentos,
        instrucciones: instrucciones,
        validez_dias: validez,
        fecha_emision: new Date().toLocaleDateString('es-ES'),
        doctor_nombre: 'Dr. Laura Martínez',
        doctor_especialidad: 'Cardióloga',
        doctor_cedula: 'LIC-DF-2020-001'
    };
    
    // Generar vista previa
    const vistaPrevia = document.querySelector('.receta-preview');
    vistaPrevia.innerHTML = generarHTMLReceta(recetaActual);
    
    // Mostrar vista previa
    document.getElementById('formulario-receta').style.display = 'none';
    document.getElementById('vista-previa-receta').style.display = 'block';
}

// 6. Función para generar HTML de receta
function generarHTMLReceta(receta) {
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(receta.validez_dias));
    
    return `
RECETA MÉDICA
Centro Médico TeleMed
----------------------------------------

PACIENTE: ${receta.paciente_nombre}
FECHA: ${receta.fecha_emision}
VÁLIDA HASTA: ${fechaVencimiento.toLocaleDateString('es-ES')}

TRATAMIENTO PRESCRITO:
${receta.medicamentos}

${receta.instrucciones ? `INSTRUCCIONES ESPECIALES:
${receta.instrucciones}` : ''}

----------------------------------------
MÉDICO TRATANTE:
${receta.doctor_nombre}
${receta.doctor_especialidad}
Cédula: ${receta.doctor_cedula}

NOTA: Esta receta es válida por ${receta.validez_dias} días a partir de la fecha de emisión.
    `;
}

// 7. Guardar receta en base de datos
async function guardarReceta() {
    if (!recetaActual) {
        alert('Primero genere la vista previa de la receta');
        return;
    }
    
    try {
        const response = await fetch('DataBase/php/guardarReceta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recetaActual)
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            alert('Receta guardada exitosamente');
            cancelarReceta();
            cargarRecetasExistentes(); // Recargar lista
        } else {
            alert('Error al guardar la receta: ' + resultado.error);
        }
        
    } catch (error) {
        console.error('Error guardando receta:', error);
        alert('Error al guardar la receta');
    }
}

// 8. Descargar receta como PDF (simulado)
function descargarRecetaPDF() {
    if (!recetaActual) {
        alert('No hay receta para descargar');
        return;
    }
    
    // En un sistema real, aquí iría la generación real del PDF
    // Por ahora simulamos la descarga
    
    const contenido = generarHTMLReceta(recetaActual);
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receta_${recetaActual.paciente_nombre}_${recetaActual.fecha_emision.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Receta descargada (simulación)');
}

// 9. Editar receta
function editarReceta() {
    document.getElementById('vista-previa-receta').style.display = 'none';
    document.getElementById('formulario-receta').style.display = 'block';
    
    if (recetaActual) {
        document.getElementById('medicamentos').value = recetaActual.medicamentos;
        document.getElementById('instrucciones').value = recetaActual.instrucciones || '';
        document.getElementById('validez-receta').value = recetaActual.validez_dias;
    }
}

// 10. Cargar recetas existentes
async function cargarRecetasExistentes() {
    try {
        const response = await fetch('DataBase/php/obtenerRecetas.php');
        const recetas = await response.json();
        
        const contenedor = document.getElementById('contenedor-recetas');
        contenedor.innerHTML = '';
        
        if (recetas.length === 0) {
            contenedor.innerHTML = '<p>No hay recetas registradas</p>';
            return;
        }
        
        recetas.forEach(receta => {
            const item = document.createElement('div');
            item.className = 'receta-item';
            item.innerHTML = `
                <div class="receta-header">
                    <div class="receta-paciente">${receta.paciente_nombre}</div>
                    <div class="receta-fecha">${receta.fecha_emision}</div>
                </div>
                <div class="receta-contenido">
                    ${receta.la_receta.substring(0, 100)}...
                </div>
                <div class="receta-actions">
                    <button class="btn btn-sm" onclick="verRecetaCompleta(${receta.id_receta_medica})">
                        Ver Completa
                    </button>
                    <button class="btn btn-sm btn-success" onclick="descargarRecetaExistente(${receta.id_receta_medica})">
                        Descargar
                    </button>
                </div>
            `;
            contenedor.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error cargando recetas existentes:', error);
    }
}

// 11. Ver receta completa
async function verRecetaCompleta(idReceta) {
    try {
        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        const receta = await response.json();
        
        if (receta) {
            recetaActual = receta;
            const vistaPrevia = document.querySelector('.receta-preview');
            vistaPrevia.innerHTML = generarHTMLReceta(receta);
            
            document.getElementById('formulario-receta').style.display = 'none';
            document.getElementById('vista-previa-receta').style.display = 'block';
            document.getElementById('lista-recetas').style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando receta:', error);
    }
}

// 12. Descargar receta existente
async function descargarRecetaExistente(idReceta) {
    try {
        const response = await fetch(`DataBase/php/obtenerReceta.php?id=${idReceta}`);
        const receta = await response.json();
        
        if (receta) {
            recetaActual = receta;
            descargarRecetaPDF();
        }
    } catch (error) {
        console.error('Error descargando receta:', error);
    }
}

// ==================================================
// INICIALIZACIÓN - AGREGAR ESTO AL FINAL TAMBIÉN
// ==================================================

// Al final de tu doctorIndex.js existente, llama a la inicialización:
document.addEventListener('DOMContentLoaded', function() {
    // ... tu código existente ...
    
    // Agregar esta línea para inicializar el sistema de recetas:
    inicializarSistemaRecetas();
});