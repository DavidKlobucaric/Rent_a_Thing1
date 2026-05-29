package org.example.rentathingproba.mapper;

import org.example.rentathingproba.dto.ThingDTO;
import org.example.rentathingproba.entities.Thing;
import org.example.rentathingproba.entities.ThingImage;
import org.example.rentathingproba.entities.User;
import org.example.rentathingproba.responses.ThingResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class ThingMapper {
    public Thing toEntity(ThingDTO dto, User owner) {
        Thing thing = new Thing();
        thing.setUser(owner);
        thing.setName(dto.getName());
        thing.setCategory(dto.getCategory());
        thing.setDescription(dto.getDescription());
        setImages(thing, dto.getImageUrls());
        return thing;
    }

    public void updateEntity(Thing thing, ThingDTO dto) {
        thing.setName(dto.getName());
        thing.setCategory(dto.getCategory());
        thing.setDescription(dto.getDescription());
        if (dto.getImageUrls() != null) {
            thing.getImages().clear();
            setImages(thing, dto.getImageUrls());
        }
    }

    public ThingResponseDTO toResponse(Thing t) {
        List<String> urls = t.getImages().stream()
                .map(ThingImage::getUrl)
                .collect(Collectors.toList());

        return new ThingResponseDTO(
                t.getId(),
                t.getName(),
                t.getCategory(),
                t.getDescription(),
                urls,
                t.getCreatedAt(),
                t.getUser().getId(),
                t.getUser().getUsername()
        );
    }

    private void setImages(Thing thing, List<String> urls) {
        if (urls == null || urls.isEmpty()) return;
        List<ThingImage> images = IntStream.range(0, urls.size())
                .mapToObj(i -> new ThingImage(thing, urls.get(i), i))
                .collect(Collectors.toList());
        thing.getImages().addAll(images);
    }
}
