package com.paytab.repository;

import com.paytab.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByUser_Id(UUID userId);


    @Modifying
    @Query("UPDATE Wallet w SET w.balance = w.balance - :amount, w.updatedAt = :now " +
           "WHERE w.user.id = :userId AND w.balance >= :amount")
    int debit(@Param("userId") UUID userId, @Param("amount") BigDecimal amount, @Param("now") Instant now);


    @Modifying
    @Query("UPDATE Wallet w SET w.balance = w.balance + :amount, w.updatedAt = :now " +
           "WHERE w.user.id = :userId")
    int credit(@Param("userId") UUID userId, @Param("amount") BigDecimal amount, @Param("now") Instant now);
}
