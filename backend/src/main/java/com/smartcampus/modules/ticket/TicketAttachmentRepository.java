package com.smartcampus.modules.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {

    List<TicketAttachment> findByTicketId(UUID ticketId);

    /** Used to enforce the max-3 rule. */
    long countByTicketId(UUID ticketId);
}
