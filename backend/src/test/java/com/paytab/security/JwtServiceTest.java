package com.paytab.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String TEST_SECRET = "test-secret-key-must-be-at-least-32-bytes-long";

    @Test
    void generatesTokenThatRoundTripsToTheSameEmail() {
        JwtService jwtService = new JwtService(TEST_SECRET, 60_000);

        String token = jwtService.generateToken("user@example.com");
        String extractedEmail = jwtService.extractEmail(token);

        assertThat(extractedEmail).isEqualTo("user@example.com");
    }

    @Test
    void validTokenPassesValidationForMatchingEmail() {
        JwtService jwtService = new JwtService(TEST_SECRET, 60_000);
        String token = jwtService.generateToken("user@example.com");

        assertThat(jwtService.isTokenValid(token, "user@example.com")).isTrue();
    }

    @Test
    void tokenFailsValidationForADifferentEmail() {
        JwtService jwtService = new JwtService(TEST_SECRET, 60_000);
        String token = jwtService.generateToken("user@example.com");

        assertThat(jwtService.isTokenValid(token, "someone-else@example.com")).isFalse();
    }

    @Test
    void expiredTokenFailsValidation() throws InterruptedException {
        JwtService jwtService = new JwtService(TEST_SECRET, 1);
        String token = jwtService.generateToken("user@example.com");

        Thread.sleep(15);

        assertThat(jwtService.isTokenValid(token, "user@example.com")).isFalse();
    }
}
