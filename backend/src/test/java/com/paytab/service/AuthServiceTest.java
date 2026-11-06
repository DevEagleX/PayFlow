package com.paytab.service;

import com.paytab.dto.request.LoginRequest;
import com.paytab.dto.request.RegisterRequest;
import com.paytab.dto.response.AuthResponse;
import com.paytab.entity.User;
import com.paytab.exception.EmailAlreadyExistsException;
import com.paytab.exception.PhoneAlreadyExistsException;
import com.paytab.repository.UserRepository;
import com.paytab.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private WalletService walletService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Aditi Sharma");
        registerRequest.setEmail("aditi@example.com");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setPassword("StrongPass123!");
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail("aditi@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
        verify(walletService, never()).createWallet(any());
    }

    @Test
    void registerThrowsWhenPhoneAlreadyExists() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(PhoneAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void registerCreatesUserAndWalletAndReturnsToken() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByPhoneNumber(any())).thenReturn(false);
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("hashed-password");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Aditi Sharma")
                .email("aditi@example.com")
                .phoneNumber("9876543210")
                .passwordHash("hashed-password")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken("aditi@example.com")).thenReturn("fake-jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.getToken()).isEqualTo("fake-jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("aditi@example.com");
        // WalletService.createWallet now takes the saved User entity itself
        // (needed to set up the Wallet's FK association), not a raw ID string.
        verify(walletService).createWallet(savedUser);
    }

    @Test
    void loginThrowsGenericBadCredentialsOnAuthenticationFailure() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("aditi@example.com");
        loginRequest.setPassword("wrong-password");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new AuthenticationException("bad creds") {});

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void loginSucceedsAndReturnsToken() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("aditi@example.com");
        loginRequest.setPassword("StrongPass123!");

        User user = User.builder().id(UUID.randomUUID()).fullName("Aditi Sharma").email("aditi@example.com").build();
        when(userRepository.findByEmail("aditi@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("aditi@example.com")).thenReturn("fake-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getToken()).isEqualTo("fake-jwt-token");
        verify(authenticationManager).authenticate(any());
    }
}
