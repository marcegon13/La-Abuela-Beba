package email

import (
	"fmt"
	"net/smtp"
	"os"
)

// SendApprovalEmail sends an email to the approved user
func SendApprovalEmail(toEmail, userName string) error {
	// Credentials (In production these come from os.Getenv)
	// For this MVP, we will try to use env vars, or just log if not present.
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpHost == "" || smtpUser == "" {
		fmt.Printf("MOCK EMAIL SENT TO %s: Bienvenido Socio Fundador!\n", toEmail)
		return nil
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	subject := "¡Bienvenido, ya eres Socio Fundador!"

	// HTML Body
	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { background-color: #000; color: #fff; font-family: Arial, sans-serif; text-align: center; padding: 40px; }
			h1 { font-family: Arial, sans-serif; font-size: 48px; font-weight: normal; margin-bottom: 20px; color: #fff; }
			p { font-family: Calibri, sans-serif; font-size: 22px; font-style: italic; color: #ccc; margin-bottom: 30px; }
			.btn { 
				display: inline-block; 
				padding: 10px 30px; 
				border: 1px solid #fff; 
				color: #fff; 
				text-decoration: none; 
				text-transform: uppercase; 
				font-size: 14px; 
				letter-spacing: 1px;
				transition: background 0.3s;
			}
			.btn:hover { background: rgba(255,255,255,0.1); }
		</style>
	</head>
	<body>
		<h1>¡Bienvenido, ya eres Socio Fundador!</h1>
		<p>Hola %s, tu solicitud ha sido aprobada. Ya eres parte de La Beba.</p>
		<a href="http://localhost:5173/login" class="btn">INGRESAR AHORA</a>
	</body>
	</html>
	`, userName)

	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	addr := smtpHost + ":" + smtpPort
	if err := smtp.SendMail(addr, auth, smtpUser, []string{toEmail}, msg); err != nil {
		return err
	}

	return nil
}

// SendVerificationEmail sends the 6-digit OTP code
func SendVerificationEmail(toEmail, code string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpHost == "" || smtpUser == "" {
		fmt.Printf("MOCK VERIFICATION EMAIL SENT TO %s: Code %s\n", toEmail, code)
		return nil
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	subject := "Código de Verificación - La Beba"

	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { background-color: #000; color: #fff; font-family: Arial, sans-serif; text-align: center; padding: 40px; }
			h1 { font-family: Arial, sans-serif; font-size: 36px; font-weight: normal; margin-bottom: 20px; color: #fff; }
			p { font-family: Calibri, sans-serif; font-size: 18px; color: #ccc; margin-bottom: 30px; }
			.code { 
				font-size: 48px; 
				font-weight: bold; 
				letter-spacing: 10px; 
				color: #10b981; 
				margin: 20px 0;
			}
		</style>
	</head>
	<body>
		<h1>Verifica tu email</h1>
		<p>Usa el siguiente código para completar tu registro:</p>
		<div class="code">%s</div>
	</body>
	</html>
	`, code)

	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	addr := smtpHost + ":" + smtpPort
	if err := smtp.SendMail(addr, auth, smtpUser, []string{toEmail}, msg); err != nil {
		return err
	}
	return nil
}

// SendVoucherEmail sends the final booking confirmation with details
func SendVoucherEmail(toEmail, userName, bookingCode, roomType, checkIn, checkOut string, totalBeds int, totalAmount string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpHost == "" || smtpUser == "" {
		fmt.Printf("MOCK VOUCHER EMAIL SENT TO %s: Booking %s confirmed\n", toEmail, bookingCode)
		return nil
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	subject := "¡Reserva Confirmada! - La Abuela Beba"

	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { background-color: #000; color: #fff; font-family: Arial, sans-serif; padding: 40px; }
			.container { max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 20px; overflow: hidden; background: #0a0a0a; }
			.header { background: #10b981; padding: 40px; text-align: center; }
			.content { padding: 40px; }
			h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
			.details { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
			.detail-row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px solid #333; padding-bottom: 5px; }
			.label { color: #888; font-size: 12px; text-transform: uppercase; }
			.value { color: #fff; font-weight: bold; }
			.code { font-size: 32px; color: #10b981; text-align: center; margin: 20px 0; font-family: monospace; border: 2px dashed #10b981; padding: 10px; border-radius: 10px; }
			.footer { padding: 20px; text-align: center; color: #555; font-size: 12px; }
			.btn { display: block; background: #10b981; color: #000; text-align: center; padding: 15px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>Reserva Confirmada</h1>
			</div>
			<div class="content">
				<p>Hola <strong>%s</strong>,</p>
				<p>¡Tu estadía en La Abuela Beba está confirmada! Aquí tenés los detalles de tu voucher:</p>
				
				<div class="code">%s</div>

				<div class="details">
					<div class="detail-row">
						<span class="label">Habitación</span>
						<span class="value">%s</span>
					</div>
					<div class="detail-row">
						<span class="label">Plazas</span>
						<span class="value">%d</span>
					</div>
					<div class="detail-row">
						<span class="label">Check-in</span>
						<span class="value">%s</span>
					</div>
					<div class="detail-row">
						<span class="label">Check-out</span>
						<span class="value">%s</span>
					</div>
					<div class="detail-row">
						<span class="label">Total Abonado</span>
						<span class="value">$%s ARS</span>
					</div>
				</div>

				<p>Ubicación: Calle 0 e/ 815 y 817, Chapadmalal.</p>
				<a href="https://laabuelabeba.cloud/login" class="btn">GESTIONAR MI ESTADÍA</a>
			</div>
			<div class="footer">
				<p>La Abuela Beba - Sistema de Turismo Regenerativo</p>
			</div>
		</div>
	</body>
	</html>
	`, userName, bookingCode, roomType, totalBeds, checkIn, checkOut, totalAmount)

	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	addr := smtpHost + ":" + smtpPort
	return smtp.SendMail(addr, auth, smtpUser, []string{toEmail}, msg)
}

// SendAdminNotificationEmail sends an alert to the hostel email when a new booking is created
func SendAdminNotificationEmail(subject, body string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	toEmail := "info@laabuelabeba.cloud"

	if smtpHost == "" || smtpUser == "" {
		fmt.Printf("MOCK ADMIN EMAIL SENT TO %s\n", toEmail)
		return nil
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)

	addr := smtpHost + ":" + smtpPort
	return smtp.SendMail(addr, auth, smtpUser, []string{toEmail}, msg)
}
