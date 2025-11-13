// Elementos del DOM
const userTypeSelector = document.querySelectorAll('.user-type');
const formSections = document.querySelectorAll('.form-section');
const patientRegisterForm = document.getElementById('patient-register-form');
const doctorRegisterForm = document.getElementById('doctor-register-form');
const adminRegisterForm = document.getElementById('admin-register-form');
const adminLoginInfo = document.getElementById('admin-login-info');
const adminRegisterInfo = document.getElementById('admin-register-info');
const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');
const registerTitle = document.getElementById('register-title');
const registerSubtitle = document.getElementById('register-subtitle');
const loginButton = document.getElementById('login-button');

// Mostrar/ocultar secciones
document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('register-section');
    updateRegisterForm();
});

document.getElementById('show-forgot').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('forgot-section');
});

document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('login-section');
    updateLoginUI();
});

document.getElementById('show-login-from-forgot').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('login-section');
    updateLoginUI();
});

// Cambiar tipo de usuario
userTypeSelector.forEach(type => {
    type.addEventListener('click', function() {
        userTypeSelector.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Actualizar la interfaz según el tipo de usuario
        updateLoginUI();
        
        // Si estamos en la sección de registro, actualizar el formulario
        if (document.getElementById('register-section').classList.contains('active')) {
            updateRegisterForm();
        }
    });
});

// Función para mostrar sección
function showSection(sectionId) {
    formSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Actualizar la interfaz según el tipo de usuario
    if (sectionId === 'login-section') {
        updateLoginUI();
    }
}

// Actualizar formulario de registro según el tipo de usuario
function updateRegisterForm() {
    const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
    
    // Ocultar todos los formularios primero
    patientRegisterForm.classList.add('hidden');
    doctorRegisterForm.classList.add('hidden');
    adminRegisterForm.classList.add('hidden');
    adminRegisterInfo.classList.add('hidden');
    
    // Mostrar el formulario correspondiente
    if (activeType === 'patient') {
        patientRegisterForm.classList.remove('hidden');
        registerTitle.textContent = 'Registrarse como Paciente';
        registerSubtitle.textContent = 'Crea una nueva cuenta de paciente';
    } else if (activeType === 'doctor') {
        doctorRegisterForm.classList.remove('hidden');
        registerTitle.textContent = 'Registrarse como Doctor';
        registerSubtitle.textContent = 'Crea una nueva cuenta de doctor';
    } else if (activeType === 'admin') {
        adminRegisterForm.classList.add('hidden'); // Ocultar registro de admin
        adminRegisterInfo.classList.remove('hidden');
        registerTitle.textContent = 'Registro no disponible';
        registerSubtitle.textContent = 'El registro de administradores no está disponible';
    }
}

// Actualizar la interfaz de login según el tipo de usuario
function updateLoginUI() {
    const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
    
    if (activeType === 'patient') {
        loginTitle.textContent = 'Iniciar Sesión como Paciente';
        loginSubtitle.textContent = 'Accede a tu cuenta de paciente';
        loginButton.textContent = 'Iniciar Sesión';
        adminLoginInfo.classList.add('hidden');
    } else if (activeType === 'doctor') {
        loginTitle.textContent = 'Iniciar Sesión como Doctor';
        loginSubtitle.textContent = 'Accede a tu cuenta de doctor';
        loginButton.textContent = 'Iniciar Sesión';
        adminLoginInfo.classList.add('hidden');
    } else if (activeType === 'admin') {
        loginTitle.textContent = 'Acceso de Administrador';
        loginSubtitle.textContent = 'Panel de control del sistema';
        loginButton.textContent = 'Acceder al Panel Admin';
        adminLoginInfo.classList.remove('hidden');
    }
}

// ========== FUNCIONES DE LOGIN CON PHP ==========

// Login
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validateLoginForm()) {
        const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('DataBase/php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Guardar datos del usuario en localStorage
                localStorage.setItem('user', JSON.stringify(result.user));
                alert('Login exitoso');
                window.location.href = result.redirect;
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
});

// Registro de Paciente
document.getElementById('patient-register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validatePatientRegisterForm()) {
        const formData = {
            tipo: 'paciente',
            nombre: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            password: document.getElementById('patient-password').value,
            telefono: document.getElementById('patient-phone').value,
            fecha_nacimiento: document.getElementById('patient-birthdate').value,
            genero: document.getElementById('patient-gender').value,
            direccion: '', // Puedes agregar campo si lo necesitas
            contacto_emergencia: '' // Puedes agregar campo si lo necesitas
        };
        
        try {
            const response = await fetch('DataBase/php/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                showSection('login-section');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
});

// Registro de Doctor
document.getElementById('doctor-register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validateDoctorRegisterForm()) {
        const formData = {
            tipo: 'doctor',
            nombre: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            password: document.getElementById('doctor-password').value,
            telefono: document.getElementById('doctor-phone').value,
            especialidad: document.getElementById('doctor-specialty').value,
            licencia: document.getElementById('doctor-license').value,
            bio: '' // Puedes agregar campo si lo necesitas
        };
        
        try {
            const response = await fetch('register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                showSection('login-section');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
});

// Deshabilitar registro de administradores
document.getElementById('admin-register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('El registro de administradores no está disponible para el público.');
});

// ========== FUNCIONES DE VALIDACIÓN (MANTENIDAS) ==========

function validateLoginForm() {
    let isValid = true;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateEmail(email)) {
        showError('login-email-error', 'Por favor ingresa un correo electrónico válido');
        isValid = false;
    } else {
        hideError('login-email-error');
    }
    
    if (password.length < 6) {
        showError('login-password-error', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        hideError('login-password-error');
    }
    
    return isValid;
}

function validatePatientRegisterForm() {
    let isValid = true;
    
    const name = document.getElementById('patient-name').value;
    if (name.trim().length < 2) {
        showError('patient-name-error', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    } else {
        hideError('patient-name-error');
    }
    
    const email = document.getElementById('patient-email').value;
    if (!validateEmail(email)) {
        showError('patient-email-error', 'Por favor ingresa un correo electrónico válido');
        isValid = false;
    } else {
        hideError('patient-email-error');
    }
    
    const phone = document.getElementById('patient-phone').value;
    if (!validatePhone(phone)) {
        showError('patient-phone-error', 'Por favor ingresa un número de teléfono válido');
        isValid = false;
    } else {
        hideError('patient-phone-error');
    }
    
    const birthdate = document.getElementById('patient-birthdate').value;
    if (!birthdate) {
        showError('patient-birthdate-error', 'Por favor ingresa tu fecha de nacimiento');
        isValid = false;
    } else {
        hideError('patient-birthdate-error');
    }
    
    const gender = document.getElementById('patient-gender').value;
    if (!gender) {
        showError('patient-gender-error', 'Por favor selecciona tu género');
        isValid = false;
    } else {
        hideError('patient-gender-error');
    }
    
    const password = document.getElementById('patient-password').value;
    if (!validatePassword(password)) {
        showError('patient-password-error', 'La contraseña no cumple con los requisitos');
        isValid = false;
    } else {
        hideError('patient-password-error');
    }
    
    const confirmPassword = document.getElementById('patient-confirm-password').value;
    if (password !== confirmPassword) {
        showError('patient-confirm-password-error', 'Las contraseñas no coinciden');
        isValid = false;
    } else {
        hideError('patient-confirm-password-error');
    }
    
    return isValid;
}

function validateDoctorRegisterForm() {
    let isValid = true;
    
    const name = document.getElementById('doctor-name').value;
    if (name.trim().length < 2) {
        showError('doctor-name-error', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    } else {
        hideError('doctor-name-error');
    }
    
    const email = document.getElementById('doctor-email').value;
    if (!validateEmail(email)) {
        showError('doctor-email-error', 'Por favor ingresa un correo electrónico válido');
        isValid = false;
    } else {
        hideError('doctor-email-error');
    }
    
    const phone = document.getElementById('doctor-phone').value;
    if (!validatePhone(phone)) {
        showError('doctor-phone-error', 'Por favor ingresa un número de teléfono válido');
        isValid = false;
    } else {
        hideError('doctor-phone-error');
    }
    
    const specialty = document.getElementById('doctor-specialty').value;
    if (!specialty.trim()) {
        showError('doctor-specialty-error', 'Por favor ingresa tu especialidad');
        isValid = false;
    } else {
        hideError('doctor-specialty-error');
    }
    
    const license = document.getElementById('doctor-license').value;
    if (!license.trim()) {
        showError('doctor-license-error', 'Por favor ingresa tu número de licencia');
        isValid = false;
    } else {
        hideError('doctor-license-error');
    }
    
    const password = document.getElementById('doctor-password').value;
    if (!validatePassword(password)) {
        showError('doctor-password-error', 'La contraseña no cumple con los requisitos');
        isValid = false;
    } else {
        hideError('doctor-password-error');
    }
    
    const confirmPassword = document.getElementById('doctor-confirm-password').value;
    if (password !== confirmPassword) {
        showError('doctor-confirm-password-error', 'Las contraseñas no coinciden');
        isValid = false;
    } else {
        hideError('doctor-confirm-password-error');
    }
    
    return isValid;
}

function validateForgotForm() {
    let isValid = true;
    const email = document.getElementById('forgot-email').value;
    
    if (!validateEmail(email)) {
        showError('forgot-email-error', 'Por favor ingresa un correo electrónico válido');
        isValid = false;
    } else {
        hideError('forgot-email-error');
    }
    
    return isValid;
}

// Funciones auxiliares de validación
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9+\-\s()]{10,}$/;
    return re.test(phone);
}

function validatePassword(password) {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = 'none';
}


// ========== FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ==========

document.getElementById('forgot-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validateForgotForm()) {
        const email = document.getElementById('forgot-email').value;
        
        try {
            const response = await fetch('DataBase/php/recuperar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Ocultar formulario de email y mostrar formulario de código
                document.getElementById('forgot-form').style.display = 'none';
                document.getElementById('code-form').style.display = 'block';
                document.getElementById('forgot-success').style.display = 'none';
                
                // Guardar el email para usarlo después
                document.getElementById('code-form').dataset.email = email;
                
                // Mostrar código en desarrollo (quitar en producción)
                if (result.codigo) {
                    alert(`Código de verificación (solo desarrollo): ${result.codigo}`);
                }
                
                alert('Código de recuperación enviado a tu email');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
});

// Formulario de código de verificación
document.getElementById('code-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.dataset.email;
    const codigo = document.getElementById('verification-code').value;
    const nuevaPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!codigo || !nuevaPassword || !confirmPassword) {
        alert('Todos los campos son requeridos');
        return;
    }
    
    if (nuevaPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    if (!validatePassword(nuevaPassword)) {
        alert('La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial');
        return;
    }
    
    try {
        const response = await fetch('DataBase/php/reset_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                codigo: codigo,
                nueva_password: nuevaPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Contraseña actualizada exitosamente');
            showSection('login-section');
            // Resetear formularios
            resetForgotForms();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
});

function resetForgotForms() {
    document.getElementById('forgot-form').style.display = 'block';
    document.getElementById('code-form').style.display = 'none';
    document.getElementById('forgot-email').value = '';
    document.getElementById('verification-code').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
}

// Inicializar la interfaz
updateLoginUI();