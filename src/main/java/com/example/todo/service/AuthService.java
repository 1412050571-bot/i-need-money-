package com.example.todo.service;

import com.example.todo.domain.User;
import com.example.todo.dto.*;
import com.example.todo.repository.UserRepository;
import com.example.todo.config.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final VerificationService verificationService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService, VerificationService verificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.verificationService = verificationService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String token = jwtService.generateToken(user.getEmail());
        return new LoginResponse(token, MeResponse.from(user));
    }

    @Transactional
    public MeResponse register(RegisterRequest request) {
        if (request.getCode() == null || request.getCode().isBlank() || !verificationService.verify(request.getEmail(), request.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码错误或已过期");
        }
        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "邮箱已存在");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getEmail().split("@")[0]);
        user.setAvatarUrl(null);
        userRepository.save(user);
        return MeResponse.from(user);
    }

    @Transactional
    public MeResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setDisplayName(req.getDisplayName());
        user.setAvatarUrl(req.getAvatarUrl());
        return MeResponse.from(user);
    }

    public MeResponse findMe(String email) {
        return userRepository.findByEmail(email).map(MeResponse::from).orElseThrow();
    }
}
