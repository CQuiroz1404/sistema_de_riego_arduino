const brevo = require('@getbrevo/brevo');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.apiInstance = new brevo.TransactionalEmailsApi();
    // Configurar autenticación
    // Nota: La API Key se toma de process.env.BREVO_API_KEY cuando se hace la llamada,
    // pero configuramos la instancia aquí.
    const apiKey = this.apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
  }

  /**
   * Envía una alerta por correo electrónico
   * @param {string} toEmail - Correo del destinatario
   * @param {string} subject - Asunto del correo
   * @param {string} message - Mensaje principal (HTML o texto)
   * @param {string} severity - Nivel de severidad (info, warning, critical)
   */
  async sendAlert(toEmail, subject, message, severity = 'info') {
    if (!process.env.BREVO_API_KEY) {
      logger.warn('⚠️ BREVO_API_KEY no configurada. No se envió el correo de alerta.');
      return;
    }

    const colors = {
      info: '#3B82F6',      // Azul
      warning: '#F59E0B',   // Naranja
      critical: '#EF4444'   // Rojo
    };

    const color = colors[severity] || colors.info;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `[Sistema Riego] ${subject}`;
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .header { background-color: ${color}; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .alert-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${color}; color: white; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;">⚠️ Alerta del Sistema</h2>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Se ha detectado el siguiente evento en tu sistema de riego:</p>
              <div style="background: white; padding: 15px; border-left: 4px solid ${color}; margin: 15px 0;">
                <strong>${message}</strong>
              </div>
              <p>Por favor, verifica el estado de tus dispositivos en el dashboard.</p>
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Ir al Dashboard</a>
            </div>
            <div class="footer">
              <p>Sistema de Riego Arduino IoT - Notificaciones Automáticas</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Configurar remitente (debe estar validado en Brevo)
    sendSmtpEmail.sender = { 
      "name": "Sistema Riego IoT", 
      "email": process.env.BREVO_SENDER_EMAIL || "alerta@tusistema.com" 
    };
    
    sendSmtpEmail.to = [{ "email": toEmail }];

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      logger.info(`📧 Correo de alerta enviado a ${toEmail} (Asunto: ${subject})`);
    } catch (error) {
      logger.error('Error enviando correo Brevo: %o', error);
    }
  }
}

module.exports = new EmailService();
