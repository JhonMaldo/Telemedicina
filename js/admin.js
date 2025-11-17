// ==================== ADMIN.JS CORREGIDO ====================

const API_BASE_URL = '/Telemedicina/Database/php/admin.php';
// Variables globales
let currentSection = 'dashboard';

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin JS inicializado');
    initializeEventListeners();
    loadDashboardStats();
    showSection('dashboard');
    
    setTimeout(addCreateUserButton, 100);
});

// =========================================
//          NAVEGACIÓN ENTRE SECCIONES
// =========================================

function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos los items del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Activar item del menú correspondiente (CORREGIDO)
    const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
    
    updateSectionTitle(sectionId);
    loadSectionData(sectionId);
}

function updateSectionTitle(sectionId) {
    const sectionTitle = document.getElementById('section-title');
    if (!sectionTitle) return;

    const titles = {
        'dashboard': 'Dashboard',
        'doctors': 'Gestión de Doctores',
        'patients': 'Gestión de Pacientes',
        'appointments': 'Citas del Sistema',
        'users': 'Usuarios del Sistema',
        'reports': 'Reportes',
        'settings': 'Configuración'
    };

    sectionTitle.textContent = titles[sectionId] || 'Dashboard';
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard': loadDashboardStats(); break;
        case 'users': cargarUsuarios(); break;
        case 'doctors':
        case 'patients':
        case 'appointments':
        case 'reports':
        case 'settings':
            showNotification('Funcionalidad en desarrollo', 'info');
            break;
    }
}

// =========================================
//       DASHBOARD (SIN JSON)
// =========================================

function loadDashboardStats() {
    const params = new URLSearchParams({
        action: 'obtener_estadisticas'
    });

    fetch(`${API_BASE_URL}?${params.toString()}`)
        .then(response => response.text())
        .then(html => {
            const container = document.querySelector('.dashboard-cards');
            if (container) container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error cargando estadísticas:', error);
            showNotification('Error de conexión con BD', 'error');
        });
}

// =========================================
//      USUARIOS (SIN JSON = TEXTO/HTML)
// =========================================

function cargarUsuarios() {
    showLoading('users');

    const params = new URLSearchParams({
        action: 'obtener_usuarios'
    });

    fetch(`${API_BASE_URL}?${params.toString()}`)
        .then(response => response.text())
        .then(html => {
            hideLoading('users');
            const container = document.querySelector('#users table tbody');
            if (container) container.innerHTML = html;
            showNotification('Usuarios cargados desde BD', 'success');
        })
        .catch(error => {
            hideLoading('users');
            showNotification('Error de conexión con BD', 'error');
        });
}

// =========================================
//          CREAR USUARIO
// =========================================

function addCreateUserButton() {
    const usersSection = document.getElementById('users');
    if (!usersSection) return;

    const sectionTitle = usersSection.querySelector('.section-title');
    if (!sectionTitle || sectionTitle.querySelector('.btn-crear-usuario')) return;

    const btnCrear = document.createElement('button');
    btnCrear.className = 'btn btn-success btn-crear-usuario';
    btnCrear.innerHTML = '<i class="fas fa-plus"></i> Crear Usuario';
    btnCrear.onclick = crearUsuario;

    sectionTitle.appendChild(btnCrear);
}

function crearUsuario() {
    const nombre = prompt('Nombre completo del nuevo usuario:');
    if (!nombre) return;

    const email = prompt('Email:');
    if (!email) return;

    const role = prompt('Rol (Administrador/Doctor/Paciente):');
    if (!role) return;

    const password = prompt('Contraseña:');
    if (!password) return;

    const params = new URLSearchParams({
        action: 'crear_usuario',
        nombre: nombre,
        email: email,
        role: role,
        password: password
    });

    showLoading('users');

    fetch(`${API_BASE_URL}?${params.toString()}`)
        .then(response => response.text())
        .then(resp => {
            hideLoading('users');
            showNotification(resp, 'success');
            cargarUsuarios();
        })
        .catch(error => {
            hideLoading('users');
            showNotification('Error de conexión con el servidor', 'error');
        });
}

// =========================================
//      ACTIVAR / DESACTIVAR USUARIO
// =========================================

function cambiarEstadoUsuario(id, estado) {
    if (!confirm(`¿Estás seguro de ${estado === 'Activo' ? 'activar' : 'desactivar'} este usuario?`)) return;

    const params = new URLSearchParams({
        action: 'actualizar_estado_usuario',
        id_usuario: id,
        nuevo_estado: estado
    });

    fetch(`${API_BASE_URL}?${params.toString()}`)
        .then(response => response.text())
        .then(resp => {
            showNotification(resp, 'success');
            cargarUsuarios();
        })
        .catch(error => {
            showNotification('Error de conexión con el servidor', 'error');
        });
}

function editarUsuario(id) {
    showNotification('Funcionalidad de edición en desarrollo', 'info');
}

// =========================================
//               EVENTOS
// =========================================

function initializeEventListeners() {
    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.addEventListener('click', function() {
            showSection(this.getAttribute('data-section'));
        });
    });

    // Cerrar sesión
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.textContent.includes('Cerrar Sesión')) {
            item.addEventListener('click', function() {
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    showNotification('Sesión cerrada', 'info');
                }
            });
        }
    });

    initializeModals();
}

// =========================================
//                MODALES
// =========================================

function initializeModals() {
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });

    const addDoctorBtn = document.getElementById('add-doctor-btn');
    if (addDoctorBtn)
        addDoctorBtn.addEventListener('click', () => {
            document.getElementById('doctor-modal').style.display = 'flex';
        });

    const addPatientBtn = document.getElementById('add-patient-btn');
    if (addPatientBtn)
        addPatientBtn.addEventListener('click', () => {
            document.getElementById('patient-modal').style.display = 'flex';
        });
}

// =========================================
//              UTILIDADES
// =========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString('es-ES') : 'Nunca';
}

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    
    toast.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showLoading(section) {
    const sectionElement = document.getElementById(section);
    if (!sectionElement) return;

    if (!sectionElement.querySelector('.section-loader')) {
        const loader = document.createElement('div');
        loader.className = 'section-loader';
        loader.innerHTML = '<div class="loading-spinner"></div><p>Cargando...</p>';
        loader.style.cssText = 'text-align: center; padding: 40px; color: #666;';
        sectionElement.appendChild(loader);
    }
}

function hideLoading(section) {
    const sectionElement = document.getElementById(section);
    if (!sectionElement) return;

    const loader = sectionElement.querySelector('.section-loader');
    if (loader) loader.remove();
}

function getNotificationIcon(type) {
    return {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    }[type] || 'info-circle';
}

function getNotificationColor(type) {
    return {
        'success': '#2ecc71',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    }[type] || '#3498db';
}

// Estilos
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 2s linear infinite;
        margin: 0 auto 10px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Exportar
window.showSection = showSection;
window.crearUsuario = crearUsuario;
window.cambiarEstadoUsuario = cambiarEstadoUsuario;
window.editarUsuario = editarUsuario;

console.log('Panel de administración listo');