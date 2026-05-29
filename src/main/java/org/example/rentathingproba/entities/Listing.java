package org.example.rentathingproba.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "things_id", nullable = false)
    private Thing things;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "daily_rent_price", nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String location;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "security_deposit", nullable = true)
    private BigDecimal securityDeposit;

    @OneToMany(
            mappedBy = "listing",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("sortOrder ASC")
    private List<ListingImage> images = new ArrayList<>();

    @PrePersist
    protected void  onCreate()
    {
        this.createdAt = LocalDateTime.now();
    }
}
