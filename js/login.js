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
    resetForgotForms(); // Resetear formularios al mostrar
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
        
        updateLoginUI();
        
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
    
    if (sectionId === 'login-section') {
        updateLoginUI();
    }
}

// Actualizar formulario de registro según el tipo de usuario
function updateRegisterForm() {
    const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
    
    patientRegisterForm.classList.add('hidden');
    doctorRegisterForm.classList.add('hidden');
    adminRegisterForm.classList.add('hidden');
    adminRegisterInfo.classList.add('hidden');
    
    if (activeType === 'patient') {
        patientRegisterForm.classList.remove('hidden');
        registerTitle.textContent = 'Registrarse como Paciente';
        registerSubtitle.textContent = 'Crea una nueva cuenta de paciente';
    } else if (activeType === 'doctor') {
        doctorRegisterForm.classList.remove('hidden');
        registerTitle.textContent = 'Registrarse como Doctor';
        registerSubtitle.textContent = 'Crea una nueva cuenta de doctor';
    } else if (activeType === 'admin') {
        adminRegisterForm.classList.add('hidden');
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

// ========== FUNCIONES DE LOGIN ==========

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validateLoginForm()) {
        const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const btn = this.querySelector('.btn');
        const originalText = btn.textContent;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading">⏳ Verificando...</span>';
        
        try {
            const response = await fetch('DataBase/php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    tipo: activeType
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('user', JSON.stringify(result.user));
                alert(result.message);
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión. Verifica tu internet.');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
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
            direccion: '',
            contacto_emergencia: ''
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
            bio: ''
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

// Deshabilitar registro de administradores
document.getElementById('admin-register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('El registro de administradores no está disponible para el público.');
});

// ========== FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ==========

document.getElementById('forgot-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (validateForgotForm()) {
        const email = document.getElementById('forgot-email').value;
        const btn = this.querySelector('.btn');
        const originalText = btn.textContent;

        btn.disabled = true;
        btn.innerHTML = '<span class="loading">⏳ Enviando código...</span>';

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

            // Verificar si la respuesta es OK (status 200-299)
            if (!response.ok) {
                // Si el servidor devuelve un error, intentar leer el mensaje de error
                const errorText = await response.text();
                throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                document.getElementById('forgot-email-section').style.display = 'none';
                document.getElementById('forgot-code-section').style.display = 'block';

                document.getElementById('forgot-code-section').dataset.email = email;
                document.getElementById('user-email-display').textContent = email;

                alert('✅ ' + result.message);
            } else {
                alert('❌ ' + result.message);
            }
        } catch (error) {
            console.error('Error completo:', error);
            // Mostrar el mensaje de error específico si está disponible
            alert('❌ ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
});
// Formulario de código de verificación
// Formulario de código de verificación - VERSIÓN CORREGIDA
document.getElementById('code-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('🔍 Iniciando restablecimiento de contraseña...');
    
    const email = document.getElementById('forgot-code-section').dataset.email;
    const codigo = document.getElementById('verification-code').value;
    const nuevaPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const btn = this.querySelector('.btn');
    const originalText = btn.textContent;
    
    // Validaciones
    if (!codigo || codigo.length !== 6) {
        alert('❌ Por favor ingresa un código de 6 dígitos');
        return;
    }
    
    if (!nuevaPassword || !confirmPassword) {
        alert('❌ Por favor completa ambos campos de contraseña');
        return;
    }
    
    if (nuevaPassword !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }
    
    if (nuevaPassword.length < 8) {
        alert('❌ La contraseña debe tener al menos 8 caracteres');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<span class="loading">⏳ Actualizando contraseña...</span>';
    
    try {
        console.log('📤 Enviando petición a reset-password.php');
        console.log('📧 Email:', email);
        console.log('🔢 Código:', codigo);
        
        const response = await fetch('DataBase/php/reset-password.php', {
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
        
        console.log('📨 Status de respuesta:', response.status);
        
        // Obtener la respuesta como texto primero
        const responseText = await response.text();
        console.log('📄 Respuesta cruda:', responseText);
        
<<<<<<< HEAD
        document.getElementById('admin-register-form').addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateAdminRegisterForm()) {
                // Aquí iría la lógica para enviar los datos al servidor
                alert('Solicitud de registro de administrador enviada (simulación)');
                window.location.href = 'login.html';
            }
        });
        
        document.getElementById('forgot-form').addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForgotForm()) {
                document.getElementById('forgot-success').style.display = 'block';
                // Aquí iría la lógica para enviar el correo de recuperación
            }
        });
        
        function validateLoginForm() {
            let isValid = true;
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
            
            // Validar email
            if (!validateEmail(email)) {
                showError('login-email-error', 'Por favor ingresa un correo electrónico válido');
                isValid = false;
            } else {
                hideError('login-email-error');
            }
            
            // Validar contraseña
            if (password.length < 6) {
                showError('login-password-error', 'La contraseña debe tener al menos 6 caracteres');
                isValid = false;
            } else {
                hideError('login-password-error');
            }
            
            if (isValid) {
                // Enviar datos al servidor
                loginUser(email, password, activeType);
            }
            
            return false; // Prevenir envío normal del formulario
        }

        function loginUser(email, password, userType) {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('user_type', userType);
            
            fetch('login.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.href = data.redirect;
                } else {
                    showError('login-password-error', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('login-password-error', 'Error de conexión');
            });
=======
        if (!responseText.trim()) {
            throw new Error('El servidor devolvió una respuesta vacía');
>>>>>>> origin/master
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            throw new Error('El servidor devolvió una respuesta inválida');
        }
        
        console.log('✅ JSON parseado correctamente:', result);
        
        if (result.success) {
            alert('✅ ' + result.message);
            showSection('login-section');
            resetForgotForms();
            
            // Limpiar campos del login por si acaso
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            
        } else {
            alert('❌ ' + result.message);
        }
        
<<<<<<< HEAD
        function validateAdminRegisterForm() {
            let isValid = true;
            
            // Validar nombre
            const name = document.getElementById('admin-name').value;
            if (name.trim().length < 2) {
                showError('admin-name-error', 'El nombre debe tener al menos 2 caracteres');
                isValid = false;
            } else {
                hideError('admin-name-error');
            }
            
            // Validar email
            const email = document.getElementById('admin-email').value;
            if (!validateEmail(email)) {
                showError('admin-email-error', 'Por favor ingresa un correo electrónico válido');
                isValid = false;
            } else {
                hideError('admin-email-error');
            }
            
            // Validar teléfono
            const phone = document.getElementById('admin-phone').value;
            if (!validatePhone(phone)) {
                showError('admin-phone-error', 'Por favor ingresa un número de teléfono válido');
                isValid = false;
            } else {
                hideError('admin-phone-error');
            }
            
            // Validar departamento
            const department = document.getElementById('admin-department').value;
            if (!department) {
                showError('admin-department-error', 'Por favor selecciona tu departamento');
                isValid = false;
            } else {
                hideError('admin-department-error');
            }
            
            // Validar código de verificación
            const code = document.getElementById('admin-code').value;
            if (!code.trim()) {
                showError('admin-code-error', 'Por favor ingresa el código de verificación');
                isValid = false;
            } else {
                hideError('admin-code-error');
            }
            
            // Validar contraseña (más estricta para administradores)
            const password = document.getElementById('admin-password').value;
            if (!validateAdminPassword(password)) {
                showError('admin-password-error', 'La contraseña debe tener al menos 10 caracteres, incluyendo una mayúscula, un número y un carácter especial');
                isValid = false;
            } else {
                hideError('admin-password-error');
            }
            
            // Validar confirmación de contraseña
            const confirmPassword = document.getElementById('admin-confirm-password').value;
            if (password !== confirmPassword) {
                showError('admin-confirm-password-error', 'Las contraseñas no coinciden');
                isValid = false;
            } else {
                hideError('admin-confirm-password-error');
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
            // Al menos 8 caracteres, una mayúscula, un número y un carácter especial
            const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            return re.test(password);
        }
        
        function validateAdminPassword(password) {
            // Al menos 10 caracteres, una mayúscula, un número y un carácter especial (más estricto)
            const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
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
        
        // Inicializar la interfaz
        updateLoginUI();

        // En la función updateLoginUI, agregar:
function updateLoginUI() {
    const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
    document.getElementById('login-user-type').value = activeType;
    // ... resto del código
}

// En la función updateRegisterForm, agregar:
function updateRegisterForm() {
    const activeType = document.querySelector('.user-type.active').getAttribute('data-type');
    // Actualizar los hidden fields en cada formulario
    document.querySelectorAll('input[name="user_type"]').forEach(input => {
        input.value = activeType;
    });
    // ... resto del código
}

// Función para manejar registro
function registerUser(formData, userType) {
    fetch('register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error de red: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response:', data);
        if (data.success) {
            alert(data.message);
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión: ' + error.message);
    });
}

// En cada formulario de registro, actualiza el event listener:
document.getElementById('patient-register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (validatePatientRegisterForm()) {
        const formData = new FormData(this);
        registerUser(formData, 'patient');
    }
});
=======
    } catch (error) {
        console.error('💥 Error completo:', error);
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// Volver al formulario de email
document.getElementById('back-to-email').addEventListener('click', function(e) {
    e.preventDefault();
    resetForgotForms();
});

// Función para resetear formularios de recuperación
function resetForgotForms() {
    document.getElementById('forgot-email-section').style.display = 'block';
    document.getElementById('forgot-code-section').style.display = 'none';
    document.getElementById('forgot-email').value = '';
    document.getElementById('verification-code').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
    document.getElementById('user-email-display').textContent = '';
}

// ========== FUNCIONES DE VALIDACIÓN ==========

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

// Inicializar la interfaz
updateLoginUI();
>>>>>>> origin/master
