package com.vaultcore.controller;

import com.vaultcore.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "")
public class StockController {

    @Autowired
    private StockService stockService;

    @GetMapping("/{symbol}")
    public ResponseEntity<Map<String, Object>> getStockPrice(@PathVariable String symbol) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = stockService.getStockPrice(symbol);
        long endTime = System.currentTimeMillis();

        response.put("responseTime", endTime - startTime);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, BigDecimal>> getAllStocks() {
        return ResponseEntity.ok(stockService.getAllStocks());
    }
}