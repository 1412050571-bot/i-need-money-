package com.example.todo.controller;

import com.example.todo.dto.LoginRequest;
import com.example.todo.dto.LoginResponse;
import com.example.todo.dto.MeResponse;
import com.example.todo.dto.UpdateProfileRequest;
import com.example.todo.dto.RegisterRequest;
import com.example.todo.service.AuthService;
import com.example.todo.service.VerificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final VerificationService verificationService;

    public AuthController(AuthService authService, VerificationService verificationService) {
        this.authService = authService;
        this.verificationService = verificationService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<MeResponse> register(@RequestBody @Valid RegisterRequest request) {
        MeResponse me = authService.register(request);
        return ResponseEntity.ok(me);
    }

    @PostMapping("/send-code")
    public ResponseEntity<Void> sendCode(@RequestParam("email") String email) {
        verificationService.sendCode(email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal(expression = "username") String email) {
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.findMe(email));
    }

    @PutMapping("/me")
    public ResponseEntity<MeResponse> updateProfile(@AuthenticationPrincipal(expression = "username") String email,
                                                    @RequestBody @Valid UpdateProfileRequest req) {
        if (email == null) {
          return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.updateProfile(email, req));
    }
}
