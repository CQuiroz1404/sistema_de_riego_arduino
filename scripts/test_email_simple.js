require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmail() {
  console.log('📧 Probando servicio de correo Brevo...');

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ Error: BREVO_API_KEY no está definida en el archivo .env');
    return;
  }

  // Cambia esto por tu correo personal para recibir la prueba
  const destinatario = process.env.BREVO_SENDER_EMAIL; 

  console.log(`📨 Enviando correo de prueba a: ${destinatario}`);

  try {
    await emailService.sendAlert(
      destinatario,
      'Prueba de Conexión',
      '¡Hola! Si estás leyendo esto, la integración de Brevo con tu Sistema de Riego funciona perfectamente. 🚀',
      'info'
    );
    console.log('✅ Correo enviado correctamente. Revisa tu bandeja de entrada (y spam por si acaso).');
  } catch (error) {
    console.error('❌ Error al enviar:', error);
  }
}

testEmail();
