package org.example.rentathingproba.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class ThingResponseDTO {
    private Long thingId;
    private String name;
    private String category;
    private String description;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private Long userId;
    private String ownerUsername;
}
