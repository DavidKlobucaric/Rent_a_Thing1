package org.example.rentathingproba.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "thing_images")
@Getter
@Setter
@NoArgsConstructor
public class ThingImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thing_id", nullable = false)
    private Thing thing;

    @Column(nullable = false)
    private String url;

    @Column(name = "sort_order",  nullable = false)
    private int sortOrder;

    public  ThingImage(Thing thing, String url, int sortOrder) {
        this.thing = thing;
        this.url = url;
        this.sortOrder = sortOrder;
    }

}
