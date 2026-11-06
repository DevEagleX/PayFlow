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
public class TransactionHistoryItem {
    private String transactionId;
    private String direction; // "SENT" | "RECEIVED"
    private String counterpartyName;
    private BigDecimal amount;
    private String currency;
    private String note;
    private Instant timestamp;
}
