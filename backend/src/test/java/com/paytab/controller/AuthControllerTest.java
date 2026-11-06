package com.paytab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paytab.dto.request.RegisterRequest;
import com.paytab.dto.response.AuthResponse;
import com.paytab.dto.response.UserSummary;
import com.paytab.exception.EmailAlreadyExistsException;
import com.paytab.exception.GlobalExceptionHandler;
import com.paytab.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.paytab.security.JwtAuthenticationFilter;
@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // bypass JwtAuthenticationFilter - not what this test is about
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AuthService authService;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @Test
    void registerReturns201WithTokenOnSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Aditi Sharma");
        request.setEmail("aditi@example.com");
        request.setPhoneNumber("9876543210");
        request.setPassword("StrongPass123!");

        AuthResponse response = AuthResponse.builder()
                .token("fake-jwt-token")
                .user(UserSummary.builder().id("user-1").fullName("Aditi Sharma").email("aditi@example.com").build())
                .build();
        when(authService.register(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("aditi@example.com"));
    }

    @Test
    void registerReturns400WhenFieldsAreMissing() throws Exception {
        RegisterRequest request = new RegisterRequest();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerReturns409WhenEmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Aditi Sharma");
        request.setEmail("aditi@example.com");
        request.setPhoneNumber("9876543210");
        request.setPassword("StrongPass123!");

        when(authService.register(any()))
                .thenThrow(new EmailAlreadyExistsException("Email is already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.messages[0]").value("Email is already registered"));
    }
}
