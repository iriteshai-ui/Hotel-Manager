package com.restaurant.controller;

import com.restaurant.model.RestaurantTable;
import com.restaurant.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(originPatterns = "*")
public class TableController {

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Map<String, Object>> getAllTables() {
        return tableRepository.findAll().stream()
            .sorted((a, b) -> Integer.compare(a.getNumber(), b.getNumber()))
            .map(RestaurantTable::toMap)
            .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> addTable(@RequestBody Map<String, Object> body) {
        int number = (int) body.get("number");
        if (tableRepository.existsByNumber(number)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Table " + number + " already exists"));
        }
        RestaurantTable table = new RestaurantTable(number);
        if (body.containsKey("capacity")) {
            table.setCapacity((int) body.get("capacity"));
        }
        RestaurantTable saved = tableRepository.save(table);
        messagingTemplate.convertAndSend("/topic/table_added", saved.toMap());
        return ResponseEntity.ok(saved.toMap());
    }

    @DeleteMapping("/{number}")
    public ResponseEntity<?> deleteTable(@PathVariable int number) {
        return tableRepository.findByNumber(number)
            .map(t -> {
                tableRepository.delete(t);
                messagingTemplate.convertAndSend("/topic/table_deleted", Map.of("id", "t" + number, "number", number));
                return ResponseEntity.ok(Map.of("message", "Table deleted"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{number}/free")
    public ResponseEntity<?> freeTable(@PathVariable int number) {
        return tableRepository.findByNumber(number)
            .map(t -> {
                t.setStatus("AVAILABLE");
                t.setCurrentOrderId(null);
                tableRepository.save(t);
                Map<String, Object> update = t.toMap();
                messagingTemplate.convertAndSend("/topic/table_updated", update);
                return ResponseEntity.ok(update);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
