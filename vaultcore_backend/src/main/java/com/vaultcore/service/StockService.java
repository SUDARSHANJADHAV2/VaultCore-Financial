package com.vaultcore.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class StockService {

    private Map<String, BigDecimal> stockPrices = new HashMap<>();
    private Random random = new Random();

    public StockService() {
        // Initialize with some mock stocks
        stockPrices.put("AAPL", BigDecimal.valueOf(175.50));
        stockPrices.put("GOOGL", BigDecimal.valueOf(140.25));
        stockPrices.put("MSFT", BigDecimal.valueOf(380.75));
        stockPrices.put("AMZN", BigDecimal.valueOf(145.30));
    }

    public Map<String, Object> getStockPrice(String symbol) {
        // Simulate API call delay
        try {
            Thread.sleep(100); // 100ms delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Random price fluctuation
        BigDecimal currentPrice = stockPrices.getOrDefault(symbol, BigDecimal.valueOf(100.00));
        BigDecimal fluctuation = BigDecimal.valueOf(random.nextDouble() * 5 - 2.5);
        BigDecimal newPrice = currentPrice.add(fluctuation).max(BigDecimal.ONE);

        stockPrices.put(symbol, newPrice);

        Map<String, Object> response = new HashMap<>();
        response.put("symbol", symbol);
        response.put("price", newPrice);
        response.put("change", fluctuation);
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }

    public Map<String, BigDecimal> getAllStocks() {
        return stockPrices;
    }
}