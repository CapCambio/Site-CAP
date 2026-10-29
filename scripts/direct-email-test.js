// Script para testar o envio de e-mail diretamente
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configura caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Usa o host do .env ou o Gmail como fallback
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Aceita certificados autoassinados em desenvolvimento
  }
});

// Dados para o e-mail
const mailOptions = {
  from: process.env.EMAIL_FROM || 'no-reply@capcambio.com',
  to: 'mateus.m2o@live.com', // Seu e-mail de teste
  subject: '✅ Teste de Alerta de Variação - Dólar',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-top: 0;">Alerta de Variação - USD</h2>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>Olá, Cliente</p>
        <p>O Dólar Americano (USD) <strong>subiu 4.73%</strong> em relação ao último fechamento.</p>
        <p><strong>Preço atual:</strong> R$ 6,20</p>
        <p><strong>Variação:</strong> <span style="color: #10b981; font-weight: bold;">+4.73%</span></p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://capcambio.com.br/cotacoes" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Ver Cotações
        </a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>Este é um e-mail automático, por favor não responda.</p>
        <p>© 2025 CAP Câmbio - Todos os direitos reservados</p>
      </div>
    </div>
  `,
  text: `Alerta de Variação - USD

Olá, Cliente

O Dólar Americano (USD) subiu 4.73% em relação ao último fechamento.

Preço atual: R$ 6,20
Variação: +4.73%

Acesse: https://capcambio.com.br/cotacoes

---
Este é um e-mail automático, por favor não responda.
© 2025 CAP Câmbio - Todos os direitos reservados`
};

// Função para enviar o e-mail
async function sendTestEmail() {
  try {
    console.log('🚀 Iniciando teste de envio de e-mail...');
    
    // Verifica a conexão com o servidor SMTP
    console.log('🔌 Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão com o servidor SMTP estabelecida com sucesso!');
    
    // Envia o e-mail
    console.log('📤 Enviando e-mail de teste...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-mail enviado com sucesso!');
    console.log(`📤 ID da mensagem: ${info.messageId}`);
    console.log(`📥 URL de visualização: ${nodemailer.getTestMessageUrl(info) || 'Não disponível'}`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
  }
}

// Executa o teste
sendTestEmail();
