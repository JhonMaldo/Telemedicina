

// RF-17 COMPLETO: Gestión de usuarios (CRUD completo)
function cargarUsuarios() {
    fetch('php/admin_backend.php', {method: 'POST', body: 'action=obtener_usuarios'})
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const tbody = document.querySelector('#users table tbody');
            tbody.innerHTML = '';
            
            data.data.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>USR-${usuario.id_usuario}</td>
                    <td>${usuario.nombre_completo}</td>
                    <td>${usuario.corre_electronico}</td>
                    <td>${usuario.role}</td>
                    <td><span class="status-badge ${usuario.status === 'Activo' ? 'status-active' : 'status-inactive'}">${usuario.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editarUsuario(${usuario.id_usuario})">Editar</button>
                        <button class="btn btn-sm ${usuario.status === 'Activo' ? 'btn-danger' : 'btn-success'}" 
                                onclick="cambiarEstadoUsuario(${usuario.id_usuario}, '${usuario.status === 'Activo' ? 'Inactivo' : 'Activo'}')">
                            ${usuario.status === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
}

function crearUsuario() {
    const nombre = prompt('Nombre completo:');
    const email = prompt('Email:');
    const rol = prompt('Rol (Administrador/Doctor/Paciente):');
    const password = prompt('Contraseña:');
    
    if (nombre && email && rol && password) {
        fetch('php/admin_backend.php', {
            method: 'POST',
            body: `action=crear_usuario&nombre=${nombre}&email=${email}&role=${rol}&password=${password}`
        })
        .then(r => r.json())
        .then(data => {
            alert(data.success ? 'Usuario creado' : 'Error');
            if (data.success) cargarUsuarios();
        });
    }
}

function editarUsuario(id) {
    const nuevoRol = prompt('Nuevo rol (Administrador/Doctor/Paciente):');
    if (nuevoRol) {
        fetch('php/admin_backend.php', {
            method: 'POST', 
            body: `action=editar_usuario&id_usuario=${id}&nuevo_role=${nuevoRol}`
        })
        .then(r => r.json())
        .then(data => {
            alert(data.success ? 'Usuario actualizado' : 'Error');
            if (data.success) cargarUsuarios();
        });
    }
}

function cambiarEstadoUsuario(id, estado) {
    if (confirm(`¿${estado === 'Activo' ? 'Activar' : 'Desactivar'} usuario?`)) {
        fetch('php/admin_backend.php', {
            method: 'POST',
            body: `action=actualizar_estado_usuario&id_usuario=${id}&nuevo_estado=${estado}`
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) cargarUsuarios();
        });
    }
}

// RF-18 COMPLETO: Configuración de seguridad
function cargarPoliticasSeguridad() {
    fetch('php/admin_backend.php', {method: 'POST', body: 'action=obtener_politicas'})
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data) {
            document.getElementById('longitud-password').value = data.data.longitud_minima_password || 8;
            document.getElementById('dias-validez').value = data.data.dias_validez_password || 90;
        }
    });
}

function guardarPoliticasSeguridad() {
    const politicas = {
        longitud_minima_password: document.getElementById('longitud-password').value,
        dias_validez_password: document.getElementById('dias-validez').value,
        requiere_mayusculas: document.getElementById('requiere-mayusculas').checked,
        requiere_numeros: document.getElementById('requiere-numeros').checked
    };

    fetch('php/admin_backend.php', {
        method: 'POST',
        body: `action=actualizar_politicas&politicas=${JSON.stringify(politicas)}`
    })
    .then(r => r.json())
    .then(data => {
        alert(data.success ? 'Políticas guardadas' : 'Error');
    });
}

// Inicialización
function showSection(sectionId) {
    // ... tu código existente ...
    
    // Agregar estas líneas:
    if (sectionId === 'users') {
        cargarUsuarios();
        // Agregar botón crear usuario si no existe
        if (!document.querySelector('#users .btn-success')) {
            const titulo = document.querySelector('#users .section-title');
            titulo.innerHTML += '<button class="btn btn-success" onclick="crearUsuario()">Crear Usuario</button>';
        }
    }
    if (sectionId === 'settings') cargarPoliticasSeguridad();
}

// Agregar al final del DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.querySelector('#settings .btn-success');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarPoliticasSeguridad);
});