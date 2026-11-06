package com.paytab.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class TransactionFilter {
    private int page = 0;
    private int size = 20;
    private String direction = "ALL"; // ALL | SENT | RECEIVED
    private Instant from;
    private Instant to;
}
