# Plantillas de correo electrónico bilingües (Supabase Auth)

Este archivo contiene las plantillas bilingües (Español / Inglés) recomendadas para configurar las notificaciones por correo de la aplicación en el panel de **Supabase** (**Authentication -> Email Templates**).

---

## 1. Confirmación de registro (Confirm sign-up)

* **Asunto (Subject)**:
  ```text
  Confirma tu correo / Confirm your email
  ```

* **Cuerpo del mensaje (Body)**:
  ```html
  <h2>Confirmación de registro / Confirm your email</h2>

  <p>Hola / Hello,</p>

  <p>Gracias por registrarte en la aplicación de acortador de URL de Pablo. Por favor, haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:</p>
  <p>Thank you for signing up for Pablo's URL shortener app. Please follow the link below to verify your email address:</p>

  <p style="margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Verificar correo / Confirm email
    </a>
  </p>

  <p>Si no has solicitado este registro, puedes ignorar este mensaje.</p>
  <p>If you didn't request this registration, you can safely ignore this email.</p>
  ```

---

## 2. Restablecimiento de contraseña (Reset password)

* **Asunto (Subject)**:
  ```text
  Restablece tu contraseña / Reset your password
  ```

* **Cuerpo del mensaje (Body)**:
  ```html
  <h2>Recuperación de contraseña / Password recovery</h2>

  <p>Hola / Hello,</p>

  <p>Hemos recibido una solicitud para cambiar tu contraseña en el acortador de URLs. Haz clic en el botón de abajo para elegir una nueva contraseña:</p>
  <p>We received a request to change your password for the URL shortener. Click the button below to choose a new password:</p>

  <p style="margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Restablecer contraseña / Reset password
    </a>
  </p>

  <p>Si no has solicitado este cambio, tu contraseña seguirá siendo la misma y puedes ignorar este mensaje.</p>
  <p>If you did not request this change, your password will remain the same and you can safely ignore this email.</p>
  ```
