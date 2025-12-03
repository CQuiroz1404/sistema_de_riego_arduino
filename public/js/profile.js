// Profile.js - Profile management functionality

document.addEventListener('DOMContentLoaded', () => {
  console.log('Profile.js loaded');
  
  // Actualizar perfil
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        nombre: document.getElementById('nombre').value
      };
      
      const messageDiv = document.getElementById('profileMessage');
      messageDiv.classList.add('hidden');
      
      try {
        const response = await fetch('/profile/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-xs md:text-sm';
          messageDiv.textContent = data.message;
          messageDiv.classList.remove('hidden');
          setTimeout(() => location.reload(), 1500);
        } else {
          messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-xs md:text-sm';
          messageDiv.textContent = data.message;
          messageDiv.classList.remove('hidden');
        }
      } catch (error) {
        messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-xs md:text-sm';
        messageDiv.textContent = 'Error al actualizar perfil';
        messageDiv.classList.remove('hidden');
      }
    });
  }
  
  // Cambiar contraseña
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
      };
      
      const messageDiv = document.getElementById('passwordMessage');
      messageDiv.classList.add('hidden');
      
      try {
        const response = await fetch('/profile/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative';
          messageDiv.textContent = data.message;
          messageDiv.classList.remove('hidden');
          document.getElementById('passwordForm').reset();
        } else {
          messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
          messageDiv.textContent = data.message;
          messageDiv.classList.remove('hidden');
        }
      } catch (error) {
        messageDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
        messageDiv.textContent = 'Error al cambiar contraseña';
        messageDiv.classList.remove('hidden');
      }
    });
  }
  
  const avatarInput = document.getElementById('avatarInput');
  const deleteBtn = document.getElementById('deleteAvatarBtn');
  
  console.log('Avatar input found:', avatarInput !== null);
  console.log('Delete button found:', deleteBtn !== null);
  
  // Subir avatar
  if (avatarInput) {
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      
      console.log('=== AVATAR UPLOAD STARTED ===');
      console.log('File selected:', file);
      
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        alert('El archivo es demasiado grande. Máximo 5MB.');
        e.target.value = '';
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        alert('Solo se permiten archivos de imagen.');
        e.target.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log('FormData created, sending to server...');

      try {
        const response = await fetch('/profile/upload-avatar', {
          method: 'POST',
          body: formData
        });

        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
          console.log('SUCCESS! Avatar uploaded');
          // Recargar página para actualizar avatar en todas las vistas (navbar incluido)
          location.reload();
        } else {
          console.error('Server returned error:', data.message);
          alert('Error: ' + data.message);
          e.target.value = '';
        }
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Error al subir la foto de perfil: ' + error.message);
        e.target.value = '';
      }
    });
  } else {
    console.error('Avatar input not found!');
  }

  // Eliminar avatar
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      console.log('Delete button clicked');
      
      if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
        console.log('User cancelled delete');
        return;
      }

      try {
        const response = await fetch('/profile/delete-avatar', {
          method: 'DELETE'
        });

        const data = await response.json();
        console.log('Delete response:', data);

        if (data.success) {
          alert(data.message);
          location.reload();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error al eliminar la foto de perfil');
      }
    });
  }
});
