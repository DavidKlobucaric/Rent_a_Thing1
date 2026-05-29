package org.example.rentathingproba.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ListingDTO {
    private Long thingId;
    private BigDecimal price;
    private BigDecimal securityDeposit;
    private String location;
    private Double latitude;
    private Double longitude;
}