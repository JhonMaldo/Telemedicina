// ==================== JS MÍNIMO PARA admin.php ====================

// RF-17: Gestión de usuarios
function cargarUsuarios() {
    fetch('php/admin.php', {  // ← CAMBIADO A admin.php
        method: 'POST',
        body: 'action=obtener_usuarios'
    })
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
    const role = prompt('Rol (Administrador/Doctor/Paciente):');
    const password = prompt('Contraseña:');
    
    if (nombre && email && role && password) {
        fetch('php/admin.php', {  // ← CAMBIADO A admin.php
            method: 'POST',
            body: `action=crear_usuario&nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&role=${role}&password=${password}`
        })
        .then(r => r.json())
        .then(data => {
            alert(data.success ? 'Usuario creado' : data.error);
            if (data.success) cargarUsuarios();
        });
    }
}

function cambiarEstadoUsuario(id, estado) {
    if (confirm(`¿${estado === 'Activo' ? 'Activar' : 'Desactivar'} usuario?`)) {
        fetch('php/admin.php', {  // ← CAMBIADO A admin.php
            method: 'POST',
            body: `action=actualizar_estado_usuario&id_usuario=${id}&nuevo_estado=${estado}`
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) cargarUsuarios();
        });
    }
}

// RF-18: Gestión de facturación
function cargarFacturas() {
    fetch('php/admin.php', {  // ← CAMBIADO A admin.php
        method: 'POST',
        body: 'action=obtener_facturas'
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const tbody = document.querySelector('#reports table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            data.data.forEach(factura => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>FAC-${factura.id_pagos}</td>
                    <td>${factura.paciente_nombre || 'N/A'}</td>
                    <td>$${factura.cantidad}</td>
                    <td>${new Date(factura.creado_en).toLocaleDateString()}</td>
                    <td><span class="status-badge ${factura.status === 'pagado' ? 'status-active' : 'status-warning'}">${factura.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="marcarComoPagado(${factura.id_pagos})" ${factura.status === 'pagado' ? 'disabled' : ''}>
                            Pagar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
}

function marcarComoPagado(idPago) {
    if (confirm('¿Marcar como pagado?')) {
        fetch('php/admin.php', {  // ← CAMBIADO A admin.php
            method: 'POST',
            body: `action=actualizar_estado_pago&id_pago=${idPago}&nuevo_estado=pagado`
        })
        .then(r => r.json())
        .then(data => {
            alert(data.success ? 'Pago actualizado' : 'Error');
            if (data.success) cargarFacturas();
        });
    }
}

// Configuración
function guardarConfiguracion() {
    const config = {
        'nombre_clinica': document.getElementById('clinic-name').value,
        'telefono_clinica': document.getElementById('clinic-phone').value,
        'duracion_citas': document.getElementById('appointment-duration').value
    };

    fetch('php/admin.php', {  // ← CAMBIADO A admin.php
        method: 'POST',
        body: `action=actualizar_configuracion&configuraciones=${JSON.stringify(config)}`
    })
    .then(r => r.json())
    .then(data => {
        alert(data.success ? 'Configuración guardada' : 'Error');
    });
}

// Inicialización - Agrega esto a tu showSection existente
function showSection(sectionId) {
    // ... tu código existente ...
    
    // Agregar estas líneas al final:
    if (sectionId === 'users') {
        cargarUsuarios();
        // Agregar botón crear usuario si no existe
        if (!document.querySelector('#users .btn-crear-usuario')) {
            const titulo = document.querySelector('#users .section-title');
            titulo.innerHTML += '<button class="btn btn-success btn-crear-usuario" onclick="crearUsuario()">Crear Usuario</button>';
        }
    }
    if (sectionId === 'reports') cargarFacturas();
}

// Agregar al final del DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.querySelector('#settings .btn-success');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarConfiguracion);
    }
});