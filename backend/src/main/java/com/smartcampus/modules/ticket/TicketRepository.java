package com.smartcampus.modules.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByReportedBy(UUID userId);

    List<Ticket> findByAssignedTo(UUID technicianId);

    List<Ticket> findByStatus(String status);

    /**
     * Flexible filter query — any param can be null (means "no filter on that field").
     */
    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:category IS NULL OR t.category = :category) " +
           "ORDER BY t.createdAt DESC")
    List<Ticket> findWithFilters(@Param("status")   String status,
                                 @Param("priority") String priority,
                                 @Param("category") String category);
}
