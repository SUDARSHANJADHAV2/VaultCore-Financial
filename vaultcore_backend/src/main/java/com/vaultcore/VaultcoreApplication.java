package com.vaultcore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VaultcoreApplication {
	public static void main(String[] args) {
		SpringApplication.run(VaultcoreApplication.class, args);
		System.out.println("========================================");
		System.out.println("VaultCore Financial Backend Started!");
		System.out.println("Java Version: " + System.getProperty("java.version"));
		System.out.println("Access the application at: http://localhost:8081/api");
		System.out.println("========================================");
	}
}