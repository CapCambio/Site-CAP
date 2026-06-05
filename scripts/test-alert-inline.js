const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configura o transporte de e-mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Dados para o template
const currencyCode = 'USD';
const sellPrice = 5.35;
const variacao = 1.25;
const variacaoFormatada = '1.25';
const isUp = variacao > 0;
const variationText = isUp ? 'subiu' : 'caiu';
const variationAbs = Math.abs(variacao).toFixed(2);

// Gera o HTML do e-mail
const emailHtml = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerta de Cotações</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Cabeçalho -->
          <div style="width: 100%; background: #000000; position: relative; overflow: hidden;">
              <div style="height: 6px; background: linear-gradient(90deg, #f6d365 0%, #fda085 100%);"></div>
              <div style="padding: 15px 20px 10px; text-align: center; position: relative; z-index: 2;">
                  <div style="margin: 0 auto 5px;">
                      <img src="https://i.ibb.co/7JQ9vQTt/Cap-logo-removebg-preview.png" alt="CAP Câmbio" style="width: 200px; height: auto; display: block; margin: 0 auto;">
                  </div>
                  <h1 style="color: #fff; font-size: 1.7rem; font-weight: 700; margin: 0 0 15px 0; line-height: 1.1; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                      Alerta de <span style="color: #f6d365;">Cotações</span>
                  </h1>
              </div>
              <div style="height: 6px; background: linear-gradient(90deg, #f6d365 0%, #fda085 100%);"></div>
          </div>
          
          <!-- Conteúdo Principal -->
          <div style="padding: 20px; color: #333; font-size: 16px; line-height: 1.6;">
              <p>Olá Usuário de Teste!</p>
              
              <p style="margin: 0 0 20px 0;">
                  A moeda que você acompanha teve alteração de valor!<br>
                  Confira seu painel de cotações para mais detalhes.
              </p>
              
              <div style="background: #fff9e6; border-left: 4px solid #fcab23; padding: 15px; margin: 0 0 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #000; font-size: 18px;">
                      ${isUp ? '📈' : '📉'} ${currencyCode} - Dólar Americano
                      <span style="color: #666; font-size: 0.9em; font-weight: normal;">
                          (${variationText} ${variationAbs}%)
                      </span>
                  </h3>
                  <p style="margin: 0;"><strong>Valor atual:</strong> R$ ${sellPrice.toFixed(2).replace('.', ',')}</p>
              </div>
              
              <p>Atenciosamente,<br><strong>CAP Câmbio</strong></p>
          </div>
          
          <!-- Rodapé -->
          <div style="padding: 15px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; margin-top: 20px;">
              <p style="margin: 0 0 10px 0;">Este é um e-mail automático, por favor não responda.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} CAP Câmbio. Todos os direitos reservados.</p>
          </div>
      </div>
  </body>
  </html>
`;

// Configura as opções do e-mail
const mailOptions = {
  from: `"CAP Câmbio" <${process.env.EMAIL_FROM || 'no-reply@capcambio.com'}>`,
  to: process.env.EMAIL_USER,
  subject: 'Alerta de Cotações - Atualização',
  html: emailHtml,
  text: `Alerta de cotação para ${currencyCode}:

${currencyCode} ${variationText} ${variationAbs}%
Valor atual: R$ ${sellPrice.toFixed(2)}

Acesse ${process.env.APP_URL || 'https://capcambio.com.br'} para mais detalhes.`,
  // Headers para melhorar a entrega
  headers: {
    'X-Priority': '1', // Prioridade alta
    'X-MSMail-Priority': 'High',
    'Importance': 'high'
  }
};

// Função para enviar o e-mail
async function sendTestEmail() {
  try {
    console.log('🔍 Iniciando teste de envio de e-mail...');
    console.log(`📧 De: ${mailOptions.from}`);
    console.log(`📨 Para: ${mailOptions.to}`);
    console.log(`📝 Assunto: ${mailOptions.subject}`);
    
    // Envia o e-mail
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-mail enviado com sucesso!');
    console.log(`📤 ID da mensagem: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de teste:', error);
    return false;
  }
}

// Executa o teste
sendTestEmail()
  .then(success => {
    if (success) {
      console.log('🎉 Teste concluído com sucesso! Verifique sua caixa de entrada.');
    } else {
      console.error('❌ Falha ao enviar o e-mail de teste.');
    }
  })
  .catch(error => {
    console.error('❌ Erro inesperado:', error);
  });
