package com.vaultcore.repository;

import com.vaultcore.model.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LedgerRepository extends JpaRepository<Ledger, Long> {

    List<Ledger> findByAccountRefOrderByCreatedAtDesc(String accountRef);

    List<Ledger> findByAccountRefAndCreatedAtBetweenOrderByCreatedAtAsc(
            String accountRef,
            LocalDateTime start,
            LocalDateTime end
    );
}
