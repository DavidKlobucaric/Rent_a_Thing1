package org.example.rentathingproba.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ThingDTO {
    private String name;
    private String category;
    private String description;
    private List<String> imageUrls;
}
