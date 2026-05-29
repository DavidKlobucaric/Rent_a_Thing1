package org.example.rentathingproba.mapper;

import org.example.rentathingproba.dto.ListingDTO;
import org.example.rentathingproba.entities.*;
import org.example.rentathingproba.responses.ListingResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class ListingMapper {
    public Listing toEntity(ListingDTO dto, User owner, Thing thing) {
        Listing listing = new Listing();
        listing.setThings(thing);
        listing.setUser(owner);
        listing.setPrice(dto.getPrice());
        listing.setSecurityDeposit(dto.getSecurityDeposit());
        listing.setLocation(dto.getLocation());
        listing.setIsAvailable(true);
        copyImagesFromThing(listing, thing);
        return listing;
    }

    public void updateEntity(Listing listing, ListingDTO dto) {
        listing.setPrice(dto.getPrice());
        listing.setSecurityDeposit(dto.getSecurityDeposit());
        listing.setLocation(dto.getLocation());
    }

    public ListingResponseDTO toResponse(Listing l) {
        List<String> urls = l.getImages().stream()
                .map(ListingImage::getUrl)
                .collect(Collectors.toList());

        return new ListingResponseDTO(
                l.getId(),
                l.getPrice(),
                l.getLocation(),
                l.getIsAvailable(),
                l.getCreatedAt(),
                l.getSecurityDeposit(),
                l.getThings().getId(),
                l.getThings().getName(),
                l.getThings().getCategory(),
                l.getThings().getDescription(),
                urls,
                l.getUser().getId(),
                l.getUser().getUsername()
        );
    }

    private void copyImagesFromThing(Listing listing, Thing thing) {
        List<String> urls = thing.getImages().stream()
                .map(ThingImage::getUrl)
                .collect(Collectors.toList());

        List<ListingImage> images = IntStream.range(0, urls.size())
                .mapToObj(i -> new ListingImage(listing, urls.get(i), i))
                .collect(Collectors.toList());

        listing.getImages().addAll(images);
    }
}
