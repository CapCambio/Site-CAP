import { Router } from "express";

import authorizedEmailsConfig from './config/authorized-emails.json';

const AUTHORIZED_EMAILS = authorizedEmailsConfig.authorizedEmails;
const ADMIN_EMAILS = authorizedEmailsConfig.adminEmails;

const router = Router();

// Rota para verificar se um email é de admin
router.post("/check-admin", (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email não fornecido" });
  }
  
  const isAdmin = ADMIN_EMAILS.includes(email);
  
  return res.json({ isAdmin });
});

// Rota para autenticar um usuário
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email não fornecido" });
  }
  
  // Verifica se o email está autorizado
  const isAuthorized = AUTHORIZED_EMAILS.includes(email);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Email não autorizado" });
  }
  
  // Verifica se é um admin e se a senha está correta
  const isAdmin = ADMIN_EMAILS.includes(email);
  if (isAdmin && password !== "admin123") {
    return res.status(401).json({ error: "Senha incorreta" });
  }
  
  // Login bem-sucedido
  return res.json({
    email,
    isAdmin
  });
});

export default router;