// ==================== JS COMPLETO PARA admin.html ====================

// Navegación
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
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar título
    updateSectionTitle(sectionId);
    
    // Cargar datos específicos de la sección
    if (sectionId === 'users') {
        cargarUsuarios();
    }
    if (sectionId === 'reports') {
        cargarFacturas();
    }
}

function updateSectionTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'doctors': 'Gestión de Doctores',
        'patients': 'Gestión de Pacientes', 
        'appointments': 'Citas del Sistema',
        'users': 'Usuarios del Sistema',
        'reports': 'Reportes',
        'settings': 'Configuración'
    };
    
    document.getElementById('section-title').textContent = titles[sectionId] || 'Dashboard';
}

// RF-17: Gestión de usuarios
function cargarUsuarios() {
    console.log('Cargando usuarios...');
    // Simular carga de usuarios
    setTimeout(() => {
        alert('Usuarios cargados correctamente');
    }, 500);
}

function crearUsuario() {
    const nombre = prompt('Nombre completo:');
    const email = prompt('Email:');
    const role = prompt('Rol (Administrador/Doctor/Paciente):');
    const password = prompt('Contraseña:');
    
    if (nombre && email && role && password) {
        // Simular creación de usuario
        setTimeout(() => {
            alert(`Usuario ${nombre} creado exitosamente como ${role}`);
            cargarUsuarios();
        }, 1000);
    }
}

function cambiarEstadoUsuario(id, estado) {
    if (confirm(`¿${estado === 'Activo' ? 'Activar' : 'Desactivar'} usuario?`)) {
        // Simular cambio de estado
        setTimeout(() => {
            alert(`Usuario ${estado === 'Activo' ? 'activado' : 'desactivado'} correctamente`);
            cargarUsuarios();
        }, 500);
    }
}

// RF-18: Gestión de facturación
function cargarFacturas() {
    console.log('Cargando facturas...');
    // Simular carga de facturas
    setTimeout(() => {
        alert('Facturas cargadas correctamente');
    }, 500);
}

function marcarComoPagado(idPago) {
    if (confirm('¿Marcar como pagado?')) {
        // Simular pago
        setTimeout(() => {
            alert('Pago marcado como completado');
            cargarFacturas();
        }, 500);
    }
}

// Gestión de Doctores
document.getElementById('add-doctor-btn')?.addEventListener('click', function() {
    showDoctorModal();
});

document.querySelectorAll('.edit-doctor').forEach(btn => {
    btn.addEventListener('click', function() {
        const doctorId = this.dataset.id;
        editDoctor(doctorId);
    });
});

document.querySelectorAll('.delete-doctor').forEach(btn => {
    btn.addEventListener('click', function() {
        const doctorId = this.dataset.id;
        deleteDoctor(doctorId);
    });
});

// Gestión de Pacientes
document.getElementById('add-patient-btn')?.addEventListener('click', function() {
    showPatientModal();
});

document.querySelectorAll('.edit-patient').forEach(btn => {
    btn.addEventListener('click', function() {
        const patientId = this.dataset.id;
        editPatient(patientId);
    });
});

document.querySelectorAll('.delete-patient').forEach(btn => {
    btn.addEventListener('click', function() {
        const patientId = this.dataset.id;
        deletePatient(patientId);
    });
});

// Modal de Doctor
function showDoctorModal(doctorId = null) {
    const modal = document.getElementById('doctor-modal');
    const title = document.getElementById('doctor-modal-title');
    
    if (doctorId) {
        title.textContent = 'Editar Doctor';
        document.getElementById('doctor-id').value = doctorId;
        // Simular carga de datos
        loadDoctorData(doctorId);
    } else {
        title.textContent = 'Agregar Nuevo Doctor';
        document.getElementById('doctor-form').reset();
    }
    
    modal.style.display = 'flex';
}

function loadDoctorData(doctorId) {
    // Simular carga de datos del doctor
    setTimeout(() => {
        document.getElementById('doctor-firstname').value = 'Laura';
        document.getElementById('doctor-lastname').value = 'Martínez';
        document.getElementById('doctor-email').value = 'laura.martinez@clinica.com';
        document.getElementById('doctor-phone').value = '+57 301 987 6543';
        document.getElementById('doctor-specialty').value = 'cardiology';
        document.getElementById('doctor-license').value = 'LIC-001';
        document.getElementById('doctor-status').value = 'active';
    }, 300);
}

function editDoctor(doctorId) {
    showDoctorModal(doctorId);
}

function deleteDoctor(doctorId) {
    if (confirm('¿Estás seguro de eliminar este doctor?')) {
        // Simular eliminación
        setTimeout(() => {
            alert('Doctor eliminado correctamente');
            location.reload();
        }, 500);
    }
}

// Modal de Paciente
function showPatientModal(patientId = null) {
    const modal = document.getElementById('patient-modal');
    const title = document.getElementById('patient-modal-title');
    
    if (patientId) {
        title.textContent = 'Editar Paciente';
        document.getElementById('patient-id').value = patientId;
        // Simular carga de datos
        loadPatientData(patientId);
    } else {
        title.textContent = 'Agregar Nuevo Paciente';
        document.getElementById('patient-form').reset();
    }
    
    modal.style.display = 'flex';
}

function loadPatientData(patientId) {
    // Simular carga de datos del paciente
    setTimeout(() => {
        document.getElementById('patient-firstname').value = 'Juan';
        document.getElementById('patient-lastname').value = 'Pérez';
        document.getElementById('patient-email').value = 'juan.perez@example.com';
        document.getElementById('patient-phone').value = '+57 300 123 4567';
        document.getElementById('patient-birthdate').value = '1978-04-12';
        document.getElementById('patient-gender').value = 'male';
        document.getElementById('patient-address').value = 'Calle Luna 123, Cuernavaca';
        document.getElementById('patient-status').value = 'active';
    }, 300);
}

function editPatient(patientId) {
    showPatientModal(patientId);
}

function deletePatient(patientId) {
    if (confirm('¿Estás seguro de eliminar este paciente?')) {
        // Simular eliminación
        setTimeout(() => {
            alert('Paciente eliminado correctamente');
            location.reload();
        }, 500);
    }
}

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Formularios
document.getElementById('doctor-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    saveDoctor();
});

document.getElementById('patient-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    savePatient();
});

// Funciones CRUD
async function saveDoctor() {
    const formData = new FormData(document.getElementById('doctor-form'));
    const doctorId = document.getElementById('doctor-id').value;
    
    try {
        // Simular guardado
        setTimeout(() => {
            alert(doctorId ? 'Doctor actualizado exitosamente' : 'Doctor creado exitosamente');
            document.getElementById('doctor-modal').style.display = 'none';
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el doctor');
    }
}

async function savePatient() {
    const formData = new FormData(document.getElementById('patient-form'));
    const patientId = document.getElementById('patient-id').value;
    
    try {
        // Simular guardado
        setTimeout(() => {
            alert(patientId ? 'Paciente actualizado exitosamente' : 'Paciente creado exitosamente');
            document.getElementById('patient-modal').style.display = 'none';
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el paciente');
    }
}

// Configuración
function guardarConfiguracion() {
    const config = {
        'nombre_clinica': document.getElementById('clinic-name').value,
        'telefono_clinica': document.getElementById('clinic-phone').value,
        'duracion_citas': document.getElementById('appointment-duration').value
    };

    // Simular guardado de configuración
    setTimeout(() => {
        alert('Configuración guardada exitosamente');
    }, 500);
}

// Botones de reportes
document.querySelectorAll('#reports .btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const reportType = this.textContent;
        generarReporte(reportType);
    });
});

function generarReporte(tipo) {
    // Simular generación de reporte
    setTimeout(() => {
        alert(`Reporte de ${tipo} generado exitosamente`);
        // Aquí iría la descarga real del archivo
        if (tipo.includes('PDF')) {
            window.open('#', '_blank');
        }
    }, 1000);
}

// Botones de citas
document.querySelectorAll('#appointments .btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const appointmentId = this.closest('tr').querySelector('td').textContent;
        if (this.querySelector('.fa-edit')) {
            editarCita(appointmentId);
        } else if (this.querySelector('.fa-trash')) {
            eliminarCita(appointmentId);
        }
    });
});

function editarCita(id) {
    alert(`Editando cita: ${id}`);
    // Aquí iría el modal de edición de cita
}

function eliminarCita(id) {
    if (confirm(`¿Eliminar cita ${id}?`)) {
        // Simular eliminación
        setTimeout(() => {
            alert('Cita eliminada correctamente');
            location.reload();
        }, 500);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.querySelector('#settings .btn-success');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarConfiguracion);
    }
    
    // Agregar botón crear usuario si no existe
    if (!document.querySelector('#users .btn-crear-usuario')) {
        const titulo = document.querySelector('#users .section-title');
        const btnCrear = document.createElement('button');
        btnCrear.className = 'btn btn-success btn-crear-usuario';
        btnCrear.textContent = 'Crear Usuario';
        btnCrear.onclick = crearUsuario;
        titulo.appendChild(btnCrear);
    }
    
    // Configurar botones de estado de usuario
    document.querySelectorAll('#users .btn-success, #users .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.closest('tr').querySelector('td').textContent.replace('USR-', '');
            const nuevoEstado = this.classList.contains('btn-success') ? 'Activo' : 'Inactivo';
            cambiarEstadoUsuario(userId, nuevoEstado);
        });
    });
    
    // Configurar botones de pago
    document.querySelectorAll('#reports .btn-success').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.closest('tr').querySelector('td').textContent.replace('FAC-', '');
            marcarComoPagado(paymentId);
        });
    });
});