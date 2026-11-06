package com.paytab.service;

import com.paytab.dto.request.TransactionFilter;
import com.paytab.dto.response.PagedResponse;
import com.paytab.dto.response.TransactionHistoryItem;
import com.paytab.entity.Transaction;
import com.paytab.entity.User;
import com.paytab.exception.TransactionNotFoundException;
import com.paytab.repository.TransactionRepository;
import com.paytab.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Uses Spring Data JPA's Specification API - the JPA equivalent of the
 * MongoTemplate Criteria-building approach from the MongoDB version. The
 * (sender OR receiver) + date range + direction query is beyond what a
 * derived repository method (findBySenderIdOrReceiverId...) can express
 * cleanly, which is exactly the trigger point for reaching for this API,
 * same reasoning as before, just JPA's version of the tool.
 */
@Service
@RequiredArgsConstructor
public class TransactionHistoryService {

    private static final int MAX_PAGE_SIZE = 100;

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public PagedResponse<TransactionHistoryItem> getHistory(String currentUserEmail, TransactionFilter filter) {
        User currentUser = userRepository.findByEmail(currentUserEmail).orElseThrow();
        UUID userId = currentUser.getId();

        int size = Math.min(Math.max(filter.getSize(), 1), MAX_PAGE_SIZE);
        int page = Math.max(filter.getPage(), 0);

        Specification<Transaction> spec = participantSpec(userId, filter.getDirection())
                .and(dateRangeSpec(filter.getFrom(), filter.getTo()));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> results = transactionRepository.findAll(spec, pageable);

        // Batch-resolve counterparty names via a small in-request cache to
        // avoid an N+1 query (one lookup per row) for repeat counterparties.
        Map<UUID, String> nameCache = new HashMap<>();
        Page<TransactionHistoryItem> mapped = results.map(txn -> toItem(txn, userId, nameCache));

        return PagedResponse.from(mapped);
    }

    public TransactionHistoryItem getById(String currentUserEmail, String transactionId) {
        User currentUser = userRepository.findByEmail(currentUserEmail).orElseThrow();
        UUID userId = currentUser.getId();

        UUID txnId = parseOrNotFound(transactionId);
        Transaction txn = transactionRepository.findById(txnId)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found"));

        // Same status/message for "doesn't exist" and "not yours" -
        // returning 403 here would confirm the ID exists to someone who
        // shouldn't be able to learn that.
        boolean isParticipant = txn.getSender().getId().equals(userId) || txn.getReceiver().getId().equals(userId);
        if (!isParticipant) {
            throw new TransactionNotFoundException("Transaction not found");
        }

        return toItem(txn, userId, new HashMap<>());
    }

    private UUID parseOrNotFound(String raw) {
        // A malformed path variable (not a valid UUID) is indistinguishable
        // from "this transaction doesn't exist" as far as the caller should
        // be able to tell - so it gets the same 404, not a 400 or 500 that
        // would leak internal ID format details.
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw new TransactionNotFoundException("Transaction not found");
        }
    }

    private Specification<Transaction> participantSpec(UUID userId, String direction) {
        return (root, query, cb) -> {
            if ("SENT".equalsIgnoreCase(direction)) {
                return cb.equal(root.get("sender").get("id"), userId);
            }
            if ("RECEIVED".equalsIgnoreCase(direction)) {
                return cb.equal(root.get("receiver").get("id"), userId);
            }
            return cb.or(
                    cb.equal(root.get("sender").get("id"), userId),
                    cb.equal(root.get("receiver").get("id"), userId)
            );
        };
    }

    private Specification<Transaction> dateRangeSpec(Instant from, Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private TransactionHistoryItem toItem(Transaction txn, UUID currentUserId, Map<UUID, String> nameCache) {
        boolean isSender = txn.getSender().getId().equals(currentUserId);
        UUID counterpartyId = isSender ? txn.getReceiver().getId() : txn.getSender().getId();

        String counterpartyName = nameCache.computeIfAbsent(counterpartyId, id ->
                userRepository.findById(id).map(User::getFullName).orElse("Unknown user")
        );

        return TransactionHistoryItem.builder()
                .transactionId(txn.getId().toString())
                .direction(isSender ? "SENT" : "RECEIVED")
                .counterpartyName(counterpartyName)
                .amount(txn.getAmount())
                .currency(txn.getCurrency())
                .note(txn.getNote())
                .timestamp(txn.getCreatedAt())
                .build();
    }
}
