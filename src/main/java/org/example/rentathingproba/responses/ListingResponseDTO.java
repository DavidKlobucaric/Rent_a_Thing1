package org.example.rentathingproba.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor //so user hash doesnt get exposed
public class ListingResponseDTO {
    private Long listingId;
    private BigDecimal price;
    private String location;
    private boolean isAvailable;
    private LocalDateTime createdAt;
    private BigDecimal securityDeposit;

    private Long thingId;
    private String name;
    private String category;
    private String description;
    private List<String> imageUrls;

    private Long userId;
    private String userName;
}


