package com.paytab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {
    private String transactionId;
    private BigDecimal amount;
    private String currency;
    private String recipientName;
    private BigDecimal newBalance;
    private Instant timestamp;
}
