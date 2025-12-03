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

  /**
   * Envía un correo de recuperación de contraseña
   * @param {string} toEmail - Correo del destinatario
   * @param {string} resetToken - Token único para recuperación
   * @param {string} userName - Nombre del usuario
   */
  async sendPasswordReset(toEmail, resetToken, userName) {
    if (!process.env.BREVO_API_KEY) {
      logger.warn('⚠️ BREVO_API_KEY no configurada. No se envió el correo de recuperación.');
      return;
    }

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = '[Sistema Riego] Recuperación de Contraseña';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .header { background-color: #10B981; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background-color: #10B981; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 15px 0; color: #92400E; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;">🔒 Recuperación de Contraseña</h2>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Riego IoT.</p>
              <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #6B7280; font-size: 13px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.
              </div>
              <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
              </p>
            </div>
            <div class="footer">
              <p>Sistema de Riego Arduino IoT</p>
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
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
      logger.info(`📧 Correo de recuperación de contraseña enviado a ${toEmail}`);
    } catch (error) {
      logger.error('Error enviando correo de recuperación Brevo: %o', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
