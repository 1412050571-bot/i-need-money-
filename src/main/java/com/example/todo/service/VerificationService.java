package com.example.todo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class VerificationService {
    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);
    private final JavaMailSender mailSender;
    private final String from;
    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public VerificationService(JavaMailSender mailSender, @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendCode(String email) {
        String code = generateCode();
        store.put(email, new Entry(code, Instant.now().plusSeconds(600))); // 10 min
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            if (from != null && !from.isBlank()) {
                msg.setFrom(from);
            }
            msg.setSubject("TODO 清单邮箱验证码");
            msg.setText("您的验证码是：" + code + " ，10分钟内有效。");
            mailSender.send(msg);
            log.info("验证码已发送到邮箱 {} (code={})", email, code);
        } catch (Exception e) {
            log.warn("发送邮箱验证码失败（可能未配置 SMTP），验证码={}，错误：{}", code, e.getMessage());
        }
    }

    public boolean verify(String email, String code) {
        Entry entry = store.get(email);
        if (entry == null) return false;
        if (entry.expiry.isBefore(Instant.now())) {
            store.remove(email);
            return false;
        }
        boolean ok = entry.code.equalsIgnoreCase(code.trim());
        if (ok) store.remove(email);
        return ok;
    }

    private String generateCode() {
        int num = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(num);
    }

    private record Entry(String code, Instant expiry) {}
}
