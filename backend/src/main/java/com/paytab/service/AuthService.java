package com.paytab.service;

import com.paytab.dto.request.LoginRequest;
import com.paytab.dto.request.RegisterRequest;
import com.paytab.dto.response.AuthResponse;
import com.paytab.entity.User;
import com.paytab.exception.EmailAlreadyExistsException;
import com.paytab.exception.PhoneAlreadyExistsException;
import com.paytab.mapper.UserMapper;
import com.paytab.repository.UserRepository;
import com.paytab.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final WalletService walletService;

    // Note: this @Transactional annotation is completely unchanged from the
    // MongoDB version of this project - Spring's transaction abstraction is
    // exactly what let this service's code stay database-agnostic. Spring
    // Boot auto-configures a JpaTransactionManager for a JPA/Postgres
    // datasource the same way it auto-configured a MongoTransactionManager
    // for Mongo; the business logic never needed to know which one it's using.
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already registered");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new PhoneAlreadyExistsException("Phone number is already registered");
        }

        Instant now = Instant.now();
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        User saved = userRepository.save(user);
        walletService.createWallet(saved);

        String token = jwtService.generateToken(saved.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(UserMapper.toSummary(saved))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(UserMapper.toSummary(user))
                .build();
    }
}
